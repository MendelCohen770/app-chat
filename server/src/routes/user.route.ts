import express from 'express';
import { authMiddleware } from '../middlewares/middel'
import {
    singUp,
    updateUser,
    searchUser,
    deleteUser,
    login,
    deleteSelfAccount
} from '../controllers/user.controllers'



const userRoute = express.Router();

userRoute.post('/singUp', singUp);
userRoute.post('/login', login);
userRoute.post('/updateUser', authMiddleware, updateUser);


userRoute.get('/searchUser', authMiddleware, searchUser);

userRoute.delete('/deleteUser', authMiddleware, deleteUser);
userRoute.delete('/deleteSelfAccount', authMiddleware, deleteSelfAccount)
export default userRoute;