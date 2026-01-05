import { useState } from 'react'
import { Settings as SettingsIcon, X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SettingsProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
  model: string
  onModelChange: (model: string) => void
}

const AVAILABLE_MODELS = [
  { id: 'grok-2-vision-latest', name: 'Grok 2 Vision (Latest)' },
  { id: 'grok-2-latest', name: 'Grok 2 (Latest)' },
  { id: 'grok-3-latest', name: 'Grok 3 (Latest)' },
  { id: 'grok-3-mini', name: 'Grok 3 Mini' },
]

export function Settings({ apiKey, onApiKeyChange, model, onModelChange }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [localKey, setLocalKey] = useState(apiKey)

  const handleSave = () => {
    onApiKeyChange(localKey)
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 z-10"
        title="Settings"
      >
        <SettingsIcon className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Grok API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="xai-..."
                className="w-full px-3 py-2 pr-10 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Get your API key from{' '}
              <a
                href="https://console.x.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                console.x.ai
              </a>
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
