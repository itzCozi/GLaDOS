import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { ChatSidebar } from "./ChatSidebar"
import { SettingsDialog } from "./SettingsDialog"
import { sendMessage } from "@/services/grok"
import { exportChat } from "@/lib/export"
import type { Message, ChatSession } from "@/types/chat"
import { PanelLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Cookies from "js-cookie"

const STORAGE_KEY_SESSIONS = "glados-sessions"
const STORAGE_KEY_CURRENT_SESSION = "glados-current-session"
const STORAGE_KEY_API_KEY = "glados-api-key"
const STORAGE_KEY_MODEL = "glados-model"
// Deprecated
const STORAGE_KEY_MESSAGES_OLD = "glados-messages"

const MESSAGES_PER_PAGE = 20

export function ChatContainer() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768
    }
    return true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState(() => Cookies.get(STORAGE_KEY_API_KEY) || "")
  const [model, setModel] = useState(() => Cookies.get(STORAGE_KEY_MODEL) || "grok-3-latest")
  const [visibleMessagesCount, setVisibleMessagesCount] = useState<Record<string, number>>({})
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<{ content: string; images: string[] } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isAutoScrolling = useRef(false)

  const currentSession = useMemo(() => sessions.find((s) => s.id === currentSessionId), [sessions, currentSessionId])
  const allMessages = useMemo(() => currentSession?.messages || [], [currentSession])
  
  const currentVisibleCount = useMemo(() => {
    if (!currentSessionId) return MESSAGES_PER_PAGE
    return visibleMessagesCount[currentSessionId] || MESSAGES_PER_PAGE
  }, [currentSessionId, visibleMessagesCount])
  
  const messages = useMemo(() => {
    const startIndex = Math.max(0, allMessages.length - currentVisibleCount)
    return allMessages.slice(startIndex)
  }, [allMessages, currentVisibleCount])
  
  const hasMoreMessages = allMessages.length > currentVisibleCount

  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS)
    const savedCurrentId = localStorage.getItem(STORAGE_KEY_CURRENT_SESSION)

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSessions(parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        })))
        if (savedCurrentId) setCurrentSessionId(savedCurrentId)
      } catch (e) {
        console.error("Failed to parse sessions", e)
      }
    } else {
        const oldMessages = Cookies.get(STORAGE_KEY_MESSAGES_OLD)
        if (oldMessages) {
             try {
                const parsed = JSON.parse(oldMessages)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const msgs = parsed.map((msg: any) => ({
                     ...msg,
                    timestamp: new Date(msg.timestamp),
                }))
                if (msgs.length > 0) {
                    const newSession: ChatSession = {
                        id: crypto.randomUUID(),
                        title: "Migrated Chat",
                        messages: msgs,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                    setSessions([newSession])
                    setCurrentSessionId(newSession.id)
                    Cookies.remove(STORAGE_KEY_MESSAGES_OLD) // Clean up
                }
             } catch (e) {
                 console.error("Failed to migrate old messages", e)
             }
        }
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions))
  }, [sessions, isInitialized])

  useEffect(() => {
    if (currentSessionId) {
        localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, currentSessionId)
    } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_SESSION)
    }
  }, [currentSessionId])

  useEffect(() => {
    if (apiKey) {
      Cookies.set(STORAGE_KEY_API_KEY, apiKey, { expires: 365 })
    } else {
      Cookies.remove(STORAGE_KEY_API_KEY)
    }
  }, [apiKey])

  useEffect(() => {
    Cookies.set(STORAGE_KEY_MODEL, model, { expires: 365 })
  }, [model])

  useEffect(() => {
    if (scrollRef.current && !isAutoScrolling.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    isAutoScrolling.current = false
  }, [messages.length, currentSessionId])

  useEffect(() => {
    if (currentSessionId && !visibleMessagesCount[currentSessionId]) {
      setVisibleMessagesCount(prev => ({
        ...prev,
        [currentSessionId]: MESSAGES_PER_PAGE
      }))
    }
  }, [currentSessionId, visibleMessagesCount])

  const loadMoreMessages = useCallback(() => {
    if (!currentSessionId || isLoadingMore) return
    
    setIsLoadingMore(true)
    isAutoScrolling.current = true
    
    const scrollElement = scrollRef.current
    const previousScrollHeight = scrollElement?.scrollHeight || 0
    
    setTimeout(() => {
      setVisibleMessagesCount(prev => ({
        ...prev,
        [currentSessionId]: (prev[currentSessionId] || MESSAGES_PER_PAGE) + MESSAGES_PER_PAGE
      }))
      
      setTimeout(() => {
        if (scrollElement) {
          const newScrollHeight = scrollElement.scrollHeight
          scrollElement.scrollTop = newScrollHeight - previousScrollHeight
        }
        setIsLoadingMore(false)
      }, 0)
    }, 300)
  }, [currentSessionId, isLoadingMore])

  useEffect(() => {
    if (!loadMoreRef.current || !hasMoreMessages) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMoreMessages()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMoreMessages, isLoadingMore, currentSessionId, loadMoreMessages])

  const createNewChat = useCallback(() => {
    const newSession: ChatSession = {
        id: crypto.randomUUID(),
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
    }
    setSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    return newSession.id
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        createNewChat()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setIsSidebarOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setIsSidebarOpen(!isSidebarOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen, createNewChat])

  const deleteSession = useCallback((id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (currentSessionId === id) {
          setCurrentSessionId(null)
      }
  }, [currentSessionId])

  const handleRegenerateResponse = useCallback(
    async (messageIndex: number) => {
      if (!apiKey || !currentSessionId) return

      const actualIndex = allMessages.length - messages.length + messageIndex
      const messagesUpToPoint = allMessages.slice(0, actualIndex)
      setIsLoading(true)
      setError(null)

      try {
        const response = await sendMessage(messagesUpToPoint, apiKey, model)
        const newMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        }

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: [...messagesUpToPoint, newMessage],
                  updatedAt: new Date(),
                }
              : s
          )
        )
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to regenerate"
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [apiKey, currentSessionId, allMessages, messages, model]
  )

  const handleEditMessage = useCallback(
    async (messageIndex: number, newContent: string) => {
      if (!apiKey || !currentSessionId) return

      const actualIndex = allMessages.length - messages.length + messageIndex
      const updatedMessage = { ...allMessages[actualIndex], content: newContent }
      const messagesUpToEdit = [...allMessages.slice(0, actualIndex), updatedMessage]

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: messagesUpToEdit, updatedAt: new Date() }
            : s
        )
      )

      setIsLoading(true)
      setError(null)

      try {
        const response = await sendMessage(messagesUpToEdit, apiKey, model)
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        }

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: [...messagesUpToEdit, assistantMessage],
                  updatedAt: new Date(),
                }
              : s
          )
        )
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to regenerate"
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [apiKey, currentSessionId, allMessages, messages, model]
  )

  const handleDeleteMessage = useCallback(
    (messageIndex: number) => {
      if (!currentSessionId) return
      const actualIndex = allMessages.length - messages.length + messageIndex
      const newMessages = allMessages.filter((_, i) => i !== actualIndex)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: newMessages, updatedAt: new Date() }
            : s
        )
      )
    },
    [currentSessionId, allMessages, messages]
  )

  const handleExportChat = useCallback(
    (format: "markdown" | "text" | "json") => {
      if (currentSession) {
        exportChat(currentSession, format)
      }
    },
    [currentSession]
  )

  const handleSend = useCallback(
    async (content: string, images: string[]) => {
      if (!apiKey) {
        setPendingMessage({ content, images })
        setIsSettingsOpen(true)
        return
      }

      let sessionId = currentSessionId
      let currentMessages = currentSessionId ? allMessages : []
      let newSession: ChatSession | null = null

      if (!sessionId) {
          sessionId = crypto.randomUUID()
          newSession = {
            id: sessionId,
            title: content.trim().slice(0, 30) || "New Chat",
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
          currentMessages = []
          setCurrentSessionId(sessionId)
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        images: images.length > 0 ? images : undefined,
        timestamp: new Date(),
      }

      const newMessages = [...currentMessages, userMessage]

      setSessions((prev) => {
          if (newSession) {
             const sessionWithMsg = { ...newSession, messages: [userMessage], updatedAt: new Date() }
             return [sessionWithMsg, ...prev]
          }
          return prev.map((s) => s.id === sessionId ? { 
            ...s, 
            messages: newMessages,
            title: s.messages.length === 0 ? (content.trim().slice(0, 30) || "New Chat") : s.title,
            updatedAt: new Date() 
          } : s)
      })

      setIsLoading(true)
      setError(null)

      try {
        const response = await sendMessage(
          newMessages,
          apiKey,
          model
        )

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        }

        setSessions((prev) => prev.map((s) => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    messages: [...newMessages, assistantMessage],
                    updatedAt: new Date()
                }
            }
            return s
        }))
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred"
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [apiKey, currentSessionId, allMessages, model]
  )

  useEffect(() => {
    if (!isSettingsOpen && apiKey && pendingMessage) {
      handleSend(pendingMessage.content, pendingMessage.images);
      setPendingMessage(null);
    }
  }, [isSettingsOpen, apiKey, pendingMessage, handleSend]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {isSidebarOpen && (
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => {
            setCurrentSessionId(id)
            if (window.innerWidth < 768) setIsSidebarOpen(false)
          }}
          onNewChat={() => {
            createNewChat()
            if (window.innerWidth < 768) setIsSidebarOpen(false)
          }}
          onDeleteSession={deleteSession}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-background z-10">
            <div className="flex items-center gap-2 overflow-hidden">
                <Button
                    variant="link"
                    className="hover:cursor-pointer"
                    size="icon"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    title={isSidebarOpen ? "Close sidebar (Ctrl+B)" : "Open sidebar (Ctrl+B)"}
                >
                    <PanelLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold truncate">
                    {currentSession?.title || "GLaDOS"}
                </h1>
            </div>
            <div className="flex items-center gap-2">
            {currentSession && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="Export chat">
                    <Download className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportChat("markdown")}>
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportChat("text")}>
                    Export as Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportChat("json")}>
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <ThemeToggle />
            <SettingsDialog
              provider="grok"
              setProvider={() => {}}
              apiKeys={{ grok: apiKey }}
              setApiKeys={(keys) => setApiKey(keys.grok || "")}
              model={model}
              setModel={setModel}
              azureEndpoint=""
              setAzureEndpoint={() => {}}
              ollamaEndpoint="http://localhost:11434"
              setOllamaEndpoint={() => {}}
              open={isSettingsOpen}
              onOpenChange={setIsSettingsOpen}
            />
            </div>
        </header>

        <ScrollArea className="flex-1">
            <div ref={scrollRef} className="h-full">
                {!currentSessionId ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-semibold text-foreground">
                          Welcome to GLaDOS
                        </h2>
                        <p className="text-sm">
                          Select a chat or start a new one to begin
                        </p>
                      </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-semibold text-foreground">
                          {currentSession?.title || "New Chat"}
                        </h2>
                        <p className="text-sm">
                          Start a conversation, paste images, or share code snippets
                        </p>
                      </div>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                    {hasMoreMessages && (
                      <div ref={loadMoreRef} className="p-4 text-center">
                        {isLoadingMore ? (
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="text-sm">Loading older messages...</span>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadMoreMessages}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Load {Math.min(MESSAGES_PER_PAGE, allMessages.length - currentVisibleCount)} older messages
                          </Button>
                        )}
                      </div>
                    )}
                    {messages.map((message, index) => (
                        <ChatMessage 
                          key={message.id} 
                          message={message}
                          onRegenerate={
                            message.role === "assistant" && index === messages.length - 1
                              ? () => handleRegenerateResponse(index)
                              : undefined
                          }
                          onEdit={
                            message.role === "user"
                              ? (content) => handleEditMessage(index, content)
                              : undefined
                          }
                          onDelete={() => handleDeleteMessage(index)}
                        />
                    ))}
                    </div>
                )}
                {isLoading && (
                    <div className="w-full bg-muted/50">
                        <div className="max-w-3xl flex items-center gap-3 p-4 w-full">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                                <div className="animate-pulse">●</div>
                            </div>
                            <div className="text-muted-foreground">Thinking...</div>
                        </div>
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
        />
      </div>
    </div>
  )
}
