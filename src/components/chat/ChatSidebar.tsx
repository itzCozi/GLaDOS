import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatSession } from '@/types/chat';
import {
  Plus,
  MessageSquare,
  Trash2,
  X,
  Search,
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onReorderSession?: (sourceId: string, targetId: string) => void;
  onTogglePin?: (id: string) => void;
  onRenameSession?: (id: string) => void;
  onClose?: () => void;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onReorderSession,
  onTogglePin,
  onRenameSession,
  onClose,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const dragEnabled = !searchQuery;

  const filteredSessions = useMemo(() => {
    const prioritizePinned = (list: ChatSession[]) => {
      const pinned = list.filter((session) => session.pinned);
      const unpinned = list.filter((session) => !session.pinned);
      return [...pinned, ...unpinned];
    };

    if (!searchQuery) {
      return prioritizePinned(sessions);
    }

    const lowerQuery = searchQuery.toLowerCase();

    const sorted = sessions
      .filter((session) => {
        return (
          session.title.toLowerCase().includes(lowerQuery) ||
          session.messages.some((msg) =>
            msg.content.toLowerCase().includes(lowerQuery),
          )
        );
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();

        const getScore = (title: string) => {
          if (title === lowerQuery) return 3;
          if (title.startsWith(lowerQuery)) return 2;
          if (title.includes(lowerQuery)) return 1;
          return 0;
        };

        const scoreA = getScore(aTitle);
        const scoreB = getScore(bTitle);

        if (scoreA !== scoreB) return scoreB - scoreA;

        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });

    return prioritizePinned(sorted);
  }, [sessions, searchQuery]);

  const handleDragStart = (id: string) => {
    if (!dragEnabled) return;
    setDraggingId(id);
  };

  const handleDragEnter = (id: string, e: React.DragEvent<HTMLDivElement>) => {
    if (!dragEnabled || !draggingId || id === draggingId) return;
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = (id: string, e: React.DragEvent<HTMLDivElement>) => {
    if (!dragEnabled || !draggingId || id === draggingId) return;
    e.preventDefault();
    onReorderSession?.(draggingId, id);
    setDragOverId(null);
    setDraggingId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragEnabled) {
      e.preventDefault();
    }
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    setDraggingId(null);
  };

  return (
    <div className="w-full md:w-72 flex flex-col h-full bg-background md:bg-muted/30 border-r border-border absolute z-50 md:relative md:z-0">
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
              draggable={dragEnabled}
              onDragStart={() => handleDragStart(session.id)}
              onDragEnter={(e) => handleDragEnter(session.id, e)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(session.id, e)}
              onDragEnd={handleDragEnd}
              className={cn(
                'group flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors duration-200 cursor-pointer hover:bg-accent hover:text-accent-foreground border border-transparent',
                currentSessionId === session.id
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground',
                draggingId === session.id ? 'opacity-70 cursor-grabbing' : '',
                dragOverId === session.id
                  ? 'border-primary/60 bg-accent/60'
                  : '',
                !dragEnabled ? 'cursor-default' : '',
              )}
              title={session.title}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex-1 flex items-center gap-2 min-w-0">
                {session.pinned ? (
                  <Pin className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <MessageSquare className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">{session.title}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="link"
                    size="icon"
                    className="h-8 w-8 shrink-0 hover:cursor-pointer opacity-70 hover:opacity-100 transition-all duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameSession?.(session.id);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin?.(session.id);
                    }}
                  >
                    {session.pinned ? (
                      <PinOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Pin className="h-4 w-4 mr-2" />
                    )}
                    {session.pinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id, e);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
  );
}
