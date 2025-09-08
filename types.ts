

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

export interface Message {
  id: string;
  role: 'user' | 'model';
  parts: Part[];
  thoughts?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}
