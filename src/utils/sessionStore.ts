/** Lightweight in-memory session state shared across commands. */

let lastAiSummary: string | undefined;

export function setLastAiSummary(text: string | undefined) {
  lastAiSummary = text;
}

export function getLastAiSummary(): string | undefined {
  return lastAiSummary;
}
