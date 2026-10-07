import React, { useState } from "react";
import { PurchaseOrder, DispatchedPoRecord, Warehouse } from "../types";
import {
  Download,
  ShoppingBag,
  CheckCircle,
  FileSpreadsheet,
  Send,
  Database,
  Eye,
  FileCode,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  exportPurchaseOrdersToCsv,
  createDispatchedPoRecord,
  exportDispatchedLedgerToCsv,
} from "../engine/supplyChainEngine";
import { PayloadInspectModal } from "./PayloadInspectModal";

interface PoGeneratorProps {
  purchaseOrders: PurchaseOrder[];
  warehouse: Warehouse;
  dispatchedLedger: DispatchedPoRecord[];
  onDispatchPo: (newRecord: DispatchedPoRecord) => void;
  theme?: "dark" | "light";
}

export const PoGenerator: React.FC<PoGeneratorProps> = ({
  purchaseOrders,
  warehouse,
  dispatchedLedger,
  onDispatchPo,
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const [selectedErp, setSelectedErp] = useState<string>("SAP S/4HANA Cloud (EDI 850)");
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [lastDispatchedRecord, setLastDispatchedRecord] = useState<DispatchedPoRecord | null>(null);
  const [inspectingRecord, setInspectingRecord] = useState<DispatchedPoRecord | null>(null);

  const totalPoValue = purchaseOrders.reduce((acc, p) => acc + p.totalPoValueInr, 0);
  const totalUnits = purchaseOrders.reduce((acc, p) => acc + p.recommendedOrderQty, 0);
  const urgentCount = purchaseOrders.filter((p) => p.priority === "URGENT").length;

  const handleDownloadCsv = () => {
    const csvContent = exportPurchaseOrdersToCsv(purchaseOrders);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `procurement_po_batch_${warehouse.id}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadLedgerCsv = () => {
    const csvContent = exportDispatchedLedgerToCsv(dispatchedLedger);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `dispatched_po_audit_ledger_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDispatchToErp = () => {
    if (purchaseOrders.length === 0) return;
    setIsDispatching(true);

    setTimeout(() => {
      const record = createDispatchedPoRecord(purchaseOrders, warehouse, selectedErp);
      onDispatchPo(record);
      setLastDispatchedRecord(record);
      setIsDispatching(false);
    }, 450);
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case "A":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">Grade A (1.0x)</span>;
      case "B":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/30">Grade B (1.15x)</span>;
      case "C":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">Grade C (1.3x)</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/30">Grade {grade} (1.5x)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`border rounded-xl p-5 shadow-sm transition-colors ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>PO Financial Commitment</span>
            <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 font-bold">₹</span>
          </div>
          <div
            className={`mt-3 text-2xl font-extrabold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            ₹{totalPoValue.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Across {purchaseOrders.length} Replenishment Line Items
          </div>
        </div>

        <div
          className={`border rounded-xl p-5 shadow-sm transition-colors ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Total Units to Procure</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-500">
            {totalUnits.toLocaleString("en-IN")}{" "}
            <span className="text-sm font-medium text-slate-400">Units</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Scaled by Vendor Reliability Risk
          </div>
        </div>

        <div
          className={`border rounded-xl p-5 shadow-sm transition-colors ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Critical Expedite Level</span>
            <span className="p-1 rounded-md bg-red-500/10 text-red-400">⚡</span>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-red-400">
            {urgentCount}{" "}
            <span className="text-sm font-medium text-slate-400">Urgent POs</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Immediate Vendor EDI Notification Required
          </div>
        </div>
      </div>

      {/* PO Batch Action Header & Dispatch Section */}
      <div
        className={`border rounded-xl p-5 shadow-sm transition-colors ${
          isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
          <div>
            <h3
              className={`text-base font-bold flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              Automated Procurement Purchase Orders (PO Batch)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Node: <strong className={isDark ? "text-slate-200" : "text-slate-800"}>{warehouse.name}</strong> • Dynamic ROP with Expiry Decay Discount
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedErp}
              onChange={(e) => setSelectedErp(e.target.value)}
              className={`text-xs rounded-lg px-2.5 py-2 border font-medium focus:outline-none ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-slate-200"
                  : "bg-slate-100 border-slate-300 text-slate-800"
              }`}
            >
              <option value="SAP S/4HANA Cloud (EDI 850)">SAP S/4HANA Cloud (EDI 850)</option>
              <option value="Oracle NetSuite WMS Webhook">Oracle NetSuite WMS Webhook</option>
              <option value="Odoo Enterprise Supply API">Odoo Enterprise Supply API</option>
            </select>

            <button
              onClick={handleDownloadCsv}
              disabled={purchaseOrders.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleDispatchToErp}
              disabled={purchaseOrders.length === 0 || isDispatching}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isDispatching ? "animate-pulse" : ""}`} />
              <span>{isDispatching ? "Dispatching..." : "Dispatch PO to ERP"}</span>
            </button>
          </div>
        </div>

        {/* Dispatch Confirmation Banner with Quick Inspect */}
        {lastDispatchedRecord && (
          <div className="mt-4 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Dispatched to ERP:</strong> Batch <code>{lastDispatchedRecord.poBatchNumber}</code> posted to <strong>{lastDispatchedRecord.erpSystem}</strong> (HTTP {lastDispatchedRecord.httpStatus} in {lastDispatchedRecord.latencyMs}ms).
              </span>
            </div>
            <button
              onClick={() => setInspectingRecord(lastDispatchedRecord)}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect Webhook Payload</span>
            </button>
          </div>
        )}

        {/* PO Line Items Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b font-semibold uppercase tracking-wider ${
                  isDark
                    ? "bg-slate-950/60 border-slate-800 text-slate-400"
                    : "bg-slate-100 border-slate-200 text-slate-600"
                }`}
              >
                <th className="py-2.5 px-4">PO Identifier</th>
                <th className="py-2.5 px-4">SKU / Item</th>
                <th className="py-2.5 px-4">Supplier &amp; Grade</th>
                <th className="py-2.5 px-4">Usable / Total Stock</th>
                <th className="py-2.5 px-4">Dynamic ROP</th>
                <th className="py-2.5 px-4">Order Qty</th>
                <th className="py-2.5 px-4">Unit Cost</th>
                <th className="py-2.5 px-4">Total Value</th>
                <th className="py-2.5 px-4">Arrival</th>
                <th className="py-2.5 px-4">Priority</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? "divide-slate-800/60" : "divide-slate-200"
              }`}
            >
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No items currently require replenishment reorders.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr
                    key={po.poNumber}
                    className={`transition-colors ${
                      isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-400">
                      {po.poNumber}
                    </td>
                    <td className="py-2.5 px-4">
                      <div
                        className={`font-bold ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {po.skuName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {po.skuId} • {po.category}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-300 truncate max-w-[140px]">
                        {po.supplierName}
                      </div>
                      <div className="mt-0.5">{getGradeBadge(po.supplierGrade)}</div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-300">
                      <span className="font-bold text-sky-400">{po.usableStock}</span>
                      <span className="text-slate-500"> / {po.currentStock}</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-red-500 font-semibold">
                      {po.dynamicRop.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-500">
                      +{po.recommendedOrderQty.toLocaleString()} units
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">
                      ₹{po.unitCostInr.toFixed(2)}
                    </td>
                    <td
                      className={`py-2.5 px-4 font-mono font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      ₹{po.totalPoValueInr.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">
                      {po.expectedDeliveryDate}
                    </td>
                    <td className="py-2.5 px-4">
                      {po.priority === "URGENT" ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                          URGENT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          NORMAL
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive ERP Webhook & Dispatched PO Ledger Section */}
      <div
        className={`border rounded-xl p-5 shadow-sm transition-colors ${
          isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            <h4
              className={`text-sm font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Enterprise Audit Ledger: <code>dispatched_po_ledger</code>
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
              Click Inspect to View JSON &amp; EDI 850
            </span>
          </div>

          <button
            onClick={handleDownloadLedgerCsv}
            disabled={dispatchedLedger.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors self-start sm:self-auto"
          >
            <Download className="w-3 h-3" />
            <span>Export Ledger CSV</span>
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b font-semibold uppercase tracking-wider ${
                  isDark
                    ? "bg-slate-950/60 border-slate-800 text-slate-400"
                    : "bg-slate-100 border-slate-200 text-slate-600"
                }`}
              >
                <th className="py-2 px-3">Dispatch ID</th>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">PO Batch</th>
                <th className="py-2 px-3">Warehouse</th>
                <th className="py-2 px-3">Target ERP</th>
                <th className="py-2 px-3">Units</th>
                <th className="py-2 px-3">Total Value</th>
                <th className="py-2 px-3">Webhook Status</th>
                <th className="py-2 px-3 text-right">Inspect Payload</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? "divide-slate-800/60" : "divide-slate-200"
              }`}
            >
              {dispatchedLedger.map((rec) => (
                <tr
                  key={rec.dispatchId}
                  className={`transition-colors ${
                    isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="py-2 px-3 font-mono font-bold text-indigo-400">
                    {rec.dispatchId}
                  </td>
                  <td className="py-2 px-3 text-slate-400 font-mono">
                    {new Date(rec.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-400">
                    {rec.poBatchNumber}
                  </td>
                  <td className="py-2 px-3 text-slate-300 font-medium truncate max-w-[140px]">
                    {rec.warehouseName.split(" ")[0]}
                  </td>
                  <td className="py-2 px-3 text-slate-300">{rec.erpSystem}</td>
                  <td className="py-2 px-3 font-mono font-semibold text-emerald-500">
                    {rec.totalUnits.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-200">
                    ₹{rec.totalValueInr.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      HTTP {rec.httpStatus} ({rec.latencyMs}ms)
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => setInspectingRecord(rec)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold cursor-pointer transition-colors shadow-sm"
                    >
                      <FileCode className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Payload Inspector Modal */}
      {inspectingRecord && (
        <PayloadInspectModal
          record={inspectingRecord}
          onClose={() => setInspectingRecord(null)}
          theme={theme}
        />
      )}
    </div>
  );
};
