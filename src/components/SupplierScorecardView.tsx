import React from "react";
import { SkuSimulationState } from "../types";
import { ShieldCheck, Truck, AlertTriangle, Clock, Layers, Award } from "lucide-react";

interface SupplierScorecardViewProps {
  simulationStates: SkuSimulationState[];
  theme?: "dark" | "light";
}

export const SupplierScorecardView: React.FC<SupplierScorecardViewProps> = ({
  simulationStates,
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  const getGradePill = (grade: string) => {
    switch (grade) {
      case "A":
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            GRADE A (1.0x Buffer)
          </span>
        );
      case "B":
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-sky-500/10 text-sky-500 border border-sky-500/30">
            GRADE B (1.15x Buffer)
          </span>
        );
      case "C":
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
            GRADE C (1.30x Buffer)
          </span>
        );
      case "D":
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/30">
            GRADE D (1.50x Buffer)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/30">
            GRADE F (1.80x Buffer)
          </span>
        );
    }
  };

  const containerCls = isDark
    ? "bg-slate-900/80 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-900 shadow-sm";

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className={`border rounded-xl p-5 shadow-sm transition-colors ${containerCls}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
          <div>
            <h3
              className={`text-base font-bold flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <Award className="w-5 h-5 text-indigo-400" />
              Supplier Reliability Matrix &amp; Risk Scaling Scorecard
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Vendor reliability directly scales the lead-time variance ($\sigma_L$) and safety stock buffers via Silver-Pyke-Peterson variance propagation.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold self-start sm:self-auto">
            Dynamic Safety Buffer Integration
          </span>
        </div>

        {/* Matrix Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {simulationStates.map((s) => {
            const sc = s.supplierScorecard;
            return (
              <div
                key={s.sku.id}
                className={`border rounded-xl p-4 transition-all ${
                  isDark
                    ? "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-semibold text-slate-400">
                      {s.sku.id} • {s.sku.category}
                    </span>
                    <h4
                      className={`text-sm font-bold mt-0.5 ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {s.sku.name}
                    </h4>
                  </div>
                  {getGradePill(sc.grade)}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/40 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Primary Vendor:</span>
                    <strong className={isDark ? "text-slate-200" : "text-slate-800"}>
                      {sc.supplierName}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>On-Time Delivery Rate:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {sc.onTimeDeliveryPct}%
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Base Lead-Time Variance:</span>
                    <span className="font-mono text-slate-300">
                      ±{s.sku.leadTimeStd} days
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Scaled Lead-Time Std ($\sigma_L$):</span>
                    <span className="font-mono font-bold text-sky-400">
                      ±{s.effectiveLeadTimeStd} days ({sc.bufferMultiplier}x)
                    </span>
                  </div>
                </div>

                <p className="mt-3 p-2 rounded bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-400 italic">
                  "{sc.auditNotes}"
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
