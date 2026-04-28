import { createContext } from "react";
import { IUser } from "../models/user";

export type UserContextType = {
    user: IUser | null;
    isHydrated: boolean;
    saveUser: (user: IUser | null) => void;
    logout: () => void;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);
