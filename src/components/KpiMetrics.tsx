import React from "react";
import { AlertTriangle, ShieldCheck, Clock, Layers, ArrowUpRight } from "lucide-react";
import { SkuSimulationState, CurrencyCode } from "../types";
import { formatCurrency, CURRENCIES } from "../utils/currency";

interface KpiMetricsProps {
  simulationStates: SkuSimulationState[];
  selectedCslLabel: string;
  currency?: CurrencyCode;
  theme?: "dark" | "light";
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  simulationStates,
  selectedCslLabel,
  currency = "USD",
  theme = "light",
}) => {
  const isDark = theme === "dark";

  const criticalCount = simulationStates.filter(
    (s) => s.mcResult.urgency === "CRITICAL REORDER NOW"
  ).length;

  const warningCount = simulationStates.filter(
    (s) => s.mcResult.urgency === "WARNING"
  ).length;

  const totalRevenueAtRisk = simulationStates.reduce(
    (acc, s) => acc + s.revenueAtRisk,
    0
  );

  const totalSafetyStock = simulationStates.reduce(
    (acc, s) => acc + s.mcResult.dynamicSafetyStock,
    0
  );

  const avgLeadTimeVariance =
    simulationStates.length > 0
      ? simulationStates.reduce((acc, s) => acc + s.effectiveLeadTimeStd, 0) /
        simulationStates.length
      : 0;

  const cardBase = isDark
    ? "bg-neutral-900 border-neutral-800 text-neutral-100 hover:border-neutral-700 shadow-sm"
    : "bg-white border-slate-300 text-slate-900 shadow-xs hover:border-slate-400";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Stockout Risk */}
      <div className={`border rounded-xl p-5 transition-all ${cardBase}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-300">
            Critical Stockout Risk
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              criticalCount > 0
                ? isDark
                  ? "bg-rose-500/20 text-rose-300"
                  : "bg-rose-100 text-rose-700"
                : isDark
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              criticalCount > 0
                ? isDark
                  ? "text-rose-400"
                  : "text-rose-600"
                : isDark
                ? "text-emerald-400"
                : "text-emerald-600"
            }`}
          >
            {criticalCount}
          </span>
          <span className="text-xs text-slate-700 dark:text-neutral-300 font-semibold">
            of {simulationStates.length} monitored SKUs
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-700 dark:text-neutral-300">
          <span className="font-medium">{warningCount} approaching ROP</span>
          <span
            className={`font-bold ${
              criticalCount > 0
                ? isDark
                  ? "text-rose-400"
                  : "text-rose-600"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {criticalCount > 0 ? "Dispatch POs" : "Optimal"}
          </span>
        </div>
      </div>

      {/* Metric 2: Revenue at Risk */}
      <div className={`border rounded-xl p-5 transition-all ${cardBase}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-300">
            Projected Revenue at Risk
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
              isDark
                ? "bg-amber-500/20 text-amber-300"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {CURRENCIES[currency]?.symbol || "$"}
          </div>
        </div>
        <div className="mt-3 flex items-baseline">
          <span
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? "text-amber-400" : "text-amber-700"
            }`}
          >
            {formatCurrency(totalRevenueAtRisk, currency)}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-700 dark:text-neutral-300">
          <span className="font-medium">Stockout deficit exposure</span>
          <span className="text-amber-700 dark:text-amber-400 font-bold">
            Lead-Time Drag
          </span>
        </div>
      </div>

      {/* Metric 3: Dynamic Safety Buffer */}
      <div className={`border rounded-xl p-5 transition-all ${cardBase}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-300">
            Dynamic Safety Buffer
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
              isDark
                ? "bg-neutral-800 text-neutral-200"
                : "bg-slate-100 text-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            {totalSafetyStock.toLocaleString()}
          </span>
          <span className="text-xs text-slate-700 dark:text-neutral-300 font-semibold">Units</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-700 dark:text-neutral-300">
          <span className="font-medium">Target: {selectedCslLabel} CSL</span>
          <span className="font-bold text-slate-800 dark:text-neutral-200">
            Dual-Variance
          </span>
        </div>
      </div>

      {/* Metric 4: Lead-Time Volatility */}
      <div className={`border rounded-xl p-5 transition-all ${cardBase}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-300">
            Lead-Time Volatility
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
              isDark
                ? "bg-neutral-800 text-neutral-200"
                : "bg-slate-100 text-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            ±{avgLeadTimeVariance.toFixed(1)}
          </span>
          <span className="text-xs text-slate-700 dark:text-neutral-300 font-semibold">Days σ</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-700 dark:text-neutral-300">
          <span className="font-medium">Supplier delivery variance</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
            Stochastic Lead
          </span>
        </div>
      </div>
    </div>
  );
};
