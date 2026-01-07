import { createContext, useContext } from 'react';

interface Settings {
  apiKey: string;
  model: string;
  systemPhrase: string;
  aiName: string;
  siteName: string;
}

interface SettingsContextType extends Settings {
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setSystemPhrase: (phrase: string) => void;
  setAiName: (name: string) => void;
  setSiteName: (name: string) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export type { Settings, SettingsContextType };
