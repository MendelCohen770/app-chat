import express from 'express';
import { authMiddleware, checkRole } from '../middlewares/middel'
import { profileIconUpload } from '../middlewares/upload';
import { Role } from '../../../shared/types/domain';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import {
    changePasswordBodySchema,
    googleLoginBodySchema,
    loginBodySchema,
    searchUserQuerySchema,
    signUpBodySchema,
    updateUserBodySchema,
    verifyOtpBodySchema,
} from '../schemas';
import {
    signUp,
    updateUser,
    uploadProfileIcon,
    getAllUsers,
    searchUser,
    deleteUser,
    login,
    deleteSelfAccount,
    changePassword,
    logout,
    getUserDetails,
    otpService,
    verifyOTP,
    googleLogin
} from '../controllers/user.controller'

const userRoute = express.Router();

/**
 * @openapi
 * /user/signUp:
 *   post:
 *     tags:
 *       - User
 *     summary: Register a new user
 *     responses:
 *       200:
 *         description: User registered successfully
 */
userRoute.post('/signUp', validateBody(signUpBodySchema), signUp);
/**
 * @openapi
 * /user/login:
 *   post:
 *     tags:
 *       - User
 *     summary: Login with email and password
 *     responses:
 *       200:
 *         description: User logged in successfully
 */
userRoute.post('/login', validateBody(loginBodySchema), login);
/**
 * @openapi
 * /user/googleLogin:
 *   post:
 *     tags:
 *       - User
 *     summary: Login with Google token
 *     responses:
 *       200:
 *         description: User logged in with Google successfully
 */
userRoute.post('/googleLogin', validateBody(googleLoginBodySchema), googleLogin);
/**
 * @openapi
 * /user/otpService:
 *   post:
 *     tags:
 *       - User
 *     summary: Request OTP for signup/login verification
 *     responses:
 *       200:
 *         description: OTP request handled
 */
userRoute.post('/otpService', otpService);
/**
 * @openapi
 * /user/verifyOTP:
 *   post:
 *     tags:
 *       - User
 *     summary: Verify OTP code
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
userRoute.post('/verifyOTP', validateBody(verifyOtpBodySchema), verifyOTP);
/**
 * @openapi
 * /user/changePassword:
 *   put:
 *     tags:
 *       - User
 *     summary: Change current user password
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
userRoute.put('/changePassword', authMiddleware, validateBody(changePasswordBodySchema), changePassword);
/**
 * @openapi
 * /user/updateUser:
 *   post:
 *     tags:
 *       - User
 *     summary: Update current user profile fields
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile updated successfully
 */
userRoute.post('/updateUser', authMiddleware, validateBody(updateUserBodySchema), updateUser);
/**
 * @openapi
 * /user/uploadProfileIcon:
 *   post:
 *     tags:
 *       - User
 *     summary: Upload profile icon for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile icon uploaded successfully
 */
userRoute.post('/uploadProfileIcon', authMiddleware, profileIconUpload, uploadProfileIcon);
/**
 * @openapi
 * /user/logout:
 *   post:
 *     tags:
 *       - User
 *     summary: Logout current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
userRoute.post('/logout', authMiddleware, logout);

/**
 * @openapi
 * /user/getAllUsers:
 *   get:
 *     tags:
 *       - User
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
userRoute.get('/getAllUsers', authMiddleware, getAllUsers);
/**
 * @openapi
 * /user/searchUser:
 *   get:
 *     tags:
 *       - User
 *     summary: Search users by query
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results returned successfully
 */
userRoute.get('/searchUser', authMiddleware, validateQuery(searchUserQuerySchema), searchUser);
/**
 * @openapi
 * /user/getUserDetails:
 *   get:
 *     tags:
 *       - User
 *     summary: Get current user details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details returned successfully
 */
userRoute.get('/getUserDetails', authMiddleware, getUserDetails);

/**
 * @openapi
 * /user/deleteUser:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete a user (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
userRoute.delete('/deleteUser', authMiddleware, checkRole([Role.admin]), deleteUser);
/**
 * @openapi
 * /user/deleteSelfAccount:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete current user account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
userRoute.delete('/deleteSelfAccount', authMiddleware, deleteSelfAccount);

export default userRoute;