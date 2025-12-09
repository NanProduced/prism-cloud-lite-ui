import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  const currentLanguageLabel = i18n.language === 'en' ? 'EN' : '中';

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 ${className}`}
      title={i18n.language === 'en' ? 'Switch to Chinese' : '切换到英文'}
      type="button"
    >
      <Languages className="w-4 h-4" />
      <span>{currentLanguageLabel}</span>
    </button>
  );
}
