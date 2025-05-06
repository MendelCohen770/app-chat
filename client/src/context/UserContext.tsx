import React, { createContext, useContext, useState } from "react";
import { IUser } from "../models/user";

type UserContextType = {
    user: IUser | null;
    setUser: (user: IUser | null) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined); 

export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(null);

    return (
        <UserContext.Provider value={{ user, setUser }}>
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