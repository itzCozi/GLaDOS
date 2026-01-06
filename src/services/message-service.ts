import type { Message } from "@/types/chat"
import type { AIMessage, ProviderConfig, AIResponse } from "@/types/providers"
import { getProviderAdapter } from "./ai-service"

export async function sendMessage(
  messages: Message[],
  config: ProviderConfig
): Promise<AIResponse> {
  const adapter = getProviderAdapter(config.provider)
  
  if (!adapter.validateConfig(config)) {
    throw new Error(`Invalid configuration for provider: ${config.provider}`)
  }

  const aiMessages: AIMessage[] = messages.map((msg) => {
    if (msg.images && msg.images.length > 0) {
      if (!adapter.supportsImages()) {
        return {
          role: msg.role,
          content: msg.content,
        }
      }
      
      const content: Array<{ type: "text"; text?: string } | { type: "image_url"; image_url?: { url: string } }> = [
        { type: "text", text: msg.content }
      ]
      
      msg.images.forEach((image) => {
        content.push({
          type: "image_url",
          image_url: { url: image },
        })
      })
      
      return {
        role: msg.role,
        content,
      }
    }
    
    return {
      role: msg.role,
      content: msg.content,
    }
  })

  return adapter.sendMessage(aiMessages, config)
}
