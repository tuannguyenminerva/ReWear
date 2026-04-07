import React, { useState, useMemo } from 'react';
import { useWardrobe } from '../contexts/WardrobeContext';
import { ClothingItem, Category } from '../types';
import { Search, X, Plus, Trash2 } from 'lucide-react';
import { CreateItemModal } from '../components/CreateItemModal';

export const WardrobeView: React.FC = () => {
  const { wardrobe, updateItem, addItem, removeItem, addOutfit } = useWardrobe();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = selectedItemId ? (wardrobe.find(i => i.id === selectedItemId) ?? null) : null;
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; category: Category }>({ name: '', category: 'Top' });

  const [isCreating, setIsCreating] = useState(false);

  const categories: (Category | 'All')[] = ['All', 'Top', 'Bottom', 'Shoes', 'Outerwear', 'Accessory'];

  const filteredItems = useMemo(() => {
    return wardrobe.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [wardrobe, selectedCategory, searchQuery]);

  const recommendedItems = useMemo(() => {
    if (!selectedItem) return [];
    return wardrobe
      .filter(i => i.id !== selectedItem.id && i.category !== selectedItem.category)
      .slice(0, 3);
  }, [wardrobe, selectedItem]);

  const handleEditClick = () => {
    if (selectedItem) {
      setEditForm({ name: selectedItem.name, category: selectedItem.category });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (selectedItem) {
      updateItem({ ...selectedItem, name: editForm.name, category: editForm.category });
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-8 py-12">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <h1 className="text-5xl font-serif italic text-stone-900 mb-4">The Collection</h1>
          <p className="text-stone-500 font-serif italic text-lg">{wardrobe.length} pieces</p>
        </div>

        <div className="flex flex-col items-end gap-6">
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-2 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-primary-600 transition-all shadow-lg shadow-stone-900/10"
          >
            <Plus size={16} />
            <span>Add Piece</span>
          </button>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="relative group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-400 group-hover:text-stone-800 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-2 bg-transparent border-b border-stone-200 text-lg font-serif placeholder:italic focus:outline-none focus:border-stone-900 w-64 transition-all"
              />
            </div>

            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap pb-1 border-b-2
                    ${selectedCategory === cat
                      ? 'border-primary-500 text-stone-900'
                      : 'border-transparent text-stone-400 hover:text-stone-600'}
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12">
          {filteredItems.map(item => (
            <div key={item.id} onClick={() => { setSelectedItemId(item.id); setIsEditing(false); }} className="group cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden bg-stone-100 mb-4 relative">
                 <img src={item.image || '/placeholder-garment.svg'} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out" />
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                 <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this piece?')) {
                      try {
                        await removeItem(item.id);
                      } catch (err) {
                        setDeleteError('Failed to delete item.');
                        setTimeout(() => setDeleteError(null), 3000);
                      }
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 text-stone-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                 >
                  <Trash2 size={16} />
                 </button>
              </div>
              <div className="text-center">
                <h3 className="font-serif text-lg text-stone-900 italic group-hover:text-primary-600 transition-colors">{item.name}</h3>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{item.category}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center">
          <p className="font-serif italic text-2xl text-stone-400">No pieces found.</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="mt-6 text-primary-600 text-xs font-bold uppercase tracking-widest border-b border-primary-600 pb-1 hover:text-primary-700 hover:border-primary-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {deleteError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl animate-in slide-in-from-bottom-5">
          {deleteError}
        </div>
      )}

      {isCreating && (
        <CreateItemModal
          onCreateItem={(newItem) => {
            addItem(newItem);
            setIsCreating(false);
          }}
          onClose={() => setIsCreating(false)}
        />
      )}

      {/* Item Detail Modal */}
      {selectedItem && selectedItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-100/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#fafaf9] w-full max-w-5xl h-[80vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-300 border border-stone-200">

            <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-stone-200">
              <img src={selectedItem.image || '/placeholder-garment.svg'} alt={selectedItem.name} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedItemId(null)} className="absolute top-6 left-6 text-white mix-blend-difference md:hidden">
                <X size={24} />
              </button>
            </div>

            <div className="w-full md:w-1/2 p-12 overflow-y-auto flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div className="w-full">
                  {isEditing ? (
                    <div className="space-y-6">
                       <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({...editForm, category: e.target.value as Category})}
                        className="block w-full bg-transparent border-b border-stone-300 py-2 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-primary-500"
                       >
                         {categories.filter(c => c !== 'All').map(c => (
                           <option key={c} value={c}>{c}</option>
                         ))}
                       </select>
                       <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="block w-full bg-transparent border-b border-stone-300 py-2 text-4xl font-serif italic focus:outline-none focus:border-primary-500"
                       />
                    </div>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-3 block">
                        {selectedItem.category}
                      </span>
                      <h2 className="text-5xl font-serif italic text-stone-900 leading-tight mb-2">{selectedItem.name}</h2>
                    </>
                  )}
                </div>
                <button onClick={() => setSelectedItemId(null)} className="hidden md:block text-stone-400 hover:text-stone-900 transition-colors ml-8">
                  <X size={32} strokeWidth={1} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-12 gap-y-8 mb-12 border-t border-b border-stone-200 py-8">
                <div>
                  <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Wear Count</span>
                  <span className="text-3xl font-serif text-stone-800">{selectedItem.wearCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Last Worn</span>
                  <span className="text-xl font-serif text-stone-800">{selectedItem.lastWorn}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Color</span>
                  <span className="text-xl font-serif text-stone-800">{selectedItem.color}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Cost / Wear</span>
                  <span className="text-xl font-serif text-stone-800">
                    {selectedItem.cost && selectedItem.wearCount > 0
                      ? `$${(selectedItem.cost / selectedItem.wearCount).toFixed(2)}`
                      : selectedItem.cost ? `$${selectedItem.cost.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="mb-auto">
                <h3 className="text-lg font-serif italic text-stone-900 mb-6">Pairs well with</h3>
                <div className="grid grid-cols-3 gap-4">
                  {recommendedItems.map(rec => (
                    <div key={rec.id} className="group cursor-pointer" onClick={() => setSelectedItemId(rec.id)}>
                       <div className="aspect-[3/4] overflow-hidden bg-stone-100 mb-2">
                         <img src={rec.image || '/placeholder-garment.svg'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={rec.name} />
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-6 mt-8 pt-8 border-t border-stone-200">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    addOutfit([selectedItem], today);
                  }}
                  className="flex-1 py-4 bg-primary-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
                >
                  Log Wear
                </button>
                {isEditing ? (
                  <button onClick={handleSaveEdit}
                    className="px-8 py-4 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-primary-600 transition-colors">
                    Save
                  </button>
                ) : (
                  <button onClick={handleEditClick}
                    className="px-8 py-4 border border-primary-200 text-primary-600 text-xs font-bold uppercase tracking-widest hover:border-primary-600 hover:text-primary-600 transition-colors">
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
