import { match } from 'assert';
import mongoose, { Schema, Document} from 'mongoose'

export enum Role{
    admin = 0,
    user = 1,
};
export interface IUser extends Document {
    _id: string,
    username: string,
    email: string,
    password?: string,
    phone?: string,
    googleId?: string,
    createdAt: Date;
    profileIcon?: string; // שדה אופציונלי לאייקון המשתמש
    role: Role;
}
const UserSchema: Schema = new Schema<IUser>({
    username: {type: String, required: true, unique: true, minlength: 2},
    email: {type: String, required: true, unique: true},
    password: {type: String, minlength: 8, match: /^\$2b\$10\$.+/},
    phone: {type: String, unique: true, sparse: true, match: /^[0-9+\-]{9,14}$/},
    googleId: {type: String, unique: true, sparse: true},
    createdAt: { type: Date, default: Date.now },
    profileIcon: { type: String, default: '' },
    role: { type: Number, enum: [Role.admin, Role.user], default: Role.user},
}, { timestamps: true});

const User = mongoose.model<IUser>('User', UserSchema);
export default User;