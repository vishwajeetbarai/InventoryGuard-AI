import React, { useState } from "react";
import {
  Warehouse,
  SkuMetadata,
  SkuSimulationState,
  ReorderPolicy,
  ForecastModel,
  CurrencyCode,
} from "../types";
import {
  Sliders,
  MapPin,
  Tag,
  Shield,
  Calendar,
  Shuffle,
  Flame,
  Truck,
  RefreshCw,
  CloudRain,
  Cpu,
  BrainCircuit,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Search,
  Check,
} from "lucide-react";
import { formatCurrency } from "../utils/currency";
import { FORECAST_MODELS_META } from "../utils/forecastModels";
import { SourceCodeViewer } from "./SourceCodeViewer";

interface SimulationLabWorkspaceProps {
  warehouses: Warehouse[];
  selectedWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  allSkus: SkuMetadata[];
  selectedSkuIds: string[];
  onToggleSku: (id: string) => void;
  onSelectAllSkus: () => void;
  serviceLevels: { label: string; z: number; desc: string }[];
  selectedServiceZ: number;
  onSelectServiceZ: (z: number) => void;
  forecastHorizon: number;
  onChangeForecastHorizon: (days: number) => void;
  monteCarloRuns: number;
  onChangeMonteCarloRuns: (runs: number) => void;
  promoSurgePct: number;
  onChangePromoSurgePct: (pct: number) => void;
  weatherSurgePct?: number;
  onChangeWeatherSurgePct?: (pct: number) => void;
  supplierDelayDays: number;
  onChangeSupplierDelayDays: (days: number) => void;
  isSimulating: boolean;
  onTriggerSimulation: () => void;
  onApplyPreset?: (preset: "MONSOON" | "FLASH_SALE" | "LOGISTICS_STRIKE" | "NORMAL") => void;
  reorderPolicy?: ReorderPolicy;
  onSelectReorderPolicy?: (policy: ReorderPolicy) => void;
  forecastModel?: ForecastModel;
  onSelectForecastModel?: (model: ForecastModel) => void;
  simulationStates?: SkuSimulationState[];
  pythonCode: string;
  requirementsTxt: string;
  readmeContent: string;
  currency?: CurrencyCode;
  theme?: "dark" | "light";
}

