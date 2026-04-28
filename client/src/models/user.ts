import { type User } from '../../../shared/types/domain';

export const Role = {
  admin: 0,
  user: 1,
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export type IUser = User;