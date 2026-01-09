import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/use-theme";
import {
  Copy,
  Check,
  RotateCw,
  Trash2,
  Pencil,
  X as XIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onEdit?: (newContent: string) => void;
  isSidebarOpen?: boolean;
}

export function ChatMessage({
  message,
  onRegenerate,
  onDelete,
  onEdit,
  isSidebarOpen = true,
}: ChatMessageProps) {
  const { theme } = useTheme();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isUser = message.role === "user";

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  return (
    <div className="group w-full p-2 md:p-4">
      <div
        className={cn(
          "max-w-full flex items-start gap-2 w-full mx-auto",
          !isSidebarOpen ? "md:max-w-7xl" : "md:max-w-6xl",
          isUser ? "flex-row-reverse lg:pl-48" : "lg:pr-48",
        )}
      >
        <div
          className={cn(
            "flex-1 space-y-2 min-w-0 flex flex-col",
            isUser ? "items-end" : "items-start",
          )}
        >
          {isEditing ? (
            <div className="w-full max-w-3xl space-y-2 p-2 rounded-lg bg-secondary/30">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] w-full bg-background text-foreground resize-y dark:border-white/20"
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                >
                  <XIcon className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    onEdit?.(editContent);
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save & Branch
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "prose prose-sm w-fit md:max-w-[90%] max-w-[92vw] leading-relaxed wrap-break-word px-4 py-3 rounded-[20px]",
                isUser
                  ? "rounded-br-sm prose-invert bg-linear-to-b from-blue-500 to-blue-700 bg-fixed text-white selection:bg-white/30 selection:text-white"
                  : "rounded-bl-sm dark:prose-invert bg-secondary dark:bg-secondary/80 text-secondary-foreground",
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline =
                      !className && !String(children).includes("\n");
                    const codeString = String(children).replace(/\n$/, "");

                    if (isInline) {
                      return (
                        <code
                          className={cn(
                            "rounded px-1.5 py-0.5 font-mono text-sm",
                            isUser ? "bg-white/20 text-white" : "bg-primary/5",
                          )}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <div className="relative group w-full min-w-0 my-4">
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => handleCopyCode(codeString)}
                            className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground transition duration-200"
                            title="Copy code"
                          >
                            {copiedCode === codeString ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={
                            theme === "dark" ||
                            (theme === "system" &&
                              typeof window !== "undefined" &&
                              window.matchMedia("(prefers-color-scheme: dark)")
                                .matches)
                              ? vscDarkPlus
                              : vs
                          }
                          language={match ? match[1] : "text"}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                            padding: "0.85rem 1rem",
                            overflowX: "auto",
                            maxWidth: "100%",
                            backgroundColor:
                              theme === "dark" ||
                              (theme === "system" &&
                                window.matchMedia(
                                  "(prefers-color-scheme: dark)",
                                ).matches)
                                ? "#181818"
                                : "#ffffff",
                          }}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    );
                  },
                  pre({ children }) {
                    return <>{children}</>;
                  },
                  p({ children }) {
                    return <p className="mb-2 last:mb-0">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-4 mb-2">{children}</ul>;
                  },
                  ol({ children }) {
                    return (
                      <ol className="list-decimal pl-4 mb-2">{children}</ol>
                    );
                  },
                  li({ children }) {
                    return <li className="mb-1">{children}</li>;
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "hover:underline font-medium",
                          isUser
                            ? "text-white underline decoration-white/30"
                            : "text-primary",
                        )}
                      >
                        {children}
                      </a>
                    );
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote
                        className={cn(
                          "border-l-4 pl-4 italic",
                          isUser
                            ? "border-white/30 text-white/90"
                            : "border-primary/20 text-muted-foreground",
                        )}
                      >
                        {children}
                      </blockquote>
                    );
                  },
                  table({ children }) {
                    return (
                      <div
                        className={cn(
                          "my-4 w-full overflow-x-auto rounded-lg border",
                          isUser ? "border-white/20" : "border-primary/10",
                        )}
                      >
                        <table className="w-full border-collapse border-none">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th
                        className={cn(
                          "border-r border-b px-3 py-2 font-semibold last:border-r-0",
                          isUser
                            ? "border-white/20 bg-white/10 text-white"
                            : "border-primary/10 bg-primary/5 text-foreground",
                        )}
                      >
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td
                        className={cn(
                          "border-r px-3 py-2 last:border-r-0",
                          isUser
                            ? "border-white/20 text-white/90"
                            : "border-primary/10 text-foreground",
                        )}
                      >
                        {children}
                      </td>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Attached image ${index + 1}`}
                  className="max-w-[min(100%,20rem)] max-h-48 rounded-lg object-cover border border-border"
                />
              ))}
            </div>
          )}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyMessage}
              title="Copy message"
              className="h-8 px-2"
            >
              {copiedMessage ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            {isUser && onEdit && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditContent(message.content);
                  setIsEditing(true);
                }}
                title="Edit message"
                className="h-8 px-2"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {!isUser && onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                title="Regenerate response"
                className="h-8 px-2"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                title="Delete message"
                className="h-8 px-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {!isUser && message.cost !== undefined && message.cost > 0 && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground ml-2">
                <span
                  title="Estimated cost"
                  className="flex items-center gap-0.5"
                >
                  ${message.cost.toFixed(5)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
