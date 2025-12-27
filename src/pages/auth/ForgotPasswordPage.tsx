import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/store/notificationStore";
import { PrismWordmark, PrismIcon } from "../../components/shared/logo";
import { LanguageSwitcher } from "../../components/shared/LanguageSwitcher";
import { requestPasswordReset, confirmPasswordReset, getErrorMessage } from "../../services/authApi";

// Icons
const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#686B6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#686B6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="#686B6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="#686B6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#686B6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

export default function ForgotPasswordPage({ onNavigate }: { onNavigate: (page: "login" | "register" | "forgot-password") => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const isEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      toast.error(t('auth.errors.invalidIdentifier'));
      return;
    }

    setIsLoading(true);
    try {
      const isEmailAuth = isEmail(identifier);
      const response = await requestPasswordReset({
        email: isEmailAuth ? identifier : undefined,
        phone: !isEmailAuth ? identifier : undefined,
      });

      if (response.success) {
        toast.success(t('auth.forgotPassword.otpSent'));
        setStep(2);
        setCountdown(60);
      } else {
        toast.error(getErrorMessage(response));
      }
    } catch (error) {
      toast.error(t('auth.errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPassword || !confirmPassword) {
      toast.error(t('auth.errors.allFieldsRequired'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('auth.register.passwordsDoNotMatch'));
      return;
    }

    setIsLoading(true);
    try {
      const isEmailAuth = isEmail(identifier);
      const response = await confirmPasswordReset({
        email: isEmailAuth ? identifier : undefined,
        phone: !isEmailAuth ? identifier : undefined,
        authCode: code,
        newPassword: newPassword,
      });

      if (response.success) {
        toast.success(t('auth.forgotPassword.resetSuccess'));
        onNavigate("login");
      } else {
        toast.error(getErrorMessage(response));
      }
    } catch (error) {
      toast.error(t('auth.errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#131619] relative rounded-[24px] w-full max-w-[540px] p-12 overflow-hidden flex flex-col border border-[#363a3d]">
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <PrismIcon size={32} variant="gradient" />
          <PrismWordmark size="md" color="white" showFullName />
        </div>
        <LanguageSwitcher className="text-white/80" />
      </div>

      <div className="mb-8">
        <h1 className="text-[32px] text-white font-semibold mb-2">
          {step === 1 ? t('auth.login.forgotPassword') : t('auth.forgotPassword.resetTitle')}
        </h1>
        <p className="text-[#9b9c9e]">
          {step === 1 ? t('auth.forgotPassword.subtitle') : t('auth.forgotPassword.resetSubtitle')}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleRequestReset} className="flex flex-col gap-6">
          <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all">
            <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px]" />
            <div className="flex items-center px-[16px] h-full gap-[12px]">
              <UserIcon />
              <input
                type="text"
                placeholder={t('auth.login.emailPlaceholder')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] w-full h-full"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[48px] bg-[#b6f09c] hover:bg-[#a2e085] disabled:opacity-50 rounded-[12px] font-semibold text-[#0c1132] transition-colors"
          >
            {isLoading ? t('auth.common.loading') : t('auth.forgotPassword.sendCode')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirmReset} className="flex flex-col gap-6">
          <div className="flex gap-4">
            <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] flex-1 group focus-within:ring-2 ring-[#82dbf7]/20 transition-all">
              <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px]" />
              <div className="flex items-center px-[16px] h-full gap-[12px]">
                <MessageIcon />
                <input
                  type="text"
                  placeholder={t('auth.login.codePlaceholder')}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] w-full h-full"
                  required
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleRequestReset}
              disabled={countdown > 0 || isLoading}
              className="px-4 rounded-[8px] bg-[#363a3d] text-[#cdcecf] text-sm hover:bg-[#4a4f54] transition-colors disabled:opacity-50"
            >
              {countdown > 0 ? `${countdown}s` : t('auth.login.getCode')}
            </button>
          </div>

          <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all">
            <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px]" />
            <div className="flex items-center px-[16px] h-full gap-[12px]">
              <LockIcon />
              <input
                type="password"
                placeholder={t('auth.register.passwordPlaceholder')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] w-full h-full"
                required
              />
            </div>
          </div>

          <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all">
            <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px]" />
            <div className="flex items-center px-[16px] h-full gap-[12px]">
              <LockIcon />
              <input
                type="password"
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] w-full h-full"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[48px] bg-[#b6f09c] hover:bg-[#a2e085] disabled:opacity-50 rounded-[12px] font-semibold text-[#0c1132] transition-colors"
          >
            {isLoading ? t('auth.common.loading') : t('auth.forgotPassword.resetButton')}
          </button>
        </form>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => onNavigate("login")}
          className="text-[#686b6e] hover:text-white transition-colors"
        >
          {t('auth.forgotPassword.backToLogin')}
        </button>
      </div>
    </div>
  );
}
