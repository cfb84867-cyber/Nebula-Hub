const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

export const api = {
  get:    <T>(path: string, token?: string | null) => request<T>('GET',    path, undefined, token),
  post:   <T>(path: string, body: unknown, token?: string | null) => request<T>('POST',   path, body, token),
  patch:  <T>(path: string, body: unknown, token?: string | null) => request<T>('PATCH',  path, body, token),
  put:    <T>(path: string, body: unknown, token?: string | null) => request<T>('PUT',    path, body, token),
  delete: <T>(path: string, token?: string | null) => request<T>('DELETE', path, undefined, token),
};

// Games API
export const gamesApi = {
  list:       (params?: string, token?: string) => api.get<any>(`/api/games${params ? `?${params}` : ''}`, token),
  get:        (id: string, token?: string) => api.get<any>(`/api/games/${id}`, token),
  add:        (data: object, token: string) => api.post<any>('/api/games', data, token),
  update:     (id: string, data: object, token: string) => api.patch<any>(`/api/games/${id}`, data, token),
  remove:     (id: string, token: string) => api.delete<any>(`/api/games/${id}`, token),
  play:       (id: string) => api.post<any>(`/api/games/${id}/play`, {}),
  favorite:   (id: string, token: string) => api.post<any>(`/api/games/${id}/favorite`, {}, token),
};

// Search API
export const searchApi = {
  search:      (q: string, provider = 'ddg', page = 1) =>
    api.get<any>(`/api/search?q=${encodeURIComponent(q)}&provider=${provider}&page=${page}`),
  suggestions: (q: string) =>
    api.get<any>(`/api/search/suggestions?q=${encodeURIComponent(q)}`),
};

// AI API
export const aiApi = {
  chat: (message: string, context: object, history: object[], token: string) =>
    api.post<any>('/api/ai/chat', { message, context, history }, token),
};

// Admin API
export const adminApi = {
  getUsers:   (params: string, token: string) => api.get<any>(`/api/admin/users?${params}`, token),
  updateRole: (id: string, role: string, token: string) => api.patch<any>(`/api/admin/users/${id}/role`, { role }, token),
  banUser:    (id: string, banned: boolean, reason: string, token: string) =>
    api.patch<any>(`/api/admin/users/${id}/ban`, { banned, reason }, token),
  getKeys:    (token: string) => api.get<any>('/api/admin/keys', token),
  createKey:  (data: object, token: string) => api.post<any>('/api/admin/keys', data, token),
  revokeKey:  (id: string, token: string) => api.delete<any>(`/api/admin/keys/${id}`, token),
  getLogs:    (params: string, token: string) => api.get<any>(`/api/admin/logs?${params}`, token),
  getStats:   (token: string) => api.get<any>('/api/admin/stats', token),
};
