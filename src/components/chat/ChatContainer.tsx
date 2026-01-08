import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatSidebar } from "./ChatSidebar";
import { SettingsDialog } from "./SettingsDialog.tsx";
import { RenameDialog } from "./RenameDialog";
import { sendMessage, generateImage, generateChatTitle } from "@/services/grok";
import { exportChat } from "@/lib/export";
import type { Message, ChatSession } from "@/types/chat";
import { PanelLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/lib/settings-store";

const STORAGE_KEY_SESSIONS = "glados-sessions";
const STORAGE_KEY_CURRENT_SESSION = "glados-current-session";

const MESSAGES_PER_PAGE = 20;

const MAX_CHAT_TITLE_LENGTH = 24;

function normalizeTitleSpacing(title: string): string {
  const withSpaces = title
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return withSpaces.replace(/\s+/g, " ").trim();
}

interface SerializedMessage extends Omit<Message, "timestamp"> {
  timestamp: string;
}

interface SerializedChatSession extends Omit<
  ChatSession,
  "createdAt" | "updatedAt" | "messages"
> {
  createdAt: string;
  updatedAt: string;
  messages: SerializedMessage[];
}

function clampChatTitle(
  title: string,
  maxLength = MAX_CHAT_TITLE_LENGTH,
): string {
  const normalized = normalizeTitleSpacing(title);
  if (!normalized) return "New Chat";
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength).trimEnd();
}

function orderSessions(sessions: ChatSession[]): ChatSession[] {
  const pinned = sessions.filter((session) => session.pinned);
  const unpinned = sessions.filter((session) => !session.pinned);
  return [...pinned, ...unpinned];
}

