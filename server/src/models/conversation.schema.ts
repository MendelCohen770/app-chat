import mongoose, { Document, Schema } from "mongoose";
import { type Conversation as SharedConversation } from "../../../shared/types/domain";

export interface IConversation extends Document, Omit<SharedConversation, '_id' | 'participants' | 'lastMessage' | 'createdAt' | 'updatedAt'> {
    participants: mongoose.Types.ObjectId[];
    lastMessage?: mongoose.Types.ObjectId | null;
    createdAt?: Date;
    updatedAt?: Date;
}

const ConversationSchema = new Schema<IConversation>({
    participants: {
        type: [Schema.Types.ObjectId],
        required: true,
        validate: {
            validator: (value: mongoose.Types.ObjectId[]) => {
                if (!Array.isArray(value) || value.length !== 2) return false;
                return new Set(value.map((id) => String(id))).size === 2;
            },
            message: "Conversation must have exactly two unique participants",
        },
    },
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },
}, { timestamps: true });

ConversationSchema.pre("validate", function (next) {
    if (Array.isArray(this.participants)) {
        this.participants = [...this.participants]
            .map((id) => new mongoose.Types.ObjectId(String(id)))
            .sort((a, b) => String(a).localeCompare(String(b)));
    }
    next();
});

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
