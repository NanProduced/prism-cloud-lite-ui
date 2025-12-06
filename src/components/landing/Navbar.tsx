import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PrismIcon } from "@/components/shared/logo/PrismIcon";

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: t("nav.features"), href: "#features" },
    { name: t("nav.solutions"), href: "#solutions" },
    { name: t("nav.pricing"), href: "#pricing" },
    { name: t("nav.docs"), href: "#docs" },
  ];

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "zh" : "en");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled || isMobileMenuOpen
          ? "bg-black/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <Container className="relative">
        <div className="flex h-16 items-center justify-between">
          {/* Logo + Lite Badge */}
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 flex items-center justify-center">
              <PrismIcon size={24} variant="gradient" />
            </div>
            <span className="text-sm font-bold tracking-wide text-white">
              Prism Cloud
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Lite
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-[13px] font-medium text-gray-400 transition-colors hover:text-white"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-[13px] font-medium text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5"
              title={i18n.language === "en" ? "Switch to Chinese" : "Switch to English"}
            >
              <Globe size={14} />
              <span>{i18n.language === "en" ? "EN" : "中"}</span>
            </button>

            <a
              href="#"
              className="text-[13px] font-medium text-gray-400 hover:text-white transition-colors"
            >
              {t("nav.login")}
            </a>
            <Button
              size="sm"
              className="bg-white text-black hover:bg-gray-200 border-none h-8 px-4 text-xs shadow-none rounded-full font-semibold"
            >
              {t("nav.getStarted")}
            </Button>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="p-2 text-gray-400 hover:text-white"
              title={i18n.language === "en" ? "Switch to Chinese" : "Switch to English"}
            >
              <Globe size={18} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="p-2 text-gray-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-black border-b border-white/5"
          >
            <Container className="py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-gray-300 hover:text-white block py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                <a
                  href="#"
                  className="text-sm font-medium text-gray-300 hover:text-white block text-center"
                >
                  {t("nav.login")}
                </a>
                <Button className="w-full bg-white text-black hover:bg-gray-200 border-none">
                  {t("nav.getStarted")}
                </Button>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
