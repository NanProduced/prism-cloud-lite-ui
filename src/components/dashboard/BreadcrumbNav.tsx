import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbStore } from "@/store/breadcrumbStore";

// Route to breadcrumb label mapping
const routeMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/overview": "Overview",
  "/dashboard/devices": "Devices",
  "/dashboard/media": "Media Library",
  "/dashboard/programs": "Programs",
  "/dashboard/schedule": "Schedule",
  "/dashboard/map": "Map",
  "/dashboard/monitoring": "Monitoring",
  "/dashboard/analytics": "Analytics",
  "/dashboard/messages": "Messages",
  "/dashboard/logs": "Logs",
  "/dashboard/settings": "Settings",
};

export function BreadcrumbNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname.replace(/\/$/, "") || "/";
  const overrides = useBreadcrumbStore((state) => state.overrides);

  // Generate breadcrumb paths
  const generateBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: Array<{
      label: string;
      href: string;
      isCurrent: boolean;
    }> = [];

    let currentPath = "";
    for (let i = 0; i < paths.length; i++) {
      currentPath += `/${paths[i]}`;
      
      // Try exact match and normalized match
      const override = overrides[currentPath] || overrides[currentPath + "/"];
      const mapped = routeMap[currentPath];
      
      let label = override || mapped;

      if (!label) {
        // Dynamic segments fallbacks
        const segment = paths[i];
        const prevSegment = paths[i - 1] ?? "";
        const prevPrevSegment = paths[i - 2] ?? "";

        if (prevPrevSegment === "programs" && segment === "edit") {
          label = "Editor";
        } else if (prevSegment === "programs") {
          label = "Program Details";
        } else if (prevSegment === "schedule" || prevSegment === "schedules") {
          label = "Schedule Details";
        } else if (prevSegment === "devices") {
          label = "Device Details";
        } else {
          label = segment;
        }
      }
      
      const isCurrent = currentPath === pathname;
      
      breadcrumbs.push({
        label,
        href: currentPath === "/dashboard" ? "/dashboard/overview" : currentPath,
        isCurrent,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Only display the last 3 breadcrumbs to avoid too long paths
  const displayBreadcrumbs = breadcrumbs.length > 3
    ? breadcrumbs.slice(-3)
    : breadcrumbs;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {displayBreadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.href}>
            <BreadcrumbItem>
              {breadcrumb.isCurrent ? (
                <BreadcrumbPage className="truncate max-w-[200px]">
                  {breadcrumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  onClick={() => navigate(breadcrumb.href)}
                  className="truncate max-w-[200px] cursor-pointer"
                >
                  {breadcrumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < displayBreadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}