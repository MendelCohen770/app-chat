import { type Conversation } from '../../../shared/types/domain';

export const ConversationType = {
  dm: 'dm',
  group: 'group',
} as const;
export type IConversation = Omit<Conversation, 'participants' | 'lastMessage'> & {
  participants: Array<{
    _id: string;
    username: string;
    profileIcon?: string;
  }>;
  isAdmin?: boolean;
  lastMessage?: {
    _id: string;
    sender: string;
    receiver?: string | null;
    content?: string;
    type?: string;
    createdAt?: string | Date;
  } | null;
};
