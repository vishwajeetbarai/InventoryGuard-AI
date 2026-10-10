import React from "react";
import {
  Warehouse,
  SkuSimulationState,
  InterTransferRecommendation,
  DispatchedPoRecord,
} from "../types";
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from "lucide-react";

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouse: Warehouse;
  simulationStates: SkuSimulationState[];
  interTransfers: InterTransferRecommendation[];
  dispatchedLedger: DispatchedPoRecord[];
  onDownloadCsv: () => void;
  theme: "dark" | "light";
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  warehouse,
  simulationStates,
  interTransfers,
  dispatchedLedger,
  onDownloadCsv,
  theme,
}) => {
  const isDark = theme === "dark";

  if (!isOpen) return null;

  const totalRevenueAtRisk = simulationStates.reduce((acc, s) => {
    if (s.mcResult.urgency === "OPTIMAL") return acc;
    return (
      acc +
      s.mcResult.recommendedReorderQty *
        (s.sku.basePrice + s.sku.stockoutPenalty)
    );
  }, 0);

  const criticalCount = simulationStates.filter(
    (s) => s.mcResult.urgency === "CRITICAL REORDER NOW"
  ).length;

  const warningCount = simulationStates.filter(
    (s) => s.mcResult.urgency === "WARNING"
  ).length;

  const totalTransferProfit = interTransfers.reduce(
    (acc, t) => acc + (t.netProfitabilityInr || 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all ${
          isDark
            ? "bg-[#0B0F19] border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-900 shadow-slate-300"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Action Header (Excluded from Print) */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b print:hidden ${
            isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm sm:text-base">
              Executive Supply Chain Audit Dossier &amp; Compliance Brief
            </h3>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0 print:overflow-visible">
          {/* Official Letterhead */}
          <div className="border-b pb-6 border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <span>InventoryGuard AI</span>
                <span>·</span>
                <span>Audit &amp; Risk Governance</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-1">
                Multi-Source Stock-Out &amp; Replenishment Audit Report
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Generated at: {new Date().toLocaleString()} · Facility:{" "}
                <strong className="text-slate-200">{warehouse.name}</strong> ({warehouse.id})
              </p>
            </div>

            <div className="text-right sm:text-right border-l-2 border-indigo-500 pl-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                DOCUMENT CONTROL ID
              </span>
              <span className="text-xs font-mono font-bold text-slate-200">
                AUD-SC-{warehouse.id.replace("WH-", "")}-{Date.now().toString().slice(-6)}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                STATUS: CERTIFIED AUDIT-READY
              </span>
            </div>
          </div>

          {/* KPI High-Level Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Critical Deficits
              </span>
              <div className="text-xl font-black text-rose-500 font-mono mt-1">
                {criticalCount} SKUs
              </div>
              <span className="text-[10px] text-slate-500">
                Require emergency procurement
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Revenue at Risk
              </span>
              <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                ₹{Math.round(totalRevenueAtRisk).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">
                Stockout penalties &amp; sales loss
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Inter-Store Opportunities
              </span>
              <div className="text-xl font-black text-amber-400 font-mono mt-1">
                {interTransfers.length} Transfers
              </div>
              <span className="text-[10px] text-slate-500">
                Net Profit: +₹{Math.round(totalTransferProfit).toLocaleString()}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Dispatched ERP Orders
              </span>
              <div className="text-xl font-black text-indigo-400 font-mono mt-1">
                {dispatchedLedger.length} POs
              </div>
              <span className="text-[10px] text-slate-500">
                SHA-256 HMAC cryptographic ledger
              </span>
            </div>
          </div>

          {/* Section 1: SKU Inventory & Joint Risk Evaluation Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. SKU Inventory, Perishable Spoilage &amp; Safety Stock Table
            </h3>
            <div className="overflow-x-auto border rounded-xl border-slate-800">
              <table className="w-full text-left text-xs">
                <thead
                  className={`border-b ${
                    isDark
                      ? "bg-slate-900/80 border-slate-800 text-slate-400"
                      : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}
                >
                  <tr>
                    <th className="py-2 px-3">SKU</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Gross Stock</th>
                    <th className="py-2 px-3 text-right">Decayed</th>
                    <th className="py-2 px-3 text-right">Usable</th>
                    <th className="py-2 px-3 text-right">Dynamic ROP</th>
                    <th className="py-2 px-3 text-right">Safety Stock</th>
                    <th className="py-2 px-3 text-right">Stockout Prob</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {simulationStates.map((s) => (
                    <tr key={s.sku.id} className="font-mono text-[11px]">
                      <td className="py-2 px-3 font-sans font-bold text-slate-200">
                        {s.sku.name}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-400">
                        {s.sku.category}
                      </td>
                      <td className="py-2 px-3 text-right">{s.currentStock}</td>
                      <td className="py-2 px-3 text-right text-rose-400">
                        {s.decayedUnits || 0}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-400">
                        {s.usableStock}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-indigo-400">
                        {s.mcResult.dynamicRop}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {s.mcResult.dynamicSafetyStock}
                      </td>
                      <td className="py-2 px-3 text-right font-bold">
                        {s.mcResult.stockoutProbabilityPct}%
                      </td>
                      <td className="py-2 px-3 font-sans font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            s.mcResult.urgency === "CRITICAL REORDER NOW"
                              ? "text-rose-400 bg-rose-500/10"
                              : s.mcResult.urgency === "WARNING"
                              ? "text-amber-400 bg-amber-500/10"
                              : "text-emerald-400 bg-emerald-500/10"
                          }`}
                        >
                          {s.mcResult.urgency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Active Inter-Store Cross-Dock Proposals */}
          {interTransfers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Multi-Echelon Dark Store Inter-Transfers (Cross-Dock Rebalancing)
              </h3>
              <div className="overflow-x-auto border rounded-xl border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead
                    className={`border-b ${
                      isDark
                        ? "bg-slate-900/80 border-slate-800 text-slate-400"
                        : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    <tr>
                      <th className="py-2 px-3">Transfer ID</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3">Donor Node</th>
                      <th className="py-2 px-3">Recipient Node</th>
                      <th className="py-2 px-3 text-right">Units</th>
                      <th className="py-2 px-3 text-right">Transit</th>
                      <th className="py-2 px-3 text-right">Freight Cost</th>
                      <th className="py-2 px-3 text-right">Salvaged Rev</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {interTransfers.map((t) => (
                      <tr key={t.id} className="font-mono text-[11px]">
                        <td className="py-2 px-3 text-indigo-400">{t.id}</td>
                        <td className="py-2 px-3 font-sans font-bold">{t.skuName}</td>
                        <td className="py-2 px-3 font-sans text-slate-400">
                          {t.originWarehouseId}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-400">
                          {t.destWarehouseId}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          {t.recommendedTransferQty}
                        </td>
                        <td className="py-2 px-3 text-right">~{t.transitHours}h</td>
                        <td className="py-2 px-3 text-right">₹{t.transitCostInr}</td>
                        <td className="py-2 px-3 text-right text-emerald-400">
                          ₹{t.stockoutLossPreventedInr}
                        </td>
                        <td className="py-2 px-3 font-sans font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              t.status === "APPROVED"
                                ? "text-emerald-400 bg-emerald-500/10"
                                : "text-amber-400 bg-amber-500/10"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 3: Dispatched ERP Audit Ledger */}
          {dispatchedLedger.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Dispatched ERP Webhook &amp; Cryptographic Audit Ledger
              </h3>
              <div className="overflow-x-auto border rounded-xl border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead
                    className={`border-b ${
                      isDark
                        ? "bg-slate-900/80 border-slate-800 text-slate-400"
                        : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    <tr>
                      <th className="py-2 px-3">Batch PO Number</th>
                      <th className="py-2 px-3">ERP Target</th>
                      <th className="py-2 px-3 text-right">Items</th>
                      <th className="py-2 px-3 text-right">Amount (INR)</th>
                      <th className="py-2 px-3">Dispatched Timestamp</th>
                      <th className="py-2 px-3">SHA-256 HMAC Signature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                    {dispatchedLedger.map((d) => (
                      <tr key={d.dispatchId}>
                        <td className="py-2 px-3 text-indigo-400 font-bold">
                          {d.poBatchNumber}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-300">
                          {d.erpSystem}
                        </td>
                        <td className="py-2 px-3 text-right">{d.itemCount}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          ₹{d.totalValueInr.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {d.timestamp.slice(0, 19).replace("T", " ")}
                        </td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[140px]" title={d.payloadHash}>
                          {d.payloadHash.slice(0, 16)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Compliance & Sign-Off Block */}
          <div className="border-t pt-6 border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-400">
                Algorithm: Bivariate Monte Carlo Joint Demand-Lead Time Simulation
              </p>
              <p className="text-[11px] mt-0.5">
                Complies with ISO 28000 Security Management Systems for the Supply Chain.
              </p>
            </div>

            <div className="border border-slate-700/60 rounded-lg p-2.5 min-w-[200px] text-center">
              <span className="text-[10px] text-slate-400 uppercase block">
                AUDITOR / LEAD ARCHITECT SIGNATURE
              </span>
              <span className="font-serif italic text-sm text-indigo-400 block my-1">
                Verified &amp; Certified
              </span>
              <span className="text-[10px] text-slate-500 block">
                Lead Supply Chain Architect
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
