import express from 'express';
import { singUp, updateUser, searchUser, deleteUser} from '../controllers/user.controllers'


const userRoute = express.Router();

userRoute.post('/singUp', singUp);
userRoute.post('/updateUser', updateUser);

userRoute.get('/searchUser', searchUser);

userRoute.delete('/deleteUser', deleteUser);
export default userRoute;