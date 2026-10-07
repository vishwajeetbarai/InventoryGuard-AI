import React from "react";
import { Warehouse } from "../types";
import { ShieldCheck, Zap, RefreshCw, Layers } from "lucide-react";

interface HeaderProps {
  currentWarehouse: Warehouse;
  onRefreshData: () => void;
  isSimulating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentWarehouse,
  onRefreshData,
  isSimulating,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl">
            📦
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Multi-Source Supply Chain &amp; Stock-Out Forecaster
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 mr-1" /> Quick-Commerce Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Executive Control Tower</span>
              <span className="text-slate-600">•</span>
              <span>Machine Learning &amp; Bivariate Monte Carlo Risk Simulator</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs text-slate-400">Active Node</span>
            <span className="text-sm font-semibold text-slate-200">
              {currentWarehouse.name}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <button
            onClick={onRefreshData}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
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
