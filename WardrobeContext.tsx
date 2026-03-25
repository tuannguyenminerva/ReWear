import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ClothingItem, Outfit } from './types';
import { itemsApi, outfitsApi, ApiItem, ApiOutfit } from './api';
import { useAuth } from './AuthContext';

// ── Adapters ──────────────────────────────────────────────────────────────────
function apiItemToClothing(i: ApiItem): ClothingItem {
  return {
    id: i.id,
    name: i.name,
    category: i.category as ClothingItem['category'],
    image: i.image,
    wearCount: i.wearCount,
    lastWorn: i.lastWorn,
    color: i.color,
    brand: i.brand,
    addedDate: i.addedDate,
    cost: i.cost ?? undefined,
  };
}

function apiOutfitToOutfit(o: ApiOutfit): Outfit {
  return { id: o.id, date: o.date, items: o.items };
}

// ── Context ───────────────────────────────────────────────────────────────────
interface WardrobeContextType {
  wardrobe: ClothingItem[];
  outfits: Outfit[];
  loading: boolean;
  addOutfit: (items: ClothingItem[], date: string, image?: File | null) => Promise<void>;
  updateItem: (item: ClothingItem) => Promise<void>;
  addItem: (item: ClothingItem) => Promise<void>;
  postponeItem: (itemId: string, date: string) => void;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

export const WardrobeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);

  // Load wardrobe + outfits whenever the user logs in
  useEffect(() => {
    if (!user) {
      setWardrobe([]);
      setOutfits([]);
      return;
    }
    setLoading(true);
    Promise.all([itemsApi.list(), outfitsApi.list()])
      .then(([items, apiOutfits]) => {
        setWardrobe(items.map(apiItemToClothing));
        setOutfits(apiOutfits.map(apiOutfitToOutfit));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const addOutfit = useCallback(async (items: ClothingItem[], date: string, image?: File | null) => {
    const apiOutfit = await outfitsApi.create(items.map(i => i.id), date, image);
    const outfit = apiOutfitToOutfit(apiOutfit);
    setOutfits(prev => [outfit, ...prev]);

    // Update wear counts locally (re-fetch would also work)
    setWardrobe(prev => prev.map(item => {
      if (items.find(i => i.id === item.id)) {
        return { ...item, wearCount: item.wearCount + 1, lastWorn: date };
      }
      return item;
    }));
  }, []);

  const updateItem = useCallback(async (updatedItem: ClothingItem) => {
    const apiItem = await itemsApi.update(updatedItem.id, {
      name: updatedItem.name,
      category: updatedItem.category,
      color: updatedItem.color,
      brand: updatedItem.brand,
      cost: updatedItem.cost,
      image: updatedItem.image,
    });
    setWardrobe(prev => prev.map(item => item.id === updatedItem.id ? apiItemToClothing(apiItem) : item));
  }, []);

  const addItem = useCallback(async (newItem: ClothingItem) => {
    const apiItem = await itemsApi.create({
      name: newItem.name,
      category: newItem.category,
      color: newItem.color,
      brand: newItem.brand,
      cost: newItem.cost,
      image: newItem.image,
    });
    setWardrobe(prev => [apiItemToClothing(apiItem), ...prev]);
  }, []);

  // Postpone is kept local — no backend endpoint needed for MVP
  const postponeItem = useCallback((itemId: string, date: string) => {
    setWardrobe(prev => prev.map(item => item.id === itemId ? { ...item, postponedUntil: date } : item));
  }, []);

  return (
    <WardrobeContext.Provider value={{ wardrobe, outfits, loading, addOutfit, updateItem, addItem, postponeItem }}>
      {children}
    </WardrobeContext.Provider>
  );
};

export const useWardrobe = () => {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error('useWardrobe must be used within a WardrobeProvider');
  return ctx;
};
