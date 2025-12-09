import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { PublicLayout, ProtectedLayout } from "@/components/layout/AppLayout";
import LandingPage from "@/pages/LandingPage";
import LogoShowcase from "@/pages/LogoShowcase";
import AuthPage from "@/pages/AuthPage";
import NotFoundPage from "@/pages/NotFoundPage";

// Placeholder components
const Dashboard = () => <div className="text-2xl font-bold">Dashboard Overview</div>;

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "auth-form", element: <AuthPage /> },
      { path: "login", element: <Navigate to="/auth-form" replace /> },
      { path: "register", element: <Navigate to="/auth-form" replace /> },
      { path: "logo", element: <LogoShowcase /> },
    ],
  },
  {
    path: "/dashboard",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      { path: "overview", element: <Dashboard /> },
      // Add more dashboard routes here later
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
