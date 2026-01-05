import type { AIProviderAdapter, AIMessage, AIResponse, ProviderConfig } from "@/types/providers"

export class OllamaAdapter implements AIProviderAdapter {
  async sendMessage(messages: AIMessage[], config: ProviderConfig): Promise<AIResponse> {
    const baseURL = config.baseURL || "http://localhost:11434"
    
    // Convert messages to simple string format for Ollama
    const ollamaMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : 
        msg.content.find(c => c.type === "text")?.text ?? ""
    }))

    const response = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: ollamaMessages,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return {
      content: data.message?.content ?? "",
      model: data.model,
      usage: {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      },
    }
  }

  validateConfig(config: ProviderConfig): boolean {
    return !!config.model
  }

  getAvailableModels(): string[] {
    return [
      "llama3.2",
      "llama3.1",
      "mistral",
      "phi",
      "qwen2.5",
      "deepseek-r1"
    ]
  }

  supportsImages(): boolean {
    return false
  }
}
