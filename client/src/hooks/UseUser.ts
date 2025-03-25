import axios from "axios";
import { ISignup } from "../models/signup";

const BASE_URL = 'http://localhost:3000/user'

export const signUp = async (user: ISignup) => {
    try{
    const response = await axios.post(`${BASE_URL}/singUp`,user,{ withCredentials: true } )
    if(response.data){
        
    }
    }catch(e){
        console.error(e);
    }
}