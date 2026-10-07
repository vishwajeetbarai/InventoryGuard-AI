import React from "react";
import { Warehouse, SkuMetadata } from "../types";
import { Sliders, MapPin, Tag, Shield, Calendar, Shuffle, Flame, Truck, RefreshCw } from "lucide-react";

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
  supplierDelayDays: number;
  onChangeSupplierDelayDays: (days: number) => void;
  isSimulating: boolean;
  onTriggerSimulation: () => void;
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
  supplierDelayDays,
  onChangeSupplierDelayDays,
  isSimulating,
  onTriggerSimulation,
}) => {
  return (
    <aside className="w-full lg:w-80 shrink-0 bg-slate-900/90 border-r border-slate-800 p-5 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Control Tower Parameters</span>
        </div>
        <button
          onClick={onTriggerSimulation}
          disabled={isSimulating}
          className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isSimulating ? "animate-spin" : ""}`} />
          <span>Recompute</span>
        </button>
      </div>

      {/* 1. Warehouse Location Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dark Store / Node</span>
        </label>
        <select
          value={selectedWarehouseId}
          onChange={(e) => onSelectWarehouse(e.target.value)}
          className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
        >
          {warehouses.map((wh) => (
            <option key={wh.id} value={wh.id}>
              {wh.name} ({wh.region})
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-400">
          Hyper-local quick-commerce fulfillment dark store node.
        </p>
      </div>

      {/* 2. SKU Multiselect Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>SKU Selection ({selectedSkuIds.length}/{allSkus.length})</span>
          </label>
          <button
            onClick={onSelectAllSkus}
            className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
          >
            Select All
          </button>
        </div>
        <div className="space-y-1.5 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 max-h-48 overflow-y-auto">
          {allSkus.map((sku) => {
            const isChecked = selectedSkuIds.includes(sku.id);
            return (
              <label
                key={sku.id}
                className="flex items-center gap-2.5 p-1.5 rounded hover:bg-slate-800/60 cursor-pointer text-xs text-slate-300 select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleSku(sku.id)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-800"
                />
                <span className="flex-1 truncate font-medium">{sku.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ₹{sku.basePrice}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Cycle Service Level Target (Z-score) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Service Level Target (CSL)</span>
        </label>
        <div className="space-y-1">
          {serviceLevels.map((lvl) => {
            const isSelected = selectedServiceZ === lvl.z;
            return (
              <button
                key={lvl.z}
                onClick={() => onSelectServiceZ(lvl.z)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
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
          <label className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Forecast Horizon</span>
          </label>
          <span className="font-mono text-indigo-400 font-bold">
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
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>14 days</span>
          <span>21 days</span>
          <span>30 days</span>
        </div>
      </div>

      {/* 5. Monte Carlo Runs Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Simulation Runs</span>
          </label>
          <span className="font-mono text-indigo-400 font-bold">
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
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>500</span>
          <span>1,000</span>
          <span>2,000</span>
        </div>
      </div>

      {/* 6. Stress Test / Sandbox */}
      <div className="pt-3 border-t border-slate-800 space-y-4">
        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5" />
          <span>Stress-Test &amp; Promo Sandbox</span>
        </div>

        {/* Promo Demand Spike Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Flash Sale Surge</span>
            <span className="font-mono text-amber-400 font-bold">
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

        {/* Lead Time Delay Bias Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Truck className="w-3 h-3 text-slate-400" />
              <span>Supplier Delay Shock</span>
            </span>
            <span className="font-mono text-amber-400 font-bold">
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
