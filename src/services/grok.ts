import type { GrokAPIRequest, GrokAPIResponse, Message, ContentPart } from "@/types/chat"

const GROK_API_URL = "https://api.x.ai/v1/chat/completions"

export async function sendMessage(
  messages: Message[],
  apiKey: string,
  model: string = "grok-3-latest"
): Promise<string> {
  const formattedMessages = messages.map((msg) => {
    if (msg.images && msg.images.length > 0) {
      const content: ContentPart[] = [{ type: "text", text: msg.content }]
      msg.images.forEach((image) => {
        content.push({
          type: "image_url",
          image_url: { url: image },
        })
      })
      return {
        role: msg.role,
        content,
      }
    }
    return {
      role: msg.role,
      content: msg.content,
    }
  })

  const request: GrokAPIRequest = {
    messages: formattedMessages as GrokAPIRequest["messages"],
    model,
    stream: false,
  }

  const response = await fetch(GROK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API request failed: ${response.status} - ${errorText}`)
  }

  const data: GrokAPIResponse = await response.json()
  return data.choices[0]?.message.content ?? ""
}
