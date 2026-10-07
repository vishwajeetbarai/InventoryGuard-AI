import React, { useState, useMemo, useEffect } from "react";
import {
  WAREHOUSES,
  SKUS,
  generateSyntheticHistoricalData,
  executeSupplyChainEngine,
  generatePurchaseOrders,
  evaluateInterWarehouseTransfers,
  getInitialDispatchedLedger,
} from "./engine/supplyChainEngine";
import { Header } from "./components/Header";
import { SidebarControls } from "./components/SidebarControls";
import { KpiMetrics } from "./components/KpiMetrics";
import { VisualAnalytics } from "./components/VisualAnalytics";
import { RiskTable } from "./components/RiskTable";
import { PoGenerator } from "./components/PoGenerator";
import { InterTransferView } from "./components/InterTransferView";
import { SupplierScorecardView } from "./components/SupplierScorecardView";
import { SourceCodeViewer } from "./components/SourceCodeViewer";
import { DispatchedPoRecord } from "./types";
import {
  TrendingUp,
  Table,
  FileCheck2,
  Code2,
  ArrowRightLeft,
  Award,
  ShieldCheck,
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
  const [supplierDelayDays, setSupplierDelayDays] = useState<number>(0);

  // Tabs & Ledger State
  const [activeTab, setActiveTab] = useState<"analytics" | "table" | "transfer" | "suppliers" | "po" | "code">("analytics");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [pythonCode, setPythonCode] = useState<string>("");
  const [dispatchedLedger, setDispatchedLedger] = useState<DispatchedPoRecord[]>(getInitialDispatchedLedger());
  const [approvedTransferIds, setApprovedTransferIds] = useState<string[]>([]);

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

  // Execute Supply Chain Engine with Perishable Decay & Supplier Reliability Matrix
  const simulationStates = useMemo(() => {
    return executeSupplyChainEngine(
      allHistoricalRecords,
      selectedWarehouseId,
      selectedSkuIds,
      selectedServiceZ,
      forecastHorizon,
      monteCarloRuns,
      promoSurgePct,
      supplierDelayDays
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

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleTriggerSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 450);
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
  };

  const handleDispatchPo = (record: DispatchedPoRecord) => {
    setDispatchedLedger((prev) => [record, ...prev]);
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? "bg-[#0B0F19] text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Header with Clean Sun/Moon Icon-Only Toggle */}
      <Header
        currentWarehouse={currentWarehouse}
        onRefreshData={handleTriggerSimulation}
        isSimulating={isSimulating}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Left Sidebar Control Panel */}
        <SidebarControls
          warehouses={WAREHOUSES}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={(id) => {
            setSelectedWarehouseId(id);
            handleTriggerSimulation();
          }}
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
          supplierDelayDays={supplierDelayDays}
          onChangeSupplierDelayDays={(days) => {
            setSupplierDelayDays(days);
            handleTriggerSimulation();
          }}
          isSimulating={isSimulating}
          onTriggerSimulation={handleTriggerSimulation}
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
          {activeTab === "analytics" && (
            <VisualAnalytics
              simulationStates={simulationStates}
              selectedSkuId={activeSkuId}
              onSelectSkuId={setActiveSkuId}
              monteCarloIterations={monteCarloRuns}
              theme={theme}
            />
          )}

          {activeTab === "table" && (
            <RiskTable
              simulationStates={simulationStates}
              onSelectSku={handleSelectSkuDeepDive}
              theme={theme}
            />
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

      {/* Global Footer */}
      <footer
        className={`border-t py-4 px-6 text-center text-xs transition-colors ${
          isDark
            ? "border-slate-800 bg-[#0B0F19] text-slate-400"
            : "border-slate-200 bg-white text-slate-500 shadow-inner"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Multi-Source Supply Chain &amp; Inventory Stock-Out Forecaster • Lead Analytics Engineer
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-500" />
              Z-Score Bivariate Variance Model
            </span>
            <span>•</span>
            <span>
              Single-File <code className="text-indigo-500 font-mono">app.py</code> Executable
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
