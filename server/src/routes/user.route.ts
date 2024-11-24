import express from 'express';
import { createUser, updateUser, searchUser} from '../controllers/user.controllers'


const userRoute = express.Router();

userRoute.post('/createUser', createUser);
userRoute.post('/updateUser', updateUser);

userRoute.get('/searchUser', searchUser);

export default userRoute;