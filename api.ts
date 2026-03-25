/**
 * Thin API client — all requests go through the Vite dev proxy at /api
 * which forwards to Flask on port 5000.
 */

const BASE = '/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include', // send session cookie
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  email: string;
  username: string | null;
}

export const authApi = {
  me: () => request<AuthUser>('/auth/me'),
  register: (email: string, password: string, name?: string) =>
    request<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    request<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
};

// ── Items ─────────────────────────────────────────────────────────────────────
export interface ApiItem {
  id: string;
  name: string;
  category: string;
  image: string;
  wearCount: number;
  lastWorn: string;
  color: string;
  brand: string;
  addedDate: string;
  cost: number | null;
}

export const itemsApi = {
  list: () => request<ApiItem[]>('/items'),
  create: (item: Partial<ApiItem>) =>
    request<ApiItem>('/items', { method: 'POST', body: JSON.stringify(item) }),
  update: (id: string, item: Partial<ApiItem>) =>
    request<ApiItem>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  remove: (id: string) =>
    request<{ message: string }>(`/items/${id}`, { method: 'DELETE' }),
};

// ── Outfits ───────────────────────────────────────────────────────────────────
export interface ApiOutfit {
  id: string;
  date: string;
  items: string[];
  imagePath: string | null;
}

export const outfitsApi = {
  list: () => request<ApiOutfit[]>('/outfits'),
  /**
   * Log an outfit. Pass a File for the photo (optional).
   * Uses multipart when a file is present, JSON otherwise.
   */
  create: (itemIds: string[], wornDate: string, image?: File | null): Promise<ApiOutfit> => {
    if (image) {
      const form = new FormData();
      form.append('date', wornDate);
      itemIds.forEach(id => form.append('item_ids', id));
      form.append('image', image);
      return fetch(`${BASE}/outfits`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      }).then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        return res.json();
      });
    }
    return request<ApiOutfit>('/outfits', {
      method: 'POST',
      body: JSON.stringify({ date: wornDate, item_ids: itemIds }),
    });
  },
};
