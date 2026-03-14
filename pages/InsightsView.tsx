import React, { useState } from 'react';
import { useWardrobe } from '../WardrobeContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpRight, AlertCircle, CalendarClock, X } from 'lucide-react';
import { Outfit } from '../types';

export const InsightsView: React.FC = () => {
  const { wardrobe, outfits, postponeItem } = useWardrobe();
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [postponeModalItem, setPostponeModalItem] = useState<string | null>(null);
  const [postponeDate, setPostponeDate] = useState('');
  
  // Data prep for charts
  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    wardrobe.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [wardrobe]);

  const usageData = [
    { name: 'Mon', wears: 2 },
    { name: 'Tue', wears: 4 },
    { name: 'Wed', wears: 3 },
    { name: 'Thu', wears: 5 },
    { name: 'Fri', wears: 4 },
    { name: 'Sat', wears: 6 },
    { name: 'Sun', wears: 1 },
  ];

  const COLORS = ['#78716c', '#a8a29e', '#d6d3d1', '#e7e5e4', '#57534e'];
  const today = new Date();

  const forgottenItems = wardrobe.filter(i => {
    // Check if postponed
    if (i.postponedUntil) {
      const pDate = new Date(i.postponedUntil);
      if (pDate > today) return false;
    }

    const lastWornDate = new Date(i.lastWorn);
    const diffTime = Math.abs(today.getTime() - lastWornDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  }).sort((a, b) => new Date(a.lastWorn).getTime() - new Date(b.lastWorn).getTime());

  const handlePostponeSubmit = () => {
    if (postponeModalItem && postponeDate) {
      postponeItem(postponeModalItem, postponeDate);
      setPostponeModalItem(null);
      setPostponeDate('');
    }
  };

  const mostWorn = [...wardrobe].sort((a, b) => b.wearCount - a.wearCount).slice(0, 1)[0];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-stone-900 mb-8">Wardrobe Insights</h1>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm border-l-4 border-l-primary-500">
          <p className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Total Items</p>
          <p className="text-4xl font-bold text-stone-900 mt-2">{wardrobe.length}</p>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-medium">
            <ArrowUpRight size={16} /> <span>+2 this month</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
          <p className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Log Streak</p>
          <p className="text-4xl font-bold text-stone-900 mt-2">5 Days</p>
          <div className="flex items-center gap-1 mt-2 text-primary-500 text-sm font-medium">
            <CalendarClock size={16} /> <span>Keep it up!</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm border-l-4 border-l-primary-500">
          <p className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Utilization</p>
          <p className="text-4xl font-bold text-stone-900 mt-2">68%</p>
          <div className="w-full bg-stone-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary-500 h-full w-[68%]"></div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Row 1: Weekly Activity & Forgotten Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Activity */}
          <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm flex flex-col h-[450px]">
            <h3 className="text-xl font-bold text-stone-800 mb-6">Weekly Activity</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a8a29e'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e'}} />
                  <Tooltip 
                    cursor={{fill: '#f5f5f4'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Bar dataKey="wears" fill="#e05d45" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forgotten Items */}
          <div className="bg-white p-8 rounded-2xl border-2 border-primary-100 shadow-lg flex flex-col h-[450px]">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={24} className="text-primary-500" />
              <h3 className="text-xl font-bold text-stone-800">Forgotten items</h3>
            </div>
            <p className="text-sm text-stone-500 mb-6 italic">These pieces haven't seen the light in over 30 days.</p>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
              {forgottenItems.slice(0, 6).map(item => (
                <div key={item.id} className="flex items-center gap-4 group cursor-pointer hover:bg-stone-50 p-2 -mx-2 rounded-xl transition-colors">
                  <img src={item.image} className="w-14 h-14 rounded-lg object-cover bg-stone-100 shadow-sm" alt={item.name} />
                  <div className="flex-1">
                    <p className="font-semibold text-stone-800 text-sm">{item.name}</p>
                    <p className="text-xs text-stone-400">Last worn: {item.lastWorn}</p>
                  </div>
                  <div className="text-[10px] font-bold text-primary-500 bg-primary-50 px-2 py-1 rounded">
                    {Math.ceil(Math.abs(new Date().getTime() - new Date(item.lastWorn).getTime()) / (1000 * 60 * 60 * 24))}d ago
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPostponeModalItem(item.id); }}
                    className="text-[10px] font-bold text-stone-400 hover:text-stone-900 uppercase tracking-widest border border-stone-200 px-2 py-1 rounded transition-colors"
                  >
                    Postpone
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full py-3 mt-6 border border-stone-200 text-stone-400 text-xs font-bold uppercase tracking-widest hover:border-primary-500 hover:text-primary-500 transition-all rounded-xl">
              View All Forgotten
            </button>
          </div>
        </div>

        {/* Row 2: Category Split, Most Worn, Recent Outfits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Split */}
          <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm flex flex-col h-[480px]">
            <h3 className="text-xl font-bold text-stone-800 mb-6">Category Split</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {categoryData.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-stone-500">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>

          {/* Most Worn Item - Less Overwhelming */}
          <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm flex flex-col h-[480px]">
            <p className="text-stone-400 font-bold uppercase text-[10px] tracking-widest mb-4">Most Worn Item</p>
            <h3 className="text-xl font-bold text-stone-800 mb-6">{mostWorn.name}</h3>
            
            <div className="flex-1 aspect-square rounded-xl overflow-hidden mb-6 bg-stone-50 border border-stone-100">
              <img src={mostWorn.image} alt={mostWorn.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex justify-between items-end">
              <div>
                <span className="text-3xl font-bold text-primary-500">{mostWorn.wearCount}</span>
                <span className="text-stone-400 text-sm ml-1">wears</span>
              </div>
              <button className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary-600 transition-colors">
                Details
              </button>
            </div>
          </div>

          {/* Recent Outfits */}
          <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm flex flex-col h-[480px]">
            <h3 className="text-xl font-bold text-stone-800 mb-6">Recent Outfits</h3>
            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
              {outfits.slice(0, 5).map((outfit) => (
                <div 
                  key={outfit.id} 
                  onClick={() => setSelectedOutfit(outfit)}
                  className="flex gap-4 p-3 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-stone-100"
                >
                  <div className="grid grid-cols-2 gap-0.5 w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 shadow-sm">
                    {outfit.items.slice(0,4).map((itemId, i) => {
                      const item = wardrobe.find(w => w.id === itemId);
                      return item ? <img key={i} src={item.image} className="w-full h-full object-cover" /> : null
                    })}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-700">{outfit.date}</p>
                    <p className="text-xs text-stone-400">{outfit.items.length} items worn</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-3 mt-6 border border-stone-100 text-stone-400 text-[10px] font-bold uppercase tracking-widest hover:text-stone-800 transition-colors">
              View History
            </button>
          </div>
        </div>

      </div>

      {/* Postpone Modal */}
      {postponeModalItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xl font-serif italic text-stone-900">Postpone Reminder</h3>
              <button onClick={() => setPostponeModalItem(null)} className="text-stone-400 hover:text-stone-900"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-stone-500 italic">When should we remind you about this piece again?</p>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Remind me on</label>
                <input 
                  type="date" 
                  value={postponeDate}
                  onChange={(e) => setPostponeDate(e.target.value)}
                  className="w-full bg-transparent border-b border-stone-200 py-2 text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
              <button 
                onClick={handlePostponeSubmit}
                disabled={!postponeDate}
                className="w-full py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-primary-600 transition-colors rounded-xl disabled:opacity-50"
              >
                Confirm Postpone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outfit Detail Modal */}
      {selectedOutfit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-serif italic text-stone-900">Outfit Details</h3>
                <p className="text-xs font-bold tracking-widest uppercase text-stone-400 mt-1">{selectedOutfit.date}</p>
              </div>
              <button 
                onClick={() => setSelectedOutfit(null)}
                className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {selectedOutfit.items.map(itemId => {
                  const item = wardrobe.find(w => w.id === itemId);
                  if (!item) return null;
                  return (
                    <div key={itemId} className="space-y-3">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-stone-100">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-serif italic text-sm text-stone-900">{item.name}</p>
                        <p className="text-[10px] uppercase tracking-widest text-stone-400">{item.category}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-10 pt-8 border-t border-stone-100 flex justify-between items-center">
                <div className="text-stone-500 text-sm italic">
                  Logged on {selectedOutfit.date}
                </div>
                <button 
                  onClick={() => setSelectedOutfit(null)}
                  className="px-8 py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-primary-600 transition-colors rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};