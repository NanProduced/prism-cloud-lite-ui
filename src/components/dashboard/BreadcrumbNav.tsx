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
import { getProgram } from "@/features/programs/storage/programsDb";

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
  const pathname = location.pathname;

  const formatProgramFallback = (id: string) => {
    if (!id) return "Program";
    if (id.length <= 10) return `Program ${id}`;
    return `Program ${id.slice(0, 8)}…`;
  };

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
      const mapped = routeMap[currentPath];
      let label = mapped || paths[i];

      if (!mapped) {
        const segment = paths[i];
        const prevSegment = paths[i - 1] ?? "";
        const prevPrevSegment = paths[i - 2] ?? "";

        if (prevPrevSegment === "programs" && segment === "edit") {
          label = "Editor";
        } else if (prevSegment === "programs") {
          const program = getProgram(segment);
          label = program?.name ?? formatProgramFallback(segment);
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
