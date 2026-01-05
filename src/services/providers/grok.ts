import type { AIProviderAdapter, AIMessage, AIResponse, ProviderConfig } from "@/types/providers"

export class GrokAdapter implements AIProviderAdapter {
  async sendMessage(messages: AIMessage[], config: ProviderConfig): Promise<AIResponse> {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Grok API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0]?.message?.content ?? "",
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
    }
  }

  validateConfig(config: ProviderConfig): boolean {
    return !!(config.apiKey && config.model)
  }

  getAvailableModels(): string[] {
    return [
      "grok-3-latest",
      "grok-3",
      "grok-3-fast",
      "grok-3-mini",
      "grok-3-mini-fast",
      "grok-2-vision-latest",
      "grok-2-latest"
    ]
  }

  supportsImages(): boolean {
    return true
  }
}
