import User from '../models/user.schema'
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { genericResponse, createToken, generateOTP, sendEmail, saveOTPToDB } from '../utils/helper';
import OTPModel from '../models/otp.schema';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import fs from 'fs';
import { asyncHandler, AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const phoneRegex = /^[0-9+\-]{9,14}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    maxAge: 60 * 60 * 3000,
};

const safeUnlink = (p?: string) => {
    if (!p) return;
    try { fs.unlinkSync(p); } catch (_) { /* ignore */ }
};


const signUp = asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password, phone } = req.body;

    if (!username || !email || !password || !phone) {
        throw new AppError(400, 'Please provide all the required fields', 'One of the fields (or more) is missing');
    }
    if (!phoneRegex.test(phone)) {
        throw new AppError(400, 'Invalid phone number');
    }
    if (!emailRegex.test(email)) {
        throw new AppError(400, 'Invalid email address');
    }
    if (!passwordRegex.test(password)) {
        throw new AppError(400, 'Invalid password');
    }

    const isUser = await User.findOne({ email });
    if (isUser) {
        throw new AppError(400, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, phone });
    await user.validate();
    await user.save();
    user.password = '*****';

    res.status(200).json(genericResponse(true, 'User created successfully', null, null, user));
});


const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { username, email, phone, profileIcon } = req.body;
    const authUserId = req.user?.id;

    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }
    if (!username || !email || !phone) {
        throw new AppError(400, 'Please provide all the required fields', 'One of the fields (or more) is missing');
    }
    if (!phoneRegex.test(phone)) {
        throw new AppError(400, 'Invalid phone number');
    }
    if (!emailRegex.test(email)) {
        throw new AppError(400, 'Invalid email address');
    }

    const duplicate = await User.findOne({
        _id: { $ne: authUserId },
        $or: [{ email }, { username }, { phone }],
    });
    if (duplicate) {
        let displayMessage = 'User with those details already exists';
        if (duplicate.email === email) displayMessage = 'Email is already taken';
        else if (duplicate.username === username) displayMessage = 'Username is already taken';
        else if (duplicate.phone === phone) displayMessage = 'Phone number is already taken';
        throw new AppError(409, displayMessage);
    }

    const update: Record<string, unknown> = { username, email, phone };
    if (typeof profileIcon === 'string') {
        update.profileIcon = profileIcon;
    }

    const user = await User.findByIdAndUpdate(authUserId, update, { new: true }).select('-password');
    if (!user) {
        throw new AppError(404, 'User not found');
    }

    res.status(200).json(genericResponse(true, 'User updated successfully', null, null, user));
});


const profileIconsDir = path.join(__dirname, '..', 'uploads', 'profile');
try {
    fs.mkdirSync(profileIconsDir, { recursive: true });
} catch (err) {
    logger.error({ err, dir: profileIconsDir }, 'Failed to ensure profile uploads directory');
}

const uploadProfileIcon = asyncHandler(async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;

    try {
        const authUserId = req.user?.id;
        if (!authUserId) {
            throw new AppError(401, 'Authentication failed', 'No authenticated user');
        }
        if (!file) {
            throw new AppError(400, 'No image uploaded', 'profileIcon field is missing');
        }

        const user = await User.findById(authUserId);
        if (!user) {
            throw new AppError(404, 'User not found');
        }

        const previousIcon = user.profileIcon;
        const mediaUrl = `/uploads/profile/${file.filename}`;
        user.profileIcon = mediaUrl;
        await user.save();

        if (previousIcon && previousIcon.startsWith('/uploads/profile/')) {
            const previousPath = path.join(__dirname, '..', previousIcon.replace(/^\//, ''));
            fs.unlink(previousPath, () => { /* ignore missing file */ });
        }

        const safeUser = user.toObject();
        if (safeUser.password) {
            safeUser.password = '*****';
        }
        res.status(200).json(genericResponse(true, 'Profile picture updated', null, null, safeUser));
    } catch (err) {
        safeUnlink(file?.path);
        throw err;
    }
});


const USERS_DEFAULT_LIMIT = 20;
const USERS_MAX_LIMIT = 100;

const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page: pageRaw, limit: limitRaw } = req.query as {
        page?: string;
        limit?: string;
    };

    const parsedPage = parseInt(String(pageRaw ?? ''), 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const parsedLimit = parseInt(String(limitRaw ?? ''), 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, USERS_MAX_LIMIT)
        : USERS_DEFAULT_LIMIT;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        User.find()
            .select('-password')
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit),
        User.estimatedDocumentCount(),
    ]);

    const hasMore = skip + items.length < total;

    res.status(200).json(
        genericResponse(true, 'Users retrieved successfully', null, null, {
            items,
            total,
            page,
            limit,
            hasMore,
        }),
    );
});


const searchUser = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.query;

    if (!username) {
        throw new AppError(400, 'Please provide a username', 'Username field is missing');
    }

    const users = await User.find({ username: { $regex: username, $options: 'i' } });
    if (users.length === 0) {
        throw new AppError(404, 'Users not found');
    }
    users.forEach(user => (user.password = '*****'));

    res.status(200).json(genericResponse(true, 'Users found successfully', null, null, users));
});


