import User from '../models/user.schema'
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { genericResponse } from '../utils/helper';


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
}
export {singUp, updateUser, searchUser, deleteUser}