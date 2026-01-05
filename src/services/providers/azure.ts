import type { AIProviderAdapter, AIMessage, AIResponse, ProviderConfig } from "@/types/providers"

export class AzureAdapter implements AIProviderAdapter {
  async sendMessage(messages: AIMessage[], config: ProviderConfig): Promise<AIResponse> {
    if (!config.baseURL) {
      throw new Error("Azure OpenAI requires a baseURL (endpoint)")
    }

    // Azure endpoint format: https://{resource-name}.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version=2024-02-15-preview
    const url = `${config.baseURL}/openai/deployments/${config.model}/chat/completions?api-version=2024-08-01-preview`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify({
        messages: messages,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`)
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
    return !!(config.apiKey && config.model && config.baseURL)
  }

  getAvailableModels(): string[] {
    return [
      "gpt-4o",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-35-turbo"
    ]
  }

  supportsImages(): boolean {
    return true
  }
}
