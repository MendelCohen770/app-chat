import express from 'express';
import { authMiddleware, checkRole } from '../middlewares/middel'
import { profileIconUpload } from '../middlewares/upload';
import { Role } from '../models/user.schema';
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

userRoute.post('/signUp', validateBody(signUpBodySchema), signUp);
userRoute.post('/login', validateBody(loginBodySchema), login);
userRoute.post('/googleLogin', validateBody(googleLoginBodySchema), googleLogin);
userRoute.post('/otpService', otpService);
userRoute.post('/verifyOTP', validateBody(verifyOtpBodySchema), verifyOTP);
userRoute.put('/changePassword', authMiddleware, validateBody(changePasswordBodySchema), changePassword);
userRoute.post('/updateUser', authMiddleware, validateBody(updateUserBodySchema), updateUser);
userRoute.post('/uploadProfileIcon', authMiddleware, profileIconUpload, uploadProfileIcon);
userRoute.post('/logout', authMiddleware, logout);

userRoute.get('/getAllUsers', authMiddleware, getAllUsers);
userRoute.get('/searchUser', authMiddleware, validateQuery(searchUserQuerySchema), searchUser);
userRoute.get('/getUserDetails', authMiddleware, getUserDetails);

userRoute.delete('/deleteUser', authMiddleware, checkRole([Role.admin]), deleteUser);
userRoute.delete('/deleteSelfAccount', authMiddleware, deleteSelfAccount);

export default userRoute;