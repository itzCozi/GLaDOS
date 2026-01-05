import type { Message, MessageContent, GrokResponse } from './types'

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'

export async function sendMessage(
  messages: Message[],
  apiKey: string,
  model: string = 'grok-2-vision-latest'
): Promise<string> {
  const formattedMessages = messages.map((msg) => {
    if (msg.images && msg.images.length > 0) {
      const content: MessageContent[] = []
      
      if (typeof msg.content === 'string' && msg.content.trim()) {
        content.push({ type: 'text', text: msg.content })
      }
      
      for (const imageUrl of msg.images) {
        content.push({
          type: 'image_url',
          image_url: { url: imageUrl }
        })
      }
      
      return {
        role: msg.role,
        content
      }
    }
    
    return {
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : msg.content
    }
  })

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      stream: false
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${response.status} - ${error}`)
  }

  const data: GrokResponse = await response.json()
  return data.choices[0]?.message?.content || ''
}

export async function* streamMessage(
  messages: Message[],
  apiKey: string,
  model: string = 'grok-2-vision-latest'
): AsyncGenerator<string, void, unknown> {
  const formattedMessages = messages.map((msg) => {
    if (msg.images && msg.images.length > 0) {
      const content: MessageContent[] = []
      
      if (typeof msg.content === 'string' && msg.content.trim()) {
        content.push({ type: 'text', text: msg.content })
      }
      
      for (const imageUrl of msg.images) {
        content.push({
          type: 'image_url',
          image_url: { url: imageUrl }
        })
      }
      
      return {
        role: msg.role,
        content
      }
    }
    
    return {
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : msg.content
    }
  })

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      stream: true
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${response.status} - ${error}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}
