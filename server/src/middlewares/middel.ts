///<reference path="../utils/custom.d.ts" />
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../../../shared/types/domain';
import { AppError } from './errorHandler';


export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return next(new AppError(401, 'Authentication failed', 'No token provided'));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.user = decoded;
        next();
    } catch (err) {
        next(new AppError(401, 'Authentication failed', 'Invalid token'));
    }
};

export const checkRole = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const role = req.user?.role;

        if (role === undefined || role === null || !roles.includes(role)) {
            return next(new AppError(403, 'Forbidden', 'You do not have the required role'));
        }

        next();
    };
};
