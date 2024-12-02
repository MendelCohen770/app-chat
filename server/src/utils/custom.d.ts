// src/utils/custom.d.ts
declare namespace Express {
    export interface Request {
      user?: JwtPayload;
    }
  }
  
  interface JwtPayload {
    _id: string;
    email: string;
    role: 'user' | 'admin';
    iat?: number;
    exp?: number;
  }
  