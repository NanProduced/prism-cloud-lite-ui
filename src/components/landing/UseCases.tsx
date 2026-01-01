import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import {
  ShoppingBag,
  Plane,
  Building2,
  GraduationCap,
  Landmark,
  Utensils,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Data ---

const GALLERY_EXTRAS = [
  "https://images.unsplash.com/photo-1763337275747-66c9607f73a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBsaWdodGluZyUyMGFic3RyYWN0fGVufDF8fHx8MTc2NTA4NTM2NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1764344815476-9aba046ebe97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoaXRlY3R1cmFsJTIwZGV0YWlsJTIwZGFyayUyMGNvbmNyZXRlJTIwZ2xhc3N8ZW58MXx8fHwxNzY1MDg1MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1764065340249-ee8bec50d2f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtYXRlcmlhbCUyMGNsb3NlJTIwdXAlMjBkYXJrJTIwdGV4dHVyZXxlbnwxfHx8fDE3NjUwODUzNjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1763337275747-66c9607f73a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBsaWdodGluZyUyMGFic3RyYWN0fGVufDF8fHx8MTc2NTA4NTM2NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1764344815476-9aba046ebe97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoaXRlY3R1cmFsJTIwZGV0YWlsJTIwZGFyayUyMGNvbmNyZXRlJTIwZ2xhc3N8ZW58MXx8fHwxNzY1MDg1MzY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1764065340249-ee8bec50d2f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtYXRlcmlhbCUyMGNsb3NlJTIwdXAlMjBkYXJrJTIwdGV4dHVyZXxlbnwxfHx8fDE3NjUwODUzNjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
];

type Industry = {
  id: string;
  titleKey: string;
  descKey: string;
  icon: React.ElementType;
  cover: string;
  gallery: string[];
};

const industries: Industry[] = [
  {
    id: "retail",
    titleKey: "useCases.retail",
    descKey: "useCases.retailDesc",
    icon: ShoppingBag,
    cover: "https://images.unsplash.com/photo-1714206466568-4bc91251252a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjByZXRhaWwlMjBzdG9yZSUyMGJvdXRpcXVlJTIwZGFyayUyMGludGVyaW9yfGVufDF8fHx8MTc2NTA4NTA3N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    gallery: [
      "https://images.unsplash.com/photo-1714206466568-4bc91251252a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjByZXRhaWwlMjBzdG9yZSUyMGJvdXRpcXVlJTIwZGFyayUyMGludGVyaW9yfGVufDF8fHx8MTc2NTA4NTA3N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      ...GALLERY_EXTRAS
    ]
  },
  {
    id: "transportation",
    titleKey: "useCases.transportation",
    descKey: "useCases.transportationDesc",
    icon: Plane,
    cover: "https://images.unsplash.com/photo-1611765871030-fb2fdc660d2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdWJsaWMlMjB0cmFuc3BvcnRhdGlvbiUyMHN1YndheSUyMHN0YXRpb24lMjBtb2Rlcm4lMjBibHVycnl8ZW58MXx8fHwxNzY1MDg1MDc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    gallery: [
      "https://images.unsplash.com/photo-1611765871030-fb2fdc660d2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdWJsaWMlMjB0cmFuc3BvcnRhdGlvbiUyMHN1YndheSUyMHN0YXRpb24lMjBtb2Rlcm4lMjBibHVycnl8ZW58MXx8fHwxNzY1MDg1MDc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      ...GALLERY_EXTRAS
    ]
  },
  {
    id: "corporate",
    titleKey: "useCases.corporate",
    descKey: "useCases.corporateDesc",
    icon: Building2,
    cover: "https://images.unsplash.com/photo-1764255120215-9bb4665b44cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb3Jwb3JhdGUlMjBvZmZpY2UlMjBnbGFzcyUyMG1lZXRpbmclMjByb29tJTIwZGFya3xlbnwxfHx8fDE3NjUwODUwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    gallery: [
      "https://images.unsplash.com/photo-1764255120215-9bb4665b44cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb3Jwb3JhdGUlMjBvZmZpY2UlMjBnbGFzcyUyMG1lZXRpbmclMjByb29tJTIwZGFya3xlbnwxfHx8fDE3NjUwODUwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      ...GALLERY_EXTRAS
    ]
  },
  {
    id: "education",
    titleKey: "useCases.education",
    descKey: "useCases.educationDesc",
    icon: GraduationCap,
    cover: "https://images.unsplash.com/photo-1701407797736-957936209aa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwbGlicmFyeSUyMHJlYWRpbmclMjByb29tJTIwYXJjaGl0ZWN0dXJlJTIwZGFya3xlbnwxfHx8fDE3NjUwODUwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    gallery: [
      "https://images.unsplash.com/photo-1701407797736-957936209aa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwbGlicmFyeSUyMHJlYWRpbmclMjByb29tJTIwYXJjaGl0ZWN0dXJlJTIwZGFya3xlbnwxfHx8fDE3NjUwODUwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      ...GALLERY_EXTRAS
    ]
  },
  {
    id: "public",
    titleKey: "useCases.publicServices",
    descKey: "useCases.publicServicesDesc",
    icon: Landmark,
    cover: "https://images.unsplash.com/photo-1762246433271-e7bdb518f793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBnb3Zlcm5tZW50JTIwYnVpbGRpbmclMjBwYXJsaWFtZW50JTIwaW50ZXJpb3IlMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzY1MDg1MDc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    gallery: [
      "https://images.unsplash.com/photo-1762246433271-e7bdb518f793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBnb3Zlcm5tZW50JTIwYnVpbGRpbmclMjBwYXJsaWFtZW50JTIwaW50ZXJpb3IlMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzY1MDg1MDc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      ...GALLERY_EXTRAS
    ]
  },
  {
    id: "hospitality",
    titleKey: "useCases.hospitality",
    descKey: "useCases.hospitalityDesc",
    icon: Utensils,
    cover: "https://images.unsplash.com/photo-1680946496238-5272d3c407fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwaW50ZXJpb3IlMjBkaW5pbmclMjBkYXJrJTIwbW9vZHl8ZW58MXx8fHwxNzY1MDg1MDc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    gallery: [
      "https://images.unsplash.com/photo-1680946496238-5272d3c407fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwaW50ZXJpb3IlMjBkaW5pbmclMjBkYXJrJTIwbW9vZHl8ZW58MXx8fHwxNzY1MDg1MDc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      ...GALLERY_EXTRAS
    ]
  }
];

