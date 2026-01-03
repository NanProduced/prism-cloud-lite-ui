import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Search, 
  Book, 
  Zap, 
  LifeBuoy, 
  Shield, 
  Code, 
  MessageSquare, 
  ChevronRight,
  Menu,
  FileText,
  ExternalLink,
  ChevronDown,
  Globe
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  // filePath example: /docs/help/getting-started/intro.md or /docs/help-en/getting-started/intro.md
  const parts = filePath.replace(/^\/docs\/(help|help-en)\//, "").split("/");
  const first = parts[0] || "";
  if (first.toLowerCase().endsWith(".md")) return "home";
  return first;
}

function labelForSection(section: string, lang: string) {
  const labels: Record<string, Record<string, string>> = {
    zh: {
      home: "帮助中心",
      "getting-started": "快速开始",
      guides: "功能指南",
      faq: "常见问题",
      errors: "错误与排查",
      solutions: "行业解决方案",
    },
    en: {
      home: "Help Center",
      "getting-started": "Getting Started",
      guides: "Feature Guides",
      faq: "FAQ",
      errors: "Troubleshooting",
      solutions: "Industry Solutions",
    }
  };
  return labels[lang]?.[section] || section;
}

function labelForGuideCategory(category: string, lang: string) {
  const categories: Record<string, Record<string, string>> = {
    zh: {
      devices: "设备管理",
      "media-library": "素材库",
      programs: "节目制作",
      schedules: "排程计划",
      monitoring: "监控与报表",
      account: "账号与安全",
      "billing-and-quota": "套餐与额度",
    },
    en: {
      devices: "Device Management",
      "media-library": "Media Library",
      programs: "Program Creation",
      schedules: "Scheduling",
      monitoring: "Monitoring & Reports",
      account: "Account & Security",
      "billing-and-quota": "Plans & Quotas",
    }
  };
  return categories[lang]?.[category] || category;
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

function buildHelpNav(docs: HelpDoc[], lang: string): HelpNav {
  const filteredDocs = docs.filter(d => d.lang === lang);
  const home = filteredDocs.find((d) => (d.meta.slug || "").endsWith("/README"));

  const bySection = new Map<string, HelpDoc[]>();
  for (const doc of filteredDocs) {
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
      title: labelForSection("getting-started", lang),
      items: gettingStarted,
    });
  }

  const guides = bySection.get("guides") ?? [];
  if (guides.length) {
    const guideGroups = new Map<string, HelpDoc[]>();
    for (const doc of guides) {
      const rel = doc.filePath.replace(/^\/docs\/(help|help-en)\/guides\//, "");
      const category = rel.split("/")[0] || "other";
      const list = guideGroups.get(category) ?? [];
      list.push(doc);
      guideGroups.set(category, list);
    }

    sections.push({
      key: "guides",
      title: labelForSection("guides", lang),
      groups: Array.from(guideGroups.entries())
        .map(([key, items]) => ({
          key,
          title: labelForGuideCategory(key, lang),
          items,
        }))
        .sort((a, b) => a.key.localeCompare(b.key)),
    });
  }

  for (const key of ["faq", "errors", "solutions"] as const) {
    const items = bySection.get(key) ?? [];
    if (items.length) {
      sections.push({ key, title: labelForSection(key, lang), items });
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
    doc.body
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

const HelpHome = ({ onSearch, lang }: { onSearch: (q: string) => void, lang: string }) => {
  const content = {
    zh: {
      title: "您需要什么帮助？",
      placeholder: "搜索文档、指南或常见问题...",
      ctaTitle: "没找到您要找的内容？",
      ctaDesc: "我们的支持团队随时为您提供帮助。通常在 24 小时内回复。",
      ctaBtn: "联系支持",
      categories: [
        { title: "快速开始", icon: Zap, desc: "从零开始设置您的第一个显示屏。", color: "text-amber-400", bg: "bg-amber-500/10", link: "/help/getting-started" },
        { title: "功能指南", icon: Book, desc: "深入了解每个模块的详细用法。", color: "text-blue-400", bg: "bg-blue-500/10", link: "/help/guides" },
        { title: "常见问题", icon: LifeBuoy, desc: "查找最常见问题的即时解答。", color: "text-emerald-400", bg: "bg-emerald-500/10", link: "/help/faq" },
        { title: "故障排除", icon: Shield, desc: "解决设备连接和播放中的问题。", color: "text-rose-400", bg: "bg-rose-500/10", link: "/help/errors" },
        { title: "API 文档", icon: Code, desc: "为开发者提供的接口参考手册。", color: "text-purple-400", bg: "bg-purple-500/10", link: "/api" },
        { title: "社区支持", icon: MessageSquare, desc: "加入我们的 Discord 与其他用户交流。", color: "text-indigo-400", bg: "bg-indigo-500/10", link: "https://discord.gg/prismcloud" }
      ]
    },
    en: {
      title: "How can we help?",
      placeholder: "Search documentation, guides, or FAQ...",
      ctaTitle: "Can't find what you're looking for?",
      ctaDesc: "Our support team is here to help. We usually respond within 24 hours.",
      ctaBtn: "Contact Support",
      categories: [
        { title: "Getting Started", icon: Zap, desc: "Set up your first screen from scratch.", color: "text-amber-400", bg: "bg-amber-500/10", link: "/help/getting-started" },
        { title: "Guides", icon: Book, desc: "In-depth details on every module.", color: "text-blue-400", bg: "bg-blue-500/10", link: "/help/guides" },
        { title: "FAQ", icon: LifeBuoy, desc: "Instant answers to common questions.", color: "text-emerald-400", bg: "bg-emerald-500/10", link: "/help/faq" },
        { title: "Troubleshooting", icon: Shield, desc: "Fix device connection and playback issues.", color: "text-rose-400", bg: "bg-rose-500/10", link: "/help/errors" },
        { title: "API Reference", icon: Code, desc: "Technical manual for developers.", color: "text-purple-400", bg: "bg-purple-500/10", link: "/api" },
        { title: "Community", icon: MessageSquare, desc: "Join our Discord to talk with other users.", color: "text-indigo-400", bg: "bg-indigo-500/10", link: "https://discord.gg/prismcloud" }
      ]
    }
  }[lang] || { title: "", placeholder: "", ctaTitle: "", ctaDesc: "", ctaBtn: "", categories: [] };

  return (
    <div className="space-y-16 py-10 animate-in fade-in duration-700">
      {/* Hero */}
      <div className="text-center py-12 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter text-white">{content.title}</h1>
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={24} />
          <input 
            type="text" 
            placeholder={content.placeholder}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full h-16 bg-white/[0.03] border border-white/10 rounded-2xl pl-14 pr-6 text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-[0_0_50px_rgba(0,0,0,0.3)] placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.categories.map((cat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link 
              to={cat.link}
              className="block p-8 rounded-[32px] bg-white/[0.01] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group h-full relative overflow-hidden"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-2xl", cat.bg, cat.color)}>
                <cat.icon size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4 flex items-center justify-between text-white">
                {cat.title}
                <ChevronRight size={20} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-400" />
              </h3>
              <p className="text-slate-400 leading-relaxed font-medium">{cat.desc}</p>
              
              {/* Subtle hover decoration */}
              <div className={cn("absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity", cat.color.replace('text', 'bg'))} />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="p-12 rounded-[48px] bg-[#0d0d0d] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.05)_0%,transparent_60%)]" />
        <div className="relative z-10">
          <h4 className="text-2xl font-bold mb-3 text-white tracking-tight">{content.ctaTitle}</h4>
          <p className="text-slate-400 font-medium">{content.ctaDesc}</p>
        </div>
        <button className="relative z-10 px-10 py-4 bg-white text-black rounded-2xl font-black hover:bg-slate-200 transition-all shadow-xl whitespace-nowrap">
          {content.ctaBtn}
        </button>
      </div>
    </div>
  );
};

export default function HelpCenterPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === "zh-CN" || i18n.language === "zh" ? "zh" : "en";
  const navigate = useNavigate();
  const params = useParams();
  const rest = typeof params["*"] === "string" ? params["*"] : "";
  const restDecoded = safeDecodeURIComponent(rest);
  const slug =
    restDecoded && restDecoded.length > 0
      ? `/help/${restDecoded}`
      : "/help/README";

  const fullLookupKey = `${lang}${slug}`;
  const requestedDoc = helpDocBySlug.get(fullLookupKey);
  
  // Try fallback to other language if not found (optional but user-friendly)
  const otherLang = lang === "zh" ? "en" : "zh";
  const fallbackDoc = !requestedDoc ? helpDocBySlug.get(`${otherLang}${slug}`) : null;
  
  const doc = requestedDoc ?? fallbackDoc ?? helpDocBySlug.get(`${lang}/help/README`);
  const isHome = slug === "/help/README" || (!requestedDoc && !fallbackDoc);
  const notFound = !requestedDoc && !fallbackDoc && slug !== "/help/README";

  const [query, setQuery] = useState("");
  const nav = useMemo(() => buildHelpNav(helpDocs, lang), [lang]);

  const filteredDocs = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return helpDocs.filter((d) => d.lang === lang && matchesQuery(d, q));
  }, [query, lang]);

  const currentSlug = doc?.meta.slug || slug;

  // Sync scroll on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black text-slate-50 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      
      <div className="pt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[280px_1fr]">
            {/* Sidebar - Vercel Style */}
            <aside className="lg:sticky lg:top-28 lg:h-[calc(100vh-140px)] flex flex-col gap-6">
              <div className="relative group">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={lang === 'zh' ? "搜索文档..." : "Search..."}
                  className="h-10 border-white/5 bg-white/[0.03] pl-9 text-slate-50 placeholder:text-slate-600 focus-visible:ring-indigo-500/50 rounded-xl"
                />
              </div>

              <ScrollArea className="flex-1 -mr-4 pr-4">
                <div className="space-y-8 pb-10">
                  {/* Home Link */}
                  <div className="space-y-2">
                    <Link
                      to="/help"
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-all",
                        isHome ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Globe size={16} />
                      {lang === 'zh' ? "帮助中心首页" : "Documentation Home"}
                    </Link>
                  </div>

                  {filteredDocs ? (
                    <div className="space-y-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 px-3">
                        {lang === 'zh' ? "搜索结果" : "Search Results"}
                      </div>
                      <div className="space-y-1">
                        {filteredDocs.map((d) => (
                          <Link
                            key={d.filePath}
                            to={d.meta.slug || "/help/README"}
                            className={cn(
                              "block rounded-lg px-3 py-2 text-sm transition-all",
                              currentSlug === d.meta.slug
                                ? "bg-white/10 text-white font-bold"
                                : "text-slate-400 hover:text-white hover:bg-white/5",
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{docTitle(d)}</span>
                              {d.meta.status && d.meta.status !== "stable" && (
                                <Badge variant="secondary" className="h-4 px-1 text-[8px] uppercase bg-indigo-500/20 text-indigo-300">
                                  {d.meta.status}
                                </Badge>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {nav.sections.map((section) => {
                        if ("items" in section) {
                          return (
                            <div key={section.key} className="space-y-2">
                              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-3">
                                {section.title}
                              </div>
                              <div className="space-y-1">
                                {section.items.map((d) => (
                                  <Link
                                    key={d.filePath}
                                    to={d.meta.slug || "/help/README"}
                                    className={cn(
                                      "block rounded-lg px-3 py-2 text-sm transition-all",
                                      currentSlug === d.meta.slug
                                        ? "bg-white/10 text-white font-bold border-l-2 border-indigo-500 rounded-l-none"
                                        : "text-slate-400 hover:text-white hover:bg-white/5",
                                    )}
                                  >
                                    <span className="truncate">
                                      {docTitle(d)}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={section.key} className="space-y-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-3">
                              {section.title}
                            </div>
                            <div className="space-y-6">
                              {section.groups.map((group) => (
                                <div key={group.key} className="space-y-1">
                                  <div className="px-3 text-[11px] font-bold text-slate-600 mb-2">
                                    {group.title}
                                  </div>
                                  <div className="space-y-1">
                                    {group.items.map((d) => (
                                      <Link
                                        key={d.filePath}
                                        to={d.meta.slug || "/help/README"}
                                        className={cn(
                                          "block rounded-lg px-3 py-2 text-sm transition-all border-l border-white/5 ml-3",
                                          currentSlug === d.meta.slug
                                            ? "text-indigo-400 font-bold border-indigo-500"
                                            : "text-slate-500 hover:text-slate-300 hover:border-white/20",
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
            </aside>

            {/* Content Area */}
            <main className="min-w-0">
              <AnimatePresence mode="wait">
                {isHome && !query ? (
                  <HelpHome onSearch={setQuery} lang={lang} />
                ) : (
                  <motion.div 
                    key={currentSlug}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-4xl"
                  >
                    {!doc || notFound ? (
                      <div className="rounded-[40px] border border-white/5 bg-[#0d0d0d] p-12 text-center">
                        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8">
                          <Shield size={40} />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-4">
                          {lang === 'zh' ? "文档未找到" : "Document Not Found"}
                        </h1>
                        <p className="text-slate-500 font-medium mb-10">
                          {lang === 'zh' 
                            ? "抱歉，我们找不到您请求的页面。它可能已被移动或删除。" 
                            : "Sorry, we couldn't find the page you requested. It might have been moved or deleted."}
                        </p>
                        <Button 
                          onClick={() => navigate('/help')}
                          className="bg-white text-black hover:bg-slate-200 font-black px-8 h-12 rounded-xl"
                        >
                          {lang === 'zh' ? "返回首页" : "Back to Home"}
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-[40px] border border-white/5 bg-[#0a0a0a] p-8 md:p-16 shadow-2xl relative overflow-hidden">
                        {/* Status bar */}
                        <div className="mb-12 flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8">
                          <div className="flex flex-wrap items-center gap-3">
                            {doc.meta.module && (
                              <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-300 font-bold px-3 py-0.5">
                                {doc.meta.module}
                              </Badge>
                            )}
                            {doc.meta.status && doc.meta.status !== "stable" && (
                              <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/30">
                                {doc.meta.status.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            {doc.meta.lastUpdated && (
                              <span>Updated: {doc.meta.lastUpdated}</span>
                            )}
                            <span className="opacity-30">{doc.lang.toUpperCase()}</span>
                          </div>
                        </div>

                        {/* Language Switch Warning if falling back */}
                        {!requestedDoc && fallbackDoc && (
                          <div className="mb-10 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium flex items-center gap-3">
                            <LifeBuoy size={18} />
                            {lang === 'zh' 
                              ? "此文档暂无中文版，为您显示英文原版。" 
                              : "This document is not yet available in English, showing Chinese version."}
                          </div>
                        )}

                        <div className="help-markdown prose prose-invert prose-indigo max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-10 leading-tight">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-16 mb-6 border-b border-white/5 pb-4">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-xl font-bold text-white mt-10 mb-4 tracking-tight">
                                  {children}
                                </h3>
                              ),
                              p: ({ children }) => (
                                <p className="text-slate-400 leading-relaxed mb-6 font-medium text-base md:text-lg">
                                  {children}
                                </p>
                              ),
                              li: ({ children }) => (
                                <li className="text-slate-400 leading-relaxed mb-2 font-medium">
                                  {children}
                                </li>
                              ),
                              code: ({ inline, className, children, ...props }: any) => {
                                const match = /language-(\w+)/.exec(className || "");
                                return !inline ? (
                                  <div className="relative my-8 group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                    <pre className="relative overflow-x-auto rounded-2xl bg-black border border-white/10 p-6 font-mono text-sm leading-relaxed text-indigo-300">
                                      <code {...props}>{children}</code>
                                    </pre>
                                  </div>
                                ) : (
                                  <code
                                    className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-xs text-indigo-300"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                              a: ({ href, children, ...props }) => {
                                const rawHref = typeof href === "string" ? href : "";
                                const [pathPart, hashPart] = rawHref.split("#", 2);

                                if (!rawHref) return <a {...props}>{children}</a>;
                                if (rawHref.startsWith("#")) {
                                  return (
                                    <a href={rawHref} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/30" {...props}>
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
                                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/30"
                                      {...props}
                                    >
                                      {children}
                                      <ExternalLink size={12} />
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
                                      <Link to={to} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/30" {...props}>
                                        {children}
                                      </Link>
                                    );
                                  }
                                }

                                return (
                                  <a href={rawHref} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4" {...props}>
                                    {children}
                                  </a>
                                );
                              },
                              table: ({ children }) => (
                                <div className="my-8 overflow-x-auto rounded-2xl border border-white/5">
                                  <table className="w-full text-left text-sm border-collapse">
                                    {children}
                                  </table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className="bg-white/5 px-6 py-4 font-black text-white uppercase tracking-widest text-[10px] border-b border-white/10">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="px-6 py-4 text-slate-400 border-b border-white/5">
                                  {children}
                                </td>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="my-8 border-l-4 border-indigo-500 bg-indigo-500/5 px-8 py-6 rounded-r-2xl italic text-slate-300">
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {doc.body}
                          </ReactMarkdown>
                        </div>
                        
                        {/* Page Navigation Footer */}
                        <div className="mt-20 pt-10 border-t border-white/5 flex items-center justify-between">
                          <button 
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-indigo-400 transition-colors"
                          >
                            Back to Top ↑
                          </button>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-600 font-medium italic">Found a mistake?</span>
                            <button className="text-xs font-black text-indigo-400 uppercase tracking-widest hover:underline decoration-indigo-500/30">
                              Edit this page
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}