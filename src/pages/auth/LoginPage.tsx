import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "@/store/notificationStore";
import { PrismWordmark, PrismIcon, GoogleLogo, AppleLogo, WechatLogo } from "../../components/shared/logo";
import { LanguageSwitcher } from "../../components/shared/LanguageSwitcher";
import { login, requestEmailOtp, googleLogin, getErrorMessage, getErrorCode } from "../../services/authApi";
import type { AuthType } from "../../types/auth";
import { AuthErrorCode } from "../../types/auth";
import { useAuthStore } from "../../store/authStore";

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

export default function LoginPage({ onNavigate }: { onNavigate: (page: "login" | "register") => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth, clearAuth, isAuthenticated } = useAuthStore();
  
  const [continueUrl, setContinueUrl] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<"password" | "code">("password");
  const [identifier, setIdentifier] = useState(""); // Email or Phone
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Helper to initiate OIDC flow via Gateway
  const initiateSecureLogin = () => {
    const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8082";
    const redirectUri = encodeURIComponent(`${window.location.origin}/dashboard`);
    const target = `${gatewayUrl}/oauth2/authorization/prism-gateway?redirect_uri=${redirectUri}`;
    console.log('[Auth] Initiating secure login flow via Gateway:', target);
    window.location.href = target;
  };

  // Parse continue parameter from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const continueParam = params.get('continue');
    
    if (continueParam) {
      // 1. 如果有 continue 参数，说明正在进行 OAuth2 流程，保存它
      setContinueUrl(continueParam);
      
      // 进入登录页意味着后端 Session 已失效，强制同步前端状态
      if (isAuthenticated) {
        clearAuth();
      }
    } else {
      // 2. 没有 continue 参数的情况
      if (isAuthenticated) {
        // 如果已经登录，直接去后台
        navigate('/dashboard');
      } else {
        // 如果未登录且缺失 continue，说明是直接访问 /login。
        // 为了确保第一次登录就能成功（不报错 AUTH-1014），必须立即跳转网关获取上下文。
        // 这会触发一次整页跳转，回来的 URL 会带上正确的 continue 参数。
        console.log('[Auth] Missing continue parameter, redirecting to Gateway to initialize OIDC context...');
        initiateSecureLogin();
      }
    }
  }, [isAuthenticated, clearAuth, navigate]);

  // If already authenticated and no continue param, we are about to redirect to dashboard.
  // Or if no continue param and not authenticated, we are about to redirect to Gateway.
  // Don't render the form to avoid flash and unnecessary interactions.
  const params = new URLSearchParams(window.location.search);
  if (!params.get('continue')) {
    return (
      <div className="min-h-screen bg-[#131619] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <PrismIcon size={48} variant="gradient" className="animate-pulse" />
          <p className="text-white/40 text-sm font-medium animate-pulse">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  // Handle Google Login Callback (from Redirect Flow)
  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('id_token=')) {
        const params = new URLSearchParams(hash.substring(1));
        const idToken = params.get('id_token');
        
        if (idToken && continueUrl) {
          setIsLoading(true);
          try {
            const response = await googleLogin({
              idToken,
              continueUrl,
              rememberMe: true
            });

            if (response.success && response.data) {
              toast.success(t('auth.login.success'));
              window.location.href = response.data.redirectUrl;
            } else {
              toast.error(getErrorMessage(response));
              setIsLoading(false);
            }
          } catch (error) {
            toast.error(t('auth.errors.networkError'));
            setIsLoading(false);
          }
        }
      }
    };

    handleCallback();
  }, [continueUrl, t]);

  const handleGoogleLoginCustom = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error("Google Client ID not configured");
      return;
    }

    // Ensure redirectUri matches EXACTLY what is in Google Console
    const redirectUri = window.location.origin + '/login';
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'id_token',
      scope: 'openid email profile',
      nonce: nonce,
      response_mode: 'fragment', // Ensures it comes back in the #hash
      state: continueUrl || ''
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    window.location.href = url;
  };

  // Countdown timer for code resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const isEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  const isPhone = (input: string) => /^\+?[\d\s-]{8,}$/.test(input);

  const handleSendCode = async () => {
    if (!identifier) {
      toast.error(t('auth.errors.invalidIdentifier', 'Please enter your email or phone number'));
      return;
    }

    if (!isEmail(identifier) && !isPhone(identifier)) {
        toast.error(t('auth.errors.invalidFormat', 'Invalid email or phone number format'));
        return;
    }

    try {
      let response;
      if (isEmail(identifier)) {
          response = await requestEmailOtp({ email: identifier });
      } else {
           toast.error("Phone OTP not yet implemented in frontend");
           return;
      }

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
      console.error('Request OTP error:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!continueUrl) {
      toast.error(t('auth.errors.continueUrlMissing'));
      return;
    }

    if (!identifier) {
      toast.error(t('auth.errors.invalidIdentifier', 'Please enter your email or phone number'));
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
      const isEmailAuth = isEmail(identifier);
      let authType: AuthType;

      if (loginMethod === "password") {
          authType = isEmailAuth ? "EMAIL_PWD" : "PHONE_PWD";
      } else {
          authType = isEmailAuth ? "EMAIL_OTP" : "PHONE_OTP";
      }

      const response = await login({
        authType,
        email: isEmailAuth ? identifier : undefined,
        phone: !isEmailAuth ? identifier : undefined,
        password: loginMethod === "password" ? password : undefined,
        authCode: loginMethod === "code" ? code : undefined,
        continueUrl,
        rememberMe,
      });

      if (response.success && response.data) {
        toast.success(t('auth.login.success'));
        window.location.href = response.data.redirectUrl;
      } else {
        const errorCode = getErrorCode(response);
        if (errorCode === AuthErrorCode.ACCOUNT_OR_CREDENTIAL_ERROR) {
          toast.error(t('auth.errors.accountOrCredentialError'));
        } else if (errorCode === AuthErrorCode.INVALID_CONTINUE_URL) {
          // 如果 continueUrl 被后端拒绝，说明必须走网关授权流程来刷新 OIDC Context
          toast.error(t('auth.errors.continueUrlInvalid', 'Invalid session context, redirecting to secure login...'));
          setTimeout(() => initiateSecureLogin(), 1500);
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

          {/* Identifier Input (Email or Phone) */}
          <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all">
            <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px] transition-colors" />
            <div className="flex items-center px-[16px] h-full gap-[12px]">
              <UserIcon />
              <input
                type="text"
                placeholder={t('auth.login.emailPlaceholder', 'Email or Phone Number')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
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
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`size-4 rounded border transition-colors flex items-center justify-center ${rememberMe ? 'bg-[#b6f09c] border-[#b6f09c]' : 'border-[#363a3d] group-hover:border-[#686b6e]'}`} onClick={() => setRememberMe(!rememberMe)}>
                {rememberMe && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#0c1132" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span className="text-[#686b6e] text-sm select-none" onClick={() => setRememberMe(!rememberMe)}>{t('auth.login.rememberMe', 'Remember me')}</span>
            </label>
            {loginMethod === "password" && (
              <button 
                type="button" 
                onClick={() => onNavigate("forgot-password")}
                className="text-transparent bg-clip-text bg-gradient-to-r from-[#82DBF7] to-[#B6F09C] font-semibold text-[16px]"
              >
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
        <div className="mt-8 flex flex-col gap-4 w-full">
          {/* Google - Custom Prism Style */}
          <button
            type="button"
            onClick={handleGoogleLoginCustom}
            disabled={isLoading}
            className="w-full h-[48px] bg-white hover:bg-gray-100 rounded-[12px] flex items-center justify-center gap-3 transition-colors border border-gray-200 shadow-sm group"
          >
            <GoogleLogo width={20} height={20} />
            <span className="text-[#1f1f1f] font-semibold text-[16px]">
              {t('auth.common.continueWithGoogle', 'Sign in with Google')}
            </span>
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