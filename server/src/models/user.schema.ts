import { match } from 'assert';
import mongoose, { Schema, Document} from 'mongoose'

export interface IUser extends Document {
    _id: string,
    username: string,
    email: string,
    password: string,
    phone: string,
    createdAt: Date;
    profileIcon?: string; // שדה אופציונלי לאייקון המשתמש
    role: 'user' | 'admin';
}
const UserSchema: Schema = new Schema<IUser>({
    username: {type: String, required: true, unique: true, minlength: 2},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, minlength: 8, match: /^\$2b\$10\$.+/},
    phone: {type: String, required: true, unique: true, match: /^[0-9+\-]{9,14}$/},
    createdAt: { type: Date, default: Date.now },
    profileIcon: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true});

const User = mongoose.model<IUser>('User', UserSchema);
export default User;