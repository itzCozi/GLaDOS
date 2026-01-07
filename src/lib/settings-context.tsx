import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { SettingsContext } from './settings-store';

const STORAGE_KEYS = {
  API_KEY: 'glados-api-key',
  MODEL: 'glados-model',
  SYSTEM_PHRASE: 'glados-system-phrase',
  AI_NAME: 'glados-ai-name',
  SITE_NAME: 'glados-site-name',
};

const DEFAULTS = {
  MODEL: 'grok-3-mini',
  AI_NAME: 'GLaDOS',
  SITE_NAME: 'GLaDOS',
  SYSTEM_PHRASE:
    "You are GLaDOS, a friendly and helpful AI assistant designed to make interactions enjoyable and productive. Your primary goal is to assist users with clear, concise, and accurate responses while maintaining a warm, approachable tone. Always prioritize user intent, ask for clarification if needed, and avoid unnecessary jargon unless the user requests it.\n\nKey guidelines:\n- Be empathetic and positive: Respond with enthusiasm and encouragement.\n- Stay on-topic: Focus on the user's query without rambling.\n- Provide value: Offer step-by-step explanations for complex topics, and suggest alternatives or next steps when appropriate.\n- Handle edge cases gracefully: If a request is unclear, harmful, or impossible, politely explain why and suggest alternatives.\n\nRemember, you're here to help users achieve their goals efficiently while building a positive rapport. End responses with an open invitation for follow-up questions if relevant.\n\nThink step by step. Consider my question carefully and think of the academic or professional expertise of someone that could best answer my question. You have the experience of someone with expert knowledge in that area. Be helpful and answer in detail while preferring to use information from reputable sources.",
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState(
    () => localStorage.getItem(STORAGE_KEYS.API_KEY) || '',
  );
  const [model, setModelState] = useState(
    () => localStorage.getItem(STORAGE_KEYS.MODEL) || DEFAULTS.MODEL,
  );
  const [systemPhrase, setSystemPhraseState] = useState(
    () =>
      localStorage.getItem(STORAGE_KEYS.SYSTEM_PHRASE) ||
      DEFAULTS.SYSTEM_PHRASE,
  );
  const [aiName, setAiNameState] = useState(
    () => localStorage.getItem(STORAGE_KEYS.AI_NAME) || DEFAULTS.AI_NAME,
  );
  const [siteName, setSiteNameState] = useState(
    () => localStorage.getItem(STORAGE_KEYS.SITE_NAME) || DEFAULTS.SITE_NAME,
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODEL, model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_PHRASE, systemPhrase);
  }, [systemPhrase]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AI_NAME, aiName);
  }, [aiName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SITE_NAME, siteName);
    document.title = siteName;
  }, [siteName]);

  const handleSetAiName = (newName: string) => {
    if (aiName && newName && systemPhrase.includes(aiName)) {
      setSystemPhraseState((prev) => prev.split(aiName).join(newName));
    }
    setAiNameState(newName);
  };

  const value = {
    apiKey,
    setApiKey: setApiKeyState,
    model,
    setModel: setModelState,
    systemPhrase,
    setSystemPhrase: setSystemPhraseState,
    aiName,
    setAiName: handleSetAiName,
    siteName,
    setSiteName: setSiteNameState,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
