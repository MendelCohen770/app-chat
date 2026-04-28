export enum Role {
  admin = 0,
  user = 1,
}

export enum MessageType {
  text = 'text',
  image = 'image',
  video = 'video',
  audio = 'audio',
  file = 'file',
}

export interface User {
  _id: string;
  username: string;
  email: string;
  password?: string;
  phone?: string;
  googleId?: string;
  profileIcon?: string;
  role: Role;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: string;
  receiver: string;
  type: MessageType;
  content?: string;
  media?: string;
  deliveredAt?: string | Date | null;
  readAt?: string | Date | null;
  deletedAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Conversation {
  _id: string;
  participants: string[];
  lastMessage?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
