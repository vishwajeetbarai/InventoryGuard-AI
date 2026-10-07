import React, { useState } from "react";
import { InterTransferRecommendation } from "../types";
import {
  ArrowRightLeft,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  AlertCircle,
  Building2,
  Sparkles,
} from "lucide-react";

interface InterTransferViewProps {
  recommendations: InterTransferRecommendation[];
  onApproveTransfer: (id: string) => void;
  theme: "dark" | "light";
}

export const InterTransferView: React.FC<InterTransferViewProps> = ({
  recommendations,
  onApproveTransfer,
  theme,
}) => {
  const isDark = theme === "dark";
  const [approvedIds, setApprovedIds] = useState<string[]>([]);

  const handleApprove = (id: string) => {
    setApprovedIds((prev) => [...prev, id]);
    onApproveTransfer(id);
  };

  const totalUnitsTransferrable = recommendations.reduce(
    (acc, r) => acc + r.recommendedTransferQty,
    0
  );
  const totalSavingsInr = recommendations.reduce(
    (acc, r) => acc + r.stockoutLossPreventedInr - r.transitCostInr,
    0
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`border rounded-xl p-5 shadow-sm transition-colors ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Inter-Store Transfers Available</span>
            <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
          </div>
          <div
            className={`mt-3 text-2xl font-extrabold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {recommendations.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Critical SKUs fulfillable via city dark store surplus
          </div>
        </div>

        <div
          className={`border rounded-xl p-5 shadow-sm transition-colors ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Total Units Ready for Rebalance</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-sky-500">
            {totalUnitsTransferrable.toLocaleString()}{" "}
            <span className="text-sm font-medium text-slate-400">Units</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Fast 3–6 hr transit vs 2–5 days supplier lead time
          </div>
        </div>

        <div
          className={`border rounded-xl p-5 shadow-sm transition-colors ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Net Stockout Loss Prevented</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-500">
            ₹{Math.max(0, totalSavingsInr).toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Direct penalty + revenue salvage after intra-hub freight
          </div>
        </div>
      </div>

      {/* Main Transfer Cards List */}
      <div
        className={`border rounded-xl p-5 shadow-sm transition-colors ${
          isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/40">
          <div>
            <h3
              className={`text-base font-bold flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Multi-Echelon Dark Store Inter-Transfer Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated cross-dock inventory redeployment between regional dark stores to avert stock-outs without vendor PO lead-time friction.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20 self-start sm:self-auto">
            Algorithm: Surplus Buffer &gt; ROP + 14d
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="py-12 text-center">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h4
              className={`text-sm font-bold ${
                isDark ? "text-slate-200" : "text-slate-800"
              }`}
            >
              No Inter-Store Emergency Transfers Required
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Either all SKUs in this dark store have adequate coverage, or neighboring nodes have no surplus above their safety threshold (ROP + 14 days supply).
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {recommendations.map((rec) => {
              const isApproved =
                approvedIds.includes(rec.id) || rec.status === "APPROVED";

              return (
                <div
                  key={rec.id}
                  className={`border rounded-xl p-4 transition-all ${
                    isDark
                      ? isApproved
                        ? "bg-emerald-950/20 border-emerald-500/40"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      : isApproved
                      ? "bg-emerald-50/50 border-emerald-300"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Item Information */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          {rec.id}
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {rec.skuName} ({rec.skuId})
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/40 text-slate-400 border border-slate-700/40">
                          {rec.category}
                        </span>
                      </div>

                      {/* Route Path Indicator */}
                      <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
                        <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Donor: {rec.originWarehouseName}</span>
                          <span className="text-slate-400 font-mono font-normal">
                            (Stock: {rec.originStock} | Surplus: +{rec.originSurplusUnits})
                          </span>
                        </div>
                        <span className="text-slate-500">➔</span>
                        <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Recipient: {rec.destWarehouseName}</span>
                          <span className="text-slate-400 font-mono font-normal">
                            (Deficit Stock: {rec.destStock} &lt; ROP: {rec.destRop})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transfer Economics & Action Button */}
                    <div className="flex flex-wrap items-center gap-4 self-end lg:self-auto">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Transfer Volume</div>
                        <div className="text-base font-extrabold text-sky-400 font-mono">
                          {rec.recommendedTransferQty} Units
                        </div>
                      </div>

                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-slate-400">Transit Duration</div>
                        <div className="text-xs font-bold text-slate-200 flex items-center justify-end gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>~{rec.transitHours} Hours</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Stockout Loss Saved</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                          +₹{rec.stockoutLossPreventedInr.toLocaleString("en-IN")}
                        </div>
                      </div>

                      <button
                        onClick={() => handleApprove(rec.id)}
                        disabled={isApproved}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isApproved
                            ? "bg-emerald-600 text-white cursor-default"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Transfer Approved (In Transit)</span>
                          </>
                        ) : (
                          <>
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Approve Inter-Store Transfer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
