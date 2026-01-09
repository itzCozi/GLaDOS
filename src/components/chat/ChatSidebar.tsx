import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatSession } from "@/types/chat";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onReorderSession?: (sourceId: string, targetId: string) => void;
  onReorderSessions?: (sourceIds: string[], targetId: string) => void;
  onTogglePin?: (id: string) => void;
  onRenameSession?: (id: string) => void;
  onDeleteSessions?: (ids: string[]) => void;
  onTogglePinSessions?: (ids: string[], pin: boolean) => void;
  onClose?: () => void;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onReorderSession,
  onReorderSessions,
  onTogglePin,
  onRenameSession,
  onDeleteSessions,
  onTogglePinSessions,
  onClose,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionRect, setSelectionRect] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const dragEnabled = !searchQuery && !selectionRect;

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest('[role="menuitem"]') ||
      target.closest(".drag-handle")
    ) {
      return;
    }

    const chatItem = target.closest(".chat-session-item");
    if (chatItem) {
      const id = chatItem.getAttribute("data-id");
      if (id) {
        if (selectedIds.has(id) && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          return;
        }

        return;
      }
    }

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectionRect({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });

    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      setSelectedIds(new Set());
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!selectionRect || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectionRect((prev) =>
      prev ? { ...prev, currentX: x, currentY: y } : null,
    );

    const selectionBox = {
      left: Math.min(selectionRect.startX, x),
      top: Math.min(selectionRect.startY, y),
      width: Math.abs(x - selectionRect.startX),
      height: Math.abs(y - selectionRect.startY),
    };

    const currentSelectionFromBox = new Set<string>();
    container.querySelectorAll(".chat-session-item").forEach((item) => {
      const itemRect = (item as HTMLElement).getBoundingClientRect();
      const relativeItemTop = itemRect.top - rect.top;
      const relativeItemLeft = itemRect.left - rect.left;

      if (
        selectionBox.left < relativeItemLeft + itemRect.width &&
        selectionBox.left + selectionBox.width > relativeItemLeft &&
        selectionBox.top < relativeItemTop + itemRect.height &&
        selectionBox.top + selectionBox.height > relativeItemTop
      ) {
        currentSelectionFromBox.add(item.getAttribute("data-id") || "");
      }
    });

    if (e.ctrlKey || e.metaKey) {
      const merged = new Set(selectedIds);
      currentSelectionFromBox.forEach((id) => merged.add(id));
      setSelectedIds(merged);
    } else {
      setSelectedIds(currentSelectionFromBox);
    }
  };

  const handlePointerUp = () => {
    setSelectionRect(null);
  };

  useEffect(() => {
    if (selectionRect) {
      window.addEventListener("pointerup", handlePointerUp);
      return () => window.removeEventListener("pointerup", handlePointerUp);
    }
  }, [selectionRect]);

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

    if (selectedIds.has(draggingId)) {
      if (selectedIds.has(id)) {
        setDragOverId(null);
        setDraggingId(null);
        return;
      }
      onReorderSessions?.(Array.from(selectedIds), id);
    } else {
      onReorderSession?.(draggingId, id);
    }

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
    <div className="w-full md:w-72 flex flex-col h-full bg-background md:bg-muted/30 md:border-r border-border absolute z-50 md:relative md:z-0">
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
      <ScrollArea
        className="flex-1 px-4 py-2 select-none relative"
        ref={scrollAreaRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <div ref={containerRef} className="space-y-2 pb-4 min-h-full">
          {selectionRect && (
            <div
              className="absolute bg-primary/20 border border-primary z-50 pointer-events-none"
              style={{
                left: Math.min(selectionRect.startX, selectionRect.currentX),
                top: Math.min(selectionRect.startY, selectionRect.currentY),
                width: Math.abs(selectionRect.currentX - selectionRect.startX),
                height: Math.abs(selectionRect.currentY - selectionRect.startY),
              }}
            />
          )}

          {filteredSessions.map((session) => (
            <div
              key={session.id}
              data-id={session.id}
              className={cn(
                "group chat-session-item flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors duration-200 cursor-pointer hover:bg-accent hover:text-accent-foreground border border-transparent select-none relative",
                currentSessionId === session.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
                draggingId === session.id ? "opacity-70 cursor-grabbing" : "",
                dragOverId === session.id
                  ? "border-primary/60 bg-accent/60"
                  : "",
                selectedIds.has(session.id)
                  ? "bg-accent/50 border-primary/20"
                  : "",
              )}
              title={session.title}
              onClick={(e) => {
                if (
                  selectionRect &&
                  (Math.abs(selectionRect.currentX - selectionRect.startX) >
                    5 ||
                    Math.abs(selectionRect.currentY - selectionRect.startY) > 5)
                ) {
                  return;
                }
                if (e.ctrlKey || e.metaKey) {
                  const next = new Set(selectedIds);
                  if (next.has(session.id)) next.delete(session.id);
                  else next.add(session.id);
                  setSelectedIds(next);
                } else if (e.shiftKey) {
                  const next = new Set(selectedIds);
                  next.add(session.id);
                  setSelectedIds(next);
                } else {
                  if (selectedIds.size > 0 && !selectedIds.has(session.id)) {
                    setSelectedIds(new Set());
                  } else if (
                    selectedIds.size > 0 &&
                    selectedIds.has(session.id)
                  ) {
                    setSelectedIds(new Set());
                  }
                  onSelectSession(session.id);
                }
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(session.id, e)}
              onDragEnd={handleDragEnd}
              onDragEnter={(e) => handleDragEnter(session.id, e)}
              draggable={dragEnabled}
              onDragStart={() => {
                handleDragStart(session.id);
              }}
            >
              <div className="flex-1 flex items-center gap-2 min-w-0 pointer-events-none pl-1">
                {session.pinned ? (
                  <Pin className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <MessageSquare className="h-4 w-4 shrink-0" />
                )}
                <span className="">{session.title}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="link"
                    size="icon"
                    className="h-8 w-8 shrink-0 hover:cursor-pointer opacity-70 hover:opacity-100 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
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
                    {session.pinned ? "Unpin" : "Pin"}
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
        {selectedIds.size > 0 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              className="flex-1 h-10"
              onClick={() => {
                onDeleteSessions?.(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}
              disabled={selectedIds.size === 0}
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              className="flex-1 h-10"
              onClick={() => {
                const allSelectedArePinned = sessions
                  .filter((s) => selectedIds.has(s.id))
                  .every((s) => s.pinned);
                onTogglePinSessions?.(
                  Array.from(selectedIds),
                  !allSelectedArePinned,
                );
                setSelectedIds(new Set());
              }}
              disabled={selectedIds.size === 0}
            >
              {sessions.filter((s) => selectedIds.has(s.id)).length > 0 &&
              sessions
                .filter((s) => selectedIds.has(s.id))
                .every((s) => s.pinned)
                ? "Unpin"
                : "Pin"}{" "}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={onNewChat}
              className="w-full justify-start gap-2 h-11.5"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
