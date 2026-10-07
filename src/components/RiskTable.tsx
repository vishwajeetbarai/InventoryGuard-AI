import React, { useState } from "react";
import { SkuSimulationState } from "../types";
import { Search, Filter, ArrowUpDown, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface RiskTableProps {
  simulationStates: SkuSimulationState[];
  onSelectSku: (skuId: string) => void;
}

export const RiskTable: React.FC<RiskTableProps> = ({
  simulationStates,
  onSelectSku,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"risk" | "stock" | "revRisk">("risk");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = simulationStates
    .filter((s) => {
      const matchSearch =
        s.sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sku.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sku.category.toLowerCase().includes(searchTerm.toLowerCase());
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
        vA = a.currentStock;
        vB = b.currentStock;
      } else if (sortField === "revRisk") {
        vA = a.revenueAtRisk;
        vB = b.revenueAtRisk;
      }
      return sortAsc ? vA - vB : vB - vA;
    });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL REORDER NOW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-3 h-3" />
            CRITICAL REORDER NOW
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="w-3 h-3" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            OPTIMAL
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Table Controls */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">
            Stock-Out Risk &amp; Reorder Action Prioritization
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked by Monte Carlo stock-out probability during supplier fulfillment window
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
              className="pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-lg p-1">
            {["ALL", "CRITICAL REORDER NOW", "WARNING", "OPTIMAL"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
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

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">SKU / Catalog</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white"
                onClick={() => {
                  setSortField("stock");
                  setSortAsc(!sortAsc);
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Current Stock</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Dynamic ROP</th>
              <th className="py-3 px-4">Safety Stock</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white"
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
                className="py-3 px-4 cursor-pointer hover:text-white"
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
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No SKUs matched the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const isCrit = s.mcResult.urgency === "CRITICAL REORDER NOW";
                return (
                  <tr
                    key={s.sku.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isCrit ? "bg-red-500/[0.02]" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100">{s.sku.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>{s.sku.id}</span>
                        <span>•</span>
                        <span>{s.sku.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                      {s.currentStock.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-red-400">
                      {s.mcResult.dynamicRop.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-400">
                      {s.mcResult.dynamicSafetyStock.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
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
                              ? "text-red-400"
                              : s.mcResult.stockoutProbabilityPct > 10
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {s.mcResult.stockoutProbabilityPct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-amber-300">
                      ₹{s.revenueAtRisk.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {s.mcResult.recommendedReorderQty > 0 ? (
                        <span className="text-emerald-400">
                          +{s.mcResult.recommendedReorderQty.toLocaleString()} units
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getUrgencyBadge(s.mcResult.urgency)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectSku(s.sku.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-[11px] font-semibold cursor-pointer transition-all"
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