export function ChatContainer() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatingSessionId, setGeneratingSessionId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const { apiKey, model, systemPhrase, aiName, siteName } = useSettings();
  const [visibleMessagesCount, setVisibleMessagesCount] = useState<
    Record<string, number>
  >({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<{
    content: string;
    images: string[];
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isUserNearBottom = useRef(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);
  const prevSessionId = useRef<string | null>(null);

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === currentSessionId),
    [sessions, currentSessionId],
  );
  const allMessages = useMemo(
    () => currentSession?.messages || [],
    [currentSession],
  );

  const orderedSessions = useMemo(() => orderSessions(sessions), [sessions]);

  const currentVisibleCount = useMemo(() => {
    if (!currentSessionId) return MESSAGES_PER_PAGE;
    return visibleMessagesCount[currentSessionId] || MESSAGES_PER_PAGE;
  }, [currentSessionId, visibleMessagesCount]);

  const messages = useMemo(() => {
    const startIndex = Math.max(0, allMessages.length - currentVisibleCount);
    return allMessages.slice(startIndex);
  }, [allMessages, currentVisibleCount]);

  const hasMoreMessages = allMessages.length > currentVisibleCount;

  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    const savedCurrentId = localStorage.getItem(STORAGE_KEY_CURRENT_SESSION);

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions) as SerializedChatSession[];
        setSessions(
          orderSessions(
            parsed.map((s) => ({
              ...s,
              pinned: Boolean((s as SerializedChatSession).pinned),
              createdAt: new Date(s.createdAt),
              updatedAt: new Date(s.updatedAt),
              messages: s.messages.map((m) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              })),
            })),
          ),
        );
        if (savedCurrentId) setCurrentSessionId(savedCurrentId);
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  }, [sessions, isInitialized]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, currentSessionId);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_SESSION);
    }
  }, [currentSessionId]);

  const updateViewportRef = useCallback(() => {
    if (!scrollRef.current) return;
    const viewport = scrollRef.current.closest(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLDivElement | null;
    if (viewport) {
      viewportRef.current = viewport;
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const viewport = viewportRef.current;
    if (!viewport || !scrollRef.current) return;
    const targetTop = scrollRef.current.scrollHeight - viewport.clientHeight;
    viewport.scrollTo({ top: targetTop, behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !scrollRef.current) return;
    const distanceFromBottom =
      scrollRef.current.scrollHeight -
      (viewport.scrollTop + viewport.clientHeight);
    isUserNearBottom.current = distanceFromBottom < 160;
  }, []);

  useEffect(() => {
    updateViewportRef();
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [handleScroll, updateViewportRef]);

  useEffect(() => {
    updateViewportRef();
    const isNewSession = prevSessionId.current !== currentSessionId;
    const shouldScroll = isAutoScrolling.current
      ? false
      : isNewSession || isUserNearBottom.current;

    if (shouldScroll) {
      scrollToBottom(isNewSession ? "auto" : "smooth");
    }

    isAutoScrolling.current = false;
    prevSessionId.current = currentSessionId;
  }, [messages, currentSessionId, scrollToBottom, updateViewportRef]);

  useEffect(() => {
    if (currentSessionId && !visibleMessagesCount[currentSessionId]) {
      setVisibleMessagesCount((prev) => ({
        ...prev,
        [currentSessionId]: MESSAGES_PER_PAGE,
      }));
    }
  }, [currentSessionId, visibleMessagesCount]);

  const loadMoreMessages = useCallback(() => {
    if (!currentSessionId || isLoadingMore) return;

    setIsLoadingMore(true);
    isAutoScrolling.current = true;

    const viewport = viewportRef.current;
    const content = scrollRef.current;
    const previousScrollHeight = content?.scrollHeight || 0;
    const previousScrollTop = viewport?.scrollTop || 0;

    setTimeout(() => {
      setVisibleMessagesCount((prev) => ({
        ...prev,
        [currentSessionId]:
          (prev[currentSessionId] || MESSAGES_PER_PAGE) + MESSAGES_PER_PAGE,
      }));

      setTimeout(() => {
        if (viewport && content) {
          const newScrollHeight = content.scrollHeight;
          const heightDelta = newScrollHeight - previousScrollHeight;
          viewport.scrollTop = previousScrollTop + heightDelta;
        }
        setIsLoadingMore(false);
      }, 0);
    }, 300);
  }, [currentSessionId, isLoadingMore]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMoreMessages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMoreMessages();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMoreMessages, isLoadingMore, currentSessionId, loadMoreMessages]);

  const createNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
    };
    setSessions((prev) => orderSessions([newSession, ...prev]));
    setCurrentSessionId(newSession.id);
    return newSession.id;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        createNewChat();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setIsSidebarOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setIsSidebarOpen(!isSidebarOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen, createNewChat]);

  const deleteSession = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
      }
    },
    [currentSessionId],
  );

  const handleTogglePinSession = useCallback((id: string) => {
    setSessions((prev) =>
      orderSessions(
        prev.map((session) =>
          session.id === id ? { ...session, pinned: !session.pinned } : session,
        ),
      ),
    );
  }, []);

  const handleReorderSession = useCallback(
    (sourceId: string, targetId: string) => {
      if (sourceId === targetId) return;

      setSessions((prev) => {
        const updated = [...prev];
        const sourceIndex = updated.findIndex((s) => s.id === sourceId);
        const targetIndex = updated.findIndex((s) => s.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) return prev;

        const [moved] = updated.splice(sourceIndex, 1);
        updated.splice(targetIndex, 0, moved);

        return orderSessions(updated);
      });
    },
    [],
  );

  const handleRenameSession = useCallback((id: string) => {
    setRenameSessionId(id);
  }, []);

  const handleRenameConfirm = useCallback(
    (newTitle: string) => {
      if (!renameSessionId) return;
      setSessions((prev) =>
        orderSessions(
          prev.map((session) =>
            session.id === renameSessionId
              ? {
                  ...session,
                  title: clampChatTitle(newTitle),
                  updatedAt: new Date(),
                }
              : session,
          ),
        ),
      );
      setRenameSessionId(null);
    },
    [renameSessionId],
  );

  const handleRegenerateResponse = useCallback(
    async (messageIndex: number) => {
      if (!apiKey || !currentSessionId) return;

      const actualIndex = allMessages.length - messages.length + messageIndex;
      const messagesUpToPoint = allMessages.slice(0, actualIndex);
      setIsLoading(true);
      setGeneratingSessionId(currentSessionId);
      setError(null);

      try {
        const messagesToSend = systemPhrase
          ? [
              {
                id: "system",
                role: "system" as const,
                content: systemPhrase,
                timestamp: new Date(),
              },
              ...messagesUpToPoint,
            ]
          : messagesUpToPoint;

        const newMessageId = crypto.randomUUID();
        const newMessage: Message = {
          id: newMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: [...messagesUpToPoint, newMessage],
                  updatedAt: new Date(),
                }
              : s,
          ),
        );

        let accumulatedResponse = "";
        const response = await sendMessage(
          messagesToSend,
          apiKey,
          model,
          (chunk) => {
            accumulatedResponse += chunk;
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === currentSessionId) {
                  const updatedMessages = s.messages.map((m) =>
                    m.id === newMessageId
                      ? { ...m, content: accumulatedResponse }
                      : m,
                  );
                  return {
                    ...s,
                    messages: updatedMessages,
                    updatedAt: new Date(),
                  };
                }
                return s;
              }),
            );
          },
        );

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === newMessageId ? { ...m, content: response } : m,
                  ),
                  updatedAt: new Date(),
                }
              : s,
          ),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to regenerate";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        setGeneratingSessionId(null);
      }
    },
    [apiKey, currentSessionId, allMessages, messages, model, systemPhrase],
  );

  const handleDeleteMessage = useCallback(
    (messageIndex: number) => {
      if (!currentSessionId) return;
      const actualIndex = allMessages.length - messages.length + messageIndex;
      const newMessages = allMessages.filter((_, i) => i !== actualIndex);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: newMessages, updatedAt: new Date() }
            : s,
        ),
      );
    },
    [currentSessionId, allMessages, messages],
  );

  const handleExportChat = useCallback(
    (format: "markdown" | "text" | "json") => {
      if (currentSession) {
        exportChat(currentSession, format, aiName);
      }
    },
    [currentSession, aiName],
  );

  const handleSend = useCallback(
    async (content: string, images: string[]) => {
      if (!apiKey) {
        setPendingMessage({ content, images });
        setIsSettingsOpen(true);
        return;
      }

      let sessionId = currentSessionId;
      let currentMessages = currentSessionId ? allMessages : [];
      let newSession: ChatSession | null = null;

      if (!sessionId) {
        sessionId = crypto.randomUUID();
        newSession = {
          id: sessionId,
          title: "New Chat",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          pinned: false,
        };
        currentMessages = [];
        setCurrentSessionId(sessionId);
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        images: images.length > 0 ? images : undefined,
        timestamp: new Date(),
      };

      const newMessages = [...currentMessages, userMessage];

      setSessions((prev) => {
        if (newSession) {
          const sessionWithMsg = {
            ...newSession,
            messages: [userMessage],
            updatedAt: new Date(),
          };
          return orderSessions([sessionWithMsg, ...prev]);
        }
        return orderSessions(
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: newMessages,
                  title: s.messages.length === 0 ? "New Chat" : s.title,
                  updatedAt: new Date(),
                }
              : s,
          ),
        );
      });

      if (currentMessages.length === 0) {
        generateChatTitle(content, apiKey)
          .then((aiTitle) => {
            if (aiTitle) {
              const finalTitle = clampChatTitle(aiTitle);
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === sessionId ? { ...s, title: finalTitle } : s,
                ),
              );
            }
          })
          .catch(console.error);
      }

      setIsLoading(true);
      setGeneratingSessionId(sessionId);
      setError(null);

      try {
        if (content.trim().toLowerCase().startsWith("/image")) {
          const prompt = content.trim().replace(/^\/image\s*/i, "");
          const imageUrl = await generateImage(prompt, apiKey);
          const response = `![${prompt}](${imageUrl})`;

          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: response,
            timestamp: new Date(),
          };

          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === sessionId) {
                return {
                  ...s,
                  messages: [...newMessages, assistantMessage],
                  updatedAt: new Date(),
                };
              }
              return s;
            }),
          );
        } else {
          const messagesToSend = systemPhrase
            ? [
                {
                  id: "system",
                  role: "system" as const,
                  content: systemPhrase,
                  timestamp: new Date(),
                },
                ...newMessages,
              ]
            : newMessages;

          const assistantMessageId = crypto.randomUUID();
          const assistantMessage: Message = {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
          };

          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === sessionId) {
                return {
                  ...s,
                  messages: [...newMessages, assistantMessage],
                  updatedAt: new Date(),
                };
              }
              return s;
            }),
          );

          let accumulatedResponse = "";
          const response = await sendMessage(
            messagesToSend,
            apiKey,
            model,
            (chunk) => {
              accumulatedResponse += chunk;
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id === sessionId) {
                    const updatedMessages = s.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: accumulatedResponse }
                        : m,
                    );
                    return {
                      ...s,
                      messages: updatedMessages,
                      updatedAt: new Date(),
                    };
                  }
                  return s;
                }),
              );
            },
          );

          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === sessionId) {
                const updatedMessages = s.messages.map((m) =>
                  m.id === assistantMessageId ? { ...m, content: response } : m,
                );
                return {
                  ...s,
                  messages: updatedMessages,
                  updatedAt: new Date(),
                };
              }
              return s;
            }),
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        setGeneratingSessionId(null);
      }
    },
    [apiKey, currentSessionId, allMessages, model, systemPhrase],
  );

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
          sessions={orderedSessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => {
            setCurrentSessionId(id);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          onNewChat={() => {
            createNewChat();
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          onDeleteSession={deleteSession}
          onReorderSession={handleReorderSession}
          onTogglePin={handleTogglePinSession}
          onRenameSession={handleRenameSession}
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
              title={
                isSidebarOpen
                  ? "Close sidebar (Ctrl+B)"
                  : "Open sidebar (Ctrl+B)"
              }
            >
              <PanelLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-semibold truncate">
              {currentSession?.title || siteName}
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
                  <DropdownMenuItem
                    onClick={() => handleExportChat("markdown")}
                  >
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
                    Welcome to {siteName}
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
              <div>
                {hasMoreMessages && (
                  <div ref={loadMoreRef} className="p-4 text-center">
                    {isLoadingMore ? (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm">
                          Loading older messages...
                        </span>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadMoreMessages}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Load{" "}
                        {Math.min(
                          MESSAGES_PER_PAGE,
                          allMessages.length - currentVisibleCount,
                        )}{" "}
                        older messages
                      </Button>
                    )}
                  </div>
                )}
                {messages.map((message, index) => {
                  const isLastMessage = index === messages.length - 1;
                  const isLoadingAssistantMessage =
                    isLastMessage &&
                    message.role === "assistant" &&
                    isLoading &&
                    !message.content;

                  if (isLoadingAssistantMessage) {
                    return null;
                  }

                  return (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onRegenerate={
                        message.role === "assistant" &&
                        index === messages.length - 1
                          ? () => handleRegenerateResponse(index)
                          : undefined
                      }
                      onDelete={() => handleDeleteMessage(index)}
                      isSidebarOpen={isSidebarOpen}
                    />
                  );
                })}
              </div>
            )}
            {isLoading &&
              generatingSessionId === currentSessionId &&
              (!messages.length ||
                messages[messages.length - 1].role !== "assistant" ||
                !messages[messages.length - 1].content) && (
                <div className="group w-full p-4">
                  <div
                    className={`max-w-full w-full mx-auto lg:pr-48 ${
                      !isSidebarOpen ? "md:max-w-7xl" : "md:max-w-6xl"
                    }`}
                  >
                    <div className="w-full space-y-2 min-w-0">
                      <div className="prose prose-sm dark:prose-invert inline-block w-fit md:max-w-[90%] max-w-[92vw] leading-relaxed wrap-break-word px-4 py-3 rounded-[20px] rounded-bl-none shadow-sm bg-secondary text-secondary-foreground">
                        <div
                          className="flex items-center gap-1 min-h-5"
                          aria-label="Assistant is typing"
                        >
                          {Array.from({ length: 3 }).map((_, index) => (
                            <span
                              key={index}
                              className="typing-dot animate-typing-dot"
                              style={{ animationDelay: `${index * 0.15}s` }}
                            />
                          ))}
                          <span className="sr-only">Assistant is typing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </ScrollArea>

        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          placeholder={`Ask ${aiName}`}
        />
      </div>
      {renameSessionId && (
        <RenameDialog
          open={!!renameSessionId}
          onOpenChange={(open) => !open && setRenameSessionId(null)}
          currentTitle={
            sessions.find((s) => s.id === renameSessionId)?.title || ""
          }
          onRename={handleRenameConfirm}
        />
      )}
    </div>
  );
}
