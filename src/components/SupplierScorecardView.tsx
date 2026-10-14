import React, { useState } from "react";
import { SkuSimulationState, CurrencyCode } from "../types";
import { formatCurrency } from "../utils/currency";
import { calculateSupplierChargebacks } from "../engine/supplyChainEngine";
import {
  Award,
  Scale,
  CheckCircle2,
  Send,
} from "lucide-react";

interface SupplierScorecardViewProps {
  simulationStates: SkuSimulationState[];
  onIssueDebitNote?: (supplierName: string, amountInr: number) => void;
  currency?: CurrencyCode;
  theme?: "dark" | "light";
}

export const SupplierScorecardView: React.FC<SupplierScorecardViewProps> = ({
  simulationStates,
  onIssueDebitNote,
  currency = "USD",
  theme = "light",
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
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            GRADE A (1.0x Buffer)
          </span>
        );
      case "B":
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/30">
            GRADE B (1.15x Buffer)
          </span>
        );
      case "C":
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            GRADE C (1.30x Buffer)
          </span>
        );
      case "D":
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30">
            GRADE D (1.50x Buffer)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            GRADE F (1.80x Buffer)
          </span>
        );
    }
  };

  const containerCls = isDark
    ? "bg-neutral-900 border-neutral-800 text-neutral-100"
    : "bg-white border-slate-300 text-slate-900 shadow-xs";

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className={`border rounded-xl p-5 shadow-xs transition-colors ${containerCls}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-neutral-800">
          <div>
            <h3
              className={`text-base font-bold flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Supplier Reliability Matrix &amp; Risk Scaling Scorecard
            </h3>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5 font-medium">
              Vendor reliability directly scales lead-time variance (&sigma;<sub>L</sub>) and safety stock buffers via Silver-Pyke-Peterson variance propagation.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 font-bold self-start sm:self-auto border border-slate-200 dark:border-neutral-700">
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
                    ? "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                    : "bg-slate-50 border-slate-300 hover:border-slate-400"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-neutral-300">
                      {s.sku.id} • {s.sku.category}
                    </span>
                    <h4
                      className={`text-sm font-bold mt-0.5 ${
                        isDark ? "text-white" : "text-slate-950"
                      }`}
                    >
                      {s.sku.name}
                    </h4>
                  </div>
                  {getGradePill(sc.grade)}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-neutral-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700 dark:text-neutral-300 font-medium">
                    <span>Primary Vendor:</span>
                    <strong className={isDark ? "text-white" : "text-slate-950 font-bold"}>
                      {sc.supplierName}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-700 dark:text-neutral-300 font-medium">
                    <span>On-Time Delivery Rate:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {sc.onTimeDeliveryPct}%
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 dark:text-neutral-300 font-medium">
                    <span>Base Lead-Time Variance:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-neutral-200">
                      &plusmn;{s.sku.leadTimeStd} days
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 dark:text-neutral-300 font-medium">
                    <span>Scaled Lead-Time Std (&sigma;<sub>L</sub>):</span>
                    <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                      &plusmn;{s.effectiveLeadTimeStd} days ({sc.bufferMultiplier}x)
                    </span>
                  </div>
                </div>

                <p className={`mt-3 p-2 rounded border text-[11px] italic ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 text-neutral-300"
                    : "bg-white border-slate-200 text-slate-700"
                }`}>
                  &ldquo;{sc.auditNotes}&rdquo;
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Supplier Penalty & SLA Breach Chargeback Calculator */}
      <div className={`border rounded-xl p-5 shadow-xs transition-colors ${containerCls}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-neutral-800">
          <div>
            <h3
              className={`text-base font-bold flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Supplier SLA Breach Penalty &amp; Chargeback Calculator
            </h3>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5 font-medium">
              Contractual liquidated damages calculated for lead-time delays beyond 48-hour SLA threshold. Grade D/F suppliers incur monetary debit penalties to recover dark store carrying losses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-600 dark:text-neutral-400 uppercase font-bold">Total SLA Debit Note Value</span>
              <div className="font-mono text-base font-extrabold text-amber-700 dark:text-amber-400">
                {formatCurrency(totalPenaltiesInr, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Financial KPI Highlights */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-3 rounded-xl border ${
            isDark ? "bg-neutral-950 border-neutral-800" : "bg-slate-50 border-slate-200 shadow-xs"
          }`}>
            <span className="text-[11px] text-slate-600 dark:text-neutral-400 uppercase font-bold">Cumulative Breach Delay</span>
            <div className="font-mono text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
              +{totalBreachHours.toFixed(1)} Hours
            </div>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium">Exceeding standard 48h SLA gate</span>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? "bg-neutral-950 border-neutral-800" : "bg-slate-50 border-slate-200 shadow-xs"
          }`}>
            <span className="text-[11px] text-slate-600 dark:text-neutral-400 uppercase font-bold">Non-Compliant Vendors</span>
            <div className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
              {chargebacks.length} Suppliers
            </div>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium">Tier-D and Tier-F performance risk</span>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? "bg-neutral-950 border-neutral-800" : "bg-slate-50 border-slate-200 shadow-xs"
          }`}>
            <span className="text-[11px] text-slate-600 dark:text-neutral-400 uppercase font-bold">Recovery Rate Status</span>
            <div className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              100% Contractually Enforceable
            </div>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium">Auto-deducted from next AP remittance</span>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 font-mono text-[11px] bg-slate-100 dark:bg-neutral-950">
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-3">SKU Context</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3">SLA vs Realized</th>
                <th className="py-2.5 px-3">Hourly Fine</th>
                <th className="py-2.5 px-3">Total Liquidated Damages</th>
                <th className="py-2.5 px-3 text-right">Debit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
              {chargebacks.map((c) => {
                const isIssued = issuedNotes.includes(c.supplierName);
                return (
                  <tr key={c.supplierName} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-950 dark:text-white">
                      {c.supplierName}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-neutral-300 font-medium">
                      {c.skuName}
                    </td>
                    <td className="py-3 px-3">
                      {getGradePill(c.grade)}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-800 dark:text-neutral-200 font-medium">
                      {c.slaThresholdHours}h <span className="text-slate-500">vs</span>{" "}
                      <span className="text-rose-600 dark:text-rose-400 font-bold">{c.actualDelayHours}h</span>{" "}
                      <span className="text-rose-600 dark:text-rose-400 text-[10px] font-bold">(+{c.breachHours}h)</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-800 dark:text-neutral-200 font-medium">
                      {formatCurrency(c.hourlyPenaltyRateInr, currency)}/hr
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                      {formatCurrency(c.totalChargebackInr, currency)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isIssued ? (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Debit Note Dispatched</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleIssueDebit(c.supplierName, c.totalChargebackInr)}
                          className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs"
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
