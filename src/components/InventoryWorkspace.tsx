import React, { useState, useMemo, useEffect } from "react";
import {
  Warehouse,
  SkuMetadata,
  ForecastModel,
  CurrencyCode,
  SkuSimulationState,
  PurchaseOrder,
  InterTransferRecommendation,
} from "../types";
import { formatCurrency, convertFromInr } from "../utils/currency";
import { FORECAST_MODELS_META } from "../utils/forecastModels";
import {
  Package,
  Building2,
  Calendar,
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Search,
  Filter,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Download,
  X,
  Zap,
  Truck,
  ArrowRight,
  BarChart3,
  Layers,
  Sparkles,
  Info,
  SlidersHorizontal,
  Sliders,
  DollarSign,
} from "lucide-react";

interface InventoryWorkspaceProps {
  simulationStates: SkuSimulationState[];
  selectedSkuId: string;
  onSelectSkuId: (id: string) => void;
  currentWarehouse: Warehouse;
  warehouses: Warehouse[];
  onSelectWarehouse: (id: string) => void;
  forecastHorizon: number;
  onChangeForecastHorizon: (days: number) => void;
  forecastModel: ForecastModel;
  onSelectForecastModel: (model: ForecastModel) => void;
  currency: CurrencyCode;
  theme: "dark" | "light";
  onTriggerSimulation: () => void;
  isSimulating: boolean;
  onDownloadCsv: () => void;
  onNavigateToProcurement: (skuId?: string) => void;
  onApplyMarkdown?: (skuId: string, discountPct: number) => void;
}

export type InventoryHealthStatus = "ALL" | "HEALTHY" | "LOW_STOCK" | "CRITICAL" | "OVERSTOCK";

interface SkuProcessedItem {
  state: SkuSimulationState;
  sku: SkuMetadata;
  avgDailyDemand: number;
  daysOfSupply: number;
  inventoryValueInr: number;
  healthStatus: "HEALTHY" | "LOW_STOCK" | "CRITICAL" | "OVERSTOCK";
  daysToRop: number;
  projectedStockoutDays: number;
  recommendedAction: "REPLENISH" | "REVIEW" | "TRANSFER" | "MONITOR" | "MARKDOWN";
}

const FORECAST_HORIZONS = [
  { days: 7, label: "7 Days" },
  { days: 14, label: "14 Days" },
  { days: 21, label: "21 Days" },
  { days: 30, label: "30 Days" },
];

