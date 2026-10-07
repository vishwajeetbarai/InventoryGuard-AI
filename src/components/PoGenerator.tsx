import React, { useState } from "react";
import { PurchaseOrder } from "../types";
import { Download, ShoppingBag, CheckCircle, FileSpreadsheet, Send, ShieldCheck } from "lucide-react";
import { exportPurchaseOrdersToCsv } from "../engine/supplyChainEngine";

interface PoGeneratorProps {
  purchaseOrders: PurchaseOrder[];
  warehouseName: string;
}

export const PoGenerator: React.FC<PoGeneratorProps> = ({
  purchaseOrders,
  warehouseName,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [poSent, setPoSent] = useState(false);

  const totalPoValue = purchaseOrders.reduce(
    (acc, p) => acc + p.totalPoValueInr,
    0
  );
  const totalUnits = purchaseOrders.reduce(
    (acc, p) => acc + p.recommendedOrderQty,
    0
  );
  const urgentCount = purchaseOrders.filter((p) => p.priority === "URGENT").length;

  const handleDownloadCsv = () => {
    const csvContent = exportPurchaseOrdersToCsv(purchaseOrders);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `procurement_po_batch_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateSendErp = () => {
    setPoSent(true);
    setTimeout(() => setPoSent(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Total PO Financial Commitment</span>
            <span className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">₹</span>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-white">
            ₹{totalPoValue.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Across {purchaseOrders.length} Replenishment Line Items
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Total Units to Procure</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-400">
            {totalUnits.toLocaleString("en-IN")}{" "}
            <span className="text-sm font-medium text-slate-400">Units</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Calculated via Dynamic Reorder Point Formula
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Urgent Dispatch Priority</span>
            <span className="p-1.5 rounded-md bg-red-500/10 text-red-400">⚡</span>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-red-400">
            {urgentCount}{" "}
            <span className="text-sm font-medium text-slate-400">Critical POs</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Immediate Vendor Expedite Required
          </div>
        </div>
      </div>

      {/* PO Batch Action Header & Export Buttons */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              Automated Procurement Purchase Orders (PO Batch)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Fulfillment Hub: <strong className="text-slate-200">{warehouseName}</strong> • Generated via Stochastic ROP Optimization
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCsv}
              disabled={purchaseOrders.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export POs (.CSV)</span>
            </button>

            <button
              onClick={handleSimulateSendErp}
              disabled={purchaseOrders.length === 0 || poSent}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{poSent ? "Dispatched to ERP ✓" : "Sync to ERP (SAP / Odoo)"}</span>
            </button>
          </div>
        </div>

        {poSent && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>Success:</strong> Purchase order batch dispatched to enterprise ERP. Vendors notified via EDI 850 protocol.
            </span>
          </div>
        )}

        {/* PO Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">PO Identifier</th>
                <th className="py-3 px-4">SKU / Item</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Dynamic ROP</th>
                <th className="py-3 px-4">Order Qty</th>
                <th className="py-3 px-4">Unit Cost</th>
                <th className="py-3 px-4">Total Value</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No items currently require replenishment reorders.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po.poNumber} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-300">
                      {po.poNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{po.skuName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {po.skuId} • {po.category}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {po.currentStock.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-red-400">
                      {po.dynamicRop.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      +{po.recommendedOrderQty.toLocaleString()} units
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      ₹{po.unitCostInr.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      ₹{po.totalPoValueInr.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {po.expectedDeliveryDate}
                    </td>
                    <td className="py-3 px-4">
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
    </div>
  );
};
