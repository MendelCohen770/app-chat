import { createContext } from "react";

export type TypingContextType = {
    /** Set of userIds that are currently typing TO the current user. */
    typingUserIds: Set<string>;
    /** Is the given user currently typing to the current user? */
    isTyping: (userId: string | null | undefined) => boolean;
};

export const TypingContext = createContext<TypingContextType | undefined>(undefined);
