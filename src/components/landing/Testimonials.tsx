import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Quote, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/ui/FadeIn";
import { primaryLogos, secondaryLogos, type BrandLogo } from "@/assets/logos";

// ========== Logo Wall Component ==========

const LogoWall = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";

  // All unique logos - no duplicates within each row
  const allLogos = useMemo(() => [...primaryLogos, ...secondaryLogos], []);

  // Split into two rows with no overlap
  const row1Logos = allLogos.slice(0, Math.ceil(allLogos.length / 2));
  const row2Logos = allLogos.slice(Math.ceil(allLogos.length / 2));

  const LogoItem = ({ logo, index }: { logo: BrandLogo; index: number }) => (
    <div
      className="flex flex-col items-center justify-center shrink-0 px-12 md:px-20 group py-12"
      style={{ minWidth: "280px" }}
    >
      <div className="h-20 w-60 flex items-center justify-center">
        <img
          src={logo.src}
          alt={isZh ? logo.nameZh : logo.name}
          className={cn(
            "h-full w-auto max-w-[200px] object-contain transition-all duration-500",
            "opacity-40 group-hover:opacity-100",
          )}
          style={{
            // Transform scale from the config or default 1
            transform: `scale(${logo.scale || 1})`,
            // Use a combination of filters to ensure monochrome silver/white look
            filter: "brightness(0) invert(0.7)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(0) invert(1)";
            e.currentTarget.style.transform = `scale(${(logo.scale || 1) * 1.05})`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "brightness(0) invert(0.7)";
            e.currentTarget.style.transform = `scale(${logo.scale || 1})`;
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="relative py-16 overflow-hidden">
      {/* Title */}
      <FadeIn>
        <p className="text-center text-neutral-500 text-base mb-16 tracking-wide uppercase font-medium">
          {t("logoWall.title")}
        </p>
      </FadeIn>

      {/* Row 1 - Scroll Left */}
      <div className="relative mb-16 flex overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex items-center flex-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            duration: 50,
            ease: "linear",
          }}
        >
          {/* Double the items and use % for seamless loop */}
          {[...row1Logos, ...row1Logos].map((logo, i) => (
            <LogoItem key={`row1-${i}`} logo={logo} index={i} />
          ))}
        </motion.div>
      </div>

      {/* Row 2 - Scroll Right */}
      <div className="relative flex overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex items-center flex-nowrap"
          animate={{ x: ["-50%", "0%"] }}
          transition={{
            repeat: Infinity,
            duration: 50,
            ease: "linear",
          }}
        >
          {[...row2Logos, ...row2Logos].map((logo, i) => (
            <LogoItem key={`row2-${i}`} logo={logo} index={i} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// ========== Testimonial Card Component ==========

interface TestimonialProps {
  name: string;
  industry: string;
  quote: string;
  author: string;
  role: string;
}

const TestimonialCard = ({
  name,
  industry,
  quote,
  author,
  role,
}: TestimonialProps) => {
  // Find matching logo
  const matchedLogo = useMemo(() => {
    const allLogos = [...primaryLogos, ...secondaryLogos];
    return allLogos.find(l =>
      l.name === name ||
      l.nameZh === name ||
      name.includes(l.name) ||
      name.includes(l.nameZh)
    );
  }, [name]);

  return (
    <div className="relative flex flex-col h-full px-2 md:px-8">
      {/* Quote Mark */}
      <div className="mb-6">
        <Quote className="w-12 h-12 text-indigo-500/20 rotate-180" />
      </div>

      {/* Quote Text */}
      <blockquote className="text-xl md:text-2xl lg:text-3xl text-white font-light leading-relaxed mb-10 flex-1">
        {quote}
      </blockquote>

      {/* Author Section */}
      <div className="flex items-center gap-5 pt-6 border-t border-white/10">
        {/* Avatar / Logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
          {matchedLogo ? (
            <img
              src={matchedLogo.src}
              alt={name}
              className="w-10 h-10 object-contain"
            />
          ) : (
            <span className="text-xl font-bold text-white/40">
              {author.charAt(0)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <p className="text-white font-semibold text-lg">{author}</p>
          <p className="text-neutral-400 text-sm">
            {role}
          </p>
          <p className="text-indigo-400/80 text-sm font-medium mt-0.5">
            {name}
          </p>
        </div>
      </div>
    </div>
  );
};

// ========== Progress Bar ==========

const ProgressBar = ({
  total,
  active,
  onSelect,
}: {
  total: number;
  active: number;
  onSelect: (index: number) => void;
}) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <button
        key={i}
        onClick={() => onSelect(i)}
        className={cn(
          "h-1.5 rounded-full transition-all duration-500 hover:opacity-100",
          i === active
            ? "w-10 bg-gradient-to-r from-indigo-500 to-purple-500"
            : "w-1.5 bg-white/20 hover:bg-white/40"
        )}
        aria-label={`Go to testimonial ${i + 1}`}
      />
    ))}
  </div>
);

// ========== Main Component ==========

export const Testimonials = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Get testimonials from i18n
  const testimonials = useMemo(() => {
    const clientsData = t("testimonials.clients", { returnObjects: true });
    return Array.isArray(clientsData) ? clientsData : [];
  }, [t]);

  // Auto-rotate testimonials
  useEffect(() => {
    if (isPaused || testimonials.length === 0) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [isPaused, testimonials.length]);

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-32 relative overflow-hidden bg-black">
      {/* Top border line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Background effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 blur-[180px] rounded-full" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/5 blur-[180px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Logo Wall */}
        <LogoWall />

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-16" />

        {/* Section Header */}
        <div className="text-center mb-16">
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
              {t("testimonials.title")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                {t("testimonials.titleHighlight")}
              </span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
              {t("testimonials.subtitle")}
            </p>
          </FadeIn>
        </div>

        {/* Testimonial Carousel */}
        <FadeIn delay={0.3}>
          <div
            className="max-w-5xl mx-auto"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Main Content Area */}
            <div className="relative min-h-[360px] md:min-h-[320px]">
              <AnimatePresence mode="wait">
                {testimonials.length > 0 && (
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <TestimonialCard
                      name={testimonials[activeIndex].name}
                      industry={testimonials[activeIndex].industry}
                      quote={testimonials[activeIndex].quote}
                      author={testimonials[activeIndex].author}
                      role={testimonials[activeIndex].role}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 px-2 md:px-8">
              {/* Progress */}
              <ProgressBar
                total={testimonials.length}
                active={activeIndex}
                onSelect={setActiveIndex}
              />

              {/* Arrows */}
              <div className="flex items-center gap-3">
                <button
                  onClick={goToPrev}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center",
                    "bg-white/[0.03] border border-white/[0.08]",
                    "hover:bg-white/[0.08] hover:border-white/[0.15]",
                    "transition-all duration-300"
                  )}
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="w-5 h-5 text-white/60" />
                </button>

                <button
                  onClick={goToNext}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center",
                    "bg-white/[0.03] border border-white/[0.08]",
                    "hover:bg-white/[0.08] hover:border-white/[0.15]",
                    "transition-all duration-300"
                  )}
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
