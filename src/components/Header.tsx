import React, { useState, useRef, useEffect } from "react";
import { Warehouse, CurrencyCode } from "../types";
import { UserProfile, TenantOrganization, UserRole } from "../types/auth";
import { USER_ROLES, TENANT_ORGANIZATIONS, DEMO_USERS } from "../services/authService";
import { CURRENCIES } from "../utils/currency";
import {
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  Search,
  FileSpreadsheet,
  UploadCloud,
  ChevronDown,
  Lock,
  Building,
  Check,
  RotateCcw,
  Sparkles,
  Coins,
} from "lucide-react";

interface HeaderProps {
  currentWarehouse: Warehouse;
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
  currentCurrency = "INR",
  onSelectCurrency,
}) => {
  const isDark = theme === "dark";
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(e.target as Node)) {
        setIsCurrencyMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleDef = USER_ROLES[currentUser.role];

  return (
    <header
      className={`border-b px-4 sm:px-6 py-3 sticky top-0 z-30 transition-colors duration-200 ${
        isDark
          ? "border-slate-800/80 bg-slate-950/85 backdrop-blur-md text-slate-100"
          : "border-slate-200 bg-white/85 backdrop-blur-md text-slate-900 shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-xl shrink-0">
            📦
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h1
                className={`text-base sm:text-lg font-bold tracking-tight ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Multi-Source Supply Chain &amp; Stock-Out Forecaster
              </h1>
              {customDatasetName ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 mr-1" /> Custom Dataset Loaded
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Quick-Commerce Live
                </span>
              )}
            </div>
            <p
              className={`text-xs mt-0.5 flex items-center gap-2 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              <span className="font-medium text-indigo-400">{currentTenant.name}</span>
              <span>•</span>
              <span>Bivariate Monte Carlo Engine</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Multi-Tenant Persona Dropdown */}
        <div className="flex items-center space-x-2 self-end md:self-auto flex-wrap">
          {/* Custom Dataset Reset Pill (if active) */}
          {customDatasetName && onResetCustomDataset && (
            <button
              onClick={onResetCustomDataset}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold text-amber-400 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer transition-colors"
              title="Reset to Baseline Sandbox Dataset"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset Sandbox</span>
            </button>
          )}

          {/* Upload WMS CSV Ingestion Trigger */}
          <button
            onClick={onOpenWmsIngestion}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer transition-colors shadow-sm"
            title="Upload Client WMS / ERP CSV Data"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload WMS Data</span>
          </button>

          {/* Audit Ledger Trigger */}
          <button
            onClick={onOpenAuditLedger}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20 cursor-pointer transition-colors shadow-sm"
            title="Open Cryptographic Audit Trail & Compliance Ledger"
          >
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Audit Ledger</span>
          </button>

          {/* Command Palette Button */}
          <button
            onClick={onOpenCommandPalette}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isDark
                ? "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
            }`}
            title="Open Executive Command Palette (Cmd + K / Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <kbd className="hidden sm:inline px-1 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700/60">
              ⌘K
            </kbd>
          </button>

          {/* Export Audit Report Button */}
          <button
            onClick={onOpenExportReport}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isDark
                ? "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
            }`}
            title="Export Supply Chain Audit Report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden lg:inline">Report</span>
          </button>

          {/* Multi-Currency Regional Switcher Dropdown */}
          <div className="relative" ref={currencyMenuRef}>
            <button
              onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isDark
                  ? "bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-200"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
              }`}
              title="Change Display Currency (USD, EUR, GBP, INR)"
            >
              <span className="text-sm">{CURRENCIES[currentCurrency].flag}</span>
              <span className="font-mono font-bold text-indigo-400">
                {CURRENCIES[currentCurrency].symbol} {currentCurrency}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCurrencyMenuOpen && (
              <div
                className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                  isDark
                    ? "bg-slate-900 border-slate-700/80 text-slate-100"
                    : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                <div className="px-2 py-1.5 border-b border-slate-800/80 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Coins className="w-3 h-3 text-indigo-400" />
                  <span>Select Active Currency</span>
                </div>
                <div className="space-y-1 mt-1.5">
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
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                            : isDark
                            ? "hover:bg-slate-800 text-slate-300"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.flag}</span>
                          <div className="text-left">
                            <div className="font-bold">
                              {c.name} ({c.code})
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              1 {c.code} = {cCode === "INR" ? "₹1.00" : `₹${(1 / c.rateFromInr).toFixed(2)}`}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Multi-Tenant RBAC User Role Switcher Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isDark
                  ? "bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-200"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
              }`}
              title="Switch Authenticated Persona & Tenant"
            >
              <span className="text-sm">{currentUser.avatar}</span>
              <div className="flex flex-col text-left hidden sm:flex">
                <span className="text-[11px] font-bold leading-tight truncate max-w-[100px]">
                  {currentUser.name.split(" ")[0]}
                </span>
                <span className={`text-[9px] uppercase tracking-wider font-mono font-bold ${roleDef.badgeColor.split(" ")[1]}`}>
                  {roleDef.badgeLabel}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                  isDark
                    ? "bg-slate-900 border-slate-700/80 text-slate-100"
                    : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                {/* Active User Header */}
                <div className="pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      {currentUser.avatar}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">{currentUser.name}</h4>
                      <p className="text-[10px] text-slate-400">{currentUser.email}</p>
                      <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase font-mono ${roleDef.badgeColor}`}>
                        {roleDef.title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tenant Selector */}
                <div className="py-2.5 border-b border-slate-800/80">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                    <Building className="w-3 h-3 text-indigo-400" /> Organization Tenant:
                  </span>
                  <div className="space-y-1">
                    {TENANT_ORGANIZATIONS.map((tenant) => (
                      <button
                        key={tenant.id}
                        onClick={() => {
                          onSelectTenant(tenant);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          currentTenant.id === tenant.id
                            ? "bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30"
                            : isDark
                            ? "hover:bg-slate-800 text-slate-300"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <span className="truncate">{tenant.name}</span>
                        {currentTenant.id === tenant.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role Switcher */}
                <div className="pt-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Switch Persona (RBAC Simulation):
                  </span>
                  <div className="space-y-1">
                    {(Object.keys(USER_ROLES) as UserRole[]).map((r) => {
                      const def = USER_ROLES[r];
                      const demoUser = DEMO_USERS[r];
                      const isActive = currentUser.role === r;

                      return (
                        <button
                          key={r}
                          onClick={() => {
                            onSelectRole(r);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                            isActive
                              ? "bg-indigo-600/15 border-indigo-500/40 text-slate-100 font-bold"
                              : isDark
                              ? "border-transparent hover:bg-slate-800/80 text-slate-300"
                              : "border-transparent hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{demoUser.avatar}</span>
                              <span className="text-xs">{def.title}</span>
                            </div>
                            {isActive && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 font-normal">
                            {def.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle visual theme"
            className={`p-2 rounded-lg transition-all cursor-pointer border flex items-center justify-center ${
              isDark
                ? "bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700/80"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
            }`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Re-simulate Button */}
          <button
            onClick={onRefreshData}
            disabled={isSimulating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="Re-run stochastic simulation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isSimulating ? "Simulating..." : "Re-Simulate"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

