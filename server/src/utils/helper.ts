import { ServerResponse } from "./types";
import jwt from 'jsonwebtoken'
import {IUser} from '../models/user.schema';
import nodemailer from 'nodemailer';
import OTPModel from "../models/otp.schema";
import dotenv from 'dotenv'

dotenv.config();

export const genericResponse = <T>(
    isSuccessful: boolean = false,
    displayMessage: string = 'Unknown message',
    description: string | null,
    exception: string | null = null,
    data: T | null = null
):ServerResponse<T> => {
    return {
        isSuccessful,
        displayMessage,
        description,
        exception,
        data,
    };
};

export const createToken = (user : IUser) => {
    const token = jwt.sign({id: user.id, role: user.role}, process.env.JWT_SECRET as string, {expiresIn: '1d'});
    return token;
};

export const generateOTP = (length = 6) => {
    let otp = '';
    for(let i = 0; i < length; i++){
        otp += Math.floor(Math.random() * 10).toString();
    };
    return otp;
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
    secure: true,
});

export const sendEmail = async (email : string, otp : string) => {
    try{
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}`,
        };
    
        await transporter.sendMail(mailOptions);
        console.log('Email send');
    }catch(err){
        console.error('Error sending email:', err);
    }
    
};

export const saveOTPToDB = async (email : string, otp : string) => {
   const expirationTime = Date.now() + 300000; // 5 דקות
    await OTPModel.create({email, otp, expirationDate: expirationTime});
};