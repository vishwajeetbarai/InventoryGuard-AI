import React, { useState, useMemo, useEffect } from "react";
import {
  PurchaseOrder,
  DispatchedPoRecord,
  InterTransferRecommendation,
  Warehouse,
  CurrencyCode,
  SkuSimulationState,
  SupplierScorecard,
} from "../types";
import { formatCurrency, convertFromInr, CURRENCIES } from "../utils/currency";
import {
  calculateGreenLogistics,
  calculateSupplierChargebacks,
  createDispatchedPoRecord,
  exportPurchaseOrdersToCsv,
  exportDispatchedLedgerToCsv,
} from "../engine/supplyChainEngine";
import { PayloadInspectModal } from "./PayloadInspectModal";
import {
  Truck,
  ArrowRightLeft,
  ShoppingBag,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  Download,
  Search,
  Filter,
  Check,
  ChevronRight,
  ChevronDown,
  X,
  Zap,
  Leaf,
  Scale,
  RefreshCw,
  Send,
  Eye,
  FileCode,
  ShieldCheck,
  SlidersHorizontal,
  ArrowRight,
  Info,
  TrendingUp,
} from "lucide-react";

interface ProcurementWorkspaceProps {
  purchaseOrders: PurchaseOrder[];
  warehouse: Warehouse;
  warehouses: Warehouse[];
  onSelectWarehouse: (id: string) => void;
  dispatchedLedger: DispatchedPoRecord[];
  onDispatchPo: (newRecord: DispatchedPoRecord) => void;
  interTransfers: InterTransferRecommendation[];
  onApproveTransfer: (id: string) => void;
  approvedTransferIds: string[];
  simulationStates: SkuSimulationState[];
  onIssueDebitNote?: (supplierName: string, amountInr: number) => void;
  currency: CurrencyCode;
  theme: "dark" | "light";
  onTriggerSimulation: () => void;
  isSimulating: boolean;
  onDownloadCsv: () => void;
  initialTab?: "ALL" | "DECISIONS" | "ORDERS" | "TRANSFERS" | "SUPPLIERS" | "po" | "transfer" | "suppliers";
  onNavigateToInventory?: (skuId?: string) => void;
}

export type ProcurementTab = "ALL" | "DECISIONS" | "ORDERS" | "TRANSFERS" | "SUPPLIERS";

