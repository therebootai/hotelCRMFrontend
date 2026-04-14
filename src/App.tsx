import React, { useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard/Dashboard';

function App() {
  // 1. Create the state here at the very top level
  const [activeView, setActiveView] = useState<'calendar' | 'overview'>('calendar');

  return (
    // 2. Pass both the state AND the setter function down to AppLayout
    <AppLayout activeView={activeView} setActiveView={setActiveView}>
      
      {/* 3. Pass just the activeView state down to Dashboard so it knows what to render */}
      <Dashboard activeView={activeView} />
      
    </AppLayout>
  );
}

export default App;