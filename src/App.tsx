import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PublicLayout, ProtectedLayout } from "@/components/layout/AppLayout";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ErrorPage from "@/pages/ErrorPage";
import OverviewPage from "@/pages/dashboard/OverviewPage";
import DevicesPage from "@/pages/dashboard/devices/DevicesPage";
import MediaLibraryPage from "@/pages/dashboard/media/MediaLibraryPage";
import ProgramsPage from "@/pages/dashboard/programs/ProgramsPage";
import ProgramDetailsPage from "@/pages/dashboard/programs/ProgramDetailsPage";
import ProgramEditorPage from "@/pages/dashboard/programs/ProgramEditorPage";
import SettingsPage from "@/pages/dashboard/settings/SettingsPage";
import MapPage from "@/pages/dashboard/map/MapPage";
import DeviceDetailsPage from "@/pages/dashboard/devices/DeviceDetailsPage";
import SchedulePage from "@/pages/dashboard/schedule/SchedulePage";
import ScheduleDetailPage from "@/pages/dashboard/schedule/ScheduleDetailPage";
import MessagesPage from "@/pages/dashboard/messages/MessagesPage";
import MonitoringPage from "@/pages/dashboard/MonitoringPage";
import AnalyticsPage from "@/pages/dashboard/AnalyticsPage";
import LogsPage from "@/pages/dashboard/logs/LogsPage";
import HelpCenterPage from "@/pages/help/HelpCenterPage";
import RoadmapPage from "@/pages/content/RoadmapPage";
import AboutUsPage from "@/pages/content/AboutUsPage";
import BenefitsPage from "@/pages/content/BenefitsPage";
import FeaturesPage from "@/pages/content/FeaturesPage";
import APIPage from "@/pages/content/APIPage";
import PricingPage from "@/pages/content/PricingPage";
import BlogPage from "@/pages/content/BlogPage";
import PrivacyPolicyPage from "@/pages/content/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/content/TermsOfServicePage";
import MaintenancePage from "@/pages/MaintenancePage";
import { useSystemStore } from "@/store/systemStore";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "auth", element: <Navigate to="/login" replace /> },
      { path: "login", element: <AuthPage page="login" /> },
      { path: "register", element: <AuthPage page="register" /> },
      { path: "forgot-password", element: <AuthPage page="forgot-password" /> },
      { path: "privacy", element: <PrivacyPolicyPage /> },
      { path: "terms", element: <TermsOfServicePage /> },
      { path: "help/*", element: <HelpCenterPage /> },
      { path: "roadmap", element: <RoadmapPage /> },
      { path: "about", element: <AboutUsPage /> },
      { path: "benefits", element: <BenefitsPage /> },
      { path: "features", element: <FeaturesPage /> },
      { path: "api", element: <APIPage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "blog", element: <BlogPage /> },
      { path: "blog/:slug", element: <BlogPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: <ProtectedLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      { path: "overview", element: <OverviewPage /> },
      { path: "media", element: <MediaLibraryPage /> },
      { path: "programs", element: <ProgramsPage /> },
      { path: "programs/:programId", element: <ProgramDetailsPage /> },
      { path: "programs/:programId/edit", element: <ProgramEditorPage /> },
      { path: "devices", element: <DevicesPage /> },
      { path: "devices/:deviceId", element: <DeviceDetailsPage /> },
      { path: "schedule", element: <SchedulePage /> },
      { path: "schedule/:scheduleId", element: <ScheduleDetailPage /> },
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
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