export const InventoryWorkspace: React.FC<InventoryWorkspaceProps> = ({
  simulationStates,
  selectedSkuId,
  onSelectSkuId,
  currentWarehouse,
  warehouses,
  onSelectWarehouse,
  forecastHorizon,
  onChangeForecastHorizon,
  forecastModel,
  onSelectForecastModel,
  currency,
  theme,
  onTriggerSimulation,
  isSimulating,
  onDownloadCsv,
  onNavigateToProcurement,
  onApplyMarkdown,
}) => {
  const isDark = theme === "dark";

  // Table Controls & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryHealthStatus>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"name" | "stock" | "dos" | "risk" | "demand">("risk");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Drawer Open State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerSkuId, setDrawerSkuId] = useState<string>(selectedSkuId || (simulationStates[0]?.sku.id ?? ""));

  // Chart Interactive Tooltip State
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // Sync drawer with selected SKU
  useEffect(() => {
    if (selectedSkuId) {
      setDrawerSkuId(selectedSkuId);
    }
  }, [selectedSkuId]);

  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  // Categories extracted from real SKU data
  const categories = useMemo(() => {
    const set = new Set<string>();
    simulationStates.forEach((s) => set.add(s.sku.category));
    return Array.from(set);
  }, [simulationStates]);

  // 1. Process and normalize items with real calculated metrics
  const processedItems: SkuProcessedItem[] = useMemo(() => {
    return simulationStates.map((item) => {
      const { sku, usableStock, mcResult, historicalSales, forecastPoints } = item;

      // Avg daily demand calculation (using 30-day history or forward forecast)
      const histSum = historicalSales.reduce((acc, h) => acc + h.units, 0);
      const avgHist = historicalSales.length > 0 ? histSum / historicalSales.length : 0;
      const foreSum = forecastPoints.reduce((acc, f) => acc + f.demand, 0);
      const avgFore = forecastPoints.length > 0 ? foreSum / forecastPoints.length : 0;
      const avgDailyDemand = Number((avgHist > 0 ? avgHist : avgFore > 0 ? avgFore : sku.baseDemand).toFixed(1));

      // Days of Supply
      const daysOfSupply = avgDailyDemand > 0 ? Math.round(usableStock / avgDailyDemand) : 999;

      // Inventory Value in INR (converted on display)
      const inventoryValueInr = usableStock * sku.basePrice;

      // Days to ROP
      const unitsAboveRop = usableStock - mcResult.dynamicRop;
      const daysToRop = avgDailyDemand > 0 ? Math.round(unitsAboveRop / avgDailyDemand) : 999;

      // Projected Stockout Days
      const projectedStockoutDays = daysOfSupply;

      // Real health status assignment based on existing MC result and stock thresholds
      let healthStatus: "HEALTHY" | "LOW_STOCK" | "CRITICAL" | "OVERSTOCK" = "HEALTHY";
      if (mcResult.urgency === "CRITICAL REORDER NOW" || mcResult.stockoutProbabilityPct >= 50 || daysOfSupply <= sku.leadTimeMean) {
        healthStatus = "CRITICAL";
      } else if (mcResult.urgency === "WARNING" || usableStock <= mcResult.dynamicRop) {
        healthStatus = "LOW_STOCK";
      } else if (daysOfSupply > 45 || usableStock > mcResult.dynamicRop * 2.5) {
        healthStatus = "OVERSTOCK";
      } else {
        healthStatus = "HEALTHY";
      }

      // Recommended Action
      let recommendedAction: "REPLENISH" | "REVIEW" | "TRANSFER" | "MONITOR" | "MARKDOWN" = "MONITOR";
      if (healthStatus === "CRITICAL") {
        recommendedAction = "REPLENISH";
      } else if (healthStatus === "LOW_STOCK") {
        recommendedAction = "REVIEW";
      } else if (healthStatus === "OVERSTOCK") {
        recommendedAction = sku.isPerishable ? "MARKDOWN" : "TRANSFER";
      } else {
        recommendedAction = "MONITOR";
      }

      return {
        state: item,
        sku,
        avgDailyDemand,
        daysOfSupply,
        inventoryValueInr,
        healthStatus,
        daysToRop,
        projectedStockoutDays,
        recommendedAction,
      };
    });
  }, [simulationStates]);

  // Active SKU Simulation State for Main Forecast Chart
  const activeProcessed = useMemo(() => {
    return (
      processedItems.find((p) => p.sku.id === selectedSkuId) ||
      processedItems.find((p) => p.sku.id === drawerSkuId) ||
      processedItems[0]
    );
  }, [processedItems, selectedSkuId, drawerSkuId]);

  // Drawer SKU Simulation State
  const drawerItem = useMemo(() => {
    return processedItems.find((p) => p.sku.id === drawerSkuId) || activeProcessed;
  }, [processedItems, drawerSkuId, activeProcessed]);

  // 2. High-Level Inventory Health Summary Metrics (100% Calculated)
  const healthSummary = useMemo(() => {
    const totalSkus = processedItems.length;
    const totalValueInr = processedItems.reduce((acc, p) => acc + p.inventoryValueInr, 0);
    const criticalCount = processedItems.filter((p) => p.healthStatus === "CRITICAL").length;
    const lowStockCount = processedItems.filter((p) => p.healthStatus === "LOW_STOCK").length;
    const healthyCount = processedItems.filter((p) => p.healthStatus === "HEALTHY").length;
    const overstockCount = processedItems.filter((p) => p.healthStatus === "OVERSTOCK").length;

    const validDos = processedItems.map((p) => p.daysOfSupply).filter((d) => d < 900);
    const avgDaysOfSupply = validDos.length > 0 ? Math.round(validDos.reduce((a, b) => a + b, 0) / validDos.length) : 0;

    // Average RMSE across active models
    const avgRmse =
      simulationStates.length > 0
        ? (simulationStates.reduce((acc, s) => acc + s.rmse, 0) / simulationStates.length).toFixed(1)
        : "4.2";

    return {
      totalSkus,
      totalValueInr,
      criticalCount,
      lowStockCount,
      healthyCount,
      overstockCount,
      avgDaysOfSupply,
      avgRmse,
    };
  }, [processedItems, simulationStates]);

  // 3. Stock-Out Risk Ranking (Top Urgent Products)
  const topRiskItems = useMemo(() => {
    return [...processedItems]
      .sort((a, b) => {
        // Sort primarily by urgency and stockout probability, secondarily by days of supply
        const riskScoreA = a.state.mcResult.stockoutProbabilityPct * 2 - a.daysOfSupply;
        const riskScoreB = b.state.mcResult.stockoutProbabilityPct * 2 - b.daysOfSupply;
        return riskScoreB - riskScoreA;
      })
      .slice(0, 4);
  }, [processedItems]);

  // 4. Replenishment Priorities (Products needing immediate reorder or PO action)
  const replenishmentItems = useMemo(() => {
    return [...processedItems]
      .filter((p) => p.healthStatus === "CRITICAL" || p.healthStatus === "LOW_STOCK")
      .sort((a, b) => a.daysToRop - b.daysToRop)
      .slice(0, 4);
  }, [processedItems]);

  // 5. Filtered and Sorted Inventory Table Items
  const filteredTableItems = useMemo(() => {
    return processedItems
      .filter((item) => {
        const matchesSearch =
          item.sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "ALL" ? true : item.healthStatus === statusFilter;

        const matchesCategory =
          categoryFilter === "ALL" ? true : item.sku.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortField === "name") {
          return sortAsc
            ? a.sku.name.localeCompare(b.sku.name)
            : b.sku.name.localeCompare(a.sku.name);
        }
        if (sortField === "stock") {
          valA = a.state.usableStock;
          valB = b.state.usableStock;
        } else if (sortField === "dos") {
          valA = a.daysOfSupply;
          valB = b.daysOfSupply;
        } else if (sortField === "risk") {
          valA = a.state.mcResult.stockoutProbabilityPct;
          valB = b.state.mcResult.stockoutProbabilityPct;
        } else if (sortField === "demand") {
          valA = a.avgDailyDemand;
          valB = b.avgDailyDemand;
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [processedItems, searchTerm, statusFilter, categoryFilter, sortField, sortAsc]);

  // Paginated table items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredTableItems.slice(start, start + rowsPerPage);
  }, [filteredTableItems, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTableItems.length / rowsPerPage));

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  // Open Drawer Helper
  const handleOpenDrawer = (skuId: string) => {
    setDrawerSkuId(skuId);
    onSelectSkuId(skuId);
    setIsDrawerOpen(true);
  };

  // Forecast Model Meta
  const activeModelMeta = FORECAST_MODELS_META[forecastModel] || FORECAST_MODELS_META.META_PROPHET;

  // Chart Calculations for Active SKU
  const chartPoints = useMemo(() => {
    if (!activeProcessed) return [];
    const { state } = activeProcessed;
    const hist = state.historicalSales.slice(-21); // 21 historical days
    const fore = state.forecastPoints; // forward forecast points

    return [
      ...hist.map((h) => ({
        date: h.date,
        actual: h.units,
        pred: null as number | null,
        lower: null as number | null,
        upper: null as number | null,
        isForecast: false,
      })),
      ...fore.map((f) => ({
        date: f.date,
        actual: null as number | null,
        pred: f.demand,
        lower: f.lowerBound,
        upper: f.upperBound,
        isForecast: true,
      })),
    ];
  }, [activeProcessed]);

  const foreIdxOffset = useMemo(() => {
    return chartPoints.findIndex((p) => p.isForecast);
  }, [chartPoints]);

  const maxChartVal = useMemo(() => {
    if (!activeProcessed) return 100;
    const allVals = chartPoints.flatMap((p) => [p.actual ?? 0, p.upper ?? 0, p.pred ?? 0]);
    const maxVal = Math.max(...allVals, activeProcessed.state.mcResult.dynamicRop, activeProcessed.state.usableStock);
    return Math.max(50, Math.ceil((maxVal * 1.15) / 10) * 10);
  }, [chartPoints, activeProcessed]);

  // Chart SVG Dimensions
  const cWidth = 980;
  const cHeight = 310;
  const cPad = { top: 28, right: 35, bottom: 42, left: 55 };
  const innerW = cWidth - cPad.left - cPad.right;
  const innerH = cHeight - cPad.top - cPad.bottom;

  const getX = (idx: number) => {
    if (chartPoints.length <= 1) return cPad.left;
    return cPad.left + (idx / (chartPoints.length - 1)) * innerW;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(maxChartVal, val));
    return cPad.top + innerH * (1 - clamped / maxChartVal);
  };

  // Build SVG Paths
  const histPath = useMemo(() => {
    if (foreIdxOffset <= 0) return "";
    let d = "";
    for (let i = 0; i < foreIdxOffset; i++) {
      const p = chartPoints[i];
      if (p.actual !== null) {
        const x = getX(i);
        const y = getY(p.actual);
        d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
    }
    return d;
  }, [chartPoints, foreIdxOffset, maxChartVal]);

  const forePath = useMemo(() => {
    if (foreIdxOffset < 0) return "";
    let d = "";
    // Connect from last historical point for continuity
    const startIdx = Math.max(0, foreIdxOffset - 1);
    for (let i = startIdx; i < chartPoints.length; i++) {
      const p = chartPoints[i];
      const val = p.actual ?? p.pred ?? 0;
      const x = getX(i);
      const y = getY(val);
      d += i === startIdx ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d;
  }, [chartPoints, foreIdxOffset, maxChartVal]);

  const confidenceBandPath = useMemo(() => {
    if (foreIdxOffset < 0) return "";
    const foreOnly = chartPoints.filter((p) => p.isForecast && p.lower !== null && p.upper !== null);
    if (foreOnly.length === 0) return "";

    let upperD = "";
    let lowerD = "";

    foreOnly.forEach((p, idx) => {
      const globalIdx = foreIdxOffset + idx;
      const x = getX(globalIdx);
      const yUpper = getY(p.upper!);
      const yLower = getY(p.lower!);

      if (idx === 0) {
        upperD = `M ${x} ${yUpper}`;
        lowerD = `L ${x} ${yLower}`;
      } else {
        upperD += ` L ${x} ${yUpper}`;
        lowerD = ` L ${x} ${yLower}` + lowerD;
      }
    });

    return upperD + lowerD + " Z";
  }, [chartPoints, foreIdxOffset, maxChartVal]);

  // Active Tooltip Point
  const activeTooltipPoint = hoveredPointIdx !== null ? chartPoints[hoveredPointIdx] : null;

  // Real Calculated Insights for Active SKU
  const activeSkuInsights = useMemo(() => {
    if (!activeProcessed) {
      return {
        trendText: "Loading trajectory analysis...",
        reorderText: "Calculating buffer breach timeline...",
        supplierText: "Analyzing historical vendor fulfillment reliability...",
      };
    }

    const { state, avgDailyDemand, daysToRop, daysOfSupply } = activeProcessed;
    const hist = state.historicalSales.slice(-7);
    const fore = state.forecastPoints.slice(0, 7);

    const hist7Avg = hist.length > 0 ? hist.reduce((a, b) => a + b.units, 0) / hist.length : avgDailyDemand;
    const fore7Avg = fore.length > 0 ? fore.reduce((a, b) => a + b.demand, 0) / fore.length : avgDailyDemand;

    const pctChange = hist7Avg > 0 ? ((fore7Avg - hist7Avg) / hist7Avg) * 100 : 0;
    const formattedChange = Math.abs(pctChange).toFixed(1);

    const trendText =
      pctChange > 2
        ? `Forward demand is projected to surge by +${formattedChange}% over the next 7 days (${Math.round(fore7Avg)} units/day vs. ${Math.round(hist7Avg)} units/day historical baseline).`
        : pctChange < -2
        ? `Expected demand cools down by -${formattedChange}% over the coming week (${Math.round(fore7Avg)} units/day vs. ${Math.round(hist7Avg)} units/day baseline).`
        : `Demand is holding steady at equilibrium run-rate (~${Math.round(avgDailyDemand)} units/day).`;

    const reorderText =
      daysToRop <= 0
        ? `Usable inventory (${state.usableStock} units) is already BELOW the dynamic Reorder Point (${state.mcResult.dynamicRop} units). Stock-out probability is ${state.mcResult.stockoutProbabilityPct}%.`
        : daysToRop <= 5
        ? `Current buffer will breach the Reorder Point (${state.mcResult.dynamicRop} units) in ${daysToRop} days at projected consumption velocity.`
        : `Sufficient runway available. Reorder Point (${state.mcResult.dynamicRop} units) projected breach in ${daysToRop} days (${daysOfSupply} total days of supply).`;

    const supplierText = `Primary vendor ${state.sku.supplierName} operates with ${state.effectiveLeadTimeMean.toFixed(1)}d mean lead time (Grade ${state.supplierScorecard.grade}, ${state.supplierScorecard.onTimeDeliveryPct}% on-time). Recommended reorder batch: ${state.mcResult.recommendedReorderQty} units.`;

    return { trendText, reorderText, supplierText };
  }, [activeProcessed]);

  return (
    <div className="space-y-8 animate-in fade-in duration-150 pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            INVENTORY INTELLIGENCE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white mt-0.5">
            Inventory &amp; Forecast
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-1 font-medium max-w-2xl">
            Monitor stock health, anticipate demand, and act before inventory becomes a problem.
          </p>
        </div>

        {/* Compact Right-Side Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Facility / Warehouse Switcher */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <select
              value={currentWarehouse.id}
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

          {/* Run Engine Simulation CTA */}
          <button
            type="button"
            onClick={onTriggerSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isSimulating
                ? "opacity-75 cursor-not-allowed bg-emerald-600 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white"
            }`}
            title="Execute Monte Carlo simulation and update buffers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Simulating..." : "Run Engine"}</span>
          </button>

          {/* Export Report CSV */}
          <button
            type="button"
            onClick={onDownloadCsv}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isDark
                ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                : "bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs"
            }`}
            title="Download CSV audit dossier"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. INVENTORY HEALTH SUMMARY (COMPACT REAL-DATA CARDS) */}
      <section aria-label="Inventory Health Summary">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Metric 1: Total SKUs */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">Total Catalog</div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {healthSummary.totalSkus}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Active SKUs monitored</div>
          </div>

          {/* Metric 2: Inventory Value */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">Inventory Value</div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {formatCurrency(healthSummary.totalValueInr, currency, { compact: true })}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Usable stock on hand</div>
          </div>

          {/* Metric 3: Critical / Stock-out Risk */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              healthSummary.criticalCount > 0
                ? isDark
                  ? "bg-rose-950/20 border-rose-900/40"
                  : "bg-rose-50/70 border-rose-200"
                : isDark
                ? "bg-neutral-900/60 border-neutral-800"
                : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 flex items-center justify-between">
              <span>Critical Risk</span>
              {healthSummary.criticalCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-700 dark:text-rose-400 mt-1">
              {healthSummary.criticalCount}
            </div>
            <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">Immediate reorder required</div>
          </div>

          {/* Metric 4: Low Stock */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Low Stock</div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">
              {healthSummary.lowStockCount}
            </div>
            <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">Below dynamic ROP</div>
          </div>

          {/* Metric 5: Days of Supply */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">Days of Supply</div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {healthSummary.avgDaysOfSupply}d
            </div>
            <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Weighted network runway</div>
          </div>

          {/* Metric 6: Forecast Error / Accuracy */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">Avg Model RMSE</div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
              ±{healthSummary.avgRmse}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Daily forecast deviation</div>
          </div>
        </div>
      </section>

      {/* 3. INVENTORY HEALTH DISTRIBUTION (SEGMENTED BAR + FILTERING) */}
      <section
        className={`p-4 rounded-xl border transition-colors ${
          isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-white border-slate-200 shadow-xs"
        }`}
        aria-label="Inventory Health Distribution"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-950 dark:text-white">Inventory Health Distribution</h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Breakdown across operating states. Click any status to filter the table below.
            </p>
          </div>

          {statusFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Status Filter ({statusFilter.replace("_", " ")})</span>
            </button>
          )}
        </div>

        {/* Visual Segmented Distribution Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-neutral-800 flex overflow-hidden p-0.5 gap-1">
          {healthSummary.healthyCount > 0 && (
            <div
              style={{ width: `${(healthSummary.healthyCount / healthSummary.totalSkus) * 100}%` }}
              className="h-full bg-emerald-500 rounded-full transition-all cursor-pointer"
              title={`Healthy: ${healthSummary.healthyCount} SKUs`}
              onClick={() => setStatusFilter("HEALTHY")}
            />
          )}
          {healthSummary.lowStockCount > 0 && (
            <div
              style={{ width: `${(healthSummary.lowStockCount / healthSummary.totalSkus) * 100}%` }}
              className="h-full bg-amber-500 rounded-full transition-all cursor-pointer"
              title={`Low Stock: ${healthSummary.lowStockCount} SKUs`}
              onClick={() => setStatusFilter("LOW_STOCK")}
            />
          )}
          {healthSummary.criticalCount > 0 && (
            <div
              style={{ width: `${(healthSummary.criticalCount / healthSummary.totalSkus) * 100}%` }}
              className="h-full bg-rose-500 rounded-full transition-all cursor-pointer"
              title={`Critical Risk: ${healthSummary.criticalCount} SKUs`}
              onClick={() => setStatusFilter("CRITICAL")}
            />
          )}
          {healthSummary.overstockCount > 0 && (
            <div
              style={{ width: `${(healthSummary.overstockCount / healthSummary.totalSkus) * 100}%` }}
              className="h-full bg-blue-500 rounded-full transition-all cursor-pointer"
              title={`Overstock: ${healthSummary.overstockCount} SKUs`}
              onClick={() => setStatusFilter("OVERSTOCK")}
            />
          )}
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : isDark
                ? "text-neutral-400 hover:text-white hover:bg-neutral-800"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Items ({healthSummary.totalSkus})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("HEALTHY")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "HEALTHY"
                ? "bg-emerald-600 text-white"
                : isDark
                ? "text-emerald-400 hover:bg-emerald-950/40"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Healthy ({healthSummary.healthyCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("LOW_STOCK")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "LOW_STOCK"
                ? "bg-amber-600 text-white"
                : isDark
                ? "text-amber-400 hover:bg-amber-950/40"
                : "text-amber-700 hover:bg-amber-50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Low Stock ({healthSummary.lowStockCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("CRITICAL")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "CRITICAL"
                ? "bg-rose-600 text-white"
                : isDark
                ? "text-rose-400 hover:bg-rose-950/40"
                : "text-rose-700 hover:bg-rose-50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Critical ({healthSummary.criticalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("OVERSTOCK")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "OVERSTOCK"
                ? "bg-blue-600 text-white"
                : isDark
                ? "text-blue-400 hover:bg-blue-950/40"
                : "text-blue-700 hover:bg-blue-50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Overstock ({healthSummary.overstockCount})</span>
          </button>
        </div>
      </section>

      {/* 4. MAIN DEMAND FORECAST SECTION (PRIMARY VISUAL ANCHOR) */}
      <section
        className={`p-5 sm:p-6 rounded-2xl border transition-colors shadow-xs ${
          isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
        }`}
        aria-label="Demand Forecast"
      >
        {/* Header & Functional Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white">
                Demand Forecast
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 font-medium max-w-xl">
              Compare historical demand with expected demand and identify upcoming inventory pressure.
            </p>
          </div>

          {/* Interactive Chart Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Product / SKU Selector Dropdown */}
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={activeProcessed?.sku.id || ""}
                onChange={(e) => onSelectSkuId(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[210px] truncate ${
                  isDark
                    ? "bg-neutral-950 border-neutral-700 text-neutral-100"
                    : "bg-slate-50 border-slate-300 text-slate-900"
                }`}
                aria-label="Select SKU for forecast chart"
              >
                {simulationStates.map((s) => (
                  <option key={s.sku.id} value={s.sku.id}>
                    {s.sku.name} ({s.sku.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Forecast Horizon Buttons */}
            <div
              className={`p-1 rounded-lg border flex items-center gap-1 ${
                isDark ? "bg-neutral-950 border-neutral-800" : "bg-slate-100 border-slate-200"
              }`}
            >
              {FORECAST_HORIZONS.map((h) => (
                <button
                  key={h.days}
                  type="button"
                  onClick={() => onChangeForecastHorizon(h.days)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    forecastHorizon === h.days
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isDark
                      ? "text-neutral-400 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>

            {/* Forecast Model Selection */}
            <div className="hidden sm:flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={forecastModel}
                onChange={(e) => onSelectForecastModel(e.target.value as ForecastModel)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDark
                    ? "bg-neutral-950 border-neutral-700 text-neutral-100"
                    : "bg-slate-50 border-slate-300 text-slate-900"
                }`}
                aria-label="Select ML forecasting model"
              >
                {Object.values(FORECAST_MODELS_META).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Product Context Strip */}
        {activeProcessed && (
          <div className="flex items-center justify-between py-2 text-xs text-slate-500 dark:text-neutral-400 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">{activeProcessed.sku.name}</span>
              <span>·</span>
              <span className="font-mono">{activeProcessed.sku.id}</span>
              <span>·</span>
              <span>{activeProcessed.sku.category}</span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>Current: <strong className="text-slate-900 dark:text-white">{activeProcessed.state.usableStock}</strong> units</span>
              <span>·</span>
              <span className="text-amber-700 dark:text-amber-400">ROP: {activeProcessed.state.mcResult.dynamicRop}</span>
              <span>·</span>
              <span className="text-emerald-700 dark:text-emerald-400">Safety: {activeProcessed.state.mcResult.dynamicSafetyStock}</span>
            </div>
          </div>
        )}

        {/* Interactive Full-Width Forecast SVG Canvas */}
        <div className="relative w-full mt-2 overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${cWidth} ${cHeight}`}
            className="w-full h-auto"
            onMouseLeave={() => setHoveredPointIdx(null)}
          >
            <defs>
              <linearGradient id="foreShadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isDark ? "#10B981" : "#059669"} stopOpacity={isDark ? "0.15" : "0.08"} />
                <stop offset="100%" stopColor={isDark ? "#10B981" : "#059669"} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Shaded Forecast Horizon Background */}
            {foreIdxOffset >= 0 && (
              <rect
                x={getX(foreIdxOffset - 1)}
                y={cPad.top}
                width={cWidth - cPad.right - getX(foreIdxOffset - 1)}
                height={innerH}
                fill={isDark ? "rgba(16, 185, 129, 0.04)" : "rgba(16, 185, 129, 0.03)"}
              />
            )}

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = cPad.top + innerH * (1 - pct);
              const val = Math.round(maxChartVal * pct);
              return (
                <g key={i}>
                  <line
                    x1={cPad.left}
                    y1={y}
                    x2={cWidth - cPad.right}
                    y2={y}
                    stroke={isDark ? "#262626" : "#E2E8F0"}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={cPad.left - 10}
                    y={y + 3.5}
                    fill={isDark ? "#737373" : "#94A3B8"}
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Dynamic Reorder Point Line (ROP) */}
            {activeProcessed && activeProcessed.state.mcResult.dynamicRop <= maxChartVal && (
              <g>
                <line
                  x1={cPad.left}
                  y1={getY(activeProcessed.state.mcResult.dynamicRop)}
                  x2={cWidth - cPad.right}
                  y2={getY(activeProcessed.state.mcResult.dynamicRop)}
                  stroke="#D97706"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                <text
                  x={cWidth - cPad.right}
                  y={getY(activeProcessed.state.mcResult.dynamicRop) - 5}
                  fill="#D97706"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  ROP: {activeProcessed.state.mcResult.dynamicRop} units
                </text>
              </g>
            )}

            {/* Dynamic Safety Stock Line */}
            {activeProcessed && activeProcessed.state.mcResult.dynamicSafetyStock <= maxChartVal && (
              <g>
                <line
                  x1={cPad.left}
                  y1={getY(activeProcessed.state.mcResult.dynamicSafetyStock)}
                  x2={cWidth - cPad.right}
                  y2={getY(activeProcessed.state.mcResult.dynamicSafetyStock)}
                  stroke="#059669"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                <text
                  x={cWidth - cPad.right}
                  y={getY(activeProcessed.state.mcResult.dynamicSafetyStock) + 12}
                  fill="#059669"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  Safety Stock: {activeProcessed.state.mcResult.dynamicSafetyStock} units
                </text>
              </g>
            )}

            {/* 95% Confidence Band Polygon */}
            {confidenceBandPath && (
              <path
                d={confidenceBandPath}
                fill={isDark ? "rgba(16, 185, 129, 0.18)" : "rgba(16, 185, 129, 0.12)"}
              />
            )}

            {/* Historical Actual Demand Curve */}
            {histPath && (
              <path
                d={histPath}
                fill="none"
                stroke={isDark ? "#94A3B8" : "#64748B"}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            )}

            {/* Projected Forecast Demand Curve */}
            {forePath && (
              <path
                d={forePath}
                fill="none"
                stroke={isDark ? "#34D399" : "#059669"}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            )}

            {/* Vertical Marker: Separation between Past and Forecast */}
            {foreIdxOffset >= 0 && (
              <g>
                <line
                  x1={getX(foreIdxOffset - 1)}
                  y1={cPad.top}
                  x2={getX(foreIdxOffset - 1)}
                  y2={cPad.top + innerH}
                  stroke={isDark ? "#10B981" : "#059669"}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={getX(foreIdxOffset - 1) + 6}
                  y={cPad.top + 14}
                  fill={isDark ? "#34D399" : "#059669"}
                  fontSize="10"
                  fontWeight="bold"
                >
                  Forecast Begins →
                </text>
              </g>
            )}

            {/* Interactive Data Points and Broad Hit Areas */}
            {chartPoints.map((p, idx) => {
              const cx = getX(idx);
              const cy = getY(p.actual ?? p.pred ?? 0);
              const isHovered = hoveredPointIdx === idx;
              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredPointIdx(idx)}
                  className="cursor-pointer"
                >
                  {/* Invisible broad hit box */}
                  <rect
                    x={cx - 10}
                    y={cPad.top}
                    width="20"
                    height={innerH}
                    fill="transparent"
                  />

                  {/* Circle dot on curve */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5 : p.isForecast ? 3.5 : 2.5}
                    fill={p.isForecast ? (isDark ? "#34D399" : "#059669") : isDark ? "#CBD5E1" : "#475569"}
                    stroke={isDark ? "#09090B" : "#FFFFFF"}
                    strokeWidth="1.5"
                  />

                  {/* Active vertical guideline */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={cPad.top}
                      x2={cx}
                      y2={cPad.top + innerH}
                      stroke={isDark ? "#FFFFFF" : "#0F172A"}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                </g>
              );
            })}

            {/* X-Axis Date Ticks (Distributed sample) */}
            {chartPoints
              .filter((_, i) => i % Math.max(1, Math.floor(chartPoints.length / 8)) === 0)
              .map((p, i) => {
                const idx = chartPoints.indexOf(p);
                return (
                  <text
                    key={i}
                    x={getX(idx)}
                    y={cPad.top + innerH + 22}
                    fill={isDark ? "#737373" : "#64748B"}
                    fontSize="9.5"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {p.date.slice(5)}
                  </text>
                );
              })}
          </svg>

          {/* Interactive Floating Hover Tooltip */}
          {activeTooltipPoint && hoveredPointIdx !== null && (
            <div
              className={`absolute top-4 pointer-events-none p-3 rounded-xl border shadow-lg text-xs z-20 transition-all ${
                isDark
                  ? "bg-neutral-950/95 border-neutral-700 text-neutral-100"
                  : "bg-white/95 border-slate-300 text-slate-900 shadow-md backdrop-blur-xs"
              }`}
              style={{
                left: `${Math.min(
                  82,
                  Math.max(14, (hoveredPointIdx / Math.max(1, chartPoints.length - 1)) * 100)
                )}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="font-bold flex items-center justify-between gap-3 pb-1 border-b border-slate-200 dark:border-neutral-800">
                <span>Date: {activeTooltipPoint.date}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    activeTooltipPoint.isForecast
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300"
                  }`}
                >
                  {activeTooltipPoint.isForecast ? "ML Forecast" : "Historical Actual"}
                </span>
              </div>
              <div className="mt-1.5 space-y-1">
                {activeTooltipPoint.actual !== null ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 dark:text-neutral-400">Actual Sales:</span>
                    <strong className="font-mono text-slate-950 dark:text-white">
                      {activeTooltipPoint.actual} units
                    </strong>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        Predicted Demand:
                      </span>
                      <strong className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {activeTooltipPoint.pred} units
                      </strong>
                    </div>
                    {activeTooltipPoint.lower !== null && activeTooltipPoint.upper !== null && (
                      <div className="flex justify-between gap-4 text-[11px] text-slate-500 dark:text-neutral-400">
                        <span>95% Confidence:</span>
                        <span className="font-mono">
                          {activeTooltipPoint.lower} – {activeTooltipPoint.upper} units
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-1 bg-slate-500 rounded-full" />
              <span>Historical Demand</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-1 bg-emerald-600 rounded-full" />
              <span>Forecast Demand</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xs" />
              <span>95% Confidence Band</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-0.5 border-t border-dashed border-amber-500" />
              <span className="text-amber-700 dark:text-amber-400 font-semibold">Reorder Point (ROP)</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-0.5 border-t border-dashed border-emerald-500" />
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Safety Stock Buffer</span>
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
            Model: {activeModelMeta.name} ({forecastHorizon}d forward)
          </div>
        </div>

        {/* 10. FORECAST INSIGHTS (ACTIONABLE CALCULATED REALITIES) */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-neutral-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-2">
            Forecast Insights · {activeProcessed?.sku.name}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Insight 1: Trajectory */}
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                isDark ? "bg-neutral-950/60 border-neutral-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Demand Velocity Trajectory</span>
              </div>
              <p className="text-slate-600 dark:text-neutral-400 leading-relaxed font-medium">
                {activeSkuInsights.trendText}
              </p>
            </div>

            {/* Insight 2: Reorder Horizon */}
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                activeProcessed?.healthStatus === "CRITICAL"
                  ? isDark
                    ? "bg-rose-950/20 border-rose-900/40"
                    : "bg-rose-50 border-rose-200"
                  : isDark
                  ? "bg-neutral-950/60 border-neutral-800"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div
                className={`font-bold flex items-center gap-1.5 ${
                  activeProcessed?.healthStatus === "CRITICAL"
                    ? "text-rose-700 dark:text-rose-400"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Buffer Depletion Horizon</span>
              </div>
              <p className="text-slate-600 dark:text-neutral-400 leading-relaxed font-medium">
                {activeSkuInsights.reorderText}
              </p>
            </div>

            {/* Insight 3: Supplier Lead Time & Action */}
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                isDark ? "bg-neutral-950/60 border-neutral-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-500" />
                <span>Procurement Lead Time SLA</span>
              </div>
              <p className="text-slate-600 dark:text-neutral-400 leading-relaxed font-medium">
                {activeSkuInsights.supplierText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STOCK-OUT RISK & REPLENISHMENT PRIORITIES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION A: Stock-Out Risk */}
        <section
          className={`p-5 rounded-2xl border transition-colors shadow-xs ${
            isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
          }`}
          aria-label="Stock-Out Risk"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h2 className="text-base font-bold text-slate-950 dark:text-white">Stock-Out Risk</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 font-medium">
                Products most likely to experience inventory shortages, ranked by stochastic failure probability.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-neutral-800 mt-2">
            {topRiskItems.map((item) => (
              <div
                key={item.sku.id}
                onClick={() => handleOpenDrawer(item.sku.id)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {item.sku.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                      {item.sku.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>Stock: <strong className="font-mono text-slate-800 dark:text-neutral-200">{item.state.usableStock}</strong></span>
                    <span>·</span>
                    <span>Demand: <strong className="font-mono">{item.avgDailyDemand}/d</strong></span>
                    <span>·</span>
                    <span>Runway: <strong className="font-mono">{item.daysOfSupply}d</strong></span>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <div className="text-xs font-mono font-extrabold text-rose-600 dark:text-rose-400">
                      {item.state.mcResult.stockoutProbabilityPct}% Risk
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 dark:text-neutral-500 mt-0.5">
                      ROP: {item.state.mcResult.dynamicRop}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION B: Replenishment Priorities */}
        <section
          className={`p-5 rounded-2xl border transition-colors shadow-xs ${
            isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
          }`}
          aria-label="Replenishment Priorities"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-bold text-slate-950 dark:text-white">Replenishment Priorities</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 font-medium">
                Action-oriented reorders connecting directly to the procurement workflow.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-neutral-800 mt-2">
            {replenishmentItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-neutral-400">
                All inventory items are currently operating above their Dynamic Reorder Points.
              </div>
            ) : (
              replenishmentItems.map((item) => (
                <div
                  key={item.sku.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 px-2 rounded-xl transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {item.sku.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                        {item.sku.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>Stock: <strong className="font-mono text-slate-800 dark:text-neutral-200">{item.state.usableStock}</strong></span>
                      <span>/</span>
                      <span>ROP: <strong className="font-mono text-amber-600">{item.state.mcResult.dynamicRop}</strong></span>
                      <span>·</span>
                      <span>Batch: <strong className="font-mono text-emerald-600">+{item.state.mcResult.recommendedReorderQty}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToProcurement(item.sku.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
                      title="Open Purchase Order batch in Procurement"
                    >
                      Replenish
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDrawer(item.sku.id)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        isDark ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800" : "border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                      title="Inspect SKU details"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 6. MAIN INVENTORY TABLE (OPERATIONAL WORKSPACE) */}
      <section
        className={`rounded-2xl border transition-colors shadow-xs overflow-hidden ${
          isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-white border-slate-200"
        }`}
        aria-label="Inventory Items"
      >
        {/* Table Top Controls: Search, Category Filter, Sorting */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-white">Inventory Items</h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 font-medium">
                Active catalog inventory levels, forward run-rate demand, safety stock buffers, and replenishment triggers.
              </p>
            </div>

            <div className="text-xs font-mono text-slate-400 dark:text-neutral-500">
              Showing {filteredTableItems.length} of {processedItems.length} SKUs
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by SKU, product name, supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDark
                    ? "bg-neutral-950 border-neutral-700 text-neutral-100 placeholder-neutral-500"
                    : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown and Sort Field Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDark
                    ? "bg-neutral-950 border-neutral-700 text-neutral-200"
                    : "bg-slate-50 border-slate-300 text-slate-700"
                }`}
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Sort By Field */}
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDark
                    ? "bg-neutral-950 border-neutral-700 text-neutral-200"
                    : "bg-slate-50 border-slate-300 text-slate-700"
                }`}
              >
                <option value="risk">Sort: Stockout Risk</option>
                <option value="stock">Sort: Current Stock</option>
                <option value="dos">Sort: Days of Supply</option>
                <option value="demand">Sort: Daily Demand</option>
                <option value="name">Sort: Product Name</option>
              </select>

              {/* Asc / Desc Toggle */}
              <button
                type="button"
                onClick={() => setSortAsc(!sortAsc)}
                className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                  isDark
                    ? "bg-neutral-950 border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                    : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
                title={sortAsc ? "Sort Ascending" : "Sort Descending"}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Confined Scrollable Table Container */}
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
                <th className="py-3 px-4 font-semibold">SKU &amp; Product</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">Usable Stock</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Daily Demand</th>
                <th className="py-3 px-4 font-semibold text-right">Dynamic ROP</th>
                <th className="py-3 px-4 font-semibold text-right">Safety Buffer</th>
                <th className="py-3 px-4 font-semibold text-right">Days of Supply</th>
                <th className="py-3 px-4 font-semibold text-center">Stockout Risk</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-slate-500 dark:text-neutral-400">
                    No inventory items match your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isSelected = selectedSkuId === item.sku.id;
                  const isCrit = item.healthStatus === "CRITICAL";

                  return (
                    <tr
                      key={item.sku.id}
                      onClick={() => handleOpenDrawer(item.sku.id)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? isDark
                            ? "bg-emerald-950/25 border-l-4 border-emerald-500"
                            : "bg-emerald-50/70 border-l-4 border-emerald-600"
                          : isDark
                          ? `hover:bg-neutral-800/40 ${isCrit ? "bg-rose-950/10" : ""}`
                          : `hover:bg-slate-50 ${isCrit ? "bg-rose-50/40" : ""}`
                      }`}
                    >
                      {/* SKU & Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.sku.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 flex items-center gap-1.5 mt-0.5">
                          <span>{item.sku.id}</span>
                          <span>·</span>
                          <span>{item.sku.supplierName}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600 dark:text-neutral-300">
                        {item.sku.category}
                      </td>

                      {/* Usable Stock */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {item.state.usableStock}
                        {item.state.decayedUnits > 0 && (
                          <span className="block text-[10px] text-rose-500 font-normal">
                            (-{item.state.decayedUnits} decay)
                          </span>
                        )}
                      </td>

                      {/* Avg Daily Demand */}
                      <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-neutral-300">
                        {item.avgDailyDemand} /d
                      </td>

                      {/* Dynamic ROP */}
                      <td className="py-3 px-4 text-right font-mono text-amber-700 dark:text-amber-400 font-semibold">
                        {item.state.mcResult.dynamicRop}
                      </td>

                      {/* Safety Buffer */}
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        {item.state.mcResult.dynamicSafetyStock}
                      </td>

                      {/* Days of Supply */}
                      <td className="py-3 px-4 text-right font-mono">
                        <span
                          className={`font-bold ${
                            item.daysOfSupply <= 3
                              ? "text-rose-600 dark:text-rose-400"
                              : item.daysOfSupply <= 7
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {item.daysOfSupply}d
                        </span>
                      </td>

                      {/* Stockout Risk */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`font-extrabold ${
                            item.state.mcResult.stockoutProbabilityPct >= 50
                              ? "text-rose-600 dark:text-rose-400"
                              : item.state.mcResult.stockoutProbabilityPct >= 20
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {item.state.mcResult.stockoutProbabilityPct}%
                        </span>
                      </td>

                      {/* Health Status */}
                      <td className="py-3 px-4">
                        {item.healthStatus === "CRITICAL" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span>Critical</span>
                          </span>
                        ) : item.healthStatus === "LOW_STOCK" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Low Stock</span>
                          </span>
                        ) : item.healthStatus === "OVERSTOCK" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>Overstock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Healthy</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer(item.sku.id);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                            isDark
                              ? "border-neutral-700 hover:bg-neutral-800 text-neutral-200"
                              : "border-slate-200 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                currentPage <= 1
                  ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-neutral-800"
                  : isDark
                  ? "border-neutral-700 hover:bg-neutral-800 text-neutral-200"
                  : "border-slate-300 hover:bg-slate-100 text-slate-700"
              }`}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                currentPage >= totalPages
                  ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-neutral-800"
                  : isDark
                  ? "border-neutral-700 hover:bg-neutral-800 text-neutral-200"
                  : "border-slate-300 hover:bg-slate-100 text-slate-700"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* 7. PRODUCT DETAIL SLIDE-OVER DRAWER */}
      {isDrawerOpen && drawerItem && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            className={`relative w-full max-w-md h-full shadow-2xl flex flex-col z-10 overflow-y-auto animate-in slide-in-from-right duration-200 ${
              isDark ? "bg-[#09090B] border-l border-neutral-800 text-neutral-100" : "bg-white border-l border-slate-200 text-slate-900"
            }`}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {drawerItem.sku.category} · {drawerItem.sku.id}
                </div>
                <h3 className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white mt-0.5">
                  {drawerItem.sku.name}
                </h3>
                <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Fulfillment Node: {currentWarehouse.name} ({currentWarehouse.city})
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close detail drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-5 space-y-6 flex-1">
              {/* Health Grid */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-2">
                  Inventory Health
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`p-3 rounded-xl border ${
                      isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400">Usable Stock</div>
                    <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                      {drawerItem.state.usableStock} units
                    </div>
                    {drawerItem.state.decayedUnits > 0 && (
                      <div className="text-[10px] text-rose-500 mt-0.5">
                        {drawerItem.state.decayedUnits} units spoiled
                      </div>
                    )}
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400">Days of Supply</div>
                    <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                      {drawerItem.daysOfSupply} days
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
                      Run-rate: {drawerItem.avgDailyDemand}/d
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400">Stockout Risk</div>
                    <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                      {drawerItem.state.mcResult.stockoutProbabilityPct}%
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
                      Status: {drawerItem.healthStatus}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400">Inventory Valuation</div>
                    <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                      {formatCurrency(drawerItem.inventoryValueInr, currency, { compact: true })}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
                      Unit: {formatCurrency(drawerItem.sku.basePrice, currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Demand Trend Sparkline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                    Demand Forecast Sparkline
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    ROP: {drawerItem.state.mcResult.dynamicRop}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-xl border overflow-hidden ${
                    isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <svg viewBox="0 0 340 90" className="w-full h-20">
                    {/* Horizontal ROP reference */}
                    <line
                      x1="10"
                      y1="40"
                      x2="330"
                      y2="40"
                      stroke="#D97706"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    {/* Simplified forecast curve */}
                    <path
                      d="M 10 55 Q 80 45, 150 50 T 250 35 T 330 25"
                      fill="none"
                      stroke={isDark ? "#34D399" : "#059669"}
                      strokeWidth="2.5"
                    />
                  </svg>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Trailing 21d History</span>
                    <span>Forward 14d ML Projection</span>
                  </div>
                </div>
              </div>

              {/* Replenishment Parameters */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-2">
                  Replenishment &amp; Supplier Parameters
                </div>
                <div
                  className={`p-3.5 rounded-xl border divide-y ${
                    isDark
                      ? "bg-neutral-900/60 border-neutral-800 divide-neutral-800"
                      : "bg-slate-50 border-slate-200 divide-slate-200"
                  }`}
                >
                  <div className="py-2 flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-neutral-400">Dynamic Reorder Point:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {drawerItem.state.mcResult.dynamicRop} units
                    </strong>
                  </div>
                  <div className="py-2 flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-neutral-400">Dynamic Safety Stock:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {drawerItem.state.mcResult.dynamicSafetyStock} units
                    </strong>
                  </div>
                  <div className="py-2 flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-neutral-400">Recommended PO Batch:</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      +{drawerItem.state.mcResult.recommendedReorderQty} units
                    </strong>
                  </div>
                  <div className="py-2 flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-neutral-400">Primary Supplier:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {drawerItem.sku.supplierName} (Grade {drawerItem.state.supplierScorecard.grade})
                    </span>
                  </div>
                  <div className="py-2 flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-neutral-400">Supplier Lead Time:</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {drawerItem.state.effectiveLeadTimeMean.toFixed(1)} days (±{drawerItem.state.effectiveLeadTimeStd.toFixed(1)}d)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Actions Footer */}
            <div className="p-5 border-t border-slate-200 dark:border-neutral-800 space-y-2 bg-slate-50 dark:bg-neutral-950">
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onNavigateToProcurement(drawerItem.sku.id);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Create Purchase Order in Procurement</span>
              </button>

              {drawerItem.sku.isPerishable && onApplyMarkdown && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyMarkdown(drawerItem.sku.id, 20);
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    isDark
                      ? "border-neutral-700 hover:bg-neutral-800 text-amber-400"
                      : "border-slate-300 hover:bg-slate-100 text-amber-700"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Deploy -20% Flash Markdown</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
