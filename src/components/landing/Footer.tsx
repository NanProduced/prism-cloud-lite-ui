import React from "react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";

export const Footer = () => {
  const { t } = useTranslation();

  const footerSections = [
    {
      titleKey: "footer.product",
      links: [
        { labelKey: "footer.features", href: "#" },
        { labelKey: "footer.solutions", href: "#" },
        { labelKey: "footer.integration", href: "#" },
        { labelKey: "footer.enterprise", href: "#" }
      ]
    },
    {
      titleKey: "footer.company",
      links: [
        { labelKey: "footer.aboutUs", href: "#" },
        { labelKey: "footer.careers", href: "#" },
        { labelKey: "footer.blog", href: "#" },
        { labelKey: "footer.contact", href: "#" }
      ]
    },
    {
      titleKey: "footer.resources",
      links: [
        { labelKey: "footer.documentation", href: "#" },
        { labelKey: "footer.helpCenter", href: "#" },
        { labelKey: "footer.community", href: "#" },
        { labelKey: "footer.partners", href: "#" }
      ]
    },
    {
      titleKey: "footer.legal",
      links: [
        { labelKey: "footer.privacyPolicy", href: "#" },
        { labelKey: "footer.termsOfService", href: "#" },
        { labelKey: "footer.cookiePolicy", href: "#" }
      ]
    }
  ];

  return (
    <footer className="bg-black border-t border-white/5 py-12 text-sm">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-white mb-4">{t(section.titleKey)}</h3>
              <ul className="space-y-2 text-gray-400">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a href={link.href} className="hover:text-indigo-400 transition-colors">
                      {t(link.labelKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              P
            </div>
            <span className="text-gray-300 font-semibold">Prism Cloud</span>
          </div>
          <p className="text-gray-500">
            © {new Date().getFullYear()} Prism Cloud. {t("footer.copyright")}
          </p>
        </div>
      </Container>
    </footer>
  );
};
