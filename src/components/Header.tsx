import React from "react";
import { Warehouse } from "../types";
import {
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  Search,
  FileSpreadsheet,
  Command,
} from "lucide-react";

interface HeaderProps {
  currentWarehouse: Warehouse;
  onRefreshData: () => void;
  isSimulating: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenExportReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentWarehouse,
  onRefreshData,
  isSimulating,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenExportReport,
}) => {
  const isDark = theme === "dark";

  return (
    <header
      className={`border-b px-6 py-3.5 sticky top-0 z-30 transition-colors duration-200 ${
        isDark
          ? "border-slate-800/80 bg-slate-950/80 backdrop-blur-md text-slate-100"
          : "border-slate-200 bg-white/80 backdrop-blur-md text-slate-900 shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-xl shrink-0">
            📦
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1
                className={`text-lg sm:text-xl font-bold tracking-tight ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Multi-Source Supply Chain &amp; Stock-Out Forecaster
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 mr-1" /> Quick-Commerce Live
              </span>
            </div>
            <p
              className={`text-xs mt-0.5 flex items-center gap-2 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              <span>Executive Control Tower</span>
              <span>•</span>
              <span>ML &amp; Bivariate Monte Carlo Risk Simulator</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Clean Sun/Moon Icon-Only Toggle */}
        <div className="flex items-center space-x-2.5 self-end md:self-auto flex-wrap">
          {/* Global Command Bar Button (Cmd + K / Ctrl + K) */}
          <button
            onClick={onOpenCommandPalette}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isDark
                ? "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-indigo-400/60"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:border-indigo-400"
            }`}
            title="Open Executive Command Palette (Cmd + K / Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Commands</span>
            <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700/60">
              ⌘K
            </kbd>
          </button>

          {/* Export Audit Report Button */}
          <button
            onClick={onOpenExportReport}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isDark
                ? "bg-slate-900/80 hover:bg-slate-800 text-emerald-400 border-emerald-500/30 hover:border-emerald-400"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
            }`}
            title="Export Supply Chain Audit Report (CSV / Printable PDF)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export Audit</span>
          </button>

          <div className="hidden sm:flex flex-col text-right pl-1">
            <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Active Node
            </span>
            <span
              className={`text-xs font-semibold truncate max-w-[130px] ${
                isDark ? "text-slate-200" : "text-slate-800"
              }`}
            >
              {currentWarehouse.name}
            </span>
          </div>

          <div
            className={`h-7 w-px hidden sm:block ${
              isDark ? "bg-slate-800" : "bg-slate-200"
            }`}
          />

          {/* Clean Icon-Only Sun/Moon Theme Toggle (No Text Labels) */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle visual theme"
            className={`p-2 rounded-lg transition-all cursor-pointer border flex items-center justify-center ${
              isDark
                ? "bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700/80 hover:border-amber-400/50 shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:border-indigo-400 shadow-sm"
            }`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Re-simulate Button */}
          <button
            onClick={onRefreshData}
            disabled={isSimulating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
            title="Re-run stochastic simulation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Simulating..." : "Re-Simulate"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
