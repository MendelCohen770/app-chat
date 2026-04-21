import { useContext } from "react";
import { TypingContext } from "./TypingContext";

export const useTyping = () => {
    const context = useContext(TypingContext);
    if (!context) {
        return {
            typingUserIds: new Set<string>(),
            isTyping: () => false,
        };
    }
    return context;
};
