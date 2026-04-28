import { type Message } from '../../../shared/types/domain';

export const MessageType = {
  text: 'text',
  image: 'image',
  video: 'video',
  audio: 'audio',
  file: 'file',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];
export type IMessage = Message;
