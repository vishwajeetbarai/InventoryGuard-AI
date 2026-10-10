import React from "react";
import { Warehouse, SkuMetadata, ReorderPolicy } from "../types";
import { Sliders, MapPin, Tag, Shield, Calendar, Shuffle, Flame, Truck, RefreshCw, CloudRain, Cpu, Repeat } from "lucide-react";

interface SidebarControlsProps {
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
  theme?: "dark" | "light";
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
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
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  const asideCls = isDark
    ? "bg-slate-900/90 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-900 shadow-sm";

  const labelCls = isDark ? "text-slate-300" : "text-slate-700";
  const subTextCls = isDark ? "text-slate-400" : "text-slate-500";
  const borderCls = isDark ? "border-slate-800" : "border-slate-200";
  const inputBgCls = isDark
    ? "bg-slate-800/90 border-slate-700 text-white"
    : "bg-slate-100 border-slate-300 text-slate-900";

  return (
    <aside className={`w-full lg:w-80 shrink-0 border-r p-5 space-y-6 transition-colors ${asideCls}`}>
      <div className={`flex items-center justify-between pb-3 border-b ${borderCls}`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <span>Control Tower Parameters</span>
        </div>
        <button
          onClick={onTriggerSimulation}
          disabled={isSimulating}
          className="text-indigo-500 hover:text-indigo-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isSimulating ? "animate-spin" : ""}`} />
          <span>Recompute</span>
        </button>
      </div>

      {/* Crisis Scenario Presets (1-Click Stress Tests) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-500">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            <span>Crisis Stress Presets</span>
          </span>
          <span className="text-[10px] text-slate-400 lowercase font-normal">1-click test</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onApplyPreset && onApplyPreset("MONSOON")}
            className={`p-2 rounded-lg text-left text-xs transition-all border cursor-pointer ${
              isDark
                ? "bg-slate-950/70 border-slate-800 hover:border-sky-500/50 hover:bg-sky-950/20 text-slate-200"
                : "bg-slate-50 border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-800"
            }`}
          >
            <div className="font-bold flex items-center gap-1 text-[11px] text-sky-400">
              🌧️ Monsoon Deluge
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              +40% Rain, +2.5d Delay
            </div>
          </button>

          <button
            onClick={() => onApplyPreset && onApplyPreset("FLASH_SALE")}
            className={`p-2 rounded-lg text-left text-xs transition-all border cursor-pointer ${
              isDark
                ? "bg-slate-950/70 border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-slate-200"
                : "bg-slate-50 border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-800"
            }`}
          >
            <div className="font-bold flex items-center gap-1 text-[11px] text-amber-400">
              🔥 Midnight Flash
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              +65% Surge, 99.5% CSL
            </div>
          </button>

          <button
            onClick={() => onApplyPreset && onApplyPreset("LOGISTICS_STRIKE")}
            className={`p-2 rounded-lg text-left text-xs transition-all border cursor-pointer ${
              isDark
                ? "bg-slate-950/70 border-slate-800 hover:border-red-500/50 hover:bg-red-950/20 text-slate-200"
                : "bg-slate-50 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-800"
            }`}
          >
            <div className="font-bold flex items-center gap-1 text-[11px] text-red-400">
              🚢 Freight Strike
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              +4.0d Lead Time Shock
            </div>
          </button>

          <button
            onClick={() => onApplyPreset && onApplyPreset("NORMAL")}
            className={`p-2 rounded-lg text-left text-xs transition-all border cursor-pointer ${
              isDark
                ? "bg-slate-950/70 border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-slate-200"
                : "bg-slate-50 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-800"
            }`}
          >
            <div className="font-bold flex items-center gap-1 text-[11px] text-emerald-400">
              ⚖️ Normal Base
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Reset Baseline Ops
            </div>
          </button>
        </div>
      </div>

      {/* 1. Warehouse Location Selector */}
      <div className="space-y-2">
        <label className={`text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider ${labelCls}`}>
          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
          <span>Dark Store / Node</span>
        </label>
        <select
          value={selectedWarehouseId}
          onChange={(e) => onSelectWarehouse(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 border ${inputBgCls}`}
        >
          {warehouses.map((wh) => (
            <option key={wh.id} value={wh.id}>
              {wh.name} ({wh.region})
            </option>
          ))}
        </select>
        <p className={`text-[11px] ${subTextCls}`}>
          Hyper-local quick-commerce fulfillment dark store node.
        </p>
      </div>

      {/* 2. SKU Multiselect Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={`text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider ${labelCls}`}>
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            <span>SKU Selection ({selectedSkuIds.length}/{allSkus.length})</span>
          </label>
          <button
            onClick={onSelectAllSkus}
            className="text-[11px] text-indigo-500 hover:underline cursor-pointer"
          >
            Select All
          </button>
        </div>
        <div
          className={`space-y-1.5 p-2.5 rounded-lg border max-h-48 overflow-y-auto ${
            isDark ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}
        >
          {allSkus.map((sku) => {
            const isChecked = selectedSkuIds.includes(sku.id);
            return (
              <label
                key={sku.id}
                className={`flex items-center gap-2.5 p-1.5 rounded cursor-pointer text-xs select-none transition-colors ${
                  isDark ? "hover:bg-slate-800/60 text-slate-300" : "hover:bg-slate-200/60 text-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleSku(sku.id)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="flex-1 truncate font-medium">{sku.name}</span>
                <span className={`text-[10px] font-mono ${subTextCls}`}>
                  ₹{sku.basePrice}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Replenishment Algorithm Policy Selector */}
      <div className="space-y-2">
        <label className={`text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider ${labelCls}`}>
          <Cpu className="w-3.5 h-3.5 text-indigo-500" />
          <span>Reorder Policy Selector</span>
        </label>
        <div className="space-y-1">
          {[
            {
              id: "DYNAMIC_AI" as const,
              name: "Dynamic AI Safety Stock",
              tag: "Bivariate Joint-Risk",
              desc: "Monte Carlo dual-variance + weather & decay model",
            },
            {
              id: "CONTINUOUS_REVIEW" as const,
              name: "Continuous Review (s, S)",
              tag: "Min-Max Policy",
              desc: "Real-time reorder threshold (s) & target base stock (S)",
            },
            {
              id: "PERIODIC_REVIEW" as const,
              name: "Periodic Review (R, S)",
              tag: "Weekly Batch Review",
              desc: "Fixed review interval (R=7d) protection window",
            },
          ].map((pol) => {
            const isSelected = reorderPolicy === pol.id;
            return (
              <button
                key={pol.id}
                onClick={() => onSelectReorderPolicy?.(pol.id)}
                className={`w-full text-left p-2 rounded-lg text-xs transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50"
                    : isDark
                    ? "bg-slate-800/40 hover:bg-slate-800 text-slate-400 border-slate-700/50"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isSelected ? "text-indigo-400" : ""}`}>
                    {pol.name}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isSelected
                        ? "bg-indigo-500/30 text-indigo-300"
                        : isDark
                        ? "bg-slate-800 text-slate-500"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {pol.tag}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{pol.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Cycle Service Level Target (Z-score) */}
      <div className="space-y-2">
        <label className={`text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider ${labelCls}`}>
          <Shield className="w-3.5 h-3.5 text-indigo-500" />
          <span>Service Level Target (CSL)</span>
        </label>
        <div className="space-y-1">
          {serviceLevels.map((lvl) => {
            const isSelected = selectedServiceZ === lvl.z;
            return (
              <button
                key={lvl.z}
                onClick={() => onSelectServiceZ(lvl.z)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30"
                    : isDark
                    ? "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/50"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                }`}
              >
                <span>{lvl.label}</span>
                <span className="font-mono text-[11px] opacity-80">
                  Z = {lvl.z.toFixed(3)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Forecast Horizon Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className={`font-semibold flex items-center gap-1.5 uppercase tracking-wider ${labelCls}`}>
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Forecast Horizon</span>
          </label>
          <span className="font-mono text-indigo-500 font-bold">
            {forecastHorizon} Days
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
        <div className={`flex justify-between text-[10px] ${subTextCls}`}>
          <span>14 days</span>
          <span>21 days</span>
          <span>30 days</span>
        </div>
      </div>

      {/* 5. Monte Carlo Runs Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className={`font-semibold flex items-center gap-1.5 uppercase tracking-wider ${labelCls}`}>
            <Shuffle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Simulation Runs</span>
          </label>
          <span className="font-mono text-indigo-500 font-bold">
            {monteCarloRuns.toLocaleString()} Runs
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
        <div className={`flex justify-between text-[10px] ${subTextCls}`}>
          <span>500</span>
          <span>1,000</span>
          <span>2,000</span>
        </div>
      </div>

      {/* 6. Stress Test / Sandbox */}
      <div className={`pt-3 border-t ${borderCls} space-y-4`}>
        <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5" />
          <span>Stress-Test &amp; Promo Sandbox</span>
        </div>

        {/* Promo Demand Spike Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className={labelCls}>Flash Sale Surge</span>
            <span className="font-mono text-amber-500 font-bold">
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
        </div>

        {/* Weather & Local Event Surge Sandbox */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className={`flex items-center gap-1 ${labelCls}`}>
              <CloudRain className="w-3.5 h-3.5 text-sky-400" />
              <span>Weather Shock Impact</span>
            </span>
            <span className="font-mono text-sky-400 font-bold">
              +{weatherSurgePct}% Rain
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={weatherSurgePct}
            onChange={(e) => onChangeWeatherSurgePct && onChangeWeatherSurgePct(Number(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />
          <div className={`flex justify-between text-[10px] ${subTextCls}`}>
            <span>Clear Sky (0%)</span>
            <span>Monsoon (+50%)</span>
          </div>
        </div>

        {/* Lead Time Delay Bias Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className={`flex items-center gap-1 ${labelCls}`}>
              <Truck className="w-3 h-3 text-slate-400" />
              <span>Supplier Delay Shock</span>
            </span>
            <span className="font-mono text-amber-500 font-bold">
              +{supplierDelayDays.toFixed(1)} Days
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={supplierDelayDays}
            onChange={(e) => onChangeSupplierDelayDays(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </div>
    </aside>
  );
};
