export interface DedupeEntry {
  value: string;
  timestamp: number;
}

export function shouldSuppressDuplicate(
  previous: DedupeEntry | null,
  value: string,
  timestamp: number,
  cooldownMs: number
): boolean {
  if (!previous) {
    return false;
  }

  return previous.value === value && timestamp - previous.timestamp < cooldownMs;
}
