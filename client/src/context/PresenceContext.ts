import { createContext } from "react";

export type PresenceContextType = {
    onlineUserIds: Set<string>;
    isOnline: (userId: string | null | undefined) => boolean;
};

export const PresenceContext = createContext<PresenceContextType | undefined>(undefined);
