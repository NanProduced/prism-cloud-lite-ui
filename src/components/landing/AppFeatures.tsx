import { FadeIn } from "@/components/ui/FadeIn";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BentoCardProps {
  title: string;
  description: string;
  className?: string;
  graphic?: ReactNode;
  delay?: number;
}

const BentoCard = ({
  title,
  description,
  className,
  graphic,
  delay = 0,
}: BentoCardProps) => {
  return (
    <FadeIn delay={delay} className={cn("group", className)}>
      <div
        className={cn(
          "relative h-full flex flex-col overflow-hidden rounded-2xl",
          "bg-[#0a0a0a] border border-white/[0.06]",
          "transition-all duration-300",
          "hover:border-white/[0.12]"
        )}
      >
        {/* Text Content - Top */}
        <div className="p-6 pb-4">
          <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">
            {title}
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed mb-4">
            {description}
          </p>
          <button className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Graphic - Bottom */}
        <div className="mt-auto px-4 pb-4 flex-1 flex items-end">
          {graphic}
        </div>
      </div>
    </FadeIn>
  );
};

// ========== UI Mockup Graphics ==========

// Security: OAuth Login Interface
const SecurityMockup = () => (
  <div className="w-full">
    <div className="bg-neutral-900/80 rounded-xl border border-white/[0.06] p-4 space-y-3">
      {/* Google Sign In Button */}
      <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2.5">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="text-neutral-800 text-sm font-medium">Continue with Google</span>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-neutral-500 text-xs">or</span>
        <div className="flex-1 h-px bg-white/10"></div>
      </div>

      {/* SSO Options */}
      <div className="flex gap-2">
        <div className="flex-1 bg-neutral-800 rounded-lg px-3 py-2 text-center">
          <span className="text-neutral-300 text-xs">SAML SSO</span>
        </div>
        <div className="flex-1 bg-neutral-800 rounded-lg px-3 py-2 text-center">
          <span className="text-neutral-300 text-xs">OIDC</span>
        </div>
      </div>
    </div>
  </div>
);

// Transcode: Video Processing UI
const TranscodeMockup = () => (
  <div className="w-full">
    <div className="bg-neutral-900/80 rounded-xl border border-white/[0.06] p-3 space-y-3">
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[5px] border-y-transparent ml-1"></div>
          </div>
        </div>
        <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
          4K
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-neutral-400">Transcoding...</span>
          <span className="text-cyan-400">78%</span>
        </div>
        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full w-[78%] bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"></div>
        </div>
      </div>

      {/* Format Tags */}
      <div className="flex items-center gap-2 text-[10px]">
        <span className="text-neutral-500">MP4</span>
        <span className="text-neutral-600">→</span>
        <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">H.265</span>
      </div>
    </div>
  </div>
);

