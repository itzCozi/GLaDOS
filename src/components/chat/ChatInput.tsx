import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  ImagePlus,
  X,
  Loader2,
  FileText,
  Paperclip,
  Sparkles,
  Upload,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string, images: string[]) => void;
  isLoading: boolean;
  disabled?: boolean;
  initialPrompt?: string;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  disabled,
  initialPrompt,
  placeholder,
}: ChatInputProps) {
  const [input, setInput] = useState(initialPrompt || "");
  const [images, setImages] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{ name: string; content: string; type: string }>
  >([]);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      textareaRef.current?.focus();
    }
  }, [initialPrompt]);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  }, [input]);

  const handleSubmit = useCallback(() => {
    if (
      (!input.trim() && images.length === 0 && attachedFiles.length === 0) ||
      isLoading ||
      disabled
    )
      return;

    let finalMessage = input;
    if (attachedFiles.length > 0) {
      finalMessage +=
        "\n\n" +
        attachedFiles
          .map((f) => `**${f.name}**:\n\`\`\`\n${f.content}\n\`\`\``)
          .join("\n\n");
    }

    onSend(finalMessage, images);
    setInput("");
    setImages([]);
    setAttachedFiles([]);
    textareaRef.current?.focus();
  }, [input, images, attachedFiles, isLoading, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setImages((prev) => [...prev, base64]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setImages((prev) => [...prev, base64]);
          };
          reader.readAsDataURL(file);
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
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            setAttachedFiles((prev) => [
              ...prev,
              { name: file.name, content, type: file.type },
            ]);
          };
          reader.readAsText(file);
        }
      });
      e.target.value = "";
    },
    [],
  );

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  {/* Mobile padding for PWA */}
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-backdrop-filter:backdrop-blur border-t border-border px-3 py-3 md:px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.7rem)] md:pb-3">
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
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {attachedFiles.map((file, index) => (
            <div
              key={`file-${index}`}
              className="relative group flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted"
            >
              <FileText className="h-4 w-4" />
              <span className="text-sm truncate max-w-37.5">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded-full transition-colors duration-200 flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative flex items-center w-full p-2 border rounded-xl bg-muted/50 focus-within:ring-1 focus-within:ring-ring gap-2">
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

        <div className="flex shrink-0 gap-1">
          <div className="hidden sm:flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsImageDialogOpen(true)}
              disabled={disabled}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Attach files (code, text, markdown)"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileActionsOpen(true)}
            disabled={disabled}
            className="h-8 w-8 sm:hidden text-muted-foreground hover:text-foreground"
            title="More actions"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "min-h-8 max-h-35 w-full resize-none border-0 bg-transparent px-2 py-1 shadow-none focus-visible:ring-0 text-base md:text-sm",
          )}
          rows={1}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSubmit}
          disabled={
            (!input.trim() &&
              images.length === 0 &&
              attachedFiles.length === 0) ||
            isLoading ||
            disabled
          }
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Add Image</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-14"
              onClick={() => {
                setIsImageDialogOpen(false);
                imageInputRef.current?.click();
              }}
            >
              <Upload className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Upload Image</span>
                <span className="text-xs text-muted-foreground">
                  Select directly from your device
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-14"
              onClick={() => {
                setIsImageDialogOpen(false);
                const prefix = "/image ";
                if (!input.startsWith(prefix)) {
                  setInput(prefix + input);
                }
                setTimeout(() => textareaRef.current?.focus(), 0);
              }}
            >
              <Sparkles className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Generate Image</span>
                <span className="text-xs text-muted-foreground">
                  Create a new image with AI
                </span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMobileActionsOpen} onOpenChange={setIsMobileActionsOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-left">Actions</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-3">
            <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-12"
              onClick={() => {
                setIsMobileActionsOpen(false);
                fileInputRef.current?.click();
              }}
            >
              <Paperclip className="h-5 w-5" />
              <span className="font-medium">Upload File</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-12"
              onClick={() => {
                setIsMobileActionsOpen(false);
                imageInputRef.current?.click();
              }}
            >
              <ImagePlus className="h-5 w-5" />
              <span className="font-medium">Upload Image</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-12"
              onClick={() => {
                setIsMobileActionsOpen(false);
                const prefix = "/image ";
                if (!input.startsWith(prefix)) {
                  setInput(prefix + input);
                }
                setTimeout(() => textareaRef.current?.focus(), 0);
              }}
            >
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">Create Image</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
