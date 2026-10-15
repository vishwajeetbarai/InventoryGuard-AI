import React, { useState } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  AlertCircle,
  TrendingUp,
  Shield,
  Truck,
  Sun,
  Moon,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { UserRole } from "../../types/auth";
import { AuthService, DEMO_CREDENTIALS, DemoCredentialItem } from "../../services/authService";

interface SignInPageProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onSuccess: (role?: UserRole) => void;
  onNavigateToSignUp: () => void;
  onNavigateToForgotPassword: () => void;
  onNavigateToLanding: () => void;
  redirectUrl?: string;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  theme,
  onToggleTheme,
  onSuccess,
  onNavigateToSignUp,
  onNavigateToForgotPassword,
  onNavigateToLanding,
  redirectUrl,
}) => {
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const handleAutofillDemo = (demo: DemoCredentialItem) => {
    setEmail(demo.email);
    setPassword(demo.defaultPassword);
    setActiveDemo(demo.role);
    setErrorMessage(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const newFieldErrors: Record<string, string> = {};
    if (!email.trim()) {
      newFieldErrors.email = "Please enter your corporate email address.";
    } else if (!AuthService.isValidEmail(email)) {
      newFieldErrors.email = "Please enter a valid work email format.";
    }

    if (!password) {
      newFieldErrors.password = "Please enter your password.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await AuthService.login({
        email,
        password,
        rememberMe,
      });

      if (result.success && result.session) {
        onSuccess(result.session.user.role);
      } else {
        setErrorMessage(result.error || "Authentication failed. Please verify credentials.");
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during sign-in.");
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
            onClick={onNavigateToLanding}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? "border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to</span> Home
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

      {/* Main Split Screen Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div
          className={`w-full max-w-5xl rounded-2xl border shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all ${
            isDark ? "bg-neutral-900/90 border-neutral-800" : "bg-white border-slate-200"
          }`}
        >
          {/* LEFT COLUMN: Sign In Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Form Header */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <Lock className="w-3 h-3" />
                  <span>Secure Enterprise Access</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                  Welcome back
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 font-medium">
                  Sign in to your supply chain workspace to monitor stockout exposure and reorder pipelines.
                </p>
                {redirectUrl && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-lg mt-2">
                    Please sign in to access your requested dashboard view.
                  </div>
                )}
              </div>

              {/* Error banner */}
              {errorMessage && (
                <div
                  className="mt-4 p-3 rounded-xl text-xs flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 animate-in fade-in"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Email Address */}
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block text-xs font-bold text-slate-800 dark:text-neutral-200 mb-1.5"
                  >
                    Work Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => ({ ...prev, email: "" }));
                        }
                      }}
                      placeholder="name@zeptonow.com"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border transition-colors focus:outline-none focus:ring-2 font-medium ${
                        fieldErrors.email
                          ? "border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500"
                          : isDark
                          ? "bg-neutral-800/80 border-neutral-700 text-white placeholder-neutral-500 focus:ring-emerald-500 focus:border-emerald-500"
                          : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-emerald-600 focus:border-emerald-600"
                      }`}
                      autoComplete="username"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="signin-password"
                      className="block text-xs font-bold text-slate-800 dark:text-neutral-200"
                    >
                      Workspace Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={onNavigateToForgotPassword}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({ ...prev, password: "" }));
                        }
                      }}
                      placeholder="••••••••••••"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border transition-colors focus:outline-none focus:ring-2 font-medium ${
                        fieldErrors.password
                          ? "border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500"
                          : isDark
                          ? "bg-neutral-800/80 border-neutral-700 text-white placeholder-neutral-500 focus:ring-emerald-500 focus:border-emerald-500"
                          : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-emerald-600 focus:border-emerald-600"
                      }`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-neutral-700 dark:bg-neutral-800"
                    />
                    <span className="text-xs text-slate-600 dark:text-neutral-400 font-medium">
                      Remember this workstation session for 30 days
                    </span>
                  </label>
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
                      <span>Authenticating Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Control Tower</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Sign Up Redirect */}
              <div className="mt-4 text-center">
                <span className="text-xs text-slate-600 dark:text-neutral-400">
                  Don't have an enterprise account?{" "}
                </span>
                <button
                  type="button"
                  onClick={onNavigateToSignUp}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </div>

              {/* Quick Persona Demo Selector */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Quick Demo Sign-In (Select Role)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Click to autofill</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {DEMO_CREDENTIALS.map((demo) => {
                    const isSelected = activeDemo === demo.role || email === demo.email;
                    return (
                      <button
                        key={demo.role}
                        type="button"
                        onClick={() => handleAutofillDemo(demo)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? isDark
                              ? "bg-neutral-800 border-emerald-500/50 text-white"
                              : "bg-emerald-50/80 border-emerald-300 text-slate-900"
                            : isDark
                            ? "bg-neutral-800/40 hover:bg-neutral-800 border-neutral-700/60 text-neutral-300"
                            : "bg-slate-50/60 hover:bg-slate-100/80 border-slate-200 text-slate-700"
                        }`}
                      >
                        <span className="text-base shrink-0">{demo.avatar}</span>
                        <div className="truncate">
                          <div className="text-[11px] font-bold truncate leading-tight flex items-center gap-1">
                            {demo.title}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">
                            {demo.name.split(" ")[0]}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom compliance tag */}
            <div className="mt-6 text-[10px] text-slate-400 dark:text-neutral-500 flex items-center justify-between border-t border-slate-100 dark:border-neutral-800 pt-3">
              <span>SOC2 Type II • HMAC-SHA256 Sessions</span>
              <span>v2.5 Enterprise Edition</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Brand / Product Capability Showcase */}
          <div
            className={`hidden lg:flex lg:col-span-5 p-8 flex-col justify-between relative overflow-hidden border-l ${
              isDark
                ? "bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-neutral-800"
                : "bg-gradient-to-br from-slate-900 via-slate-950 to-neutral-950 text-white border-slate-200"
            }`}
          >
            {/* Subtle glow circle */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Product Title */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  SUPPLY CHAIN INTELLIGENCE
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
                  Inventory intelligence. Clear decisions.
                </h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Enterprise supply chain control tower bridging stochastic Monte Carlo stockout elimination, dual-variance dynamic safety stock, and automated multi-echelon replenishment.
                </p>
              </div>

              {/* Live Metric Highlights */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Target CSL</div>
                  <div className="text-lg font-extrabold text-white mt-0.5">99.0%</div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Equilibrium</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Dark Stores</div>
                  <div className="text-lg font-extrabold text-white mt-0.5">3 Active</div>
                  <div className="text-[10px] text-slate-300 font-semibold flex items-center gap-1 mt-0.5">
                    <span>Multi-Echelon Sync</span>
                  </div>
                </div>
              </div>

              {/* Restrained Network Preview Visual */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span className="font-bold">NETWORK TOPOLOGY PREVIEW</span>
                  <span className="text-emerald-400 text-[10px]">● Live Sync</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-slate-200 font-semibold">WH-BOM-01</span>
                      <span className="text-[10px] text-slate-400">Mumbai Central</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">99.4% Service</span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-200 font-semibold">WH-DEL-01</span>
                      <span className="text-[10px] text-slate-400">Delhi Okhla</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">98.9% Service</span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-slate-200 font-semibold">WH-BLR-02</span>
                      <span className="text-[10px] text-slate-400">Bangalore Koramangala</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300">EV Rebalancing</span>
                  </div>
                </div>
              </div>

              {/* 3 Short Capability Badges */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Core Enterprise Engines
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Demand Forecasting</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Inventory Risk</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Procurement Intelligence</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom info */}
            <div className="relative z-10 pt-4 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Hyperlocal Quick-Commerce Edition</span>
              <span>10-Minute Dark Store SLA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
