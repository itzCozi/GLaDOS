import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PROVIDER_INFO, PROVIDER_MODELS } from '../../types/providers';
import { useSettings } from '@/lib/settings-store';

interface SettingsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({
  open: propOpen,
  onOpenChange: propOnOpenChange,
}: SettingsDialogProps) {
  const {
    apiKey,
    setApiKey,
    model,
    setModel,
    systemPhrase,
    setSystemPhrase,
    aiName,
    setAiName,
    siteName,
    setSiteName,
  } = useSettings();

  const [internalOpen, setInternalOpen] = useState(false);

  const open = propOpen ?? internalOpen;
  const setOpen = (newOpen: boolean) => {
    setInternalOpen(newOpen);
    propOnOpenChange?.(newOpen);
  };

  const providerInfo = PROVIDER_INFO['grok'];
  const availableModels = PROVIDER_MODELS['grok'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">Settings</DialogTitle>
          <DialogDescription className="text-left">
            Configure your {siteName} experience.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="api" className="w-full">
          <TabsList className="flex w-full h-auto overflow-x-auto justify-start p-1 gap-1">
            <TabsTrigger value="api" className="flex-1 min-w-fit">
              API Key
            </TabsTrigger>
            <TabsTrigger value="model" className="flex-1 min-w-fit">
              Model
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex-1 min-w-fit">
              Branding
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex-1 min-w-fit">
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">AI Name</label>
              <input
                type="text"
                value={aiName}
                onChange={(e) => setAiName(e.target.value)}
                placeholder="GLaDOS"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="GLaDOS"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Grok API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your Grok API key`}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Get your API key from{' '}
                <a
                  href={providerInfo.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  xAI
                </a>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="model" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Model
              </label>
              {(() => {
                const displayModels = availableModels;
                const isCustom = !displayModels.includes(model);

                return (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          {model || 'Select a model'}
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="max-h-75 overflow-y-auto min-w-(--radix-dropdown-menu-trigger-width) w-full">
                        <DropdownMenuRadioGroup
                          value={isCustom ? 'custom_option' : model}
                          onValueChange={(val) => {
                            if (val === 'custom_option') {
                              setModel('');
                            } else {
                              setModel(val);
                            }
                          }}
                        >
                          {displayModels.map((m) => (
                            <DropdownMenuRadioItem key={m} value={m}>
                              {m}
                            </DropdownMenuRadioItem>
                          ))}
                          <DropdownMenuRadioItem value="custom_option">
                            Custom Model...
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {isCustom && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          placeholder="Enter specific model ID"
                          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    )}
                  </>
                );
              })()}
              <p className="text-xs text-muted-foreground mt-2">
                Choose the model that best fits your needs
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <div className="space-y-4">
              {setSystemPhrase && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    System Phrase
                  </label>
                  <textarea
                    value={systemPhrase}
                    onChange={(e) => setSystemPhrase(e.target.value)}
                    placeholder={`You are ${aiName}, a sarcastic AI...`}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-25"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Instructions for how the AI should behave.
                  </p>
                </div>
              )}
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
                  Higher values make output more creative, lower values more
                  focused
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
