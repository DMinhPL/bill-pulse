import { Bill } from '../types/bill';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// ─── In-flight request tracking (drives the global top progress bar) ────────

let pendingRequests = 0;
const pendingListeners = new Set<() => void>();

function setPending(delta: number) {
  pendingRequests += delta;
  pendingListeners.forEach(listener => listener());
}

export const pendingRequestStore = {
  subscribe(listener: () => void) {
    pendingListeners.add(listener);
    return () => pendingListeners.delete(listener);
  },
  getSnapshot: () => pendingRequests,
};

/** Drop-in replacement for fetch() that shows the global loading bar while in flight. */
export async function trackedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  setPending(1);
  try {
    return await fetch(input, init);
  } finally {
    setPending(-1);
  }
}

/** JSON fetch against our own server; the session cookie is sent automatically. */
export async function apiFetch<T>(url: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await trackedFetch(url, {
    method: options.method || 'GET',
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || `Lỗi máy chủ (${res.status})`, res.status);
  }
  return data as T;
}

export const authApi = {
  me: () => apiFetch<{ user: AuthUser }>('/api/auth/me'),
  login: (username: string, password: string) =>
    apiFetch<{ user: AuthUser }>('/api/auth/login', { method: 'POST', body: { username, password } }),
  register: (displayName: string, username: string, email: string, password: string) =>
    apiFetch<{ user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: { displayName, username, email, password },
    }),
  logout: () => apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
};

export const billsApi = {
  list: () => apiFetch<{ bills: Bill[] }>('/api/bills'),
  create: (bill: Bill) => apiFetch<{ bill: Bill }>('/api/bills', { method: 'POST', body: bill }),
  remove: (id: string) => apiFetch<{ success: boolean }>(`/api/bills/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  resetSample: () => apiFetch<{ bills: Bill[] }>('/api/bills/reset-sample', { method: 'POST' }),
};
