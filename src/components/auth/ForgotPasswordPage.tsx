import React, { useState } from "react";
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Sun,
  Moon,
} from "lucide-react";
import { AuthService } from "../../services/authService";

interface ForgotPasswordPageProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onNavigateToSignIn: () => void;
  onNavigateToLanding: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  theme,
  onToggleTheme,
  onNavigateToSignIn,
  onNavigateToLanding,
}) => {
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setEmailError(null);
    setSuccessMessage(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Please enter your corporate email address.");
      return;
    }

    if (!AuthService.isValidEmail(trimmed)) {
      setEmailError("Please enter a valid work email address format.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await AuthService.requestPasswordReset(trimmed);
      if (result.success) {
        setSuccessMessage(result.message);
      } else {
        setErrorMessage(result.error || "Unable to process password reset.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
        isDark ? "dark bg-[#09090B] text-neutral-100" : "bg-[#F8FAFC] text-slate-900"
      }`}
    >
      {/* Top Header Bar */}
      <header
        className={`w-full border-b py-3 px-4 sm:px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-20 ${
          isDark ? "border-neutral-800 bg-[#09090B]/90" : "border-slate-200 bg-white/90 shadow-xs"
        }`}
      >
        <button
          type="button"
          onClick={onNavigateToLanding}
          className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none rounded-lg group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs transition-transform group-hover:scale-105">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-950 dark:text-white">
                InventoryGuard<span className="text-emerald-600 dark:text-emerald-400">-AI</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Enterprise
              </span>
            </div>
            <div className={`text-[9px] font-semibold tracking-wider uppercase -mt-0.5 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
              Supply Chain Intelligence
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigateToSignIn}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? "border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isDark
                ? "bg-neutral-900 hover:bg-neutral-800 text-amber-400 border-neutral-700"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs"
            }`}
            title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div
          className={`w-full max-w-md rounded-2xl border shadow-sm p-6 sm:p-8 transition-all ${
            isDark ? "bg-neutral-900/90 border-neutral-800" : "bg-white border-slate-200"
          }`}
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Reset your password
            </h1>
            <p className="text-xs text-slate-600 dark:text-neutral-400 max-w-sm mx-auto">
              Enter your registered corporate email address and we'll dispatch an enterprise password recovery link with a secure verification token.
            </p>
          </div>

          {/* Success State */}
          {successMessage ? (
            <div className="mt-6 space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Reset Instructions Dispatched</span>
                </div>
                <p className="leading-relaxed">{successMessage}</p>
                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  Note: Demo accounts can also be accessed via the one-click persona switcher on the sign-in page.
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={onNavigateToSignIn}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSuccessMessage(null);
                    setEmail("");
                  }}
                  className={`w-full py-2 px-4 rounded-xl text-xs font-semibold border transition-colors cursor-pointer text-center ${
                    isDark
                      ? "border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  Try another email address
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Error banner */}
              {errorMessage && (
                <div
                  className="p-3 rounded-xl text-xs flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 animate-in fade-in"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-bold text-slate-800 dark:text-neutral-200 mb-1.5"
                >
                  Work Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder="name@zeptonow.com"
                    disabled={isSubmitting}
                    className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border transition-colors focus:outline-none focus:ring-2 font-medium ${
                      emailError
                        ? "border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500"
                        : isDark
                        ? "bg-neutral-800/80 border-neutral-700 text-white placeholder-neutral-500 focus:ring-emerald-500 focus:border-emerald-500"
                        : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-emerald-600 focus:border-emerald-600"
                    }`}
                    autoComplete="email"
                  />
                </div>
                {emailError && (
                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    {emailError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                  isSubmitting
                    ? "opacity-75 cursor-not-allowed bg-emerald-600 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white hover:shadow-md"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Back to Sign In Link */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onNavigateToSignIn}
                  className="text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* Bottom Security Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-neutral-800 text-[10px] text-slate-400 dark:text-neutral-500 text-center">
            Zero-Trust Workspace Security • Identity Verification
          </div>
        </div>
      </div>
    </div>
  );
};
