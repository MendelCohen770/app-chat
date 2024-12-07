import User from '../models/user.schema'
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { genericResponse, createToken, generateOTP, sendEmail, saveOTPToDB } from '../utils/helper';
import { error, log } from 'console';
import OTPModel from '../models/otp.schema';


const singUp = async (req : Request, res : Response) => {
    const {username, email, password, phone} = req.body;

    if(!username || !email || !password || !phone){
        const response = genericResponse(false, 'Please provide all the required fields', null, 'One of the fields (or more) is missing', null);
        res.status(400).json(response);
        return;
    }

    const phoneRegex = /^[0-9+\-]{9,14}$/;
    if(!phoneRegex.test(phone)){
        const response = genericResponse(false, 'Invalid phone number', null, null, null);
        res.status(400).json(response);
        return;
    }

    const emailRegex =/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(email)){
        const response = genericResponse(false, 'Invalid email address', null, null, null);
        res.status(400).json(response);
        return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if(!passwordRegex.test(password)){
        const response = genericResponse(false, 'Invalid password', null, null, null);
        res.status(400).json(response);
        return;
    }
    try{
        const isUser = await User.findOne({email});
        if(isUser){
            const response = genericResponse(false, 'User already exists', null, null, null);
            res.status(400).json(response);
            return;
        }
        let newPassword: string = await bcrypt.hash(password, 10);
        let user = new User({username, email, password: newPassword, phone});
        await user.save();
        user.password = '*****';
        const response = genericResponse(true, 'User created successfully', null, null, user);
        res.status(200).json(response);
    }catch(err){
        const response = genericResponse(false, 'Error creating user', null, err instanceof Error ? err.message : 'Unknown error', null);
        res.status(500).json(response);
    }
}

const updateUser = async (req : Request, res : Response) => {
    const {username, email, phone, _id} = req.body;

    if(!username || !email || !phone){
        const response = genericResponse(false, 'Please provide all the required fields', null, 'One of the fields (or more) is missing', null);
        res.status(400).json(response);
        return;
    }
    const phoneRegex = /^[0-9+\-]{9,14}$/;
    if(!phoneRegex.test(phone)){
        const response = genericResponse(false, 'Invalid phone number', null, null, null);
        res.status(400).json(response);
        return;
    }

    const emailRegex =/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(email)){
        const response = genericResponse(false, 'Invalid email address', null, null, null);
        res.status(400).json(response);
        return;
    }
    try{
        const user = await User.findByIdAndUpdate(_id, {username, email, phone}, {new: true});
        if(!user){
            const response = genericResponse(false, 'User not found', null, null, null);
            res.status(404).json(response);
            return;
        }
        user.password = '*****';
        const response = genericResponse(true, 'User updated successfully', null, null, user);
        res.status(200).json(response);
    }catch(err){
        const response = genericResponse(false, 'Error updating user', null, err instanceof Error? err.message : 'Unknown error', null);
        res.status(500).json(response);
    }
    
}

const searchUser = async (req : Request, res : Response) => {
    const {username} = req.query;

    if(!username){
        const response = genericResponse(false, 'Please provide a username', null, 'Username field is missing', null);
        res.status(400).json(response);
        return;
    }
    try{
        const users = await User.find({ username: { $regex: username, $options: 'i' },});
        if(users.length === 0){
            const response = genericResponse(false, 'Users not found', null, null, null);
            res.status(404).json(response);
            return;
        }
        users.forEach(user => user.password = '*****')
        const response = genericResponse(true, 'Users found successfully', null, null, users);
        res.status(200).json(response);

    }catch(err){
        const response = genericResponse(false, 'Error searching user', null, err instanceof Error? err.message : 'Unknown error', null);
        res.status(500).json(response);
    }
}

const deleteUser = async (req : Request, res : Response) => {
    const {_id} = req.body;
    if(!_id){
        const response = genericResponse(false, 'Please provide a user ID', null, 'User ID field is missing', null);
        res.status(400).json(response);
        return;
    }
    try{
        const user = await User.findByIdAndDelete(_id);
        if(!user){
            const response = genericResponse(false, 'User not found', null, null, null);
            res.status(404).json(response);
            return;
        }
        const response = genericResponse(true, 'User deleted', null, null, user);
        res.status(200).json(response);

    }catch(err){
        const response = genericResponse(false, 'Error deleting', null, err instanceof Error? err.message : 'Unknown error', null);
        res.status(500).json(response);
    }
};


const deleteSelfAccount = async (req : Request, res : Response) => {
    const {password} = req.body;
    const userId = req.user?._id;
    if(!password){
        const response = genericResponse(false, 'Please provide your password', null, 'Password field is missing', null);
        res.status(400).json(response);
        return;
    };
    try{
        const user = await User.findById(userId);
        if(!user){
            const response = genericResponse(false, 'User not found', null, null, null);
            res.status(404).json(response);
            return;
        };
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            const response = genericResponse(false, 'Invalid credentials', null, null, null);
            res.status(401).json(response);
            return;
        }

        const deleteUser = await User.findByIdAndDelete(userId);
        if(!deleteUser){
            const response = genericResponse(false, 'Failed to delete account', null, null, null);
            res.status(404).json(response);
            return;
        }
        const response = genericResponse(true, 'Account deleted successfully', null, null, null);
        res.status(200).json(response);
    }catch(err){
        const response = genericResponse(false, 'Error deleting account', null, err instanceof Error? err.message : 'Unknown error', null);
        res.status(500).json(response);
    }

};

