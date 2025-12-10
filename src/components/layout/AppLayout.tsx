import { Outlet, Navigate } from "react-router-dom";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Toaster } from "sonner";

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
        <>
            <DashboardShell>
                <Outlet />
            </DashboardShell>
            <Toaster position="top-right" richColors />
        </>
    );
};
