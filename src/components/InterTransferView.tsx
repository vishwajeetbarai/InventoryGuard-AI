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
  TrendingUp,
  Zap,
  Timer,
  Scale,
  DollarSign,
  PackageCheck,
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
  const totalFreightCostInr = recommendations.reduce(
    (acc, r) => acc + r.transitCostInr,
    0
  );
  const totalSalvagedRevenueInr = recommendations.reduce(
    (acc, r) => acc + r.stockoutLossPreventedInr,
    0
  );
  const netSalvagedProfitInr = totalSalvagedRevenueInr - totalFreightCostInr;
  const roiMultiplier =
    totalFreightCostInr > 0
      ? (totalSalvagedRevenueInr / totalFreightCostInr).toFixed(1)
      : "10.5";

  const avgTransitHours =
    recommendations.length > 0
      ? Math.round(
          recommendations.reduce((acc, r) => acc + r.transitHours, 0) /
            recommendations.length
        )
      : 4;

  const avgSupplierLeadTimeDays =
    recommendations.length > 0
      ? (
          recommendations.reduce(
            (acc, r) => acc + (r.supplierLeadTimeDays || 3.5),
            0
          ) / recommendations.length
        ).toFixed(1)
      : "3.5";

  const totalLeadTimeSavedHours = recommendations.reduce(
    (acc, r) =>
      acc + (r.leadTimeSavedHours || Math.round((r.supplierLeadTimeDays || 3.5) * 24 - r.transitHours)),
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. Overview Financial & Operational Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Transfers */}
        <div
          className={`border rounded-xl p-5 shadow-sm transition-colors ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Inter-Store Transfers</span>
            <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
          </div>
          <div
            className={`mt-3 text-2xl font-extrabold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {recommendations.length}{" "}
            <span className="text-sm font-medium text-slate-400">Opportunities</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {totalUnitsTransferrable.toLocaleString()} units redeployable from surplus dark stores
          </div>
        </div>

        {/* Net Salvaged Revenue at Risk */}
        <div
          className={`border rounded-xl p-5 shadow-sm transition-colors ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Salvaged Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-500 font-mono">
            ₹{totalSalvagedRevenueInr.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Gross stock-out penalties &amp; sales revenue preserved
          </div>
        </div>

        {/* Net Freight Cost vs Salvaged Margin */}
        <div
          className={`border rounded-xl p-5 shadow-sm transition-colors ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Net Financial Margin</span>
            <Scale className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-sky-400 font-mono">
            +₹{Math.max(0, netSalvagedProfitInr).toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span>Freight Cost: ₹{totalFreightCostInr.toLocaleString("en-IN")}</span>
            <span className="text-emerald-400 font-bold">{roiMultiplier}x ROI</span>
          </div>
        </div>

        {/* Delivery Lead-Time Savings */}
        <div
          className={`border rounded-xl p-5 shadow-sm transition-colors ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Delivery Time Savings</span>
            <Timer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-amber-400 font-mono">
            ~{avgTransitHours}h{" "}
            <span className="text-sm font-normal text-slate-400">
              vs {avgSupplierLeadTimeDays}d Supplier
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Instant quick-commerce fulfillment vs 60–108h vendor latency
          </div>
        </div>
      </div>

      {/* 2. Enhanced Inter-Store Transfer Profitability Matrix */}
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
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Inter-Store Transfer Profitability &amp; Transit Efficiency Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Financial and operational comparison of cross-dock inter-hub transfers vs traditional supplier purchase orders.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 self-start sm:self-auto flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Fast Cross-Dock Redeployment</span>
          </span>
        </div>

        {/* Matrix Comparison Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr
                className={`border-b ${
                  isDark
                    ? "border-slate-800 text-slate-400"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <th className="py-2.5 px-3 font-semibold">Evaluation Metric</th>
                <th className="py-2.5 px-3 font-semibold text-rose-400">
                  Route A: Supplier Purchase Order (PO)
                </th>
                <th className="py-2.5 px-3 font-semibold text-emerald-400">
                  Route B: Inter-Store Dark Store Rebalance
                </th>
                <th className="py-2.5 px-3 font-semibold text-sky-400">
                  Strategic Advantage &amp; Net Impact
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              <tr className={isDark ? "hover:bg-slate-800/20" : "hover:bg-slate-50"}>
                <td className="py-3 px-3 font-medium text-slate-300">
                  Delivery Lead Time
                </td>
                <td className="py-3 px-3 font-mono text-rose-400">
                  {avgSupplierLeadTimeDays} Days (60–144 Hours)
                </td>
                <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                  ~{avgTransitHours} Hours (Intra-city van)
                </td>
                <td className="py-3 px-3 text-sky-400 font-semibold">
                  ~94% Faster Fulfillment (~{Math.round((Number(avgSupplierLeadTimeDays) * 24) - avgTransitHours)}h saved)
                </td>
              </tr>

              <tr className={isDark ? "hover:bg-slate-800/20" : "hover:bg-slate-50"}>
                <td className="py-3 px-3 font-medium text-slate-300">
                  Freight &amp; Transit Cost
                </td>
                <td className="py-3 px-3 text-slate-400">
                  Supplier minimum order quantity + long-haul freight
                </td>
                <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                  ₹{totalFreightCostInr.toLocaleString("en-IN")} total transit fee
                </td>
                <td className="py-3 px-3 text-sky-400 font-semibold">
                  Sub-₹350 localized cross-city dispatch
                </td>
              </tr>

              <tr className={isDark ? "hover:bg-slate-800/20" : "hover:bg-slate-50"}>
                <td className="py-3 px-3 font-medium text-slate-300">
                  Salvaged Revenue at Risk
                </td>
                <td className="py-3 px-3 text-rose-400">
                  ₹0 (Stockout breach lasts multiple days)
                </td>
                <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                  ₹{totalSalvagedRevenueInr.toLocaleString("en-IN")} protected
                </td>
                <td className="py-3 px-3 text-sky-400 font-semibold">
                  Net Profitability: +₹{netSalvagedProfitInr.toLocaleString("en-IN")} ({roiMultiplier}x ROI)
                </td>
              </tr>

              <tr className={isDark ? "hover:bg-slate-800/20" : "hover:bg-slate-50"}>
                <td className="py-3 px-3 font-medium text-slate-300">
                  Perishable Freshness &amp; Spoilage
                </td>
                <td className="py-3 px-3 text-slate-400">
                  Donor warehouse risks holding expired surplus
                </td>
                <td className="py-3 px-3 text-emerald-400 font-bold">
                  Liquidates donor surplus before expiry limits
                </td>
                <td className="py-3 px-3 text-sky-400 font-semibold">
                  Averts spoiled inventory write-downs
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Main Transfer Proposals List */}
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
              Active Dark Store Transfer Recommendations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated surplus redeployment: Transfers triggered when donor dark store stock exceeds ROP + 14 days supply.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20 self-start sm:self-auto">
            Algorithm: Surplus &gt; ROP + 14d
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
              Either all SKUs in this dark store have adequate inventory coverage, or neighboring nodes have no surplus above their safety threshold (ROP + 14 days supply).
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {recommendations.map((rec) => {
              const isApproved =
                approvedIds.includes(rec.id) || rec.status === "APPROVED";
              const netProfit = rec.netProfitabilityInr ?? (rec.stockoutLossPreventedInr - rec.transitCostInr);
              const savedHours = rec.leadTimeSavedHours ?? Math.max(0, Math.round((rec.supplierLeadTimeDays || 3) * 24 - rec.transitHours));

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
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                          Save ~{savedHours}h
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
                          <span>~{rec.transitHours}h (Save ~{savedHours}h)</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Net Profitability</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                          +₹{netProfit.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Freight: ₹{rec.transitCostInr}
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
