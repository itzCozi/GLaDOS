import { encode } from "gpt-tokenizer";

export function countTokens(text: string): number {
  if (!text) return 0;
  return encode(text).length;
}

export const MODEL_PRICING: Record<string, { input: number; output: number }> =
  {
    "grok-4": { input: 5.0, output: 15.0 },
    "grok-4-1-fast": { input: 2.0, output: 6.0 },
    "grok-3": { input: 2.0, output: 8.0 },
    "grok-3-mini": { input: 0.5, output: 1.5 },
    default: { input: 5.0, output: 15.0 },
  };

export function calculateCost(
  tokens: number,
  model: string,
  type: "input" | "output",
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["default"];
  const rate = type === "input" ? pricing.input : pricing.output;
  return (tokens / 1_000_000) * rate;
}
