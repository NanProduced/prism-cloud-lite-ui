import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "@/store/notificationStore";
import { PrismWordmark, PrismIcon, GoogleLogo, AppleLogo, WechatLogo } from "../../components/shared/logo";
import { LanguageSwitcher } from "../../components/shared/LanguageSwitcher";
import { login, requestEmailOtp, requestPhoneOtp, googleLogin, getErrorMessage, getErrorCode } from "../../services/authApi";
import type { AuthType } from "../../types/auth";
import { AuthErrorCode } from "../../types/auth";
import { useAuthStore } from "../../store/authStore";
import { gatewayOrigin } from "@/config/runtime";

declare global {
  interface Window {
    google: any;
  }
}

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

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#686B6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#686B6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default function LoginPage({ onNavigate }: { onNavigate: (page: "login" | "register" | "forgot-password") => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clearAuth, isAuthenticated, resetLogoutFlag } = useAuthStore();
  
  const [continueUrl, setContinueUrl] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<"password" | "code">("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const googleCallbackHandledRef = useRef(false);
  const GOOGLE_CONTINUE_STORAGE_KEY = "prism_google_continue_url";

  const gatewayPublicOrigin = (import.meta.env.VITE_GATEWAY_URL || gatewayOrigin || "").replace(/\/+$/, "");

  const toBrowserRedirectUrl = (raw: string): string | null => {
    const input = (raw || "").trim();
    if (!input) return null;

    const allowedOrigins = new Set([window.location.origin, gatewayPublicOrigin].filter(Boolean));

    try {
      const u = new URL(input, window.location.origin);

      if (allowedOrigins.has(u.origin)) return u.toString();

      const looksInternal =
        u.hostname === "localhost" ||
        u.hostname === "auth-service" ||
        u.hostname === "gateway-service" ||
        /^127\./.test(u.hostname) ||
        /^10\./.test(u.hostname) ||
        /^192\.168\./.test(u.hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(u.hostname);

      if (looksInternal && gatewayPublicOrigin) {
        return new URL(`${u.pathname}${u.search}${u.hash}`, gatewayPublicOrigin).toString();
      }

      return null;
    } catch {
      return null;
    }
  };

  const initiateSecureLogin = () => {
    const gatewayUrl = gatewayPublicOrigin || "http://localhost:8082";
    const redirectUri = encodeURIComponent(`${window.location.origin}/dashboard`);
    const target = `${gatewayUrl}/oauth2/authorization/prism-gateway?redirect_uri=${redirectUri}`;
    window.location.href = target;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const continueParam = params.get('continue');
    const justLoggedOut = sessionStorage.getItem('prism_just_logged_out') === 'true';
    const hasGoogleIdToken = typeof window.location.hash === 'string' && window.location.hash.includes('id_token=');

    if (justLoggedOut) {
      // If we just logged out, clear all flags and force stay on landing or login
      sessionStorage.removeItem('prism_just_logged_out');
      sessionStorage.removeItem('prism_logout_in_progress');
      sessionStorage.removeItem(GOOGLE_CONTINUE_STORAGE_KEY);
      clearAuth();
      resetLogoutFlag();
      navigate("/", { replace: true });
      return;
    }

    if (continueParam) {
      const safeContinueUrl = toBrowserRedirectUrl(continueParam);
      if (!safeContinueUrl) {
        toast.error(t('auth.errors.invalidRequest', 'Invalid continue URL, please retry login.'));
        initiateSecureLogin();
        return;
      }

      setContinueUrl(safeContinueUrl);
      sessionStorage.setItem(GOOGLE_CONTINUE_STORAGE_KEY, safeContinueUrl);

      if (safeContinueUrl !== continueParam) {
        try {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set('continue', safeContinueUrl);
          window.history.replaceState(null, document.title, nextUrl.toString());
        } catch {
          // ignore
        }
      }
      if (isAuthenticated) clearAuth();
    } else if (isAuthenticated) {
      navigate('/dashboard');
    } else if (hasGoogleIdToken) {
      // Google OAuth implicit callback returns id_token in URL fragment (#id_token=...).
      // Do NOT initiate SSO redirect here, otherwise the hash will be lost and Google login cannot complete.
      return;
    } else {
      initiateSecureLogin();
    }
  }, [isAuthenticated, clearAuth, navigate, resetLogoutFlag]);

  const clearHashWithoutLosingQuery = () => {
    try {
      const nextUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, document.title, nextUrl);
    } catch (e) {
      // ignore
    }
  };

  const parseGoogleCallback = (): { idToken?: string; stateContinueUrl?: string } => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('id_token=')) {
      return {};
    }
    const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
    return {
      idToken: params.get('id_token') ?? undefined,
      stateContinueUrl: params.get('state') ?? undefined,
    };
  };

  // Handle Google Login Callback
  useEffect(() => {
    const handleCallback = async () => {
      if (googleCallbackHandledRef.current) return;

      const { idToken, stateContinueUrl } = parseGoogleCallback();
      if (!idToken) return;

      googleCallbackHandledRef.current = true;

      // Prefer continueUrl already parsed from ?continue=..., otherwise recover from OAuth2 `state`.
      const storedContinueUrl = sessionStorage.getItem(GOOGLE_CONTINUE_STORAGE_KEY);
      const effectiveContinueUrl = continueUrl || stateContinueUrl || storedContinueUrl || null;
      const safeContinueUrl = effectiveContinueUrl ? toBrowserRedirectUrl(effectiveContinueUrl) : null;

      if (!safeContinueUrl) {
        clearHashWithoutLosingQuery();
        sessionStorage.removeItem(GOOGLE_CONTINUE_STORAGE_KEY);
        toast.error(t('auth.errors.invalidRequest', 'Missing continue URL, please retry login.'));
        setIsLoading(false);
        return;
      }

      // Persist recovered continueUrl for later retries / other login methods.
      if (!continueUrl && stateContinueUrl) {
        setContinueUrl(safeContinueUrl);
        sessionStorage.setItem(GOOGLE_CONTINUE_STORAGE_KEY, safeContinueUrl);
      }

      setIsLoading(true);
      try {
        const response = await googleLogin({ idToken, continueUrl: safeContinueUrl, rememberMe });
        if (response.success && response.data) {
          clearHashWithoutLosingQuery();
          sessionStorage.removeItem(GOOGLE_CONTINUE_STORAGE_KEY);
          const redirectUrl = toBrowserRedirectUrl(response.data.redirectUrl);
          if (!redirectUrl) {
            toast.error(t('auth.errors.invalidRequest', 'Invalid redirect URL, please retry login.'));
            setIsLoading(false);
            return;
          }
          window.location.href = redirectUrl;
          return;
        }

        clearHashWithoutLosingQuery();
        toast.error(getErrorMessage(response));
        setIsLoading(false);
      } catch (error) {
        clearHashWithoutLosingQuery();
        toast.error(t('auth.errors.networkError'));
        setIsLoading(false);
      }
    };
    handleCallback();
  }, [continueUrl, rememberMe, t]);

  const handleGoogleLoginCustom = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error(t('auth.errors.googleLoginNotConfigured', 'Google login is not configured.'));
      return;
    }

    const queryContinueUrl = new URLSearchParams(window.location.search).get('continue');
    const storedContinueUrl = sessionStorage.getItem(GOOGLE_CONTINUE_STORAGE_KEY);
    const effectiveContinueUrl = continueUrl || queryContinueUrl || storedContinueUrl || '';
    if (!effectiveContinueUrl) {
      initiateSecureLogin();
      return;
    }

    sessionStorage.setItem(GOOGLE_CONTINUE_STORAGE_KEY, effectiveContinueUrl);
    const redirectUri = window.location.origin + '/login';
    const nonce = Math.random().toString(36).substring(2);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'id_token',
      scope: 'openid email profile',
      // Ensure users see a Google account chooser instead of a silent redirect when already signed in.
      prompt: 'select_account',
      nonce: nonce,
      response_mode: 'fragment',
      state: effectiveContinueUrl
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const isEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  const handleSendCode = async () => {
    if (!identifier) return;
    try {
      const isEmailAuth = isEmail(identifier);
      const response = isEmailAuth 
        ? await requestEmailOtp({ email: identifier })
        : await requestPhoneOtp({ phone: identifier });
        
      if (response.success) {
        setCountdown(60);
      } else {
        toast.error(getErrorMessage(response));
      }
    } catch (error) {
      toast.error(t('auth.errors.networkError'));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!continueUrl) {
      initiateSecureLogin();
      return;
    }
    const safeContinueUrl = toBrowserRedirectUrl(continueUrl);
    if (!safeContinueUrl) {
      toast.error(t('auth.errors.invalidRequest', 'Invalid continue URL, please retry login.'));
      initiateSecureLogin();
      return;
    }
    setIsLoading(true);
    try {
      const isEmailAuth = isEmail(identifier);
      const authType: AuthType = loginMethod === "password" 
        ? (isEmailAuth ? "EMAIL_PWD" : "PHONE_PWD") 
        : (isEmailAuth ? "EMAIL_OTP" : "PHONE_OTP");

      const response = await login({
        authType,
        email: isEmailAuth ? identifier : undefined,
        phone: !isEmailAuth ? identifier : undefined,
        password: loginMethod === "password" ? password : undefined,
        authCode: loginMethod === "code" ? code : undefined,
        continueUrl: safeContinueUrl,
        rememberMe,
      });

      if (response.success && response.data) {
        sessionStorage.removeItem(GOOGLE_CONTINUE_STORAGE_KEY);
        const redirectUrl = toBrowserRedirectUrl(response.data.redirectUrl);
        if (!redirectUrl) {
          toast.error(t('auth.errors.invalidRequest', 'Invalid redirect URL, please retry login.'));
          setIsLoading(false);
          return;
        }
        window.location.href = redirectUrl;
      } else {
        const errorCode = getErrorCode(response);
        if (errorCode === AuthErrorCode.INVALID_CONTINUE_URL) {
          initiateSecureLogin();
        } else {
          toast.error(getErrorMessage(response));
          setIsLoading(false);
        }
      }
    } catch (error) {
      toast.error(t('auth.errors.networkError'));
      setIsLoading(false);
    }
  };

  // Guard for OIDC initialization
  const searchParams = new URLSearchParams(window.location.search);
  const isJustLoggedOut = sessionStorage.getItem('prism_just_logged_out') === 'true';
  if (!searchParams.get('continue') && !isJustLoggedOut && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#131619] flex items-center justify-center overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-cyan/20 blur-[100px] rounded-full" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <PrismIcon size={64} variant="gradient" />
            <div className="flex gap-1.5 mt-2">
               {[0, 1, 2].map((i) => (
                 <div
                   key={i}
                   className="size-1.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(182,240,156,0.5)] animate-pulse"
                   style={{ animationDelay: `${i * 0.2}s` }}
                 />
               ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#131619] relative rounded-[24px] w-full max-w-[1440px] h-[800px] lg:h-[900px] overflow-hidden flex flex-col lg:block mx-auto">
      <div className="absolute left-[48px] top-[48px] right-[48px] flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <Logo />
          <PrismWordmark size="md" color="white" showFullName />
        </div>
        <LanguageSwitcher className="text-white/80" />
      </div>

      <div className="relative z-10 w-full lg:w-[480px] xl:w-[540px] px-8 lg:px-0 lg:ml-[112px] h-full flex flex-col justify-center">
        <div className="mb-12">
          <h1 className="text-[36px] leading-[44px] mb-6 text-white font-semibold">{t('auth.login.title')}</h1>
          <p className="text-[#9b9c9e] text-[18px] tracking-[0.15px]">{t('auth.login.subtitle')}</p>
        </div>

        <div className="flex gap-6 mb-8 border-b border-[#363a3d] pb-1">
          <button onClick={() => setLoginMethod("password")} className={`pb-3 text-[16px] font-medium transition-colors ${loginMethod === "password" ? "text-[#b6f09c] border-b-2 border-[#b6f09c]" : "text-[#686b6e] hover:text-[#cdcecf]"}`}>{t('auth.login.loginWithPassword')}</button>
          <button onClick={() => setLoginMethod("code")} className={`pb-3 text-[16px] font-medium transition-colors ${loginMethod === "code" ? "text-[#b6f09c] border-b-2 border-[#b6f09c]" : "text-[#686b6e] hover:text-[#cdcecf]"}`}>{t('auth.login.loginWithCode')}</button>
        </div>

        <div className="flex flex-col gap-6 w-full">
          <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all">
            <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px] transition-colors" />
            <div className="flex items-center px-[16px] h-full gap-[12px]">
              <UserIcon />
              <input type="text" placeholder={t('auth.login.emailPlaceholder', 'Email or Phone Number')} value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] placeholder-[#686b6e] w-full h-full font-sans" required />
            </div>
          </div>

          {loginMethod === "password" && (
            <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all">
              <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px] transition-colors" />
              <div className="flex items-center px-[16px] h-full gap-[12px]">
                <LockIcon />
                <input type={showPassword ? "text" : "password"} placeholder={t('auth.login.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] placeholder-[#686b6e] w-full h-full font-sans" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 hover:opacity-80 transition-opacity" tabIndex={-1}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          )}

          {loginMethod === "code" && (
            <div className="flex gap-4">
              <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all flex-1">
                <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px] transition-colors" />
                <div className="flex items-center px-[16px] h-full gap-[12px]">
                  <MessageIcon />
                  <input type="text" placeholder={t('auth.login.codePlaceholder')} value={code} maxLength={6} onChange={(e) => setCode(e.target.value)} className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] placeholder-[#686b6e] w-full h-full font-sans" required />
                </div>
              </div>
              <button type="button" onClick={handleSendCode} disabled={countdown > 0} className="h-[48px] px-4 rounded-[8px] bg-[#363a3d] text-[#cdcecf] font-medium text-[14px] hover:bg-[#4a4f54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{countdown > 0 ? t('auth.login.resendCodeIn', { seconds: countdown }) : t('auth.login.getCode')}</button>
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} className="mt-6">
          <div className="flex items-center justify-between w-full">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`size-4 rounded border transition-colors flex items-center justify-center ${rememberMe ? 'bg-[#b6f09c] border-[#b6f09c]' : 'border-[#363a3d] group-hover:border-[#686b6e]'}`} onClick={() => setRememberMe(!rememberMe)}>
                {rememberMe && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#0c1132" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span className="text-[#686b6e] text-sm select-none" onClick={() => setRememberMe(!rememberMe)}>{t('auth.login.rememberMe', 'Remember me')}</span>
            </label>
            {loginMethod === "password" && (
              <button type="button" onClick={() => onNavigate("forgot-password")} className="text-transparent bg-clip-text bg-gradient-to-r from-[#82DBF7] to-[#B6F09C] font-semibold text-[16px]">{t('auth.login.forgotPassword')}</button>
            )}
          </div>
          <button type="submit" disabled={isLoading} className="mt-8 w-full h-[48px] bg-[#b6f09c] hover:bg-[#a2e085] disabled:opacity-50 disabled:cursor-not-allowed rounded-[12px] flex items-center justify-center transition-colors">
            <span className="text-[#0c1132] text-[16px] font-semibold">{isLoading ? t('auth.login.loggingIn') : t('auth.common.logIn')}</span>
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4 w-full">
          <div className="h-[1px] flex-1 bg-[#363A3D]" />
          <span className="text-[#686b6e] text-[12px] font-medium">{t('auth.login.orLoginWith')}</span>
          <div className="h-[1px] flex-1 bg-[#363A3D]" />
        </div>

        <div className="mt-8 flex flex-col gap-4 w-full">
          <button type="button" onClick={handleGoogleLoginCustom} disabled={isLoading} className="w-full h-[48px] bg-white hover:bg-gray-100 rounded-[12px] flex items-center justify-center gap-3 transition-colors border border-gray-200 shadow-sm group">
            <GoogleLogo width={20} height={20} />
            <span className="text-[#1f1f1f] font-semibold text-[16px]">{t('auth.common.continueWithGoogle', 'Sign in with Google')}</span>
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          <span className="text-[#686b6e] font-semibold">{t('auth.login.noAccount')}</span>
          <button type="button" onClick={() => onNavigate("register")} className="text-transparent bg-clip-text bg-gradient-to-r from-[#82DBF7] to-[#B6F09C] font-semibold hover:opacity-80 transition-opacity">{t('auth.common.signUp')}</button>
        </div>
      </div>
      <Illustration />
    </div>
  );
}
