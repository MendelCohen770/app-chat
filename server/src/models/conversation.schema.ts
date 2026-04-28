import mongoose, { Document, Schema } from "mongoose";
import { ConversationType, type Conversation as SharedConversation } from "../../../shared/types/domain";

export interface IConversation extends Document, Omit<SharedConversation, '_id' | 'participants' | 'admins' | 'lastMessage' | 'createdAt' | 'updatedAt'> {
    participants: mongoose.Types.ObjectId[];
    admins?: mongoose.Types.ObjectId[];
    lastMessage?: mongoose.Types.ObjectId | null;
    createdAt?: Date;
    updatedAt?: Date;
}

const ConversationSchema = new Schema<IConversation>({
    type: {
        type: String,
        enum: [ConversationType.dm, ConversationType.group],
        default: ConversationType.dm,
    },
    participants: {
        type: [Schema.Types.ObjectId],
        required: true,
        validate: {
            validator: function (this: any, value: mongoose.Types.ObjectId[]) {
                if (!Array.isArray(value) || value.length < 2) return false;
                const uniqueCount = new Set(value.map((id) => String(id))).size;
                if (uniqueCount !== value.length) return false;
                if (this.type === ConversationType.dm) return value.length === 2;
                return true;
            },
            message: "Invalid participants for conversation type",
        },
    },
    admins: {
        type: [Schema.Types.ObjectId],
        default: [],
    },
    name: {
        type: String,
        trim: true,
        default: null,
    },
    avatar: {
        type: String,
        trim: true,
        default: null,
    },
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },
}, { timestamps: true });

ConversationSchema.pre("validate", function (this: any, next) {
    if (Array.isArray(this.participants)) {
        this.participants = [...this.participants]
            .map((id) => new mongoose.Types.ObjectId(String(id)))
            .sort((a, b) => String(a).localeCompare(String(b)));
    }
    if (Array.isArray(this.admins)) {
        const normalizedAdminIds = [...new Set((this.admins as Array<mongoose.Types.ObjectId | string>)
            .map((id: mongoose.Types.ObjectId | string) => String(id)))];
        this.admins = normalizedAdminIds
            .map((id) => new mongoose.Types.ObjectId(id))
            .sort((a, b) => String(a).localeCompare(String(b)));
    }
    if (this.type === ConversationType.dm) {
        this.admins = [];
        this.name = null as any;
        this.avatar = null as any;
    }
    next();
});

ConversationSchema.index({ type: 1, participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
