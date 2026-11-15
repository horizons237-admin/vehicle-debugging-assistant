const VIN_RE = /\b([A-HJ-NPR-Z0-9]{17})\b/gi;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

export function redactText(input: string, options?: { keepVinLast4?: boolean }): string {
  let s = input;
  s = s.replace(EMAIL_RE, '[REDACTED_EMAIL]');
  s = s.replace(IPV4_RE, '[REDACTED_IP]');
  s = s.replace(VIN_RE, (m) => {
    if (options?.keepVinLast4 && m.length === 17) return `VIN***********${m.slice(-4)}`;
    return '[REDACTED_VIN]';
  });
  return s;
}

export function redactJson<T>(value: T, options?: { keepVinLast4?: boolean }): T {
  return JSON.parse(redactText(JSON.stringify(value), options)) as T;
}
