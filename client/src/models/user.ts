export enum Role{
    admin = 0,
    user = 1,
};

export interface IUser{
    _id: string,
    username: string,
    email: string,
    password: string,
    phone: string,
    createdAt: Date;
    profileIcon?: string; // שדה אופציונלי לאייקון המשתמש
    role: Role;
};