import React, { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Truck,
  SlidersHorizontal,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Globe2,
  FileSpreadsheet,
  UploadCloud,
  Lock,
  Search,
  X,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  Building2,
  User,
  Sliders,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { AppPage } from "../types";
import { UserProfile, TenantOrganization, UserRole } from "../types/auth";
import { USER_ROLES } from "../services/authService";

interface DashboardSidebarProps {
  activePage: AppPage;
  onSelectPage: (page: AppPage) => void;
  criticalCount?: number;
  poCount?: number;
  transferCount?: number;
  currentUser: UserProfile;
  currentTenant: TenantOrganization;
  onSelectRole: (role: UserRole) => void;
  onGoToLanding: () => void;
  onSignOut: () => void;
  onOpenCommandPalette: () => void;
  onOpenWmsIngestion: () => void;
  onOpenAuditLedger: () => void;
  onOpenExportReport: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  theme: "dark" | "light";
  onOpenCopilot?: () => void;
  onOpenHelpGuide?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activePage,
  onSelectPage,
  criticalCount = 0,
  poCount = 0,
  transferCount = 0,
  currentUser,
  currentTenant,
  onGoToLanding,
  onSignOut,
  onOpenCommandPalette,
  onOpenWmsIngestion,
  onOpenAuditLedger,
  onOpenExportReport,
  isMobileOpen,
  onCloseMobile,
  theme,
  onOpenCopilot,
  onOpenHelpGuide,
}) => {
  const isDark = theme === "dark";
  const [isCollapsed, setIsCollapsed] = useState(false);

  const roleDef = USER_ROLES[currentUser.role];

  // Primary Navigation Items in Required Order:
  // 1. Overview, 2. Inventory, 3. Procurement, 4. Operations
  const primaryNavItems: {
    id: AppPage;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: { text: string; color: string } | null;
  }[] = [
    {
      id: "overview",
      label: "Overview",
      sublabel: "Control Tower & Network",
      icon: LayoutDashboard,
      badge:
        criticalCount > 0
          ? { text: `${criticalCount} alert`, color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20" }
          : null,
    },
    {
      id: "inventory",
      label: "Inventory",
      sublabel: "ML Forecast & Safety Stock",
      icon: TrendingUp,
      badge:
        criticalCount > 0
          ? { text: `${criticalCount} critical`, color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20" }
          : null,
    },
    {
      id: "procurement",
      label: "Procurement",
      sublabel: "PO Batches & Transfers",
      icon: Truck,
      badge:
        poCount > 0
          ? { text: `${poCount} POs`, color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" }
          : null,
    },
    {
      id: "operations",
      label: "Operations",
      sublabel: "Simulation Lab & Data Hub",
      icon: SlidersHorizontal,
      badge: null,
    },
  ];

  const sidebarContent = (isDrawer = false) => {
    const collapsed = isDrawer ? false : isCollapsed;

    return (
      <div className="flex flex-col h-full justify-between select-none">
        {/* TOP SECTION: Brand & Navigation */}
        <div className="space-y-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => {
                onSelectPage("overview");
                if (isDrawer) onCloseMobile();
              }}
              className="flex items-center gap-3 cursor-pointer text-left focus:outline-none rounded-lg group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs transition-transform group-hover:scale-105 shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-extrabold text-base tracking-tight text-slate-950 dark:text-white truncate">
                      InventoryGuard<span className="text-emerald-600 dark:text-emerald-400">-AI</span>
                    </span>
                  </div>
                  <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                    Supply Chain Intelligence
                  </div>
                </div>
              )}
            </button>

            {/* Desktop Collapse / Expand Toggle */}
            {!isDrawer && (
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}

            {/* Mobile Drawer Close Button */}
            {isDrawer && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Active Tenant / Facility Context pill (when expanded) */}
          {!collapsed && (
            <div className="px-3">
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isDark
                    ? "bg-neutral-900/60 border-neutral-800 text-neutral-300"
                    : "bg-slate-50 border-slate-200/80 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate font-semibold text-[11px]">{currentTenant.name}</span>
                </div>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0">
                  {currentTenant.erpIntegration.split(" ")[0]}
                </span>
              </div>
            </div>
          )}

          {/* Main Navigation List */}
          <nav className="px-3 space-y-1" aria-label="Main navigation">
            {!collapsed && (
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                Core Engines
              </div>
            )}
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectPage(item.id);
                    if (isDrawer) onCloseMobile();
                  }}
                  title={collapsed ? `${item.label} (${item.sublabel})` : undefined}
                  className={`w-full flex items-center justify-between rounded-xl transition-all cursor-pointer text-left ${
                    collapsed ? "p-3 justify-center" : "px-3 py-2.5"
                  } ${
                    isActive
                      ? isDark
                        ? "bg-emerald-950/40 border border-emerald-500/30 text-white font-bold shadow-xs"
                        : "bg-emerald-50 border border-emerald-200 text-slate-950 font-bold shadow-xs"
                      : isDark
                      ? "text-neutral-300 hover:text-white hover:bg-neutral-800/60 border border-transparent"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? isDark
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-emerald-600 text-white shadow-xs"
                          : isDark
                          ? "bg-neutral-800 text-neutral-400"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {!collapsed && (
                      <div className="truncate">
                        <div className="text-xs font-bold leading-tight truncate">{item.label}</div>
                        <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-normal truncate mt-0.5">
                          {item.sublabel}
                        </div>
                      </div>
                    )}
                  </div>

                  {!collapsed && item.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full shrink-0 ${item.badge.color}`}>
                      {item.badge.text}
                    </span>
                  )}

                  {/* Dot indicator when collapsed */}
                  {collapsed && item.badge && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Enterprise Tools (Expanded View) */}
          {!collapsed && (
            <div className="px-3 pt-3 border-t border-slate-100 dark:border-neutral-800/80 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                Workspace Tools
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenCommandPalette();
                  if (isDrawer) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  isDark ? "hover:bg-neutral-800/60 text-neutral-300" : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium">Command Palette</span>
                </div>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-500 border border-slate-200 dark:border-neutral-700">
                  ⌘K
                </kbd>
              </button>

              {onOpenCopilot && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCopilot();
                    if (isDrawer) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isDark
                      ? "hover:bg-neutral-800/60 text-emerald-400"
                      : "hover:bg-emerald-50 text-emerald-800 font-semibold"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span className="font-semibold">Ask Copilot (AI)</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                    AI
                  </span>
                </button>
              )}

              {onOpenHelpGuide && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenHelpGuide();
                    if (isDrawer) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isDark ? "hover:bg-neutral-800/60 text-neutral-300" : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-teal-500" />
                    <span className="font-medium">Guide &amp; User Doubts</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold">
                    FAQ
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onOpenWmsIngestion();
                  if (isDrawer) onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                  isDark ? "hover:bg-neutral-800/60 text-neutral-300" : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <UploadCloud className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Ingest WMS CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenAuditLedger();
                  if (isDrawer) onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                  isDark ? "hover:bg-neutral-800/60 text-neutral-300" : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <Lock className="w-4 h-4 text-amber-500" />
                <span className="font-medium">Audit Trail Ledger</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenExportReport();
                  if (isDrawer) onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                  isDark ? "hover:bg-neutral-800/60 text-neutral-300" : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Executive Export</span>
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Active Profile, Return to Site, Sign Out */}
        <div className="p-3 border-t border-slate-200 dark:border-neutral-800 space-y-2">
          {/* Active Profile Info */}
          {!collapsed ? (
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-slate-50 border-slate-200/80"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                {currentUser.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium truncate">
                  {roleDef.title}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`${currentUser.name} (${roleDef.title})`}>
              <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-base cursor-default">
                {currentUser.avatar}
              </div>
            </div>
          )}

          {/* Action Links */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onGoToLanding();
                if (isDrawer) onCloseMobile();
              }}
              title="Return to Public Website"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                collapsed ? "justify-center" : ""
              } ${isDark ? "hover:bg-neutral-800 text-neutral-300" : "hover:bg-slate-100 text-slate-700"}`}
            >
              <Globe2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {!collapsed && <span>Public Website</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                onSignOut();
                if (isDrawer) onCloseMobile();
              }}
              title="Sign Out of Workspace"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                collapsed ? "justify-center" : ""
              } ${
                isDark
                  ? "hover:bg-rose-950/40 text-rose-400 hover:text-rose-300"
                  : "hover:bg-rose-50 text-rose-700 hover:text-rose-800"
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. PERSISTENT DESKTOP SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r transition-all duration-200 z-30 h-screen sticky top-0 ${
          isCollapsed ? "w-[68px]" : "w-64"
        } ${
          isDark
            ? "border-neutral-800 bg-[#09090B] text-neutral-100"
            : "border-slate-200 bg-white text-slate-900 shadow-xs"
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* 2. MOBILE & TABLET SLIDE-OVER DRAWER OVERLAY */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <div
            className={`relative flex-1 flex flex-col max-w-xs w-full h-full shadow-2xl z-10 transition-transform ${
              isDark ? "bg-[#09090B] border-r border-neutral-800 text-neutral-100" : "bg-white border-r border-slate-200 text-slate-900"
            }`}
          >
            {sidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
