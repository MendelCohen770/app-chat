import express from 'express';
import { authMiddleware, checkRole } from '../middlewares/middel'
import { Role } from '../models/user.schema';
import {
    signUp,
    updateUser,
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

userRoute.post('/signUp', signUp);
userRoute.post('/login', login);
userRoute.post('/googleLogin', googleLogin);
userRoute.post('/otpService', otpService);
userRoute.post('/verifyOTP', verifyOTP);
userRoute.put('/changePassword', authMiddleware, changePassword);
userRoute.post('/updateUser', authMiddleware, updateUser);
userRoute.post('/logout', authMiddleware, logout);

userRoute.get('/getAllUsers', authMiddleware, getAllUsers);
userRoute.get('/searchUser', authMiddleware, searchUser);
userRoute.get('/getUserDetails', authMiddleware, getUserDetails);

userRoute.delete('/deleteUser', authMiddleware, checkRole([Role.admin]), deleteUser);
userRoute.delete('/deleteSelfAccount', authMiddleware, deleteSelfAccount);

export default userRoute;