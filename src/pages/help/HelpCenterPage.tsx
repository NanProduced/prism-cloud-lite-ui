import React, { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Search } from "lucide-react";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
  helpDocByFilePath,
  helpDocBySlug,
  helpDocs,
  resolveRelativeDocFilePath,
  type HelpDoc,
} from "@/features/docs/helpDocs";

import "@/features/docs/help-markdown.css";

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function docTitle(doc: HelpDoc) {
  return doc.meta.title || doc.meta.slug || doc.filePath;
}

function sectionFromFilePath(filePath: string) {
  const parts = filePath.replace(/^\/docs\/help\//, "").split("/");
  const first = parts[0] || "";
  if (first.toLowerCase() === "readme.md") return "home";
  return first;
}

function labelForSection(section: string) {
  switch (section) {
    case "home":
      return "帮助中心";
    case "getting-started":
      return "快速开始";
    case "guides":
      return "功能指南";
    case "faq":
      return "常见问题";
    case "errors":
      return "错误与排查";
    case "solutions":
      return "行业解决方案";
    default:
      return section;
  }
}

function labelForGuideCategory(category: string) {
  switch (category) {
    case "devices":
      return "设备管理";
    case "media-library":
      return "素材库";
    case "programs":
      return "节目制作";
    case "schedules":
      return "排程计划";
    case "monitoring":
      return "监控与报表";
    case "account":
      return "账号与安全";
    case "billing-and-quota":
      return "套餐与额度";
    default:
      return category;
  }
}

type HelpNav = {
  home?: HelpDoc;
  sections: Array<
    | {
        key: string;
        title: string;
        items: HelpDoc[];
      }
    | {
        key: "guides";
        title: string;
        groups: Array<{ key: string; title: string; items: HelpDoc[] }>;
      }
  >;
};

function buildHelpNav(docs: HelpDoc[]): HelpNav {
  const home = docs.find((d) => (d.meta.slug || "").endsWith("/README"));

  const bySection = new Map<string, HelpDoc[]>();
  for (const doc of docs) {
    const section = sectionFromFilePath(doc.filePath);
    if (section === "home") continue;
    const list = bySection.get(section) ?? [];
    list.push(doc);
    bySection.set(section, list);
  }

  const sections: HelpNav["sections"] = [];

  const gettingStarted = bySection.get("getting-started") ?? [];
  if (gettingStarted.length) {
    sections.push({
      key: "getting-started",
      title: labelForSection("getting-started"),
      items: gettingStarted,
    });
  }

  const guides = bySection.get("guides") ?? [];
  if (guides.length) {
    const guideGroups = new Map<string, HelpDoc[]>();
    for (const doc of guides) {
      const rel = doc.filePath.replace(/^\/docs\/help\/guides\//, "");
      const category = rel.split("/")[0] || "other";
      const list = guideGroups.get(category) ?? [];
      list.push(doc);
      guideGroups.set(category, list);
    }

    sections.push({
      key: "guides",
      title: labelForSection("guides"),
      groups: Array.from(guideGroups.entries())
        .map(([key, items]) => ({
          key,
          title: labelForGuideCategory(key),
          items,
        }))
        .sort((a, b) => a.key.localeCompare(b.key)),
    });
  }

  for (const key of ["faq", "errors", "solutions"] as const) {
    const items = bySection.get(key) ?? [];
    if (items.length) {
      sections.push({ key, title: labelForSection(key), items });
    }
  }

  for (const section of sections) {
    if ("items" in section) {
      section.items.sort((a, b) => docTitle(a).localeCompare(docTitle(b)));
    } else {
      section.groups.forEach((g) =>
        g.items.sort((a, b) => docTitle(a).localeCompare(docTitle(b))),
      );
    }
  }

  return { home, sections };
}

function matchesQuery(doc: HelpDoc, query: string) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    doc.meta.title,
    doc.meta.slug,
    doc.meta.module,
    ...(doc.meta.tags ?? []),
    ...(doc.meta.tasks ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export default function HelpCenterPage() {
  const location = useLocation();
  const params = useParams();
  const rest = typeof params["*"] === "string" ? params["*"] : "";
  const restDecoded = safeDecodeURIComponent(rest);
  const slug =
    restDecoded && restDecoded.length > 0
      ? `/help/${restDecoded}`
      : "/help/README";

  const requestedDoc = helpDocBySlug.get(slug);
  const doc = requestedDoc ?? helpDocBySlug.get("/help/README");
  const notFound = !requestedDoc && slug !== "/help/README";

  const [query, setQuery] = useState("");
  const nav = useMemo(() => buildHelpNav(helpDocs), []);

  const filteredDocs = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return helpDocs.filter((d) => matchesQuery(d, q));
  }, [query]);

  const currentSlug = doc?.meta.slug || slug;

  return (
    <div className="min-h-screen bg-black text-slate-50">
      <Navbar />
      <div className="pt-16">
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜索帮助文档…"
                    className="h-10 border-white/10 bg-black/30 pl-9 text-slate-50 placeholder:text-white/40 focus-visible:ring-indigo-500"
                  />
                </div>

                <div className="mt-4">
                  <ScrollArea className="h-[calc(100vh-220px)] pr-3">
                    <div className="space-y-6">
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold tracking-wide text-white/70">
                          {labelForSection("home")}
                        </div>
                        <Link
                          to={nav.home?.meta.slug || "/help/README"}
                          className={cn(
                            "block rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/10",
                            currentSlug === (nav.home?.meta.slug || "/help/README")
                              ? "bg-white/10 text-white"
                              : "text-white/80",
                          )}
                        >
                          {nav.home ? docTitle(nav.home) : "帮助中心"}
                        </Link>
                      </div>

                      {filteredDocs ? (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold tracking-wide text-white/70">
                            搜索结果
                          </div>
                          <div className="space-y-1">
                            {filteredDocs.map((d) => (
                              <Link
                                key={d.filePath}
                                to={d.meta.slug || "/help/README"}
                                className={cn(
                                  "block rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/10",
                                  currentSlug === d.meta.slug
                                    ? "bg-white/10 text-white"
                                    : "text-white/80",
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate">{docTitle(d)}</span>
                                  {d.meta.status &&
                                    d.meta.status !== "stable" && (
                                      <Badge
                                        variant="secondary"
                                        className="h-5 px-1.5 text-[10px]"
                                      >
                                        {d.meta.status}
                                      </Badge>
                                    )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {nav.sections.map((section) => {
                            if ("items" in section) {
                              return (
                                <div key={section.key} className="space-y-2">
                                  <div className="text-xs font-semibold tracking-wide text-white/70">
                                    {section.title}
                                  </div>
                                  <div className="space-y-1">
                                    {section.items.map((d) => (
                                      <Link
                                        key={d.filePath}
                                        to={d.meta.slug || "/help/README"}
                                        className={cn(
                                          "block rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/10",
                                          currentSlug === d.meta.slug
                                            ? "bg-white/10 text-white"
                                            : "text-white/80",
                                        )}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="truncate">
                                            {docTitle(d)}
                                          </span>
                                          {d.meta.status &&
                                            d.meta.status !== "stable" && (
                                              <Badge
                                                variant="secondary"
                                                className="h-5 px-1.5 text-[10px]"
                                              >
                                                {d.meta.status}
                                              </Badge>
                                            )}
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div key={section.key} className="space-y-2">
                                <div className="text-xs font-semibold tracking-wide text-white/70">
                                  {section.title}
                                </div>
                                <div className="space-y-3">
                                  {section.groups.map((group) => (
                                    <div key={group.key} className="space-y-1">
                                      <div className="px-2 text-xs font-medium text-white/60">
                                        {group.title}
                                      </div>
                                      <div className="space-y-1">
                                        {group.items.map((d) => (
                                          <Link
                                            key={d.filePath}
                                            to={d.meta.slug || "/help/README"}
                                            className={cn(
                                              "block rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/10",
                                              currentSlug === d.meta.slug
                                                ? "bg-white/10 text-white"
                                                : "text-white/80",
                                            )}
                                          >
                                            <span className="truncate">
                                              {docTitle(d)}
                                            </span>
                                          </Link>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </aside>

            <main className="min-w-0">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                {!doc || notFound ? (
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      文档未找到
                    </h1>
                    <p className="mt-2 text-sm text-white/70">
                      路径：<span className="font-mono">{slug}</span>
                    </p>
                    <p className="mt-6 text-sm text-white/70">
                      你可以在左侧搜索或从帮助中心首页开始浏览。
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {doc.meta.module && (
                          <Badge variant="secondary">{doc.meta.module}</Badge>
                        )}
                        {doc.meta.status && doc.meta.status !== "stable" && (
                          <Badge variant="secondary">{doc.meta.status}</Badge>
                        )}
                        {doc.meta.lastUpdated && (
                          <span className="text-xs text-white/60">
                            更新：{doc.meta.lastUpdated}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/40 font-mono">
                        {location.pathname}
                      </span>
                    </div>

                    <div className="help-markdown">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children, ...props }) => {
                          const rawHref = typeof href === "string" ? href : "";
                          const [pathPart, hashPart] = rawHref.split("#", 2);

                          if (!rawHref) return <a {...props}>{children}</a>;
                          if (rawHref.startsWith("#")) {
                            return (
                              <a href={rawHref} {...props}>
                                {children}
                              </a>
                            );
                          }
                          if (/^(https?:)?\/\//.test(rawHref)) {
                            return (
                              <a
                                href={rawHref}
                                target="_blank"
                                rel="noreferrer"
                                {...props}
                              >
                                {children}
                              </a>
                            );
                          }

                          if (pathPart.endsWith(".md")) {
                            const resolved = resolveRelativeDocFilePath(
                              doc.filePath,
                              pathPart,
                            );
                            const targetDoc = resolved
                              ? helpDocByFilePath.get(resolved)
                              : null;
                            if (targetDoc?.meta.slug) {
                              const to = hashPart
                                ? `${targetDoc.meta.slug}#${hashPart}`
                                : targetDoc.meta.slug;
                              return (
                                <Link to={to} {...props}>
                                  {children}
                                </Link>
                              );
                            }
                          }

                          return (
                            <a href={rawHref} {...props}>
                              {children}
                            </a>
                          );
                          },
                        }}
                      >
                        {doc.body}
                      </ReactMarkdown>
                    </div>
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
