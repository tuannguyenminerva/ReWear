import React from 'react';
import { ClothingItem } from '../types';

interface MostWornCardProps {
  item: ClothingItem | undefined;
  onShowDetails: (item: ClothingItem) => void;
}

/** Highlights the wardrobe's single most-worn piece. */
export const MostWornCard: React.FC<MostWornCardProps> = ({ item, onShowDetails }) => (
  <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm flex flex-col h-[320px]">
    <p className="text-stone-400 font-bold uppercase text-[9px] tracking-widest mb-2">
      Most Worn Item
    </p>
    {item ? (
      <>
        <h3 className="text-sm font-bold text-stone-800 mb-3">{item.name}</h3>
        <div className="flex-1 rounded-lg overflow-hidden mb-3 bg-stone-50 border border-stone-100">
          <img src={item.image || '/placeholder-garment.svg'} alt={item.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xl font-bold text-primary-500">{item.wearCount}</span>
            <span className="text-stone-400 text-xs ml-1">wears</span>
          </div>
          <button
            type="button"
            onClick={() => onShowDetails(item)}
            className="px-3 py-1.5 bg-stone-900 text-white rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-primary-600 transition-colors"
          >
            Details
          </button>
        </div>
      </>
    ) : (
      <div className="flex-1 flex items-center justify-center text-stone-300 font-serif italic text-sm">
        No items yet
      </div>
    )}
  </div>
);
