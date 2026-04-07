import { request } from './client';

export const detectionApi = {
  detect: (imageB64: string) =>
    request<{ detections: any[] }>('/detect', {
      method: 'POST',
      body: JSON.stringify({ image: imageB64 }),
    }),
};