// Editor: Layout Editor UI
const EditorMockup = () => (
  <div className="w-full">
    <div className="bg-neutral-900/80 rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/[0.06]">
        {["T", "□", "○", "▷"].map((icon, i) => (
          <div key={i} className={cn(
            "w-6 h-6 rounded flex items-center justify-center text-[10px]",
            i === 0 ? "bg-green-500/20 text-green-400" : "text-neutral-500 hover:bg-neutral-800"
          )}>
            {icon}
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="p-3">
        <div className="aspect-[16/10] bg-neutral-950 rounded-lg border border-white/[0.04] p-2 relative">
          {/* Text Layer */}
          <div className="absolute top-3 left-3 right-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded px-2 py-1">
              <div className="h-2 w-20 bg-green-500/40 rounded"></div>
            </div>
          </div>
          {/* Image Layer */}
          <div className="absolute bottom-3 left-3 w-12 h-8 bg-neutral-800 rounded border border-white/[0.06]"></div>
          {/* Shape Layer */}
          <div className="absolute bottom-3 right-3 w-8 h-8 border-2 border-dashed border-neutral-600 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

// Analytics: Monitoring Dashboard Cards
const AnalyticsMockup = () => (
  <div className="w-full">
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "CPU", value: "23%", color: "text-amber-400", bg: "bg-amber-500/10" },
        { label: "Memory", value: "4.2G", color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "Storage", value: "67%", color: "text-blue-400", bg: "bg-blue-500/10" },
      ].map((stat, i) => (
        <div key={i} className={cn("rounded-xl p-3 border border-white/[0.06]", stat.bg)}>
          <div className={cn("text-lg font-semibold", stat.color)}>{stat.value}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>

    {/* Mini Chart */}
    <div className="mt-2 bg-neutral-900/80 rounded-xl border border-white/[0.06] p-3">
      <div className="flex items-end gap-1 h-10">
        {[40, 65, 45, 80, 55, 70, 45, 60, 75, 50, 85, 60].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-amber-500/60 to-amber-500/20 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  </div>
);

// Developer: Terminal/API Interface
const DeveloperMockup = () => (
  <div className="w-full">
    <div className="bg-neutral-900/80 rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"></div>
        <span className="ml-2 text-[10px] text-neutral-500">terminal</span>
      </div>

      {/* Code */}
      <div className="p-3 font-mono text-[10px] leading-relaxed">
        <div className="text-neutral-500">$ curl -X POST /api/publish</div>
        <div className="text-emerald-400 mt-1">200 OK</div>
        <div className="text-blue-400">{"{"}</div>
        <div className="text-neutral-300 pl-2">"status": "success",</div>
        <div className="text-neutral-300 pl-2">"devices": 12</div>
        <div className="text-blue-400">{"}"}</div>
      </div>
    </div>
  </div>
);

// Audit: Log List Interface
const AuditMockup = () => (
  <div className="w-full">
    <div className="bg-neutral-900/80 rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
        <span className="text-[10px] text-neutral-400">Recent Activity</span>
        <span className="text-[10px] text-neutral-600">+128 events</span>
      </div>

      {/* Log Entries */}
      <div className="divide-y divide-white/[0.04]">
        {[
          { action: "Program published", user: "admin@co", time: "2m ago", status: "success" },
          { action: "Device restarted", user: "ops@co", time: "15m ago", status: "success" },
          { action: "Config changed", user: "admin@co", time: "1h ago", status: "warning" },
        ].map((log, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              log.status === "success" ? "bg-emerald-500" : "bg-amber-500"
            )}></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-neutral-300 truncate">{log.action}</div>
              <div className="text-[10px] text-neutral-600">{log.user}</div>
            </div>
            <div className="text-[10px] text-neutral-500">{log.time}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const AppFeatures = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: t("appFeatures.security.title"),
      description: t("appFeatures.security.description"),
      graphic: <SecurityMockup />,
      className: "col-span-1 md:col-span-2",
      delay: 0,
    },
    {
      title: t("appFeatures.transcode.title"),
      description: t("appFeatures.transcode.description"),
      graphic: <TranscodeMockup />,
      className: "col-span-1",
      delay: 0.05,
    },
    {
      title: t("appFeatures.editor.title"),
      description: t("appFeatures.editor.description"),
      graphic: <EditorMockup />,
      className: "col-span-1",
      delay: 0.1,
    },
    {
      title: t("appFeatures.analytics.title"),
      description: t("appFeatures.analytics.description"),
      graphic: <AnalyticsMockup />,
      className: "col-span-1",
      delay: 0.15,
    },
    {
      title: t("appFeatures.developer.title"),
      description: t("appFeatures.developer.description"),
      graphic: <DeveloperMockup />,
      className: "col-span-1",
      delay: 0.2,
    },
    {
      title: t("appFeatures.audit.title"),
      description: t("appFeatures.audit.description"),
      graphic: <AuditMockup />,
      className: "col-span-1 md:col-span-3",
      delay: 0.25,
    },
  ];

  return (
    <section id="features" className="py-32 bg-black">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl text-white mb-6 font-bold tracking-tight">
              {t("appFeatures.title")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-white to-purple-500">
                {t("appFeatures.titleHighlight")}
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              {t("appFeatures.subtitle")}
            </p>
          </FadeIn>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[380px] gap-4 max-w-5xl mx-auto">
          {features.map((feature) => (
            <BentoCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              graphic={feature.graphic}
              className={feature.className}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
