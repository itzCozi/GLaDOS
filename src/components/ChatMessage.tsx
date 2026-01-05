import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'
import { User, Bot, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  
  const getTextContent = (): string => {
    if (typeof message.content === 'string') {
      return message.content
    }
    return message.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('')
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(getTextContent())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'group flex gap-3 px-4 py-6',
        isUser ? 'bg-transparent' : 'bg-muted/30'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? 'You' : 'GLaDOS'}
          </span>
          {!isUser && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Attached image ${idx + 1}`}
                className="max-w-xs max-h-48 rounded-lg border border-border"
              />
            ))}
          </div>
        )}
        
        <div className="markdown-content text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '')
                const isInline = !match
                
                if (isInline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
                
                return (
                  <div className="relative">
                    <div className="absolute top-2 right-2 text-xs text-muted-foreground">
                      {match?.[1]}
                    </div>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </div>
                )
              }
            }}
          >
            {getTextContent()}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