// --- Components ---

export const UseCases = () => {
  const { t } = useTranslation();
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);

  return (
    <section id="solutions" className="py-32 bg-black relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>

      <Container>
        <header className="mb-20 max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight"
          >
            {t("useCases.title")}
          </motion.h1>
        </header>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {industries.map((industry) => (
              <IndustryCard
                key={industry.id}
                industry={industry}
                onClick={() => setSelectedIndustry(industry)}
              />
            ))}
          </div>

          <AnimatePresence>
            {selectedIndustry && (
              <GalleryModal
                industry={selectedIndustry}
                onClose={() => setSelectedIndustry(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
};

function IndustryCard({ industry, onClick }: { industry: Industry; onClick: () => void }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      onClick={onClick}
      className="group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 transition-colors"
    >
      {/* Background Image with Hover Zoom */}
      <div className="absolute inset-0 h-full w-full overflow-hidden">
        <img
          src={industry.cover}
          alt={t(industry.titleKey)}
          className="h-full w-full object-cover opacity-60 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
      </div>

      {/* Hover Overlay Icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <div className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
            <Maximize2 className="h-5 w-5" />
         </div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full p-6">
        <div className="mb-2 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm text-indigo-300 border border-white/5">
                <industry.icon className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-medium text-white tracking-wide">
              {t(industry.titleKey)}
            </h3>
        </div>

        <p className="text-sm text-zinc-400 font-light truncate pl-1">
          {t(industry.descKey)}
        </p>
      </div>
    </motion.div>
  );
}

function GalleryModal({ industry, onClose }: { industry: Industry; onClose: () => void }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(() => Math.floor(industry.gallery.length / 2));

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % industry.gallery.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + industry.gallery.length) % industry.gallery.length);
  };

  const setIndexDirect = (i: number) => {
    setIndex(i);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[60] p-3 rounded-full bg-zinc-900/50 text-white/70 hover:bg-zinc-800 hover:text-white transition-colors border border-white/10 backdrop-blur-md"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">

        {/* Cover Flow Container */}
        <div className="relative w-full h-[600px] flex items-center justify-center perspective-[1000px] preserve-3d">
            {industry.gallery.map((img, i) => {
                const offset = i - index;
                if (Math.abs(offset) > 4) return null;

                return (
                    <CardStackItem
                        key={i}
                        image={img}
                        offset={offset}
                        isActive={i === index}
                        onClick={() => setIndexDirect(i)}
                    />
                );
            })}
        </div>

        {/* Text Info */}
        <div className="absolute bottom-12 z-[60] text-center space-y-4 max-w-2xl px-4 pointer-events-none">
            <motion.div
                 key={`text-${index}`}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.3 }}
            >
                <h3 className="text-3xl font-bold text-white tracking-tight mb-2 drop-shadow-lg">
                    {t(industry.titleKey)}
                </h3>
                <p className="text-zinc-300 text-base font-light drop-shadow-md">
                    {t(industry.descKey)}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                     <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest bg-black/50 px-2 py-1 rounded">
                        {String(index + 1).padStart(2, '0')} / {String(industry.gallery.length).padStart(2, '0')}
                     </span>
                </div>
            </motion.div>
        </div>

        {/* Visible Navigation Buttons */}
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-[70] p-4 rounded-full bg-zinc-900/30 text-white/50 hover:bg-zinc-900/80 hover:text-white hover:scale-110 transition-all border border-white/10 backdrop-blur-md hidden md:flex items-center justify-center"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-[70] p-4 rounded-full bg-zinc-900/30 text-white/50 hover:bg-zinc-900/80 hover:text-white hover:scale-110 transition-all border border-white/10 backdrop-blur-md hidden md:flex items-center justify-center"
        >
          <ChevronRight className="h-8 w-8" />
        </button>

        {/* Navigation Areas (Invisible Click Zones) */}
        <div className="absolute inset-y-0 left-0 w-1/6 z-40 cursor-w-resize" onClick={handlePrev} />
        <div className="absolute inset-y-0 right-0 w-1/6 z-40 cursor-e-resize" onClick={handleNext} />
      </div>
    </div>
  );
}

function CardStackItem({ image, offset, isActive, onClick }: { image: string, offset: number, isActive: boolean, onClick: () => void }) {
  const GAP = 180;
  const ROTATION = 45;
  const Z_DEPTH = -250;

  const x = offset * GAP;
  const rotateY = offset === 0 ? 0 : offset < 0 ? ROTATION : -ROTATION;
  const zIndex = 100 - Math.abs(offset);
  const z = offset === 0 ? 0 : Z_DEPTH;
  const opacity = isActive ? 1 : Math.max(0.4, 1 - Math.abs(offset) * 0.2);

  return (
    <motion.div
      onClick={onClick}
      layout
      initial={false}
      animate={{
        x: x,
        z: z,
        rotateY: rotateY,
        zIndex: zIndex,
        opacity: opacity,
      }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 20,
        mass: 1
      }}
      className={cn(
        "absolute top-1/2 left-1/2 w-[85vw] md:w-[700px] aspect-[16/10] rounded-xl bg-zinc-900 shadow-2xl origin-center",
        "-ml-[42.5vw] -mt-[26.56vw] md:-ml-[350px] md:-mt-[218.75px]",
        isActive ? "cursor-default brightness-110" : "cursor-pointer brightness-50 hover:brightness-75"
      )}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <div className="relative h-full w-full rounded-xl overflow-hidden border border-white/10">
          <img src={image} className="w-full h-full object-cover" alt="" />

          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none mix-blend-overlay" />
          )}
      </div>

      {/* Reflection Effect */}
      <div className="absolute top-full left-0 w-full h-full mt-2 opacity-40 pointer-events-none transform scale-y-[-1] mask-image-linear-gradient">
         <img src={image} className="w-full h-full object-cover rounded-xl blur-[2px]" alt="" />
         <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
      </div>
    </motion.div>
  );
}
