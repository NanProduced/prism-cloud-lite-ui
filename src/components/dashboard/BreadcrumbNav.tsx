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
import { useTranslation } from "react-i18next";

export function BreadcrumbNav() {
  const { t } = useTranslation();
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
      
      const routeMap: Record<string, string> = {
        "/dashboard": t('shell.breadcrumbs.dashboard'),
        "/dashboard/overview": t('shell.breadcrumbs.overview'),
        "/dashboard/devices": t('shell.breadcrumbs.devices'),
        "/dashboard/media": t('shell.breadcrumbs.media'),
        "/dashboard/programs": t('shell.breadcrumbs.programs'),
        "/dashboard/schedule": t('shell.breadcrumbs.schedule'),
        "/dashboard/map": t('shell.breadcrumbs.map'),
        "/dashboard/monitoring": t('shell.breadcrumbs.monitoring'),
        "/dashboard/analytics": t('shell.breadcrumbs.analytics'),
        "/dashboard/messages": t('shell.breadcrumbs.messages'),
        "/dashboard/logs": t('shell.breadcrumbs.logs'),
        "/dashboard/settings": t('shell.breadcrumbs.settings'),
      };
      
      const mapped = routeMap[currentPath];
      
      let label = override || mapped;

      if (!label) {
        // Dynamic segments fallbacks
        const segment = paths[i];
        const prevSegment = paths[i - 1] ?? "";
        const prevPrevSegment = paths[i - 2] ?? "";

        if (prevPrevSegment === "programs" && segment === "edit") {
          label = t('shell.breadcrumbs.editor');
        } else if (prevSegment === "programs") {
          label = t('shell.breadcrumbs.programDetails');
        } else if (prevSegment === "schedule" || prevSegment === "schedules") {
          label = t('shell.breadcrumbs.scheduleDetails');
        } else if (prevSegment === "devices") {
          label = t('shell.breadcrumbs.deviceDetails');
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