import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// 路由到面包屑的映射
const routeMap: Record<string, string> = {
  "/": "Home",
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
  const pathname = location.pathname;

  // 生成面包屑路径
  const generateBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: Array<{
      label: string;
      href: string;
      isCurrent: boolean;
    }> = [{ label: "Home", href: "/", isCurrent: pathname === "/" }];

    let currentPath = "";
    for (let i = 0; i < paths.length; i++) {
      currentPath += `/${paths[i]}`;
      const label = routeMap[currentPath] || paths[i];
      const isCurrent = currentPath === pathname;
      breadcrumbs.push({
        label,
        href: currentPath,
        isCurrent,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // 仅显示最后 3 个面包屑，以避免过长
  const displayBreadcrumbs = breadcrumbs.length > 3
    ? breadcrumbs.slice(-3)
    : breadcrumbs;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {displayBreadcrumbs.map((breadcrumb, index) => (
          <BreadcrumbItem key={breadcrumb.href}>
            {breadcrumb.isCurrent ? (
              <BreadcrumbPage className="truncate max-w-[200px]">
                {breadcrumb.label}
              </BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link to={breadcrumb.href} className="truncate max-w-[200px]">
                    {breadcrumb.label}
                  </Link>
                </BreadcrumbLink>
                {index < displayBreadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
