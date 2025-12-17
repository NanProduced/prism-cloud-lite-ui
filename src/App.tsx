import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { PublicLayout, ProtectedLayout } from "@/components/layout/AppLayout";
import LandingPage from "@/pages/LandingPage";
import LogoShowcase from "@/pages/LogoShowcase";
import AuthPage from "@/pages/AuthPage";
import NotFoundPage from "@/pages/NotFoundPage";
import OverviewPage from "@/pages/dashboard/OverviewPage";
import DevicesPage from "@/pages/dashboard/devices/DevicesPage";
import MediaLibraryPage from "@/pages/dashboard/media/MediaLibraryPage";
import ProgramsPage from "@/pages/dashboard/programs/ProgramsPage";
import ProgramDetailsPage from "@/pages/dashboard/programs/ProgramDetailsPage";
import ProgramEditorPage from "@/pages/dashboard/programs/ProgramEditorPage";
import SettingsPage from "@/pages/dashboard/settings/SettingsPage";
import {
  AnalyticsPage,
  MapPage,
  MonitoringPage,
  LogsPage,
  SchedulePage,
  MessagesPage,
} from "@/pages/dashboard/PlaceholderPages";

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
      { path: "overview", element: <OverviewPage /> },
      { path: "media", element: <MediaLibraryPage /> },
      { path: "programs", element: <ProgramsPage /> },
      { path: "programs/:programId", element: <ProgramDetailsPage /> },
      { path: "programs/:programId/edit", element: <ProgramEditorPage /> },
      { path: "devices", element: <DevicesPage /> },
      { path: "schedule", element: <SchedulePage /> },
      { path: "map", element: <MapPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "monitoring", element: <MonitoringPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "logs", element: <LogsPage /> },
      { path: "settings", element: <SettingsPage /> },
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
