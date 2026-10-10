import React, { useState, useMemo, useEffect } from "react";
import {
  WAREHOUSES,
  SKUS,
  generateSyntheticHistoricalData,
  executeSupplyChainEngine,
  generatePurchaseOrders,
  evaluateInterWarehouseTransfers,
  getInitialDispatchedLedger,
  calculateMarkdownLiquidation,
  calculateDemandCannibalization,
} from "./engine/supplyChainEngine";
import { Header } from "./components/Header";
import { SidebarControls } from "./components/SidebarControls";
import { KpiMetrics } from "./components/KpiMetrics";
import { VisualAnalytics } from "./components/VisualAnalytics";
import { RiskTable } from "./components/RiskTable";
import { DynamicMarkdownCard } from "./components/DynamicMarkdownCard";
import { SubstitutionCard } from "./components/SubstitutionCard";
import { PoGenerator } from "./components/PoGenerator";
import { InterTransferView } from "./components/InterTransferView";
import { SupplierScorecardView } from "./components/SupplierScorecardView";
import { SourceCodeViewer } from "./components/SourceCodeViewer";
import { NetworkTopologyMap } from "./components/NetworkTopologyMap";
import { ToastContainer, ToastItem } from "./components/ToastContainer";
import { CommandPaletteModal } from "./components/CommandPaletteModal";
import { ExecutiveReportModal } from "./components/ExecutiveReportModal";
import { generateSupplyChainAuditCsv, triggerCsvDownload } from "./utils/exportCsv";
import { DispatchedPoRecord, ReorderPolicy } from "./types";
import {
  TrendingUp,
  Table,
  FileCheck2,
  Code2,
  ArrowRightLeft,
  Award,
  ShieldCheck,
  Navigation,
} from "lucide-react";

const SERVICE_LEVELS = [
  { label: "90.0% - Budget", z: 1.282, desc: "Low-cost non-critical buffer" },
  { label: "95.0% - Standard", z: 1.645, desc: "Industry benchmark standard" },
  { label: "98.0% - Premium", z: 2.054, desc: "High customer retention" },
  { label: "99.0% - Mission Critical", z: 2.326, desc: "Zero cart-drop tolerance" },
  { label: "99.5% - Flawless", z: 2.576, desc: "Max inventory protection" },
];

const REQUIREMENTS_TXT = `streamlit>=1.35.0
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
plotly>=5.18.0
scipy>=1.11.0
requests>=2.31.0
`;

const README_MD = `# 📦 Multi-Source Supply Chain & Inventory Stock-Out Forecaster
### *Production-Grade Predictive Inventory Optimization, Monte Carlo Risk, Perishable Decay & Supplier Scorecards*

## 🚀 Problem Statement & Architecture
Quick-commerce platforms (Zepto, Blinkit, Instamart) face severe revenue leakage due to inventory stock-outs.
Static heuristics fail because they ignore demand variance, perishable shelf-life decay, and supplier delivery delays.

This platform bridges:
1. **LightGBM / Scikit-Learn GradientBoostingRegressor** for multi-step daily demand forecasting.
2. **Dual-Variance Dynamic Safety Stock**:
   $$SS = Z \\times \\sqrt{\\bar{L} \\cdot \\sigma_d^2 + \\bar{D}^2 \\cdot \\sigma_L^2}$$
3. **Perishable Batch Decay & Expiry Engine**:
   - Models batch age & shelf-life degradation ($\delta_{\\text{decay}}$) for perishables (Organic Milk, Yogurt, Hass Avocados).
   - Reorder points and Monte Carlo stock-out risks are evaluated against **Usable Stock** rather than nominal expired inventory.
4. **Supplier Reliability Matrix**:
   - Grades vendors (Grade A to F) based on lead-time variance ($\sigma_L$).
   - Automatically expands buffer multipliers ($1.0\\times$ to $1.8\\times$) based on supplier reliability risk.
5. **Multi-Echelon Dark Store Inter-Transfer Engine**:
   - Fulfills critical stock-outs within 3–6 hours using neighboring dark store surplus ($\text{Stock} > \text{ROP} + 14d$).
6. **Interactive ERP Webhook & Dispatched Ledger**:
   - Dispatches orders via mock ERP webhooks with SHA-256 signatures, raw JSON, and ANSI X12 EDI 850 payloads.

## ⚡ Quickstart
\`\`\`bash
pip install -r requirements.txt
streamlit run app.py
\`\`\`
`;

