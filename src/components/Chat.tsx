import { useState, useRef, useEffect, useCallback } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { Settings } from './Settings'
import { ScrollArea } from '@/components/ui/scroll-area'
import { streamMessage } from '@/lib/api'
import type { Message } from '@/lib/types'
import { Bot, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY_API = 'glados-api-key'
const STORAGE_KEY_MODEL = 'glados-model'
const STORAGE_KEY_MESSAGES = 'glados-messages'

export function Chat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MESSAGES)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      } catch {
        return []
      }
    }
    return []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_API) || ''
  })
  const [model, setModel] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_MODEL) || 'grok-2-vision-latest'
  })
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_API, apiKey)
  }, [apiKey])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MODEL, model)
  }, [model])

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = async (content: string, images: string[]) => {
    if (!apiKey) {
      alert('Please set your Grok API key in Settings')
      return
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      images: images.length > 0 ? images : undefined
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setIsLoading(true)

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }

    setMessages([...newMessages, assistantMessage])

    try {
      let fullContent = ''
      
      for await (const chunk of streamMessage(newMessages, apiKey, model)) {
        fullContent += chunk
        setMessages((prev) => 
          prev.map((m) => 
            m.id === assistantMessage.id 
              ? { ...m, content: fullContent }
              : m
          )
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setMessages((prev) => 
        prev.map((m) => 
          m.id === assistantMessage.id 
            ? { ...m, content: `Error: ${errorMessage}` }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-screen relative">
      <Settings
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        model={model}
        onModelChange={setModel}
      />

      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          <h1 className="text-lg font-semibold">GLaDOS</h1>
          <span className="text-xs text-muted-foreground">
            Powered by Grok
          </span>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </header>

      <ScrollArea ref={scrollRef} className="flex-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Bot className="h-16 w-16 mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Welcome to GLaDOS</h2>
            <p className="text-muted-foreground max-w-md">
              Your minimalistic AI chat interface powered by Grok. 
              Start a conversation by typing a message below.
            </p>
            {!apiKey && (
              <p className="text-yellow-500 mt-4 text-sm">
                ⚠️ Please set your Grok API key in Settings to get started
              </p>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="max-w-4xl mx-auto w-full">
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          disabled={!apiKey}
        />
      </div>
    </div>
  )
}
