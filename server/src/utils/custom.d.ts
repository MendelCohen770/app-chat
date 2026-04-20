// src/utils/custom.d.ts
declare namespace Express {
    export interface Request {
      user?: JwtPayload;
    }
  }
  
  interface JwtPayload {
    id: string;
    role: number;
    iat?: number;
    exp?: number;
  }
  