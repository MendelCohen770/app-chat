export enum Role{
    admin = 0,
    user = 1,
};

export interface IUser {
    _id: string;
    username: string;
    email: string;
    phone: string;
    password?: string;
    profileIcon: string;
    role: Role;
    createdAt: string;
    updatedAt: string;
};