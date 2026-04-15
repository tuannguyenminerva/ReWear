import { useState } from 'react';
import { ClothingItem } from '../types';
import { detectionApi } from '../api/detection';

export function useDetection() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedItems, setDetectedItems] = useState<ClothingItem[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [noDetectionMsg, setNoDetectionMsg] = useState(false);

  const runDetection = async (imageB64: string) => {
    setIsDetecting(true);
    setApiError(null);
    setNoDetectionMsg(false);
    try {
      const data = await detectionApi.detect(imageB64);
      if (data.detections?.length > 0) {
        setDetectedItems(data.detections as ClothingItem[]);
      } else {
        setDetectedItems([]);
        setNoDetectionMsg(true);
        setTimeout(() => setNoDetectionMsg(false), 3000);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to connect to detection server');
    } finally {
      setIsDetecting(false);
    }
  };

  const resetDetection = () => {
    setDetectedItems([]);
    setApiError(null);
    setNoDetectionMsg(false);
  };

  return {
    isDetecting,
    detectedItems,
    setDetectedItems,
    apiError,
    noDetectionMsg,
    runDetection,
    resetDetection,
  };
}
