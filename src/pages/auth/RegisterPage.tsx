import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PrismWordmark, PrismIcon } from "../../components/shared/logo";
import { LanguageSwitcher } from "../../components/shared/LanguageSwitcher";
import { registerRequestOtp, registerVerifyOtp, registerComplete, getErrorMessage, getErrorCode } from "../../services/authApi";
import { AuthErrorCode } from "../../types/auth";
import { TermsModal } from "./TermsModal";

// Logo Component
function Logo() {
  return (
    <div className="absolute left-[48px] top-[48px] z-20">
      <PrismIcon size={32} variant="gradient" />
    </div>
  );
}

// Background Illustration Component
function Illustration({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="hidden lg:block absolute bottom-0 left-[60%] xl:left-[900px] right-0 rounded-[24px] top-0 transition-all duration-500 ease-in-out">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[24px] size-full object-left" src="/images/register-bg.png" />
    </div>
  );
}

const steps = [
  { number: 1, title: "Email" },
  { number: 2, title: "Verify" },
  { number: 3, title: "Password" },
  { number: 4, title: "Survey" },
];

const INDUSTRIES = [
  "Retail / Chain Stores",
  "Food & Beverage / Hotel / Travel",
  "Transportation / Logistics",
  "Enterprise / Parks / Energy",
  "Education / Medical / Public Service",
  "Media / Advertising / Exhibition",
  "Technology / Startup / Digital",
  "Other / Undecided",
];

const SCENARIOS = [
  "In-store Content Broadcast",
  "Real-time Information Publishing",
  "Enterprise Internal Infowall",
  "Marketing & Product Launch",
  "Training / Education / Guidance",
  "Device Status Monitoring",
  "Partner Content Distribution",
  "Other / TBD",
];

