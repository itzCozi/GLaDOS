import { useState, useEffect, useRef, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { sendMessage } from "@/services/grok"
import type { Message } from "@/types/chat"
import { Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY_MESSAGES = "glados-messages"
const STORAGE_KEY_API_KEY = "glados-api-key"
const STORAGE_KEY_MODEL = "glados-model"

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("grok-3-latest")
  const [showSettings, setShowSettings] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES)
    const savedApiKey = localStorage.getItem(STORAGE_KEY_API_KEY)
    const savedModel = localStorage.getItem(STORAGE_KEY_MODEL)

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        setMessages(
          parsed.map((msg: Message) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        )
      } catch {
        console.error("Failed to parse saved messages")
      }
    }

    if (savedApiKey) {
      setApiKey(savedApiKey)
    } else {
      setShowSettings(true)
    }

    if (savedModel) {
      setModel(savedModel)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem(STORAGE_KEY_API_KEY, apiKey)
    }
  }, [apiKey])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MODEL, model)
  }, [model])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = useCallback(
    async (content: string, images: string[]) => {
      if (!apiKey) {
        setError("Please set your API key in settings")
        setShowSettings(true)
        return
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        images: images.length > 0 ? images : undefined,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      try {
        const response = await sendMessage(
          [...messages, userMessage],
          apiKey,
          model
        )

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred"
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [apiKey, messages, model]
  )

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-semibold">GLaDOS</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            title="Clear chat"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {showSettings && (
        <div className="border-b border-border p-4 bg-muted/50">
          <div className="max-w-2xl mx-auto space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Grok API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Grok API key"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="grok-3-latest">Grok 3 (Latest)</option>
                <option value="grok-3">Grok 3</option>
                <option value="grok-3-fast">Grok 3 Fast</option>
                <option value="grok-3-mini">Grok 3 Mini</option>
                <option value="grok-3-mini-fast">Grok 3 Mini Fast</option>
                <option value="grok-2-vision-latest">
                  Grok 2 Vision (Latest)
                </option>
                <option value="grok-2-latest">Grok 2 (Latest)</option>
              </select>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSettings(false)}
            >
              Close Settings
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="h-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  Welcome to GLaDOS
                </h2>
                <p>Your minimalistic AI chat interface for Grok</p>
                <p className="text-sm">
                  Start a conversation, paste images, or share code snippets
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
          {isLoading && (
            <div className="p-4 bg-muted/50 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <div className="animate-pulse">●</div>
              </div>
              <div className="text-muted-foreground">Thinking...</div>
            </div>
          )}
        </div>
      </ScrollArea>

      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t border-destructive/20">
          {error}
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        disabled={!apiKey}
      />
    </div>
  )
}
