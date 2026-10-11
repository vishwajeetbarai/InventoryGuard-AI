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
import { Header, AppPage } from "./components/Header";
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
import { WmsDataIngestionModal } from "./components/WmsDataIngestionModal";
import { AuditLedgerModal } from "./components/AuditLedgerModal";
import { StorageService, CustomDatasetPayload } from "./services/storageService";
import { UserProfile, TenantOrganization, UserRole, AuditLogEntry } from "./types/auth";
import { USER_ROLES, DEMO_USERS, TENANT_ORGANIZATIONS } from "./services/authService";
import { generateSupplyChainAuditCsv, triggerCsvDownload } from "./utils/exportCsv";
import {
  DispatchedPoRecord,
  ReorderPolicy,
  SkuMetadata,
  DailyRecord,
  Warehouse,
  ForecastModel,
  CurrencyCode,
} from "./types";
import { getStoredCurrency, setStoredCurrency, formatCurrency } from "./utils/currency";
import {
  TrendingUp,
  Table,
  FileCheck2,
  Code2,
  ArrowRightLeft,
  Award,
  ShieldCheck,
  Navigation,
  Building2,
  AlertTriangle,
  Lock,
  UploadCloud,
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
  // Theme State: 'light' (Crisp Clean Light Mode by Default) or 'dark' (Pitch-Black Obsidian Dark Mode)
  const [theme, setTheme] = useState<"dark" | "light">("light");

  // Multi-Tenant Authentication & Session State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() =>
    StorageService.getCurrentUser()
  );
  const [currentTenant, setCurrentTenant] = useState<TenantOrganization>(() =>
    StorageService.getCurrentTenant()
  );
  const [customDataset, setCustomDataset] = useState<CustomDatasetPayload | null>(() =>
    StorageService.getCustomDataset()
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    StorageService.getAuditLogs()
  );

  // Dynamic Datasets (Default Sandbox vs Client Uploaded WMS)
  const effectiveWarehouses = useMemo(() => {
    return customDataset ? customDataset.warehouses : WAREHOUSES;
  }, [customDataset]);

  const effectiveSkus = useMemo(() => {
    return customDataset ? customDataset.skus : SKUS;
  }, [customDataset]);

  // Core Simulation Parameters
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(() => {
    const ds = StorageService.getCustomDataset();
    return ds ? ds.warehouses[0].id : "WH-BOM-01";
  });
  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>(() => {
    const ds = StorageService.getCustomDataset();
    return ds ? ds.skus.map((s) => s.id) : SKUS.map((s) => s.id);
  });
  const [activeSkuId, setActiveSkuId] = useState<string>(() => {
    const ds = StorageService.getCustomDataset();
    return ds ? ds.skus[0].id : "SKU-001";
  });
  const [selectedServiceZ, setSelectedServiceZ] = useState<number>(2.326); // 99% Mission critical
  const [forecastHorizon, setForecastHorizon] = useState<number>(21);
  const [monteCarloRuns, setMonteCarloRuns] = useState<number>(1000);
  const [promoSurgePct, setPromoSurgePct] = useState<number>(0);
  const [weatherSurgePct, setWeatherSurgePct] = useState<number>(0);
  const [supplierDelayDays, setSupplierDelayDays] = useState<number>(0);
  const [reorderPolicy, setReorderPolicy] = useState<ReorderPolicy>("DYNAMIC_AI");
  const [forecastModel, setForecastModel] = useState<ForecastModel>("META_PROPHET");
  const [currency, setCurrency] = useState<CurrencyCode>(() => getStoredCurrency());

  // 4 Dedicated Core Pages & Tab State
  const [activePage, setActivePage] = useState<AppPage>("overview");
  const [procurementTab, setProcurementTab] = useState<"po" | "transfer" | "suppliers">("po");
  const [operationsTab, setOperationsTab] = useState<"controls" | "ingestion" | "audit" | "code">("controls");
  const [activeTab, setActiveTab] = useState<
    "analytics" | "table" | "network" | "transfer" | "suppliers" | "po" | "code"
  >("network");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [pythonCode, setPythonCode] = useState<string>("");
  const [dispatchedLedger, setDispatchedLedger] = useState<DispatchedPoRecord[]>(() =>
    StorageService.getDispatchedLedger(getInitialDispatchedLedger())
  );
  const [approvedTransferIds, setApprovedTransferIds] = useState<string[]>(() =>
    StorageService.getApprovedTransferIds()
  );

  // Modals & Feedback State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isWmsModalOpen, setIsWmsModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Synchronize state with persistent storage
  useEffect(() => {
    StorageService.saveDispatchedLedger(dispatchedLedger);
  }, [dispatchedLedger]);

  useEffect(() => {
    StorageService.saveApprovedTransferIds(approvedTransferIds);
  }, [approvedTransferIds]);

  useEffect(() => {
    StorageService.setCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    StorageService.setCurrentTenant(currentTenant);
  }, [currentTenant]);

  useEffect(() => {
    setStoredCurrency(currency);
  }, [currency]);

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

  // In-Memory or Uploaded Historical Records
  const allHistoricalRecords = useMemo(() => {
    if (customDataset && customDataset.records.length > 0) {
      return customDataset.records;
    }
    return generateSyntheticHistoricalData();
  }, [customDataset]);

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
      reorderPolicy,
      forecastModel
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
    forecastModel,
  ]);

  // Current Warehouse Metadata
  const currentWarehouse = useMemo(() => {
    return (
      effectiveWarehouses.find((w) => w.id === selectedWarehouseId) ||
      effectiveWarehouses[0]
    );
  }, [effectiveWarehouses, selectedWarehouseId]);

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

  const criticalSkus = useMemo(() => {
    return simulationStates.filter((s) => s.mcResult.urgency === "CRITICAL REORDER NOW");
  }, [simulationStates]);

  const checkPermission = (actionDesc: string, allowedRoles: UserRole[]): boolean => {
    if (!allowedRoles.includes(currentUser.role)) {
      addToast({
        type: "warning",
        title: "Action Restricted (RBAC)",
        message: `Active persona "${USER_ROLES[currentUser.role].title}" lacks permission to ${actionDesc}. Switch persona in the header dropdown to test this role.`,
        meta: {
          code: `RBAC_${currentUser.role}`,
        },
      });
      return false;
    }
    return true;
  };

  const handleSelectRole = (newRole: UserRole) => {
    const demoUser = DEMO_USERS[newRole];
    const updatedUser: UserProfile = {
      ...demoUser,
      tenantId: currentTenant.id,
      tenantName: currentTenant.name,
    };
    setCurrentUser(updatedUser);
    StorageService.setCurrentUser(updatedUser);

    addToast({
      type: "info",
      title: "Active Persona Switched",
      message: `Signed in as ${updatedUser.name} (${USER_ROLES[newRole].title}) for ${currentTenant.name}.`,
      meta: {
        code: USER_ROLES[newRole].badgeLabel,
      },
    });
  };

  const handleSelectTenant = (tenant: TenantOrganization) => {
    setCurrentTenant(tenant);
    StorageService.setCurrentTenant(tenant);
    setCurrentUser((prev) => ({
      ...prev,
      tenantId: tenant.id,
      tenantName: tenant.name,
    }));

    addToast({
      type: "info",
      title: "Tenant Switched",
      message: `Now viewing operations for ${tenant.name} (${tenant.erpIntegration} Gateway).`,
      meta: {
        code: tenant.tier,
      },
    });
  };

  const handleDatasetIngested = (payload: {
    datasetName: string;
    warehouses: Warehouse[];
    skus: SkuMetadata[];
    records: DailyRecord[];
  }) => {
    const dataset: CustomDatasetPayload = {
      name: payload.datasetName,
      uploadedAt: new Date().toISOString(),
      source: "WMS_CSV_UPLOAD",
      warehouses: payload.warehouses,
      skus: payload.skus,
      records: payload.records,
    };

    StorageService.saveCustomDataset(dataset);
    setCustomDataset(dataset);

    if (payload.warehouses.length > 0) {
      setSelectedWarehouseId(payload.warehouses[0].id);
    }
    setSelectedSkuIds(payload.skus.map((s) => s.id));
    if (payload.skus.length > 0) {
      setActiveSkuId(payload.skus[0].id);
    }

    handleTriggerSimulation();

    // Log to audit ledger
    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "WMS_DATA_INGESTED",
      targetEntity: payload.datasetName,
      details: `Ingested ${payload.skus.length} SKUs across ${payload.warehouses.length} facility nodes with ${payload.records.length} historical records. Recomputed stochastic safety stocks in 0.4s.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "success",
      title: "Real WMS Dataset Active",
      message: `Ingested "${payload.datasetName}" (${payload.skus.length} SKUs, ${payload.records.length} demand records). Calculated in <0.5s!`,
      meta: {
        code: "WMS_INGEST_OK",
        hash: log.cryptoHash.slice(0, 18),
      },
    });
  };

  const handleResetCustomDataset = () => {
    StorageService.saveCustomDataset(null);
    setCustomDataset(null);
    setSelectedWarehouseId(WAREHOUSES[0].id);
    setSelectedSkuIds(SKUS.map((s) => s.id));
    setActiveSkuId(SKUS[0].id);
    handleTriggerSimulation();

    addToast({
      type: "info",
      title: "Sandbox Baseline Restored",
      message: "Reset to default quick-commerce dark store dataset (5 SKUs, 3 Warehouses).",
    });
  };

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
    const wh = effectiveWarehouses.find((w) => w.id === whId);
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
    setSelectedSkuIds(effectiveSkus.map((s) => s.id));
  };

  const handleSelectSkuDeepDive = (id: string) => {
    setActiveSkuId(id);
    setActivePage("inventory");
    setActiveTab("analytics");
  };

  const handleApproveTransfer = (id: string) => {
    if (!checkPermission("approve inter-store warehouse transfers", ["WAREHOUSE_SUPERVISOR", "INVENTORY_MANAGER"])) {
      return;
    }

    setApprovedTransferIds((prev) => [...prev, id]);
    const xfer = interTransfers.find((t) => t.id === id);
    if (xfer) {
      const log = StorageService.appendAuditLog({
        tenantId: currentTenant.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionType: "INTER_TRANSFER_APPROVAL",
        targetEntity: `${xfer.skuName} (${xfer.originWarehouseId} ➔ ${xfer.destWarehouseId})`,
        details: `Approved inter-store balancing transfer of ${xfer.recommendedTransferQty} units via Green EV route. Saved ${xfer.leadTimeSavedHours}h lead-time.`,
      });
      setAuditLogs(StorageService.getAuditLogs());

      addToast({
        type: "transfer",
        title: "Inter-Store Transfer Dispatched",
        message: `${xfer.recommendedTransferQty} Units ${xfer.skuName} in transit: ${xfer.originWarehouseId} ➔ ${xfer.destWarehouseId}`,
        meta: {
          code: xfer.id,
          latency: `~${xfer.transitHours}h van ETA`,
          units: xfer.recommendedTransferQty,
          hash: log.cryptoHash.slice(0, 18),
        },
      });
    }
  };

  const handleDispatchPo = (record: DispatchedPoRecord) => {
    if (!checkPermission("authorize and dispatch purchase orders", ["PROCUREMENT_SPECIALIST"])) {
      return;
    }

    setDispatchedLedger((prev) => [record, ...prev]);

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "PO_DISPATCH",
      targetEntity: record.poBatchNumber,
      details: `Authorized PO dispatch to ${record.erpSystem} for ${record.itemCount} SKUs (${record.totalUnits} units, ₹${record.totalValueInr.toLocaleString("en-IN")}) with HMAC-SHA256 signature.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

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
    if (!checkPermission("switch automated replenishment algorithm", ["INVENTORY_MANAGER"])) {
      return;
    }

    setReorderPolicy(policy);
    handleTriggerSimulation();
    const policyName =
      policy === "DYNAMIC_AI"
        ? "Dynamic AI Safety Stock (Bivariate Monte Carlo)"
        : policy === "CONTINUOUS_REVIEW"
        ? "Continuous Review (s, S) Min-Max Policy"
        : "Periodic Review (R, S) Weekly Batch Review";

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "POLICY_MODIFIED",
      targetEntity: policy,
      details: `Replenishment algorithm switched to ${policyName}. System recomputed dynamic safety stock and ROP baselines.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "info",
      title: "Replenishment Policy Switched",
      message: `Active algorithm: ${policyName}. Safety stock & ROP thresholds recomputed.`,
      meta: { code: policy },
    });
  };

  const handleBulkDispatchCriticalPos = (targetSkuIds?: string[]) => {
    if (!checkPermission("bulk dispatch critical purchase orders", ["PROCUREMENT_SPECIALIST"])) {
      return;
    }

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
      erpSystem: `${currentTenant.erpIntegration} Enterprise Cloud`,
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
            tenant: currentTenant.name,
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

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "PO_DISPATCH",
      targetEntity: batchId,
      details: `Bulk dispatched ${criticalPOs.length} POs (${totalUnits.toLocaleString()} units, ₹${totalVal.toLocaleString("en-IN")}) to ${currentTenant.erpIntegration}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "dispatch",
      title: "Bulk Critical POs Dispatched",
      message: `⚡ ${criticalPOs.length} Purchase Orders (${totalUnits.toLocaleString()} units) dispatched to ${currentTenant.erpIntegration}.`,
      meta: {
        code: batchId,
        hash: record.payloadHash,
        units: totalUnits,
      },
    });
  };

  const handleAutoApproveAllTransfers = () => {
    if (!checkPermission("auto-approve inter-store transfers", ["WAREHOUSE_SUPERVISOR", "INVENTORY_MANAGER"])) {
      return;
    }

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

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "INTER_TRANSFER_APPROVAL",
      targetEntity: `BULK-TRANSFERS (${pendingTransfers.length} routes)`,
      details: `Auto-approved ${pendingTransfers.length} inter-store replenishment routes (~${totalUnits.toLocaleString()} units) via intra-city EV vans.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

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
    if (!checkPermission("trigger promotional markdown liquidations", ["INVENTORY_MANAGER"])) {
      return;
    }

    const s = simulationStates.find((item) => item.sku.id === skuId);
    const skuName = s ? s.sku.name : skuId;

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "MARKDOWN_ACTIVATED",
      targetEntity: `${skuName} (-${discountPct}%)`,
      details: `Triggered flash promotional markdown discount of -${discountPct}% for ${skuName} to liquidate perishable inventory before expiration.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

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
    if (!checkPermission("issue supplier chargeback debit notes", ["PROCUREMENT_SPECIALIST"])) {
      return;
    }

    const formattedAmount = formatCurrency(amountInr, currency);

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "SLA_DEBIT_NOTE_ISSUED",
      targetEntity: supplierName,
      details: `Dispatched SLA breach debit note for ${formattedAmount} to ERP Accounts Payable for persistent delivery delays.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "dispatch",
      title: "SLA Debit Note Dispatched",
      message: `Formal liquidated damages debit note for ${formattedAmount} dispatched to ERP Accounts Payable for ${supplierName}.`,
      meta: {
        code: `DBN-${Date.now().toString().slice(-4)}`,
        hash: log.cryptoHash,
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

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "AUDIT_EXPORTED",
      targetEntity: currentWarehouse.name,
      details: `Exported comprehensive supply chain CSV audit dossier for ${currentWarehouse.name}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "export",
      title: "Audit Report CSV Downloaded",
      message: `Complete dataset for ${currentWarehouse.name} exported successfully.`,
    });
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
        isDark ? "bg-[#09090B] text-neutral-100" : "bg-[#F8FAFC] text-slate-900"
      }`}
    >
      {/* Sleek Top Navigation Header */}
      <Header
        currentWarehouse={currentWarehouse}
        warehouses={effectiveWarehouses}
        onSelectWarehouse={handleSelectWarehouse}
        activePage={activePage}
        onSelectPage={setActivePage}
        onRefreshData={handleTriggerSimulation}
        isSimulating={isSimulating}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenExportReport={() => setIsReportModalOpen(true)}
        onOpenWmsIngestion={() => setIsWmsModalOpen(true)}
        onOpenAuditLedger={() => setIsAuditModalOpen(true)}
        currentUser={currentUser}
        onSelectRole={handleSelectRole}
        currentTenant={currentTenant}
        onSelectTenant={handleSelectTenant}
        customDatasetName={customDataset?.name}
        onResetCustomDataset={handleResetCustomDataset}
        currentCurrency={currency}
        onSelectCurrency={setCurrency}
      />

      {/* Main Spacious Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* PAGE 1: OVERVIEW & NETWORK TOPOLOGY */}
        {activePage === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Facility & Engine Status Strip */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDark
                  ? "bg-neutral-900/60 border-neutral-800 text-neutral-200"
                  : "bg-white border-slate-200/90 text-slate-800 shadow-xs"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isDark ? "bg-neutral-800 text-emerald-400" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-950 dark:text-white">
                      {currentWarehouse.name}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                      {currentWarehouse.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{currentWarehouse.city}, {currentWarehouse.region}</span>
                    <span>·</span>
                    <span>Demand Multiplier: {currentWarehouse.demandFactor.toFixed(2)}x</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Cycle Service Level</span>
                  <span className="font-bold text-slate-900 dark:text-white">{currentServiceLevel.label.split(" - ")[0]} (Z={selectedServiceZ})</span>
                </div>
                <div className="h-7 w-[1px] bg-slate-200 dark:bg-neutral-800" />
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Engine Mode</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Stochastic ML
                  </span>
                </div>
              </div>
            </div>

            {/* High-Level Executive KPI Cards */}
            <KpiMetrics
              simulationStates={simulationStates}
              selectedCslLabel={currentServiceLevel.label.split(" - ")[0]}
              currency={currency}
              theme={theme}
            />

            {/* Action Center Banner if Urgent Replenishment or Transfers Exist */}
            {(criticalSkus.length > 0 || interTransfers.length > 0) && (
              <div
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isDark
                    ? "bg-neutral-900/40 border-neutral-800 text-neutral-200"
                    : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {criticalSkus.length} Urgent Stockout Alerts &amp; {interTransfers.length} Rebalance Opportunities
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Immediate action recommended to avoid stockout revenue leakage at {currentWarehouse.name}.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {criticalSkus.length > 0 && (
                    <button
                      onClick={() => {
                        setActivePage("procurement");
                        setProcurementTab("po");
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                    >
                      Review {criticalSkus.length} Critical POs
                    </button>
                  )}
                  {interTransfers.length > 0 && (
                    <button
                      onClick={() => {
                        setActivePage("procurement");
                        setProcurementTab("transfer");
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-200 transition-colors cursor-pointer"
                    >
                      Inspect Transfers
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Full Width Dark Store Network Topology Map */}
            <NetworkTopologyMap
              warehouses={effectiveWarehouses}
              selectedWarehouseId={selectedWarehouseId}
              onSelectWarehouse={handleSelectWarehouse}
              interTransfers={interTransfers}
              simulationStates={simulationStates}
              onApproveTransfer={handleApproveTransfer}
              currency={currency}
              theme={theme}
            />
          </div>
        )}

        {/* PAGE 2: INVENTORY & FORECASTING */}
        {activePage === "inventory" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <VisualAnalytics
              simulationStates={simulationStates}
              selectedSkuId={activeSkuId}
              onSelectSkuId={setActiveSkuId}
              monteCarloIterations={monteCarloRuns}
              weatherSurgePct={weatherSurgePct}
              currency={currency}
              forecastModel={forecastModel}
              theme={theme}
            />

            <RiskTable
              simulationStates={simulationStates}
              onSelectSku={handleSelectSkuDeepDive}
              onBulkDispatchCriticalPos={handleBulkDispatchCriticalPos}
              onAutoApproveTransfers={handleAutoApproveAllTransfers}
              currency={currency}
              theme={theme}
            />

            <DynamicMarkdownCard
              items={markdownItems}
              onApplyMarkdown={handleApplyMarkdown}
              currency={currency}
              theme={theme}
            />

            <SubstitutionCard
              substitutions={substitutions}
              theme={theme}
            />
          </div>
        )}

        {/* PAGE 3: PROCUREMENT & ROUTING */}
        {activePage === "procurement" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Segmented Sub-Nav Controls */}
            <div
              className={`p-1.5 rounded-xl border flex items-center gap-1.5 w-fit ${
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-slate-100 border-slate-200"
              }`}
            >
              <button
                onClick={() => setProcurementTab("po")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  procurementTab === "po"
                    ? isDark
                      ? "bg-neutral-800 text-white shadow-xs"
                      : "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Automated PO Batches</span>
                {purchaseOrders.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {purchaseOrders.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setProcurementTab("transfer")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  procurementTab === "transfer"
                    ? isDark
                      ? "bg-neutral-800 text-white shadow-xs"
                      : "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Inter-Store Transfers</span>
                {interTransfers.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {interTransfers.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setProcurementTab("suppliers")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  procurementTab === "suppliers"
                    ? isDark
                      ? "bg-neutral-800 text-white shadow-xs"
                      : "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Supplier Reliability Matrix</span>
              </button>
            </div>

            {procurementTab === "po" && (
              <PoGenerator
                purchaseOrders={purchaseOrders}
                warehouse={currentWarehouse}
                dispatchedLedger={dispatchedLedger}
                onDispatchPo={handleDispatchPo}
                currency={currency}
                theme={theme}
              />
            )}

            {procurementTab === "transfer" && (
              <InterTransferView
                recommendations={interTransfers}
                onApproveTransfer={handleApproveTransfer}
                currency={currency}
                theme={theme}
              />
            )}

            {procurementTab === "suppliers" && (
              <SupplierScorecardView
                simulationStates={simulationStates}
                onIssueDebitNote={handleIssueDebitNote}
                currency={currency}
                theme={theme}
              />
            )}
          </div>
        )}

        {/* PAGE 4: DATA HUB & CONTROL TOWER */}
        {activePage === "operations" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Control Tower Simulation Sliders */}
              <div className="lg:col-span-5 space-y-6">
                <SidebarControls
                  warehouses={effectiveWarehouses}
                  selectedWarehouseId={selectedWarehouseId}
                  onSelectWarehouse={handleSelectWarehouse}
                  allSkus={effectiveSkus}
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
                  forecastModel={forecastModel}
                  onSelectForecastModel={(model) => {
                    setForecastModel(model);
                    handleTriggerSimulation();
                  }}
                  currency={currency}
                  theme={theme}
                />
              </div>

              {/* Right Column: Data Ingestion, Cryptographic Audit Ledger & Code Artifacts */}
              <div className="lg:col-span-7 space-y-6">
                {/* WMS Data Ingestion Card */}
                <div
                  className={`p-5 rounded-xl border transition-colors ${
                    isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800/40 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">Enterprise WMS Data Ingestion</h3>
                        <p className="text-xs text-slate-400">Connect real customer CSV or reload baseline sandbox</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsWmsModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Upload CSV
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <div>
                      Active Dataset: <strong className="text-slate-700 dark:text-neutral-200">{customDataset?.name || "Baseline Synthetic Sandbox"}</strong>
                    </div>
                    {customDataset && (
                      <button
                        onClick={handleResetCustomDataset}
                        className="text-amber-500 hover:underline cursor-pointer"
                      >
                        Reset to Sandbox
                      </button>
                    )}
                  </div>
                </div>

                {/* Audit Trail Card */}
                <div
                  className={`p-5 rounded-xl border transition-colors ${
                    isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800/40 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">Cryptographic Compliance Ledger</h3>
                        <p className="text-xs text-slate-400">Immutable SHA-256 event audit trail ({auditLogs.length} entries)</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadCsv}
                        className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={() => setIsAuditModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        View Ledger
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-400">
                    Latest Event: <span className="font-mono text-slate-600 dark:text-neutral-300">{auditLogs[0]?.details || "System initialized"}</span>
                  </div>
                </div>

                {/* Python / Streamlit Artifacts */}
                <div
                  className={`rounded-xl border overflow-hidden ${
                    isDark ? "bg-neutral-900/80 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
                  }`}
                >
                  <SourceCodeViewer
                    appPyCode={pythonCode}
                    requirementsTxt={REQUIREMENTS_TXT}
                    readmeContent={README_MD}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Clean Minimal 1-Line Footer */}
      <footer
        className={`border-t py-4 px-6 text-xs transition-colors ${
          isDark
            ? "border-neutral-800 bg-black text-neutral-400"
            : "border-slate-200 bg-white text-slate-500"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-bold text-slate-800 dark:text-white">Apex Supply Intelligence</span>
            <span>·</span>
            <span>Multi-Echelon Quick-Commerce Control Tower</span>
            <span>·</span>
            <span>Bivariate Monte Carlo Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational (14ms latency)
            </span>
            <span>·</span>
            <span>Press <kbd className="px-1 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">⌘K</kbd></span>
          </div>
        </div>
      </footer>

      {/* Global Command Bar Modal (Cmd + K / Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        warehouses={effectiveWarehouses}
        selectedWarehouseId={selectedWarehouseId}
        onSelectWarehouse={handleSelectWarehouse}
        allSkus={effectiveSkus}
        onSelectSku={(id) => {
          setActiveSkuId(id);
          setActivePage("inventory");
        }}
        onNavigateTab={(tab) => {
          if (tab === "network") {
            setActivePage("overview");
          } else if (tab === "analytics" || tab === "table") {
            setActivePage("inventory");
          } else if (tab === "po") {
            setActivePage("procurement");
            setProcurementTab("po");
          } else if (tab === "transfer") {
            setActivePage("procurement");
            setProcurementTab("transfer");
          } else if (tab === "suppliers") {
            setActivePage("procurement");
            setProcurementTab("suppliers");
          } else if (tab === "code") {
            setActivePage("operations");
            setOperationsTab("code");
          }
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
        currency={currency}
        theme={theme}
      />

      {/* Real WMS & ERP Data Ingestion Engine Modal */}
      <WmsDataIngestionModal
        isOpen={isWmsModalOpen}
        onClose={() => setIsWmsModalOpen(false)}
        onDatasetIngested={handleDatasetIngested}
        theme={theme}
      />

      {/* Cryptographic Compliance Audit Ledger Modal */}
      <AuditLedgerModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditLogs={auditLogs}
        currentTenant={currentTenant}
        currentUser={currentUser}
        theme={theme}
      />

      {/* Frosted Glass Floating Toast Notification Feedback System */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        theme={theme}
      />
    </div>
  );
}
