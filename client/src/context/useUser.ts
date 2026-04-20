import { useContext } from "react";
import { UserContext } from "./UserContext";

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        console.log("useUser must be used within a UserProvider");
    }
    return context;
};
