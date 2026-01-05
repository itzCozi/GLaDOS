import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings } from "lucide-react"
import type { AIProvider } from "@/types/providers"
import { PROVIDER_INFO, PROVIDER_MODELS } from "@/types/providers"

interface SettingsDialogProps {
  provider: AIProvider
  setProvider: (provider: AIProvider) => void
  apiKeys: Record<string, string>
  setApiKeys: (apiKeys: Record<string, string>) => void
  model: string
  setModel: (model: string) => void
  azureEndpoint: string
  setAzureEndpoint: (endpoint: string) => void
  ollamaEndpoint: string
  setOllamaEndpoint: (endpoint: string) => void
}

export function SettingsDialog({
  provider,
  setProvider,
  apiKeys,
  setApiKeys,
  model,
  setModel,
  azureEndpoint,
  setAzureEndpoint,
  ollamaEndpoint,
  setOllamaEndpoint,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  
  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider)
    // Set default model for the new provider
    const defaultModel = PROVIDER_MODELS[newProvider][0]
    if (defaultModel) {
      setModel(defaultModel)
    }
  }
  
  const handleApiKeyChange = (value: string) => {
    setApiKeys({ ...apiKeys, [provider]: value })
  }
  
  const currentApiKey = apiKeys[provider] || ""
  const providerInfo = PROVIDER_INFO[provider]
  const availableModels = PROVIDER_MODELS[provider]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your GLaDOS chat experience
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="provider" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="provider">Provider</TabsTrigger>
            <TabsTrigger value="api">API Key</TabsTrigger>
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="provider" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                AI Provider
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google AI (Gemini)</option>
                <option value="grok">xAI (Grok)</option>
                <option value="azure">Azure OpenAI</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                {providerInfo.description}
              </p>
            </div>
            
            {provider === "azure" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Azure Endpoint
                </label>
                <input
                  type="text"
                  value={azureEndpoint}
                  onChange={(e) => setAzureEndpoint(e.target.value)}
                  placeholder="https://your-resource.openai.azure.com"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Your Azure OpenAI resource endpoint
                </p>
              </div>
            )}
            
            {provider === "ollama" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ollama Endpoint
                </label>
                <input
                  type="text"
                  value={ollamaEndpoint}
                  onChange={(e) => setOllamaEndpoint(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Your local Ollama server URL
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="api" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {providerInfo.name} API Key
              </label>
              {providerInfo.requiresApiKey ? (
                <>
                  <input
                    type="password"
                    value={currentApiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder={`Enter your ${providerInfo.name} API key`}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Get your API key from{" "}
                    <a
                      href={providerInfo.apiKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {providerInfo.name}
                    </a>
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No API key required for {providerInfo.name}
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="model" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Choose the model that best fits your needs
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Response Style
                </label>
                <select className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="balanced">Balanced</option>
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="creative">Creative</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Temperature (Creativity)
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  defaultValue="1"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher values make output more creative, lower values more focused
                </p>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Enable Code Syntax Highlighting
                </label>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Auto-scroll to New Messages
                </label>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
