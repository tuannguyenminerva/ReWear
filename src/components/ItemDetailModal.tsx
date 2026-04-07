import React from 'react';
import { X } from 'lucide-react';
import { ClothingItem } from '../types';

interface ItemDetailModalProps {
  item: ClothingItem;
  onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-2xl font-serif italic text-stone-900">{item.name}</h3>
            <p className="text-xs font-bold tracking-widest uppercase text-stone-400 mt-1">{item.category}</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="w-full aspect-square bg-stone-100 rounded-xl overflow-hidden mb-6">
            <img src={item.image || '/placeholder-garment.svg'} className="w-full h-full object-cover" alt={item.name} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Color</p>
              <p className="font-serif text-stone-800">{item.color || 'Unspecified'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Last Worn</p>
              <p className="font-serif text-stone-800">{item.lastWorn}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Wear Count</p>
              <p className="font-serif text-stone-800">{item.wearCount}</p>
            </div>
            {item.cost ? (
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cost / Wear</p>
                <p className="font-serif text-stone-800 border-b border-primary-200 inline">
                  ${(item.wearCount > 0 ? item.cost / item.wearCount : item.cost).toFixed(2)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="pt-6 border-t border-stone-100">
            <button
              onClick={onClose}
              className="w-full py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-primary-600 transition-colors rounded-xl"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
