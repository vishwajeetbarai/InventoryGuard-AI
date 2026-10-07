import React, { useState } from "react";
import { SkuSimulationState } from "../types";
import { Search, ArrowUpDown, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface RiskTableProps {
  simulationStates: SkuSimulationState[];
  onSelectSku: (skuId: string) => void;
  theme?: "dark" | "light";
}

export const RiskTable: React.FC<RiskTableProps> = ({
  simulationStates,
  onSelectSku,
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"risk" | "stock" | "revRisk">("risk");
  const [sortAsc, setSortAsc] = useState(false);

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
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  No SKUs matched the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const isCrit = s.mcResult.urgency === "CRITICAL REORDER NOW";
                return (
                  <tr
                    key={s.sku.id}
                    className={`transition-colors ${
                      isDark
                        ? `hover:bg-slate-800/40 ${isCrit ? "bg-red-500/[0.04]" : ""}`
                        : `hover:bg-slate-50 ${isCrit ? "bg-red-50/60" : ""}`
                    }`}
                  >
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
