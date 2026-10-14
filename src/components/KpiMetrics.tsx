import React from "react";
import {
  Layers,
  AlertTriangle,
  TrendingDown,
  ShieldCheck,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { SkuSimulationState, CurrencyCode } from "../types";
import { formatCurrency } from "../utils/currency";

interface KpiMetricsProps {
  simulationStates: SkuSimulationState[];
  selectedCslLabel: string;
  selectedServiceZ?: number;
  currency?: CurrencyCode;
  theme?: "dark" | "light";
  onDrillDown?: (target: "inventory" | "risk" | "procurement" | "controls") => void;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  simulationStates,
  selectedCslLabel,
  selectedServiceZ = 2.326,
  currency = "USD",
  theme = "light",
  onDrillDown,
}) => {
  const isDark = theme === "dark";

  // 1. Inventory Value (Total on-hand valuation)
  const totalInventoryValue = simulationStates.reduce(
    (acc, s) => acc + s.currentStock * s.sku.basePrice,
    0
  );
  const totalUnits = simulationStates.reduce((acc, s) => acc + s.currentStock, 0);

  // 2. At-Risk SKUs (Urgent stockout risks + approaching ROP warnings)
  const criticalCount = simulationStates.filter(
    (s) => s.mcResult.urgency === "CRITICAL REORDER NOW"
  ).length;
  const warningCount = simulationStates.filter(
    (s) => s.mcResult.urgency === "WARNING"
  ).length;
  const atRiskCount = criticalCount + warningCount;

  // 3. Stock-Out Risk / Revenue Exposure
  const totalRevenueAtRisk = simulationStates.reduce(
    (acc, s) => acc + s.revenueAtRisk,
    0
  );
  const avgStockOutRisk =
    simulationStates.length > 0
      ? simulationStates.reduce(
          (acc, s) => acc + s.mcResult.stockoutProbabilityPct,
          0
        ) / simulationStates.length
      : 0;

  const cardBase = isDark
    ? "bg-neutral-900 border-neutral-800 text-neutral-100 hover:border-neutral-700 shadow-sm"
    : "bg-white border-slate-300 text-slate-900 shadow-xs hover:border-slate-400";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: INVENTORY VALUE */}
      <div
        onClick={() => onDrillDown?.("inventory")}
        className={`border rounded-xl p-5 transition-all flex flex-col justify-between ${cardBase} ${
          onDrillDown ? "cursor-pointer group" : ""
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-400">
              Inventory Value
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                isDark
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              {formatCurrency(totalInventoryValue, currency)}
            </span>
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
            <span>On-hand stock valuation</span>
            <span>·</span>
            <span>Active catalog</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-700 dark:text-neutral-300">
          <span className="font-medium font-mono">
            {totalUnits.toLocaleString()} units
          </span>
          <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1">
            {simulationStates.length} SKUs Monitored
            {onDrillDown && (
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </div>
      </div>

      {/* CARD 2: AT-RISK SKUS */}
      <div
        onClick={() => onDrillDown?.("risk")}
        className={`border rounded-xl p-5 transition-all flex flex-col justify-between ${cardBase} ${
          onDrillDown ? "cursor-pointer group" : ""
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-400">
              At-Risk SKUs
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                criticalCount > 0
                  ? isDark
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                  : warningCount > 0
                  ? isDark
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                  : isDark
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
                criticalCount > 0
                  ? isDark
                    ? "text-rose-400"
                    : "text-rose-600"
                  : warningCount > 0
                  ? isDark
                    ? "text-amber-400"
                    : "text-amber-600"
                  : isDark
                  ? "text-emerald-400"
                  : "text-emerald-600"
              }`}
            >
              {atRiskCount}
            </span>
            <span className="text-xs text-slate-600 dark:text-neutral-400 font-semibold">
              of {simulationStates.length} SKUs
            </span>
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
            <span>Stochastic ROP breached</span>
            <span>·</span>
            <span>Demand surge risk</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-700 dark:text-neutral-300">
          <span className="font-medium">
            {criticalCount} critical · {warningCount} warning
          </span>
          <span
            className={`font-bold flex items-center gap-1 ${
              criticalCount > 0
                ? isDark
                  ? "text-rose-400"
                  : "text-rose-600"
                : warningCount > 0
                ? isDark
                  ? "text-amber-400"
                  : "text-amber-600"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {criticalCount > 0 ? "Reorder Now" : warningCount > 0 ? "Monitor ROP" : "Stock Healthy"}
            {onDrillDown && (
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </div>
      </div>

      {/* CARD 3: STOCK-OUT EXPOSURE */}
      <div
        onClick={() => onDrillDown?.("procurement")}
        className={`border rounded-xl p-5 transition-all flex flex-col justify-between ${cardBase} ${
          onDrillDown ? "cursor-pointer group" : ""
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-400">
              Stock-Out Exposure
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                totalRevenueAtRisk > 0
                  ? isDark
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                  : isDark
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
                totalRevenueAtRisk > 0
                  ? isDark
                    ? "text-amber-400"
                    : "text-amber-600"
                  : isDark
                  ? "text-emerald-400"
                  : "text-emerald-600"
              }`}
            >
              {formatCurrency(totalRevenueAtRisk, currency)}
            </span>
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
            <span>Potential revenue leakage</span>
            <span>·</span>
            <span>Unserved orders</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-700 dark:text-neutral-300">
          <span className="font-medium font-mono">
            Avg {avgStockOutRisk.toFixed(1)}% probability
          </span>
          <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
            {totalRevenueAtRisk > 0 ? "Review POs" : "Protected"}
            {onDrillDown && (
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </div>
      </div>

      {/* CARD 4: CUSTOMER SERVICE LEVEL */}
      <div
        onClick={() => onDrillDown?.("controls")}
        className={`border rounded-xl p-5 transition-all flex flex-col justify-between ${cardBase} ${
          onDrillDown ? "cursor-pointer group" : ""
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-400">
              Customer Service Level
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                isDark
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              {selectedCslLabel}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              CSL Target
            </span>
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
            <span>Dynamic normal safety buffer</span>
            <span>·</span>
            <span>Dual-variance</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-700 dark:text-neutral-300">
          <span className="font-medium font-mono text-[11px]">
            Z = {selectedServiceZ.toFixed(3)}
          </span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            Calibrate Model
            {onDrillDown && (
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
