import type {
  GrokAPIRequest,
  GrokAPIResponse,
  Message,
  ContentPart,
} from '@/types/chat';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

export async function sendMessage(
  messages: Message[],
  apiKey: string,
  model: string = 'grok-4',
): Promise<string> {
  const formattedMessages = messages.map((msg) => {
    if (msg.images && msg.images.length > 0) {
      const content: ContentPart[] = [{ type: 'text', text: msg.content }];
      msg.images.forEach((image) => {
        content.push({
          type: 'image_url',
          image_url: { url: image },
        });
      });
      return {
        role: msg.role,
        content,
      };
    }
    return {
      role: msg.role,
      content: msg.content,
    };
  });

  const request: GrokAPIRequest = {
    messages: formattedMessages as GrokAPIRequest['messages'],
    model,
    stream: false,
  };

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const data: GrokAPIResponse = await response.json();
  return data.choices[0]?.message.content ?? '';
}

export async function generateChatTitle(
  message: string,
  apiKey: string,
  model: string = 'grok-4',
): Promise<string> {
  // Use a specialized prompt to force brief, headline-style titles.
  const prompt = `Generate a very short, concise title (max 4-5 words, under 25 chars) for the following user message. Do not use quotes or punctuation. return ONLY the title.
  
  User message: "${message}"`;

  const request: GrokAPIRequest = {
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that generates short titles.',
      },
      { role: 'user', content: prompt },
    ],
    model,
    stream: false,
  };

  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return ''; // Fallback on failure
    }

    const data: GrokAPIResponse = await response.json();
    const title = data.choices[0]?.message.content?.trim() ?? '';
    return title.replace(/["']/g, '');
  } catch (error) {
    console.error('Failed to generate title:', error);
    return '';
  }
}

export async function generateImage(
  prompt: string,
  apiKey: string,
  model?: string,
): Promise<string> {
  try {
    const PREFERRED_IMAGE_MODEL = 'grok-2-image-1212';

    const isLikelyLanguageModel = (id?: string) => {
      if (!id) return false;
      const normalized = id.toLowerCase();
      return (
        normalized === 'grok-3' ||
        normalized === 'grok-3-mini' ||
        normalized === 'grok-4' ||
        normalized === 'grok-4-1-fast'
      );
    };

    const normalizeImageModel = (id?: string) => {
      if (!id) return undefined;
      const normalized = id.toLowerCase();
      if (normalized === 'grok-2-image') return PREFERRED_IMAGE_MODEL;
      return id;
    };

    const makeRequestBody = (includeModel: boolean) => {
      const body: Record<string, unknown> = {
        prompt,
        n: 1,
        response_format: 'url',
      };

      if (!includeModel) return body;

      const normalizedModel = normalizeImageModel(model);
      if (normalizedModel && !isLikelyLanguageModel(normalizedModel)) {
        body.model = normalizedModel;
      } else {
        body.model = PREFERRED_IMAGE_MODEL;
      }

      return body;
    };

    const doRequest = async (includeModel: boolean) => {
      const response = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(makeRequestBody(includeModel)),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status: ${response.status} - ${errorText}`);
      }

      return response.json();
    };

    const extractUrl = (payload: unknown): string => {
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload &&
        Array.isArray((payload as { data?: unknown }).data)
      ) {
        const first = (payload as { data: unknown[] }).data[0];
        if (
          typeof first === 'object' &&
          first !== null &&
          'url' in first &&
          typeof (first as { url?: unknown }).url === 'string'
        ) {
          return (first as { url: string }).url;
        }
      }
      return '';
    };

    // First attempt: include an explicit model only if it doesn't look like a language model.
    // Second attempt (fallback): omit model so the API can choose a default image model.
    let data: unknown;
    try {
      data = await doRequest(true);
    } catch {
      data = await doRequest(false);
    }

    return extractUrl(data);
  } catch (e) {
    throw new Error(
      `Failed to generate image: ${e instanceof Error ? e.message : 'Unknown error'}`,
    );
  }
}
