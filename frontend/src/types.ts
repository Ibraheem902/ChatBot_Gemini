export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: number | string;
  role: Role;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}
