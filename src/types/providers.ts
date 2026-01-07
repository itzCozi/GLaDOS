import type { Message } from './chat';

export type AIProvider = 'grok';

export interface AIProviderAdapter {
  sendMessage(
    messages: Message[],
    apiKey: string,
    model: string,
  ): Promise<string>;

  generateImage?(
    prompt: string,
    apiKey: string,
    model?: string,
  ): Promise<string>;
}

export const PROVIDER_MODELS: Record<AIProvider, string[]> = {
  grok: ['grok-4', 'grok-4-1-fast', 'grok-3', 'grok-3-mini'],
};

export const PROVIDER_INFO: Record<
  AIProvider,
  {
    name: string;
    description: string;
    apiKeyUrl: string;
    requiresApiKey: boolean;
    supportsImages: boolean;
  }
> = {
  grok: {
    name: 'xAI Grok',
    description: 'Grok 3 and Grok 2 Vision models',
    apiKeyUrl: 'https://console.x.ai',
    requiresApiKey: true,
    supportsImages: true,
  },
};
