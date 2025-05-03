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
}

const MessageSchema = new Schema<Imessage>({
    sender: {type: Schema.Types.ObjectId,  required: true},
    receiver: {type: Schema.Types.ObjectId, required: true},
    type: {type: String, enum: [MessageType.text, MessageType.image, MessageType.video, MessageType.audio, MessageType.file], default: MessageType.text},
    content: {type: String, required: false},
    media: {type: String, required: false},
},{ timestamps: true});

const Message = mongoose.model<Imessage>('Message', MessageSchema);
export default Message;