import mongoose, { Document, Schema } from "mongoose";

export enum MessageType {
    text = 'text',
    image = 'image',
    video = 'video',
    audio = 'audio',
    file = 'file'
}

export interface Imessage extends Document{
    sender: Schema.Types.ObjectId,
    receiver: Schema.Types.ObjectId,
    type: MessageType.text | MessageType.image | MessageType.video | MessageType.audio | MessageType.file,
    content?: string,
    media?: string,
    deliveredAt?: Date | null,
    readAt?: Date | null,
    createdAt?: Date,
    updatedAt?: Date,
}

const MessageSchema = new Schema<Imessage>({
    sender: {type: Schema.Types.ObjectId,  required: true},
    receiver: {type: Schema.Types.ObjectId, required: true},
    type: {type: String, enum: [MessageType.text, MessageType.image, MessageType.video, MessageType.audio, MessageType.file], default: MessageType.text},
    content: {type: String, required: false},
    media: {type: String, required: false},
    deliveredAt: {type: Date, default: null},
    readAt: {type: Date, default: null},
},{ timestamps: true});

// Fast lookup of undelivered / unread messages for a given receiver.
MessageSchema.index({ receiver: 1, deliveredAt: 1 });
MessageSchema.index({ receiver: 1, sender: 1, readAt: 1 });
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const Message = mongoose.model<Imessage>('Message', MessageSchema);
export default Message;
