import React from "react";
import {
  Shield,
  Zap,
  Activity,
  Terminal,
  FileText,
  UploadCloud,
  Lock,
  Sun,
  Moon,
  ExternalLink,
  ChevronRight,
  Database,
  Truck,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Warehouse, CurrencyCode, AppPage } from "../types";
import { UserProfile } from "../types/auth";
import { USER_ROLES } from "../services/authService";

interface FooterProps {
  currentWarehouse: Warehouse;
  currentUser: UserProfile;
  auditLogsCount: number;
  currency: CurrencyCode;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenReportModal: () => void;
  onOpenWmsModal: () => void;
  onOpenAuditModal: () => void;
  onTriggerSimulation: () => void;
  onSelectPage: (page: AppPage) => void;
  isSimulating: boolean;
  onGoToLanding?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentWarehouse,
  currentUser,
  auditLogsCount,
  currency,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenReportModal,
  onOpenWmsModal,
  onOpenAuditModal,
  onTriggerSimulation,
  onSelectPage,
  isSimulating,
  onGoToLanding,
}) => {
  const isDark = theme === "dark";
  const roleDef = USER_ROLES[currentUser.role];

  return (
    <footer
      className={`border-t transition-colors duration-150 ${
        isDark
          ? "border-neutral-800 bg-[#09090B] text-neutral-200"
          : "border-slate-300 bg-white text-slate-900"
      }`}
    >
      {/* 1. Live Engine Telemetry & Heartbeat Band */}
      <div
        className={`border-b px-4 sm:px-6 lg:px-8 py-5 transition-colors ${
          isDark
            ? "border-neutral-800 bg-neutral-950/80"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            {/* System Status */}
            <div className="flex items-center gap-2 text-slate-800 dark:text-neutral-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span className="font-bold">InventoryGuard AI Engine:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Operational</span>
            </div>

            {/* Live Stats */}
            <div className="flex items-center gap-3 text-slate-700 dark:text-neutral-300">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Node: <strong className="text-slate-950 dark:text-white">{currentWarehouse.name}</strong> ({currentWarehouse.city})</span>
              </span>
              <span>·</span>
              <span>Active Currency: <strong className="text-slate-950 dark:text-white">{currency}</strong></span>
              <span>·</span>
              <span>Audit Entries: <strong className="text-slate-950 dark:text-white">{auditLogsCount}</strong> SHA-256 blocks</span>
              <span>·</span>
              <span>Active Persona: <strong className="text-slate-950 dark:text-white">{currentUser.name}</strong> ({roleDef.title})</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onTriggerSimulation}
              disabled={isSimulating}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 text-neutral-100 border-neutral-700"
                  : "bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-xs"
              }`}
            >
              <Activity className={`w-3.5 h-3.5 text-emerald-500 ${isSimulating ? "animate-spin" : ""}`} />
              <span>{isSimulating ? "Recomputing..." : "Run ML Forecast"}</span>
            </button>

            <button
              onClick={onOpenCommandPalette}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 text-neutral-100 border-neutral-700"
                  : "bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-xs"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
              <span>Command Palette</span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={onToggleTheme}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 text-neutral-100 border-neutral-700"
                  : "bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-xs"
              }`}
              title="Toggle theme (Light / Dark)"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Comprehensive 5-Column Enterprise Directory & Specs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Column 1: Brand & Defense Mission (Span 4) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-sm ${
                  isDark
                    ? "bg-white text-black shadow-white/10"
                    : "bg-slate-950 text-white shadow-slate-950/20"
                }`}
              >
                🛡️
              </div>
              <div>
                <h3 className="font-extrabold text-xl tracking-tight text-slate-950 dark:text-white">
                  InventoryGuard-AI
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Autonomous Supply Chain Defense System
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-700 dark:text-neutral-300">
              Enterprise control tower providing multi-echelon demand forecasting, joint stochastic Monte Carlo risk hedging, and zero-latency procurement execution. Protects high-velocity fulfillment networks against stockout revenue leaks.
            </p>

            {/* Certifications & Badges */}
            <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-300">
                Enterprise Standards & Certifications
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>SOC 2 Type II Certified</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>ISO/IEC 27001 Security</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>GDPR / CCPA Compliant</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>SHA-256 Event Ledger</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Platform Navigation & Modules (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b pb-2 border-slate-200 dark:border-neutral-800">
              Core Modules
            </h4>
            <ul className="space-y-2.5 text-xs">
              {onGoToLanding && (
                <li>
                  <button
                    onClick={onGoToLanding}
                    className="font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-emerald-500" />
                    <span>Product Landing &amp; ROI Model</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => onSelectPage("overview")}
                  className="font-medium text-slate-700 hover:text-slate-950 dark:text-neutral-300 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  <span>Network Topology Map</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPage("inventory")}
                  className="font-medium text-slate-700 hover:text-slate-950 dark:text-neutral-300 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  <span>Inventory & Risk Table</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPage("inventory")}
                  className="font-medium text-slate-700 hover:text-slate-950 dark:text-neutral-300 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  <span>ML Visual Analytics</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPage("procurement")}
                  className="font-medium text-slate-700 hover:text-slate-950 dark:text-neutral-300 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  <span>Automated PO Batches</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPage("procurement")}
                  className="font-medium text-slate-700 hover:text-slate-950 dark:text-neutral-300 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  <span>Inter-Store Transfers</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPage("procurement")}
                  className="font-medium text-slate-700 hover:text-slate-950 dark:text-neutral-300 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  <span>Supplier Scorecard Matrix</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectPage("operations")}
                  className="font-medium text-slate-700 hover:text-slate-950 dark:text-neutral-300 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  <span>Data Hub & Simulator</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: AI & Quantitative Engines (Span 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b pb-2 border-slate-200 dark:border-neutral-800">
              Quantitative Engines
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/40">
                <div className="font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Bivariate Monte Carlo Engine</span>
                </div>
                <p className="text-slate-700 dark:text-neutral-300 mt-1 leading-relaxed font-medium">
                  Couples daily demand volatility with stochastic supplier lead-time drag across 10,000 iterations to predict probability of stockout.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/40">
                <div className="font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Dual-Variance Dynamic Safety Stock</span>
                </div>
                <p className="text-slate-700 dark:text-neutral-300 mt-1 leading-relaxed font-medium">
                  Formula: SS = Z × √(L · σ_D² + D² · σ_L²). Adjusts target cycle service levels from 90% (Z=1.28) up to 99.9% (Z=3.09).
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/40">
                <div className="font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>EOQ Reorder Optimizer</span>
                </div>
                <p className="text-slate-700 dark:text-neutral-300 mt-1 leading-relaxed font-medium">
                  Calculates Economic Order Quantity balanced against per-unit holding costs and supplier fixed order placement fees.
                </p>
              </div>
            </div>
          </div>

          {/* Column 4: Enterprise Ingestion & Security (Span 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white border-b pb-2 border-slate-200 dark:border-neutral-800">
              Enterprise Tools & Dossiers
            </h4>
            <div className="space-y-2.5">
              <button
                onClick={onOpenReportModal}
                className={`w-full p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  isDark
                    ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-100"
                    : "bg-white hover:bg-slate-50 border-slate-300 text-slate-900 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <div>
                    <div className="font-bold">Executive Report Dossier</div>
                    <div className="text-[10px] text-slate-700 dark:text-neutral-300 font-medium">
                      Printable PDF audit brief &amp; KPI memo
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={onOpenWmsModal}
                className={`w-full p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  isDark
                    ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-100"
                    : "bg-white hover:bg-slate-50 border-slate-300 text-slate-900 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-bold">Enterprise WMS CSV Engine</div>
                    <div className="text-[10px] text-slate-700 dark:text-neutral-300 font-medium">
                      SAP, Oracle NetSuite &amp; ERP ingestion
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={onOpenAuditModal}
                className={`w-full p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  isDark
                    ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-100"
                    : "bg-white hover:bg-slate-50 border-slate-300 text-slate-900 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="font-bold">Cryptographic Audit Ledger</div>
                    <div className="text-[10px] text-slate-700 dark:text-neutral-300 font-medium">
                      {auditLogsCount} SHA-256 verifiable logs
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Quick Operational SLA Matrix */}
            <div className="pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-300 mb-2">
                Infrastructure SLA Commitments
              </div>
              <div className="space-y-1.5 text-xs text-slate-700 dark:text-neutral-300 font-medium">
                <div className="flex items-center justify-between">
                  <span>Engine Uptime SLA:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">99.99% Guaranteed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Forecast Compute SLA:</span>
                  <span className="font-bold font-mono">&lt; 150ms per batch</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Data Ingestion Latency:</span>
                  <span className="font-bold font-mono">Real-time Zero-Queue</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mathematical Formulas Banner */}
        <div
          className={`mt-14 p-6 rounded-2xl border transition-colors ${
            isDark
              ? "bg-neutral-950/70 border-neutral-800"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-neutral-800">
            <div>
              <h5 className="font-bold text-sm text-slate-950 dark:text-white">
                InventoryGuard-AI Supply Chain Algorithmic Formulations
              </h5>
              <p className="text-xs text-slate-700 dark:text-neutral-300 font-medium">
                Ground-truth mathematical specifications verified by supply chain operations research standards.
              </p>
            </div>
            <div className="text-xs font-mono font-semibold text-slate-700 dark:text-neutral-300">
              Reference: Silver-Pyke-Peterson Inventory Theory
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <div className="font-bold text-slate-900 dark:text-white mb-1">
                1. Dual-Variance Safety Stock (SS)
              </div>
              <div className="font-mono p-2 rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-emerald-400 font-bold">
                SS = Z × √(L · σ_D² + D² · σ_L²)
              </div>
              <p className="text-slate-700 dark:text-neutral-300 mt-1.5 leading-normal font-medium">
                Accounts for variance in both customer demand (σ_D) and supplier delivery lead-time (σ_L).
              </p>
            </div>

            <div>
              <div className="font-bold text-slate-900 dark:text-white mb-1">
                2. Reorder Point (ROP)
              </div>
              <div className="font-mono p-2 rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-emerald-400 font-bold">
                ROP = (D × L) + SS
              </div>
              <p className="text-slate-700 dark:text-neutral-300 mt-1.5 leading-normal font-medium">
                Replenishment triggers automatically the moment inventory + on-order units drop below ROP.
              </p>
            </div>

            <div>
              <div className="font-bold text-slate-900 dark:text-white mb-1">
                3. Joint Monte Carlo Deficit
              </div>
              <div className="font-mono p-2 rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-emerald-400 font-bold">
                Stockout Prob = Σ [Stock &lt; 0] / N_runs
              </div>
              <p className="text-slate-700 dark:text-neutral-300 mt-1.5 leading-normal font-medium">
                10,000 stochastic paths evaluated across Poisson demand surges and log-normal supplier delays.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Legal, Security & Copyright Bar */}
      <div
        className={`border-t px-4 sm:px-6 lg:px-8 py-8 transition-colors ${
          isDark
            ? "border-neutral-800 bg-black text-neutral-400"
            : "border-slate-300 bg-slate-100 text-slate-700"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-bold text-slate-900 dark:text-white">
              InventoryGuard-AI
            </span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="text-slate-700 dark:text-neutral-300">
              © 2026 InventoryGuard-AI Technologies Inc. All rights reserved.
            </span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="text-slate-700 dark:text-neutral-300 font-medium">
              Next-Gen Autonomous Supply Chain Defense Architecture.
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="text-slate-700 dark:text-neutral-300 font-medium">
              Keyboard: <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 font-bold">⌘K</kbd> Command Palette
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-700 dark:text-neutral-300 font-medium">
              Active Mode: <strong className="text-slate-950 dark:text-white font-bold">{isDark ? "Obsidian Dark" : "Pure Light"}</strong>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
