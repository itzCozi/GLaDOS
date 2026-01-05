import type { AIProviderAdapter, AIMessage, AIResponse, ProviderConfig, ContentPart } from "@/types/providers"

export class AnthropicAdapter implements AIProviderAdapter {
  async sendMessage(messages: AIMessage[], config: ProviderConfig): Promise<AIResponse> {
    // Anthropic requires system messages to be separate
    const systemMessages = messages.filter(m => m.role === "system")
    const otherMessages = messages.filter(m => m.role !== "system")
    const systemPrompt = systemMessages.map(m => 
      typeof m.content === "string" ? m.content : m.content.find(c => c.type === "text")?.text ?? ""
    ).join("\n")

    // Convert messages to Anthropic format
    const anthropicMessages = otherMessages.map(msg => {
      if (typeof msg.content === "string") {
        return { role: msg.role, content: msg.content }
      }
      
      // Handle multimodal content
      const content = msg.content.map((part: ContentPart) => {
        if (part.type === "text") {
          return { type: "text", text: part.text }
        } else if (part.type === "image_url") {
          // Anthropic uses base64 images
          const url = part.image_url?.url ?? ""
          if (url.startsWith("data:")) {
            const [mediaType, base64] = url.substring(5).split(",")
            return {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType.split(";")[0],
                data: base64,
              },
            }
          }
          // For non-base64 URLs, we'd need to fetch and convert
          return { type: "text", text: "[Image not supported in URL format]" }
        }
        return { type: "text", text: "" }
      })
      
      return { role: msg.role, content }
    })

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        messages: anthropicMessages,
        max_tokens: 4096,
        ...(systemPrompt && { system: systemPrompt }),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text ?? ""
    
    return {
      content,
      model: data.model,
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
    }
  }

  validateConfig(config: ProviderConfig): boolean {
    return !!(config.apiKey && config.model)
  }

  getAvailableModels(): string[] {
    return [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307"
    ]
  }

  supportsImages(): boolean {
    return true
  }
}
