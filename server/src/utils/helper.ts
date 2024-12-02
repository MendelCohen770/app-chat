import { ServerResponse } from "./types";
import jwt from 'jsonwebtoken'
import {IUser} from '../models/user.schema'

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

export const createToken = (user : IUser) => {
    const token = jwt.sign({id: user.id, role: user.role}, process.env.JWT_SECRET as string, {expiresIn: '1d'});
    return token;
}