export const ProcurementWorkspace: React.FC<ProcurementWorkspaceProps> = ({
  purchaseOrders,
  warehouse,
  warehouses,
  onSelectWarehouse,
  dispatchedLedger,
  onDispatchPo,
  interTransfers,
  onApproveTransfer,
  approvedTransferIds,
  simulationStates,
  onIssueDebitNote,
  currency,
  theme,
  onTriggerSimulation,
  isSimulating,
  onDownloadCsv,
  initialTab,
  onNavigateToInventory,
}) => {
  const isDark = theme === "dark";

  // Map external or initial tab string to internal ProcurementTab
  const mapTab = (tab?: string): ProcurementTab => {
    if (tab === "po" || tab === "ORDERS") return "ORDERS";
    if (tab === "transfer" || tab === "TRANSFERS") return "TRANSFERS";
    if (tab === "suppliers" || tab === "SUPPLIERS") return "SUPPLIERS";
    if (tab === "DECISIONS") return "DECISIONS";
    return "ALL";
  };

  // Navigation Filter Tab
  const [activeTab, setActiveTab] = useState<ProcurementTab>(() => mapTab(initialTab));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(mapTab(initialTab));
    }
  }, [initialTab]);

  // Search and Sub-filters
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "BUY" | "TRANSFER" | "URGENT">("ALL");
  const [supplierRiskFilter, setSupplierRiskFilter] = useState<"ALL" | "CRITICAL" | "ELEVATED" | "LOW">("ALL");

  // ERP & Dispatch State
  const [selectedErp, setSelectedErp] = useState<string>("SAP S/4HANA Cloud (EDI 850)");
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [inspectingRecord, setInspectingRecord] = useState<DispatchedPoRecord | null>(null);

  // Selected SKU for Supplier Comparison
  const [selectedComparisonSkuId, setSelectedComparisonSkuId] = useState<string>(
    simulationStates[0]?.sku.id || ""
  );

  // Modal Confirmation States (Consequential Action Safeguards)
  const [confirmPoBatchModal, setConfirmPoBatchModal] = useState<boolean>(false);
  const [confirmTransferTarget, setConfirmTransferTarget] = useState<InterTransferRecommendation | null>(null);
  const [confirmDebitSupplier, setConfirmDebitSupplier] = useState<{ name: string; amountInr: number } | null>(null);
  const [issuedDebitSuppliers, setIssuedDebitSuppliers] = useState<Set<string>>(new Set());

  // 1. Calculate Procurement KPIs (Real Application Data)
  const kpis = useMemo(() => {
    const totalPoValueInr = purchaseOrders.reduce((acc, p) => acc + p.totalPoValueInr, 0);
    const totalPoUnits = purchaseOrders.reduce((acc, p) => acc + p.recommendedOrderQty, 0);
    const urgentPosCount = purchaseOrders.filter((p) => p.priority === "URGENT").length;

    const unapprovedTransfers = interTransfers.filter((t) => !approvedTransferIds.includes(t.id));
    const totalTransferUnits = unapprovedTransfers.reduce((acc, t) => acc + t.recommendedTransferQty, 0);
    const totalNetProfitInr = unapprovedTransfers.reduce((acc, t) => acc + t.netProfitabilityInr, 0);
    const totalHoursSaved = unapprovedTransfers.reduce((acc, t) => acc + (t.leadTimeSavedHours || 48), 0);

    const chargebacks = calculateSupplierChargebacks(simulationStates);
    const highRiskSuppliersCount = simulationStates.filter(
      (s) => s.supplierScorecard.grade === "C" || s.supplierScorecard.grade === "D" || s.supplierScorecard.grade === "F"
    ).length;

    return {
      totalPoValueInr,
      totalPoUnits,
      urgentPosCount,
      pendingDecisionsCount: purchaseOrders.length + unapprovedTransfers.length,
      pendingTransfersCount: unapprovedTransfers.length,
      totalTransferUnits,
      totalNetProfitInr,
      totalHoursSaved,
      highRiskSuppliersCount,
      dispatchedCount: dispatchedLedger.length,
    };
  }, [purchaseOrders, interTransfers, approvedTransferIds, simulationStates, dispatchedLedger]);

  // 2. Buy vs. Transfer Decision Matrix
  // Evaluates every shortage item: if transfer surplus exists, recommend TRANSFER; else PURCHASE.
  const decisionMatrix = useMemo(() => {
    const decisions: {
      id: string;
      skuId: string;
      skuName: string;
      category: string;
      destWarehouseName: string;
      currentStock: number;
      usableStock: number;
      dynamicRop: number;
      recommendedQty: number;
      decisionType: "TRANSFER" | "BUY";
      sourceName: string;
      sourceDetails: string;
      leadTimeText: string;
      costText: string;
      urgency: "CRITICAL" | "NORMAL";
      reason: string;
      transferObj?: InterTransferRecommendation;
      poObj?: PurchaseOrder;
    }[] = [];

    // First map all transfer recommendations (Transfers take precedence over external POs)
    interTransfers.forEach((xfer) => {
      const isApproved = approvedTransferIds.includes(xfer.id);
      if (isApproved) return;

      decisions.push({
        id: `dec-xfer-${xfer.id}`,
        skuId: xfer.skuId,
        skuName: xfer.skuName,
        category: xfer.category,
        destWarehouseName: xfer.destWarehouseName,
        currentStock: xfer.destStock,
        usableStock: xfer.destStock,
        dynamicRop: xfer.destRop,
        recommendedQty: xfer.recommendedTransferQty,
        decisionType: "TRANSFER",
        sourceName: xfer.originWarehouseName,
        sourceDetails: `Surplus: ${xfer.originSurplusUnits} units available`,
        leadTimeText: `${xfer.transitHours}h transit (vs. ${xfer.supplierLeadTimeDays}d vendor SLA)`,
        costText: `Freight: ${formatCurrency(xfer.transitCostInr, currency)} · Loss Prevented: ${formatCurrency(xfer.stockoutLossPreventedInr, currency)}`,
        urgency: "CRITICAL",
        reason: `Excess stock identified at ${xfer.originWarehouseName}. Inter-facility rebalancing saves ${xfer.leadTimeSavedHours}h lead-time.`,
        transferObj: xfer,
      });
    });

    // Next map POs that do not already have an approved transfer
    purchaseOrders.forEach((po) => {
      const hasTransfer = interTransfers.some((t) => t.skuId === po.skuId);
      if (hasTransfer) return; // avoid duplicate card if already covered by transfer

      decisions.push({
        id: `dec-po-${po.skuId}`,
        skuId: po.skuId,
        skuName: po.skuName,
        category: po.category,
        destWarehouseName: po.warehouseName,
        currentStock: po.usableStock,
        usableStock: po.usableStock,
        dynamicRop: po.dynamicRop,
        recommendedQty: po.recommendedOrderQty,
        decisionType: "BUY",
        sourceName: po.supplierName,
        sourceDetails: `Grade ${po.supplierGrade} Supplier`,
        leadTimeText: `Est. Delivery: ${po.expectedDeliveryDate}`,
        costText: `${formatCurrency(po.totalPoValueInr, currency)} (${formatCurrency(po.unitCostInr, currency)}/unit)`,
        urgency: po.priority === "URGENT" ? "CRITICAL" : "NORMAL",
        reason: `No surplus detected across regional dark stores. Direct PO procurement required to restore safety buffer.`,
        poObj: po,
      });
    });

    return decisions;
  }, [interTransfers, purchaseOrders, approvedTransferIds, currency]);

  // Filtered Decisions
  const filteredDecisions = useMemo(() => {
    return decisionMatrix.filter((item) => {
      const matchSearch =
        item.skuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.skuId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPriority =
        priorityFilter === "ALL"
          ? true
          : priorityFilter === "BUY"
          ? item.decisionType === "BUY"
          : priorityFilter === "TRANSFER"
          ? item.decisionType === "TRANSFER"
          : item.urgency === "CRITICAL";

      return matchSearch && matchPriority;
    });
  }, [decisionMatrix, searchTerm, priorityFilter]);

  // 3. Supplier Intelligence & Scorecard Data
  const suppliersData = useMemo(() => {
    const chargebacks = calculateSupplierChargebacks(simulationStates);
    return simulationStates.map((state) => {
      const sc = state.supplierScorecard;
      const cb = chargebacks.find((c) => c.supplierName === sc.supplierName);
      return {
        state,
        sku: state.sku,
        supplierName: sc.supplierName,
        grade: sc.grade,
        onTimePct: sc.onTimeDeliveryPct,
        effectiveStdDays: sc.effectiveStdDays,
        bufferMultiplier: sc.bufferMultiplier,
        riskTier: sc.riskTier,
        leadTimeMean: state.effectiveLeadTimeMean,
        chargebackInr: cb?.totalChargebackInr || 0,
        breachHours: cb?.breachHours || 0,
        breachCount: cb?.breachCount || 0,
        hasDebitIssued: issuedDebitSuppliers.has(sc.supplierName) || cb?.status === "DEBIT_ISSUED",
      };
    });
  }, [simulationStates, issuedDebitSuppliers]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliersData.filter((item) => {
      const matchSearch =
        item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRisk =
        supplierRiskFilter === "ALL"
          ? true
          : supplierRiskFilter === "CRITICAL"
          ? item.riskTier === "CRITICAL"
          : supplierRiskFilter === "ELEVATED"
          ? item.riskTier === "ELEVATED" || item.riskTier === "MODERATE"
          : item.riskTier === "LOW";

      return matchSearch && matchRisk;
    });
  }, [suppliersData, searchTerm, supplierRiskFilter]);

  // Active Comparison SKU Data
  const comparisonSku = useMemo(() => {
    return (
      simulationStates.find((s) => s.sku.id === selectedComparisonSkuId) ||
      simulationStates[0]
    );
  }, [simulationStates, selectedComparisonSkuId]);

  // Green Logistics & ESG Metrics
  const greenLogistics = useMemo(() => {
    return calculateGreenLogistics(interTransfers);
  }, [interTransfers]);

  // Action Handlers with Confirmation Safeguards
  const handleConfirmDispatchPo = () => {
    if (purchaseOrders.length === 0) return;
    setIsDispatching(true);
    setTimeout(() => {
      const record = createDispatchedPoRecord(purchaseOrders, warehouse, selectedErp);
      onDispatchPo(record);
      setIsDispatching(false);
      setConfirmPoBatchModal(false);
    }, 400);
  };

  const handleConfirmAuthorizeTransfer = () => {
    if (!confirmTransferTarget) return;
    onApproveTransfer(confirmTransferTarget.id);
    setConfirmTransferTarget(null);
  };

  const handleConfirmIssueDebit = () => {
    if (!confirmDebitSupplier) return;
    if (onIssueDebitNote) {
      onIssueDebitNote(confirmDebitSupplier.name, confirmDebitSupplier.amountInr);
    }
    setIssuedDebitSuppliers((prev) => new Set([...prev, confirmDebitSupplier.name]));
    setConfirmDebitSupplier(null);
  };

  // CSV Exporters
  const handleExportPoCsv = () => {
    const csv = exportPurchaseOrdersToCsv(purchaseOrders);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PurchaseOrders_${warehouse.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleExportLedgerCsv = () => {
    const csv = exportDispatchedLedgerToCsv(dispatchedLedger);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DispatchedLedger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150 pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            PROCUREMENT INTELLIGENCE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white mt-0.5">
            Procurement &amp; Routing
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-1 font-medium max-w-2xl">
            Turn inventory risk into optimized purchasing and transfer decisions.
          </p>
        </div>

        {/* Right-Side Enterprise Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Facility Node Switcher */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <select
              value={warehouse.id}
              onChange={(e) => onSelectWarehouse(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isDark
                  ? "bg-neutral-900 border-neutral-700 text-neutral-100"
                  : "bg-white border-slate-300 text-slate-900 shadow-xs"
              }`}
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.city})
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Monte Carlo Simulation */}
          <button
            type="button"
            onClick={onTriggerSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isSimulating
                ? "opacity-75 cursor-not-allowed bg-emerald-600 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white"
            }`}
            title="Recalculate order quantities and inter-transfers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Recalculating..." : "Run Engine"}</span>
          </button>

          {/* Export Action */}
          <button
            type="button"
            onClick={handleExportPoCsv}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isDark
                ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                : "bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs"
            }`}
            title="Export POs to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export POs</span>
          </button>
        </div>
      </div>

      {/* 2. PROCUREMENT KPI SUMMARY (REAL CALCULATED METRICS) */}
      <section aria-label="Procurement KPI Summary">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Pending Actions */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              kpis.pendingDecisionsCount > 0
                ? isDark
                  ? "bg-emerald-950/20 border-emerald-800/40"
                  : "bg-emerald-50/70 border-emerald-200"
                : isDark
                ? "bg-neutral-900/60 border-neutral-800"
                : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 flex items-center justify-between">
              <span>Pending Decisions</span>
              {kpis.pendingDecisionsCount > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {kpis.pendingDecisionsCount}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
              {purchaseOrders.length} POs · {kpis.pendingTransfersCount} Transfers
            </div>
          </div>

          {/* Card 2: Recommended Purchase Value */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">PO Commitment</div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {formatCurrency(kpis.totalPoValueInr, currency, { compact: true })}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
              {kpis.totalPoUnits} units in queue
            </div>
          </div>

          {/* Card 3: Transfer Net Savings */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Transfer Profit Saved</div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
              {formatCurrency(kpis.totalNetProfitInr, currency, { compact: true })}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
              Stockout loss avoided
            </div>
          </div>

          {/* Card 4: Lead Time Saved */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Lead Time Saved</div>
            <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {kpis.totalHoursSaved}h
            </div>
            <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
              Faster than vendor lead-time
            </div>
          </div>

          {/* Card 5: High Risk Suppliers */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              kpis.highRiskSuppliersCount > 0
                ? isDark
                  ? "bg-rose-950/20 border-rose-900/40"
                  : "bg-rose-50/70 border-rose-200"
                : isDark
                ? "bg-neutral-900/60 border-neutral-800"
                : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">SLA Volatility</div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-700 dark:text-rose-400 mt-1">
              {kpis.highRiskSuppliersCount}
            </div>
            <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
              Grade C/D/F suppliers
            </div>
          </div>

          {/* Card 6: Dispatched PO Records */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">Dispatched Orders</div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {kpis.dispatchedCount}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
              ERP confirmed sync
            </div>
          </div>
        </div>
      </section>

      {/* 3. WORKSPACE NAVIGATION TABS */}
      <div
        className={`p-1.5 rounded-xl border flex items-center gap-1.5 w-fit flex-wrap ${
          isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-slate-100 border-slate-200"
        }`}
        aria-label="Procurement Workspace Tabs"
      >
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "ALL"
              ? isDark
                ? "bg-neutral-800 text-white shadow-xs font-bold"
                : "bg-white text-slate-950 shadow-xs font-bold"
              : isDark
              ? "text-neutral-400 hover:text-white"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          <span>All Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DECISIONS")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "DECISIONS"
              ? isDark
                ? "bg-neutral-800 text-white shadow-xs font-bold"
                : "bg-white text-slate-950 shadow-xs font-bold"
              : isDark
              ? "text-neutral-400 hover:text-white"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Decision Matrix (Buy vs Transfer)</span>
          {decisionMatrix.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              {decisionMatrix.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ORDERS")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "ORDERS"
              ? isDark
                ? "bg-neutral-800 text-white shadow-xs font-bold"
                : "bg-white text-slate-950 shadow-xs font-bold"
              : isDark
              ? "text-neutral-400 hover:text-white"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
          <span>Purchase Orders Pipeline</span>
          {purchaseOrders.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              {purchaseOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TRANSFERS")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "TRANSFERS"
              ? isDark
                ? "bg-neutral-800 text-white shadow-xs font-bold"
                : "bg-white text-slate-950 shadow-xs font-bold"
              : isDark
              ? "text-neutral-400 hover:text-white"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
          <span>Inter-Store Transfers</span>
          {kpis.pendingTransfersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              {kpis.pendingTransfersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SUPPLIERS")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "SUPPLIERS"
              ? isDark
                ? "bg-neutral-800 text-white shadow-xs font-bold"
                : "bg-white text-slate-950 shadow-xs font-bold"
              : isDark
              ? "text-neutral-400 hover:text-white"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          <Award className="w-3.5 h-3.5 text-purple-500" />
          <span>Supplier Intelligence Matrix</span>
        </button>
      </div>

      {/* 4. PRIORITY PROCUREMENT DECISIONS: BUY VS TRANSFER MATRIX */}
      {(activeTab === "ALL" || activeTab === "DECISIONS") && (
        <section
          className={`p-5 sm:p-6 rounded-2xl border transition-colors shadow-xs ${
            isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
          }`}
          aria-label="Procurement Priorities"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white">
                  Procurement Priorities &amp; Sourcing Decisions
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 font-medium">
                System recommendations based on inventory demand, stockout risk, vendor reliability, and dark store surplus.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPriorityFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  priorityFilter === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : isDark
                    ? "text-neutral-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Decisions ({decisionMatrix.length})
              </button>
              <button
                type="button"
                onClick={() => setPriorityFilter("TRANSFER")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  priorityFilter === "TRANSFER"
                    ? "bg-blue-600 text-white"
                    : isDark
                    ? "text-blue-400 hover:bg-blue-950/40"
                    : "text-blue-700 hover:bg-blue-50"
                }`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Transfer Recommended</span>
              </button>
              <button
                type="button"
                onClick={() => setPriorityFilter("BUY")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  priorityFilter === "BUY"
                    ? "bg-emerald-600 text-white"
                    : isDark
                    ? "text-emerald-400 hover:bg-emerald-950/40"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>PO Purchase Required</span>
              </button>
            </div>
          </div>

          {/* Decision Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {filteredDecisions.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-xs text-slate-500 dark:text-neutral-400">
                No active procurement recommendations currently match your filter.
              </div>
            ) : (
              filteredDecisions.map((dec) => (
                <div
                  key={dec.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
                    dec.decisionType === "TRANSFER"
                      ? isDark
                        ? "bg-blue-950/15 border-blue-900/40"
                        : "bg-blue-50/50 border-blue-200"
                      : isDark
                      ? "bg-neutral-950/50 border-neutral-800"
                      : "bg-slate-50/70 border-slate-200"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: SKU + Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-950 dark:text-white">
                            {dec.skuName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                            {dec.skuId}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          Node: {dec.destWarehouseName} · Category: {dec.category}
                        </div>
                      </div>

                      {dec.decisionType === "TRANSFER" ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5 shrink-0">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>TRANSFER RECOMMENDED</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>PURCHASE FROM VENDOR</span>
                        </span>
                      )}
                    </div>

                    {/* Middle: Shortage & Source Details */}
                    <div
                      className={`p-3 rounded-lg border text-xs grid grid-cols-2 gap-3 ${
                        isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
                      }`}
                    >
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase font-semibold">
                          Source
                        </span>
                        <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                          {dec.sourceName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          {dec.sourceDetails}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase font-semibold">
                          Required Quantity
                        </span>
                        <div className="font-extrabold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                          +{dec.recommendedQty} units
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          Current buffer: {dec.usableStock} / ROP: {dec.dynamicRop}
                        </div>
                      </div>
                    </div>

                    {/* Reason statement */}
                    <div className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed font-medium">
                      <strong className="text-slate-900 dark:text-white">Why: </strong>
                      {dec.reason}
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                      {dec.leadTimeText} · {dec.costText}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-slate-200/60 dark:border-neutral-800/80 flex items-center justify-between gap-3 mt-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedComparisonSkuId(dec.skuId)}
                        className="text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Compare Sourcing</span>
                      </button>

                      {onNavigateToInventory && (
                        <button
                          type="button"
                          onClick={() => onNavigateToInventory(dec.skuId)}
                          className="text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer flex items-center gap-1"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>View Forecast</span>
                        </button>
                      )}
                    </div>

                    {dec.decisionType === "TRANSFER" && dec.transferObj && (
                      <button
                        type="button"
                        onClick={() => setConfirmTransferTarget(dec.transferObj!)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Authorize Transfer</span>
                      </button>
                    )}

                    {dec.decisionType === "BUY" && dec.poObj && (
                      <button
                        type="button"
                        onClick={() => setConfirmPoBatchModal(true)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Create &amp; Dispatch PO</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* 5. INTER-STORE TRANSFERS & ROUTING VISUALIZATION */}
      {(activeTab === "ALL" || activeTab === "TRANSFERS") && (
        <section
          className={`p-5 sm:p-6 rounded-2xl border transition-colors shadow-xs ${
            isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
          }`}
          aria-label="Inventory Transfers and Routing"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white">
                  Inventory Transfers &amp; EV Multi-Echelon Routing
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 font-medium">
                Move available surplus inventory between dark stores before placing external supplier purchase orders.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <Leaf className="w-3.5 h-3.5" />
              <span>ESG: {greenLogistics.netCo2SavedKg}kg CO₂ Avoided (AAA Rating)</span>
            </div>
          </div>

          {/* Operational Transfer Cards */}
          <div className="space-y-3 mt-4">
            {interTransfers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-neutral-400">
                No active transfer requirements detected. Regional dark stores are currently at equilibrium.
              </div>
            ) : (
              interTransfers.map((xfer) => {
                const isApproved = approvedTransferIds.includes(xfer.id);

                return (
                  <div
                    key={xfer.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      isApproved
                        ? isDark
                          ? "bg-emerald-950/20 border-emerald-800/40 opacity-75"
                          : "bg-emerald-50/50 border-emerald-200 opacity-75"
                        : isDark
                        ? "bg-neutral-950/60 border-neutral-800"
                        : "bg-slate-50/70 border-slate-200"
                    }`}
                  >
                    {/* Routing Segment Graphic */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Origin Node */}
                      <div className="text-left shrink-0">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Origin Hub</div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {xfer.originWarehouseName}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          Surplus: {xfer.originSurplusUnits}u
                        </div>
                      </div>

                      {/* Direction Arrow & Transfer Details */}
                      <div className="flex-1 flex flex-col items-center px-2">
                        <span className="text-[10px] font-mono font-extrabold text-blue-600 dark:text-blue-400 mb-0.5">
                          {xfer.recommendedTransferQty} units ({xfer.skuName})
                        </span>
                        <div className="w-full flex items-center">
                          <div className="h-0.5 flex-1 bg-blue-500/40" />
                          <ArrowRight className="w-4 h-4 text-blue-500 shrink-0 -ml-1" />
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
                          ETA: {xfer.transitHours}h transit · {xfer.leadTimeSavedHours}h saved
                        </span>
                      </div>

                      {/* Destination Node */}
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Deficit Hub</div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {xfer.destWarehouseName}
                        </div>
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">
                          Deficit: {xfer.destRop - xfer.destStock}u
                        </div>
                      </div>
                    </div>

                    {/* Financial Return & Action */}
                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-neutral-800">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          +{formatCurrency(xfer.netProfitabilityInr, currency)} Net Profit
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Freight: {formatCurrency(xfer.transitCostInr, currency)}
                        </div>
                      </div>

                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Authorized</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmTransferTarget(xfer)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Authorize</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* 6. SUPPLIER INTELLIGENCE & RELIABILITY MATRIX */}
      {(activeTab === "ALL" || activeTab === "SUPPLIERS") && (
        <section
          className={`p-5 sm:p-6 rounded-2xl border transition-colors shadow-xs ${
            isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
          }`}
          aria-label="Supplier Intelligence Matrix"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white">
                  Supplier Intelligence &amp; SLA Reliability Scorecard
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 font-medium">
                Vendor fulfillment variance propagates directly into safety stock buffer multipliers (&sigma;<sub>L</sub>).
              </p>
            </div>

            {/* Risk Tier Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSupplierRiskFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  supplierRiskFilter === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : isDark
                    ? "text-neutral-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Suppliers ({suppliersData.length})
              </button>
              <button
                type="button"
                onClick={() => setSupplierRiskFilter("CRITICAL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  supplierRiskFilter === "CRITICAL"
                    ? "bg-rose-600 text-white"
                    : isDark
                    ? "text-rose-400 hover:bg-rose-950/40"
                    : "text-rose-700 hover:bg-rose-50"
                }`}
              >
                Critical Risk (Grade C/D/F)
              </button>
            </div>
          </div>

          {/* Supplier Table */}
          <div className="overflow-x-auto w-full mt-4">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr
                  className={`border-b font-semibold uppercase tracking-wider text-[11px] ${
                    isDark
                      ? "bg-neutral-950/80 border-neutral-800 text-neutral-400"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <th className="py-3 px-4">Supplier Partner</th>
                  <th className="py-3 px-4">Primary Sourced SKU</th>
                  <th className="py-3 px-4 text-center">Reliability Grade</th>
                  <th className="py-3 px-4 text-right">On-Time Delivery</th>
                  <th className="py-3 px-4 text-right">Lead Time (Mean ± Std)</th>
                  <th className="py-3 px-4 text-right">Buffer Multiplier</th>
                  <th className="py-3 px-4 text-right">SLA Chargebacks</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {filteredSuppliers.map((supp) => {
                  const isCrit = supp.riskTier === "CRITICAL";

                  return (
                    <tr
                      key={supp.supplierName}
                      className={`transition-colors ${
                        isCrit
                          ? isDark
                            ? "bg-rose-950/10 hover:bg-rose-950/20"
                            : "bg-rose-50/30 hover:bg-rose-50/50"
                          : isDark
                          ? "hover:bg-neutral-800/40"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {supp.supplierName}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-neutral-200">
                          {supp.sku.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {supp.sku.id} · {supp.sku.category}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${
                            supp.grade === "A"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                              : supp.grade === "B"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                              : supp.grade === "C"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                          }`}
                        >
                          Grade {supp.grade}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            supp.onTimePct >= 95
                              ? "text-emerald-600 dark:text-emerald-400"
                              : supp.onTimePct >= 85
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {supp.onTimePct}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-neutral-300">
                        {supp.leadTimeMean.toFixed(1)}d (±{supp.effectiveStdDays}d)
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {supp.bufferMultiplier}x
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        {supp.chargebackInr > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            {formatCurrency(supp.chargebackInr, currency)}
                            <span className="block text-[10px] font-normal text-slate-400">
                              {supp.breachHours}h delay
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0 (Zero Breach)</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {supp.chargebackInr > 0 && (
                          <button
                            type="button"
                            disabled={supp.hasDebitIssued}
                            onClick={() =>
                              setConfirmDebitSupplier({
                                name: supp.supplierName,
                                amountInr: supp.chargebackInr,
                              })
                            }
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                              supp.hasDebitIssued
                                ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-neutral-800 text-slate-500"
                                : "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                            }`}
                          >
                            {supp.hasDebitIssued ? "Debit Issued" : "Issue Debit Note"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 7. SUPPLIER COMPARISON BENCHMARK (FOR SELECTED SKU) */}
      {comparisonSku && (
        <section
          className={`p-5 rounded-2xl border transition-colors shadow-xs ${
            isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-white border-slate-200"
          }`}
          aria-label="Supplier Comparison"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800">
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                SOURCING BENCHMARK
              </div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white mt-0.5">
                Multi-Supplier Benchmark: {comparisonSku.sku.name} ({comparisonSku.sku.id})
              </h3>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
              <span>Select SKU:</span>
              <select
                value={selectedComparisonSkuId}
                onChange={(e) => setSelectedComparisonSkuId(e.target.value)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                  isDark ? "bg-neutral-950 border-neutral-700 text-neutral-100" : "bg-white border-slate-300 text-slate-900"
                }`}
              >
                {simulationStates.map((s) => (
                  <option key={s.sku.id} value={s.sku.id}>
                    {s.sku.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Primary Vendor Card */}
            <div
              className={`p-4 rounded-xl border ${
                isDark ? "bg-neutral-950/70 border-emerald-800/40" : "bg-emerald-50/40 border-emerald-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Primary Contracted Vendor
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  Recommended
                </span>
              </div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                {comparisonSku.sku.supplierName}
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Unit Price:</span>
                  <span className="font-mono font-bold">{formatCurrency(comparisonSku.sku.basePrice, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Lead Time:</span>
                  <span className="font-mono">{comparisonSku.effectiveLeadTimeMean.toFixed(1)} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">On-Time SLA:</span>
                  <span className="font-mono text-emerald-600 font-bold">{comparisonSku.supplierScorecard.onTimeDeliveryPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Buffer Multiplier:</span>
                  <span className="font-mono">{comparisonSku.supplierScorecard.bufferMultiplier}x</span>
                </div>
              </div>
            </div>

            {/* Secondary Dual-Sourcing Benchmark 1 */}
            <div
              className={`p-4 rounded-xl border ${
                isDark ? "bg-neutral-950/70 border-neutral-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Secondary Backup Supplier
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                  Dual-Sourcing
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                Apex Direct Logistics
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Unit Price:</span>
                  <span className="font-mono font-bold">{formatCurrency(comparisonSku.sku.basePrice * 1.05, currency)} (+5%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Lead Time:</span>
                  <span className="font-mono text-emerald-600 font-bold">1.8 days (Expedited)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">On-Time SLA:</span>
                  <span className="font-mono text-blue-600 font-bold">98.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Buffer Multiplier:</span>
                  <span className="font-mono">1.0x</span>
                </div>
              </div>
            </div>

            {/* Inter-Store Transfer Sourcing Option */}
            <div
              className={`p-4 rounded-xl border ${
                isDark ? "bg-neutral-950/70 border-blue-900/40" : "bg-blue-50/40 border-blue-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Internal Dark Store Transfer
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400">
                  Zero Supplier Cost
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                Network Rebalance (Surplus Node)
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Freight Transit:</span>
                  <span className="font-mono font-bold text-blue-600">3–6 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Unit Cost:</span>
                  <span className="font-mono">₹0 (Internal Stock)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Stockout Risk:</span>
                  <span className="font-mono text-emerald-600 font-bold">0% (Immediate relief)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">Carbon Footprint:</span>
                  <span className="font-mono text-emerald-600">EV Fleet (0g CO₂)</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 8. PURCHASE ORDER PIPELINE & AUDIT LEDGER */}
      {(activeTab === "ALL" || activeTab === "ORDERS") && (
        <section
          className={`p-5 sm:p-6 rounded-2xl border transition-colors shadow-xs ${
            isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
          }`}
          aria-label="Purchase Order Pipeline"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white">
                  Purchase Order Pipeline &amp; ERP Dispatch
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 font-medium">
                Automated PO generation, EDI 850 transmission, and cryptographic audit records.
              </p>
            </div>

            {/* ERP Connector Selector & Dispatch Button */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={selectedErp}
                onChange={(e) => setSelectedErp(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  isDark ? "bg-neutral-950 border-neutral-700 text-neutral-200" : "bg-slate-50 border-slate-300 text-slate-700"
                }`}
              >
                <option value="SAP S/4HANA Cloud (EDI 850)">SAP S/4HANA Cloud (EDI 850)</option>
                <option value="Oracle NetSuite SuiteTalk REST">Oracle NetSuite SuiteTalk REST</option>
                <option value="Microsoft Dynamics 365 OData">Microsoft Dynamics 365 OData</option>
                <option value="Custom WMS HTTPS Webhook">Custom WMS HTTPS Webhook</option>
              </select>

              <button
                type="button"
                onClick={() => setConfirmPoBatchModal(true)}
                disabled={purchaseOrders.length === 0 || isDispatching}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  purchaseOrders.length === 0
                    ? "opacity-50 cursor-not-allowed bg-slate-300 dark:bg-neutral-800 text-slate-500"
                    : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isDispatching ? "Transmitting..." : `Dispatch Batch (${purchaseOrders.length} POs)`}</span>
              </button>
            </div>
          </div>

          {/* Active PO Batch Table */}
          <div className="overflow-x-auto w-full mt-4">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr
                  className={`border-b font-semibold uppercase tracking-wider text-[11px] ${
                    isDark
                      ? "bg-neutral-950/80 border-neutral-800 text-neutral-400"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <th className="py-3 px-4">PO Batch Reference</th>
                  <th className="py-3 px-4">SKU Code &amp; Item</th>
                  <th className="py-3 px-4">Supplier Partner</th>
                  <th className="py-3 px-4 text-right">Order Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total Commitment</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-right">Expected Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-xs text-slate-500 dark:text-neutral-400">
                      No purchase orders currently pending for this warehouse facility.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.skuId} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {po.poNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{po.skuName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{po.category}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-neutral-200">{po.supplierName}</div>
                        <div className="text-[10px] text-slate-400">Grade {po.supplierGrade}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        +{po.recommendedOrderQty} units
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-neutral-300">
                        {formatCurrency(po.unitCostInr, currency)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(po.totalPoValueInr, currency)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            po.priority === "URGENT"
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                              : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300"
                          }`}
                        >
                          {po.priority}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-neutral-300">
                        {po.expectedDeliveryDate}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Dispatched Audit Records Ledger */}
          {dispatchedLedger.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-neutral-800">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                    Cryptographic Dispatched Ledger ({dispatchedLedger.length} Dispatched Batches)
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleExportLedgerCsv}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Ledger CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-b font-semibold uppercase tracking-wider text-[11px] ${
                        isDark
                          ? "bg-neutral-950/80 border-neutral-800 text-neutral-400"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <th className="py-2.5 px-3">Batch ID</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">ERP Connector</th>
                      <th className="py-2.5 px-3 text-right">Items</th>
                      <th className="py-2.5 px-3 text-right">Total Commitment</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 font-mono">SHA-256 Hash</th>
                      <th className="py-2.5 px-3 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {dispatchedLedger.slice(0, 5).map((rec) => (
                      <tr key={rec.dispatchId} className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {rec.poBatchNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {rec.timestamp.replace("T", " ").slice(0, 19)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-neutral-300">
                          {rec.erpSystem.split(" ")[0]}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{rec.itemCount} SKUs</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {formatCurrency(rec.totalValueInr, currency)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono">
                            HTTP {rec.httpStatus} OK ({rec.latencyMs}ms)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title={rec.payloadHash}>
                          {rec.payloadHash.slice(0, 16)}...
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectingRecord(rec)}
                            className="p-1 rounded text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                            title="Inspect EDI 850 and JSON Payload"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 9. CONSEQUENTIAL ACTION CONFIRMATION MODALS */}

      {/* Confirmation 1: Purchase Order Batch Dispatch to ERP */}
      {confirmPoBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setConfirmPoBatchModal(false)} />
          <div
            className={`relative max-w-lg w-full rounded-2xl p-6 shadow-2xl border space-y-4 z-10 ${
              isDark ? "bg-[#09090B] border-neutral-800 text-neutral-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Confirm Purchase Order Dispatch</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Transmit EDI 850 procurement order batch to {selectedErp}.
                </p>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Destination Facility:</span>
                <strong className="font-semibold text-slate-900 dark:text-white">{warehouse.name} ({warehouse.city})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Total Purchase Orders:</span>
                <span className="font-mono font-bold">{purchaseOrders.length} PO lines</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Total Units to Procure:</span>
                <span className="font-mono font-bold text-emerald-600">+{kpis.totalPoUnits} units</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-neutral-800 pt-2 text-sm font-bold">
                <span>Total Financial Commitment:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(kpis.totalPoValueInr, currency)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
              Upon confirmation, an immutable SHA-256 audit record will be written to the compliance ledger and the EDI 850 document will be submitted to {selectedErp}.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPoBatchModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                  isDark ? "border-neutral-700 hover:bg-neutral-800 text-neutral-300" : "border-slate-300 hover:bg-slate-100 text-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatchPo}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
              >
                Confirm &amp; Transmit to ERP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation 2: Inter-Store Transfer Authorization */}
      {confirmTransferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setConfirmTransferTarget(null)} />
          <div
            className={`relative max-w-lg w-full rounded-2xl p-6 shadow-2xl border space-y-4 z-10 ${
              isDark ? "bg-[#09090B] border-neutral-800 text-neutral-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Authorize Inter-Store Transfer</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Execute internal dark store inventory rebalance.
                </p>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Item:</span>
                <strong className="font-bold text-slate-900 dark:text-white">
                  {confirmTransferTarget.skuName} ({confirmTransferTarget.skuId})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Source Surplus Node:</span>
                <span className="font-semibold">{confirmTransferTarget.originWarehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Destination Hub:</span>
                <span className="font-semibold">{confirmTransferTarget.destWarehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Transfer Units:</span>
                <span className="font-mono font-bold text-blue-600">+{confirmTransferTarget.recommendedTransferQty} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Transit Duration:</span>
                <span className="font-mono">{confirmTransferTarget.transitHours}h (EV Fleet)</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-neutral-800 pt-2 text-sm font-bold">
                <span>Net Stockout Loss Prevented:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  +{formatCurrency(confirmTransferTarget.netProfitabilityInr, currency)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmTransferTarget(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                  isDark ? "border-neutral-700 hover:bg-neutral-800 text-neutral-300" : "border-slate-300 hover:bg-slate-100 text-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAuthorizeTransfer}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition-colors cursor-pointer"
              >
                Confirm &amp; Dispatch Fleet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation 3: SLA Liquidated Damages Debit Note */}
      {confirmDebitSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setConfirmDebitSupplier(null)} />
          <div
            className={`relative max-w-lg w-full rounded-2xl p-6 shadow-2xl border space-y-4 z-10 ${
              isDark ? "bg-[#09090B] border-neutral-800 text-neutral-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/10 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Issue SLA Liquidated Damages Debit Note</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Transmit supplier chargeback to ERP Accounts Payable.
                </p>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Supplier:</span>
                <strong className="font-bold text-slate-900 dark:text-white">{confirmDebitSupplier.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-neutral-400">Breach Reason:</span>
                <span>Persistent lead-time SLA delay (&gt;24h breach)</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-neutral-800 pt-2 text-sm font-bold">
                <span>Chargeback Amount:</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  {formatCurrency(confirmDebitSupplier.amountInr, currency)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDebitSupplier(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                  isDark ? "border-neutral-700 hover:bg-neutral-800 text-neutral-300" : "border-slate-300 hover:bg-slate-100 text-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmIssueDebit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition-colors cursor-pointer"
              >
                Issue Formal Debit Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payload Inspection Modal (EDI 850 & JSON Payload Inspector) */}
      <PayloadInspectModal
        record={inspectingRecord}
        onClose={() => setInspectingRecord(null)}
        theme={theme}
      />
    </div>
  );
};
