///<reference path="../utils/custom.d.ts" />
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken'
import { genericResponse } from '../utils/helper';


export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            const response = genericResponse(false, 'Authentication failed', null, 'No token provided', null);
            res.status(401).json(response);
            return;
        };
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.user = decoded;
        next();
    } catch (err) {
        const response = genericResponse(false, 'Authentication failed', null, 'Invalid token', null);
        res.status(401).json(response);
    };

};

export const checkRole = (roles: ('user' | 'admin')[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const role = req.user?.role;

        if (!role || !roles.includes(role)) {
            const response = genericResponse(false, 'Forbidden', null, 'You do not have the required role', null);
            res.status(403).json(response);
            return;
        }

        next();
    };
};
