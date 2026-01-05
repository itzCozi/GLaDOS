import type { AIProvider, AIProviderAdapter } from "@/types/providers"
import { OpenAIAdapter } from "./providers/openai"
import { AnthropicAdapter } from "./providers/anthropic"
import { GoogleAdapter } from "./providers/google"
import { GrokAdapter } from "./providers/grok"
import { AzureAdapter } from "./providers/azure"
import { OllamaAdapter } from "./providers/ollama"

const adapters: Record<AIProvider, AIProviderAdapter> = {
  openai: new OpenAIAdapter(),
  anthropic: new AnthropicAdapter(),
  google: new GoogleAdapter(),
  grok: new GrokAdapter(),
  azure: new AzureAdapter(),
  ollama: new OllamaAdapter()
}

export function getProviderAdapter(provider: AIProvider): AIProviderAdapter {
  return adapters[provider]
}
