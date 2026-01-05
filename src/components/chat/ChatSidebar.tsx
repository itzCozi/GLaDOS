import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatSession } from "@/types/chat"
import { Plus, MessageSquare, Trash2, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSelectSession: (id: string) => void
  onNewChat: () => void
  onDeleteSession: (id: string, e: React.MouseEvent) => void
  onClose?: () => void
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClose,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSessions = searchQuery
    ? sessions.filter(
        (session) =>
          session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.messages.some((msg) =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : sessions

  return (
    <div className="w-full md:w-[260px] flex flex-col h-full bg-background md:bg-muted/30 border-r border-border absolute z-50 md:relative md:z-0">
      <div className="flex items-center justify-between p-4 pb-2 md:hidden">
        <h2 className="font-semibold text-lg">Chats</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-4 py-2">
        <div className="space-y-2 pb-4">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground",
                currentSessionId === session.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">{session.title}</span>
              </div>
              <Button
                variant="link"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:cursor-pointer"
                onClick={(e) => onDeleteSession(session.id, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {filteredSessions.length === 0 && searchQuery && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No chats found for "{searchQuery}"
            </div>
          )}
          
          {sessions.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No chats yet
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 h-11.5"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
    </div>
  )
}