const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { _id } = req.body;
    if (!_id) {
        throw new AppError(400, 'Please provide a user ID', 'User ID field is missing');
    }

    const user = await User.findByIdAndDelete(_id);
    if (!user) {
        throw new AppError(404, 'User not found');
    }

    res.status(200).json(genericResponse(true, 'User deleted', null, null, user));
});


const deleteSelfAccount = asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.body;
    const userId = req.user?.id;

    if (!password) {
        throw new AppError(400, 'Please provide your password', 'Password field is missing');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(404, 'User not found');
    }
    if (!user.password) {
        throw new AppError(400, 'Cannot verify password for a Google-only account');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new AppError(401, 'Invalid credentials');
    }

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
        throw new AppError(404, 'Failed to delete account');
    }

    res.status(200).json(genericResponse(true, 'Account deleted successfully', null, null, null));
});


const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { password, newPassword } = req.body;
    const userId = req.user?.id;

    if (!password || !newPassword) {
        throw new AppError(400, 'Please provide all the required fields', 'One of the fields (or more) is missing');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(404, 'User not found');
    }
    if (!user.password) {
        throw new AppError(400, 'Cannot change password for a Google-only account');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new AppError(401, 'Invalid credentials');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    user.password = '*****';
    res.status(200).json(genericResponse(true, 'Password changed successfully', null, null, user));
});


const login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        throw new AppError(400, 'Please provide all the required fields', 'One of the fields (or more) is missing');
    }

    const user = await User.findOne({ username });
    if (!user) {
        throw new AppError(404, 'User not found');
    }
    if (!user.password) {
        throw new AppError(401, 'Please login with Google', 'Account has no password set');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new AppError(401, 'Invalid credentials');
    }

    const token = createToken(user);
    res.cookie('token', token, cookieOptions);
    user.password = '*****';

    res.status(200).json(genericResponse(true, 'Logged in successfully', null, null, user));
});


const logout = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? ('none' as const) : ('lax' as const),
    });
    res.status(200).json(genericResponse(true, 'Logged out successfully', null, null, null));
});


const getUserDetails = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError(404, 'User not found');
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw new AppError(404, 'User not found');
    }

    res.status(200).json(genericResponse(true, 'User details retrieved successfully', null, null, user));
});


const otpService = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        throw new AppError(400, 'Please provide your email', 'Email field is missing');
    }

    const user = await User.findOne({ email });
    if (user) {
        const otp = generateOTP();
        await sendEmail(email, otp);
        await saveOTPToDB(email, otp);
    }

    res.status(200).json(genericResponse(true, 'If the email exists, a code was sent', null, null, null));
});


const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        throw new AppError(400, 'Please provide your email and OTP', 'Email or OTP field is missing');
    }

    const otpRecord = await OTPModel.findOne({ email, otp });
    if (!otpRecord) {
        throw new AppError(401, 'Invalid OTP');
    }
    if (Date.now() > otpRecord.expirationDate.getTime()) {
        await OTPModel.deleteOne({ email, otp });
        throw new AppError(401, 'OTP expired');
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError(404, 'User not found');
    }

    const token = createToken(user);
    res.cookie('token', token, cookieOptions);

    user.password = '*****';
    await OTPModel.deleteOne({ email, otp });

    res.status(200).json(genericResponse(true, 'OTP verified', null, null, user));
});


const googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { credential } = req.body;
    if (!credential) {
        throw new AppError(400, 'Missing Google credential', 'credential field is missing');
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
        throw new AppError(500, 'Google login is not configured', 'GOOGLE_CLIENT_ID env var is missing');
    }

    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch (err) {
        throw new AppError(401, 'Failed to verify Google token', err instanceof Error ? err.message : null);
    }

    if (!payload || !payload.email || !payload.sub) {
        throw new AppError(401, 'Invalid Google token', 'Token payload is missing required fields');
    }
    if (payload.email_verified === false) {
        throw new AppError(401, 'Google email is not verified');
    }

    const email = payload.email;
    const googleId = payload.sub;
    const picture = payload.picture || '';
    const name = payload.name || email.split('@')[0];

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
        let baseUsername = (name || email.split('@')[0]).replace(/\s+/g, '').slice(0, 20) || 'user';
        let username = baseUsername;
        let counter = 0;
        while (await User.findOne({ username })) {
            counter += 1;
            username = `${baseUsername}${counter}`;
        }
        user = new User({
            username,
            email,
            googleId,
            profileIcon: picture,
        });
        await user.save();
    } else if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.profileIcon) {
            user.profileIcon = picture;
        }
        await user.save();
    }

    const token = createToken(user);
    res.cookie('token', token, cookieOptions);

    const safeUser = user.toObject();
    if (safeUser.password) {
        safeUser.password = '*****';
    }

    res.status(200).json(genericResponse(true, 'Logged in successfully with Google', null, null, safeUser));
});

export { signUp, updateUser, uploadProfileIcon, getAllUsers, searchUser, deleteUser, login, deleteSelfAccount, changePassword, logout, getUserDetails, otpService, verifyOTP, googleLogin };