export default function RegisterPage({ onNavigate }: { onNavigate: (page: "login" | "register") => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");

  // Survey State
  const [industry, setIndustry] = useState("");
  const [scenarios, setScenarios] = useState<string[]>([]);

  // Timer State
  const [countdown, setCountdown] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [codeGeneratedTime, setCodeGeneratedTime] = useState(0);

  // OTP Input Refs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Constants
  const COOLDOWN_SECONDS = 60;
  const CODE_VALIDITY_MS = 10 * 60 * 1000; // 10 minutes as per backend spec

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  // Validation Logic
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (pwd: string) => {
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const isLongEnough = pwd.length >= 8;
    return hasUpper && hasLower && hasNumber && isLongEnough;
  };

  // Step 1: Request Code
  const handleRequestCode = async () => {
    if (!validateEmail(email)) {
      toast.error(t('auth.errors.invalidEmail'));
      return;
    }

    const now = Date.now();
    if (now - lastRequestTime < COOLDOWN_SECONDS * 1000) {
      toast.error(t('auth.errors.tooManyRequests'));
      return;
    }

    setLoading(true);
    try {
      const response = await registerRequestOtp({ email });
      if (response.success) {
        toast.success(t('auth.login.success'));
        setLastRequestTime(now);
        setCodeGeneratedTime(now);
        setCountdown(COOLDOWN_SECONDS);
        setStep(2);
        setCode("");
      } else {
        const errorCode = getErrorCode(response);
        if (errorCode === AuthErrorCode.EMAIL_EXISTS) {
          toast.error(t('auth.errors.emailExists'));
        } else if (errorCode === AuthErrorCode.TOO_MANY_REQUESTS) {
          toast.error(t('auth.errors.tooManyRequests'));
        } else {
          toast.error(getErrorMessage(response));
        }
      }
    } catch (error) {
      toast.error(t('auth.errors.networkError'));
      console.error('Register request OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async () => {
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      toast.error(t('auth.errors.invalidCode'));
      return;
    }

    const now = Date.now();
    if (now - codeGeneratedTime > CODE_VALIDITY_MS) {
      toast.error(t('auth.errors.codeExpired'));
      return;
    }

    setLoading(true);
    try {
      const response = await registerVerifyOtp({ email, otp: code });
      if (response.success && response.data) {
        toast.success(t('auth.register.success'));
        setVerificationToken(response.data.verificationToken);
        setStep(3);
      } else {
        const errorCode = getErrorCode(response);
        if (errorCode === AuthErrorCode.INVALID_OTP) {
          toast.error(t('auth.errors.invalidCode'));
        } else if (errorCode === AuthErrorCode.OTP_EXPIRED) {
          toast.error(t('auth.errors.codeExpired'));
        } else {
          toast.error(getErrorMessage(response));
        }
      }
    } catch (error) {
      toast.error(t('auth.errors.networkError'));
      console.error('Register verify OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  // OTP Handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    if (value.length > 1) {
      const pastedData = value.slice(0, 6);
      setCode(pastedData);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCodeArr = code.split("");
    for (let i = 0; i < 6; i++) {
      if (!newCodeArr[i]) newCodeArr[i] = "";
    }

    newCodeArr[index] = value;
    const newCode = newCodeArr.join("").slice(0, 6);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 3: Set Password
  const handleRegister = async () => {
    if (!validatePassword(password)) {
      toast.error(t('auth.errors.invalidPassword'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.register.passwordsDoNotMatch'));
      return;
    }

    if (!agreed) {
      toast.error(t('auth.register.agreeToTerms'));
      return;
    }

    setLoading(true);
    try {
      const response = await registerComplete({
        email,
        password,
        verificationToken,
      });
      if (response.success) {
        toast.success(t('auth.register.success'));
        setStep(4);
      } else {
        const errorCode = getErrorCode(response);
        if (errorCode === AuthErrorCode.PASSWORD_REQUIREMENTS) {
          toast.error(t('auth.errors.invalidPassword'));
        } else {
          toast.error(getErrorMessage(response));
        }
      }
    } catch (error) {
      toast.error(t('auth.errors.networkError'));
      console.error('Register complete error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleScenario = (sc: string) => {
    if (scenarios.includes(sc)) {
      setScenarios(scenarios.filter((s) => s !== sc));
    } else {
      setScenarios([...scenarios, sc]);
    }
  };

  const handleSurveySubmit = async () => {
    setLoading(true);
    try {
      // Survey data is optional per backend spec, so we just complete registration
      // In future, send survey data to a dedicated endpoint
      toast.success(t('auth.register.success'));
      onNavigate("login");
    } catch (error) {
      toast.error(t('auth.errors.networkError'));
      console.error('Survey submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#131619] overflow-hidden relative rounded-[24px] w-full max-w-[1440px] h-[800px] lg:h-[900px] flex flex-col lg:block">
      {/* Header with Logo and Login Link */}
      <div className="absolute left-[48px] top-[48px] right-[48px] flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <Logo />
          <PrismWordmark size="md" color="white" showFullName />
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher className="text-white/80" />
          <span className="text-[#686b6e] text-sm hidden sm:block" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{t('auth.register.alreadyHaveAccount')}</span>
          <button
            onClick={() => onNavigate("login")}
            className="text-transparent bg-clip-text bg-gradient-to-r from-[#82DBF7] to-[#B6F09C] font-semibold text-[16px]"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            {t('auth.common.logIn')}
          </button>
        </div>
      </div>

      <Illustration visible={step !== 4} />

      {/* Main Content Area */}
      <div className={`relative z-10 w-full ${step === 4 ? "lg:w-full lg:max-w-[800px] lg:mx-auto" : "lg:w-[600px] lg:ml-[112px]"} px-8 lg:px-0 h-full flex flex-col justify-center mt-20 lg:mt-0 transition-all duration-500`}>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center gap-2">
              <div
                className={`size-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s.number
                    ? "bg-[#b6f09c] text-[#0c1132]"
                    : "bg-[#1a1d21] text-[#686b6e] border border-[#363a3d]"
                }`}
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
              >
                {step > s.number ? "✓" : s.number}
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-8 h-[2px] ${step > s.number ? "bg-[#b6f09c]" : "bg-[#363a3d]"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="mb-10">
          <h1 className="text-[36px] leading-[44px] text-white font-normal mb-4" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            {step === 1 && t('auth.register.step1Title')}
            {step === 2 && t('auth.register.step2Title')}
            {step === 3 && t('auth.register.step3Title')}
            {step === 4 && t('auth.register.step4Title')}
          </h1>
          <p className="text-[#9b9c9e] text-[16px]" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            {step === 1 && t('auth.register.step1Subtitle')}
            {step === 2 && t('auth.register.step2Subtitle', { email })}
            {step === 3 && t('auth.register.step3Subtitle')}
            {step === 4 && t('auth.register.step4Subtitle')}
          </p>
        </div>

        <div className={`flex flex-col gap-6 w-full ${step === 4 ? "max-w-[680px]" : "max-w-[480px]"}`}>

          {/* Step 1: Email */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[#9b9c9e] text-[14px] font-medium" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{t('auth.common.email')}</label>
                <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all">
                  <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px] transition-colors" />
                  <div className="flex items-center px-[16px] h-full">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.register.emailPlaceholder')}
                      className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] placeholder-[#686b6e] w-full h-full"
                      style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleRequestCode}
                disabled={loading}
                className="w-full h-[48px] bg-[#b6f09c] hover:bg-[#a2e085] rounded-[12px] flex items-center justify-center transition-colors disabled:opacity-70 font-semibold text-[#0c1132]"
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
              >
                {loading ? t('auth.register.sending') : t('auth.register.getVerificationCode')}
              </button>
            </div>
          )}

          {/* Step 2: Verification Code */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[#9b9c9e] text-[14px] font-medium" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{t('auth.common.code')}</label>
                <div className="flex items-center justify-between w-full gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative w-full max-w-[56px] h-[72px] bg-[#1a1d21] rounded-[16px] group focus-within:ring-2 ring-[#82dbf7]/50 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                        <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-0 pointer-events-none rounded-[16px] transition-colors" />
                        <input
                          ref={(el) => {
                            if (el) inputRefs.current[index] = el;
                          }}
                          type="text"
                          maxLength={1}
                          value={code[index] || ""}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="bg-transparent border-none outline-none text-white text-[28px] font-bold text-center w-full h-full caret-[#82dbf7]"
                          style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                        />
                      </div>
                      {index < 5 && <div className="w-2 h-[2px] bg-[#363a3d] rounded-full" />}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-[#686b6e]" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{t('auth.register.codeExpiresIn')}</span>
                  <button
                    onClick={handleRequestCode}
                    disabled={countdown > 0}
                    className="text-[#82DBF7] hover:underline disabled:text-[#686b6e] disabled:no-underline"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                  >
                    {countdown > 0 ? t('auth.register.resendCodeIn', { seconds: countdown }) : t('auth.register.resendCode')}
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-[48px] bg-[#1a1d21] border border-[#363a3d] hover:bg-[#23262a] rounded-[12px] text-[#cdcecf] font-semibold transition-colors"
                  style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                  {t('auth.common.back')}
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={loading || code.length !== 6}
                  className="flex-[2] h-[48px] bg-[#b6f09c] hover:bg-[#a2e085] rounded-[12px] flex items-center justify-center transition-colors disabled:opacity-50 font-semibold text-[#0c1132]"
                  style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                  {loading ? t('auth.register.verifying') : t('auth.register.verifyCode')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[#9b9c9e] text-[14px] font-medium" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{t('auth.common.password')}</label>
                <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all">
                  <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px] transition-colors" />
                  <div className="flex items-center px-[16px] h-full">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.register.passwordPlaceholder')}
                      className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] placeholder-[#686b6e] w-full h-full"
                      style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[#9b9c9e] text-[14px] font-medium" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{t('auth.register.confirmPassword')}</label>
                <div className="bg-[#1a1d21] h-[48px] relative rounded-[8px] w-full group focus-within:ring-2 ring-[#82dbf7]/20 transition-all">
                  <div className="absolute border border-[#363a3d] group-focus-within:border-[#82dbf7] inset-[-1px] pointer-events-none rounded-[9px] transition-colors" />
                  <div className="flex items-center px-[16px] h-full">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('auth.register.confirmPasswordPlaceholder')}
                      className="bg-transparent border-none outline-none text-[#cdcecf] text-[16px] placeholder-[#686b6e] w-full h-full"
                      style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-[16px] cursor-pointer group" onClick={() => setAgreed(!agreed)}>
                <div className={`mt-1 flex items-center justify-center relative size-[24px] bg-[#1a1d21] rounded-[4px] border transition-colors flex-shrink-0 ${agreed ? "border-[#b6f09c] bg-[#b6f09c]/10" : "border-[#363a3d] group-hover:border-[#686b6e]"}`}>
                  {agreed && <span className="text-[#b6f09c] text-sm font-bold">✓</span>}
                </div>
                <div className="text-[#cdcecf] text-[16px] font-medium leading-[24px]" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  {t('auth.register.agreeToTermsPrefix')}{" "}
                  <span onClick={(e) => e.stopPropagation()}>
                    <TermsModal>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#82DBF7] to-[#B6F09C] font-semibold cursor-pointer hover:opacity-80">
                        {t('auth.register.termsAndConditions')}
                      </span>
                    </TermsModal>
                  </span>
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full h-[48px] bg-[#b6f09c] hover:bg-[#a2e085] rounded-[12px] flex items-center justify-center transition-colors disabled:opacity-70 font-semibold text-[#0c1132]"
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
              >
                {loading ? t('auth.register.creatingAccount') : t('auth.register.createFreeAccount')}
              </button>
            </div>
          )}

          {/* Step 4: Survey */}
          {step === 4 && (
            <div className="flex flex-col max-h-[55vh] animate-in fade-in slide-in-from-bottom-4 duration-500">

              <div className="overflow-y-auto pr-2 space-y-6 flex-1 -mr-2 scrollbar-thin scrollbar-thumb-[#363a3d] scrollbar-track-transparent">
                {/* Industry Section */}
                <div className="space-y-3">
                  <label className="text-[#9b9c9e] text-[13px] font-medium uppercase tracking-wider" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{t('auth.register.selectIndustry')}</label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind}
                        onClick={() => setIndustry(ind)}
                        className={`relative group p-3 rounded-[12px] text-left transition-all border flex-grow basis-[45%] max-w-full text-sm ${
                          industry === ind
                            ? "bg-[#b6f09c] border-[#b6f09c]"
                            : "bg-[#1a1d21] border-[#363a3d] hover:border-[#686b6e] hover:bg-[#23262a]"
                        }`}
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[13px] font-medium leading-tight block ${
                            industry === ind ? "text-[#0c1132]" : "text-[#cdcecf]"
                          }`}>
                            {ind}
                          </span>
                          {industry === ind && (
                            <div className="size-4 bg-[#0c1132]/20 rounded-full flex items-center justify-center shrink-0 ml-2">
                              <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#0c1132" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario Section */}
                <div className="space-y-3">
                  <label className="text-[#9b9c9e] text-[13px] font-medium uppercase tracking-wider" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{t('auth.register.selectScenarios')}</label>
                  <div className="flex flex-wrap gap-2">
                    {SCENARIOS.map((sc) => {
                      const isSelected = scenarios.includes(sc);
                      return (
                        <button
                          key={sc}
                          onClick={() => toggleScenario(sc)}
                          className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all border ${
                            isSelected
                              ? "bg-[#b6f09c]/10 border-[#b6f09c] text-[#b6f09c]"
                              : "bg-[#1a1d21] border-[#363a3d] text-[#cdcecf] hover:border-[#686b6e] hover:bg-[#23262a]"
                          }`}
                          style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                        >
                          {sc}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSurveySubmit}
                disabled={loading}
                className="w-full h-[48px] bg-[#b6f09c] hover:bg-[#a2e085] rounded-[12px] flex items-center justify-center transition-colors disabled:opacity-70 mt-4 shrink-0 font-semibold text-[#0c1132]"
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
              >
                {loading ? t('auth.register.submitting') : t('auth.register.completeRegistration')}
              </button>
            </div>
          )}
        </div>

      </div>

      <div className={`absolute bottom-[48px] left-[48px] flex items-center justify-between text-[#686b6e] text-[14px] z-10 hidden lg:flex ${
        step === 4 ? "right-[48px]" : "w-full max-w-[804px]"
      }`} style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
        <p>{t('auth.common.copyright')}</p>
        <p>{t('auth.common.privacyPolicy')}</p>
      </div>
    </div>
  );
}
