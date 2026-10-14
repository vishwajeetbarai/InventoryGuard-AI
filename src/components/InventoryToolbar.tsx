import React from "react";
import { Warehouse, SkuMetadata, ForecastModel } from "../types";
import {
  Building2,
  Package,
  Calendar,
  BrainCircuit,
  Filter,
  Check,
  ChevronDown,
} from "lucide-react";

interface InventoryToolbarProps {
  warehouses: Warehouse[];
  selectedWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  skus: SkuMetadata[];
  selectedSkuId: string;
  onSelectSkuId: (id: string) => void;
  forecastHorizon: number;
  onChangeForecastHorizon: (days: number) => void;
  forecastModel: ForecastModel;
  onSelectForecastModel: (model: ForecastModel) => void;
  theme?: "dark" | "light";
}

const FORECAST_HORIZONS = [
  { days: 7, label: "7 Days" },
  { days: 14, label: "14 Days" },
  { days: 21, label: "21 Days" },
  { days: 30, label: "30 Days" },
];

const MODEL_OPTIONS: { id: ForecastModel; label: string }[] = [
  { id: "META_PROPHET", label: "Meta Prophet (Ensemble)" },
  { id: "XGBOOST", label: "Gradient Boosting / XGBoost" },
  { id: "AMAZON_DEEPAR", label: "Amazon DeepAR (RNN)" },
  { id: "HOLT_WINTERS_ARIMA", label: "Holt-Winters / SARIMAX" },
];

export const InventoryToolbar: React.FC<InventoryToolbarProps> = ({
  warehouses,
  selectedWarehouseId,
  onSelectWarehouse,
  skus,
  selectedSkuId,
  onSelectSkuId,
  forecastHorizon,
  onChangeForecastHorizon,
  forecastModel,
  onSelectForecastModel,
  theme = "light",
}) => {
  const isDark = theme === "dark";

  const selectedWh =
    warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];
  const selectedSku =
    skus.find((s) => s.id === selectedSkuId) || skus[0];

  return (
    <div
      className={`border rounded-xl p-4 shadow-xs transition-colors space-y-3 ${
        isDark
          ? "bg-neutral-900 border-neutral-800 text-neutral-100"
          : "bg-white border-slate-300 text-slate-900"
      }`}
    >
      {/* Top Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Facility & SKU Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Facility / Warehouse Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Facility:</span>
            </span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => onSelectWarehouse(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isDark
                  ? "bg-neutral-950 border-neutral-700 text-neutral-100"
                  : "bg-slate-50 border-slate-300 text-slate-900 shadow-xs"
              }`}
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.city})
                </option>
              ))}
            </select>
          </div>

          <div className="h-5 w-[1px] bg-slate-300 dark:bg-neutral-800 hidden sm:block" />

          {/* Product / SKU Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-500" />
              <span>Product SKU:</span>
            </span>
            <select
              value={selectedSkuId}
              onChange={(e) => onSelectSkuId(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[220px] truncate ${
                isDark
                  ? "bg-neutral-950 border-neutral-700 text-neutral-100"
                  : "bg-slate-50 border-slate-300 text-slate-900 shadow-xs"
              }`}
            >
              {skus.map((sku) => (
                <option key={sku.id} value={sku.id}>
                  {sku.name} ({sku.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Horizon & Model Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Horizon Toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Horizon:</span>
            </span>
            <div
              className={`p-1 rounded-lg border flex items-center gap-1 ${
                isDark ? "bg-neutral-950 border-neutral-800" : "bg-slate-100 border-slate-300"
              }`}
            >
              {FORECAST_HORIZONS.map((h) => (
                <button
                  key={h.days}
                  onClick={() => onChangeForecastHorizon(h.days)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    forecastHorizon === h.days
                      ? isDark
                        ? "bg-white text-neutral-950 shadow-xs font-extrabold"
                        : "bg-slate-900 text-white shadow-xs font-extrabold"
                      : isDark
                      ? "text-neutral-300 hover:text-white"
                      : "text-slate-700 hover:text-slate-950"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-1.5">
            <select
              value={forecastModel}
              onChange={(e) => onSelectForecastModel(e.target.value as ForecastModel)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isDark
                  ? "bg-neutral-950 border-neutral-700 text-neutral-100"
                  : "bg-slate-50 border-slate-300 text-slate-900 shadow-xs"
              }`}
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Context Ribbon */}
      <div
        className={`px-3 py-2 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2 ${
          isDark
            ? "bg-neutral-950/80 border-neutral-800 text-neutral-300"
            : "bg-slate-50 border-slate-200 text-slate-800"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 font-medium">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
            Active Context:
          </span>
          <span className="font-bold text-slate-950 dark:text-white">
            {selectedWh?.name} ({selectedWh?.city})
          </span>
          <span>·</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            {selectedSku?.name} ({selectedSku?.id})
          </span>
          <span>·</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-200/80 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200">
            {selectedSku?.category}
          </span>
          {selectedSku?.isPerishable && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              Perishable ({selectedSku.shelfLifeDays}d shelf life)
            </span>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-600 dark:text-neutral-400 font-semibold">
          {forecastHorizon}-Day Forecast · {MODEL_OPTIONS.find((m) => m.id === forecastModel)?.label.split(" (")[0]}
        </div>
      </div>
    </div>
  );
};
