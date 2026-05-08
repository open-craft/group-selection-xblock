/**
 * Minimal JSON POST utility for calling XBlock handlers.
 *
 * Handler URLs are resolved in Python (via self.runtime.handler_url)
 * and passed as init data — the JS side never calls runtime.handlerUrl().
 */

import type { HandlerResponse } from './types';

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/\bcsrftoken=([^;]*)/);
  return match ? match[1] : '';
}

export async function postJson<T = HandlerResponse>(
  url: string,
  data: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}
