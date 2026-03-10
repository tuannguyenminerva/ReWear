import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { CameraView } from './pages/CameraView';
import { WardrobeView } from './pages/WardrobeView';
import { InsightsView } from './pages/InsightsView';
import { InstructionsView } from './pages/InstructionsView';
import { RegisterView } from './pages/RegisterView';
import { WardrobeProvider } from './WardrobeContext';

const App: React.FC = () => {
  return (
    <WardrobeProvider>
      <HashRouter>
        <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-primary-200 selection:text-primary-900">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<CameraView />} />
              <Route path="/wardrobe" element={<WardrobeView />} />
              <Route path="/insights" element={<InsightsView />} />
              <Route path="/instructions" element={<InstructionsView />} />
              <Route path="/register" element={<RegisterView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </WardrobeProvider>
  );
};

export default App;