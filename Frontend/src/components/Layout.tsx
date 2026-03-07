import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useTrace } from "@/lib/TraceContext";
import TraceHeader from "./TraceHeader";

const Layout = () => {
  const { auth } = useTrace();
  const location = useLocation();

  // Redirect to login if not authenticated
  if (!auth.isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if authenticated and on login page
  if (auth.isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none scanline opacity-30 z-50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {auth.isAuthenticated && <TraceHeader />}
        
        {/* Render the current page */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
