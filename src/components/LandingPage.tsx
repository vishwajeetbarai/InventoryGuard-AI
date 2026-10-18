import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Truck,
  Layers,
  Database,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Building2,
  BarChart3,
  Activity,
  ChevronRight,
  Lock,
  Zap,
  FileSpreadsheet,
  ArrowUpRight,
  Clock,
  HelpCircle,
  ChevronDown,
  DollarSign,
  Percent,
  Play,
  SlidersHorizontal,
  Sun,
  Moon,
  ArrowRight,
  Package,
  Globe2,
  FileCode2,
  Scale,
  Calendar,
  Check,
  Users,
  LogIn,
  UserPlus,
  Menu,
  X,
} from "lucide-react";
import { CurrencyCode, AppPage, Warehouse } from "../types";
import { UserProfile } from "../types/auth";
import { CURRENCIES, formatCurrency, convertFromInr, convertToInr } from "../utils/currency";
import { WAREHOUSES, SKUS } from "../engine/supplyChainEngine";

interface LandingPageProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  currency: CurrencyCode;
  onSelectCurrency: (curr: CurrencyCode) => void;
  onEnterApp: (targetPage?: AppPage, targetTab?: string) => void;
  onNavigateToSignIn?: () => void;
  onNavigateToSignUp?: () => void;
  isAuthenticated?: boolean;
  currentUser?: UserProfile | null;
  onSignOut?: () => void;
  onOpenCopilot?: () => void;
  onOpenHelpGuide?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  theme,
  onToggleTheme,
  currency,
  onSelectCurrency,
  onEnterApp,
  onNavigateToSignIn,
  onNavigateToSignUp,
  isAuthenticated = false,
  currentUser,
  onSignOut,
  onOpenCopilot,
  onOpenHelpGuide,
}) => {
  const isDark = theme === "dark";

  // Interactive Hero Preview State (Mini-Simulator in Hero)
  const [heroScenario, setHeroScenario] = useState<"NORMAL" | "MONSOON" | "FLASH_SALE" | "LOGISTICS_STRIKE">("NORMAL");

  // ROI Calculator State
  const [calcGmv, setCalcGmv] = useState<number>(15000000); // 15M base currency equivalent
  const [calcStockoutRate, setCalcStockoutRate] = useState<number>(7.5); // 7.5%
  const [calcMargin, setCalcMargin] = useState<number>(32); // 32% gross margin
  const [calcNodes, setCalcNodes] = useState<number>(12); // 12 dark stores

  // FAQ Open State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Currency Dropdown
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  // Mobile navigation drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Calculate Hero metrics based on active scenario
  const heroMetrics = useMemo(() => {
    switch (heroScenario) {
      case "MONSOON":
        return {
          serviceLevel: 98.4,
          stockoutProb: 6.8,
          criticalSkus: 3,
          safetyStockUnits: 840,
          ropAdjustment: "+42%",
          statusLabel: "Monsoon Shock Active",
          statusColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          interStoreTransit: "4.2h (EV Fleet Wet Route)",
        };
      case "FLASH_SALE":
        return {
          serviceLevel: 99.5,
          stockoutProb: 4.1,
          criticalSkus: 2,
          safetyStockUnits: 1120,
          ropAdjustment: "+65%",
          statusLabel: "Flash Sale Surge (+65%)",
          statusColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
          interStoreTransit: "1.8h (Priority Dispatch)",
        };
      case "LOGISTICS_STRIKE":
        return {
          serviceLevel: 96.2,
          stockoutProb: 11.4,
          criticalSkus: 4,
          safetyStockUnits: 1350,
          ropAdjustment: "+85%",
          statusLabel: "Vendor Delay Shock (+4.0d)",
          statusColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          interStoreTransit: "2.4h (Intra-City Rebalance)",
        };
      default:
        return {
          serviceLevel: 99.2,
          stockoutProb: 2.1,
          criticalSkus: 1,
          safetyStockUnits: 560,
          ropAdjustment: "Baseline (0%)",
          statusLabel: "Optimal Operations",
          statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          interStoreTransit: "2.1h (Standard Route)",
        };
    }
  }, [heroScenario]);

  // Dynamic ROI Calculations
  const roiCalculations = useMemo(() => {
    // Annual lost sales due to stockouts
    const annualLostSales = calcGmv * (calcStockoutRate / 100);
    // Lost gross profit
    const annualLostProfit = annualLostSales * (calcMargin / 100);
    // InventoryGuard recovery estimate: 65% reduction in stockouts
    const recoveredProfit = annualLostProfit * 0.65;
    // Working capital freed from dead/excess stock: ~8% of GMV
    const freedWorkingCapital = calcGmv * 0.082;
    // Estimated ROI multiplier
    const roiMultiplier = ((recoveredProfit + freedWorkingCapital * 0.12) / 60000).toFixed(1);

    return {
      annualLostSales,
      annualLostProfit,
      recoveredProfit,
      freedWorkingCapital,
      roiMultiplier,
    };
  }, [calcGmv, calcStockoutRate, calcMargin, calcNodes]);

  const faqs = [
    {
      q: "How does InventoryGuard AI calculate dual-variance safety stock differently than traditional ERPs?",
      a: "Traditional ERPs apply static single-variable safety stock formulas that assume constant supplier lead times. InventoryGuard AI employs a bivariate stochastic model that couples demand standard deviation (σ_d) and supplier dispatch jitter (σ_L): SS = Z × √(L_bar · σ_d² + D_bar² · σ_L²). This mathematically guarantees protection against both unexpected consumer surges and vendor dispatch delays.",
    },
    {
      q: "Can the platform ingest data from our existing SAP S/4HANA, NetSuite, or WMS systems?",
      a: "Yes. InventoryGuard AI provides a production-ready Data Hub with schema-validated CSV drag-and-drop ingestion, bi-directional REST webhooks with HMAC-SHA256 signatures, and ANSI X12 EDI 850 purchase order generation formatted for immediate enterprise ERP dispatch.",
    },
    {
      q: "How does the Perishable Decay Engine model batch expiration for quick-commerce groceries?",
      a: "The engine models batch age and shelf-life degradation (δ_decay) at the SKU level. Reorder points (ROP) and Monte Carlo stock-out risks are continuously computed against Usable Fresh Stock rather than nominal expired inventory, preventing both food waste and customer cart drop-offs.",
    },
    {
      q: "How do Autonomous Inter-Store Transfers work across our dark store network?",
      a: "When a micro-fulfillment facility approaches critical ROP, the Multi-Echelon Transfer Engine scans neighboring network nodes with stock surplus (Stock > ROP + 14d). It calculates green EV van transit hours and automatically generates rebalancing transfer tickets in under 4 hours, bypassing 3-day vendor lead times.",
    },
    {
      q: "What role-based access control (RBAC) and compliance capabilities are supported?",
      a: "InventoryGuard AI provides strict RBAC separation across VP Supply Chain, Dark Store Managers, and Procurement Specialists. Every dispatched PO, transfer authorization, and algorithm switch is recorded in a cryptographic SHA-256 audit ledger ready for SOC2 Type II compliance reviews.",
    },
    {
      q: "Does InventoryGuard AI work in offline or isolated cloud environments?",
      a: "Yes. The entire predictive forecasting engine, Monte Carlo stochastic simulator, and multi-echelon optimization algorithms run deterministically in-browser and can be deployed fully air-gapped on private VPC infrastructure.",
    },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
        isDark ? "dark bg-[#09090B] text-neutral-100" : "bg-[#F8FAFC] text-slate-900"
      }`}
    >
      {/* 1. TOP ENTERPRISE COMPACT STICKY NAVIGATION */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-150 ${
          isDark
            ? "border-neutral-800 bg-[#09090B]/90 text-neutral-100"
            : "border-slate-200/80 bg-white/90 text-slate-900 shadow-xs"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-4 min-w-0">
            {/* Left: Logo and wordmark without overlapping */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs font-bold shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-950 dark:text-white truncate">
                    InventoryGuard<span className="text-emerald-600 dark:text-emerald-400 font-black">-AI</span>
                  </span>
                  <span className="hidden xl:inline-flex px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    Enterprise
                  </span>
                </div>
                <div className={`text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase truncate mt-0.5 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                  Supply Chain Intelligence
                </div>
              </div>
            </div>

            {/* Center: Essential Public Navigation Links (Desktop only: lg+) */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-semibold shrink-0" aria-label="Public website links">
              <a
                href="#capabilities"
                className={`transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  isDark ? "text-neutral-300" : "text-slate-600"
                }`}
              >
                Capabilities
              </a>
              <a
                href="#architecture"
                className={`transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  isDark ? "text-neutral-300" : "text-slate-600"
                }`}
              >
                Architecture
              </a>
              <a
                href="#security"
                className={`transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  isDark ? "text-neutral-300" : "text-slate-600"
                }`}
              >
                Security
              </a>
              <a
                href="#faq"
                className={`transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  isDark ? "text-neutral-300" : "text-slate-600"
                }`}
              >
                FAQ
              </a>
            </nav>

            {/* Right: Actions (Theme, Sign In / Get Started or Dashboard, Mobile Hamburger) */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Currency Selector (compact dropdown on sm+) */}
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    isDark
                      ? "bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                      : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-xs"
                  }`}
                  title="Select Base Currency"
                >
                  <span>{CURRENCIES[currency]?.flag}</span>
                  <span className="font-mono text-[11px]">{currency}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isCurrencyOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-44 rounded-xl border shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                      isDark
                        ? "bg-neutral-900 border-neutral-800 text-neutral-200"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    {(Object.keys(CURRENCIES) as CurrencyCode[]).map((cCode) => {
                      const c = CURRENCIES[cCode];
                      return (
                        <button
                          key={cCode}
                          type="button"
                          onClick={() => {
                            onSelectCurrency(cCode);
                            setIsCurrencyOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            currency === cCode
                              ? isDark
                                ? "bg-neutral-800 text-white font-semibold"
                                : "bg-emerald-50 text-emerald-900 font-semibold"
                              : isDark
                              ? "hover:bg-neutral-800/60 text-neutral-300"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                          </div>
                          {currency === cCode && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Theme Switcher */}
              <button
                type="button"
                onClick={onToggleTheme}
                className={`p-1.5 sm:p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? "bg-neutral-900 hover:bg-neutral-800 text-amber-400 border-neutral-700"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs"
                }`}
                title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Ask Gemini Copilot */}
              {onOpenCopilot && (
                <button
                  type="button"
                  onClick={onOpenCopilot}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                    isDark
                      ? "bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/30 text-emerald-400"
                      : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800 shadow-2xs"
                  }`}
                  title="Ask Gemini Copilot: Clarify doubts or get supply-chain guidance"
                  aria-label="Ask Gemini Copilot"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Ask AI</span>
                </button>
              )}

              {/* If Authenticated: Direct Return to Workspace */}
              {isAuthenticated && currentUser ? (
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                      isDark
                        ? "bg-neutral-900 border-neutral-800 text-neutral-200"
                        : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    <span>{currentUser.avatar}</span>
                    <span className="max-w-[85px] truncate">{currentUser.name.split(" ")[0]}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEnterApp("overview")}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer group shrink-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    <span>Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              ) : (
                /* Unauthenticated Public Actions: Sign In & Get Started */
                <div className="flex items-center gap-2 shrink-0">
                  {onNavigateToSignIn && (
                    <button
                      type="button"
                      onClick={onNavigateToSignIn}
                      className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                        isDark
                          ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs"
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Sign In</span>
                    </button>
                  )}

                  {onNavigateToSignUp && (
                    <button
                      type="button"
                      onClick={onNavigateToSignUp}
                      className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Get Started</span>
                    </button>
                  )}
                </div>
              )}

              {/* Mobile Drawer Hamburger Trigger (lg:hidden) */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-300"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs"
                }`}
                title={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown / Slide Menu (when open on < lg screens) */}
        {isMobileMenuOpen && (
          <div
            className={`lg:hidden border-t px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-150 ${
              isDark ? "bg-[#09090B] border-neutral-800 text-neutral-100" : "bg-white border-slate-200 text-slate-900 shadow-lg"
            }`}
          >
            {/* Nav links */}
            <nav className="flex flex-col space-y-2 text-sm font-semibold">
              <a
                href="#capabilities"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-1.5 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  isDark ? "text-neutral-300" : "text-slate-700"
                }`}
              >
                Capabilities
              </a>
              <a
                href="#architecture"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-1.5 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  isDark ? "text-neutral-300" : "text-slate-700"
                }`}
              >
                Architecture
              </a>
              <a
                href="#security"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-1.5 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  isDark ? "text-neutral-300" : "text-slate-700"
                }`}
              >
                Security &amp; RBAC
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-1.5 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  isDark ? "text-neutral-300" : "text-slate-700"
                }`}
              >
                FAQ
              </a>
              <a
                href="#roi-calculator"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-1.5 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  isDark ? "text-neutral-300" : "text-slate-700"
                }`}
              >
                ROI Calculator
              </a>
              <a
                href="#live-preview"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-1.5 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  isDark ? "text-neutral-300" : "text-slate-700"
                }`}
              >
                Live SKU Preview
              </a>
            </nav>

            {/* Currency selector on mobile */}
            <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">Currency</span>
              <div className="flex items-center gap-1">
                {(["USD", "INR", "EUR", "GBP"] as CurrencyCode[]).map((cCode) => (
                  <button
                    key={cCode}
                    type="button"
                    onClick={() => onSelectCurrency(cCode)}
                    className={`px-2 py-1 text-xs rounded-md font-mono ${
                      currency === cCode
                        ? "bg-emerald-600 text-white font-bold"
                        : isDark
                        ? "bg-neutral-800 text-neutral-300"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {cCode}
                  </button>
                ))}
              </div>
            </div>

            {/* Auth actions in mobile menu */}
            <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex flex-col gap-2">
              {isAuthenticated && currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onEnterApp("overview");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs"
                  >
                    <span>Enter Control Tower Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full text-center py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Sign Out ({currentUser.name})
                    </button>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {onNavigateToSignIn && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateToSignIn();
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold ${
                        isDark ? "border-neutral-700 text-neutral-200" : "border-slate-200 text-slate-700"
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Sign In</span>
                    </button>
                  )}
                  {onNavigateToSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateToSignUp();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Get Started</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-200/80 dark:border-neutral-800">
        {/* Subtle Background Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-5xl h-72 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Production-Grade Supply Chain Intelligence • Quick-Commerce & Omnichannel Ready</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
              Autonomous Inventory Intelligence &amp; Stock-Out Elimination for Modern Retail
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed">
              Predict demand volatility, eliminate stock-outs before they happen, and automate multi-echelon replenishment
              across quick-commerce dark stores and omnichannel retail networks using bivariate stochastic Monte Carlo models.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                onClick={() => onEnterApp("overview")}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md hover:shadow-lg transition-all cursor-pointer group"
              >
                <Zap className="w-4 h-4 text-emerald-200" />
                <span>Launch Live Control Tower</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <a
                href="#roi-calculator"
                className={`flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? "bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700"
                    : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs"
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Calculate ROI &amp; Stock-Out Savings</span>
              </a>

              <a
                href="#architecture"
                className={`flex items-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors ${
                  isDark ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>View System Architecture</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Trust Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 max-w-4xl mx-auto text-left">
              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
                }`}
              >
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white font-mono">
                  99.2%
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-neutral-400 mt-1">
                  Target Service Level
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  Z = 2.326 Mission Critical
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
                }`}
              >
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white font-mono">
                  &lt;4 hrs
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-neutral-400 mt-1">
                  Dark Store Rebalancing
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  Green EV Intra-City Vans
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
                }`}
              >
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white font-mono">
                  38.4%
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-neutral-400 mt-1">
                  Stock-Out Reduction
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  Dual-Variance Stochastic Buffer
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
                }`}
              >
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white font-mono">
                  100%
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-neutral-400 mt-1">
                  Tamper-Evident Trail
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  Cryptographic SHA-256 Ledger
                </div>
              </div>
            </div>
          </div>

          {/* 3. HERO INTERACTIVE SHOWCASE CARD: LIVE SIMULATION LAB PREVIEW */}
          <div id="live-preview" className="mt-12 max-w-5xl mx-auto scroll-mt-20">
            <div
              className={`rounded-2xl border shadow-xl overflow-hidden ${
                isDark ? "bg-neutral-900/90 border-neutral-800" : "bg-white border-slate-200 shadow-slate-200/50"
              }`}
            >
              {/* Window Header */}
              <div
                className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
                  isDark ? "bg-neutral-950/70 border-neutral-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  </div>
                  <div className="h-4 w-px bg-slate-300 dark:bg-neutral-700 mx-1" />
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-slate-900 dark:text-white">Active Node: WH-BOM-01</span>
                    <span className="text-slate-500 dark:text-neutral-400">(Bandra Quick Dark Store)</span>
                  </div>
                </div>

                {/* Scenario Shock Selector Buttons */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`text-[11px] font-semibold hidden sm:inline mr-1 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                    Test Shock:
                  </span>
                  {[
                    { id: "NORMAL", label: "Normal Operations", color: "hover:border-emerald-500" },
                    { id: "MONSOON", label: "🌧️ Monsoon (+40%)", color: "hover:border-amber-500" },
                    { id: "FLASH_SALE", label: "🔥 Flash Sale (+65%)", color: "hover:border-purple-500" },
                    { id: "LOGISTICS_STRIKE", label: "🚢 Freight Delay (+4d)", color: "hover:border-rose-500" },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => setHeroScenario(sc.id as any)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                        heroScenario === sc.id
                          ? isDark
                            ? "bg-neutral-800 border-emerald-500 text-white shadow-xs"
                            : "bg-white border-emerald-600 text-emerald-950 shadow-xs"
                          : isDark
                          ? "border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/50"
                          : "border-slate-200 text-slate-600 hover:text-slate-900 bg-slate-100"
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Window Body: Live Telemetry & Stochastic Indicators */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* 4 Telemetry Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-neutral-950/50 border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                        Cycle Service Level
                      </span>
                      <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold font-mono mt-1 text-slate-900 dark:text-white">
                      {heroMetrics.serviceLevel}%
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                      Target 99.0% (Z=2.326)
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-neutral-950/50 border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                        Stock-Out Risk
                      </span>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold font-mono mt-1 text-amber-600 dark:text-amber-400">
                      {heroMetrics.stockoutProb}%
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                      Joint DDLT Monte Carlo
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-neutral-950/50 border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                        Dynamic Buffer
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold font-mono mt-1 text-slate-900 dark:text-white">
                      {heroMetrics.safetyStockUnits.toLocaleString()} units
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                      ROP Shift: {heroMetrics.ropAdjustment}
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-neutral-950/50 border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                        EV Rebalance ETA
                      </span>
                      <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold font-mono mt-1 text-slate-900 dark:text-white">
                      {heroMetrics.interStoreTransit.split(" ")[0]}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                      {heroMetrics.interStoreTransit.split("(")[1]?.replace(")", "") || "Green Fleet Route"}
                    </div>
                  </div>
                </div>

                {/* SKU Status Telemetry Mini-Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-neutral-300">
                    <span className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Live SKU Fulfillment Queue &amp; Autonomous Actions
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      ● Engine Status: {heroMetrics.statusLabel}
                    </span>
                  </div>

                  <div className={`rounded-xl border overflow-x-auto ${isDark ? "border-neutral-800" : "border-slate-200"}`}>
                    <table className="w-full text-xs text-left">
                      <thead className={`border-b ${isDark ? "bg-neutral-950/80 border-neutral-800 text-neutral-400" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">SKU Code &amp; Item</th>
                          <th className="py-2.5 px-3 font-semibold">Usable Stock</th>
                          <th className="py-2.5 px-3 font-semibold">Dynamic ROP</th>
                          <th className="py-2.5 px-3 font-semibold">Perishable State</th>
                          <th className="py-2.5 px-3 font-semibold">Autonomous Recommendation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                        <tr>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">Organic Whole Milk 1L</div>
                            <div className="text-[10px] font-mono text-slate-500">SKU-001 · Dairy</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                            120 units
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-neutral-300">
                            310 units
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                              4d Shelf-Life Left
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              ⚡ Rebalance: +140 from Andheri West (EV Van)
                            </span>
                          </td>
                        </tr>

                        <tr>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">Hass Avocados (2-Pack)</div>
                            <div className="text-[10px] font-mono text-slate-500">SKU-002 · Fresh Produce</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                            85 units
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-neutral-300">
                            145 units
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              Decay δ = 0.14
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-700 dark:text-neutral-300">
                              Trigger Flash -20% Markdown Liquidation
                            </span>
                          </td>
                        </tr>

                        <tr>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">Sourdough Bread Artisan</div>
                            <div className="text-[10px] font-mono text-slate-500">SKU-003 · Bakery</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            240 units
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-neutral-300">
                            190 units
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              Fresh Batch
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              ✓ Optimal Buffer Maintained
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer Callout inside Preview */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDark ? "bg-neutral-950 border-neutral-800" : "bg-emerald-50/70 border-emerald-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        Live Engine Connected:
                      </span>{" "}
                      <span className="text-slate-600 dark:text-neutral-300">
                        Full stochastic Monte Carlo distribution, dual-variance buffers, and automated EDI 850 dispatches ready.
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onEnterApp("overview")}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>Open Live Control Tower</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CLIENT ECOSYSTEM & SEGMENTS BAR */}
      <section
        className={`py-10 border-b ${
          isDark ? "bg-neutral-950/40 border-neutral-800" : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-6">
            Trusted by mission-critical supply chains, rapid-delivery operators &amp; omnichannel retailers
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
            {[
              { name: "QuickRetail Express", sub: "12-Min Dark Stores", icon: Zap },
              { name: "UrbanGrocer Network", sub: "35 Regional Hubs", icon: Building2 },
              { name: "MetroFulfillment", sub: "Omnichannel Logistics", icon: Globe2 },
              { name: "ColdChain Logistics", sub: "Perishable Dairy & Produce", icon: Package },
              { name: "Apex FMCG", sub: "National Distribution", icon: Truck },
            ].map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="flex flex-col items-center justify-center space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-extrabold text-sm text-slate-800 dark:text-neutral-200">
                      {p.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-neutral-500">
                    {p.sub}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. THE PROBLEM & SOLUTION: LEGACY ERPS VS INVENTORYGUARD */}
      <section id="capabilities" className="py-16 md:py-24 border-b border-slate-200/80 dark:border-neutral-800 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <Scale className="w-3.5 h-3.5" />
              <span>The Quick-Commerce Inventory Dilemma</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Why Traditional ERPs &amp; Static Heuristics Fail High-Velocity Retail
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400">
              Static min-max reorder points were designed 30 years ago for slow-moving monthly batches.
              Today’s omnichannel supply chains face multi-dimensional shocks every single day.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* Legacy Approach Card */}
            <div
              className={`p-6 sm:p-8 rounded-2xl border ${
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-neutral-800 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-lg font-bold">Traditional ERPs &amp; Static Spreadsheets</h3>
              </div>
              <ul className="mt-5 space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-neutral-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Static Safety Stock:</strong> Ignores supplier lead-time delay variance (σ_L), causing stock-outs whenever vendors are late.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Blind to Perishable Decay:</strong> Counts expired or decaying milk and yogurt as usable stock until customer returns occur.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Siloed Store Deadlocks:</strong> One store stocks out while a store 5 km away holds 30 days of surplus, with zero transfer automation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Manual PO Dispatch:</strong> Hours lost re-entering purchase orders into SAP/Oracle via manual CSV uploads.</span>
                </li>
              </ul>
            </div>

            {/* InventoryGuard AI Card */}
            <div
              className={`p-6 sm:p-8 rounded-2xl border ${
                isDark
                  ? "bg-emerald-950/20 border-emerald-800/40"
                  : "bg-emerald-50/40 border-emerald-200 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5 pb-4 border-b border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <h3 className="text-lg font-bold">InventoryGuard AI Autonomous Control Tower</h3>
              </div>
              <ul className="mt-5 space-y-3.5 text-xs sm:text-sm text-slate-700 dark:text-neutral-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <span><strong>Dual-Variance Stochastic ROP:</strong> Mathematically couples demand swings and vendor lead-time jitter for guaranteed service levels.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <span><strong>Real-Time Perishable Decay Engine:</strong> Evaluates ROP against usable fresh stock and automatically triggers flash markdown liquidations.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <span><strong>Multi-Echelon Dark Store Transfers:</strong> Rebalances stock in &lt;4 hours via intra-city green EV routes before customers notice.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <span><strong>Automated ERP Webhook &amp; EDI 850:</strong> Zero-touch purchase order dispatch with HMAC-SHA256 signatures and ANSI X12 payloads.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SIX CORE FUNCTIONAL CAPABILITIES (BENTO GRID) */}
      <section className="py-16 md:py-24 border-b border-slate-200/80 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <Cpu className="w-3.5 h-3.5" />
              <span>Architected for Enterprise Scale</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Six Specialized Supply-Chain Engines Built for Zero Stock-Outs
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400">
              Every engine is built on verifiable mathematical principles and production-grade algorithms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Dual-Variance Dynamic Safety Stock */}
            <div
              className={`p-6 rounded-2xl border flex flex-col justify-between ${
                isDark ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700" : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
              } transition-colors`}
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  1. Dual-Variance Dynamic Safety Stock
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Decouples demand volatility from supplier dispatch delays. Computes joint safety buffers:
                </p>
                <div className={`p-2.5 rounded-lg border text-xs font-mono font-bold text-center ${isDark ? "bg-neutral-950 border-neutral-800 text-emerald-400" : "bg-slate-50 border-slate-200 text-emerald-800"}`}>
                  SS = Z × √(L̄·σ_d² + D̄²·σ_L²)
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>99.5% CSL Protection</span>
                <button onClick={() => onEnterApp("overview")} className="hover:underline flex items-center gap-1 cursor-pointer">
                  Test In App <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Multi-Horizon AI Demand Forecasting */}
            <div
              className={`p-6 rounded-2xl border flex flex-col justify-between ${
                isDark ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700" : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
              } transition-colors`}
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  2. Multi-Horizon AI Forecasting
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Blends Gradient Boosting Regressors, Meta Prophet additive models, and seasonal moving averages with 95% confidence intervals and weather shock multipliers.
                </p>
                <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                  Daily Demand Horizon: 7 to 30 Days Ahead
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span>LightGBM &amp; Prophet</span>
                <button onClick={() => onEnterApp("inventory")} className="hover:underline flex items-center gap-1 cursor-pointer">
                  View Forecasts <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Perishable Batch Decay Engine */}
            <div
              className={`p-6 rounded-2xl border flex flex-col justify-between ${
                isDark ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700" : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
              } transition-colors`}
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  3. Perishable Shelf-Life Decay Engine
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Evaluates batch shelf life for milk, yogurt, and produce. Triggers automated flash markdown discounts (-20% to -40%) before expiration occurs.
                </p>
                <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                  Zero Food Waste &amp; Max Margin Recovery
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>Dynamic Markdown</span>
                <button onClick={() => onEnterApp("inventory")} className="hover:underline flex items-center gap-1 cursor-pointer">
                  Inspect Batches <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. Multi-Echelon Dark Store Inter-Transfers */}
            <div
              className={`p-6 rounded-2xl border flex flex-col justify-between ${
                isDark ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700" : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
              } transition-colors`}
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  4. Inter-Store Balancing Routing
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Identifies network nodes with surplus stock (Stock &gt; ROP + 14d) and dispatches sub-4hr EV van transfers to nodes in critical deficit.
                </p>
                <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                  Avoids 3-Day Vendor Lead-Times
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Green EV Intra-City Routing</span>
                <button onClick={() => onEnterApp("procurement", "transfer")} className="hover:underline flex items-center gap-1 cursor-pointer">
                  View Routes <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 5. Supplier Reliability Matrix & SLA Debit Notes */}
            <div
              className={`p-6 rounded-2xl border flex flex-col justify-between ${
                isDark ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700" : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
              } transition-colors`}
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  5. Supplier Reliability Matrix
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Grades vendors (A through F) on fill rate and delivery variance (σ_L). Automatically expands safety stock buffers for unreliable vendors and issues SLA debit notes.
                </p>
                <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                  Autonomous Chargeback Notes
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
                <span>Grade A to F Scoring</span>
                <button onClick={() => onEnterApp("procurement", "suppliers")} className="hover:underline flex items-center gap-1 cursor-pointer">
                  Inspect Vendors <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 6. ERP Webhook & EDI 850 Dispatch */}
            <div
              className={`p-6 rounded-2xl border flex flex-col justify-between ${
                isDark ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700" : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
              } transition-colors`}
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  6. ERP Webhook &amp; EDI 850 Dispatch
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Generates ANSI X12 EDI 850 strings and JSON webhook payloads signed with HMAC-SHA256 headers for instantaneous dispatch to SAP S/4HANA or NetSuite.
                </p>
                <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                  Zero-Touch Autonomous Procurement
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-teal-600 dark:text-teal-400">
                <span>ANSI X12 &amp; HMAC-SHA256</span>
                <button onClick={() => onEnterApp("procurement", "po")} className="hover:underline flex items-center gap-1 cursor-pointer">
                  View Ledger <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INTERACTIVE ROI & STOCK-OUT LOSS CALCULATOR */}
      <section id="roi-calculator" className="py-16 md:py-24 border-b border-slate-200/80 dark:border-neutral-800 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Interactive Financial Model</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Calculate Your Supply-Chain Stock-Out Loss &amp; Projected ROI
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400">
              Configure your network parameters below to see estimated annual gross profit recovery and working capital optimization.
            </p>
          </div>

          <div
            className={`max-w-5xl mx-auto rounded-2xl border shadow-lg overflow-hidden p-6 sm:p-8 lg:p-10 ${
              isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Sliders Form (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                      Annual Inventory GMV ({currency})
                    </label>
                    <span className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(calcGmv, currency, { compact: true })}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1000000}
                    max={100000000}
                    step={500000}
                    value={calcGmv}
                    onChange={(e) => setCalcGmv(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{formatCurrency(1000000, currency, { compact: true })}</span>
                    <span>{formatCurrency(50000000, currency, { compact: true })}</span>
                    <span>{formatCurrency(100000000, currency, { compact: true })}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                      Estimated Stock-Out Rate
                    </label>
                    <span className="text-sm font-mono font-extrabold text-amber-600 dark:text-amber-400">
                      {calcStockoutRate.toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={20.0}
                    step={0.5}
                    value={calcStockoutRate}
                    onChange={(e) => setCalcStockoutRate(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>2.0% (Best in Class)</span>
                    <span>8.0% (Average)</span>
                    <span>20.0% (High Risk)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                        Gross Margin
                      </label>
                      <span className="text-sm font-mono font-extrabold text-slate-900 dark:text-white">
                        {calcMargin}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      step={1}
                      value={calcMargin}
                      onChange={(e) => setCalcMargin(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                        Active Dark Stores
                      </label>
                      <span className="text-sm font-mono font-extrabold text-slate-900 dark:text-white">
                        {calcNodes} nodes
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      step={1}
                      value={calcNodes}
                      onChange={(e) => setCalcNodes(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${isDark ? "bg-neutral-950/60 border-neutral-800 text-neutral-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  <p>
                    <strong>Calculation Methodology:</strong> Modeled on quick-commerce benchmark recovery rates.
                    InventoryGuard AI recovers an average of 65% of lost stock-out demand through bivariate stochastic safety buffers and sub-day dark store rebalancing.
                  </p>
                </div>
              </div>

              {/* Calculated Results Summary (5 Cols) */}
              <div
                className={`lg:col-span-5 p-6 rounded-xl border flex flex-col justify-between ${
                  isDark ? "bg-emerald-950/20 border-emerald-800/40" : "bg-emerald-50/60 border-emerald-200"
                }`}
              >
                <div className="space-y-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    Projected Financial Impact
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-neutral-400">
                      Annual Gross Profit Recovery
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(roiCalculations.recoveredProfit, currency)}
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Direct addition to bottom-line EBITDA
                    </div>
                  </div>

                  <div className="pt-4 border-t border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-neutral-400">Current Stock-Out Revenue Lost:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(roiCalculations.annualLostSales, currency, { compact: true })}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-neutral-400">Freed Working Capital:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-neutral-200">
                        {formatCurrency(roiCalculations.freedWorkingCapital, currency, { compact: true })}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-neutral-400">Projected Service Level:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {(100 - calcStockoutRate * 0.35).toFixed(1)}% (+{(calcStockoutRate * 0.65).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <button
                    onClick={() => onEnterApp("operations", "simulation")}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
                  >
                    <span>Simulate This in Control Tower</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-center text-[10px] text-slate-500 dark:text-neutral-400">
                    Zero credit card required · Instant sandbox access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE 4-STEP SYSTEM ARCHITECTURE */}
      <section id="architecture" className="py-16 md:py-24 border-b border-slate-200/80 dark:border-neutral-800 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <Layers className="w-3.5 h-3.5" />
              <span>Full-Stack Supply Chain Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Enterprise Data Ingestion &amp; Stochastic Execution Pipeline
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400">
              From raw WMS transactional streams to autonomous purchase order execution and immutable audit trails.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div
              className={`p-5 rounded-2xl border ${
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
              } space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                  01
                </span>
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ingestion &amp; Schema Mapping
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                CSV upload with column auto-detection, REST webhook endpoints, or native SAP/NetSuite batch sync.
              </p>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                &lt;0.5s Parsing Latency
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`p-5 rounded-2xl border ${
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
              } space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                  02
                </span>
                <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Stochastic Modeling
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                10,000-run Monte Carlo joint demand-lead time simulation, LightGBM multi-step regressor, and batch decay tracking.
              </p>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Joint DDLT Distributions
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`p-5 rounded-2xl border ${
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
              } space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                  03
                </span>
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Multi-Echelon Balancing
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Dark store surplus scanner computes transfer viability, intra-city transit hours, and carbon-optimized EV routes.
              </p>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Sub-4hr Rebalancing
              </div>
            </div>

            {/* Step 4 */}
            <div
              className={`p-5 rounded-2xl border ${
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
              } space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                  04
                </span>
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Autonomous Execution
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Dispatches ANSI X12 EDI 850 POs and HMAC-signed JSON webhooks; logs every event with cryptographic SHA-256 hash.
              </p>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                SOC2 Type II Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. ENTERPRISE SECURITY, RBAC & COMPLIANCE */}
      <section id="security" className="py-16 md:py-24 border-b border-slate-200/80 dark:border-neutral-800 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-Trust Enterprise Compliance</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Enterprise Governance, Cryptographic Ledger &amp; Role-Based Access
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400">
              Complete separation of duties and verifiable audit trails for enterprise regulatory compliance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* RBAC Card */}
            <div
              className={`p-6 rounded-2xl border ${
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
              } space-y-4`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-Tenant Role-Based Access
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Granular permission gates for VP Supply Chain, Dark Store Managers, and Procurement Officers. Restricts PO authorization and algorithm switching.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-neutral-400 pt-2 border-t border-slate-100 dark:border-neutral-800">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>3 Pre-configured Enterprise Personas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Instant Role &amp; Tenant Switching</span>
                </li>
              </ul>
            </div>

            {/* SHA-256 Ledger Card */}
            <div
              className={`p-6 rounded-2xl border ${
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
              } space-y-4`}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cryptographic SHA-256 Ledger
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Every purchase order dispatch, transfer approval, flash markdown, and policy adjustment generates an immutable SHA-256 verification hash.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-neutral-400 pt-2 border-t border-slate-100 dark:border-neutral-800">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Tamper-evident hash chain</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>One-click CSV &amp; PDF Dossier Export</span>
                </li>
              </ul>
            </div>

            {/* ERP Webhook Security */}
            <div
              className={`p-6 rounded-2xl border ${
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
              } space-y-4`}
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                HMAC-Signed Webhooks &amp; EDI
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Direct ERP gateway integration with HMAC-SHA256 authorization headers, ISO timestamp validation, and automatic retries with exponential backoff.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-neutral-400 pt-2 border-t border-slate-100 dark:border-neutral-800">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>ANSI X12 850 Purchase Order format</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Compatible with SAP, Oracle, NetSuite</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 10. TECHNICAL FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-16 md:py-24 border-b border-slate-200/80 dark:border-neutral-800 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Technical Clarity</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400">
              Everything you need to know about integrating and operating InventoryGuard AI.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-xl border transition-colors overflow-hidden ${
                    isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed border-t border-slate-100 dark:border-neutral-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. FINAL ENTERPRISE CTA SECTION */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Eliminate Stock-Outs Across Your Fulfillment Network</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Ready to Transition to Autonomous Predictive Replenishment?
          </h2>

          <p className="text-base text-slate-600 dark:text-neutral-300 max-w-2xl mx-auto">
            Experience the live multi-echelon simulator, test demand shock scenarios, and evaluate real-time PO generation immediately in your browser.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onEnterApp("overview")}
              className="flex items-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer group"
            >
              <Zap className="w-4 h-4 text-emerald-200" />
              <span>Launch Live Control Tower Now</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => onEnterApp("operations", "datahub")}
              className={`flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700"
                  : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ingest Custom WMS Dataset</span>
            </button>
          </div>
        </div>
      </section>

      {/* 12. ENTERPRISE FOOTER */}
      <footer
        className={`border-t py-12 transition-colors ${
          isDark ? "bg-neutral-950 border-neutral-800 text-neutral-400" : "bg-white border-slate-200 text-slate-600"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-slate-100 dark:border-neutral-800">
            {/* Col 1: Brand */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  InventoryGuard<span className="text-emerald-600 dark:text-emerald-400 font-black">-AI</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm leading-relaxed">
                Autonomous supply-chain intelligence and stock-out elimination engine. Designed for quick-commerce dark stores, omnichannel retail, and FMCG cold-chain networks.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Engine Systems Operational (v2.4 Enterprise)</span>
              </div>
            </div>

            {/* Col 2: Core Platform */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold uppercase tracking-wider text-slate-900 dark:text-white text-[11px]">
                Control Tower
              </div>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => onEnterApp("overview")} className="hover:text-emerald-600 cursor-pointer">
                    Supply Chain Overview
                  </button>
                </li>
                <li>
                  <button onClick={() => onEnterApp("inventory")} className="hover:text-emerald-600 cursor-pointer">
                    Demand Forecasting
                  </button>
                </li>
                <li>
                  <button onClick={() => onEnterApp("procurement", "po")} className="hover:text-emerald-600 cursor-pointer">
                    Purchase Order Generator
                  </button>
                </li>
                <li>
                  <button onClick={() => onEnterApp("procurement", "transfer")} className="hover:text-emerald-600 cursor-pointer">
                    Inter-Store Transfers
                  </button>
                </li>
                <li>
                  <button onClick={() => onEnterApp("procurement", "suppliers")} className="hover:text-emerald-600 cursor-pointer">
                    Supplier Scorecards
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Data & Simulation */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold uppercase tracking-wider text-slate-900 dark:text-white text-[11px]">
                Operations &amp; Lab
              </div>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => onEnterApp("operations", "simulation")} className="hover:text-emerald-600 cursor-pointer">
                    Simulation Lab
                  </button>
                </li>
                <li>
                  <button onClick={() => onEnterApp("operations", "datahub")} className="hover:text-emerald-600 cursor-pointer">
                    WMS Data Hub
                  </button>
                </li>
                <li>
                  <button onClick={() => onEnterApp("operations", "code")} className="hover:text-emerald-600 cursor-pointer">
                    Python Engine Source
                  </button>
                </li>
                <li>
                  <a href="#roi-calculator" className="hover:text-emerald-600">
                    Financial ROI Model
                  </a>
                </li>
                <li>
                  <a href="#architecture" className="hover:text-emerald-600">
                    System Architecture
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Compliance & Specs */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold uppercase tracking-wider text-slate-900 dark:text-white text-[11px]">
                Enterprise
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>SOC2 Type II Ready</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>ANSI X12 EDI 850</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>HMAC-SHA256 Webhooks</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Air-Gapped VPC Deploy</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-neutral-500">
            <div>
              &copy; {new Date().getFullYear()} InventoryGuard AI Enterprise. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Bivariate Monte Carlo Engine</span>
              <span>·</span>
              <span>LightGBM Dual-Variance</span>
              <span>·</span>
              <button
                onClick={onToggleTheme}
                className="hover:text-emerald-600 cursor-pointer flex items-center gap-1"
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{isDark ? "Light Theme" : "Dark Theme"}</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
