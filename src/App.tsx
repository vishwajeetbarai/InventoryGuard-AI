import React, { useState, useMemo, useEffect } from "react";
import {
  WAREHOUSES,
  SKUS,
  generateSyntheticHistoricalData,
  executeSupplyChainEngine,
  generatePurchaseOrders,
} from "./engine/supplyChainEngine";
import { Header } from "./components/Header";
import { SidebarControls } from "./components/SidebarControls";
import { KpiMetrics } from "./components/KpiMetrics";
import { VisualAnalytics } from "./components/VisualAnalytics";
import { RiskTable } from "./components/RiskTable";
import { PoGenerator } from "./components/PoGenerator";
import { SourceCodeViewer } from "./components/SourceCodeViewer";
import {
  TrendingUp,
  Table,
  FileCheck2,
  Code2,
  ShieldCheck,
  Zap,
} from "lucide-react";

const SERVICE_LEVELS = [
  { label: "90.0% - Budget", z: 1.282, desc: "Low-cost non-critical buffer" },
  { label: "95.0% - Standard", z: 1.645, desc: "Industry benchmark standard" },
  { label: "98.0% - Premium", z: 2.054, desc: "High customer retention" },
  { label: "99.0% - Mission Critical", z: 2.326, desc: "Zero cart-drop tolerance" },
  { label: "99.5% - Flawless", z: 2.576, desc: "Max inventory protection" },
];

// Embedded copies of deliverables for interactive review & download in browser
const REQUIREMENTS_TXT = `streamlit>=1.35.0
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
plotly>=5.18.0
scipy>=1.11.0
`;

const README_MD = `# 📦 Multi-Source Supply Chain & Inventory Stock-Out Forecaster
### *Production-Grade Predictive Inventory Optimization & Monte Carlo Risk Analytics Engine*

## 🚀 Problem Statement & Architecture
Quick-commerce platforms (Zepto, Blinkit, Instamart) face severe revenue leakage due to inventory stock-outs.
Static rules (e.g., "7 days of forward supply") fail because they ignore demand variance, promotional velocity, and supplier delivery delays.

This platform bridges:
1. **LightGBM / Scikit-Learn GradientBoostingRegressor** for multi-step daily demand forecasting.
2. **Dual-Variance Dynamic Safety Stock**:
   $$SS = Z \\times \\sqrt{\\bar{L} \\cdot \\sigma_d^2 + \\bar{D}^2 \\cdot \\sigma_L^2}$$
3. **Joint Bivariate Monte Carlo Simulation**:
   - 1,000+ stochastic iterations sampling demand and supplier lead-time distributions concurrently.
   - Calculates empirical Stock-Out Probability (%) and worst-case tail demand (P95/P99).
4. **Automated Procurement Execution**:
   - Generates automated Purchase Orders (POs) formatted with target replenishment quantities.

## ⚡ Quickstart
\`\`\`bash
pip install -r requirements.txt
streamlit run app.py
\`\`\`
`;

export default function App() {
  // 1. Core State
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("WH-BOM-01");
  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>(SKUS.map((s) => s.id));
  const [activeSkuId, setActiveSkuId] = useState<string>("SKU-001");
  const [selectedServiceZ, setSelectedServiceZ] = useState<number>(2.326); // 99%
  const [forecastHorizon, setForecastHorizon] = useState<number>(21);
  const [monteCarloRuns, setMonteCarloRuns] = useState<number>(1000);
  const [promoSurgePct, setPromoSurgePct] = useState<number>(0);
  const [supplierDelayDays, setSupplierDelayDays] = useState<number>(0);

  // Tab State
  const [activeTab, setActiveTab] = useState<"analytics" | "table" | "po" | "code">("analytics");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [pythonCode, setPythonCode] = useState<string>("");

  // Fetch /app.py content for code viewer
  useEffect(() => {
    fetch("/app.py")
      .then((res) => {
        if (res.ok) return res.text();
        return "// Streamlit app.py file available in repository root.";
      })
      .then((text) => setPythonCode(text))
      .catch(() => {
        setPythonCode("# Streamlit app.py is located in the root workspace directory.");
      });
  }, []);

  // 2. Generate In-Memory Historical Records (365 days across 5 SKUs x 3 Warehouses)
  const allHistoricalRecords = useMemo(() => {
    return generateSyntheticHistoricalData();
  }, []);

  // 3. Execute Supply Chain Analytics Engine
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

  // 4. Generate Purchase Orders
  const purchaseOrders = useMemo(() => {
    return generatePurchaseOrders(simulationStates, currentWarehouse);
  }, [simulationStates, currentWarehouse]);

  // Handle re-simulate with brief loading state
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentWarehouse={currentWarehouse}
        onRefreshData={handleTriggerSimulation}
        isSimulating={isSimulating}
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
        />

        {/* Right Dashboard Workspace */}
        <main className="flex-1 p-5 lg:p-6 overflow-y-auto space-y-6">
          {/* Executive KPI Metric Cards */}
          <KpiMetrics
            simulationStates={simulationStates}
            selectedCslLabel={currentServiceLevel.label.split(" - ")[0]}
          />

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "analytics"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Visual Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab("table")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "table"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Risk Action Table</span>
              </button>

              <button
                onClick={() => setActiveTab("po")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "po"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Automated PO Batch</span>
                {purchaseOrders.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                    {purchaseOrders.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "code"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Python Streamlit Artifacts</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Simulated Monte Carlo Engine Active</span>
            </div>
          </div>

          {/* Active Tab View */}
          {activeTab === "analytics" && (
            <VisualAnalytics
              simulationStates={simulationStates}
              selectedSkuId={activeSkuId}
              onSelectSkuId={setActiveSkuId}
              monteCarloIterations={monteCarloRuns}
            />
          )}

          {activeTab === "table" && (
            <RiskTable
              simulationStates={simulationStates}
              onSelectSku={handleSelectSkuDeepDive}
            />
          )}

          {activeTab === "po" && (
            <PoGenerator
              purchaseOrders={purchaseOrders}
              warehouseName={currentWarehouse.name}
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
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Multi-Source Supply Chain &amp; Inventory Stock-Out Forecaster • Lead Analytics Engineer
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              Z-Score Bivariate Variance Model
            </span>
            <span>•</span>
            <span className="text-slate-400">
              Single-File <code className="text-indigo-300">app.py</code> Executable
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
