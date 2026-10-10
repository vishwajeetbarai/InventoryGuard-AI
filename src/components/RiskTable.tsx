import React, { useState } from "react";
import { SkuSimulationState } from "../types";
import {
  Search,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Truck,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";

interface RiskTableProps {
  simulationStates: SkuSimulationState[];
  onSelectSku: (skuId: string) => void;
  onBulkDispatchCriticalPos?: (selectedIds?: string[]) => void;
  onAutoApproveTransfers?: () => void;
  theme?: "dark" | "light";
}

export const RiskTable: React.FC<RiskTableProps> = ({
  simulationStates,
  onSelectSku,
  onBulkDispatchCriticalPos,
  onAutoApproveTransfers,
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"risk" | "stock" | "revRisk">("risk");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const filtered = simulationStates
    .filter((s) => {
      const matchSearch =
        s.sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sku.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sku.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sku.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "ALL" || s.mcResult.urgency === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let vA = 0;
      let vB = 0;
      if (sortField === "risk") {
        vA = a.mcResult.stockoutProbabilityPct;
        vB = b.mcResult.stockoutProbabilityPct;
      } else if (sortField === "stock") {
        vA = a.usableStock;
        vB = b.usableStock;
      } else if (sortField === "revRisk") {
        vA = a.revenueAtRisk;
        vB = b.revenueAtRisk;
      }
      return sortAsc ? vA - vB : vB - vA;
    });

  const criticalSkus = simulationStates.filter(
    (s) => s.mcResult.urgency === "CRITICAL REORDER NOW"
  );

  const isAllFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selectedRowIds.has(s.sku.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filtered.map((s) => s.sku.id)));
    }
  };

  const handleToggleRow = (skuId: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(skuId)) {
      next.delete(skuId);
    } else {
      next.add(skuId);
    }
    setSelectedRowIds(next);
  };

  const handleSelectOnlyCritical = () => {
    setSelectedRowIds(new Set(criticalSkus.map((s) => s.sku.id)));
  };

  const handleClearSelection = () => {
    setSelectedRowIds(new Set());
  };

  const handleBulkDispatch = () => {
    if (onBulkDispatchCriticalPos) {
      const targetIds =
        selectedRowIds.size > 0 ? Array.from(selectedRowIds) : undefined;
      onBulkDispatchCriticalPos(targetIds);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL REORDER NOW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/30">
            <AlertTriangle className="w-3 h-3" />
            CRITICAL REORDER NOW
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
            <ShieldAlert className="w-3 h-3" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            OPTIMAL
          </span>
        );
    }
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case "A":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">Grade A</span>;
      case "B":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/30">Grade B</span>;
      case "C":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">Grade C</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/30">Grade {grade}</span>;
    }
  };

  const containerCls = isDark
    ? "bg-slate-900/80 border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-900 shadow-sm";

  return (
    <div className={`border rounded-xl overflow-hidden shadow-sm transition-colors ${containerCls}`}>
      {/* Table Controls */}
      <div
        className={`p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isDark ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div>
          <h3
            className={`text-base font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Stock-Out Risk &amp; Reorder Action Prioritization
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked by Monte Carlo stock-out probability evaluated against usable stock (discounting perishable batch decay)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter SKU or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-8 pr-3 py-1.5 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-48 sm:w-56 border ${
                isDark
                  ? "bg-slate-800/80 border-slate-700 text-slate-200"
                  : "bg-slate-100 border-slate-300 text-slate-800"
              }`}
            />
          </div>

          {/* Status Filter */}
          <div
            className={`flex items-center gap-1 rounded-lg p-1 border ${
              isDark
                ? "bg-slate-800/80 border-slate-700"
                : "bg-slate-100 border-slate-300"
            }`}
          >
            {["ALL", "CRITICAL REORDER NOW", "WARNING", "OPTIMAL"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-white"
                }`}
              >
                {st === "ALL"
                  ? "All"
                  : st === "CRITICAL REORDER NOW"
                  ? "Critical"
                  : st === "WARNING"
                  ? "Warning"
                  : "Optimal"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Operations Toolbar */}
      <div
        className={`px-4 py-2.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          isDark
            ? "bg-indigo-950/20 border-slate-800/80 text-slate-300"
            : "bg-indigo-50/70 border-slate-200 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-400">
              Bulk Operations:
            </span>
            <span className="font-mono px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {selectedRowIds.size} of {filtered.length} Selected
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <button
              onClick={handleToggleSelectAll}
              className="hover:text-indigo-400 hover:underline cursor-pointer"
            >
              {isAllFilteredSelected ? "Deselect All" : "Select All"}
            </button>
            <span>•</span>
            <button
              onClick={handleSelectOnlyCritical}
              className="hover:text-red-400 hover:underline cursor-pointer"
            >
              Select All Critical ({criticalSkus.length})
            </button>
            {selectedRowIds.size > 0 && (
              <>
                <span>•</span>
                <button
                  onClick={handleClearSelection}
                  className="hover:text-slate-200 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleBulkDispatch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer shadow-sm shadow-red-600/30"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Bulk Dispatch All Critical POs</span>
            {criticalSkus.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                {criticalSkus.length}
              </span>
            )}
          </button>

          <button
            onClick={onAutoApproveTransfers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all cursor-pointer shadow-sm shadow-amber-600/30"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>🚚 Auto-Approve All Transfer Opportunities</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr
              className={`border-b font-semibold uppercase tracking-wider ${
                isDark
                  ? "bg-slate-950/60 border-slate-800 text-slate-400"
                  : "bg-slate-100 border-slate-200 text-slate-600"
              }`}
            >
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">SKU / Catalog</th>
              <th className="py-3 px-4">Supplier &amp; Risk Grade</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-indigo-400"
                onClick={() => {
                  setSortField("stock");
                  setSortAsc(!sortAsc);
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Usable / Gross Stock</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Dynamic ROP</th>
              <th className="py-3 px-4">Safety Stock</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-indigo-400"
                onClick={() => {
                  setSortField("risk");
                  setSortAsc(!sortAsc);
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Stock-Out Risk</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-indigo-400"
                onClick={() => {
                  setSortField("revRisk");
                  setSortAsc(!sortAsc);
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Revenue at Risk</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Suggested PO Qty</th>
              <th className="py-3 px-4">Status &amp; Action</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              isDark ? "divide-slate-800/60" : "divide-slate-200"
            }`}
          >
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400">
                  No SKUs matched the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const isCrit = s.mcResult.urgency === "CRITICAL REORDER NOW";
                const isSelected = selectedRowIds.has(s.sku.id);
                return (
                  <tr
                    key={s.sku.id}
                    className={`transition-colors ${
                      isDark
                        ? `hover:bg-slate-800/40 ${
                            isSelected
                              ? "bg-indigo-950/30"
                              : isCrit
                              ? "bg-red-500/[0.04]"
                              : ""
                          }`
                        : `hover:bg-slate-50 ${
                            isSelected
                              ? "bg-indigo-50"
                              : isCrit
                              ? "bg-red-50/60"
                              : ""
                          }`
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(s.sku.id)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div
                        className={`font-bold ${
                          isDark ? "text-slate-100" : "text-slate-900"
                        }`}
                      >
                        {s.sku.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>{s.sku.id}</span>
                        <span>•</span>
                        <span>{s.sku.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-300 truncate max-w-[130px]">
                        {s.sku.supplierName}
                      </div>
                      <div className="mt-0.5">{getGradeBadge(s.supplierScorecard.grade)}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      <span className="text-sky-400 font-bold">{s.usableStock}</span>
                      <span className="text-slate-500"> / {s.currentStock}</span>
                      {s.decayedUnits > 0 && (
                        <div className="text-[10px] text-amber-500 font-sans font-medium">
                          -{s.decayedUnits} units decayed ({s.decayRatePct}%)
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-red-500">
                      {s.mcResult.dynamicRop.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-500">
                      {s.mcResult.dynamicSafetyStock.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-16 h-1.5 rounded-full overflow-hidden ${
                            isDark ? "bg-slate-800" : "bg-slate-200"
                          }`}
                        >
                          <div
                            className={`h-full rounded-full ${
                              s.mcResult.stockoutProbabilityPct > 25
                                ? "bg-red-500"
                                : s.mcResult.stockoutProbabilityPct > 10
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                            }`}
                            style={{ width: `${Math.min(100, s.mcResult.stockoutProbabilityPct)}%` }}
                          />
                        </div>
                        <span
                          className={`font-mono font-bold ${
                            s.mcResult.stockoutProbabilityPct > 25
                              ? "text-red-500"
                              : s.mcResult.stockoutProbabilityPct > 10
                              ? "text-amber-500"
                              : "text-emerald-500"
                          }`}
                        >
                          {s.mcResult.stockoutProbabilityPct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-amber-500">
                      ₹{s.revenueAtRisk.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {s.mcResult.recommendedReorderQty > 0 ? (
                        <span className="text-emerald-500">
                          +{s.mcResult.recommendedReorderQty.toLocaleString()} units
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getUrgencyBadge(s.mcResult.urgency)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectSku(s.sku.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-all border ${
                          isDark
                            ? "bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700"
                            : "bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-300"
                        }`}
                      >
                        Deep-Dive
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

