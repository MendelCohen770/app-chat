import { ServerResponse } from "./types";

export const genericResponse = <T>(
    isSuccessful: boolean = false,
    displayMessage: string = 'Unknown message',
    description: string | null,
    exception: string | null = null,
    data: T | null = null
):ServerResponse<T> => {
    return {
        isSuccessful,
        displayMessage,
        description,
        exception,
        data,
    };
};