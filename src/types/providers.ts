export type AIProvider = "openai" | "anthropic" | "google" | "grok" | "azure" | "ollama"

export interface ProviderConfig {
  provider: AIProvider
  apiKey: string
  model: string
  baseURL?: string // For custom endpoints (Azure, Ollama)
}

export interface AIMessage {
  role: "user" | "assistant" | "system"
  content: string | ContentPart[]
}

export interface ContentPart {
  type: "text" | "image_url"
  text?: string
  image_url?: {
    url: string
    detail?: "low" | "high" | "auto"
  }
}

export interface AIResponse {
  content: string
  model?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIProviderAdapter {
  sendMessage(messages: AIMessage[], config: ProviderConfig): Promise<AIResponse>
  validateConfig(config: ProviderConfig): boolean
  getAvailableModels(): string[]
  supportsImages(): boolean
}

export const PROVIDER_MODELS: Record<AIProvider, string[]> = {
  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
    "o1-preview",
    "o1-mini"
  ],
  anthropic: [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307"
  ],
  google: [
    "gemini-2.0-flash-exp",
    "gemini-exp-1206",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b-latest"
  ],
  grok: [
    "grok-3-latest",
    "grok-3",
    "grok-3-fast",
    "grok-3-mini",
    "grok-3-mini-fast",
    "grok-2-vision-latest",
    "grok-2-latest"
  ],
  azure: [
    "gpt-4o",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-35-turbo"
  ],
  ollama: [
    "llama3.2",
    "llama3.1",
    "mistral",
    "phi",
    "qwen2.5",
    "deepseek-r1"
  ]
}

export const PROVIDER_INFO: Record<AIProvider, {
  name: string
  description: string
  apiKeyUrl: string
  requiresApiKey: boolean
  supportsImages: boolean
}> = {
  openai: {
    name: "OpenAI",
    description: "GPT-4, GPT-3.5, and other OpenAI models",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    requiresApiKey: true,
    supportsImages: true
  },
  anthropic: {
    name: "Anthropic",
    description: "Claude 3.5 Sonnet, Opus, and Haiku models",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    requiresApiKey: true,
    supportsImages: true
  },
  google: {
    name: "Google AI",
    description: "Gemini 2.0 and 1.5 models",
    apiKeyUrl: "https://makersuite.google.com/app/apikey",
    requiresApiKey: true,
    supportsImages: true
  },
  grok: {
    name: "xAI Grok",
    description: "Grok 3 and Grok 2 Vision models",
    apiKeyUrl: "https://console.x.ai",
    requiresApiKey: true,
    supportsImages: true
  },
  azure: {
    name: "Azure OpenAI",
    description: "Azure-hosted OpenAI models",
    apiKeyUrl: "https://portal.azure.com",
    requiresApiKey: true,
    supportsImages: true
  },
  ollama: {
    name: "Ollama",
    description: "Run models locally with Ollama",
    apiKeyUrl: "https://ollama.ai",
    requiresApiKey: false,
    supportsImages: false
  }
}
