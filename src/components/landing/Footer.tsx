
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PrismIcon } from "@/components/shared/logo/PrismIcon";

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-[#1a1a1a] bg-[#050505] pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-20">
          <div className="col-span-2 lg:col-span-2">
            <div className="mb-6">
              <h4 className="text-2xl text-[#dddddd] font-medium mb-2">
                {t("footer.newsletter.title")}
              </h4>
              <p className="text-[#8a8a8a] text-sm max-w-xs">
                {t("footer.newsletter.description")}
              </p>
            </div>
            <div className="relative max-w-xs">
              <input
                type="email"
                placeholder={t("footer.newsletter.placeholder")}
                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white outline-none focus:border-[#5552ff]"
              />
              <button className="absolute right-1.5 top-1.5 bg-[#5552ff] text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-[#4542cc] transition-colors">
                {t("footer.newsletter.button")}
              </button>
            </div>
          </div>

          <div>
            <h5 className="text-white font-medium mb-6">{t("footer.company")}</h5>
            <ul className="space-y-3 text-[#8a8a8a] text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t("footer.aboutUs")}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Benefits</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-medium mb-6">{t("footer.product")}</h5>
            <ul className="space-y-3 text-[#8a8a8a] text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t("footer.features")}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t("footer.pricing")}</a></li>
              <li><Link to="/help" className="hover:text-white transition-colors">{t("footer.documentation")}</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-medium mb-6">{t("footer.resources")}</h5>
            <ul className="space-y-3 text-[#8a8a8a] text-sm">
              <li><Link to="/help" className="hover:text-white transition-colors">{t("footer.helpCenter")}</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">{t("footer.community")}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t("footer.blog")}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 flex items-center justify-center">
              <PrismIcon size={24} variant="gradient" />
            </div>
            <span className="text-white font-bold text-lg">Prism Cloud</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Lite
            </span>
          </div>

          <p className="text-[#8a8a8a] text-sm">
            © {new Date().getFullYear()} Prism Cloud. {t("footer.copyright")}
          </p>

          <div className="flex items-center gap-4 text-[#8a8a8a] text-sm">
            <a href="#" className="hover:text-white transition-colors">{t("footer.privacyPolicy")}</a>
            <span className="w-1 h-1 bg-[#666] rounded-full"></span>
            <a href="#" className="hover:text-white transition-colors">{t("footer.termsOfService")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
