import type { AIProviderAdapter, AIMessage, AIResponse, ProviderConfig, ContentPart } from "@/types/providers"

export class GoogleAdapter implements AIProviderAdapter {
  async sendMessage(messages: AIMessage[], config: ProviderConfig): Promise<AIResponse> {
    // Google Gemini uses a different message format
    const contents = messages.map(msg => {
      const role = msg.role === "assistant" ? "model" : "user"
      
      if (typeof msg.content === "string") {
        return {
          role,
          parts: [{ text: msg.content }],
        }
      }
      
      // Handle multimodal content
      const parts = msg.content.map((part: ContentPart) => {
        if (part.type === "text") {
          return { text: part.text }
        } else if (part.type === "image_url") {
          const url = part.image_url?.url ?? ""
          if (url.startsWith("data:")) {
            const [mediaType, base64] = url.substring(5).split(",")
            return {
              inlineData: {
                mimeType: mediaType.split(";")[0],
                data: base64,
              },
            }
          }
          return { text: "[Image URL not supported]" }
        }
        return { text: "" }
      })
      
      return { role, parts }
    })

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google AI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    
    return {
      content,
      model: config.model,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
    }
  }

  validateConfig(config: ProviderConfig): boolean {
    return !!(config.apiKey && config.model)
  }

  getAvailableModels(): string[] {
    return [
      "gemini-2.0-flash-exp",
      "gemini-exp-1206",
      "gemini-1.5-pro-latest",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-8b-latest"
    ]
  }

  supportsImages(): boolean {
    return true
  }
}
