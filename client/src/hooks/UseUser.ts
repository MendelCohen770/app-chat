import axios from "axios";
import { ISignup } from "../models/signup";

const BASE_URL = 'http://localhost:3000/user'

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


