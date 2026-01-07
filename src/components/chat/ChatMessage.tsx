import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import {
  Copy,
  Check,
  User,
  Terminal,
  RotateCw,
  Edit2,
  Trash2,
  Volume2,
  Square,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
}

export function ChatMessage({
  message,
  onRegenerate,
  onEdit,
  onDelete,
}: ChatMessageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = message.role === 'user';

  const handleReadAloud = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.content);
    const voices = window.speechSynthesis.getVoices();

    // Attempt to find a voice that fits GLaDOS
    const preferredVoice = voices.find(
      (v) =>
        v.name.includes('Google US English') ||
        v.name.includes('Zira') ||
        v.name.includes('Samantha'),
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Pitch and rate adjustments for GLaDOS-like effect
    utterance.pitch = 1.25;
    utterance.rate = 0.9;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

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

  const handleEditSubmit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(editContent);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div className="group w-full p-4">
      <div className="max-w-full flex gap-3 w-full lg:pr-[12rem]">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
            isUser
              ? 'bg-background text-foreground'
              : 'bg-primary text-primary-foreground',
          )}
        >
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Terminal className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-25 p-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEditSubmit}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleEditCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'prose prose-sm dark:prose-invert inline-block w-fit max-w-[85%] leading-relaxed wrap-break-word p-4 rounded-2xl shadow-sm',
                isUser
                  ? 'bg-muted text-foreground'
                  : 'bg-card text-card-foreground border',
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline =
                      !className && !String(children).includes('\n');
                    const codeString = String(children).replace(/\n$/, '');

                    if (isInline) {
                      return (
                        <code
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <div className="relative group">
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => handleCopyCode(codeString)}
                            className="p-1.5 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors duration-200"
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
                          style={oneDark}
                          language={match ? match[1] : 'text'}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
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
                        className="text-primary hover:underline"
                      >
                        {children}
                      </a>
                    );
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic">
                        {children}
                      </blockquote>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto">
                        <table className="border-collapse border border-border">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="border border-border px-3 py-2 bg-muted font-semibold">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="border border-border px-3 py-2">
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
          {message.images && message.images.length > 0 && !isEditing && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Attached image ${index + 1}`}
                  className="max-w-xs max-h-48 rounded-lg object-cover border border-border"
                />
              ))}
            </div>
          )}
          {!isEditing && (
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
              {!isUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReadAloud}
                  title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                  className="h-8 px-2"
                >
                  {isSpeaking ? (
                    <Square className="h-4 w-4 fill-current" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
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
              {isUser && onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  title="Edit message"
                  className="h-8 px-2"
                >
                  <Edit2 className="h-4 w-4" />
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
