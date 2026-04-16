import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Layout";
import StaffMaster from "./pages/StaffMaster/StaffMaster";
import Dashboard from "./pages/Dashboard/Dashboard";
import StayOverview from "./pages/Dashboard/StayOverview";
import Login from "./pages/Auth/Login";
import { Toaster } from "react-hot-toast";
import { FileQuestion } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import RoomMaster from "./pages/RoomMaster/RoomMaster";

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};


const LoadingScreen = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
  </div>
);

const NotFound = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-8 animate-fade-in">
    <div className="w-20 h-20 bg-orange-50 text-primary rounded-full flex items-center justify-center mb-6">
      <FileQuestion size={40} />
    </div>
    <h1 className="text-3xl font-bold text-text-primary mb-2">
      Page Not Found
    </h1>
    <p className="text-text-secondary text-center mb-8">
      We couldn't find the page you're looking for. It might have been moved,
      deleted, or never existed in the first place.
    </p>
    <button onClick={() => window.history.back()} className="btn-primary">
      Go Back
    </button>
  </div>
);

// const MastersOverview = () => (
//   <div className="p-8">
//     <h1 className="text-2xl font-bold text-text-primary">Masters Dashboard</h1>
//   </div>
// );

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard">
            <Route index element={<Dashboard />} />
            <Route path="stay-overview" element={<StayOverview />} />
          </Route>

          <Route path="master">
            {/* <Route index element={<MastersOverview />} /> */}
            <Route path="staff" element={<StaffMaster />} />
            <Route path="room" element={<RoomMaster/>}/>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
