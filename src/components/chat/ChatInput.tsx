import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, ImagePlus, X, Loader2, FileText, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string, images: string[]) => void
  isLoading: boolean
  disabled?: boolean
  initialPrompt?: string
}

export function ChatInput({ onSend, isLoading, disabled, initialPrompt }: ChatInputProps) {
  const [input, setInput] = useState(initialPrompt || "")
  const [images, setImages] = useState<string[]>([])
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; content: string; type: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (initialPrompt) {
      textareaRef.current?.focus()
    }
  }, [initialPrompt])

  const handleSubmit = useCallback(() => {
    if ((!input.trim() && images.length === 0 && attachedFiles.length === 0) || isLoading || disabled) return
    
    let finalMessage = input
    if (attachedFiles.length > 0) {
      finalMessage += "\n\n" + attachedFiles.map(f => `**${f.name}**:\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n")
    }
    
    onSend(finalMessage, images)
    setInput("")
    setImages([])
    setAttachedFiles([])
    textareaRef.current?.focus()
  }, [input, images, attachedFiles, isLoading, disabled, onSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith("image/")) {
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
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return

      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            setImages((prev) => [...prev, base64])
          }
          reader.readAsDataURL(file)
        } else if (
          file.type === "text/plain" ||
          file.type === "application/json" ||
          file.type === "text/markdown" ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".json") ||
          file.name.endsWith(".js") ||
          file.name.endsWith(".ts") ||
          file.name.endsWith(".jsx") ||
          file.name.endsWith(".tsx") ||
          file.name.endsWith(".py") ||
          file.name.endsWith(".java") ||
          file.name.endsWith(".cpp") ||
          file.name.endsWith(".c") ||
          file.name.endsWith(".html") ||
          file.name.endsWith(".css")
        ) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const content = event.target?.result as string
            setAttachedFiles((prev) => [
              ...prev,
              { name: file.name, content, type: file.type },
            ])
          }
          reader.readAsText(file)
        }
      })
      e.target.value = ""
    },
    []
  )

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <div className="bg-background p-4">
      {(images.length > 0 || attachedFiles.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((image, index) => (
            <div key={`img-${index}`} className="relative group">
              <img
                src={image}
                alt={`Attached ${index + 1}`}
                className="h-16 w-16 object-cover rounded-lg border border-border"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {attachedFiles.map((file, index) => (
            <div key={`file-${index}`} className="relative group flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted">
              <FileText className="h-4 w-4" />
              <span className="text-sm truncate max-w-37.5">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded-full transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-center">
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          multiple
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".txt,.md,.json,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,text/*"
          multiple
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled}
          className="shrink-0 h-11 w-11"
          title="Attach images"
        >
          <ImagePlus className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="shrink-0 h-11 w-11"
          title="Attach files (code, text, markdown)"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask GLaDOS"
          disabled={disabled}
          className={cn(
            "min-h-11 max-h-50 resize-none py-3 flex-1",
            "focus-visible:ring-1"
          )}
          rows={1}
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={
            (!input.trim() && images.length === 0 && attachedFiles.length === 0) || isLoading || disabled
          }
          className="h-11"
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
