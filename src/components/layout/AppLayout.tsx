import { Outlet, Navigate } from "react-router-dom";

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      {/* Simple Header for Public Zone */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo is injected by the page usually, but we can have it here too */}
            <div /> 
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-400">
                <a href="#features" className="hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                <a href="/login" className="text-white bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all border border-white/5">
                    Login
                </a>
            </nav>
        </div>
      </header>
      
      <main className="pt-16">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 py-12 text-center text-slate-600 text-sm">
        <p>© 2025 Prism Cloud. All rights reserved.</p>
      </footer>
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
