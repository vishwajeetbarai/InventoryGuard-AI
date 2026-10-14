import React, { useState, useRef, useEffect } from "react";
import { Warehouse, CurrencyCode, AppPage } from "../types";
export type { AppPage };
import { UserProfile, TenantOrganization, UserRole } from "../types/auth";
import { USER_ROLES } from "../services/authService";
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
  LayoutDashboard,
  TrendingUp,
  Truck,
  SlidersHorizontal,
  Play,
  Loader2,
  MapPin,
  Menu,
  X,
} from "lucide-react";

interface HeaderProps {
  currentWarehouse: Warehouse;
  warehouses?: Warehouse[];
  onSelectWarehouse?: (id: string) => void;
  activePage: AppPage;
  onSelectPage(page: AppPage): void;
  onRefreshData(): void;
  isSimulating: boolean;
  theme: "dark" | "light";
  onToggleTheme(): void;
  onOpenCommandPalette(): void;
  onOpenExportReport(): void;
  onOpenWmsIngestion(): void;
  onOpenAuditLedger(): void;
  currentUser: UserProfile;
  onSelectRole(role: UserRole): void;
  currentTenant: TenantOrganization;
  onSelectTenant(tenant: TenantOrganization): void;
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
  currentCurrency = "USD",
  onSelectCurrency,
}) => {
  const isDark = theme === "dark";
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isWarehouseMenuOpen, setIsWarehouseMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { id: "operations", label: "Operations & Data Hub", icon: SlidersHorizontal },
  ];

  return (
    <header
      className={`border-b sticky top-0 z-40 transition-colors duration-150 ${
        isDark
          ? "border-neutral-800 bg-[#09090B]/95 text-neutral-100 backdrop-blur-md"
          : "border-slate-200 bg-white/95 text-slate-900 backdrop-blur-md shadow-xs"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand & Warehouse Quick Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectPage("overview")}
              className="flex items-center gap-2.5 cursor-pointer select-none group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs font-bold transition-transform group-hover:scale-105">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.14-2.73 8.01-6 9.07-3.27-1.06-6-4.93-6-9.07V6.43l6-2.25zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className={`font-extrabold text-lg tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>
                    InventoryGuard<span className="text-emerald-600 dark:text-emerald-400 font-black">-AI</span>
                  </span>
                </div>
                <div className={`text-[10px] tracking-wider mt-0.5 font-bold uppercase ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
                  Supply Chain Intelligence
                </div>
              </div>
            </button>

            {/* Warehouse Dropdown */}
            {warehouses.length > 0 && onSelectWarehouse && (
              <div className="relative hidden md:block" ref={warehouseMenuRef}>
                <button
                  onClick={() => setIsWarehouseMenuOpen(!isWarehouseMenuOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    isDark
                      ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                  }`}
                  title="Switch Active Fulfillment Facility"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold truncate max-w-[130px]">
                    {currentWarehouse.name.split(" ")[0]}
                  </span>
                  <span className={`text-[11px] font-mono ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                    ({currentWarehouse.city})
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                </button>

                {isWarehouseMenuOpen && (
                  <div
                    className={`absolute left-0 mt-2 w-72 rounded-xl border shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                      isDark
                        ? "bg-neutral-900 border-neutral-800 text-neutral-200"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 border-b border-slate-100 dark:border-neutral-800">
                      Fulfillment Facility Nodes
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
                                  : "bg-emerald-50 text-emerald-900 font-semibold"
                                : isDark
                                ? "hover:bg-neutral-800/60 text-neutral-300"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div>
                              <div className="font-semibold">{wh.name}</div>
                              <div className={`text-[10px] flex items-center gap-1.5 mt-0.5 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                                <span>{wh.city}</span>
                                <span>·</span>
                                <span>{wh.region}</span>
                                <span>·</span>
                                <span>{wh.demandFactor.toFixed(2)}x Demand</span>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Central 4-Page Navigation Tabs (Desktop) */}
          <nav
            className={`hidden lg:flex items-center gap-1 p-1 rounded-xl border transition-colors ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-slate-100/90 border-slate-200"
            }`}
          >
            {navPages.map((page) => {
              const Icon = page.icon;
              const isActive = activePage === page.id;
              return (
                <button
                  key={page.id}
                  onClick={() => onSelectPage(page.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? isDark
                        ? "bg-neutral-800 text-white shadow-xs font-bold"
                        : "bg-white text-slate-950 shadow-xs border border-slate-300 font-bold"
                      : isDark
                      ? "text-neutral-200 hover:text-white hover:bg-neutral-800"
                      : "text-slate-800 hover:text-slate-950 hover:bg-slate-200/60"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isDark
                        ? "text-neutral-300"
                        : "text-slate-700"
                    }`}
                  />
                  <span>{page.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools & Profile */}
          <div className="flex items-center gap-2">
            {/* Run Engine Button */}
            <button
              onClick={onRefreshData}
              disabled={isSimulating}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isSimulating
                  ? "bg-emerald-600/70 text-white cursor-wait opacity-80"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow active:scale-[0.98]"
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
                    ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs"
                }`}
                title="Change Currency"
              >
                <span>{CURRENCIES[currentCurrency]?.flag}</span>
                <span className="font-mono font-bold">{CURRENCIES[currentCurrency]?.code}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isCurrencyMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                    isDark
                      ? "bg-neutral-900 border-neutral-800 text-neutral-200"
                      : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 border-b border-slate-100 dark:border-neutral-800">
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
                                : "bg-emerald-50 text-emerald-900 font-semibold"
                              : isDark
                              ? "hover:bg-neutral-800/60 text-neutral-300"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span className="font-medium">{c.code} ({c.symbol})</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
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
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs"
              }`}
              title="Open Command Palette (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
              <kbd className="hidden sm:inline px-1 py-0.5 rounded text-[10px] font-mono border bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-neutral-700">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={`p-1.5 sm:p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 text-amber-400 border-neutral-700"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs"
              }`}
              title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* User Profile & Actions Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs"
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <div className="font-semibold truncate max-w-[100px]">
                    {currentUser.name.split(" ")[0]}
                  </div>
                  <div className={`text-[10px] ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                    {roleDef.title.split(" ")[0]}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                    isDark
                      ? "bg-neutral-900 border-neutral-800 text-neutral-200"
                      : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="p-2 border-b border-slate-100 dark:border-neutral-800">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{currentUser.name}</div>
                    <div className={`text-[11px] ${isDark ? "text-neutral-400" : "text-slate-500"}`}>{currentUser.email}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {roleDef.title}
                      </span>
                    </div>
                  </div>

                  {/* Quick System Actions */}
                  <div className="py-1 border-b border-slate-100 dark:border-neutral-800 space-y-0.5">
                    <button
                      onClick={() => {
                        onOpenWmsIngestion();
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isDark ? "hover:bg-neutral-800 text-neutral-300" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Ingest WMS / ERP CSV</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenAuditLedger();
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isDark ? "hover:bg-neutral-800 text-neutral-300" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Audit Trail Ledger</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenExportReport();
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isDark ? "hover:bg-neutral-800 text-neutral-300" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export Executive Report</span>
                    </button>
                  </div>

                  {/* Switch Role Persona */}
                  <div className="pt-2">
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
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
                                  : "bg-emerald-50 text-emerald-900 font-semibold"
                                : isDark
                                ? "hover:bg-neutral-800 text-neutral-400"
                                : "hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span>{USER_ROLES[r].title}</span>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu (No horizontal overflow) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 dark:border-neutral-800 animate-in fade-in duration-100 space-y-1">
            {navPages.map((page) => {
              const Icon = page.icon;
              const isActive = activePage === page.id;
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    onSelectPage(page.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? isDark
                        ? "bg-neutral-800 text-white font-bold"
                        : "bg-emerald-50 text-emerald-900 font-bold"
                      : isDark
                      ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
                  <span>{page.label}</span>
                </button>
              );
            })}

            {/* Mobile Warehouse Quick Selector */}
            {warehouses.length > 0 && onSelectWarehouse && (
              <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 mt-2">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
                  Active Facility
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {warehouses.map((wh) => (
                    <button
                      key={wh.id}
                      onClick={() => {
                        onSelectWarehouse(wh.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${
                        wh.id === currentWarehouse.id
                          ? isDark
                            ? "bg-neutral-800 text-white font-semibold"
                            : "bg-emerald-50 text-emerald-900 font-semibold"
                          : isDark
                          ? "text-neutral-400 hover:text-white"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{wh.name} ({wh.city})</span>
                      {wh.id === currentWarehouse.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
