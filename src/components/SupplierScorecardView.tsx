import React, { useState } from "react";
import { SkuSimulationState } from "../types";
import { calculateSupplierChargebacks } from "../engine/supplyChainEngine";
import {
  ShieldCheck,
  Truck,
  AlertTriangle,
  Clock,
  Layers,
  Award,
  Scale,
  FileText,
  IndianRupee,
  CheckCircle2,
  AlertOctagon,
  Send,
} from "lucide-react";

interface SupplierScorecardViewProps {
  simulationStates: SkuSimulationState[];
  onIssueDebitNote?: (supplierName: string, amountInr: number) => void;
  theme?: "dark" | "light";
}

export const SupplierScorecardView: React.FC<SupplierScorecardViewProps> = ({
  simulationStates,
  onIssueDebitNote,
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const [issuedNotes, setIssuedNotes] = useState<string[]>([]);

  const chargebacks = calculateSupplierChargebacks(simulationStates);
  const totalPenaltiesInr = chargebacks.reduce((acc, c) => acc + c.totalChargebackInr, 0);
  const totalBreachHours = chargebacks.reduce((acc, c) => acc + c.breachHours, 0);

  const handleIssueDebit = (supplierName: string, amountInr: number) => {
    setIssuedNotes((prev) => [...prev, supplierName]);
    if (onIssueDebitNote) {
      onIssueDebitNote(supplierName, amountInr);
    }
  };

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

      {/* 2. Supplier Penalty & SLA Breach Chargeback Calculator */}
      <div className={`border rounded-xl p-5 shadow-sm transition-colors ${containerCls}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
          <div>
            <h3
              className={`text-base font-bold flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <Scale className="w-5 h-5 text-amber-400" />
              Supplier SLA Breach Penalty &amp; Chargeback Calculator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Contractual liquidated damages calculated for lead-time delays beyond 48-hour SLA threshold. Grade D/F suppliers incur monetary debit penalties to recover dark store carrying losses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total SLA Debit Note Value</span>
              <div className="font-mono text-base font-extrabold text-amber-400">
                ₹{totalPenaltiesInr.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        {/* Financial KPI Highlights */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase">Cumulative Breach Delay</span>
            <div className="font-mono text-lg font-bold text-rose-400 mt-1">
              +{totalBreachHours.toFixed(1)} Hours
            </div>
            <span className="text-[10px] text-slate-500">Exceeding standard 48h SLA gate</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase">Non-Compliant Vendors</span>
            <div className="font-mono text-lg font-bold text-amber-400 mt-1">
              {chargebacks.length} Suppliers
            </div>
            <span className="text-[10px] text-slate-500">Tier-D and Tier-F performance risk</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase">Recovery Rate Status</span>
            <div className="font-mono text-lg font-bold text-emerald-400 mt-1">
              100% Contractually Enforceable
            </div>
            <span className="text-[10px] text-slate-500">Auto-deducted from next AP remittance</span>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-3">SKU Context</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3">SLA vs Realized</th>
                <th className="py-2.5 px-3">Hourly Fine</th>
                <th className="py-2.5 px-3">Total Liquidated Damages</th>
                <th className="py-2.5 px-3 text-right">Debit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {chargebacks.map((c) => {
                const isIssued = issuedNotes.includes(c.supplierName);
                return (
                  <tr key={c.supplierName} className="hover:bg-slate-800/20">
                    <td className="py-3 px-3 font-semibold text-white">
                      {c.supplierName}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {c.skuName}
                    </td>
                    <td className="py-3 px-3">
                      {getGradePill(c.grade)}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {c.slaThresholdHours}h <span className="text-slate-500">vs</span>{" "}
                      <span className="text-rose-400 font-bold">{c.actualDelayHours}h</span>{" "}
                      <span className="text-rose-500 text-[10px]">(+{c.breachHours}h)</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      ₹{c.hourlyPenaltyRateInr}/hr
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      ₹{c.totalChargebackInr.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isIssued ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Debit Note Dispatched</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleIssueDebit(c.supplierName, c.totalChargebackInr)}
                          className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Issue Debit Note</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
