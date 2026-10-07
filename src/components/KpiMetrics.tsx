import React from "react";
import { AlertTriangle, IndianRupee, ShieldAlert, Clock } from "lucide-react";
import { SkuSimulationState } from "../types";

interface KpiMetricsProps {
  simulationStates: SkuSimulationState[];
  selectedCslLabel: string;
  theme?: "dark" | "light";
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  simulationStates,
  selectedCslLabel,
  theme = "dark",
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

  const cardBg = isDark
    ? "bg-slate-900/80 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-900 shadow-sm";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Metric 1: SKUs at Imminent Stock-out Risk */}
      <div className={`border rounded-xl p-5 shadow-sm relative overflow-hidden transition-all ${cardBg}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-600 opacity-90" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Critical Stock-Out Risk
          </span>
          <div className={`p-2 rounded-lg ${criticalCount > 0 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl font-extrabold tracking-tight ${criticalCount > 0 ? "text-red-500" : "text-emerald-500"}`}>
            {criticalCount}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            / {simulationStates.length} Active SKUs
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>{warningCount} in Warning Zone</span>
          <span className="text-red-500 font-medium">Requires Instant PO</span>
        </div>
      </div>

      {/* Metric 2: Revenue at Risk */}
      <div className={`border rounded-xl p-5 shadow-sm relative overflow-hidden transition-all ${cardBg}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-90" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Projected Revenue at Risk
          </span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl font-extrabold tracking-tight text-amber-500">
            ₹{totalRevenueAtRisk.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Lead-Time Deficit Exposure</span>
          <span className="text-amber-500 font-medium">+ Penalty Cost</span>
        </div>
      </div>

      {/* Metric 3: Recommended Safety Stock */}
      <div className={`border rounded-xl p-5 shadow-sm relative overflow-hidden transition-all ${cardBg}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-600 opacity-90" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Dynamic Safety Buffer
          </span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-indigo-500">
            {totalSafetyStock.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-slate-400 font-medium">Units</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Target: {selectedCslLabel}</span>
          <span className="text-indigo-400 font-medium">Bivariate Variance</span>
        </div>
      </div>

      {/* Metric 4: Avg Lead Time Variance */}
      <div className={`border rounded-xl p-5 shadow-sm relative overflow-hidden transition-all ${cardBg}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-600 opacity-90" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Supplier Lead-Time Volatility
          </span>
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl font-extrabold tracking-tight text-sky-500">
            ±{avgLeadTimeVariance.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400 font-medium">Days</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Mean Standard Deviation</span>
          <span className="text-sky-500 font-medium">Stochastic Inflow</span>
        </div>
      </div>
    </div>
  );
};
