const API_URL = import.meta.env.VITE_API_URL as string;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  return fetch(API_URL + endpoint, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
}