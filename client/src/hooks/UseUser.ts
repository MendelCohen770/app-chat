import axios from "axios";
import { ISignup } from "../models/signup";
import { IResponse } from "../models/response";
import { API_BASE_URL, resolveMediaUrl } from "../config/env";

const BASE_URL = `${API_BASE_URL}/user`;

export const API_ORIGIN = API_BASE_URL;
export { resolveMediaUrl };

const toResponse = (e: any, fallback: string): IResponse => {
    if (e?.response?.data) {
        return e.response.data as IResponse;
    }
    return {
        isSuccessful: false,
        displayMessage: fallback,
        description: null,
        exception: e?.message || 'Unknown error',
        data: null,
    };
};

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

export interface IUpdateProfileInput {
    username: string;
    email: string;
    phone: string;
    profileIcon?: string;
}

export const updateUserProfile = async (payload: IUpdateProfileInput): Promise<IResponse> => {
    try {
        const response = await axios.post(
            `${BASE_URL}/updateUser`,
            payload,
            { withCredentials: true },
        );
        return response.data as IResponse;
    } catch (e: any) {
        console.log('Update profile failed', e);
        return toResponse(e, 'Failed to update profile');
    }
};

export const uploadProfileIcon = async (file: File): Promise<IResponse> => {
    try {
        const formData = new FormData();
        formData.append('profileIcon', file);
        const response = await axios.post(
            `${BASE_URL}/uploadProfileIcon`,
            formData,
            {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            },
        );
        return response.data as IResponse;
    } catch (e: any) {
        console.log('Upload profile icon failed', e);
        return toResponse(e, 'Failed to upload profile picture');
    }
};

export const changePassword = async (
    password: string,
    newPassword: string,
): Promise<IResponse> => {
    try {
        const response = await axios.put(
            `${BASE_URL}/changePassword`,
            { password, newPassword },
            { withCredentials: true },
        );
        return response.data as IResponse;
    } catch (e: any) {
        console.log('Change password failed', e);
        return toResponse(e, 'Failed to change password');
    }
};

export const getUserDetails = async (): Promise<IResponse> => {
    try {
        const response = await axios.get(
            `${BASE_URL}/getUserDetails`,
            { withCredentials: true },
        );
        return response.data as IResponse;
    } catch (e: any) {
        console.log('Get user details failed', e);
        return toResponse(e, 'Failed to load user details');
    }
};

export const logoutUser = async (): Promise<IResponse> => {
    try {
        const response = await axios.post(
            `${BASE_URL}/logout`,
            {},
            { withCredentials: true },
        );
        return response.data as IResponse;
    } catch (e: any) {
        console.log('Logout failed', e);
        return toResponse(e, 'Failed to logout');
    }
};


