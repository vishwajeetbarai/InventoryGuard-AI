import React from "react";
import { SubstitutionAbsorption } from "../types";
import {
  Shuffle,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  IndianRupee,
} from "lucide-react";

interface SubstitutionCardProps {
  substitutions: SubstitutionAbsorption[];
  theme?: "dark" | "light";
}

export const SubstitutionCard: React.FC<SubstitutionCardProps> = ({
  substitutions,
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  const totalRetainedRevenue = substitutions.reduce(
    (acc, sub) => acc + sub.retainedRevenueInr,
    0
  );
  const totalAbsorbedUnits = substitutions.reduce(
    (acc, sub) => acc + sub.absorbedDemandUnits,
    0
  );

  if (substitutions.length === 0) {
    return null;
  }

  const getAdequacyBadge = (status: "SAFE" | "TIGHT" | "RISK") => {
    switch (status) {
      case "SAFE":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            BUFFER HEALTHY
          </span>
        );
      case "TIGHT":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            BUFFER CONSTRAINED
          </span>
        );
      case "RISK":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            SECONDARY DEFICIT RISK
          </span>
        );
    }
  };

  return (
    <div
      className={`border rounded-xl p-5 shadow-xs transition-colors ${
        isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-300"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200">
              <Shuffle className="w-4 h-4" />
            </span>
            <h3
              className={`text-sm font-bold ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              Product Substitution &amp; Stockout Cannibalization Engine
            </h3>
          </div>
          <p className="text-xs text-slate-700 dark:text-neutral-300 mt-1 font-medium">
            When primary SKUs experience stockouts, 25%–40% unsatisfied consumer demand is absorbed by adjacent catalog substitutes.
          </p>
        </div>

        {/* Global Impact */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-700 dark:text-neutral-300 uppercase font-bold">
              Retained Revenue Captured
            </div>
            <div className="font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
              +₹{totalRetainedRevenue.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="h-7 w-[1px] bg-slate-300 dark:bg-neutral-800 hidden sm:block" />
          <div className="text-right">
            <div className="text-[10px] text-slate-700 dark:text-neutral-300 uppercase font-bold">
              Absorbed Deficit Units
            </div>
            <div className="font-mono text-sm font-extrabold text-indigo-700 dark:text-indigo-400">
              {totalAbsorbedUnits} Units
            </div>
          </div>
        </div>
      </div>

      {/* Substitution Rows / Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {substitutions.map((sub, idx) => (
          <div
            key={`${sub.stockoutSkuId}-${sub.substituteSkuId}-${idx}`}
            className={`border rounded-xl p-4 transition-all ${
              isDark
                ? "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                : "bg-slate-50 border-slate-300 hover:border-slate-400"
            }`}
          >
            {/* Deficit SKU -> Substitute SKU Route */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <span className="text-[10px] font-mono text-rose-500 font-bold uppercase">
                  Primary Deficit
                </span>
                <div
                  className={`text-xs font-bold truncate ${
                    isDark ? "text-neutral-100" : "text-slate-950"
                  }`}
                >
                  {sub.stockoutSkuName}
                </div>
                <div className="text-[10px] font-mono text-slate-700 dark:text-neutral-300 font-medium">
                  {sub.deficitUnits} units deficit
                </div>
              </div>

              <div className="flex flex-col items-center px-2">
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {sub.absorptionRatePct}%
                </span>
                <ArrowRight className="w-4 h-4 text-indigo-400" />
                <span className="text-[9px] text-slate-500">cannibalized</span>
              </div>

              <div className="flex-1 text-right">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  Designated Substitute
                </span>
                <div
                  className={`text-xs font-bold truncate ${
                    isDark ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  {sub.substituteSkuName}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {sub.substituteAvailableStock} units available
                </div>
              </div>
            </div>

            {/* Financial & Buffer Status */}
            <div className="mt-3 pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Substitute Buffer:</span>
                {getAdequacyBadge(sub.substituteBufferAdequacy)}
              </div>
              <div className="font-mono text-emerald-400 font-bold">
                +₹{sub.retainedRevenueInr.toLocaleString("en-IN")} Retained
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
