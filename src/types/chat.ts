export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
  timestamp: Date;
  tokenCount?: number;
  cost?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
}

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface GrokAPIRequest {
  messages: {
    role: "user" | "assistant" | "system";
    content: string | ContentPart[];
  }[];
  model: string;
  stream?: boolean;
}

export interface ContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface GrokAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
