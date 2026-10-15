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
  Activity,
  Menu,
  LogOut,
  MapPin,
  ChevronRight,
  Database,
  RotateCcw,
} from "lucide-react";

interface HeaderProps {
  currentWarehouse: Warehouse;
  warehouses?: Warehouse[];
  onSelectWarehouse?: (id: string) => void;
  activePage: AppPage;
  onSelectPage?: (page: AppPage) => void;
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
  onGoToLanding?: () => void;
  onSignOut?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentWarehouse,
  warehouses = [],
  onSelectWarehouse,
  activePage,
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
  onSignOut,
  onToggleMobileSidebar,
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

  // Breadcrumb details per active page
  const pageDetails: Record<AppPage, { title: string; subtitle: string }> = {
    overview: {
      title: "Overview",
      subtitle: "Control Tower",
    },
    inventory: {
      title: "Inventory",
      subtitle: "Demand & Risk",
    },
    procurement: {
      title: "Procurement",
      subtitle: "PO & Routing",
    },
    operations: {
      title: "Operations",
      subtitle: "Lab & Data Hub",
    },
  };

  const currentDetails = pageDetails[activePage] || pageDetails.overview;

  return (
    <header
      className={`border-b sticky top-0 z-20 w-full transition-colors duration-150 ${
        isDark
          ? "border-neutral-800 bg-[#09090B]/95 text-neutral-100 backdrop-blur-md"
          : "border-slate-200 bg-white/95 text-slate-900 backdrop-blur-md shadow-xs"
      }`}
    >
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4 min-w-0">
          {/* LEFT: Mobile Sidebar Trigger + Breadcrumb / Page Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className={`lg:hidden p-2 rounded-xl border text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0 ${
                isDark
                  ? "border-neutral-800 hover:bg-neutral-800"
                  : "border-slate-200 hover:bg-slate-100"
              }`}
              title="Open Navigation"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="hidden md:inline text-xs font-semibold text-slate-400 dark:text-neutral-500">
                Workspace
              </span>
              <ChevronRight className="hidden md:inline w-3.5 h-3.5 text-slate-400 dark:text-neutral-600 shrink-0" />
              <div className="min-w-0 flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-950 dark:text-white truncate">
                  {currentDetails.title}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  {currentDetails.subtitle}
                </span>
              </div>
            </div>

            {/* Facility Node Switcher Dropdown */}
            {warehouses.length > 0 && onSelectWarehouse && (
              <div className="relative ml-1 sm:ml-2" ref={warehouseMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsWarehouseMenuOpen(!isWarehouseMenuOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                    isDark
                      ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs"
                  }`}
                  title="Switch Active Facility Node"
                  aria-label="Switch Active Facility Node"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline max-w-[120px] truncate">{currentWarehouse.name}</span>
                  <span className="sm:hidden font-mono text-[10px]">{currentWarehouse.id.split("-").pop()}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {isWarehouseMenuOpen && (
                  <div
                    className={`absolute left-0 mt-2 w-56 rounded-xl border shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                      isDark
                        ? "bg-neutral-900 border-neutral-800 text-neutral-200"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Select Fulfillment Node
                    </div>
                    {warehouses.map((wh) => (
                      <button
                        key={wh.id}
                        type="button"
                        onClick={() => {
                          onSelectWarehouse(wh.id);
                          setIsWarehouseMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left ${
                          wh.id === currentWarehouse.id
                            ? isDark
                              ? "bg-neutral-800 text-white font-semibold"
                              : "bg-emerald-50 text-emerald-900 font-semibold"
                            : isDark
                            ? "hover:bg-neutral-800/60 text-neutral-300"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="truncate">
                          <div className="font-semibold truncate">{wh.name}</div>
                          <div className="text-[10px] text-slate-400">{wh.city} · {wh.region}</div>
                        </div>
                        {wh.id === currentWarehouse.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Quick Actions, Run Engine, Currency, Theme, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Command Palette Trigger */}
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isDark
                  ? "bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700/80 text-neutral-400 hover:text-white"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
              title="Search and run commands (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-xs">Search...</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                ⌘K
              </kbd>
            </button>

            {/* Run Simulation Engine CTA */}
            <button
              type="button"
              onClick={onRefreshData}
              disabled={isSimulating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isSimulating
                  ? "opacity-75 cursor-not-allowed bg-emerald-600 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white"
              }`}
              title="Execute Monte Carlo simulation and update buffers"
            >
              <Activity className={`w-3.5 h-3.5 shrink-0 ${isSimulating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isSimulating ? "Computing..." : "Run Engine"}</span>
            </button>

            {/* Currency Selector */}
            {onSelectCurrency && (
              <div className="relative" ref={currencyMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    isDark
                      ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs"
                  }`}
                  title="Select Base Currency"
                >
                  <span className="text-xs">{CURRENCIES[currentCurrency]?.flag}</span>
                  <span className="hidden sm:inline font-mono text-[11px]">{currentCurrency}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {isCurrencyMenuOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-44 rounded-xl border shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                      isDark
                        ? "bg-neutral-900 border-neutral-800 text-neutral-200"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Currency
                    </div>
                    {(Object.keys(CURRENCIES) as CurrencyCode[]).map((cCode) => {
                      const c = CURRENCIES[cCode];
                      return (
                        <button
                          key={cCode}
                          type="button"
                          onClick={() => {
                            onSelectCurrency(cCode);
                            setIsCurrencyMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            currentCurrency === cCode
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
                            <span>{c.name}</span>
                          </div>
                          {currentCurrency === cCode && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className={`p-1.5 sm:p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isDark
                  ? "bg-neutral-900 hover:bg-neutral-800 text-amber-400 border-neutral-700"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs"
              }`}
              title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile & Actions Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-1.5 sm:gap-2 pl-2 pr-1.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs"
                }`}
                title="Account & Persona"
                aria-label="Account & Persona"
              >
                <div className="w-6 h-6 rounded-md bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.avatar}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <div className="font-semibold truncate max-w-[90px]">
                    {currentUser.name.split(" ")[0]}
                  </div>
                  <div className={`text-[10px] ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                    {roleDef.title.split(" ")[0]}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
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
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {currentUser.name}
                    </div>
                    <div className={`text-[11px] truncate ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                      {currentUser.email}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {roleDef.title}
                      </span>
                    </div>
                  </div>

                  {/* Quick System Actions */}
                  <div className="py-1 border-b border-slate-100 dark:border-neutral-800 space-y-0.5">
                    <button
                      type="button"
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
                      type="button"
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
                      type="button"
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
                            type="button"
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
                            {isCurrent && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sign Out Action */}
                  {onSignOut && (
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onSignOut();
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                          isDark
                            ? "hover:bg-rose-950/40 text-rose-400 hover:text-rose-300"
                            : "hover:bg-rose-50 text-rose-700 hover:text-rose-800"
                        }`}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of Workspace</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
