import { sendMessage, generateImage } from '../grok';
import type { AIProviderAdapter } from '../../types/providers';
import type { Message } from '../../types/chat';

export class GrokAdapter implements AIProviderAdapter {
  async sendMessage(
    messages: Message[],
    apiKey: string,
    model: string,
  ): Promise<string> {
    return sendMessage(messages, apiKey, model);
  }

  async generateImage(
    prompt: string,
    apiKey: string,
    model?: string,
  ): Promise<string> {
    return generateImage(prompt, apiKey, model);
  }
}
