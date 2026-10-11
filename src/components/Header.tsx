import React, { useState, useRef, useEffect } from "react";
import { Warehouse, CurrencyCode } from "../types";
import { UserProfile, TenantOrganization, UserRole } from "../types/auth";
import { USER_ROLES, TENANT_ORGANIZATIONS } from "../services/authService";
import { CURRENCIES } from "../utils/currency";
import {
  Sun,
  Moon,
  Search,
  FileSpreadsheet,
  UploadCloud,
  ChevronDown,
  Lock,
  Building2,
  Check,
  RotateCcw,
  Sparkles,
  LayoutDashboard,
  TrendingUp,
  Truck,
  SlidersHorizontal,
  Play,
  Loader2,
  MapPin,
  Shield,
  Layers,
} from "lucide-react";

export type AppPage = "overview" | "inventory" | "procurement" | "operations";

interface HeaderProps {
  currentWarehouse: Warehouse;
  warehouses?: Warehouse[];
  onSelectWarehouse?: (id: string) => void;
  activePage: AppPage;
  onSelectPage: (page: AppPage) => void;
  onRefreshData: () => void;
  isSimulating: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenExportReport: () => void;
  onOpenWmsIngestion: () => void;
  onOpenAuditLedger: () => void;
  currentUser: UserProfile;
  onSelectRole: (role: UserRole) => void;
  currentTenant: TenantOrganization;
  onSelectTenant: (tenant: TenantOrganization) => void;
  customDatasetName?: string | null;
  onResetCustomDataset?: () => void;
  currentCurrency?: CurrencyCode;
  onSelectCurrency?: (curr: CurrencyCode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentWarehouse,
  warehouses = [],
  onSelectWarehouse,
  activePage,
  onSelectPage,
  onRefreshData,
  isSimulating,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenExportReport,
  onOpenWmsIngestion,
  onOpenAuditLedger,
  currentUser,
  onSelectRole,
  currentTenant,
  onSelectTenant,
  customDatasetName,
  onResetCustomDataset,
  currentCurrency = "USD",
  onSelectCurrency,
}) => {
  const isDark = theme === "dark";
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isWarehouseMenuOpen, setIsWarehouseMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const warehouseMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(e.target as Node)) {
        setIsCurrencyMenuOpen(false);
      }
      if (warehouseMenuRef.current && !warehouseMenuRef.current.contains(e.target as Node)) {
        setIsWarehouseMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleDef = USER_ROLES[currentUser.role];

  const navPages: { id: AppPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory & Forecast", icon: TrendingUp },
    { id: "procurement", label: "Procurement & Routing", icon: Truck },
    { id: "operations", label: "Data Hub & Controls", icon: SlidersHorizontal },
  ];

  return (
    <header
      className={`border-b sticky top-0 z-40 transition-colors duration-150 ${
        isDark
          ? "border-neutral-800 bg-black/95 text-neutral-100 backdrop-blur-md"
          : "border-slate-200/90 bg-white/95 text-slate-900 backdrop-blur-md shadow-xs"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Warehouse Quick Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              onClick={() => onSelectPage("overview")}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm tracking-tight transition-transform group-hover:scale-105 ${
                  isDark
                    ? "bg-white text-black shadow-sm"
                    : "bg-slate-900 text-white shadow-sm"
                }`}
              >
                ▲
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span
                    className={`font-extrabold text-base tracking-tight ${
                      isDark ? "text-white" : "text-slate-950"
                    }`}
                  >
                    Apex
                  </span>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isDark ? "text-neutral-400" : "text-slate-500"
                    }`}
                  >
                    Supply
                  </span>
                </div>
                <div
                  className={`text-[10px] tracking-wide mt-0.5 font-medium ${
                    isDark ? "text-neutral-500" : "text-slate-400"
                  }`}
                >
                  Intelligent Control Tower
                </div>
              </div>
            </div>

            {/* Warehouse Dropdown */}
            {warehouses.length > 0 && onSelectWarehouse && (
              <div className="relative hidden md:block" ref={warehouseMenuRef}>
                <button
                  onClick={() => setIsWarehouseMenuOpen(!isWarehouseMenuOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    isDark
                      ? "bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-neutral-300"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                  title="Switch Active Fulfillment Hub"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-semibold truncate max-w-[140px]">
                    {currentWarehouse.name.split(" ")[0]}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      isDark ? "text-neutral-500" : "text-slate-400"
                    }`}
                  >
                    ({currentWarehouse.city})
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                </button>

                {isWarehouseMenuOpen && (
                  <div
                    className={`absolute left-0 mt-2 w-72 rounded-xl border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                      isDark
                        ? "bg-neutral-950 border-neutral-800 text-neutral-200"
                        : "bg-white border-slate-200 text-slate-800 shadow-lg"
                    }`}
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-neutral-800/40">
                      Select Fulfillment Facility
                    </div>
                    <div className="space-y-0.5 mt-1 max-h-64 overflow-y-auto">
                      {warehouses.map((wh) => {
                        const isSelected = wh.id === currentWarehouse.id;
                        return (
                          <button
                            key={wh.id}
                            onClick={() => {
                              onSelectWarehouse(wh.id);
                              setIsWarehouseMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                              isSelected
                                ? isDark
                                  ? "bg-neutral-800 text-white font-semibold"
                                  : "bg-slate-100 text-slate-900 font-semibold"
                                : isDark
                                ? "hover:bg-neutral-900 text-neutral-300"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div>
                              <div className="font-medium">{wh.name}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{wh.city}</span>
                                <span>·</span>
                                <span>{wh.region}</span>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Central Clean 4-Page Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl border transition-colors bg-opacity-50">
            {navPages.map((page) => {
              const Icon = page.icon;
              const isActive = activePage === page.id;
              return (
                <button
                  key={page.id}
                  onClick={() => onSelectPage(page.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? isDark
                        ? "bg-neutral-800 text-white shadow-xs"
                        : "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                      : isDark
                      ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? isDark
                          ? "text-white"
                          : "text-slate-900"
                        : isDark
                        ? "text-neutral-400"
                        : "text-slate-500"
                    }`}
                  />
                  <span>{page.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools & Profile */}
          <div className="flex items-center gap-2">
            {/* Run Simulation Trigger */}
            <button
              onClick={onRefreshData}
              disabled={isSimulating}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isSimulating
                  ? "opacity-60 cursor-not-allowed"
                  : isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700"
                  : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-xs"
              }`}
              title="Run Stochastic Monte Carlo & ML Forecast Simulation"
            >
              {isSimulating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              <span>{isSimulating ? "Simulating..." : "Run Engine"}</span>
            </button>

            {/* Currency Selector */}
            <div className="relative" ref={currencyMenuRef}>
              <button
                onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-200"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs"
                }`}
                title="Change Currency (USD, EUR, GBP, INR)"
              >
                <span>{CURRENCIES[currentCurrency]?.flag}</span>
                <span className="font-mono font-bold">
                  {CURRENCIES[currentCurrency]?.code}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isCurrencyMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-52 rounded-xl border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                    isDark
                      ? "bg-neutral-950 border-neutral-800 text-neutral-200"
                      : "bg-white border-slate-200 text-slate-800 shadow-lg"
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-neutral-800/40">
                    Display Currency
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {(Object.keys(CURRENCIES) as CurrencyCode[]).map((cCode) => {
                      const c = CURRENCIES[cCode];
                      const isSelected = currentCurrency === cCode;
                      return (
                        <button
                          key={cCode}
                          onClick={() => {
                            onSelectCurrency?.(cCode);
                            setIsCurrencyMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? isDark
                                ? "bg-neutral-800 text-white font-semibold"
                                : "bg-slate-100 text-slate-950 font-semibold"
                              : isDark
                              ? "hover:bg-neutral-900 text-neutral-300"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span className="font-medium">{c.code} ({c.symbol})</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Command Palette (⌘K) */}
            <button
              onClick={onOpenCommandPalette}
              className={`p-1.5 sm:px-2 sm:py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs"
              }`}
              title="Open Command Palette (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
              <kbd
                className={`hidden md:inline px-1 py-0.5 rounded text-[10px] font-mono border ${
                  isDark
                    ? "bg-neutral-800 text-neutral-400 border-neutral-700"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle (Light by default, Pitch-Black Obsidian Dark Mode) */}
            <button
              onClick={onToggleTheme}
              className={`p-1.5 sm:p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 text-amber-400 border-neutral-800"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs"
              }`}
              title={isDark ? "Switch to Clean Light Theme" : "Switch to Deep Black Obsidian Theme"}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile & Actions Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-200"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                    isDark ? "bg-neutral-800 text-neutral-200" : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <div className="font-semibold truncate max-w-[100px]">
                    {currentUser.name.split(" ")[0]}
                  </div>
                  <div className="text-[10px] text-slate-400">{roleDef.title.split(" ")[0]}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                    isDark
                      ? "bg-neutral-950 border-neutral-800 text-neutral-200"
                      : "bg-white border-slate-200 text-slate-800 shadow-lg"
                  }`}
                >
                  <div className="p-2 border-b border-neutral-800/40">
                    <div className="font-semibold text-xs">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {roleDef.title}
                      </span>
                    </div>
                  </div>

                  {/* Quick System Actions */}
                  <div className="py-1 border-b border-neutral-800/40 space-y-0.5">
                    <button
                      onClick={() => {
                        onOpenWmsIngestion();
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isDark ? "hover:bg-neutral-900 text-neutral-300" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Ingest WMS / ERP CSV</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenAuditLedger();
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isDark ? "hover:bg-neutral-900 text-neutral-300" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Audit Trail Ledger</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenExportReport();
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isDark ? "hover:bg-neutral-900 text-neutral-300" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                      <span>Export Executive Report</span>
                    </button>
                  </div>

                  {/* Switch Role */}
                  <div className="pt-2">
                    <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Switch Role Persona
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {(Object.keys(USER_ROLES) as UserRole[]).map((r) => {
                        const isCurrent = currentUser.role === r;
                        return (
                          <button
                            key={r}
                            onClick={() => {
                              onSelectRole(r);
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              isCurrent
                                ? isDark
                                  ? "bg-neutral-800 text-white font-semibold"
                                  : "bg-slate-100 text-slate-900 font-semibold"
                                : isDark
                                ? "hover:bg-neutral-900 text-neutral-400"
                                : "hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span>{USER_ROLES[r].title}</span>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-neutral-800/40 overflow-x-auto gap-2">
          {navPages.map((page) => {
            const Icon = page.icon;
            const isActive = activePage === page.id;
            return (
              <button
                key={page.id}
                onClick={() => onSelectPage(page.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? isDark
                      ? "bg-neutral-800 text-white"
                      : "bg-slate-900 text-white"
                    : isDark
                    ? "text-neutral-400 hover:text-neutral-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{page.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
