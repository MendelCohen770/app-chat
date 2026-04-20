import axios from "axios";
import { ISignup } from "../models/signup";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const BASE_URL = `${API_BASE_URL}/user`;

export const signup = async (user: ISignup): Promise<any> => {
    try{
    const response = await axios.post(`${BASE_URL}/signUp`,user,{ withCredentials: true } );
    return response.data;
    }catch(e){
        console.error("Signup failed", e);
        return e;
    }
};

export const login = async (username: string, password: string): Promise<any> => {
    try{
        const response = await axios.post(`${BASE_URL}/login`, {username, password}, {withCredentials: true})
        return response.data;
    }catch(e ) {
      console.log("Login failed", e);
        return e;
    }
};

export const requestOtp = async (email: string): Promise<any> => {
    try {
        const response = await axios.post(
            `${BASE_URL}/otpService`,
            { email },
            { withCredentials: true }
        );
        return response.data;
    } catch (e: any) {
        console.log("Request OTP failed", e);
        if (e?.response?.data) {
            return e.response.data;
        }
        return {
            isSuccessful: false,
            displayMessage: 'Failed to send OTP',
            description: null,
            exception: e?.message || 'Unknown error',
            data: null,
        };
    }
};

export const verifyOtp = async (email: string, otp: string): Promise<any> => {
    try {
        const response = await axios.post(
            `${BASE_URL}/verifyOTP`,
            { email, otp },
            { withCredentials: true }
        );
        return response.data;
    } catch (e: any) {
        console.log("Verify OTP failed", e);
        if (e?.response?.data) {
            return e.response.data;
        }
        return {
            isSuccessful: false,
            displayMessage: 'Failed to verify OTP',
            description: null,
            exception: e?.message || 'Unknown error',
            data: null,
        };
    }
};

export const googleLogin = async (credential: string): Promise<any> => {
    try{
        const response = await axios.post(
            `${BASE_URL}/googleLogin`,
            { credential },
            { withCredentials: true }
        );
        return response.data;
    }catch(e: any){
        console.log("Google login failed", e);
        if(e?.response?.data){
            return e.response.data;
        }
        return {
            isSuccessful: false,
            displayMessage: 'Google login failed',
            description: null,
            exception: e?.message || 'Unknown error',
            data: null,
        };
    }
};


