import React, { createContext, useContext, useEffect, useState } from "react";
import { IUser } from "../models/user";
import { disconnectSocket } from "../service/socket";

type UserContextType = {
    user: IUser | null;
    saveUser: (user: IUser | null) => void;
    logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined); 

export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, [])

    const saveUser = (user: IUser | null) => {
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
    }
    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        disconnectSocket();
    }

    return (
        <UserContext.Provider value={{ user, saveUser, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if(!context){
        console.log("useUser must be used within a UserProvider");
    }
    return context;
}