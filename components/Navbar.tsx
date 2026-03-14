import React from 'react';
import { NavLink } from 'react-router-dom';
import { Camera, Grid, BarChart3, User, Calendar } from 'lucide-react';

export const Navbar: React.FC = () => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
      isActive
        ? 'text-stone-900 font-medium'
        : 'text-stone-400 hover:text-stone-600'
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#fafaf9]/90 backdrop-blur-md border-b border-stone-100 h-20 flex items-center justify-between px-8 lg:px-16">
      <div className="flex items-center gap-3">
        <span className="font-serif italic text-2xl text-stone-900">Rewear.</span>
      </div>

      <div className="flex items-center gap-8">
        <NavLink to="/" className={linkClass}>
          <span className="text-xs font-bold uppercase tracking-widest">Log a look</span>
        </NavLink>
        <NavLink to="/wardrobe" className={linkClass}>
          <span className="text-xs font-bold uppercase tracking-widest">Wardrobe</span>
        </NavLink>
        <NavLink to="/insights" className={linkClass}>
          <span className="text-xs font-bold uppercase tracking-widest">Insights</span>
        </NavLink>
        <NavLink to="/instructions" className={linkClass}>
          <span className="text-xs font-bold uppercase tracking-widest">Instructions</span>
        </NavLink>
      </div>

      <div className="flex items-center gap-6">
        <NavLink to="/register" className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-stone-900 hover:text-stone-900 transition-all">
          <User size={18} />
        </NavLink>
      </div>
    </nav>
  );
};