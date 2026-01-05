export interface MessageContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
  }
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string | MessageContent[]
  timestamp: Date
  images?: string[]
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  error: string | null
}

export interface GrokResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
