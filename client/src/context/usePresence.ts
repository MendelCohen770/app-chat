import { useContext } from "react";
import { PresenceContext } from "./PresenceContext";

export const usePresence = () => {
    const context = useContext(PresenceContext);
    if (!context) {
        return {
            onlineUserIds: new Set<string>(),
            isOnline: () => false,
        };
    }
    return context;
};
