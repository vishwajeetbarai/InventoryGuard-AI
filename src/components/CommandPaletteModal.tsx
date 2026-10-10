import React, { useState, useEffect, useRef } from "react";
import { Warehouse, SkuMetadata } from "../types";
import {
  Search,
  Command,
  TrendingUp,
  Table,
  ArrowRightLeft,
  Award,
  FileCheck2,
  Code2,
  MapPin,
  Sparkles,
  CloudRain,
  Flame,
  ShieldCheck,
  FileSpreadsheet,
  Printer,
  X,
  Navigation,
} from "lucide-react";

export interface CommandItem {
  id: string;
  category: "SKU Deep Dive" | "Switch Facility" | "Navigation" | "Simulations" | "Export";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
  selectedWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  allSkus: SkuMetadata[];
  onSelectSku: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  onTriggerSimulation: () => void;
  onApplyWeatherSurge: (pct: number) => void;
  onApplyPromoSurge: (pct: number) => void;
  onApplyServiceLevel: (z: number) => void;
  onExportCsv: () => void;
  onOpenPdfReport: () => void;
  theme: "dark" | "light";
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  selectedWarehouseId,
  onSelectWarehouse,
  allSkus,
  onSelectSku,
  onNavigateTab,
  onTriggerSimulation,
  onApplyWeatherSurge,
  onApplyPromoSurge,
  onApplyServiceLevel,
  onExportCsv,
  onOpenPdfReport,
  theme,
}) => {
  const isDark = theme === "dark";
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Construct all available commands
  const commands: CommandItem[] = [
    // 1. Navigation tabs
    {
      id: "tab-network",
      category: "Navigation",
      title: "Network Topology Map",
      subtitle: "View 3-node inter-store corridor map & active transit pulses",
      icon: <Navigation className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onNavigateTab("network");
        onClose();
      },
      keywords: ["map", "network", "topology", "routes", "nodes", "transit"],
    },
    {
      id: "tab-analytics",
      category: "Navigation",
      title: "Visual Analytics",
      subtitle: "Demand forecasting, depletion curves & perishable diagnostics",
      icon: <TrendingUp className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onNavigateTab("analytics");
        onClose();
      },
      keywords: ["charts", "forecast", "analytics", "depletion", "curves"],
    },
    {
      id: "tab-table",
      category: "Navigation",
      title: "Risk Action Table",
      subtitle: "Stockout probabilities, dynamic ROP & reorder quantities",
      icon: <Table className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onNavigateTab("table");
        onClose();
      },
      keywords: ["table", "risk", "stockout", "rop", "urgency"],
    },
    {
      id: "tab-transfer",
      category: "Navigation",
      title: "Inter-Store Transfers",
      subtitle: "Review multi-echelon surplus redeployment & profit matrix",
      icon: <ArrowRightLeft className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onNavigateTab("transfer");
        onClose();
      },
      keywords: ["transfer", "inter-store", "warehouse", "cross-dock"],
    },
    {
      id: "tab-suppliers",
      category: "Navigation",
      title: "Supplier Reliability Scorecards",
      subtitle: "Grade A to F vendor lead-time variance & buffers",
      icon: <Award className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onNavigateTab("suppliers");
        onClose();
      },
      keywords: ["suppliers", "vendor", "scorecard", "reliability", "grades"],
    },
    {
      id: "tab-po",
      category: "Navigation",
      title: "Automated PO Batch & ERP Ledger",
      subtitle: "Generate purchase orders & inspect EDI/SHA-256 signatures",
      icon: <FileCheck2 className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onNavigateTab("po");
        onClose();
      },
      keywords: ["po", "purchase orders", "erp", "webhook", "edi"],
    },
    {
      id: "tab-code",
      category: "Navigation",
      title: "Streamlit Python Artifacts",
      subtitle: "Inspect single-file executable app.py & system architecture",
      icon: <Code2 className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onNavigateTab("code");
        onClose();
      },
      keywords: ["python", "app.py", "streamlit", "code", "architecture"],
    },

    // 2. SKUs
    ...allSkus.map((sku) => ({
      id: `sku-${sku.id}`,
      category: "SKU Deep Dive" as const,
      title: `${sku.name} (${sku.id})`,
      subtitle: `${sku.category} · Shelf-Life: ${sku.shelfLifeDays || 90}d · Lead Time: ${sku.leadTimeMean}d`,
      icon: <Search className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onSelectSku(sku.id);
        onNavigateTab("analytics");
        onClose();
      },
      keywords: [sku.name.toLowerCase(), sku.id.toLowerCase(), sku.category.toLowerCase()],
    })),

    // 3. Switch Warehouses
    ...warehouses.map((wh) => ({
      id: `wh-${wh.id}`,
      category: "Switch Facility" as const,
      title: `${wh.name} (${wh.city})`,
      subtitle: `Region: ${wh.region} ${wh.id === selectedWarehouseId ? "· [CURRENT ACTIVE]" : ""}`,
      icon: <MapPin className="w-4 h-4 text-amber-400" />,
      action: () => {
        onSelectWarehouse(wh.id);
        onClose();
      },
      keywords: [wh.name.toLowerCase(), wh.city.toLowerCase(), wh.id.toLowerCase()],
    })),

    // 4. Simulations & Stress Tests
    {
      id: "sim-recompute",
      category: "Simulations",
      title: "Re-run Stochastic Joint Risk Simulation",
      subtitle: "Execute 1,000+ Monte Carlo iterations & recalculate dynamic ROP",
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onTriggerSimulation();
        onClose();
      },
      keywords: ["simulation", "monte carlo", "rerun", "recompute", "refresh"],
    },
    {
      id: "sim-monsoon",
      category: "Simulations",
      title: "Simulate Monsoon Weather Deluge (+35% Surge)",
      subtitle: "Uplift weather-sensitive perishables & dairy demand",
      icon: <CloudRain className="w-4 h-4 text-sky-400" />,
      action: () => {
        onApplyWeatherSurge(35);
        onClose();
      },
      keywords: ["weather", "rain", "monsoon", "shock", "surge"],
    },
    {
      id: "sim-flashsale",
      category: "Simulations",
      title: "Simulate Flash Sale Demand Surge (+50%)",
      subtitle: "Stress-test rapid stock depletion under high cart velocity",
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      action: () => {
        onApplyPromoSurge(50);
        onClose();
      },
      keywords: ["promo", "flash sale", "surge", "spike"],
    },
    {
      id: "sim-csl995",
      category: "Simulations",
      title: "Lock High Assurance CSL (99.5% Cycle Service Level)",
      subtitle: "Set Z = 2.576 for mission-critical supply protection",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onApplyServiceLevel(2.576);
        onClose();
      },
      keywords: ["service level", "csl", "z-score", "safety stock", "99.5"],
    },

    // 5. Exports
    {
      id: "export-csv",
      category: "Export",
      title: "Export Full Supply Chain Audit Report (CSV)",
      subtitle: "Download structured dataset: stockouts, safety stocks, transfers & ERP trail",
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onExportCsv();
        onClose();
      },
      keywords: ["export", "csv", "download", "excel", "sheet", "audit"],
    },
    {
      id: "export-pdf",
      category: "Export",
      title: "Generate Executive Audit Dossier (Printable PDF)",
      subtitle: "Open print-ready executive briefing with compliance certification",
      icon: <Printer className="w-4 h-4 text-sky-400" />,
      action: () => {
        onOpenPdfReport();
        onClose();
      },
      keywords: ["pdf", "print", "report", "dossier", "executive"],
    },
  ];

  // Filter commands
  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.keywords?.some((k) => k.includes(q))
    );
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Keep selected item in view
  useEffect(() => {
    const activeEl = listRef.current?.children[selectedIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDark
            ? "bg-[#0B0F19] border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-900 shadow-slate-400/20"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          className={`flex items-center px-4 py-3.5 border-b ${
            isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-50/80"
          }`}
        >
          <Search className="w-5 h-5 text-indigo-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, SKU name, dark store, or action..."
            className="w-full bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800/60 ml-2">
            ESC to close
          </span>
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-800/20"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching commands or SKUs found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? isDark
                        ? "bg-indigo-600/20 text-white border border-indigo-500/40"
                        : "bg-indigo-50 text-indigo-900 border border-indigo-200"
                      : isDark
                      ? "hover:bg-slate-800/40 text-slate-300"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isDark ? "bg-slate-800" : "bg-slate-200"
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs truncate">
                          {cmd.title}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                            isDark
                              ? "bg-slate-800 text-slate-400"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {cmd.category}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {cmd.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono shrink-0 px-2 py-0.5 rounded ${
                      isSelected
                        ? "text-indigo-400 bg-indigo-500/10"
                        : "text-slate-400"
                    }`}
                  >
                    ↵
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Hotkey Guide */}
        <div
          className={`px-4 py-2.5 border-t flex flex-wrap items-center justify-between text-[11px] font-mono ${
            isDark
              ? "border-slate-800 bg-slate-900/40 text-slate-400"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Dismiss</span>
          </div>
          <span className="text-indigo-400 font-semibold">
            InventoryGuard AI Command Engine
          </span>
        </div>
      </div>
    </div>
  );
};
