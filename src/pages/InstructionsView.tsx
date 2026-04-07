import React from 'react';
import { Camera, Sparkles, CheckCircle2 } from 'lucide-react';

export const InstructionsView: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-20">
        <h1 className="text-5xl font-serif italic text-stone-900 mb-6">How to use Rewear</h1>
        <p className="text-stone-500 font-serif italic text-xl max-w-2xl mx-auto">
          Master your wardrobe by tracking every look. Here's how to get the most out of your digital closet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        <div className="space-y-8">
          <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center text-primary-600 shadow-sm">
            <Camera size={40} />
          </div>
          <h3 className="text-2xl font-bold text-stone-800">1. Capture Your Look</h3>
          <p className="text-stone-500 text-lg leading-relaxed">
            Stand in front of your camera for real-time detection or upload a photo from your gallery. 
            Our AI automatically identifies the pieces you're wearing.
          </p>
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 shadow-sm">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Pro Tip</p>
            <p className="text-sm text-stone-600 italic leading-relaxed">
              Use natural lighting and a clear background for the most accurate item detection.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center text-primary-600 shadow-sm">
            <Sparkles size={40} />
          </div>
          <h3 className="text-2xl font-bold text-stone-800">2. Curate & Refine</h3>
          <p className="text-stone-500 text-lg leading-relaxed">
            Review the detected items. You can manually add missing pieces from your wardrobe, 
            edit names, or remove items that aren't part of today's look.
          </p>
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 shadow-sm">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Best Photos</p>
            <p className="text-sm text-stone-600 italic leading-relaxed">
              Full-body shots work best. Ensure your shoes and accessories are visible in the frame.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center text-primary-600 shadow-sm">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-2xl font-bold text-stone-800">3. Log & Learn</h3>
          <p className="text-stone-500 text-lg leading-relaxed">
            Hit "Log Entry" to save your outfit to your journal. This updates your wear counts 
            and helps us identify your "Forgotten Items" over time.
          </p>
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 shadow-sm">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">The Goal</p>
            <p className="text-sm text-stone-600 italic leading-relaxed">
              Aim for a 100% utilization rate by rediscovering pieces you haven't worn in a while.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-32 p-12 bg-stone-900 rounded-[3rem] text-white overflow-hidden relative">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl font-serif italic mb-6">Ready to start?</h2>
          <p className="text-stone-400 text-lg mb-8 leading-relaxed">
            Your wardrobe is waiting to be rediscovered. Head over to the camera and log your first look of the day.
          </p>
          <a 
            href="#/" 
            className="inline-block px-10 py-4 bg-primary-500 text-white font-bold uppercase tracking-widest rounded-full hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20"
          >
            Open Camera
          </a>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-primary-500/50 to-transparent"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 text-primary-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
