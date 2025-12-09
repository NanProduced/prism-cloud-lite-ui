import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PrismWordmark } from "../../components/shared/logo";
import { LanguageSwitcher } from "../../components/shared/LanguageSwitcher";
import { login, requestEmailOtp, getErrorMessage, getErrorCode } from "../../services/authApi";
import type { AuthType } from "../../types/auth";
import { AuthErrorCode } from "../../types/auth";
import { PrismIcon } from "../../components/shared/logo";

// Logo Component
function Logo() {
  return (
    <PrismIcon size={32} variant="gradient" />
  );
}

// Background Illustration Component
function Illustration() {
  return (
    <div className="hidden lg:block absolute bottom-0 left-[60%] xl:left-[720px] right-0 rounded-[24px] top-0">
      <img alt="" className="absolute inset-0 max-w-none object-left h-full w-full object-cover pointer-events-none rounded-[24px]" src="/images/login-bg.png" />
    </div>
  );
}

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

export default function LoginPage({ onNavigate }: { onNavigate: (page: "login" | "register") => void }) {
  const { t } = useTranslation();
  const [loginMethod, setLoginMethod] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [continueUrl, setContinueUrl] = useState<string | null>(null);

  // Parse continue parameter from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const continueParam = params.get('continue');

    if (continueParam) {
      // Validate continue URL
      if (continueParam.includes('/oauth2/authorize')) {
        setContinueUrl(decodeURIComponent(continueParam));
      } else {
        toast.error(t('auth.errors.continueUrlInvalid'));
      }
    } else {
      // No continue URL - show warning
      toast.warning(t('auth.errors.continueUrlMissing'));
    }
  }, [t]);

  // Countdown timer for code resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email) {
      toast.error(t('auth.errors.invalidEmail'));
      return;
    }

    try {
      const response = await requestEmailOtp({ email });
      if (response.success) {
        toast.success(t('auth.login.success'));
        setCountdown(60);
      } else {
        const errorCode = getErrorCode(response);
        if (errorCode === AuthErrorCode.TOO_MANY_REQUESTS) {
          toast.error(t('auth.errors.tooManyRequests'));
        } else {
          toast.error(getErrorMessage(response));
        }
      }
    } catch (error) {
      toast.error(t('auth.errors.networkError'));
      console.error('Request email OTP error:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!continueUrl) {
      toast.error(t('auth.errors.continueUrlMissing'));
      return;
    }

    if (!email) {
      toast.error(t('auth.errors.invalidEmail'));
      return;
    }

    if (loginMethod === "password" && !password) {
      toast.error(t('auth.errors.invalidPassword'));
      return;
    }

    if (loginMethod === "code" && !code) {
      toast.error(t('auth.errors.invalidCode'));
      return;
    }

    setIsLoading(true);

    try {
      const authType: AuthType = loginMethod === "password" ? "EMAIL_PWD" : "EMAIL_OTP";
      const response = await login({
        authType,
        email,
        password: loginMethod === "password" ? password : undefined,
        authCode: loginMethod === "code" ? code : undefined,
        continueUrl,
      });

      if (response.success && response.data) {
        toast.success(t('auth.login.success'));
        // Redirect to OAuth2 flow
        window.location.href = response.data.redirectUrl;
      } else {
        const errorCode = getErrorCode(response);
        if (errorCode === AuthErrorCode.ACCOUNT_OR_CREDENTIAL_ERROR) {
          toast.error(t('auth.errors.accountOrCredentialError'));
        } else if (errorCode === AuthErrorCode.INVALID_CONTINUE_URL) {
          toast.error(t('auth.errors.continueUrlInvalid'));
        } else {
          toast.error(getErrorMessage(response));
        }
        setIsLoading(false);
      }
    } catch (error) {
      toast.error(t('auth.errors.networkError'));
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#131619] relative rounded-[24px] w-full max-w-[1440px] h-[800px] lg:h-[900px] overflow-hidden flex flex-col lg:block">
      {/* Header with Logo and Language Switcher */}
      <div className="absolute left-[48px] top-[48px] right-[48px] flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <Logo />
          <PrismWordmark size="md" color="white" showFullName />
        </div>
        <LanguageSwitcher className="text-white/80" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full lg:w-[480px] xl:w-[540px] px-8 lg:px-0 lg:ml-[112px] h-full flex flex-col justify-center">

        {/* Heading */}
        <div className="mb-12">
          <h1 className="text-[36px] leading-[44px] mb-6 text-white font-semibold">
            {t('auth.login.title')}
          </h1>
          <p className="text-[#9b9c9e] text-[18px] tracking-[0.15px]">
            {t('auth.login.subtitle')}
          </p>
        </div>

        {/* Login Method Tabs */}
        <div className="flex gap-6 mb-8 border-b border-[#363a3d] pb-1">
          <button
            onClick={() => setLoginMethod("password")}
            className={`pb-3 text-[16px] font-medium transition-colors ${loginMethod === "password" ? "text-[#b6f09c] border-b-2 border-[#b6f09c]" : "text-[#686b6e] hover:text-[#cdcecf]"}`}
          >
            {t('auth.login.loginWithPassword')}
          </button>
          <button
            onClick={() => setLoginMethod("code")}
            className={`pb-3 text-[16px] font-medium transition-colors ${loginMethod === "code" ? "text-[#b6f09c] border-b-2 border-[#b6f09c]" : "text-[#686b6e] hover:text-[#cdcecf]"}`}
          >
            {t('auth.login.loginWithCode')}
          </button>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-6 w-full">

          {/* Email Input */}
          <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all">
            <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px] transition-colors" />
            <div className="flex items-center px-[16px] h-full gap-[12px]">
              <UserIcon />
              <input
                type="email"
                placeholder={t('auth.login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] placeholder-[#686b6e] w-full h-full font-['Plus_Jakarta_Sans',sans-serif]"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          {loginMethod === "password" && (
            <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all">
              <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px] transition-colors" />
              <div className="flex items-center px-[16px] h-full gap-[12px]">
                <LockIcon />
                <input
                  type="password"
                  placeholder={t('auth.login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] placeholder-[#686b6e] w-full h-full font-['Plus_Jakarta_Sans',sans-serif]"
                  required
                />
              </div>
            </div>
          )}

          {/* Verification Code Input */}
          {loginMethod === "code" && (
            <div className="flex gap-4">
              <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all flex-1">
                <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px] transition-colors" />
                <div className="flex items-center px-[16px] h-full gap-[12px]">
                  <MessageIcon />
                  <input
                    type="text"
                    placeholder={t('auth.login.codePlaceholder')}
                    value={code}
                    maxLength={6}
                    onChange={(e) => setCode(e.target.value)}
                    className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] placeholder-[#686b6e] w-full h-full font-['Plus_Jakarta_Sans',sans-serif]"
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="h-[48px] px-4 rounded-[8px] bg-[#363a3d] text-[#cdcecf] font-medium text-[14px] hover:bg-[#4a4f54] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
              >
                {countdown > 0 ? t('auth.login.resendCodeIn', { seconds: countdown }) : t('auth.login.getCode')}
              </button>
            </div>
          )}
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleLogin} className="mt-6">
          {/* Additional Options */}
          <div className="flex items-center justify-between w-full">
            {loginMethod === "password" && (
              <button type="button" className="text-transparent bg-clip-text bg-gradient-to-r from-[#82DBF7] to-[#B6F09C] font-semibold text-[16px]">
                {t('auth.login.forgotPassword')}
              </button>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full h-[48px] bg-[#b6f09c] hover:bg-[#a2e085] disabled:opacity-50 disabled:cursor-not-allowed rounded-[12px] flex items-center justify-center transition-colors"
          >
            <span className="text-[#0c1132] text-[16px] font-semibold">
              {isLoading ? t('auth.login.loggingIn') : t('auth.common.logIn')}
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="mt-8 flex items-center gap-4 w-full">
          <div className="h-[1px] flex-1 bg-[#363A3D]" />
          <span className="text-[#686b6e] text-[12px] font-medium">{t('auth.login.orLoginWith')}</span>
          <div className="h-[1px] flex-1 bg-[#363A3D]" />
        </div>

        {/* Social Buttons */}
        <div className="mt-6 flex gap-4 w-full">
          {/* Google */}
          <button className="flex-1 h-[48px] bg-[#1a1d21] hover:bg-[#23262a] rounded-[12px] flex items-center justify-center gap-3 transition-colors border border-transparent hover:border-[#363a3d]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M19.6 10.2c0-.7-.1-1.3-.2-1.9h-8.9v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.8v2.4h3.1c1.8-1.6 2.8-4 2.8-6.9z" fill="#4285F4" />
              <path d="M10.5 19.8c2.5 0 4.6-.8 6.2-2.2l-3.1-2.4c-.8.6-1.9.9-3.1.9-2.4 0-4.5-1.6-5.2-3.9H2.1v2.4c1.7 3.4 5.3 5.7 9.4 5.7z" fill="#34A853" />
              <path d="M5.3 12c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V6c-2.4 1.8-4 4.6-4 7.8s1.6 6 4 7.8l3-2.3c-1.2-1-2-2.4-2.3-4z" fill="#FBBC05" />
              <path d="M10.5 4.1c1.4 0 2.6.5 3.6 1.4l2.7-2.7C15.1.8 13 0 10.5 0 6.4 0 2.8 2.3 1.2 5.8l3.1 2.4c.7-2.3 2.8-3.9 5.2-3.9z" fill="#EA4335" />
            </svg>
          </button>

          {/* Apple */}
          <button className="flex-1 h-[48px] bg-[#1a1d21] hover:bg-[#23262a] rounded-[12px] flex items-center justify-center gap-3 transition-colors border border-transparent hover:border-[#363a3d]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 13.5c-.91 0-1.82.55-2.64 1.64.93.64 1.93.99 3.03.99 2.14 0 3.85-1.75 3.85-3.99 0-1.5-.72-2.83-1.93-3.56-.35 1.24-.96 2.39-1.8 3.29-.52.55-1.19.99-1.96 1.27-.24.09-.47.15-.71.15zm-5.45-3.15c.99 0 1.89-.41 2.63-1.15.63-.64 1.07-1.47 1.22-2.41-1.23-.33-2.36-.51-3.4-.51-2.14 0-4.05 1.75-4.05 4 0 1.22.56 2.31 1.45 3.06.6-.8 1.47-1.46 2.46-1.85.34-.12.69-.19 1.04-.19-.19-.53-.3-1.1-.3-1.7 0-.24.02-.48.05-.72z" />
            </svg>
          </button>

          {/* WeChat */}
          <button className="flex-1 h-[48px] bg-[#1a1d21] hover:bg-[#23262a] rounded-[12px] flex items-center justify-center gap-3 transition-colors border border-transparent hover:border-[#363a3d] group">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#686b6e] group-hover:text-[#07C160]">
              <path d="M7 11C7 8.79086 9.23858 7 12 7C14.7614 7 17 8.79086 17 11C17 13.2091 14.7614 15 12 15C11.5363 15 11.0921 14.9496 10.6724 14.8551L8.5 16L9.04343 14.195C7.81734 13.4357 7 12.2854 7 11Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 12C15 10.3431 16.567 9 18.5 9C20.433 9 22 10.3431 22 12C22 13.6569 20.433 15 18.5 15C18.176 15 17.8654 14.9649 17.5714 14.8988L16 15.5L16.4385 14.453C15.5539 13.886 15 13.0076 15 12Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="mt-8 flex justify-center gap-2">
          <span className="text-[#686b6e] font-semibold">{t('auth.login.noAccount')}</span>
          <button type="button" onClick={() => onNavigate("register")} className="text-transparent bg-clip-text bg-gradient-to-r from-[#82DBF7] to-[#B6F09C] font-semibold hover:opacity-80 transition-opacity">
            {t('auth.common.signUp')}
          </button>
        </div>

      </div>

      <Illustration />
    </div>
  );
}

