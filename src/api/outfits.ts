import { request, BASE } from './client';

export interface ApiOutfit {
  id: string;
  date: string;
  items: string[];
  imagePath: string | null;
}

export const outfitsApi = {
  list: () => request<ApiOutfit[]>('/outfits'),
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
