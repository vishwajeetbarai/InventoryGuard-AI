import React, { useState } from "react";
import { SkuSimulationState, CurrencyCode, ForecastModel } from "../types";
import { formatCurrency } from "../utils/currency";
import { FORECAST_MODELS_META } from "../utils/forecastModels";
import {
  TrendingUp,
  Sparkles,
  BarChart2,
  Activity,
  Award,
  AlertTriangle,
  ShieldCheck,
  Clock,
  CloudRain,
  Leaf,
  PackageX,
  Calendar,
  BrainCircuit,
  Zap,
  Layers,
  TrendingDown,
  Info,
} from "lucide-react";

interface VisualAnalyticsProps {
  simulationStates: SkuSimulationState[];
  selectedSkuId: string;
  onSelectSkuId: (id: string) => void;
  monteCarloIterations: number;
  weatherSurgePct?: number;
  currency?: CurrencyCode;
  forecastModel?: ForecastModel;
  theme?: "dark" | "light";
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({
  simulationStates,
  selectedSkuId,
  onSelectSkuId,
  monteCarloIterations,
  weatherSurgePct = 0,
  currency = "USD",
  forecastModel = "META_PROPHET",
  theme = "light",
}) => {
  const isDark = theme === "dark";
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  const activeState =
    simulationStates.find((s) => s.sku.id === selectedSkuId) ||
    simulationStates[0];

  if (!activeState) return null;

  const {
    sku,
    currentStock,
    usableStock,
    decayedUnits,
    decayRatePct,
    forecastPoints,
    historicalSales,
    rmse,
    mae,
    mcResult,
    supplierScorecard,
  } = activeState;

  // D. Supporting Inventory Metrics
  const totalForecastDemand = forecastPoints.reduce(
    (acc, p) => acc + p.demand,
    0
  );

  // Chart 1: Historical Sales (last 30 days) + Forecast (horizon)
  const recentHist = historicalSales.slice(-30);
  const allChart1Points = [
    ...recentHist.map((h) => ({
      date: h.date,
      actual: h.units,
      pred: null as number | null,
      lower: null as number | null,
      upper: null as number | null,
      isForecast: false,
    })),
    ...forecastPoints.map((f) => ({
      date: f.date,
      actual: null as number | null,
      pred: f.demand,
      lower: f.lowerBound,
      upper: f.upperBound,
      isForecast: true,
    })),
  ];

  // Full-width Prominent Dimensions for Main Forecast
  const c1Width = 1000;
  const c1Height = 280;
  const c1Padding = { top: 25, right: 35, bottom: 40, left: 55 };
  const innerW1 = c1Width - c1Padding.left - c1Padding.right;
  const innerH1 = c1Height - c1Padding.top - c1Padding.bottom;

  const maxVal1 =
    Math.max(
      ...allChart1Points.map((p) => Math.max(p.actual ?? 0, p.upper ?? p.pred ?? 0)),
      mcResult.dynamicRop,
      mcResult.dynamicSafetyStock,
      50
    ) * 1.15;

  const getX1 = (idx: number) =>
    c1Padding.left + (idx / Math.max(1, allChart1Points.length - 1)) * innerW1;
  const getY1 = (val: number) =>
    c1Padding.top + innerH1 - (val / maxVal1) * innerH1;

  // Historical path
  const histPoints = allChart1Points
    .map((p, idx) => ({ ...p, idx }))
    .filter((p) => p.actual !== null);
  const histPath =
    histPoints.length > 0
      ? histPoints
          .map((p, i) => `${i === 0 ? "M" : "L"} ${getX1(p.idx)} ${getY1(p.actual!)}`)
          .join(" ")
      : "";

  // Forecast path and confidence band
  const foreIdxOffset = recentHist.length;
  const forePath = forecastPoints
    .map(
      (p, i) => `${i === 0 ? "M" : "L"} ${getX1(foreIdxOffset + i)} ${getY1(p.demand)}`
    )
    .join(" ");

  const confidenceBandPath =
    forecastPoints.length > 0
      ? [
          forecastPoints
            .map(
              (p, i) =>
                `${i === 0 ? "M" : "L"} ${getX1(foreIdxOffset + i)} ${getY1(p.upperBound)}`
            )
            .join(" "),
          forecastPoints
            .slice()
            .reverse()
            .map(
              (p, i) =>
                `L ${getX1(foreIdxOffset + forecastPoints.length - 1 - i)} ${getY1(
                  p.lowerBound
                )}`
            )
            .join(" "),
          "Z",
        ].join(" ")
      : "";

  // Chart 2: Inventory Depletion vs ROP
  let runningStock = usableStock;
  const depletionData = forecastPoints.map((f, i) => {
    runningStock = Math.max(0, runningStock - f.demand);
    return {
      date: f.date,
      stock: runningStock,
      day: i + 1,
    };
  });

  const c2Width = 560;
  const c2Height = 220;
  const c2Padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const innerW2 = c2Width - c2Padding.left - c2Padding.right;
  const innerH2 = c2Height - c2Padding.top - c2Padding.bottom;

  const maxVal2 = Math.max(
    currentStock * 1.15,
    mcResult.dynamicRop * 1.35,
    50
  );

  const getX2 = (idx: number) =>
    c2Padding.left + (idx / Math.max(1, depletionData.length - 1)) * innerW2;
  const getY2 = (val: number) =>
    c2Padding.top + innerH2 - (val / maxVal2) * innerH2;

  const depletionPath = [
    `M ${c2Padding.left} ${getY2(usableStock)}`,
    ...depletionData.map((d, i) => `L ${getX2(i)} ${getY2(d.stock)}`),
  ].join(" ");

  const depletionArea = [
    `M ${c2Padding.left} ${getY2(usableStock)}`,
    ...depletionData.map((d, i) => `L ${getX2(i)} ${getY2(d.stock)}`),
    `L ${getX2(depletionData.length - 1)} ${c2Padding.top + innerH2}`,
    `L ${c2Padding.left} ${c2Padding.top + innerH2}`,
    "Z",
  ].join(" ");

  // Chart 3: Monte Carlo Histogram Bins
  const ddltSamples = mcResult.simulatedDdlt;
  const minDdlt = Math.min(...ddltSamples);
  const maxDdlt = Math.max(...ddltSamples);
  const binCount = 30;
  const binWidth = Math.max(1, (maxDdlt - minDdlt) / binCount);

  const bins: { binStart: number; binEnd: number; count: number }[] = [];
  for (let b = 0; b < binCount; b++) {
    const bStart = minDdlt + b * binWidth;
    const bEnd = bStart + binWidth;
    bins.push({ binStart: bStart, binEnd: bEnd, count: 0 });
  }

  for (const val of ddltSamples) {
    const bIdx = Math.min(binCount - 1, Math.floor((val - minDdlt) / binWidth));
    if (bIdx >= 0 && bIdx < binCount) {
      bins[bIdx].count++;
    }
  }

  const maxBinCount = Math.max(...bins.map((b) => b.count), 1);
  const c3Width = 560;
  const c3Height = 220;
  const c3Padding = { top: 20, right: 25, bottom: 30, left: 45 };
  const innerW3 = c3Width - c3Padding.left - c3Padding.right;
  const innerH3 = c3Height - c3Padding.top - c3Padding.bottom;

  const getX3 = (val: number) =>
    c3Padding.left + ((val - minDdlt) / Math.max(1, maxDdlt - minDdlt)) * innerW3;

  const cardCls = isDark
    ? "bg-neutral-900 border-neutral-800 text-neutral-100"
    : "bg-white border-slate-300 text-slate-900 shadow-xs";

  const gridLineColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const tickTextColor = isDark ? "#A3A3A3" : "#334155";

  const activeModelMeta =
    FORECAST_MODELS_META[activeState.forecastModel || forecastModel] ||
    FORECAST_MODELS_META.META_PROPHET;

  const activeHoveredPoint =
    hoveredPointIdx !== null ? allChart1Points[hoveredPointIdx] : null;

  return (
    <div className="space-y-6">
      {/* SECTION D: Supporting Inventory Metrics Row (5 compact cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Available Stock */}
        <div
          className={`border rounded-xl p-4 transition-colors flex flex-col justify-between ${
            isDark
              ? "bg-neutral-900 border-neutral-800 text-neutral-100"
              : "bg-white border-slate-300 text-slate-900 shadow-xs"
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 block">
              Available Stock
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white">
                {usableStock.toLocaleString()}
              </span>
              <span className="text-xs text-slate-600 dark:text-neutral-400 font-semibold">
                usable
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-neutral-800 text-[11px] text-slate-600 dark:text-neutral-400 font-medium flex items-center justify-between">
            <span>{currentStock.toLocaleString()} gross</span>
            {decayedUnits > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                -{decayedUnits} decay
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% fresh</span>
            )}
          </div>
        </div>

        {/* Metric 2: Forecast Demand */}
        <div
          className={`border rounded-xl p-4 transition-colors flex flex-col justify-between ${
            isDark
              ? "bg-neutral-900 border-neutral-800 text-neutral-100"
              : "bg-white border-slate-300 text-slate-900 shadow-xs"
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 block">
              Forecast Demand
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white">
                {Math.round(totalForecastDemand).toLocaleString()}
              </span>
              <span className="text-xs text-slate-600 dark:text-neutral-400 font-semibold">
                units
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-neutral-800 text-[11px] text-slate-600 dark:text-neutral-400 font-medium flex items-center justify-between">
            <span>{forecastPoints.length}d horizon</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              ~{(totalForecastDemand / Math.max(1, forecastPoints.length)).toFixed(1)}/day
            </span>
          </div>
        </div>

        {/* Metric 3: Dynamic Reorder Point */}
        <div
          className={`border rounded-xl p-4 transition-colors flex flex-col justify-between ${
            isDark
              ? "bg-neutral-900 border-neutral-800 text-neutral-100"
              : "bg-white border-slate-300 text-slate-900 shadow-xs"
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 block">
              Dynamic ROP
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white">
                {mcResult.dynamicRop.toLocaleString()}
              </span>
              <span className="text-xs text-slate-600 dark:text-neutral-400 font-semibold">
                units
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-neutral-800 text-[11px] text-slate-600 dark:text-neutral-400 font-medium flex items-center justify-between">
            <span>Trigger threshold</span>
            <span
              className={`font-bold ${
                usableStock <= mcResult.dynamicRop
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {usableStock <= mcResult.dynamicRop ? "Breached" : "Safe"}
            </span>
          </div>
        </div>

        {/* Metric 4: Dynamic Safety Stock */}
        <div
          className={`border rounded-xl p-4 transition-colors flex flex-col justify-between ${
            isDark
              ? "bg-neutral-900 border-neutral-800 text-neutral-100"
              : "bg-white border-slate-300 text-slate-900 shadow-xs"
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 block">
              Safety Stock
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white">
                {mcResult.dynamicSafetyStock.toLocaleString()}
              </span>
              <span className="text-xs text-slate-600 dark:text-neutral-400 font-semibold">
                buffer
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-neutral-800 text-[11px] text-slate-600 dark:text-neutral-400 font-medium flex items-center justify-between">
            <span>Dual-Variance</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Buffered
            </span>
          </div>
        </div>

        {/* Metric 5: Stock-Out Probability */}
        <div
          className={`border rounded-xl p-4 transition-colors flex flex-col justify-between col-span-2 sm:col-span-1 ${
            isDark
              ? "bg-neutral-900 border-neutral-800 text-neutral-100"
              : "bg-white border-slate-300 text-slate-900 shadow-xs"
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 block">
              Stock-Out Risk
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`text-xl sm:text-2xl font-extrabold ${
                  mcResult.stockoutProbabilityPct > 25
                    ? "text-rose-600 dark:text-rose-400"
                    : mcResult.stockoutProbabilityPct > 10
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {mcResult.stockoutProbabilityPct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-neutral-800 text-[11px] text-slate-600 dark:text-neutral-400 font-medium flex items-center justify-between">
            <span>Monte Carlo</span>
            <span
              className={`font-bold ${
                mcResult.urgency === "CRITICAL REORDER NOW"
                  ? "text-rose-600 dark:text-rose-400"
                  : mcResult.urgency === "WARNING"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {mcResult.urgency === "CRITICAL REORDER NOW"
                ? "Reorder Now"
                : mcResult.urgency === "WARNING"
                ? "Warning"
                : "Optimal"}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION C: Main Demand Forecast Visualization (Spacious Full-Width Display) */}
      <div className={`border rounded-xl p-5 shadow-sm transition-colors ${cardCls}`}>
        {/* Header with Title, Architecture, and Accuracy Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                Multi-Step Demand Forecast vs. Historical Actuals: {sku.name}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 font-medium">
              30-day historical actuals combined with {forecastPoints.length}-day forward {activeModelMeta.name} projections, 95% confidence bounds, and dynamic inventory thresholds.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 font-bold">
              RMSE: {rmse.toFixed(1)} · MAE: {mae.toFixed(1)}
            </span>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 font-semibold">
              Latency: {activeModelMeta.inferenceLatencyMs}ms
            </span>
          </div>
        </div>

        {/* Spacious Interactive SVG Canvas */}
        <div className="relative w-full mt-4 overflow-hidden">
          <svg
            viewBox={`0 0 ${c1Width} ${c1Height}`}
            className="w-full h-auto select-none"
            onMouseLeave={() => setHoveredPointIdx(null)}
          >
            {/* Horizontal Gridlines & Y-Axis Labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = c1Padding.top + innerH1 * (1 - pct);
              const val = Math.round(maxVal1 * pct);
              return (
                <g key={i}>
                  <line
                    x1={c1Padding.left}
                    y1={y}
                    x2={c1Width - c1Padding.right}
                    y2={y}
                    stroke={gridLineColor}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={c1Padding.left - 10}
                    y={y + 4}
                    fill={tickTextColor}
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="sans-serif"
                    fontWeight="500"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Threshold Reference Line: Dynamic ROP */}
            {mcResult.dynamicRop <= maxVal1 && (
              <g>
                <line
                  x1={c1Padding.left}
                  y1={getY1(mcResult.dynamicRop)}
                  x2={c1Width - c1Padding.right}
                  y2={getY1(mcResult.dynamicRop)}
                  stroke="#D97706"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                <text
                  x={c1Width - c1Padding.right}
                  y={getY1(mcResult.dynamicRop) - 6}
                  fill="#D97706"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  ROP Trigger: {mcResult.dynamicRop} units
                </text>
              </g>
            )}

            {/* Threshold Reference Line: Safety Stock */}
            {mcResult.dynamicSafetyStock <= maxVal1 && (
              <g>
                <line
                  x1={c1Padding.left}
                  y1={getY1(mcResult.dynamicSafetyStock)}
                  x2={c1Width - c1Padding.right}
                  y2={getY1(mcResult.dynamicSafetyStock)}
                  stroke="#059669"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                <text
                  x={c1Width - c1Padding.right}
                  y={getY1(mcResult.dynamicSafetyStock) + 14}
                  fill="#059669"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  Safety Buffer: {mcResult.dynamicSafetyStock} units
                </text>
              </g>
            )}

            {/* 95% Confidence Interval Band */}
            {confidenceBandPath && (
              <path
                d={confidenceBandPath}
                fill={isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.12)"}
              />
            )}

            {/* Historical Actual Sales Path */}
            {histPath && (
              <path
                d={histPath}
                fill="none"
                stroke={isDark ? "#94A3B8" : "#64748B"}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            )}

            {/* Projected Forecast Demand Path */}
            {forePath && (
              <path
                d={forePath}
                fill="none"
                stroke="#6366F1"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}

            {/* Forecast Start Vertical Divider */}
            <line
              x1={getX1(foreIdxOffset - 1)}
              y1={c1Padding.top}
              x2={getX1(foreIdxOffset - 1)}
              y2={c1Padding.top + innerH1}
              stroke="#6366F1"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
            <text
              x={getX1(foreIdxOffset - 1) + 6}
              y={c1Padding.top + 14}
              fill="#6366F1"
              fontSize="10"
              fontWeight="bold"
            >
              Forecast Horizon Start
            </text>

            {/* Interactive Data Points & Hover Targets */}
            {allChart1Points.map((p, idx) => {
              const cx = getX1(idx);
              const cy = getY1(p.actual ?? p.pred ?? 0);
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
                    y={c1Padding.top}
                    width="20"
                    height={innerH1}
                    fill="transparent"
                  />

                  {/* Circle dot on curve */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? "5" : p.isForecast ? "3" : "2"}
                    fill={p.isForecast ? "#6366F1" : isDark ? "#CBD5E1" : "#475569"}
                    stroke={isDark ? "#0F172A" : "#FFFFFF"}
                    strokeWidth="1.5"
                  />

                  {/* Active vertical hover guideline */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={c1Padding.top}
                      x2={cx}
                      y2={c1Padding.top + innerH1}
                      stroke={isDark ? "#E2E8F0" : "#0F172A"}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                </g>
              );
            })}

            {/* X-Axis Ticks (Sample of Dates) */}
            {allChart1Points
              .filter((_, i) => i % Math.max(1, Math.floor(allChart1Points.length / 8)) === 0)
              .map((p, i) => {
                const idx = allChart1Points.indexOf(p);
                return (
                  <text
                    key={i}
                    x={getX1(idx)}
                    y={c1Padding.top + innerH1 + 22}
                    fill={tickTextColor}
                    fontSize="9.5"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    fontWeight="500"
                  >
                    {p.date.slice(5)}
                  </text>
                );
              })}
          </svg>

          {/* Interactive Hover Tooltip */}
          {activeHoveredPoint && hoveredPointIdx !== null && (
            <div
              className={`absolute top-4 pointer-events-none p-3 rounded-xl border shadow-lg text-xs z-10 transition-all ${
                isDark
                  ? "bg-neutral-950/95 border-neutral-700 text-neutral-100"
                  : "bg-white/95 border-slate-300 text-slate-900 shadow-md backdrop-blur-xs"
              }`}
              style={{
                left: `${Math.min(
                  80,
                  Math.max(
                    15,
                    (hoveredPointIdx / (allChart1Points.length - 1)) * 100
                  )
                )}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="font-bold flex items-center justify-between gap-3 pb-1 border-b border-slate-200 dark:border-neutral-800">
                <span>Date: {activeHoveredPoint.date}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    activeHoveredPoint.isForecast
                      ? "bg-indigo-500/20 text-indigo-400 font-bold"
                      : "bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-bold"
                  }`}
                >
                  {activeHoveredPoint.isForecast ? "ML Forecast" : "Historical Actual"}
                </span>
              </div>
              <div className="mt-1.5 space-y-1">
                {activeHoveredPoint.actual !== null ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600 dark:text-neutral-400 font-medium">Actual Demand:</span>
                    <strong className="text-slate-950 dark:text-white font-mono">{activeHoveredPoint.actual} units</strong>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Predicted Demand:</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{activeHoveredPoint.pred} units</strong>
                    </div>
                    {activeHoveredPoint.lower !== null && activeHoveredPoint.upper !== null && (
                      <div className="flex justify-between gap-4 text-[11px] text-slate-600 dark:text-neutral-400">
                        <span>95% Confidence:</span>
                        <span className="font-mono">{activeHoveredPoint.lower} – {activeHoveredPoint.upper} units</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Comprehensive Understandable Legend */}
        <div
          className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
            isDark
              ? "border-neutral-800 text-neutral-300"
              : "border-slate-200 text-slate-800"
          }`}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-1 bg-slate-500 rounded-full" />
              <span>Historical Actuals</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-1 bg-indigo-500 rounded-full" />
              <span>Projected ML Demand</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xs" />
              <span>95% Confidence Interval</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-0.5 border-t border-dashed border-amber-500" />
              <span className="text-amber-700 dark:text-amber-400 font-bold">Dynamic ROP Threshold</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-3.5 h-0.5 border-t border-dashed border-emerald-500" />
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">Safety Stock Buffer</span>
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 font-semibold">
            Timeline Horizon: {allChart1Points.length} Daily Observations
          </span>
        </div>
      </div>

      {/* Grid of Two Secondary Deep-Dive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Secondary 1: Forward Inventory Depletion vs Dynamic ROP */}
        <div className={`border rounded-xl p-5 shadow-sm transition-colors ${cardCls}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4
                className={`text-sm font-bold flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                <BarChart2 className="w-4 h-4 text-sky-500" />
                Forward Depletion vs. Dynamic ROP (Usable Stock)
              </h4>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5 font-medium">
                Effective fulfillment stock after discounting expired perishable batches
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                  usableStock <= mcResult.dynamicRop
                    ? "bg-rose-500/10 text-rose-600 border-rose-500/30 font-bold"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold"
                }`}
              >
                Usable: {usableStock} ({currentStock} Gross)
              </span>
            </div>
          </div>

          {/* SVG Depletion Chart */}
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${c2Width} ${c2Height}`}
              className="w-full h-auto select-none"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = c2Padding.top + innerH2 * (1 - pct);
                const val = Math.round(maxVal2 * pct);
                return (
                  <g key={i}>
                    <line
                      x1={c2Padding.left}
                      y1={y}
                      x2={c2Width - c2Padding.right}
                      y2={y}
                      stroke={gridLineColor}
                      strokeDasharray="3 3"
                    />
                    <text
                      x={c2Padding.left - 8}
                      y={y + 4}
                      fill={tickTextColor}
                      fontSize="10"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* ROP Threshold Line */}
              <line
                x1={c2Padding.left}
                y1={getY2(mcResult.dynamicRop)}
                x2={c2Width - c2Padding.right}
                y2={getY2(mcResult.dynamicRop)}
                stroke="#F43F5E"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={c2Width - c2Padding.right}
                y={getY2(mcResult.dynamicRop) - 6}
                fill="#F43F5E"
                fontSize="9.5"
                fontWeight="bold"
                textAnchor="end"
              >
                Dynamic ROP: {mcResult.dynamicRop}
              </text>

              {/* Depletion Area & Curve */}
              <path d={depletionArea} fill="rgba(56, 189, 248, 0.12)" />
              <path
                d={depletionPath}
                fill="none"
                stroke="#0284C7"
                strokeWidth="2.8"
                strokeLinecap="round"
              />

              {depletionData.map((d, i) => (
                <circle
                  key={i}
                  cx={getX2(i)}
                  cy={getY2(d.stock)}
                  r={i === 0 ? "4" : "2.5"}
                  fill="#0284C7"
                />
              ))}
            </svg>
          </div>

          <div
            className={`flex items-center justify-between text-xs mt-2 border-t pt-2 ${
              isDark
                ? "text-neutral-400 border-neutral-800"
                : "text-slate-600 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-0.5 bg-sky-500 rounded-full" /> Usable Stock ({usableStock})
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-0.5 bg-rose-500 rounded-full" /> Dynamic ROP ({mcResult.dynamicRop})
              </span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-neutral-200">
              {depletionData.length} Forward Days
            </span>
          </div>
        </div>

        {/* Secondary 2: Monte Carlo Lead-Time Demand Distribution Histogram */}
        <div className={`border rounded-xl p-5 shadow-sm transition-colors ${cardCls}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4
                className={`text-sm font-bold flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-500" />
                Monte Carlo Simulated Lead-Time Demand ({monteCarloIterations} Runs)
              </h4>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5 font-medium">
                Stochastic demand during supplier lead time under Gaussian lead-time variance
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                P95: {mcResult.p95LeadTimeDemand} | P99: {mcResult.p99LeadTimeDemand}
              </span>
            </div>
          </div>

          {/* SVG Histogram */}
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${c3Width} ${c3Height}`}
              className="w-full h-auto select-none"
            >
              {[0, 0.5, 1].map((pct, i) => {
                const y = c3Padding.top + innerH3 * (1 - pct);
                return (
                  <line
                    key={i}
                    x1={c3Padding.left}
                    y1={y}
                    x2={c3Width - c3Padding.right}
                    y2={y}
                    stroke={gridLineColor}
                    strokeDasharray="3 3"
                  />
                );
              })}

              {bins.map((bin, i) => {
                const x1 = getX3(bin.binStart);
                const x2 = getX3(bin.binEnd);
                const barW = Math.max(1, x2 - x1 - 1.5);
                const barH = (bin.count / maxBinCount) * innerH3;
                const y = c3Padding.top + innerH3 - barH;
                const isStockoutBin = bin.binEnd > usableStock;

                return (
                  <rect
                    key={i}
                    x={x1}
                    y={y}
                    width={barW}
                    height={barH}
                    fill={isStockoutBin ? "rgba(244, 63, 94, 0.85)" : "rgba(99, 102, 241, 0.85)"}
                    rx="2"
                  />
                );
              })}

              {usableStock >= minDdlt && usableStock <= maxDdlt && (
                <g>
                  <line
                    x1={getX3(usableStock)}
                    y1={c3Padding.top}
                    x2={getX3(usableStock)}
                    y2={c3Padding.top + innerH3}
                    stroke="#F43F5E"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={getX3(usableStock) - 55}
                    y={c3Padding.top - 18}
                    width="110"
                    height="18"
                    rx="4"
                    fill="#F43F5E"
                  />
                  <text
                    x={getX3(usableStock)}
                    y={c3Padding.top - 5}
                    fill="#FFFFFF"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Usable Stock: {usableStock}
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div
            className={`flex items-center justify-between text-xs mt-2 border-t pt-2 ${
              isDark
                ? "text-neutral-400 border-neutral-800"
                : "text-slate-600 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 bg-indigo-500 rounded-xs" /> Buffer Safe
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 bg-rose-500 rounded-xs" /> Stockout Deficit Area
              </span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-neutral-200">
              Safety Stock: {mcResult.dynamicSafetyStock} units
            </span>
          </div>
        </div>
      </div>

      {/* Perishable Batch Expiry & Shelf-Life Decay Engine (If Perishable) */}
      {sku.isPerishable && (
        <div
          className={`border rounded-xl p-5 shadow-sm transition-colors ${
            isDark
              ? "bg-amber-950/15 border-amber-500/30 text-neutral-100"
              : "bg-amber-50/70 border-amber-300 text-slate-900"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                Perishable Batch Expiry &amp; Shelf-Life Decay Engine: {sku.name}
              </h4>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              Dynamic Decay Discount: -{decayRatePct}% Usable Stock
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-600 dark:text-neutral-400 font-medium">Shelf Life Limit:</span>
              <div className="text-lg font-extrabold text-slate-950 dark:text-white">
                {sku.shelfLifeDays} Days
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-600 dark:text-neutral-400 font-medium">Nominal Stock:</span>
              <div className="text-lg font-extrabold text-slate-950 dark:text-white">
                {currentStock} Units
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-600 dark:text-neutral-400 font-medium">Decayed Waste:</span>
              <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                {decayedUnits} Units ({decayRatePct}%)
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-600 dark:text-neutral-400 font-medium">Effective Usable:</span>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {usableStock} Units
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
