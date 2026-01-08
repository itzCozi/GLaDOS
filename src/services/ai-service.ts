import type { AIProvider, AIProviderAdapter } from "../types/providers";
import { GrokAdapter } from "./providers/grok";

const adapters: Record<AIProvider, AIProviderAdapter> = {
  grok: new GrokAdapter(),
};

export function getProviderAdapter(provider: AIProvider): AIProviderAdapter {
  return adapters[provider];
}
