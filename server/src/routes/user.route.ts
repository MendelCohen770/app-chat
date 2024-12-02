import express from 'express';
import { authMiddleware, checkRole } from '../middlewares/middel'
import {
    singUp,
    updateUser,
    searchUser,
    deleteUser,
    login,
    deleteSelfAccount,
    changePassword
} from '../controllers/user.controllers'



const userRoute = express.Router();

userRoute.post('/singUp', singUp);
userRoute.post('/login', login);
userRoute.put('/changePassword', changePassword);
userRoute.post('/updateUser', authMiddleware, updateUser);


userRoute.get('/searchUser', authMiddleware, searchUser);

userRoute.delete('/deleteUser', authMiddleware, checkRole(['admin']), deleteUser);
userRoute.delete('/deleteSelfAccount', authMiddleware, deleteSelfAccount)
export default userRoute;