export default function App() {
  // Theme State: 'dark' (Pitch-Black OLED Dark Mode) or 'light' (Sleek Clean Light Mode)
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Core Simulation Parameters
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("WH-BOM-01");
  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>(SKUS.map((s) => s.id));
  const [activeSkuId, setActiveSkuId] = useState<string>("SKU-001");
  const [selectedServiceZ, setSelectedServiceZ] = useState<number>(2.326); // 99% Mission critical
  const [forecastHorizon, setForecastHorizon] = useState<number>(21);
  const [monteCarloRuns, setMonteCarloRuns] = useState<number>(1000);
  const [promoSurgePct, setPromoSurgePct] = useState<number>(0);
  const [weatherSurgePct, setWeatherSurgePct] = useState<number>(0);
  const [supplierDelayDays, setSupplierDelayDays] = useState<number>(0);
  const [reorderPolicy, setReorderPolicy] = useState<ReorderPolicy>("DYNAMIC_AI");

  // Tabs & Ledger State
  const [activeTab, setActiveTab] = useState<
    "analytics" | "table" | "network" | "transfer" | "suppliers" | "po" | "code"
  >("network");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [pythonCode, setPythonCode] = useState<string>("");
  const [dispatchedLedger, setDispatchedLedger] = useState<DispatchedPoRecord[]>(
    getInitialDispatchedLedger()
  );
  const [approvedTransferIds, setApprovedTransferIds] = useState<string[]>([]);

  // Modals & Feedback State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    toast: Omit<ToastItem, "id" | "timestamp"> & { id?: string; timestamp?: string }
  ) => {
    const newToast: ToastItem = {
      id: toast.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp:
        toast.timestamp ||
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      ...toast,
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcut listener for Cmd + K / Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch /app.py content for code viewer
  useEffect(() => {
    fetch("/app.py")
      .then((res) => {
        if (res.ok) return res.text();
        return "// Streamlit app.py available in repository root.";
      })
      .then((text) => setPythonCode(text))
      .catch(() => {
        setPythonCode("# Streamlit app.py located in repository root.");
      });
  }, []);

  // In-Memory Historical Records (365 days across 5 SKUs x 3 Warehouses)
  const allHistoricalRecords = useMemo(() => {
    return generateSyntheticHistoricalData();
  }, []);

  // Execute Supply Chain Engine with Perishable Decay, Supplier Reliability Matrix & Weather Surge
  const simulationStates = useMemo(() => {
    return executeSupplyChainEngine(
      allHistoricalRecords,
      selectedWarehouseId,
      selectedSkuIds,
      selectedServiceZ,
      forecastHorizon,
      monteCarloRuns,
      promoSurgePct,
      supplierDelayDays,
      weatherSurgePct,
      reorderPolicy
    );
  }, [
    allHistoricalRecords,
    selectedWarehouseId,
    selectedSkuIds,
    selectedServiceZ,
    forecastHorizon,
    monteCarloRuns,
    promoSurgePct,
    supplierDelayDays,
    weatherSurgePct,
    reorderPolicy,
  ]);

  // Current Warehouse Metadata
  const currentWarehouse = useMemo(() => {
    return WAREHOUSES.find((w) => w.id === selectedWarehouseId) || WAREHOUSES[0];
  }, [selectedWarehouseId]);

  // Current Service Level Object
  const currentServiceLevel = useMemo(() => {
    return SERVICE_LEVELS.find((l) => l.z === selectedServiceZ) || SERVICE_LEVELS[3];
  }, [selectedServiceZ]);

  // Purchase Orders
  const purchaseOrders = useMemo(() => {
    return generatePurchaseOrders(simulationStates, currentWarehouse);
  }, [simulationStates, currentWarehouse]);

  // Multi-Echelon Dark Store Inter-Transfers
  const interTransfers = useMemo(() => {
    return evaluateInterWarehouseTransfers(
      allHistoricalRecords,
      selectedWarehouseId,
      simulationStates
    ).map((t) => ({
      ...t,
      status: approvedTransferIds.includes(t.id) ? "APPROVED" : t.status,
    }));
  }, [allHistoricalRecords, selectedWarehouseId, simulationStates, approvedTransferIds]);

  // Quick-Commerce Dynamic Markdown & Spoilage Liquidation Items
  const markdownItems = useMemo(() => {
    return calculateMarkdownLiquidation(simulationStates);
  }, [simulationStates]);

  // Product Substitution & Stockout Cannibalization Absorption
  const substitutions = useMemo(() => {
    return calculateDemandCannibalization(simulationStates);
  }, [simulationStates]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleTriggerSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      addToast({
        type: "success",
        title: "Simulation Recomputed",
        message: `Monte Carlo joint distribution simulated with ${monteCarloRuns.toLocaleString()} runs @ ${currentServiceLevel.label.split(" - ")[0]} CSL.`,
        meta: {
          code: `CSL-${currentServiceLevel.z}`,
          latency: "320ms",
        },
      });
    }, 450);
  };

  const handleSelectWarehouse = (whId: string) => {
    setSelectedWarehouseId(whId);
    handleTriggerSimulation();
    const wh = WAREHOUSES.find((w) => w.id === whId);
    if (wh) {
      addToast({
        type: "info",
        title: "Command Node Switched",
        message: `Live telemetry shifted to ${wh.name} (${wh.city}).`,
      });
    }
  };

  const handleToggleSku = (id: string) => {
    if (selectedSkuIds.includes(id)) {
      if (selectedSkuIds.length > 1) {
        setSelectedSkuIds(selectedSkuIds.filter((x) => x !== id));
      }
    } else {
      setSelectedSkuIds([...selectedSkuIds, id]);
    }
  };

  const handleSelectAllSkus = () => {
    setSelectedSkuIds(SKUS.map((s) => s.id));
  };

  const handleSelectSkuDeepDive = (id: string) => {
    setActiveSkuId(id);
    setActiveTab("analytics");
  };

  const handleApproveTransfer = (id: string) => {
    setApprovedTransferIds((prev) => [...prev, id]);
    const xfer = interTransfers.find((t) => t.id === id);
    if (xfer) {
      addToast({
        type: "transfer",
        title: "Inter-Store Transfer Dispatched",
        message: `${xfer.recommendedTransferQty} Units ${xfer.skuName} in transit: ${xfer.originWarehouseId} ➔ ${xfer.destWarehouseId}`,
        meta: {
          code: xfer.id,
          latency: `~${xfer.transitHours}h van ETA`,
          units: xfer.recommendedTransferQty,
        },
      });
    }
  };

  const handleDispatchPo = (record: DispatchedPoRecord) => {
    setDispatchedLedger((prev) => [record, ...prev]);
    addToast({
      type: "dispatch",
      title: "PO Dispatched to ERP",
      message: `${record.poBatchNumber} Dispatched to ${record.erpSystem} (${record.totalUnits} units, SHA-256 HMAC Verified)`,
      meta: {
        code: record.poBatchNumber,
        hash: record.payloadHash,
        latency: `${record.latencyMs}ms HTTP ${record.httpStatus}`,
      },
    });
  };

  const handleApplyPreset = (
    preset: "MONSOON" | "FLASH_SALE" | "LOGISTICS_STRIKE" | "NORMAL"
  ) => {
    if (preset === "MONSOON") {
      setWeatherSurgePct(40);
      setSupplierDelayDays(2.5);
      setPromoSurgePct(15);
      setSelectedServiceZ(2.326);
      handleTriggerSimulation();
      addToast({
        type: "warning",
        title: "Crisis Preset Applied",
        message: "🌧️ Monsoon Deluge: +40% Weather Shock, +2.5d Vendor Delay Shock, +15% Promo Uplift.",
        meta: { code: "PRESET-MONSOON" },
      });
    } else if (preset === "FLASH_SALE") {
      setPromoSurgePct(65);
      setWeatherSurgePct(0);
      setSupplierDelayDays(0.5);
      setSelectedServiceZ(2.576);
      handleTriggerSimulation();
      addToast({
        type: "warning",
        title: "Crisis Preset Applied",
        message: "🔥 Midnight Flash Sale: +65% Demand Surge with 99.5% Cycle Service Level (Z=2.576).",
        meta: { code: "PRESET-FLASH-SALE" },
      });
    } else if (preset === "LOGISTICS_STRIKE") {
      setSupplierDelayDays(4.0);
      setWeatherSurgePct(0);
      setPromoSurgePct(0);
      handleTriggerSimulation();
      addToast({
        type: "warning",
        title: "Crisis Preset Applied",
        message: "🚢 Freight Strike Shock: +4.0 Days Supplier Lead-Time Delay across regional corridors.",
        meta: { code: "PRESET-STRIKE" },
      });
    } else {
      setWeatherSurgePct(0);
      setSupplierDelayDays(0);
      setPromoSurgePct(0);
      setSelectedServiceZ(1.645);
      handleTriggerSimulation();
      addToast({
        type: "info",
        title: "Baseline Restored",
        message: "⚖️ Normal Operations: Reset all stress parameters to baseline operations benchmark.",
        meta: { code: "PRESET-NORMAL" },
      });
    }
  };

  const handleSelectReorderPolicy = (policy: ReorderPolicy) => {
    setReorderPolicy(policy);
    handleTriggerSimulation();
    const policyName =
      policy === "DYNAMIC_AI"
        ? "Dynamic AI Safety Stock (Bivariate Monte Carlo)"
        : policy === "CONTINUOUS_REVIEW"
        ? "Continuous Review (s, S) Min-Max Policy"
        : "Periodic Review (R, S) Weekly Batch Review";
    addToast({
      type: "info",
      title: "Replenishment Policy Switched",
      message: `Active algorithm: ${policyName}. Safety stock & ROP thresholds recomputed.`,
      meta: { code: policy },
    });
  };

  const handleBulkDispatchCriticalPos = (targetSkuIds?: string[]) => {
    const criticalPOs = purchaseOrders.filter((po) => {
      if (targetSkuIds && targetSkuIds.length > 0) {
        return targetSkuIds.includes(po.skuId);
      }
      return po.priority === "URGENT";
    });

    if (criticalPOs.length === 0) {
      addToast({
        type: "info",
        title: "No Critical POs Needed",
        message: "All selected SKUs are currently within optimal inventory safety levels.",
      });
      return;
    }

    const batchId = `PO-BULK-${Date.now().toString().slice(-4)}`;
    const totalUnits = criticalPOs.reduce((sum, po) => sum + po.recommendedOrderQty, 0);
    const totalVal = criticalPOs.reduce((sum, po) => sum + po.totalPoValueInr, 0);

    const record: DispatchedPoRecord = {
      dispatchId: `DSP-BULK-${Date.now().toString().slice(-6)}`,
      poBatchNumber: batchId,
      warehouseId: currentWarehouse.id,
      warehouseName: currentWarehouse.name,
      endpointUrl: "https://sap-s4hana.enterprise.corp/api/v2/po-dispatches",
      erpSystem: "SAP S/4HANA Enterprise Cloud",
      timestamp: new Date().toISOString(),
      itemCount: criticalPOs.length,
      totalUnits,
      totalValueInr: totalVal,
      httpStatus: 200,
      latencyMs: 78,
      payloadHash: `sha256:bulk_${Math.random().toString(36).substring(2, 12)}`,
      skuList: criticalPOs.map((p) => p.skuName),
      rawJsonPayload: JSON.stringify(
        {
          batchHeader: {
            id: batchId,
            warehouse: currentWarehouse.name,
            timestamp: new Date().toISOString(),
            mode: "BULK_CRITICAL_DISPATCH",
          },
          items: criticalPOs.map((p) => ({
            sku: p.skuName,
            skuId: p.skuId,
            qty: p.recommendedOrderQty,
            supplier: p.supplierName,
            unitCost: p.unitCostInr,
            totalVal: p.totalPoValueInr,
          })),
        },
        null,
        2
      ),
      edi850Payload: `ISA*00*          *00*          *ZZ*INVGUARD       *01*SAPS4HANA      *${new Date().toISOString().slice(2, 10).replace(/-/g, "")}*1200*U*00401*${Date.now().toString().slice(-9)}*0*P*>~\nGS*PO*INVGUARD*SAPS4HANA*${new Date().toISOString().slice(0, 10).replace(/-/g, "")}*1200*1*X*004010~\nST*850*0001~\nBEG*00*SA*${batchId}**${new Date().toISOString().slice(0, 10).replace(/-/g, "")}~\n${criticalPOs.map((p, idx) => `PO1*${idx + 1}*${p.recommendedOrderQty}*EA*${p.unitCostInr}**VN*${p.skuId}*IN*${p.skuName.replace(/ /g, "_")}~`).join("\n")}\nCTT*${criticalPOs.length}*${totalUnits}~\nSE*${criticalPOs.length + 4}*0001~\nGE*1*1~\nIEA*1*${Date.now().toString().slice(-9)}~`,
    };

    setDispatchedLedger((prev) => [record, ...prev]);
    addToast({
      type: "dispatch",
      title: "Bulk Critical POs Dispatched",
      message: `⚡ ${criticalPOs.length} Purchase Orders (${totalUnits.toLocaleString()} units) dispatched to SAP S/4HANA.`,
      meta: {
        code: batchId,
        hash: record.payloadHash,
        units: totalUnits,
      },
    });
  };

  const handleAutoApproveAllTransfers = () => {
    const pendingTransfers = interTransfers.filter(
      (t) => !approvedTransferIds.includes(t.id)
    );

    if (pendingTransfers.length === 0) {
      addToast({
        type: "info",
        title: "All Transfers Approved",
        message: "No pending inter-store transfer recommendations require approval.",
      });
      return;
    }

    const newIds = pendingTransfers.map((t) => t.id);
    setApprovedTransferIds((prev) => [...prev, ...newIds]);

    const totalUnits = pendingTransfers.reduce(
      (acc, t) => acc + t.recommendedTransferQty,
      0
    );

    addToast({
      type: "transfer",
      title: "All Transfers Auto-Approved",
      message: `🚚 ${pendingTransfers.length} Inter-Store Transfer routes approved (~${totalUnits.toLocaleString()} units in transit).`,
      meta: {
        code: `BULK-XFER-${Date.now().toString().slice(-4)}`,
        units: totalUnits,
        latency: "Green EV Fleet",
      },
    });
  };

  const handleApplyMarkdown = (skuId: string, discountPct: number) => {
    const s = simulationStates.find((item) => item.sku.id === skuId);
    const skuName = s ? s.sku.name : skuId;
    addToast({
      type: "success",
      title: "Flash Markdown Deployed",
      message: `-${discountPct}% promotional markdown live for ${skuName} across catalog channels (SHA-256 sync verified).`,
      meta: {
        code: `DISC-${discountPct}%`,
        latency: "42ms",
      },
    });
  };

  const handleIssueDebitNote = (supplierName: string, amountInr: number) => {
    addToast({
      type: "dispatch",
      title: "SLA Debit Note Dispatched",
      message: `Formal liquidated damages debit note for ₹${amountInr.toLocaleString("en-IN")} dispatched to ERP Accounts Payable for ${supplierName}.`,
      meta: {
        code: `DBN-${Date.now().toString().slice(-4)}`,
        hash: `sha256:7f9a2b8e3d0c41ab82ef10b0f443a290c5819e8315`,
      },
    });
  };

  const handleDownloadCsv = () => {
    const csvData = generateSupplyChainAuditCsv(
      currentWarehouse,
      simulationStates,
      interTransfers,
      dispatchedLedger
    );
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerCsvDownload(
      csvData,
      `SupplyChain_Audit_${currentWarehouse.id}_${dateStr}.csv`
    );
    addToast({
      type: "export",
      title: "Audit Report CSV Downloaded",
      message: `Complete dataset for ${currentWarehouse.name} exported successfully.`,
    });
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? "bg-[#0B0F19] text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Header with Clean Sun/Moon Icon-Only Toggle, ⌘K and Export triggers */}
      <Header
        currentWarehouse={currentWarehouse}
        onRefreshData={handleTriggerSimulation}
        isSimulating={isSimulating}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenExportReport={() => setIsReportModalOpen(true)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Left Sidebar Control Panel */}
        <SidebarControls
          warehouses={WAREHOUSES}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={handleSelectWarehouse}
          allSkus={SKUS}
          selectedSkuIds={selectedSkuIds}
          onToggleSku={handleToggleSku}
          onSelectAllSkus={handleSelectAllSkus}
          serviceLevels={SERVICE_LEVELS}
          selectedServiceZ={selectedServiceZ}
          onSelectServiceZ={(z) => {
            setSelectedServiceZ(z);
            handleTriggerSimulation();
          }}
          forecastHorizon={forecastHorizon}
          onChangeForecastHorizon={(days) => {
            setForecastHorizon(days);
            handleTriggerSimulation();
          }}
          monteCarloRuns={monteCarloRuns}
          onChangeMonteCarloRuns={(runs) => {
            setMonteCarloRuns(runs);
            handleTriggerSimulation();
          }}
          promoSurgePct={promoSurgePct}
          onChangePromoSurgePct={(pct) => {
            setPromoSurgePct(pct);
            handleTriggerSimulation();
          }}
          weatherSurgePct={weatherSurgePct}
          onChangeWeatherSurgePct={(pct) => {
            setWeatherSurgePct(pct);
            handleTriggerSimulation();
          }}
          supplierDelayDays={supplierDelayDays}
          onChangeSupplierDelayDays={(days) => {
            setSupplierDelayDays(days);
            handleTriggerSimulation();
          }}
          isSimulating={isSimulating}
          onTriggerSimulation={handleTriggerSimulation}
          onApplyPreset={handleApplyPreset}
          reorderPolicy={reorderPolicy}
          onSelectReorderPolicy={handleSelectReorderPolicy}
          theme={theme}
        />

        {/* Right Dashboard Workspace */}
        <main className="flex-1 p-5 lg:p-6 overflow-y-auto space-y-6">
          {/* Executive KPI Metric Cards */}
          <KpiMetrics
            simulationStates={simulationStates}
            selectedCslLabel={currentServiceLevel.label.split(" - ")[0]}
            theme={theme}
          />

          {/* Navigation Tabs */}
          <div
            className={`flex items-center justify-between border-b pb-2 ${
              isDark ? "border-slate-800" : "border-slate-200"
            }`}
          >
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setActiveTab("network")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "network"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Network Topology Map</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "analytics"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Visual Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab("table")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "table"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Risk Action Table</span>
              </button>

              <button
                onClick={() => setActiveTab("transfer")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "transfer"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Inter-Store Transfers</span>
                {interTransfers.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-500 font-extrabold">
                    {interTransfers.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("suppliers")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "suppliers"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Supplier Reliability</span>
              </button>

              <button
                onClick={() => setActiveTab("po")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "po"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Automated PO Batch</span>
                {purchaseOrders.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-500 font-extrabold">
                    {purchaseOrders.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "code"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Python Streamlit Artifacts</span>
              </button>
            </div>

            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Decay Engine &amp; Scorecard Active</span>
            </div>
          </div>

          {/* Active Tab View */}
          {activeTab === "network" && (
            <NetworkTopologyMap
              warehouses={WAREHOUSES}
              selectedWarehouseId={selectedWarehouseId}
              onSelectWarehouse={handleSelectWarehouse}
              interTransfers={interTransfers}
              simulationStates={simulationStates}
              onApproveTransfer={handleApproveTransfer}
              theme={theme}
            />
          )}

          {activeTab === "analytics" && (
            <VisualAnalytics
              simulationStates={simulationStates}
              selectedSkuId={activeSkuId}
              onSelectSkuId={setActiveSkuId}
              monteCarloIterations={monteCarloRuns}
              weatherSurgePct={weatherSurgePct}
              theme={theme}
            />
          )}

          {activeTab === "table" && (
            <div className="space-y-6">
              <RiskTable
                simulationStates={simulationStates}
                onSelectSku={handleSelectSkuDeepDive}
                onBulkDispatchCriticalPos={handleBulkDispatchCriticalPos}
                onAutoApproveTransfers={handleAutoApproveAllTransfers}
                theme={theme}
              />
              <DynamicMarkdownCard
                items={markdownItems}
                onApplyMarkdown={handleApplyMarkdown}
                theme={theme}
              />
              <SubstitutionCard
                substitutions={substitutions}
                theme={theme}
              />
            </div>
          )}

          {activeTab === "transfer" && (
            <InterTransferView
              recommendations={interTransfers}
              onApproveTransfer={handleApproveTransfer}
              theme={theme}
            />
          )}

          {activeTab === "suppliers" && (
            <SupplierScorecardView
              simulationStates={simulationStates}
              onIssueDebitNote={handleIssueDebitNote}
              theme={theme}
            />
          )}

          {activeTab === "po" && (
            <PoGenerator
              purchaseOrders={purchaseOrders}
              warehouse={currentWarehouse}
              dispatchedLedger={dispatchedLedger}
              onDispatchPo={handleDispatchPo}
              theme={theme}
            />
          )}

          {activeTab === "code" && (
            <SourceCodeViewer
              appPyCode={pythonCode}
              requirementsTxt={REQUIREMENTS_TXT}
              readmeContent={README_MD}
            />
          )}
        </main>
      </div>

      {/* Global Command Bar Modal (Cmd + K / Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        warehouses={WAREHOUSES}
        selectedWarehouseId={selectedWarehouseId}
        onSelectWarehouse={handleSelectWarehouse}
        allSkus={SKUS}
        onSelectSku={(id) => {
          setActiveSkuId(id);
          setActiveTab("analytics");
        }}
        onNavigateTab={(tab) => {
          setActiveTab(
            tab as "analytics" | "table" | "network" | "transfer" | "suppliers" | "po" | "code"
          );
        }}
        onTriggerSimulation={handleTriggerSimulation}
        onApplyWeatherSurge={(pct) => {
          setWeatherSurgePct(pct);
          handleTriggerSimulation();
          addToast({
            type: "info",
            title: "Weather Shock Applied",
            message: `Monsoon deluge surge set to +${pct}%.`,
          });
        }}
        onApplyPromoSurge={(pct) => {
          setPromoSurgePct(pct);
          handleTriggerSimulation();
          addToast({
            type: "info",
            title: "Promo Shock Applied",
            message: `Flash sale surge set to +${pct}%.`,
          });
        }}
        onApplyServiceLevel={(z) => {
          setSelectedServiceZ(z);
          handleTriggerSimulation();
          addToast({
            type: "info",
            title: "Service Level Set",
            message: `Cycle Service Level locked to Z = ${z}.`,
          });
        }}
        onExportCsv={handleDownloadCsv}
        onOpenPdfReport={() => setIsReportModalOpen(true)}
        theme={theme}
      />

      {/* Executive Printable / PDF Audit Dossier Modal */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        warehouse={currentWarehouse}
        simulationStates={simulationStates}
        interTransfers={interTransfers}
        dispatchedLedger={dispatchedLedger}
        onDownloadCsv={handleDownloadCsv}
        theme={theme}
      />

      {/* Frosted Glass Floating Toast Notification Feedback System */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        theme={theme}
      />

      {/* Global Footer */}
      <footer
        className={`border-t py-4 px-6 text-center text-xs transition-colors ${
          isDark
            ? "border-slate-800 bg-[#0B0F19] text-slate-400"
            : "border-slate-200 bg-white text-slate-500"
        }`}
      >
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-300">InventoryGuard AI</span>
          <span>·</span>
          <span>Multi-Echelon Dark Store Network Topology</span>
          <span>·</span>
          <span>Bivariate Stochastic Monte Carlo Engine</span>
          <span>·</span>
          <span>Press <kbd className="px-1 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-indigo-400 border border-slate-700">⌘K</kbd> for Executive Commands</span>
        </p>
      </footer>
    </div>
  );
}
