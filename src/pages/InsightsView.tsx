import React, { useState } from 'react';
import { useWardrobe } from '../contexts/WardrobeContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpRight, AlertCircle, CalendarClock } from 'lucide-react';
import { Outfit } from '../types';
import { PostponeModal } from '../components/PostponeModal';
import { OutfitDetailModal } from '../components/OutfitDetailModal';
import { ItemDetailModal } from '../components/ItemDetailModal';

export const InsightsView: React.FC = () => {
  const { wardrobe, outfits, postponeItem } = useWardrobe();
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [selectedItemInfo, setSelectedItemInfo] = useState<any | null>(null);
  const [postponeModalItem, setPostponeModalItem] = useState<string | null>(null);
  const [showAllForgotten, setShowAllForgotten] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    wardrobe.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [wardrobe]);

  const usageData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    outfits.forEach(o => {
      const d = new Date(o.date);
      const dayName = days[d.getUTCDay()];
      if (dayName) counts[dayName as keyof typeof counts]++;
    });
    return [
      { name: 'Mon', wears: counts.Mon },
      { name: 'Tue', wears: counts.Tue },
      { name: 'Wed', wears: counts.Wed },
      { name: 'Thu', wears: counts.Thu },
      { name: 'Fri', wears: counts.Fri },
      { name: 'Sat', wears: counts.Sat },
      { name: 'Sun', wears: counts.Sun },
    ];
  }, [outfits]);

  const COLORS = ['#78716c', '#a8a29e', '#d6d3d1', '#e7e5e4', '#57534e'];
  const today = new Date();

  const streak = React.useMemo(() => {
    if (outfits.length === 0) return 0;
    const dates = [...new Set(outfits.map(o => o.date))].sort().reverse();
    const todayStr = new Date().toISOString().split('T')[0];
    const yestDate = new Date();
    yestDate.setDate(yestDate.getDate() - 1);
    const yestStr = yestDate.toISOString().split('T')[0];

    if (dates[0] !== todayStr && dates[0] !== yestStr) return 0;

    let currentStreak = 1;
    let expectedNext = new Date(dates[0]);
    expectedNext.setDate(expectedNext.getDate() - 1);

    for (let i = 1; i < dates.length; i++) {
      if (dates[i] === expectedNext.toISOString().split('T')[0]) {
        currentStreak++;
        expectedNext.setDate(expectedNext.getDate() - 1);
      } else {
        break;
      }
    }
    return currentStreak;
  }, [outfits]);

  const utilization = React.useMemo(() => {
    if (wardrobe.length === 0) return 0;
    const wornCount = wardrobe.filter(i => i.wearCount > 0).length;
    return Math.round((wornCount / wardrobe.length) * 100);
  }, [wardrobe]);

  const newThisMonth = React.useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startIso = startOfMonth.toISOString().split('T')[0];
    return wardrobe.filter(i => i.addedDate >= startIso).length;
  }, [wardrobe]);

  const forgottenItems = wardrobe.filter(i => {
    if (i.postponedUntil) {
      const pDate = new Date(i.postponedUntil);
      if (pDate > today) return false;
    }
    const lastWornDate = new Date(i.lastWorn);
    const diffTime = Math.abs(today.getTime() - lastWornDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  }).sort((a, b) => new Date(a.lastWorn).getTime() - new Date(b.lastWorn).getTime());

  const mostWorn = [...wardrobe].sort((a, b) => b.wearCount - a.wearCount).slice(0, 1)[0];

  return (
    <div className="max-w-7xl mx-auto px-12 py-4">
      <h1 className="text-2xl font-bold text-stone-900 mb-4">Wardrobe Insights</h1>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm border-l-4 border-l-primary-500">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Total Items</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{wardrobe.length}</p>
          <div className="flex items-center gap-1 mt-1 text-green-600 text-xs font-medium">
            <ArrowUpRight size={12} /> <span>+{newThisMonth} this month</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Log Streak</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{streak} Days</p>
          <div className="flex items-center gap-1 mt-1 text-primary-500 text-xs font-medium">
            <CalendarClock size={12} /> <span>{streak > 0 ? 'Keep it up!' : 'Start your streak!'}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm border-l-4 border-l-primary-500">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Utilization</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{utilization}%</p>
          <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-primary-500 h-full" style={{width: `${utilization}%`}}></div>
          </div>
        </div>
      </div>

      <div className="space-y-5">

        {/* Row 1: Weekly Activity & Forgotten Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm flex flex-col h-[300px]">
            <h3 className="text-sm font-bold text-stone-800 mb-3">Weekly Activity</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 11}} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 11}} />
                  <Tooltip
                    cursor={{fill: '#f5f5f4'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                  />
                  <Bar dataKey="wears" fill="#e05d45" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border-2 border-primary-100 shadow-lg flex flex-col h-[300px]">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={18} className="text-primary-500" />
              <h3 className="text-sm font-bold text-stone-800">Forgotten items</h3>
            </div>
            <p className="text-xs text-stone-500 mb-3 italic">These pieces haven't seen the light in over 30 days.</p>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {(showAllForgotten ? forgottenItems : forgottenItems.slice(0, 6)).map(item => (
                <div key={item.id} className="flex items-center gap-3 group cursor-pointer hover:bg-stone-50 p-1.5 -mx-1.5 rounded-lg transition-colors">
                  <img src={item.image || '/placeholder-garment.svg'} className="w-10 h-10 rounded-md object-cover bg-stone-100 shadow-sm" alt={item.name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 text-xs truncate">{item.name}</p>
                    <p className="text-[10px] text-stone-400">Last worn: {item.lastWorn}</p>
                  </div>
                  <div className="text-[9px] font-bold text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded flex-shrink-0">
                    {Math.ceil(Math.abs(new Date().getTime() - new Date(item.lastWorn).getTime()) / (1000 * 60 * 60 * 24))}d ago
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPostponeModalItem(item.id); }}
                    className="text-[9px] font-bold text-stone-400 hover:text-stone-900 uppercase tracking-widest border border-stone-200 px-1.5 py-0.5 rounded transition-colors flex-shrink-0"
                  >
                    Postpone
                  </button>
                </div>
              ))}
            </div>
            {forgottenItems.length > 6 && (
              <button
                onClick={() => setShowAllForgotten(!showAllForgotten)}
                className="w-full py-2 mt-3 border border-stone-200 text-stone-400 text-[10px] font-bold uppercase tracking-widest hover:border-primary-500 hover:text-primary-500 transition-all rounded-lg"
              >
                {showAllForgotten ? "Show Less" : "View All Forgotten"}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Split, Most Worn, Recent Outfits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm flex flex-col h-[320px]">
            <h3 className="text-sm font-bold text-stone-800 mb-3">Category Split</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {categoryData.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1 text-[10px] text-stone-500">
                  <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm flex flex-col h-[320px]">
            <p className="text-stone-400 font-bold uppercase text-[9px] tracking-widest mb-2">Most Worn Item</p>
            {mostWorn ? (
              <>
                <h3 className="text-sm font-bold text-stone-800 mb-3">{mostWorn.name}</h3>
                <div className="flex-1 rounded-lg overflow-hidden mb-3 bg-stone-50 border border-stone-100">
                  <img src={mostWorn.image} alt={mostWorn.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xl font-bold text-primary-500">{mostWorn.wearCount}</span>
                    <span className="text-stone-400 text-xs ml-1">wears</span>
                  </div>
                  <button
                    onClick={() => setSelectedItemInfo(mostWorn)}
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

          <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm flex flex-col h-[320px]">
            <h3 className="text-sm font-bold text-stone-800 mb-3">Recent Outfits</h3>
            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
              {(showAllHistory ? outfits : outfits.slice(0, 5)).map((outfit) => (
                <div
                  key={outfit.id}
                  onClick={() => setSelectedOutfit(outfit)}
                  className="flex gap-3 p-2 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-stone-100"
                >
                  <div className="grid grid-cols-2 gap-0.5 w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-stone-100 shadow-sm">
                    {outfit.items.slice(0,4).map((itemId, i) => {
                      const item = wardrobe.find(w => w.id === itemId);
                      return item ? <img key={i} src={item.image || '/placeholder-garment.svg'} className="w-full h-full object-cover" /> : null
                    })}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-700">{outfit.date}</p>
                    <p className="text-[10px] text-stone-400">{outfit.items.length} items worn</p>
                  </div>
                </div>
              ))}
            </div>
            {outfits.length > 5 && (
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="w-full py-2 mt-3 border border-stone-100 text-stone-400 text-[10px] font-bold uppercase tracking-widest hover:text-stone-800 transition-colors"
              >
                {showAllHistory ? "Show Less" : "View History"}
              </button>
            )}
          </div>
        </div>
      </div>

      {postponeModalItem && (
        <PostponeModal
          onConfirm={(date) => {
            postponeItem(postponeModalItem, date);
            setPostponeModalItem(null);
          }}
          onClose={() => setPostponeModalItem(null)}
        />
      )}

      {selectedOutfit && (
        <OutfitDetailModal
          outfit={selectedOutfit}
          wardrobe={wardrobe}
          onClose={() => setSelectedOutfit(null)}
        />
      )}

      {selectedItemInfo && (
        <ItemDetailModal
          item={selectedItemInfo}
          onClose={() => setSelectedItemInfo(null)}
        />
      )}
    </div>
  );
};
