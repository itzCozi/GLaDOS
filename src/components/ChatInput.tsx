import { useState, useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Send, Image, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string, images: string[]) => void
  isLoading: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [images, setImages] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = useCallback(() => {
    if ((!input.trim() && images.length === 0) || isLoading) return
    onSend(input.trim(), images)
    setInput('')
    setImages([])
  }, [input, images, isLoading, onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            setImages((prev) => [...prev, base64])
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          setImages((prev) => [...prev, base64])
        }
        reader.readAsDataURL(file)
      }
    })
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="border-t border-border bg-background p-4">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={img}
                alt={`Attachment ${idx + 1}`}
                className="h-16 w-16 object-cover rounded-lg border border-border"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Send a message... (Shift+Enter for new line, paste images)"
            className={cn(
              "min-h-[44px] max-h-[200px] pr-10",
              disabled && "opacity-50"
            )}
            disabled={disabled || isLoading}
            rows={1}
            style={{
              height: 'auto',
              minHeight: '44px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = `${Math.min(target.scrollHeight, 200)}px`
            }}
          />
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading}
          title="Attach image"
        >
          <Image className="h-5 w-5" />
        </Button>
        
        <Button
          onClick={handleSend}
          disabled={disabled || isLoading || (!input.trim() && images.length === 0)}
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
