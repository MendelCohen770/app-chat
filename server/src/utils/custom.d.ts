declare namespace Express {
    export interface Request {
        user?: JwtPayload;
    }
}

interface JwtPayload {
    _id: string;
    iat?: number;
    exp?: number;
}
