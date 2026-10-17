import React, { useState, useMemo } from "react";
import {
  HelpCircle,
  X,
  Search,
  BookOpen,
  Sparkles,
  Calculator,
  Compass,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingUp,
  Truck,
  Layers,
  SlidersHorizontal,
  UploadCloud,
  ShieldCheck,
  Zap,
  RotateCcw,
  ExternalLink,
  BrainCircuit,
  Package,
} from "lucide-react";
import { AppPage } from "./Header";

interface HelpAndDoubtsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "dark" | "light";
  onNavigatePage: (page: AppPage, tab?: string, skuId?: string) => void;
  onOpenCopilot: () => void;
  onOpenWmsIngestion: () => void;
}

interface FaqItem {
  id: string;
  category: "basics" | "formulas" | "procurement" | "simulation" | "data";
  question: string;
  shortAnswer: string;
  detailedAnswer: string;
  relatedAction?: {
    label: string;
    action: () => void;
  };
}

export const HelpAndDoubtsModal: React.FC<HelpAndDoubtsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onNavigatePage,
  onOpenCopilot,
  onOpenWmsIngestion,
}) => {
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<"faq" | "tour" | "calculator" | "glossary">("faq");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq-1");

  // Interactive Safety Stock Calculator State
  const [calcDemandMean, setCalcDemandMean] = useState<number>(45);
  const [calcDemandStd, setCalcDemandStd] = useState<number>(12);
  const [calcLeadTimeMean, setCalcLeadTimeMean] = useState<number>(3);
  const [calcLeadTimeStd, setCalcLeadTimeStd] = useState<number>(1.2);
  const [calcServiceLevel, setCalcServiceLevel] = useState<number>(2.326); // 99%

  // Compute Dual-Variance Dynamic Safety Stock
  const calcResults = useMemo(() => {
    const demandVarianceTerm = calcLeadTimeMean * Math.pow(calcDemandStd, 2);
    const leadTimeVarianceTerm = Math.pow(calcDemandMean, 2) * Math.pow(calcLeadTimeStd, 2);
    const totalVariance = demandVarianceTerm + leadTimeVarianceTerm;
    const combinedStd = Math.sqrt(totalVariance);
    const safetyStock = Math.ceil(calcServiceLevel * combinedStd);
    const expectedLeadTimeDemand = Math.round(calcDemandMean * calcLeadTimeMean);
    const reorderPoint = expectedLeadTimeDemand + safetyStock;

    return {
      demandVarianceTerm: Math.round(demandVarianceTerm),
      leadTimeVarianceTerm: Math.round(leadTimeVarianceTerm),
      combinedStd: combinedStd.toFixed(1),
      safetyStock,
      expectedLeadTimeDemand,
      reorderPoint,
      demandVarShare: totalVariance > 0 ? Math.round((demandVarianceTerm / totalVariance) * 100) : 50,
      leadTimeVarShare: totalVariance > 0 ? Math.round((leadTimeVarianceTerm / totalVariance) * 100) : 50,
    };
  }, [calcDemandMean, calcDemandStd, calcLeadTimeMean, calcLeadTimeStd, calcServiceLevel]);

  const faqs: FaqItem[] = [
    {
      id: "faq-1",
      category: "basics",
      question: "What is InventoryGuard AI and how does it prevent stock-outs?",
      shortAnswer: "An AI-powered multi-echelon supply chain intelligence platform designed for quick-commerce and omnichannel fulfillment.",
      detailedAnswer:
        "InventoryGuard AI bridges high-velocity machine learning daily demand forecasting with dual-variance dynamic safety stock modeling. Unlike static spreadsheets that use fixed buffer numbers, this system continuously adapts to demand volatility, supplier delivery delays, and perishable batch degradation to guarantee 99%+ cycle service levels while cutting holding costs.",
      relatedAction: {
        label: "Go to Control Tower Overview",
        action: () => {
          onNavigatePage("overview");
          onClose();
        },
      },
    },
    {
      id: "faq-2",
      category: "basics",
      question: "What are the 4 main workspaces and where should a new user begin?",
      shortAnswer: "1. Overview (Control Tower), 2. Inventory (Forecast & Risk), 3. Procurement (POs & Transfers), 4. Operations (Simulation Lab).",
      detailedAnswer:
        "• Overview: High-density executive KPIs, dark store corridor topology map, and cross-facility benchmark matrix.\n• Inventory: Machine learning daily demand forecasts, dual-variance safety stock cards, batch shelf-life decay tracker, and SKU risk table.\n• Procurement: Automated PO generation with EOQ sizing, Buy vs. Transfer decision matrix, and supplier reliability scorecards.\n• Operations: Monte Carlo joint stochastic risk engine, scenario crisis stress tests (Monsoon deluge, flash sale surge), and WMS/ERP CSV data ingestion.",
      relatedAction: {
        label: "Explore Inventory Workspace",
        action: () => {
          onNavigatePage("inventory");
          onClose();
        },
      },
    },
    {
      id: "faq-3",
      category: "formulas",
      question: "How does the Dual-Variance Dynamic Safety Stock formula work?",
      shortAnswer: "SS = Z × √(L · σ_d² + D² · σ_L²)",
      detailedAnswer:
        "Traditional models only protect against demand fluctuations (Z × σ_d × √L), ignoring vendor unreliability. The dual-variance formula captures two independent sources of variance:\n\n1. Demand Volatility: L · σ_d² (uncertainty in customer orders during transit).\n2. Supplier Lead-Time Volatility: D² · σ_L² (uncertainty in supplier delivery arrival).\n\nZ is the normal distribution factor for your Cycle Service Level (e.g. 1.645 for 95%, 2.326 for 99%). This ensures buffers expand automatically when vendors delay shipments.",
      relatedAction: {
        label: "Try Interactive Formula Calculator",
        action: () => setActiveTab("calculator"),
      },
    },
    {
      id: "faq-4",
      category: "formulas",
      question: "How is Reorder Point (ROP) computed and when does an alert trigger?",
      shortAnswer: "ROP = (Average Daily Demand × Lead Time) + Safety Stock",
      detailedAnswer:
        "Whenever your Usable Stock (Current Physical Stock − Expired/Decayed Units + In-Transit Orders) falls below the ROP, the SKU is flagged as Critical or Reorder Required. The system automatically sizes an economic batch to bring stock back to optimal target levels.",
      relatedAction: {
        label: "Inspect Risk Table in Inventory",
        action: () => {
          onNavigatePage("inventory");
          onClose();
        },
      },
    },
    {
      id: "faq-5",
      category: "procurement",
      question: "How does Buy vs. Transfer Optimization work?",
      shortAnswer: "Before placing an expensive, slow supplier PO, the platform checks neighboring dark stores for surplus stock.",
      detailedAnswer:
        "If a nearby fulfillment center has excess stock (Stock > ROP + 14 days of forward cover), the system recommends an inter-facility transfer via Green EV delivery routes (transit time 3–6 hours). This fulfills urgent shortages 80% faster than supplier lead times and avoids purchasing unnecessary inventory.",
      relatedAction: {
        label: "View Inter-Store Transfers in Procurement",
        action: () => {
          onNavigatePage("procurement", "transfer");
          onClose();
        },
      },
    },
    {
      id: "faq-6",
      category: "procurement",
      question: "How are Supplier Reliability Scorecards (Grades A to F) determined?",
      shortAnswer: "Evaluates vendors on OTIF % (On-Time In-Full), lead-time variance, and automatically issues SLA debit notes.",
      detailedAnswer:
        "Suppliers with Grade A (98%+ OTIF) receive standard order allocation. Suppliers with Grade D or F (chronic delays) trigger an automatic safety buffer multiplier (up to 1.8x) to protect downstream quick-commerce dark stores, and generate cryptographic debit notes for liquidated damages.",
      relatedAction: {
        label: "Check Supplier Scorecards",
        action: () => {
          onNavigatePage("procurement", "suppliers");
          onClose();
        },
      },
    },
    {
      id: "faq-7",
      category: "simulation",
      question: "What is the Monte Carlo Joint Stochastic Risk Simulation?",
      shortAnswer: "Runs 1,000 to 10,000 randomized joint permutations of daily demand shocks and supplier delivery delays.",
      detailedAnswer:
        "Instead of relying on single average numbers, Monte Carlo simulation samples thousands of future probabilistic paths. It calculates exact empirical stockout probability (%), value at risk, and expected revenue leakage, giving operators mathematical confidence before high-demand weekends or monsoon seasons.",
      relatedAction: {
        label: "Launch Simulation Lab",
        action: () => {
          onNavigatePage("operations", "simulation");
          onClose();
        },
      },
    },
    {
      id: "faq-8",
      category: "data",
      question: "How do I import my own company's WMS / ERP CSV dataset?",
      shortAnswer: "Use the 'Ingest WMS CSV' tool to upload warehouse, SKU, and historical sales transaction files.",
      detailedAnswer:
        "Click 'Ingest WMS / ERP CSV' from the top header or sidebar. The platform includes an intelligent column auto-mapper and validator that accepts your data, verifies required columns (Date, SKU, Units Sold, Stock On Hand), and immediately runs the entire predictive pipeline on your real inventory.",
      relatedAction: {
        label: "Open WMS CSV Data Ingestion",
        action: () => {
          onOpenWmsIngestion();
          onClose();
        },
      },
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.shortAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.detailedAnswer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doubts-modal-title"
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-150 ${
          isDark
            ? "bg-[#09090B] border-neutral-800 text-neutral-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
            isDark ? "border-neutral-800 bg-neutral-950/70" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="doubts-modal-title" className="text-base sm:text-lg font-extrabold tracking-tight">
                  New User Doubt Resolution &amp; Knowledge Guide
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Interactive Guide
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Clarify any doubt about algorithms, workflows, formulas, or how to navigate InventoryGuard AI.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close Doubt Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex items-center gap-1 px-4 sm:px-6 border-b shrink-0 overflow-x-auto no-scrollbar ${
            isDark ? "border-neutral-800 bg-neutral-900/40" : "border-slate-200 bg-slate-100/50"
          }`}
        >
          {[
            { id: "faq", label: "Frequently Clarified Doubts", icon: BookOpen },
            { id: "tour", label: "5-Step Quickstart Tour", icon: Compass },
            { id: "calculator", label: "Safety Stock Formula Sandbox", icon: Calculator },
            { id: "glossary", label: "Supply Chain Glossary", icon: BrainCircuit },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? "border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300"
                    : "border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: FAQ / DOUBTS */}
          {activeTab === "faq" && (
            <div className="space-y-4">
              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any doubt (e.g., safety stock, ROP, buy vs transfer, CSV upload)..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none transition-colors ${
                      isDark
                        ? "bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-emerald-500"
                        : "bg-white border-slate-300 text-slate-900 focus:border-emerald-500 shadow-2xs"
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
                  {[
                    { id: "all", label: "All Topics" },
                    { id: "basics", label: "Basics" },
                    { id: "formulas", label: "Formulas" },
                    { id: "procurement", label: "Procurement" },
                    { id: "simulation", label: "Simulation" },
                    { id: "data", label: "Data Ingestion" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                        selectedCategory === cat.id
                          ? "bg-emerald-600 text-white font-semibold shadow-2xs"
                          : isDark
                          ? "bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accordion List */}
              <div className="space-y-2.5">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                    <p className="text-sm font-semibold">No doubts match your search query.</p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Try asking our AI Copilot directly!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCopilot();
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ask AI Copilot</span>
                    </button>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isExpanded = expandedFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className={`rounded-xl border transition-all ${
                          isDark
                            ? "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700"
                            : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                          className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer gap-3"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                              ?
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {faq.question}
                              </h3>
                              <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                                {faq.shortAnswer}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div
                            className={`p-4 pt-1 border-t text-xs leading-relaxed space-y-3 ${
                              isDark
                                ? "border-neutral-800/80 text-neutral-300"
                                : "border-slate-100 text-slate-700"
                            }`}
                          >
                            <div className="whitespace-pre-line font-normal">{faq.detailedAnswer}</div>
                            {faq.relatedAction && (
                              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-neutral-800">
                                <span className="text-[11px] text-slate-400">Take action in platform:</span>
                                <button
                                  type="button"
                                  onClick={faq.relatedAction.action}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                                >
                                  <span>{faq.relatedAction.label}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GUIDED TOUR */}
          {activeTab === "tour" && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-emerald-50/50 border-emerald-100"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Interactive 5-Step Onboarding Tour</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                  Follow this sequence to master multi-echelon predictive supply chain operations in under 3 minutes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    step: 1,
                    title: "Select Fulfillment Facility",
                    desc: "Switch between dark store nodes (Mumbai Central, Bangalore South, Delhi NCR) using the top facility selector.",
                    badge: "Overview Hub",
                    action: () => {
                      onNavigatePage("overview");
                      onClose();
                    },
                    actionText: "Open Facility Map",
                  },
                  {
                    step: 2,
                    title: "Inspect Critical Stockouts",
                    desc: "View high-velocity SKUs (Organic Milk, Hass Avocados) that risk zero inventory before supplier replenishment.",
                    badge: "Inventory Workspace",
                    action: () => {
                      onNavigatePage("inventory");
                      onClose();
                    },
                    actionText: "View SKU Risk Table",
                  },
                  {
                    step: 3,
                    title: "Run Monte Carlo Stress Test",
                    desc: "Simulate a Monsoon Weather Deluge (+40% demand surge) or Supplier Delays to inspect value-at-risk.",
                    badge: "Operations Lab",
                    action: () => {
                      onNavigatePage("operations", "simulation");
                      onClose();
                    },
                    actionText: "Run Simulation Shock",
                  },
                  {
                    step: 4,
                    title: "Approve Inter-Store Transfer",
                    desc: "Satisfy critical stockouts within 4 hours by authorizing a Green EV transfer from a neighboring dark store.",
                    badge: "Procurement Hub",
                    action: () => {
                      onNavigatePage("procurement", "transfer");
                      onClose();
                    },
                    actionText: "Review Transfers",
                  },
                  {
                    step: 5,
                    title: "Dispatch Automated POs",
                    desc: "Authorize EDI 850 purchase orders signed with HMAC-SHA256 audit hashes directly to verified vendors.",
                    badge: "Procurement Hub",
                    action: () => {
                      onNavigatePage("procurement", "po");
                      onClose();
                    },
                    actionText: "Open PO Generator",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isDark
                        ? "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700"
                        : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center">
                          {item.step}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-500">
                          {item.badge}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={item.action}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-neutral-800 dark:hover:bg-emerald-600 text-slate-700 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>{item.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FORMULA CALCULATOR & EXPLAINER */}
          {activeTab === "calculator" && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs sm:text-sm">
                      Interactive Dual-Variance Dynamic Safety Stock Explainer
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    SS = Z × √(L · σ_d² + D² · σ_L²)
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                  Adjust parameters below to see in real-time how supplier lead-time unreliability inflates the safety buffer.
                </p>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex justify-between text-xs font-medium">
                    <span>Average Daily Demand (D)</span>
                    <strong className="text-emerald-600">{calcDemandMean} units/day</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    value={calcDemandMean}
                    onChange={(e) => setCalcDemandMean(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex justify-between text-xs font-medium">
                    <span>Demand Std Dev (σ_d)</span>
                    <strong className="text-emerald-600">{calcDemandStd} units</strong>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="40"
                    value={calcDemandStd}
                    onChange={(e) => setCalcDemandStd(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex justify-between text-xs font-medium">
                    <span>Supplier Lead Time Mean (L)</span>
                    <strong className="text-emerald-600">{calcLeadTimeMean} days</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="14"
                    value={calcLeadTimeMean}
                    onChange={(e) => setCalcLeadTimeMean(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex justify-between text-xs font-medium">
                    <span>Lead Time Std Dev (σ_L)</span>
                    <strong className="text-amber-600">{calcLeadTimeStd} days</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.2"
                    value={calcLeadTimeStd}
                    onChange={(e) => setCalcLeadTimeStd(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>

                <div
                  className={`p-3 rounded-xl border space-y-1.5 sm:col-span-2 ${
                    isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex justify-between text-xs font-medium">
                    <span>Cycle Service Level (CSL) Target</span>
                    <strong className="text-indigo-600">
                      {calcServiceLevel === 1.282
                        ? "90% (Z=1.282)"
                        : calcServiceLevel === 1.645
                        ? "95% (Z=1.645)"
                        : calcServiceLevel === 2.054
                        ? "98% (Z=2.054)"
                        : "99% Mission Critical (Z=2.326)"}
                    </strong>
                  </div>
                  <div className="flex gap-1.5">
                    {[
                      { z: 1.282, label: "90%" },
                      { z: 1.645, label: "95%" },
                      { z: 2.054, label: "98%" },
                      { z: 2.326, label: "99%" },
                    ].map((lvl) => (
                      <button
                        key={lvl.z}
                        type="button"
                        onClick={() => setCalcServiceLevel(lvl.z)}
                        className={`flex-1 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          calcServiceLevel === lvl.z
                            ? "bg-indigo-600 text-white"
                            : isDark
                            ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Result Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  className={`p-3 rounded-xl border ${
                    isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-emerald-50/60 border-emerald-200"
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Calculated Safety Stock
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                    {calcResults.safetyStock} <span className="text-xs font-normal">units</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Dual-variance buffer</div>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-indigo-50/60 border-indigo-200"
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Reorder Point (ROP)
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">
                    {calcResults.reorderPoint} <span className="text-xs font-normal">units</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">D·L ({calcResults.expectedLeadTimeDemand}) + SS</div>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Demand Variance Share
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-neutral-200 mt-1">
                    {calcResults.demandVarShare}%
                  </div>
                  <div className="text-[10px] text-slate-400">L · σ_d² = {calcResults.demandVarianceTerm}</div>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-amber-50/60 border-amber-200"
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                    Supplier Variance Share
                  </div>
                  <div className="text-lg font-bold text-amber-600 mt-1">
                    {calcResults.leadTimeVarShare}%
                  </div>
                  <div className="text-[10px] text-slate-400">D² · σ_L² = {calcResults.leadTimeVarianceTerm}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GLOSSARY */}
          {activeTab === "glossary" && (
            <div className="space-y-3">
              {[
                {
                  term: "ROP (Reorder Point)",
                  def: "The inventory threshold that triggers replenishment. When usable stock dips below ROP, an order must be placed immediately.",
                },
                {
                  term: "SS (Safety Stock)",
                  def: "A statistical buffer held to guard against stochastic surges in customer demand and late supplier deliveries.",
                },
                {
                  term: "CSL (Cycle Service Level)",
                  def: "The probability (e.g. 99%) of not having a stock-out during replenishment lead time. Expressed as normal deviate Z.",
                },
                {
                  term: "EOQ (Economic Order Quantity)",
                  def: "The order size that minimizes the sum of inventory carrying costs and order processing costs.",
                },
                {
                  term: "OTIF (On-Time In-Full)",
                  def: "Primary vendor reliability metric measuring the percentage of shipments delivered on the agreed date with complete quantity.",
                },
                {
                  term: "EDI 850 (Purchase Order Transaction)",
                  def: "ANSI X12 electronic data interchange format used to dispatch purchase orders directly into supplier ERPs (SAP S/4HANA, Oracle).",
                },
                {
                  term: "Usable Stock vs. Nominal Stock",
                  def: "Nominal stock is raw counts on shelf; Usable Stock subtracts decayed or expired perishable units to avoid stockouts on bad inventory.",
                },
                {
                  term: "Multi-Echelon Dark Store Corridor",
                  def: "Interconnected network of regional fulfillment centers and dark stores that share inventory via rapid Green EV transfers.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border ${
                    isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                    {item.term}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-neutral-300 mt-1 leading-relaxed">
                    {item.def}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-3.5 sm:p-4 border-t flex items-center justify-between flex-wrap gap-2 shrink-0 ${
            isDark ? "border-neutral-800 bg-neutral-950/70" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Still have questions or doubts?</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCopilot();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Gemini AI Copilot</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-300"
                  : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
