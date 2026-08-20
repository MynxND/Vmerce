/**
 * In-memory access-token holder.
 *
 * Deliberately a plain module rather than part of the Zustand store: the fetch
 * wrapper needs the token, and the store needs the fetch wrapper, so keeping the
 * token here breaks the import cycle. The token is never written to
 * localStorage — long-lived auth lives in the API's httpOnly refresh cookie.
 */
let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

export function notifySessionExpired(): void {
  accessToken = null;
  onSessionExpired?.();
}