const changePassword = async (req : Request, res : Response) => {
    const {password, newPassword} = req.body;
     const userId = req.user?._id;
    if(!password || !newPassword){
        const response = genericResponse(false, 'Please provide all the required fields', null, 'One of the fields (or more) is missing', null);
        res.status(400).json(response);
        return;
    };
    try{
        const user = await User.findById(userId);
        if(!user){
            const response = genericResponse(false, 'User not found', null, null, null);
            res.status(404).json(response);
            return;
        };
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            const response = genericResponse(false, 'Invalid credentials', null, null, null);
            res.status(401).json(response);
            return;
        };
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        user.password = '*****';
        const response = genericResponse(true, 'Password changed successfully', null, null, user);
        res.status(200).json(response); 

    }catch(err){
        const response = genericResponse(false, 'Error changing password', null, err instanceof Error? err.message : 'Unknown error', null);
        res.status(500).json(response);
    }
};

const login = async (req : Request, res : Response) => {
    const { username, password } = req.body;
    if(!username || !password){
        const response = genericResponse(false, 'Please provide all the required fields', null, 'One of the fields (or more) is missing', null);
        res.status(400).json(response);
        return;
    };
    try{
        const user = await User.findOne({username});
        if(!user){
            const response = genericResponse(false, 'User not found', null, null, null);
            res.status(404).json(response);
            return;
        };
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            const response = genericResponse(false, 'Invalid credentials', null, null, null);
            res.status(401).json(response);
            return;
        };
        const token = createToken(user);
        res.cookie('token',token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 60 * 60 * 3000,
        });
        user.password = '*****';
        const response = genericResponse(true, 'Logged in successfully', null, null, user);
        res.status(200).json(response);

    }catch(err){
        const response = genericResponse(false, 'Error logging in', null, err instanceof Error? err.message : 'Unknown error', null);
        res.status(500).json(response);
    }
};

const logout = async (req : Request, res : Response) => {
    try{
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
        })
        
        const response = genericResponse(true, 'Logged out successfully', null, null, null);
        res.status(200).json(response);

    }catch(err){
        const response = genericResponse(false, 'Error to logout', null, err instanceof Error? err.message : 'Unknown error', null);
        res.status(500).json(response);
    }
};

const getUserDetails  = async (req : Request, res : Response) => {
    const userId = req.user?._id;
    if(!userId){
        const response = genericResponse(false, 'User not found', null, null, null);
        res.status(404).json(response);
        return;
    };

    try{
        const user = await User.findById(userId).select('-password');
        if(!user){
            const response = genericResponse(false, 'User not found', null, null, null);
            res.status(404).json(response);
            return;
        }
        const response = genericResponse(true, 'User details retrieved successfully', null, null, user);
        res.status(200).json(response); 
    }catch(err){
        const response = genericResponse(false, 'Error to getUserDetails', null, err instanceof Error? err.message : 'Unknown error', null);
        res.status(500).json(response);
    };
};

const otpService = async (req : Request, res : Response) => {
    const {email} = req.body;
    if(!email){
        const response = genericResponse(false, 'Please provide your email', null, 'Email field is missing', null);
        res.status(400).json(response);
        return;
    };
    try{
        const user = await User.findOne({email});
        if(!user){
            const response = genericResponse(false, 'User not found', null, null, null);
            res.status(404).json(response);
            return;
        };
        const otp = generateOTP();

       await sendEmail(email, otp);
       await saveOTPToDB(email, otp);

       const response = genericResponse(true, 'OTP send to email', null, null, otp);
       res.status(200).json(response);
    }catch(err){
        const response = genericResponse(false, 'Failed to send OTP', null, error instanceof Error ? error.message : 'Unknown error', null);
        res.status(500).json(response);
    };
};

const verifyOTP = async (req : Request, res : Response) => {
    const {email, otp} = req.body;
    if(!email || !otp){
        const response = genericResponse(false, 'Please provide your email and OTP', null, 'Email or OTP field is missing', null);
        res.status(400).json(response);
        return;
    };
    try{
        const otpRecord = await OTPModel.findOne({email, otp});
        if(!otpRecord){
            const response = genericResponse(false, 'Invalid OTP', null, null, null);
            res.status(401).json(response);
            return;
        };
        if(Date.now() > otpRecord.expirationDate.getTime()){
            await OTPModel.deleteOne({email, otp});
            const response = genericResponse(false, 'OTP expired', null, null, null);
            res.status(401).json(response);
            return;
        };
        const user = await User.findOne({email});
        if(!user){
            const response = genericResponse(false, 'User not found', null, null, null);
            res.status(404).json(response);
            return;
        };
        const token = createToken(user);
        res.cookie('token',token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 60 * 60 * 3000,
        });

        user.password = "*****";
        await OTPModel.deleteOne({email, otp});
        const response = genericResponse(true, 'OTP verified', null, null, user);
        res.status(200).json(response);
    }catch(err){
        const response = genericResponse(false, 'Failed to verify OTP', null, error instanceof Error? error.message : 'Unknown error', null);
        res.status(500).json(response);
    };
};

export {singUp, updateUser, searchUser, deleteUser, login, deleteSelfAccount, changePassword, logout, getUserDetails, otpService, verifyOTP};