import React, { createContext, useContext, useState, useCallback } from 'react';
import { ClothingItem, Outfit } from './types';
import { MOCK_WARDROBE, MOCK_OUTFITS } from './constants';

interface WardrobeContextType {
  wardrobe: ClothingItem[];
  outfits: Outfit[];
  addOutfit: (items: ClothingItem[], date: string) => void;
  updateItem: (item: ClothingItem) => void;
  addItem: (item: ClothingItem) => void;
  postponeItem: (itemId: string, date: string) => void;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

export const WardrobeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>(MOCK_WARDROBE);
  const [outfits, setOutfits] = useState<Outfit[]>(MOCK_OUTFITS);

  const addOutfit = useCallback((items: ClothingItem[], date: string) => {
    const newOutfit: Outfit = {
      id: `o-${Date.now()}`,
      date,
      items: items.map(i => i.id),
    };
    
    setOutfits(prev => [newOutfit, ...prev]);
    
    // Update wear counts and last worn dates for items
    setWardrobe(prev => prev.map(item => {
      if (items.find(i => i.id === item.id)) {
        return {
          ...item,
          wearCount: item.wearCount + 1,
          lastWorn: date,
        };
      }
      return item;
    }));
  }, []);

  const updateItem = useCallback((updatedItem: ClothingItem) => {
    setWardrobe(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  }, []);

  const addItem = useCallback((newItem: ClothingItem) => {
    setWardrobe(prev => [newItem, ...prev]);
  }, []);

  const postponeItem = useCallback((itemId: string, date: string) => {
    setWardrobe(prev => prev.map(item => item.id === itemId ? { ...item, postponedUntil: date } : item));
  }, []);

  return (
    <WardrobeContext.Provider value={{ wardrobe, outfits, addOutfit, updateItem, addItem, postponeItem }}>
      {children}
    </WardrobeContext.Provider>
  );
};

export const useWardrobe = () => {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
};
