import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import StaffMaster from './pages/StaffMaster/StaffMaster';
import Dashboard from './pages/Dashboard/Dashboard';
// Import your new StayOverview component
import StayOverview from './pages/Dashboard/StayOverview'; 
import Login from './pages/Auth/Login';

const MastersOverview = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Masters Dashboard</h1>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard Routing Block */}
          <Route path="dashboard">
            {/* Renders at /dashboard (Treating this as the Calendar view) */}
            <Route index element={<Dashboard />} />
            
            {/* Renders at /dashboard/stay-overview */}
            <Route path="stay-overview" element={<StayOverview />} />
          </Route>

          {/* Master Routing Block */}
          <Route path="master">
            <Route index element={<MastersOverview />} />
            <Route path="staff" element={<StaffMaster />} />
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}