import React, { useEffect, useState } from "react";
import { IUser } from "../models/user";
import { disconnectSocket } from "../service/socket";
import { UserContext } from "./UserContext";
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from "../storage/localStorage";

const LEGACY_USER_KEY = "user";

const readInitialUser = (): IUser | null => {
    const current = readStorage<IUser>(STORAGE_KEYS.currentUser);
    if (current) return current;
    const legacy = readStorage<IUser>(LEGACY_USER_KEY);
    if (!legacy) return null;
    const migrated: IUser = { ...legacy, password: undefined };
    writeStorage(STORAGE_KEYS.currentUser, migrated);
    removeStorage(LEGACY_USER_KEY);
    return migrated;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(readInitialUser);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const saveUser = (nextUser: IUser | null) => {
        setUser(nextUser);
        if (!nextUser) {
            removeStorage(STORAGE_KEYS.currentUser);
            removeStorage(LEGACY_USER_KEY);
            return;
        }
        // Keep only profile/auth display fields; never persist password in client storage.
        const sanitizedUser: IUser = {
            ...nextUser,
            password: undefined,
        };
        writeStorage(STORAGE_KEYS.currentUser, sanitizedUser);
    };

    const logout = () => {
        setUser(null);
        removeStorage(STORAGE_KEYS.currentUser);
        removeStorage(LEGACY_USER_KEY);
        disconnectSocket();
    };

    return (
        <UserContext.Provider value={{ user, isHydrated, saveUser, logout }}>
            {children}
        </UserContext.Provider>
    );
};