export const SimulationLabWorkspace: React.FC<SimulationLabWorkspaceProps> = ({
  warehouses,
  selectedWarehouseId,
  onSelectWarehouse,
  allSkus,
  selectedSkuIds,
  onToggleSku,
  onSelectAllSkus,
  serviceLevels,
  selectedServiceZ,
  onSelectServiceZ,
  forecastHorizon,
  onChangeForecastHorizon,
  monteCarloRuns,
  onChangeMonteCarloRuns,
  promoSurgePct,
  onChangePromoSurgePct,
  weatherSurgePct = 0,
  onChangeWeatherSurgePct,
  supplierDelayDays,
  onChangeSupplierDelayDays,
  isSimulating,
  onTriggerSimulation,
  onApplyPreset,
  reorderPolicy = "DYNAMIC_AI",
  onSelectReorderPolicy,
  forecastModel = "META_PROPHET",
  onSelectForecastModel,
  simulationStates = [],
  pythonCode,
  requirementsTxt,
  readmeContent,
  currency = "USD",
  theme = "light",
}) => {
  const isDark = theme === "dark";

  // Collapsible control sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    warehouseSku: true,
    forecast: true,
    serviceRisk: true,
    shocks: true,
    leadTime: true,
    policy: true,
    developerTools: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // SKU filter search
  const [skuSearch, setSkuSearch] = useState("");
  const filteredSkus = allSkus.filter(
    (s) =>
      s.name.toLowerCase().includes(skuSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(skuSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(skuSearch.toLowerCase())
  );

  // Derived current simulation stats
  const activeWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);
  const totalValuation = simulationStates.reduce(
    (acc, s) => acc + s.currentStock * s.sku.basePrice,
    0
  );
  const criticalCount = simulationStates.filter(
    (s) => s.mcResult.urgency === "CRITICAL REORDER NOW"
  ).length;

  // Active preset detection
  const isMonsoon = weatherSurgePct === 40 && supplierDelayDays === 2.5;
  const isFlash = promoSurgePct === 65 && selectedServiceZ >= 2.5;
  const isStrike = supplierDelayDays === 4.0;
  const isNormal =
    promoSurgePct === 0 && weatherSurgePct === 0 && supplierDelayDays === 0;

  return (
    <div className="space-y-6">
      {/* Simulation Lab Top Action Bar & State Summary */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isDark
            ? "bg-neutral-900 border-neutral-800 text-neutral-100"
            : "bg-white border-slate-200/90 shadow-xs text-slate-900"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sliders className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                Simulation Lab &amp; Stochastic Control Tower
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 font-medium">
              Calibrate multi-tier supply-chain parameters, trigger stochastic Monte Carlo shocks, and stress-test stock resilience.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onApplyPreset && onApplyPreset("NORMAL")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isDark
                  ? "border-neutral-700 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200"
                  : "border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700"
              }`}
            >
              Reset to Baseline
            </button>

            {/* Prominent Run Simulation Button */}
            <button
              onClick={onTriggerSimulation}
              disabled={isSimulating}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
                isSimulating
                  ? "bg-emerald-600/60 text-white cursor-not-allowed opacity-80"
                  : "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-emerald-600/20"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isSimulating ? "animate-spin" : ""}`}
              />
              <span>
                {isSimulating ? "Simulating Monte Carlo..." : "Run Simulation Engine"}
              </span>
            </button>
          </div>
        </div>

        {/* Real-Time Simulation State Strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200/80 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400">
              Active Facility
            </span>
            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
              {activeWarehouse?.name || selectedWarehouseId}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200/80 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400">
              Selected SKUs
            </span>
            <div className="font-bold text-xs text-slate-900 dark:text-white">
              {selectedSkuIds.length} of {allSkus.length} Active
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200/80 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400">
              Inventory Value
            </span>
            <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(totalValuation, currency)}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200/80 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400">
              Critical Urgency
            </span>
            <div
              className={`font-bold text-xs ${
                criticalCount > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {criticalCount} SKUs Critical
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200/80 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400">
              ML Engine
            </span>
            <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400 truncate">
              {FORECAST_MODELS_META[forecastModel]?.name || forecastModel}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200/80 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400">
              Runs &amp; Horizon
            </span>
            <div className="font-bold text-xs text-slate-900 dark:text-white font-mono">
              {monteCarloRuns} runs / {forecastHorizon}d
            </div>
          </div>
        </div>
      </div>

      {/* 4 Compact Scenario Presets Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Crisis Scenario Presets (1-Click Stress Tests)</span>
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-neutral-400">
            Select a preset to load calibrated supply-chain stress shocks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Normal Baseline */}
          <button
            onClick={() => onApplyPreset && onApplyPreset("NORMAL")}
            className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer relative ${
              isNormal
                ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20"
                : isDark
                ? "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                : "bg-white border-slate-200 hover:border-emerald-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span>⚖️</span> Normal Baseline
              </span>
              {isNormal && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-snug">
              Standard operating conditions without external disruptions (0% demand shock, 0d lead time delay).
            </p>
          </button>

          {/* 2. Monsoon Deluge */}
          <button
            onClick={() => onApplyPreset && onApplyPreset("MONSOON")}
            className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer relative ${
              isMonsoon
                ? "bg-sky-50/70 dark:bg-sky-950/30 border-sky-500 ring-2 ring-sky-500/20"
                : isDark
                ? "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                : "bg-white border-slate-200 hover:border-sky-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                <span>🌧️</span> Monsoon Deluge
              </span>
              {isMonsoon && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-600 dark:text-sky-400">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-snug">
              +40% weather rain surge on quick-commerce essentials and +2.5 days delivery delay.
            </p>
          </button>

          {/* 3. Midnight Flash Sale */}
          <button
            onClick={() => onApplyPreset && onApplyPreset("FLASH_SALE")}
            className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer relative ${
              isFlash
                ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20"
                : isDark
                ? "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                : "bg-white border-slate-200 hover:border-amber-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <span>🔥</span> Midnight Flash Sale
              </span>
              {isFlash && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-snug">
              +65% promotional demand surge with 99.5% mission-critical fulfillment target.
            </p>
          </button>

          {/* 4. Logistics Strike */}
          <button
            onClick={() => onApplyPreset && onApplyPreset("LOGISTICS_STRIKE")}
            className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer relative ${
              isStrike
                ? "bg-red-50/70 dark:bg-red-950/30 border-red-500 ring-2 ring-red-500/20"
                : isDark
                ? "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                : "bg-white border-slate-200 hover:border-red-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <span>🚢</span> Freight Strike
              </span>
              {isStrike && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-600 dark:text-red-400">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-snug">
              +4.0 days freight delay bottleneck across inbound replenishment corridors.
            </p>
          </button>
        </div>
      </div>

      {/* Collapsible Control Sections in Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column Controls */}
        <div className="space-y-6">
          {/* Section 1: Warehouse & SKU Multiselect */}
          <div
            className={`rounded-2xl border transition-colors overflow-hidden ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
            }`}
          >
            <button
              onClick={() => toggleSection("warehouseSku")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950 dark:text-white">
                    Warehouse &amp; SKU Selection
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                    Select target fulfillment facility and items for simulation scope
                  </p>
                </div>
              </div>
              {openSections.warehouseSku ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.warehouseSku && (
              <div className="p-4 pt-0 border-t border-slate-100 dark:border-neutral-800/60 space-y-4">
                {/* Warehouse Dropdown */}
                <div className="space-y-1.5 mt-3">
                  <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                    Active Dark Store / Fulfillment Node
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => onSelectWarehouse(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 border ${
                      isDark
                        ? "bg-neutral-950 border-neutral-700 text-white"
                        : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} — {wh.city}, {wh.region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SKU Multiselect Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                      Catalog SKUs ({selectedSkuIds.length}/{allSkus.length} Selected)
                    </label>
                    <button
                      onClick={onSelectAllSkus}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      {selectedSkuIds.length === allSkus.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>

                  {/* SKU search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter SKUs by name or category..."
                      value={skuSearch}
                      onChange={(e) => setSkuSearch(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border ${
                        isDark
                          ? "bg-neutral-950 border-neutral-700 text-white placeholder-neutral-500"
                          : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>

                  {/* SKU List */}
                  <div
                    className={`p-2 rounded-xl border max-h-48 overflow-y-auto space-y-1 ${
                      isDark
                        ? "bg-neutral-950/60 border-neutral-800"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    {filteredSkus.map((sku) => {
                      const isChecked = selectedSkuIds.includes(sku.id);
                      return (
                        <label
                          key={sku.id}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                            isChecked
                              ? isDark
                                ? "bg-neutral-800/80 text-white"
                                : "bg-white text-slate-950 shadow-xs border border-slate-200"
                              : isDark
                              ? "text-neutral-400 hover:bg-neutral-800/40"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggleSku(sku.id)}
                              className="rounded border-slate-400 text-emerald-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="font-medium truncate">{sku.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 shrink-0 ml-2">
                            {formatCurrency(sku.basePrice, currency)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Time-Series ML Forecast Engine */}
          <div
            className={`rounded-2xl border transition-colors overflow-hidden ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
            }`}
          >
            <button
              onClick={() => toggleSection("forecast")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950 dark:text-white">
                    Forecast Configuration &amp; ML Architecture
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                    Predictive model family and projection horizon
                  </p>
                </div>
              </div>
              {openSections.forecast ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.forecast && (
              <div className="p-4 pt-0 border-t border-slate-100 dark:border-neutral-800/60 space-y-4">
                {/* Model Selector Cards */}
                <div className="space-y-2 mt-3">
                  <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                    Select ML Forecast Model
                  </label>
                  <div className="space-y-2">
                    {(
                      Object.values(FORECAST_MODELS_META) as (typeof FORECAST_MODELS_META[keyof typeof FORECAST_MODELS_META])[]
                    ).map((meta) => {
                      const isSelected = forecastModel === meta.id;
                      return (
                        <button
                          key={meta.id}
                          onClick={() => onSelectForecastModel?.(meta.id)}
                          className={`w-full text-left p-3 rounded-xl text-xs transition-all border cursor-pointer ${
                            isSelected
                              ? isDark
                                ? "bg-indigo-950/40 border-indigo-500/80 text-white ring-1 ring-indigo-500/50"
                                : "bg-indigo-50/60 border-indigo-500 text-slate-950 ring-1 ring-indigo-500/30"
                              : isDark
                              ? "bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800/50"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{meta.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({meta.vendor})
                              </span>
                            </div>
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                isSelected
                                  ? "bg-indigo-500 text-white"
                                  : "bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400"
                              }`}
                            >
                              {meta.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                            {meta.description}
                          </p>
                          <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-neutral-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>Latency: ~{meta.inferenceLatencyMs}ms</span>
                            <span>Benchmark MAE: {meta.benchmarkMae}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Forecast Horizon Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-neutral-300">
                      Forecast Horizon
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {forecastHorizon} Days Forward
                    </span>
                  </div>
                  <input
                    type="range"
                    min={14}
                    max={30}
                    step={1}
                    value={forecastHorizon}
                    onChange={(e) => onChangeForecastHorizon(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>14 Days (Short-term)</span>
                    <span>21 Days (Sprint)</span>
                    <span>30 Days (Monthly)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Reorder Policy Architecture */}
          <div
            className={`rounded-2xl border transition-colors overflow-hidden ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
            }`}
          >
            <button
              onClick={() => toggleSection("policy")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950 dark:text-white">
                    Reorder Policy Architecture
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                    Algorithmic logic governing replenishment trigger thresholds
                  </p>
                </div>
              </div>
              {openSections.policy ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.policy && (
              <div className="p-4 pt-0 border-t border-slate-100 dark:border-neutral-800/60 space-y-2.5 mt-3">
                {[
                  {
                    id: "DYNAMIC_AI" as const,
                    name: "Dynamic AI Safety Stock",
                    tag: "Bivariate Joint-Risk",
                    desc: "Monte Carlo dual-variance stochastic model adjusting for weather, shelf-life, and lead-time jitter.",
                  },
                  {
                    id: "CONTINUOUS_REVIEW" as const,
                    name: "Continuous Review (s, S)",
                    tag: "Min-Max Standard",
                    desc: "Real-time reorder point threshold (s) with order-up-to base stock quantity (S).",
                  },
                  {
                    id: "PERIODIC_REVIEW" as const,
                    name: "Periodic Review (R, S)",
                    tag: "Fixed-Interval Batch",
                    desc: "Weekly batch review protection window with fixed replenishment intervals.",
                  },
                ].map((pol) => {
                  const isSelected = reorderPolicy === pol.id;
                  return (
                    <button
                      key={pol.id}
                      onClick={() => onSelectReorderPolicy?.(pol.id)}
                      className={`w-full text-left p-3 rounded-xl text-xs transition-all border cursor-pointer ${
                        isSelected
                          ? isDark
                            ? "bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500/50"
                            : "bg-emerald-50/70 border-emerald-500 text-slate-950 ring-1 ring-emerald-500/30"
                          : isDark
                          ? "bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800/50"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{pol.name}</span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            isSelected
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400"
                          }`}
                        >
                          {pol.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                        {pol.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column Controls */}
        <div className="space-y-6">
          {/* Section 4: Service-Level Target & Monte Carlo Risk */}
          <div
            className={`rounded-2xl border transition-colors overflow-hidden ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
            }`}
          >
            <button
              onClick={() => toggleSection("serviceRisk")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950 dark:text-white">
                    Service-Level &amp; Monte Carlo Risk
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                    Cycle service level Z-score and stochastic sample depth
                  </p>
                </div>
              </div>
              {openSections.serviceRisk ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.serviceRisk && (
              <div className="p-4 pt-0 border-t border-slate-100 dark:border-neutral-800/60 space-y-4">
                {/* Service Level Buttons */}
                <div className="space-y-2 mt-3">
                  <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                    Cycle Service Level (CSL) Target
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {serviceLevels.map((lvl) => {
                      const isSelected = selectedServiceZ === lvl.z;
                      return (
                        <button
                          key={lvl.z}
                          onClick={() => onSelectServiceZ(lvl.z)}
                          className={`p-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                            isSelected
                              ? isDark
                                ? "bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500/50"
                                : "bg-indigo-50 border-indigo-500 text-slate-950 ring-1 ring-indigo-500/30"
                              : isDark
                              ? "bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{lvl.label}</span>
                            <span className="font-mono text-[10px] text-indigo-500">
                              Z = {lvl.z.toFixed(3)}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                            {lvl.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Monte Carlo Runs Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-neutral-300">
                      Monte Carlo Iterations
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {monteCarloRuns.toLocaleString()} Stochastic Paths
                    </span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={2000}
                    step={250}
                    value={monteCarloRuns}
                    onChange={(e) => onChangeMonteCarloRuns(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>500 (Fast)</span>
                    <span>1,000 (Standard)</span>
                    <span>2,000 (High-Precision)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Demand Shocks & Seasonality */}
          <div
            className={`rounded-2xl border transition-colors overflow-hidden ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
            }`}
          >
            <button
              onClick={() => toggleSection("shocks")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950 dark:text-white">
                    Demand Shocks &amp; Weather Volatility
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                    Simulate flash promotions and monsoon surge shocks
                  </p>
                </div>
              </div>
              {openSections.shocks ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.shocks && (
              <div className="p-4 pt-0 border-t border-slate-100 dark:border-neutral-800/60 space-y-4">
                {/* Flash Sale Promo Surge Slider */}
                <div className="space-y-1.5 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-neutral-300">
                      Flash Sale Promotion Surge
                    </span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      +{promoSurgePct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={promoSurgePct}
                    onChange={(e) => onChangePromoSurgePct(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Baseline (0%)</span>
                    <span>Moderate (+50%)</span>
                    <span>Extreme (+100%)</span>
                  </div>
                </div>

                {/* Weather Rain Surge Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                      <span>Monsoon Weather Shock</span>
                    </span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                      +{weatherSurgePct}% Rain Spike
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={5}
                    value={weatherSurgePct}
                    onChange={(e) =>
                      onChangeWeatherSurgePct &&
                      onChangeWeatherSurgePct(Number(e.target.value))
                    }
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Clear (0%)</span>
                    <span>Light (+20%)</span>
                    <span>Severe (+50%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Supplier Lead Time & Transport Jitter */}
          <div
            className={`rounded-2xl border transition-colors overflow-hidden ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
            }`}
          >
            <button
              onClick={() => toggleSection("leadTime")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950 dark:text-white">
                    Supplier Lead Time &amp; Delay Shock
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                    Inbound vendor fulfillment latency and logistics bottleneck
                  </p>
                </div>
              </div>
              {openSections.leadTime ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.leadTime && (
              <div className="p-4 pt-0 border-t border-slate-100 dark:border-neutral-800/60 space-y-4">
                <div className="space-y-1.5 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-neutral-300">
                      Inbound Delivery Delay
                    </span>
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">
                      +{supplierDelayDays.toFixed(1)} Days Delay
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.5}
                    value={supplierDelayDays}
                    onChange={(e) =>
                      onChangeSupplierDelayDays(Number(e.target.value))
                    }
                    className="w-full accent-red-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>On-Time (0.0d)</span>
                    <span>Minor (+2.0d)</span>
                    <span>Severe (+5.0d)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                    Adds stochastic latency to vendor delivery schedules, widening required buffer safety stock.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced / Developer Tools Section (Collapsible) */}
      <div
        className={`rounded-2xl border transition-colors overflow-hidden ${
          isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
        }`}
      >
        <button
          onClick={() => toggleSection("developerTools")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-neutral-300">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-950 dark:text-white">
                Advanced / Developer Tools (Python Engine Artifacts &amp; REST Schemas)
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                Inspect raw Python mathematical modeling code, Streamlit architecture, and dependency specifications
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-bold">
              {openSections.developerTools ? "Collapse" : "Expand Artifacts"}
            </span>
            {openSections.developerTools ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {openSections.developerTools && (
          <div className="border-t border-slate-200 dark:border-neutral-800 p-4">
            <SourceCodeViewer
              appPyCode={pythonCode}
              requirementsTxt={requirementsTxt}
              readmeContent={readmeContent}
            />
          </div>
        )}
      </div>
    </div>
  );
};
