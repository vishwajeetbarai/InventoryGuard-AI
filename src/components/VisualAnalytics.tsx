import React, { useState } from "react";
import { SkuSimulationState } from "../types";
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
} from "lucide-react";

interface VisualAnalyticsProps {
  simulationStates: SkuSimulationState[];
  selectedSkuId: string;
  onSelectSkuId: (id: string) => void;
  monteCarloIterations: number;
  weatherSurgePct?: number;
  theme?: "dark" | "light";
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({
  simulationStates,
  selectedSkuId,
  onSelectSkuId,
  monteCarloIterations,
  weatherSurgePct = 0,
  theme = "dark",
}) => {
  const isDark = theme === "dark";

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

  // Chart 1 Dimensions
  const c1Width = 560;
  const c1Height = 220;
  const c1Padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const innerW1 = c1Width - c1Padding.left - c1Padding.right;
  const innerH1 = c1Height - c1Padding.top - c1Padding.bottom;

  const maxVal1 =
    Math.max(
      ...allChart1Points.map((p) => Math.max(p.actual ?? 0, p.upper ?? p.pred ?? 0))
    ) * 1.15 || 100;

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

  // Chart 2: Inventory Depletion vs ROP (Starts from Usable Stock to discount expired batches)
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
  const c3Width = 1140;
  const c3Height = 210;
  const c3Padding = { top: 25, right: 30, bottom: 35, left: 55 };
  const innerW3 = c3Width - c3Padding.left - c3Padding.right;
  const innerH3 = c3Height - c3Padding.top - c3Padding.bottom;

  const getX3 = (val: number) =>
    c3Padding.left + ((val - minDdlt) / Math.max(1, maxDdlt - minDdlt)) * innerW3;

  const cardCls = isDark
    ? "bg-slate-900/80 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-900 shadow-sm";

  const gridLineColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const tickTextColor = isDark ? "#64748B" : "#94A3B8";

  return (
    <div className="space-y-6">
      {/* Active SKU Selector Bar with Perishable & Supplier Matrix badges */}
      <div
        className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${cardCls}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Selected SKU Deep-Dive &amp; Audit Profile
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <h3
                className={`text-base font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {sku.name} ({sku.id})
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded border ${
                  isDark
                    ? "bg-slate-800 text-slate-300 border-slate-700"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}
              >
                {sku.category}
              </span>

              {sku.isPerishable ? (
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-amber-500" />
                  <span>Perishable Shelf Life: {sku.shelfLifeDays}d</span>
                  <span>•</span>
                  <span>Decay: -{decayRatePct}%</span>
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                  Ambient Shelf-Stable ({sku.shelfLifeDays}d)
                </span>
              )}

              {activeState.weatherDemandUpliftPct > 0 && (
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                  <CloudRain className="w-3 h-3 text-sky-400" />
                  <span>Rain Shock: +{activeState.weatherDemandUpliftPct}%</span>
                  <span className="opacity-75">({sku.weatherSensitivity}x)</span>
                </span>
              )}

              <span className="text-xs px-2 py-0.5 rounded font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                Vendor: {supplierScorecard.grade} ({supplierScorecard.bufferMultiplier}x Buffer)
              </span>
            </div>
          </div>
        </div>

        {/* SKU Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {simulationStates.map((s) => {
            const isSelected = s.sku.id === selectedSkuId;
            const isCrit = s.mcResult.urgency === "CRITICAL REORDER NOW";
            return (
              <button
                key={s.sku.id}
                onClick={() => onSelectSkuId(s.sku.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : isDark
                    ? "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                }`}
              >
                <span>{s.sku.name.split(" ")[0]}</span>
                {isCrit && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Two Core Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Historical Sales vs Predicted Demand Curve */}
        <div className={`border rounded-xl p-5 shadow-sm transition-colors ${cardCls}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4
                className={`text-sm font-bold flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Historical Sales vs. ML Demand Forecast
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                30-Day Actuals + {forecastPoints.length}-Day Gradient Boosting Projection
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                RMSE: {rmse.toFixed(1)} | MAE: {mae.toFixed(1)}
              </span>
            </div>
          </div>

          {/* SVG Chart 1 */}
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${c1Width} ${c1Height}`}
              className="w-full h-auto select-none"
            >
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
                      strokeDasharray="3 3"
                    />
                    <text
                      x={c1Padding.left - 8}
                      y={y + 4}
                      fill={tickTextColor}
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="sans-serif"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {confidenceBandPath && (
                <path
                  d={confidenceBandPath}
                  fill="rgba(99, 102, 241, 0.16)"
                />
              )}

              {histPath && (
                <path
                  d={histPath}
                  fill="none"
                  stroke={isDark ? "#94A3B8" : "#64748B"}
                  strokeWidth="1.8"
                />
              )}

              {forePath && (
                <path
                  d={forePath}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              <line
                x1={getX1(foreIdxOffset - 1)}
                y1={c1Padding.top}
                x2={getX1(foreIdxOffset - 1)}
                y2={c1Padding.top + innerH1}
                stroke="#6366F1"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={getX1(foreIdxOffset - 1) + 4}
                y={c1Padding.top + 12}
                fill="#6366F1"
                fontSize="9"
                fontWeight="bold"
              >
                Forecast Start
              </text>
            </svg>
          </div>

          <div
            className={`flex items-center justify-between text-xs mt-2 border-t pt-2 ${
              isDark
                ? "text-slate-400 border-slate-800/80"
                : "text-slate-500 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-slate-400 rounded-full" /> Historical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-indigo-500 rounded-full" /> ML Forecast
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-indigo-500/20 rounded" /> 80% Conf. Interval
              </span>
            </div>
            <span className="font-medium">Daily Units Sold</span>
          </div>
        </div>

        {/* CHART 2: Forward Inventory Depletion vs Dynamic ROP (with Decay Callout) */}
        <div className={`border rounded-xl p-5 shadow-sm transition-colors ${cardCls}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4
                className={`text-sm font-bold flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <BarChart2 className="w-4 h-4 text-sky-400" />
                Forward Depletion vs. Dynamic ROP (Usable Stock)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Effective fulfillment stock after discounting expired perishable batches
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                  usableStock <= mcResult.dynamicRop
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                }`}
              >
                Usable: {usableStock} ({currentStock} Gross) | ROP: {mcResult.dynamicRop}
              </span>
            </div>
          </div>

          {/* SVG Chart 2 */}
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

              {/* ROP Line */}
              <line
                x1={c2Padding.left}
                y1={getY2(mcResult.dynamicRop)}
                x2={c2Width - c2Padding.right}
                y2={getY2(mcResult.dynamicRop)}
                stroke="#EF4444"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
              <text
                x={c2Width - c2Padding.right - 4}
                y={getY2(mcResult.dynamicRop) - 6}
                fill="#EF4444"
                fontSize="10"
                fontWeight="bold"
                textAnchor="end"
              >
                ROP: {mcResult.dynamicRop} units
              </text>

              {/* Safety Stock Line */}
              <line
                x1={c2Padding.left}
                y1={getY2(mcResult.dynamicSafetyStock)}
                x2={c2Width - c2Padding.right}
                y2={getY2(mcResult.dynamicSafetyStock)}
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={c2Width - c2Padding.right - 4}
                y={getY2(mcResult.dynamicSafetyStock) - 6}
                fill="#F59E0B"
                fontSize="9"
                fontWeight="600"
                textAnchor="end"
              >
                Safety Stock: {mcResult.dynamicSafetyStock}
              </text>

              {/* Gross vs Usable Stock marker at day 0 */}
              {decayedUnits > 0 && (
                <g>
                  <line
                    x1={c2Padding.left}
                    y1={getY2(currentStock)}
                    x2={c2Padding.left + 40}
                    y2={getY2(currentStock)}
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={c2Padding.left + 45}
                    y={getY2(currentStock) + 3}
                    fill="#F59E0B"
                    fontSize="9"
                  >
                    Gross: {currentStock} (-{decayedUnits} Expired)
                  </text>
                </g>
              )}

              {/* Depletion Area */}
              <path d={depletionArea} fill="rgba(56, 189, 248, 0.1)" />

              {/* Depletion Line */}
              <path
                d={depletionPath}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.8"
                strokeLinecap="round"
              />

              {depletionData.map((d, i) => (
                <circle
                  key={i}
                  cx={getX2(i)}
                  cy={getY2(d.stock)}
                  r={i === 0 ? "4" : "2.5"}
                  fill="#38BDF8"
                />
              ))}
            </svg>
          </div>

          <div
            className={`flex items-center justify-between text-xs mt-2 border-t pt-2 ${
              isDark
                ? "text-slate-400 border-slate-800/80"
                : "text-slate-500 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-sky-400 rounded-full" /> Usable Stock ({usableStock})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-red-400 rounded-full" /> Dynamic ROP
              </span>
              {decayedUnits > 0 && (
                <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                  ⚠ {decayedUnits} Expired Waste Units
                </span>
              )}
            </div>
            <span className="font-medium">Forward Days</span>
          </div>
        </div>
      </div>

      {/* Perishable Batch Expiry & Decay Engine Diagnostic Card */}
      <div
        className={`border rounded-xl p-5 shadow-sm transition-colors ${
          isDark
            ? sku.isPerishable
              ? "bg-amber-950/15 border-amber-500/30"
              : "bg-slate-900/60 border-slate-800"
            : sku.isPerishable
            ? "bg-amber-50/70 border-amber-200"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/30">
          <div className="flex items-center gap-2">
            {sku.isPerishable ? (
              <Leaf className="w-4 h-4 text-amber-500" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            )}
            <h4
              className={`text-sm font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {sku.isPerishable
                ? "Perishable Batch Expiry & Shelf-Life Decay Engine"
                : "Ambient Non-Perishable Shelf Stability"}
            </h4>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
              sku.isPerishable
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            }`}
          >
            {sku.isPerishable
              ? `Dynamic Spoilage Discount: -${decayRatePct}% Usable Stock`
              : "Zero Expiry Discount (90-Day Stable)"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Shelf-Life Limit</span>
            </div>
            <div
              className={`text-lg font-extrabold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {sku.shelfLifeDays}{" "}
              <span className="text-xs font-normal text-slate-400">Days</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {sku.isPerishable
                ? "Cold-chain expiration limit"
                : "Ambient shelf stability"}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-400">Gross Physical Stock</div>
            <div
              className={`text-lg font-extrabold font-mono ${
                isDark ? "text-slate-200" : "text-slate-800"
              }`}
            >
              {currentStock}{" "}
              <span className="text-xs font-normal text-slate-400">Units</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Total warehouse count
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <PackageX className="w-3.5 h-3.5 text-amber-400" />
              <span>Expired Spoilage</span>
            </div>
            <div className="text-lg font-extrabold text-amber-500 font-mono">
              -{decayedUnits}{" "}
              <span className="text-xs font-normal text-amber-400/80">
                ({decayRatePct}%)
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              ₹{(decayedUnits * sku.basePrice).toLocaleString("en-IN")} written-off
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Net Usable Stock</span>
            </div>
            <div className="text-lg font-extrabold text-sky-400 font-mono">
              {usableStock}{" "}
              <span className="text-xs font-normal text-slate-400">Units</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Engine ROP baseline
            </div>
          </div>
        </div>

        {sku.isPerishable && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-start gap-2 border ${
              isDark
                ? "bg-slate-900/80 border-slate-800 text-slate-300"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong>Quick-Commerce Batch Freshness Protection:</strong>{" "}
              Without expiration decay modeling, the gross count of {currentStock} units
              would falsely appear to satisfy demand. By factoring in aging batches, usable stock is adjusted to {usableStock} units, accelerating the Reorder Point trigger and preventing customer delivery of expired milk or yogurt.
            </div>
          </div>
        )}
      </div>

      {/* CHART 3: Monte Carlo Lead-Time Demand Distribution Histogram */}
      <div className={`border rounded-xl p-5 shadow-sm transition-colors ${cardCls}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h4
              className={`text-sm font-bold flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              Monte Carlo Joint Lead-Time Risk Distribution ({monteCarloIterations.toLocaleString()} Iterations)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Coupling demand variance ($\sigma_d$) with supplier lead-time risk ($\sigma_L = \pm{activeState.effectiveLeadTimeStd}d$ scaled by {supplierScorecard.grade}-Grade vendor buffer)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                mcResult.stockoutProbabilityPct > 20
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : mcResult.stockoutProbabilityPct > 8
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
              }`}
            >
              Stock-Out Risk: {mcResult.stockoutProbabilityPct.toFixed(1)}%
            </span>
            <span
              className={`text-xs px-2 py-1 rounded border ${
                isDark
                  ? "bg-slate-800 text-slate-300 border-slate-700"
                  : "bg-slate-100 text-slate-700 border-slate-300"
              }`}
            >
              P95 Demand: {mcResult.p95LeadTimeDemand} units
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
                  fill={isStockoutBin ? "rgba(244, 63, 94, 0.8)" : "rgba(99, 102, 241, 0.75)"}
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
                  x={getX3(usableStock) - 60}
                  y={c3Padding.top - 18}
                  width="120"
                  height="18"
                  rx="4"
                  fill="#F43F5E"
                />
                <text
                  x={getX3(usableStock)}
                  y={c3Padding.top - 5}
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Usable Stock: {usableStock}
                </text>
              </g>
            )}

            {mcResult.dynamicRop >= minDdlt && mcResult.dynamicRop <= maxDdlt && (
              <g>
                <line
                  x1={getX3(mcResult.dynamicRop)}
                  y1={c3Padding.top}
                  x2={getX3(mcResult.dynamicRop)}
                  y2={c3Padding.top + innerH3}
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
                <rect
                  x={getX3(mcResult.dynamicRop) - 55}
                  y={c3Padding.top}
                  width="110"
                  height="16"
                  rx="4"
                  fill="#10B981"
                />
                <text
                  x={getX3(mcResult.dynamicRop)}
                  y={c3Padding.top + 12}
                  fill="#FFFFFF"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Dynamic ROP: {mcResult.dynamicRop}
                </text>
              </g>
            )}

            {[minDdlt, Math.round((minDdlt + maxDdlt) / 2), maxDdlt].map((val, idx) => (
              <text
                key={idx}
                x={getX3(val)}
                y={c3Padding.top + innerH3 + 20}
                fill={tickTextColor}
                fontSize="10"
                textAnchor="middle"
              >
                {Math.round(val)} units
              </text>
            ))}
          </svg>
        </div>

        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mt-2 border-t pt-3 ${
            isDark
              ? "text-slate-400 border-slate-800/80"
              : "text-slate-500 border-slate-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-indigo-500 rounded-sm" /> Safe Fulfillment Area
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-500 rounded-sm" /> Stock-Out Breach Area (Deficit)
            </span>
          </div>
          <div className={isDark ? "text-slate-300" : "text-slate-700"}>
            Expected Lead Time Demand: <strong>{mcResult.expectedLeadTimeDemand} units</strong> |
            Safety Stock: <strong className="text-indigo-500">{mcResult.dynamicSafetyStock} units</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
