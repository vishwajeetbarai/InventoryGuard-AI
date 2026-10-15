import React, { useState } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  User,
  AlertCircle,
  TrendingUp,
  Shield,
  Truck,
  Sun,
  Moon,
  ArrowLeft,
  Check,
  CheckCircle2,
  Building2,
  Briefcase,
  Boxes,
  PieChart,
} from "lucide-react";
import { UserRole } from "../../types/auth";
import { USER_ROLES, AuthService } from "../../services/authService";

interface SignUpPageProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onSuccess: (role?: UserRole) => void;
  onNavigateToSignIn: () => void;
  onNavigateToLanding: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  theme,
  onToggleTheme,
  onSuccess,
  onNavigateToSignIn,
  onNavigateToLanding,
}) => {
  const isDark = theme === "dark";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("INVENTORY_MANAGER");
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
    INVENTORY_MANAGER: Boxes,
    PROCUREMENT_SPECIALIST: Briefcase,
    WAREHOUSE_SUPERVISOR: Truck,
    EXECUTIVE_CFO: PieChart,
  };

  const roleOrder: UserRole[] = [
    "INVENTORY_MANAGER",
    "PROCUREMENT_SPECIALIST",
    "WAREHOUSE_SUPERVISOR",
    "EXECUTIVE_CFO",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const newFieldErrors: Record<string, string> = {};

    if (!name.trim()) {
      newFieldErrors.name = "Full name is required.";
    } else if (name.trim().length < 2) {
      newFieldErrors.name = "Name must be at least 2 characters.";
    }

    if (!email.trim()) {
      newFieldErrors.email = "Corporate work email is required.";
    } else if (!AuthService.isValidEmail(email)) {
      newFieldErrors.email = "Please enter a valid work email format.";
    }

    if (!password) {
      newFieldErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newFieldErrors.password = "Password must be at least 8 characters.";
    }

    if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = "Passwords do not match.";
    }

    if (!acceptedTerms) {
      newFieldErrors.acceptedTerms = "Please acknowledge enterprise terms & data policy.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await AuthService.register({
        name,
        email,
        password,
        confirmPassword,
        role: selectedRole,
        acceptedTerms,
      });

      if (result.success && result.session) {
        onSuccess(result.session.user.role);
      } else {
        setErrorMessage(result.error || "Registration failed. Please check form inputs.");
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during account creation.");
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
          {/* LEFT COLUMN: Registration Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Form Header */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Enterprise Onboarding</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                  Create your account
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 font-medium">
                  Get started with smarter supply chain decisions across your retail or dark store network.
                </p>
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
              <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                {/* Full Name & Work Email in responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="block text-xs font-bold text-slate-800 dark:text-neutral-200 mb-1"
                    >
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (fieldErrors.name) {
                            setFieldErrors((prev) => ({ ...prev, name: "" }));
                          }
                        }}
                        placeholder="Dr. Rajesh Mehta"
                        disabled={isSubmitting}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-colors focus:outline-none focus:ring-2 font-medium ${
                          fieldErrors.name
                            ? "border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500"
                            : isDark
                            ? "bg-neutral-800/80 border-neutral-700 text-white placeholder-neutral-500 focus:ring-emerald-500 focus:border-emerald-500"
                            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-emerald-600 focus:border-emerald-600"
                        }`}
                        autoComplete="name"
                      />
                    </div>
                    {fieldErrors.name && (
                      <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Work Email */}
                  <div>
                    <label
                      htmlFor="signup-email"
                      className="block text-xs font-bold text-slate-800 dark:text-neutral-200 mb-1"
                    >
                      Work Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) {
                            setFieldErrors((prev) => ({ ...prev, email: "" }));
                          }
                        }}
                        placeholder="rajesh@enterprise.com"
                        disabled={isSubmitting}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-colors focus:outline-none focus:ring-2 font-medium ${
                          fieldErrors.email
                            ? "border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500"
                            : isDark
                            ? "bg-neutral-800/80 border-neutral-700 text-white placeholder-neutral-500 focus:ring-emerald-500 focus:border-emerald-500"
                            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-emerald-600 focus:border-emerald-600"
                        }`}
                        autoComplete="email"
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Password */}
                  <div>
                    <label
                      htmlFor="signup-password"
                      className="block text-xs font-bold text-slate-800 dark:text-neutral-200 mb-1"
                    >
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) {
                            setFieldErrors((prev) => ({ ...prev, password: "" }));
                          }
                        }}
                        placeholder="Min 8 characters"
                        disabled={isSubmitting}
                        className={`w-full pl-9 pr-9 py-2 text-xs rounded-xl border transition-colors focus:outline-none focus:ring-2 font-medium ${
                          fieldErrors.password
                            ? "border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500"
                            : isDark
                            ? "bg-neutral-800/80 border-neutral-700 text-white placeholder-neutral-500 focus:ring-emerald-500 focus:border-emerald-500"
                            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-emerald-600 focus:border-emerald-600"
                        }`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="signup-confirm-password"
                      className="block text-xs font-bold text-slate-800 dark:text-neutral-200 mb-1"
                    >
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) {
                            setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                          }
                        }}
                        placeholder="Re-type password"
                        disabled={isSubmitting}
                        className={`w-full pl-9 pr-9 py-2 text-xs rounded-xl border transition-colors focus:outline-none focus:ring-2 font-medium ${
                          fieldErrors.confirmPassword
                            ? "border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500"
                            : isDark
                            ? "bg-neutral-800/80 border-neutral-700 text-white placeholder-neutral-500 focus:ring-emerald-500 focus:border-emerald-500"
                            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-emerald-600 focus:border-emerald-600"
                        }`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 cursor-pointer"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role Selection (Known Product Roles from existing enum) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-neutral-200">
                      Functional Role Selection <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                      RBAC Enforced
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {roleOrder.map((roleKey) => {
                      const def = USER_ROLES[roleKey];
                      const IconComponent = roleIcons[roleKey] || Building2;
                      const isSelected = selectedRole === roleKey;

                      return (
                        <button
                          key={roleKey}
                          type="button"
                          onClick={() => setSelectedRole(roleKey)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                            isSelected
                              ? isDark
                                ? "bg-emerald-950/40 border-emerald-500 text-white shadow-xs"
                                : "bg-emerald-50/70 border-emerald-600 text-slate-900 shadow-xs"
                              : isDark
                              ? "bg-neutral-800/40 hover:bg-neutral-800 border-neutral-700/80 text-neutral-300"
                              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? isDark
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-emerald-600 text-white"
                                    : isDark
                                    ? "bg-neutral-700/60 text-neutral-300"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                                  <span>{def.title}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium">
                                  {def.department}
                                </div>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <p className="mt-1.5 text-[10px] text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                            {def.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Terms Acknowledgement */}
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        if (fieldErrors.acceptedTerms) {
                          setFieldErrors((prev) => ({ ...prev, acceptedTerms: "" }));
                        }
                      }}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-neutral-700 dark:bg-neutral-800 mt-0.5"
                    />
                    <span className="text-[11px] text-slate-600 dark:text-neutral-400 leading-snug">
                      I agree to the Enterprise Master Services Agreement, Authorized Persona Access Policies, and Data Privacy governance.
                    </span>
                  </label>
                  {fieldErrors.acceptedTerms && (
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {fieldErrors.acceptedTerms}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2 ${
                    isSubmitting
                      ? "opacity-75 cursor-not-allowed bg-emerald-600 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white hover:shadow-md"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Provisioning Enterprise Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Account Provisioning</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Sign In Redirect */}
              <div className="mt-4 text-center">
                <span className="text-xs text-slate-600 dark:text-neutral-400">
                  Already have an authorized account?{" "}
                </span>
                <button
                  type="button"
                  onClick={onNavigateToSignIn}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </div>

            {/* Bottom compliance tag */}
            <div className="mt-5 text-[10px] text-slate-400 dark:text-neutral-500 flex items-center justify-between border-t border-slate-100 dark:border-neutral-800 pt-3">
              <span>Tenant: Zepto Hyperlocal Logistics Ltd.</span>
              <span>SAP S/4HANA Certified</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Brand & Capabilities */}
          <div
            className={`hidden lg:flex lg:col-span-5 p-8 flex-col justify-between relative overflow-hidden border-l ${
              isDark
                ? "bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-neutral-800"
                : "bg-gradient-to-br from-slate-900 via-slate-950 to-neutral-950 text-white border-slate-200"
            }`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  ENTERPRISE ONBOARDING
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
                  Built for Quick-Commerce and Modern Retail
                </h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Join leading supply chain leaders managing thousands of perishable and fast-moving SKUs with algorithmic certainty.
                </p>
              </div>

              {/* Role-Specific Capability Highlights */}
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Inventory Managers</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Bivariate dynamic safety stock tuning, batch perishability decay modeling, and markdown liquidation triggers.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    <span>Procurement Specialists</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Automated PO batch generation, outbound EDI 850 webhooks, and vendor SLA reliability debit notes.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Warehouse Supervisors</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Autonomous multi-echelon dark store rebalancing via green EV routing under 4 hours.
                  </p>
                </div>
              </div>

              {/* Security & Audit Commitment */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Immutable Audit Governance</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Every PO dispatch, buffer adjustment, and transfer authorization is immutably logged with SHA-256 cryptographic hashes ready for SOC2 reviews.
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
              <span>99.0% Cycle Service Level</span>
              <span>Zero Cart-Drop Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
