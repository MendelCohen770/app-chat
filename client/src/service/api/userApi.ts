import axios from "axios";

const BASE_URL = 'http://localhost:3000/user'

export const login = async (username: string, password: string) => {
    try{
        const res = await axios.post(`${BASE_URL}/login`, {username, password}, {withCredentials: true})
        console.log('-----',res);

        return res;
        
    }catch(e ) {
      console.log("Login failed", e);
        return e.response.data;
    }

};

export const signup = async (username: string, password: string, email: string, phone: string) => {
  try{
    return await axios.post(`${BASE_URL}/signUp`, {username, password, email, phone}, {withCredentials: true});
  }catch(e){
    console.log("Signup failed", e);
    return e.response.data;
  }
};

