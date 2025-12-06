import { Outlet, Navigate } from "react-router-dom";

export const PublicLayout = () => {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
};

export const ProtectedLayout = () => {
    // Mock Auth Check
    const isAuthenticated = true; // TODO: Replace with real auth store
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex">
            {/* Sidebar Placeholder */}
            <aside className="w-64 border-r border-white/5 bg-slate-900/50 hidden md:block">
                <div className="p-6">Protected Area</div>
            </aside>
            
            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
};
