import type { Conversation } from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.detail ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function createConversation(): Promise<Conversation> {
  return request<Conversation>('/conversations/', { method: 'POST', body: JSON.stringify({}) });
}

export async function getConversation(id: string): Promise<Conversation> {
  return request<Conversation>(`/conversations/${id}/`);
}

export async function sendMessage(conversationId: string, content: string): Promise<{ conversation: Conversation }> {
  return request<{ conversation: Conversation }>(`/conversations/${conversationId}/messages/`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
