import express from 'express';
import { authMiddleware, checkRole } from '../middlewares/middel'
import {
    signUp,
    updateUser,
    searchUser,
    deleteUser,
    login,
    deleteSelfAccount,
    changePassword,
    logout,
    getUserDetails,
    otpService,
    verifyOTP
} from '../controllers/user.controllers'

const userRoute = express.Router();

userRoute.post('/signUp', signUp);
userRoute.post('/login', login);
userRoute.post('/otpService', otpService);
userRoute.post('/verifyOTP', verifyOTP);
userRoute.put('/changePassword', changePassword);
userRoute.post('/updateUser', authMiddleware, updateUser);
userRoute.post('/logout', authMiddleware, logout);

userRoute.get('/searchUser', authMiddleware, searchUser);
userRoute.get('/getUserDetails', authMiddleware, getUserDetails);

userRoute.delete('/deleteUser', authMiddleware, checkRole(['admin']), deleteUser);
userRoute.delete('/deleteSelfAccount', authMiddleware, deleteSelfAccount);

export default userRoute;