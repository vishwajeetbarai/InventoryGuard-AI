import React from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Truck,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Layers,
  AlertCircle,
  FileCheck2,
  Award,
} from "lucide-react";
import {
  SkuSimulationState,
  InterTransferRecommendation,
  PurchaseOrder,
  Warehouse,
  CurrencyCode,
} from "../types";
import { formatCurrency } from "../utils/currency";

interface OperationalAlertsProps {
  simulationStates: SkuSimulationState[];
  interTransfers: InterTransferRecommendation[];
  purchaseOrders: PurchaseOrder[];
  currentWarehouse: Warehouse;
  currency: CurrencyCode;
  theme?: "dark" | "light";
  onNavigateToPo: (skuId?: string) => void;
  onNavigateToTransfers: () => void;
  onNavigateToSuppliers: () => void;
  onNavigateToInventory: (skuId?: string) => void;
  onApproveTransfer: (transferId: string) => void;
}

export const OperationalAlerts: React.FC<OperationalAlertsProps> = ({
  simulationStates,
  interTransfers,
  purchaseOrders,
  currentWarehouse,
  currency,
  theme = "light",
  onNavigateToPo,
  onNavigateToTransfers,
  onNavigateToSuppliers,
  onNavigateToInventory,
  onApproveTransfer,
}) => {
  const isDark = theme === "dark";

  // 1. Critical Stock-Out SKUs (Urgent replenishment needed)
  const criticalSkus = simulationStates.filter(
    (s) =>
      s.mcResult.urgency === "CRITICAL REORDER NOW" ||
      s.mcResult.stockoutProbabilityPct >= 50
  );

  const totalCriticalRevenueAtRisk = criticalSkus.reduce(
    (acc, s) => acc + s.revenueAtRisk,
    0
  );

  // 2. High Perishable Shelf-Life Decay SKUs
  const decayingSkus = simulationStates.filter(
    (s) => s.decayedUnits > 0 || (s.sku.shelfLifeDays <= 7 && s.decayRatePct > 0.05)
  );

  const totalDecayCost = decayingSkus.reduce(
    (acc, s) => acc + s.decayedUnits * s.sku.basePrice,
    0
  );

  // 3. Supplier Jitter / Risk (Grade D or F, or buffer multiplier >= 1.25)
  const supplierRiskSkus = simulationStates.filter(
    (s) =>
      s.supplierScorecard &&
      (s.supplierScorecard.grade === "D" ||
        s.supplierScorecard.grade === "F" ||
        s.supplierScorecard.bufferMultiplier >= 1.25)
  );

  const totalAlertsCount =
    criticalSkus.length +
    (interTransfers.length > 0 ? 1 : 0) +
    (decayingSkus.length > 0 ? 1 : 0) +
    (supplierRiskSkus.length > 0 ? 1 : 0);

  return (
    <div
      className={`border rounded-xl p-5 shadow-xs transition-colors ${
        isDark
          ? "bg-neutral-900 border-neutral-800 text-neutral-100"
          : "bg-white border-slate-300 text-slate-900"
      }`}
    >
      {/* Header bar of Section D */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              criticalSkus.length > 0
                ? isDark
                  ? "bg-rose-500/15 text-rose-400"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
                : isDark
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {criticalSkus.length > 0 ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-950 dark:text-white">
                Operational Risk Matrix &amp; High-Priority Action Queue
              </h2>
              <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                {totalAlertsCount > 0 ? `${totalAlertsCount} Actionable Events` : "All Clear"}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5 font-medium">
              Real-time actionable events prioritized by financial revenue leakage and fulfillment urgency at {currentWarehouse.name}.
            </p>
          </div>
        </div>

        {/* Global Quick Action Links */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {criticalSkus.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateToPo()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Review {criticalSkus.length} Urgent POs</span>
            </button>
          )}

          {interTransfers.length > 0 && (
            <button
              type="button"
              onClick={onNavigateToTransfers}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? "border-neutral-700 hover:bg-neutral-800 text-neutral-200"
                  : "border-slate-300 hover:bg-slate-100 text-slate-800"
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
              <span>Transfers ({interTransfers.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Actionable Alerts */}
      <div className="mt-4 space-y-3">
        {/* ALERT 1: CRITICAL STOCK-OUT RISKS */}
        {criticalSkus.length > 0 && (
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isDark
                ? "bg-neutral-950/70 border-rose-900/60 text-neutral-200"
                : "bg-rose-50/50 border-rose-200 text-slate-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-pulse" />
              <div>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    Critical Stockout Deficit
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold text-slate-950 dark:text-white">
                    {criticalSkus.length} SKU{criticalSkus.length > 1 ? "s" : ""} Below Safety Stock Threshold
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">
                    {formatCurrency(totalCriticalRevenueAtRisk, currency)} revenue at risk
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-neutral-400 mt-1.5 flex flex-wrap items-center gap-2 font-medium">
                  {criticalSkus.slice(0, 3).map((skuState) => (
                    <span
                      key={skuState.sku.id}
                      className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800"
                    >
                      <strong className="text-slate-900 dark:text-white font-sans">{skuState.sku.name}</strong>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        {skuState.usableStock} left (ROP: {skuState.mcResult.dynamicRop})
                      </span>
                    </span>
                  ))}
                  {criticalSkus.length > 3 && (
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                      +{criticalSkus.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={() => onNavigateToPo(criticalSkus[0]?.sku.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>Generate PO Batch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ALERT 2: INTER-DARK STORE REBALANCE RECOMMENDATION */}
        {interTransfers.length > 0 && (
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isDark
                ? "bg-neutral-950/70 border-amber-900/60 text-neutral-200"
                : "bg-amber-50/50 border-amber-200 text-slate-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    Cross-Hub Transfer Opportunity
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold text-slate-950 dark:text-white">
                    {interTransfers[0].originWarehouseName} has surplus stock for {interTransfers[0].destWarehouseName}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{formatCurrency(interTransfers[0].netProfitabilityInr, currency)} net gain
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-neutral-400 mt-1.5 font-medium">
                  Transfer <strong>{interTransfers[0].recommendedTransferQty} units</strong> of {interTransfers[0].skuName} via high-speed corridor (~{interTransfers[0].transitHours}h transit). Eliminates stockout risk without placing an external vendor purchase order.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={() => onApproveTransfer(interTransfers[0].id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Transfer</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToTransfers}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isDark
                    ? "border-neutral-700 hover:bg-neutral-800 text-neutral-200"
                    : "border-slate-300 hover:bg-slate-100 text-slate-800"
                }`}
              >
                <span>View All ({interTransfers.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* ALERT 3: PERISHABLE SHELF-LIFE DECAY WARNING */}
        {decayingSkus.length > 0 && (
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isDark
                ? "bg-neutral-950/70 border-neutral-800 text-neutral-200"
                : "bg-slate-50/70 border-slate-300 text-slate-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    Shelf-Life Decay Monitoring
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold text-slate-950 dark:text-white">
                    {decayingSkus.length} Perishable Item{decayingSkus.length > 1 ? "s" : ""} Approaching Spoilage
                  </span>
                  {totalDecayCost > 0 && (
                    <>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-700 dark:text-neutral-300">
                        {formatCurrency(totalDecayCost, currency)} potential spoilage
                      </span>
                    </>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-neutral-400 mt-1.5 font-medium">
                  {decayingSkus[0].sku.name} has <strong>{decayingSkus[0].decayedUnits} units</strong> degraded ({(decayingSkus[0].decayRatePct * 100).toFixed(1)}% decay rate). Usable stock adjusted dynamically to avoid dispatching stale product to quick-commerce buyers.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={() => onNavigateToInventory(decayingSkus[0].sku.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                  isDark
                    ? "border-neutral-700 hover:bg-neutral-800 text-neutral-200"
                    : "border-slate-300 hover:bg-slate-100 text-slate-800"
                }`}
              >
                <span>Inspect Expiry Curve</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ALERT 4: SUPPLIER RELIABILITY JITTER */}
        {supplierRiskSkus.length > 0 && (
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isDark
                ? "bg-neutral-950/70 border-neutral-800 text-neutral-200"
                : "bg-slate-50/70 border-slate-300 text-slate-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    Vendor Lead-Time Volatility
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold text-slate-950 dark:text-white">
                    {supplierRiskSkus[0].supplierScorecard.supplierName} (Grade {supplierRiskSkus[0].supplierScorecard.grade})
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-slate-700 dark:text-neutral-300">
                    {supplierRiskSkus[0].supplierScorecard.onTimeDeliveryPct}% on-time
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-neutral-400 mt-1.5 font-medium">
                  Dual-variance engine expanded safety buffer by <strong>{supplierRiskSkus[0].supplierScorecard.bufferMultiplier}x</strong> to prevent lead-time delivery jitter from triggering stockouts.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={onNavigateToSuppliers}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                  isDark
                    ? "border-neutral-700 hover:bg-neutral-800 text-neutral-200"
                    : "border-slate-300 hover:bg-slate-100 text-slate-800"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Supplier Scorecard</span>
              </button>
            </div>
          </div>
        )}

        {/* ALL CLEAR STATE */}
        {criticalSkus.length === 0 && interTransfers.length === 0 && decayingSkus.length === 0 && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              isDark
                ? "bg-emerald-950/20 border-emerald-900/40 text-neutral-200"
                : "bg-emerald-50/70 border-emerald-200 text-slate-900"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-950 dark:text-white">
                All Inventory Corridors &amp; SKUs Operating at Equilibrium
              </div>
              <div className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5 font-medium">
                No active stockout breaches detected for {currentWarehouse.name}. Dynamic safety stocks and supplier buffers are fully synchronized.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
