import React, { useState, useMemo, useEffect } from "react";
import {
  WAREHOUSES,
  SKUS,
  generateSyntheticHistoricalData,
  executeSupplyChainEngine,
  generatePurchaseOrders,
  evaluateInterWarehouseTransfers,
  getInitialDispatchedLedger,
  calculateMarkdownLiquidation,
  calculateDemandCannibalization,
} from "./engine/supplyChainEngine";
import { Header, AppPage } from "./components/Header";
import { DashboardSidebar } from "./components/DashboardSidebar";
import { Footer } from "./components/Footer";
import { SidebarControls } from "./components/SidebarControls";
import { SimulationLabWorkspace } from "./components/SimulationLabWorkspace";
import { DataHubWorkspace } from "./components/DataHubWorkspace";
import { KpiMetrics } from "./components/KpiMetrics";
import { VisualAnalytics } from "./components/VisualAnalytics";
import { RiskTable } from "./components/RiskTable";
import { InventoryWorkspace } from "./components/InventoryWorkspace";
import { ProcurementWorkspace } from "./components/ProcurementWorkspace";
import { OperationsWorkspace } from "./components/OperationsWorkspace";
import { DynamicMarkdownCard } from "./components/DynamicMarkdownCard";
import { SubstitutionCard } from "./components/SubstitutionCard";
import { PoGenerator } from "./components/PoGenerator";
import { InterTransferView } from "./components/InterTransferView";
import { SupplierScorecardView } from "./components/SupplierScorecardView";
import { SourceCodeViewer } from "./components/SourceCodeViewer";
import { NetworkTopologyMap } from "./components/NetworkTopologyMap";
import { OperationalAlerts } from "./components/OperationalAlerts";
import { FacilityPerformanceMatrix } from "./components/FacilityPerformanceMatrix";
import { InventoryToolbar } from "./components/InventoryToolbar";
import { ToastContainer, ToastItem } from "./components/ToastContainer";
import { CommandPaletteModal } from "./components/CommandPaletteModal";
import { ExecutiveReportModal } from "./components/ExecutiveReportModal";
import { WmsDataIngestionModal } from "./components/WmsDataIngestionModal";
import { AuditLedgerModal } from "./components/AuditLedgerModal";
import { LandingPage } from "./components/LandingPage";
import { GeminiCopilot } from "./components/GeminiCopilot";
import { HelpAndDoubtsModal } from "./components/HelpAndDoubtsModal";
import { SignInPage } from "./components/auth/SignInPage";
import { SignUpPage } from "./components/auth/SignUpPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { StorageService, CustomDatasetPayload } from "./services/storageService";
import { UserProfile, TenantOrganization, UserRole, AuditLogEntry, AuthSession } from "./types/auth";
import { USER_ROLES, DEMO_USERS, TENANT_ORGANIZATIONS, AuthService } from "./services/authService";
import { generateSupplyChainAuditCsv, triggerCsvDownload } from "./utils/exportCsv";
import {
  DispatchedPoRecord,
  ReorderPolicy,
  SkuMetadata,
  DailyRecord,
  Warehouse,
  ForecastModel,
  CurrencyCode,
} from "./types";
import { getStoredCurrency, setStoredCurrency, formatCurrency } from "./utils/currency";
import {
  TrendingUp,
  Table,
  FileCheck2,
  Code2,
  ArrowRightLeft,
  Award,
  ShieldCheck,
  Navigation,
  Building2,
  AlertTriangle,
  Lock,
  UploadCloud,
  Activity,
  CheckCircle2,
  Sparkles,
  Sliders,
  Database,
  BookOpen,
  HelpCircle,
  X,
} from "lucide-react";

const SERVICE_LEVELS = [
  { label: "90.0% - Budget", z: 1.282, desc: "Low-cost non-critical buffer" },
  { label: "95.0% - Standard", z: 1.645, desc: "Industry benchmark standard" },
  { label: "98.0% - Premium", z: 2.054, desc: "High customer retention" },
  { label: "99.0% - Mission Critical", z: 2.326, desc: "Zero cart-drop tolerance" },
  { label: "99.5% - Flawless", z: 2.576, desc: "Max inventory protection" },
];

const REQUIREMENTS_TXT = `streamlit>=1.35.0
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
plotly>=5.18.0
scipy>=1.11.0
requests>=2.31.0
`;

const README_MD = `# 📦 Multi-Source Supply Chain & Inventory Stock-Out Forecaster
### *Production-Grade Predictive Inventory Optimization, Monte Carlo Risk, Perishable Decay & Supplier Scorecards*

## 🚀 Problem Statement & Architecture
Quick-commerce platforms (Zepto, Blinkit, Instamart) face severe revenue leakage due to inventory stock-outs.
Static heuristics fail because they ignore demand variance, perishable shelf-life decay, and supplier delivery delays.

This platform bridges:
1. **LightGBM / Scikit-Learn GradientBoostingRegressor** for multi-step daily demand forecasting.
2. **Dual-Variance Dynamic Safety Stock**:
   $$SS = Z \\times \\sqrt{\\bar{L} \\cdot \\sigma_d^2 + \\bar{D}^2 \\cdot \\sigma_L^2}$$
3. **Perishable Batch Decay & Expiry Engine**:
   - Models batch age & shelf-life degradation ($\delta_{\\text{decay}}$) for perishables (Organic Milk, Yogurt, Hass Avocados).
   - Reorder points and Monte Carlo stock-out risks are evaluated against **Usable Stock** rather than nominal expired inventory.
4. **Supplier Reliability Matrix**:
   - Grades vendors (Grade A to F) based on lead-time variance ($\sigma_L$).
   - Automatically expands buffer multipliers ($1.0\\times$ to $1.8\\times$) based on supplier reliability risk.
5. **Multi-Echelon Dark Store Inter-Transfer Engine**:
   - Fulfills critical stock-outs within 3–6 hours using neighboring dark store surplus ($\text{Stock} > \text{ROP} + 14d$).
6. **Interactive ERP Webhook & Dispatched Ledger**:
   - Dispatches orders via mock ERP webhooks with SHA-256 signatures, raw JSON, and ANSI X12 EDI 850 payloads.

## ⚡ Quickstart
\`\`\`bash
pip install -r requirements.txt
streamlit run app.py
\`\`\`
`;

export default function App() {
  // Theme State: 'light' (Crisp Clean Light Mode by Default) or 'dark' (Pitch-Black Obsidian Dark Mode)
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("inventoryguard_theme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });

  // Multi-Tenant Authentication & Session State - seeded with demo user by default so new users enter the app directly
  const [session, setSession] = useState<AuthSession | null>(() => {
    const existing = StorageService.getAuthSession();
    if (existing && existing.isAuthenticated && existing.user) return existing;
    const initialSession: AuthSession = {
      user: DEMO_USERS.INVENTORY_MANAGER,
      tenant: TENANT_ORGANIZATIONS[0],
      token: "demo-jwt-token-active",
      loginTime: new Date().toISOString(),
      isAuthenticated: true,
      rememberMe: true,
    };
    StorageService.saveAuthSession(initialSession);
    return initialSession;
  });
  const isAuthenticated = !!(session && session.isAuthenticated);

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const s = StorageService.getAuthSession();
    if (s && s.user) return s.user;
    return StorageService.getCurrentUser();
  });

  const [currentTenant, setCurrentTenant] = useState<TenantOrganization>(() => {
    const s = StorageService.getAuthSession();
    if (s && s.tenant) return s.tenant;
    return StorageService.getCurrentTenant();
  });

  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);

  const [customDataset, setCustomDataset] = useState<CustomDatasetPayload | null>(() =>
    StorageService.getCustomDataset()
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    StorageService.getAuditLogs()
  );

  // Dynamic Datasets (Default Sandbox vs Client Uploaded WMS)
  const effectiveWarehouses = useMemo(() => {
    return customDataset ? customDataset.warehouses : WAREHOUSES;
  }, [customDataset]);

  const effectiveSkus = useMemo(() => {
    return customDataset ? customDataset.skus : SKUS;
  }, [customDataset]);

  // Core Simulation Parameters
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(() => {
    const ds = StorageService.getCustomDataset();
    return ds ? ds.warehouses[0].id : "WH-BOM-01";
  });
  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>(() => {
    const ds = StorageService.getCustomDataset();
    return ds ? ds.skus.map((s) => s.id) : SKUS.map((s) => s.id);
  });
  const [activeSkuId, setActiveSkuId] = useState<string>(() => {
    const ds = StorageService.getCustomDataset();
    return ds ? ds.skus[0].id : "SKU-001";
  });
  const [selectedServiceZ, setSelectedServiceZ] = useState<number>(2.326); // 99% Mission critical
  const [forecastHorizon, setForecastHorizon] = useState<number>(21);
  const [monteCarloRuns, setMonteCarloRuns] = useState<number>(1000);
  const [promoSurgePct, setPromoSurgePct] = useState<number>(0);
  const [weatherSurgePct, setWeatherSurgePct] = useState<number>(0);
  const [supplierDelayDays, setSupplierDelayDays] = useState<number>(0);
  const [reorderPolicy, setReorderPolicy] = useState<ReorderPolicy>("DYNAMIC_AI");
  const [forecastModel, setForecastModel] = useState<ForecastModel>("META_PROPHET");
  const [currency, setCurrency] = useState<CurrencyCode>(() => getStoredCurrency());

  // View mode: 'landing' | 'login' | 'signup' | 'forgot-password' | 'app'
  // When visiting root '/' or '#landing', the real Landing Page is displayed.
  // When visiting '#app' or clicking 'Launch Control Tower', the live app Control Tower is displayed.
  const [viewMode, setViewMode] = useState<"landing" | "login" | "signup" | "forgot-password" | "app">(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      const activeSession = StorageService.getAuthSession();

      if (hash === "#app" || hash.startsWith("#app/") || pathname === "/app" || pathname.startsWith("/app/")) {
        return "app";
      }
      if (hash === "#login" || pathname === "/login") {
        return activeSession?.isAuthenticated ? "app" : "login";
      }
      if (hash === "#signup" || pathname === "/signup") {
        return activeSession?.isAuthenticated ? "app" : "signup";
      }
      if (hash === "#forgot-password" || pathname === "/forgot-password") {
        return "forgot-password";
      }
      return "landing";
    }
    return "landing";
  });

  // 4 Dedicated Core Pages & Tab State
  const [activePage, setActivePage] = useState<AppPage>("overview");
  const [procurementTab, setProcurementTab] = useState<"po" | "transfer" | "suppliers">("po");
  const [operationsTab, setOperationsTab] = useState<
    "simulation" | "datahub" | "controls" | "ingestion" | "audit" | "code"
  >("simulation");
  const [activeTab, setActiveTab] = useState<
    "analytics" | "table" | "network" | "transfer" | "suppliers" | "po" | "code"
  >("network");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [pythonCode, setPythonCode] = useState<string>("");
  const [dispatchedLedger, setDispatchedLedger] = useState<DispatchedPoRecord[]>(() =>
    StorageService.getDispatchedLedger(getInitialDispatchedLedger())
  );
  const [approvedTransferIds, setApprovedTransferIds] = useState<string[]>(() =>
    StorageService.getApprovedTransferIds()
  );

  // Modals & Feedback State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isWmsModalOpen, setIsWmsModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isWelcomeBannerDismissed, setIsWelcomeBannerDismissed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("inventoryguard_welcome_banner_dismissed") === "true";
    }
    return false;
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Synchronize state with persistent storage
  useEffect(() => {
    StorageService.saveDispatchedLedger(dispatchedLedger);
  }, [dispatchedLedger]);

  useEffect(() => {
    StorageService.saveApprovedTransferIds(approvedTransferIds);
  }, [approvedTransferIds]);

  useEffect(() => {
    StorageService.setCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    StorageService.setCurrentTenant(currentTenant);
  }, [currentTenant]);

  useEffect(() => {
    setStoredCurrency(currency);
  }, [currency]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
    try {
      localStorage.setItem("inventoryguard_theme", theme);
    } catch {
      // ignore storage error
    }
  }, [theme]);

  const addToast = (
    toast: Omit<ToastItem, "id" | "timestamp"> & { id?: string; timestamp?: string }
  ) => {
    const newToast: ToastItem = {
      id: toast.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp:
        toast.timestamp ||
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      ...toast,
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcut listener for Cmd + K / Ctrl + K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsCommandPaletteOpen(false);
        setIsWmsModalOpen(false);
        setIsAuditModalOpen(false);
        setIsReportModalOpen(false);
        setIsMobileSidebarOpen(false);
        setIsCopilotOpen(false);
        setIsHelpModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Synchronize viewMode with browser hash navigation and protect internal routes
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      const activeSession = StorageService.getAuthSession();

      if (hash === "#landing" || pathname === "/landing") {
        setViewMode("landing");
        return;
      }

      if (hash === "#login" || pathname === "/login") {
        if (activeSession?.isAuthenticated) {
          setViewMode("app");
          window.location.hash = `app/${activePage}`;
        } else {
          setViewMode("login");
        }
        return;
      }

      if (hash === "#signup" || pathname === "/signup") {
        if (activeSession?.isAuthenticated) {
          setViewMode("app");
          window.location.hash = `app/${activePage}`;
        } else {
          setViewMode("signup");
        }
        return;
      }

      if (hash === "#forgot-password" || pathname === "/forgot-password") {
        setViewMode("forgot-password");
        return;
      }

      if (hash === "#app" || hash.startsWith("#app/") || pathname === "/app" || pathname.startsWith("/app/")) {
        setViewMode("app");
        if (hash === "#app/inventory" || pathname === "/app/inventory") setActivePage("inventory");
        else if (hash === "#app/procurement" || pathname === "/app/procurement") setActivePage("procurement");
        else if (hash === "#app/operations" || pathname === "/app/operations") setActivePage("operations");
        else setActivePage("overview");
        return;
      }

      // Default route for root '/' or '#landing' or empty hash: Real Landing Page
      setViewMode("landing");
    };

    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [activePage]);

  const handleSelectPage = (
    targetPage: AppPage,
    targetTab?: string,
    skuId?: string
  ) => {
    setActivePage(targetPage);
    window.location.hash = `app/${targetPage}`;
    if (skuId) {
      setActiveSkuId(skuId);
    }
    if (targetTab) {
      if (
        targetPage === "procurement" &&
        (targetTab === "po" ||
          targetTab === "transfer" ||
          targetTab === "suppliers" ||
          targetTab === "DECISIONS" ||
          targetTab === "ORDERS" ||
          targetTab === "TRANSFERS" ||
          targetTab === "SUPPLIERS")
      ) {
        setProcurementTab(targetTab as any);
      } else if (
        targetPage === "operations" &&
        (targetTab === "simulation" ||
          targetTab === "datahub" ||
          targetTab === "code" ||
          targetTab === "COMMAND_CENTER" ||
          targetTab === "EXCEPTIONS" ||
          targetTab === "WAREHOUSES" ||
          targetTab === "DATA_HUB" ||
          targetTab === "INTELLIGENCE_ENGINE" ||
          targetTab === "ACTIVITY_LOG")
      ) {
        setOperationsTab(targetTab as any);
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEnterApp = (targetPage: AppPage = "overview", targetTab?: string) => {
    handleSelectPage(targetPage, targetTab);
    setViewMode("app");
  };

  const handleGoToLanding = () => {
    setViewMode("landing");
    window.location.hash = "landing";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateToSignIn = () => {
    const activeSession = StorageService.getAuthSession();
    if (activeSession?.isAuthenticated) {
      setViewMode("app");
      window.location.hash = `app/${activePage}`;
    } else {
      setViewMode("login");
      window.location.hash = "login";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNavigateToSignUp = () => {
    const activeSession = StorageService.getAuthSession();
    if (activeSession?.isAuthenticated) {
      setViewMode("app");
      window.location.hash = `app/${activePage}`;
    } else {
      setViewMode("signup");
      window.location.hash = "signup";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNavigateToForgotPassword = () => {
    setViewMode("forgot-password");
    window.location.hash = "forgot-password";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoginSuccess = (role?: UserRole) => {
    const activeSession = StorageService.getAuthSession();
    if (activeSession) {
      setSession(activeSession);
      setCurrentUser(activeSession.user);
      setCurrentTenant(activeSession.tenant);
    }

    const destination = pendingRedirectUrl || "app/overview";
    setPendingRedirectUrl(null);

    // Apply destination page
    if (destination.includes("inventory")) setActivePage("inventory");
    else if (destination.includes("procurement")) setActivePage("procurement");
    else if (destination.includes("operations")) setActivePage("operations");
    else setActivePage("overview");

    setViewMode("app");
    window.location.hash = destination.startsWith("#") ? destination : `#${destination}`;
    window.scrollTo({ top: 0, behavior: "smooth" });

    addToast({
      type: "success",
      title: "Workspace Session Authenticated",
      message: `Welcome, ${activeSession?.user.name || "Authorized User"}! (${USER_ROLES[activeSession?.user.role || role || "INVENTORY_MANAGER"].title})`,
      meta: {
        code: USER_ROLES[activeSession?.user.role || role || "INVENTORY_MANAGER"].badgeLabel,
      },
    });
  };

  const handleSignOut = () => {
    AuthService.logout();
    setSession(null);
    setViewMode("landing");
    window.location.hash = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
    addToast({
      type: "info",
      title: "Signed Out Gracefully",
      message: "Your workstation session has been closed.",
    });
  };

  // Fetch /app.py content for code viewer
  useEffect(() => {
    fetch("/app.py")
      .then((res) => {
        if (res.ok) return res.text();
        return "// Streamlit app.py available in repository root.";
      })
      .then((text) => setPythonCode(text))
      .catch(() => {
        setPythonCode("# Streamlit app.py located in repository root.");
      });
  }, []);

  // In-Memory or Uploaded Historical Records
  const allHistoricalRecords = useMemo(() => {
    if (customDataset && customDataset.records.length > 0) {
      return customDataset.records;
    }
    return generateSyntheticHistoricalData();
  }, [customDataset]);

  // Execute Supply Chain Engine with Perishable Decay, Supplier Reliability Matrix & Weather Surge
  const simulationStates = useMemo(() => {
    return executeSupplyChainEngine(
      allHistoricalRecords,
      selectedWarehouseId,
      selectedSkuIds,
      selectedServiceZ,
      forecastHorizon,
      monteCarloRuns,
      promoSurgePct,
      supplierDelayDays,
      weatherSurgePct,
      reorderPolicy,
      forecastModel
    );
  }, [
    allHistoricalRecords,
    selectedWarehouseId,
    selectedSkuIds,
    selectedServiceZ,
    forecastHorizon,
    monteCarloRuns,
    promoSurgePct,
    supplierDelayDays,
    weatherSurgePct,
    reorderPolicy,
    forecastModel,
  ]);

  // Current Warehouse Metadata
  const currentWarehouse = useMemo(() => {
    return (
      effectiveWarehouses.find((w) => w.id === selectedWarehouseId) ||
      effectiveWarehouses[0]
    );
  }, [effectiveWarehouses, selectedWarehouseId]);

  // Current Service Level Object
  const currentServiceLevel = useMemo(() => {
    return SERVICE_LEVELS.find((l) => l.z === selectedServiceZ) || SERVICE_LEVELS[3];
  }, [selectedServiceZ]);

  // Purchase Orders
  const purchaseOrders = useMemo(() => {
    return generatePurchaseOrders(simulationStates, currentWarehouse);
  }, [simulationStates, currentWarehouse]);

  // Multi-Echelon Dark Store Inter-Transfers
  const interTransfers = useMemo(() => {
    return evaluateInterWarehouseTransfers(
      allHistoricalRecords,
      selectedWarehouseId,
      simulationStates
    ).map((t) => ({
      ...t,
      status: approvedTransferIds.includes(t.id) ? "APPROVED" : t.status,
    }));
  }, [allHistoricalRecords, selectedWarehouseId, simulationStates, approvedTransferIds]);

  // Quick-Commerce Dynamic Markdown & Spoilage Liquidation Items
  const markdownItems = useMemo(() => {
    return calculateMarkdownLiquidation(simulationStates);
  }, [simulationStates]);

  // Product Substitution & Stockout Cannibalization Absorption
  const substitutions = useMemo(() => {
    return calculateDemandCannibalization(simulationStates);
  }, [simulationStates]);

  const criticalSkus = useMemo(() => {
    return simulationStates.filter((s) => s.mcResult.urgency === "CRITICAL REORDER NOW");
  }, [simulationStates]);

  const checkPermission = (actionDesc: string, allowedRoles: UserRole[]): boolean => {
    if (!allowedRoles.includes(currentUser.role)) {
      addToast({
        type: "warning",
        title: "Action Restricted (RBAC)",
        message: `Active persona "${USER_ROLES[currentUser.role].title}" lacks permission to ${actionDesc}. Switch persona in the header dropdown to test this role.`,
        meta: {
          code: `RBAC_${currentUser.role}`,
        },
      });
      return false;
    }
    return true;
  };

  const handleSelectRole = (newRole: UserRole) => {
    const demoUser = DEMO_USERS[newRole];
    const updatedUser: UserProfile = {
      ...demoUser,
      tenantId: currentTenant.id,
      tenantName: currentTenant.name,
    };
    setCurrentUser(updatedUser);
    StorageService.setCurrentUser(updatedUser);

    if (session) {
      const updatedSession: AuthSession = {
        ...session,
        user: updatedUser,
      };
      setSession(updatedSession);
      StorageService.saveAuthSession(updatedSession);
    }

    addToast({
      type: "info",
      title: "Active Persona Switched",
      message: `Signed in as ${updatedUser.name} (${USER_ROLES[newRole].title}) for ${currentTenant.name}.`,
      meta: {
        code: USER_ROLES[newRole].badgeLabel,
      },
    });
  };

  const handleSelectTenant = (tenant: TenantOrganization) => {
    setCurrentTenant(tenant);
    StorageService.setCurrentTenant(tenant);
    setCurrentUser((prev) => ({
      ...prev,
      tenantId: tenant.id,
      tenantName: tenant.name,
    }));

    addToast({
      type: "info",
      title: "Tenant Switched",
      message: `Now viewing operations for ${tenant.name} (${tenant.erpIntegration} Gateway).`,
      meta: {
        code: tenant.tier,
      },
    });
  };

  const handleDatasetIngested = (payload: {
    datasetName: string;
    warehouses: Warehouse[];
    skus: SkuMetadata[];
    records: DailyRecord[];
  }) => {
    const dataset: CustomDatasetPayload = {
      name: payload.datasetName,
      uploadedAt: new Date().toISOString(),
      source: "WMS_CSV_UPLOAD",
      warehouses: payload.warehouses,
      skus: payload.skus,
      records: payload.records,
    };

    StorageService.saveCustomDataset(dataset);
    setCustomDataset(dataset);

    if (payload.warehouses.length > 0) {
      setSelectedWarehouseId(payload.warehouses[0].id);
    }
    setSelectedSkuIds(payload.skus.map((s) => s.id));
    if (payload.skus.length > 0) {
      setActiveSkuId(payload.skus[0].id);
    }

    handleTriggerSimulation();

    // Log to audit ledger
    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "WMS_DATA_INGESTED",
      targetEntity: payload.datasetName,
      details: `Ingested ${payload.skus.length} SKUs across ${payload.warehouses.length} facility nodes with ${payload.records.length} historical records. Recomputed stochastic safety stocks in 0.4s.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "success",
      title: "Real WMS Dataset Active",
      message: `Ingested "${payload.datasetName}" (${payload.skus.length} SKUs, ${payload.records.length} demand records). Calculated in <0.5s!`,
      meta: {
        code: "WMS_INGEST_OK",
        hash: log.cryptoHash.slice(0, 18),
      },
    });
  };

  const handleResetCustomDataset = () => {
    StorageService.saveCustomDataset(null);
    setCustomDataset(null);
    setSelectedWarehouseId(WAREHOUSES[0].id);
    setSelectedSkuIds(SKUS.map((s) => s.id));
    setActiveSkuId(SKUS[0].id);
    handleTriggerSimulation();

    addToast({
      type: "info",
      title: "Sandbox Baseline Restored",
      message: "Reset to default quick-commerce dark store dataset (5 SKUs, 3 Warehouses).",
    });
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleTriggerSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      addToast({
        type: "success",
        title: "Simulation Recomputed",
        message: `Monte Carlo joint distribution simulated with ${monteCarloRuns.toLocaleString()} runs @ ${currentServiceLevel.label.split(" - ")[0]} CSL.`,
        meta: {
          code: `CSL-${currentServiceLevel.z}`,
          latency: "320ms",
        },
      });
    }, 450);
  };

  const handleSelectWarehouse = (whId: string) => {
    setSelectedWarehouseId(whId);
    handleTriggerSimulation();
    const wh = effectiveWarehouses.find((w) => w.id === whId);
    if (wh) {
      addToast({
        type: "info",
        title: "Command Node Switched",
        message: `Live telemetry shifted to ${wh.name} (${wh.city}).`,
      });
    }
  };

  const handleToggleSku = (id: string) => {
    if (selectedSkuIds.includes(id)) {
      if (selectedSkuIds.length > 1) {
        setSelectedSkuIds(selectedSkuIds.filter((x) => x !== id));
      }
    } else {
      setSelectedSkuIds([...selectedSkuIds, id]);
    }
  };

  const handleSelectAllSkus = () => {
    setSelectedSkuIds(effectiveSkus.map((s) => s.id));
  };

  const handleSelectSkuDeepDive = (id: string) => {
    setActiveSkuId(id);
    setActivePage("inventory");
    setActiveTab("analytics");
  };

  const handleApproveTransfer = (id: string) => {
    if (!checkPermission("approve inter-store warehouse transfers", ["WAREHOUSE_SUPERVISOR", "INVENTORY_MANAGER"])) {
      return;
    }

    setApprovedTransferIds((prev) => [...prev, id]);
    const xfer = interTransfers.find((t) => t.id === id);
    if (xfer) {
      const log = StorageService.appendAuditLog({
        tenantId: currentTenant.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionType: "INTER_TRANSFER_APPROVAL",
        targetEntity: `${xfer.skuName} (${xfer.originWarehouseId} ➔ ${xfer.destWarehouseId})`,
        details: `Approved inter-store balancing transfer of ${xfer.recommendedTransferQty} units via Green EV route. Saved ${xfer.leadTimeSavedHours}h lead-time.`,
      });
      setAuditLogs(StorageService.getAuditLogs());

      addToast({
        type: "transfer",
        title: "Inter-Store Transfer Dispatched",
        message: `${xfer.recommendedTransferQty} Units ${xfer.skuName} in transit: ${xfer.originWarehouseId} ➔ ${xfer.destWarehouseId}`,
        meta: {
          code: xfer.id,
          latency: `~${xfer.transitHours}h van ETA`,
          units: xfer.recommendedTransferQty,
          hash: log.cryptoHash.slice(0, 18),
        },
      });
    }
  };

  const handleDispatchPo = (record: DispatchedPoRecord) => {
    if (!checkPermission("authorize and dispatch purchase orders", ["PROCUREMENT_SPECIALIST"])) {
      return;
    }

    setDispatchedLedger((prev) => [record, ...prev]);

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "PO_DISPATCH",
      targetEntity: record.poBatchNumber,
      details: `Authorized PO dispatch to ${record.erpSystem} for ${record.itemCount} SKUs (${record.totalUnits} units, ₹${record.totalValueInr.toLocaleString("en-IN")}) with HMAC-SHA256 signature.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "dispatch",
      title: "PO Dispatched to ERP",
      message: `${record.poBatchNumber} Dispatched to ${record.erpSystem} (${record.totalUnits} units, SHA-256 HMAC Verified)`,
      meta: {
        code: record.poBatchNumber,
        hash: record.payloadHash,
        latency: `${record.latencyMs}ms HTTP ${record.httpStatus}`,
      },
    });
  };

  const handleApplyPreset = (
    preset: "MONSOON" | "FLASH_SALE" | "LOGISTICS_STRIKE" | "NORMAL"
  ) => {
    if (preset === "MONSOON") {
      setWeatherSurgePct(40);
      setSupplierDelayDays(2.5);
      setPromoSurgePct(15);
      setSelectedServiceZ(2.326);
      handleTriggerSimulation();
      addToast({
        type: "warning",
        title: "Crisis Preset Applied",
        message: "🌧️ Monsoon Deluge: +40% Weather Shock, +2.5d Vendor Delay Shock, +15% Promo Uplift.",
        meta: { code: "PRESET-MONSOON" },
      });
    } else if (preset === "FLASH_SALE") {
      setPromoSurgePct(65);
      setWeatherSurgePct(0);
      setSupplierDelayDays(0.5);
      setSelectedServiceZ(2.576);
      handleTriggerSimulation();
      addToast({
        type: "warning",
        title: "Crisis Preset Applied",
        message: "🔥 Midnight Flash Sale: +65% Demand Surge with 99.5% Cycle Service Level (Z=2.576).",
        meta: { code: "PRESET-FLASH-SALE" },
      });
    } else if (preset === "LOGISTICS_STRIKE") {
      setSupplierDelayDays(4.0);
      setWeatherSurgePct(0);
      setPromoSurgePct(0);
      handleTriggerSimulation();
      addToast({
        type: "warning",
        title: "Crisis Preset Applied",
        message: "🚢 Freight Strike Shock: +4.0 Days Supplier Lead-Time Delay across regional corridors.",
        meta: { code: "PRESET-STRIKE" },
      });
    } else {
      setWeatherSurgePct(0);
      setSupplierDelayDays(0);
      setPromoSurgePct(0);
      setSelectedServiceZ(1.645);
      handleTriggerSimulation();
      addToast({
        type: "info",
        title: "Baseline Restored",
        message: "⚖️ Normal Operations: Reset all stress parameters to baseline operations benchmark.",
        meta: { code: "PRESET-NORMAL" },
      });
    }
  };

  const handleSelectReorderPolicy = (policy: ReorderPolicy) => {
    if (!checkPermission("switch automated replenishment algorithm", ["INVENTORY_MANAGER"])) {
      return;
    }

    setReorderPolicy(policy);
    handleTriggerSimulation();
    const policyName =
      policy === "DYNAMIC_AI"
        ? "Dynamic AI Safety Stock (Bivariate Monte Carlo)"
        : policy === "CONTINUOUS_REVIEW"
        ? "Continuous Review (s, S) Min-Max Policy"
        : "Periodic Review (R, S) Weekly Batch Review";

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "POLICY_MODIFIED",
      targetEntity: policy,
      details: `Replenishment algorithm switched to ${policyName}. System recomputed dynamic safety stock and ROP baselines.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "info",
      title: "Replenishment Policy Switched",
      message: `Active algorithm: ${policyName}. Safety stock & ROP thresholds recomputed.`,
      meta: { code: policy },
    });
  };

  const handleBulkDispatchCriticalPos = (targetSkuIds?: string[]) => {
    if (!checkPermission("bulk dispatch critical purchase orders", ["PROCUREMENT_SPECIALIST"])) {
      return;
    }

    const criticalPOs = purchaseOrders.filter((po) => {
      if (targetSkuIds && targetSkuIds.length > 0) {
        return targetSkuIds.includes(po.skuId);
      }
      return po.priority === "URGENT";
    });

    if (criticalPOs.length === 0) {
      addToast({
        type: "info",
        title: "No Critical POs Needed",
        message: "All selected SKUs are currently within optimal inventory safety levels.",
      });
      return;
    }

    const batchId = `PO-BULK-${Date.now().toString().slice(-4)}`;
    const totalUnits = criticalPOs.reduce((sum, po) => sum + po.recommendedOrderQty, 0);
    const totalVal = criticalPOs.reduce((sum, po) => sum + po.totalPoValueInr, 0);

    const record: DispatchedPoRecord = {
      dispatchId: `DSP-BULK-${Date.now().toString().slice(-6)}`,
      poBatchNumber: batchId,
      warehouseId: currentWarehouse.id,
      warehouseName: currentWarehouse.name,
      endpointUrl: "https://sap-s4hana.enterprise.corp/api/v2/po-dispatches",
      erpSystem: `${currentTenant.erpIntegration} Enterprise Cloud`,
      timestamp: new Date().toISOString(),
      itemCount: criticalPOs.length,
      totalUnits,
      totalValueInr: totalVal,
      httpStatus: 200,
      latencyMs: 78,
      payloadHash: `sha256:bulk_${Math.random().toString(36).substring(2, 12)}`,
      skuList: criticalPOs.map((p) => p.skuName),
      rawJsonPayload: JSON.stringify(
        {
          batchHeader: {
            id: batchId,
            warehouse: currentWarehouse.name,
            timestamp: new Date().toISOString(),
            mode: "BULK_CRITICAL_DISPATCH",
            tenant: currentTenant.name,
          },
          items: criticalPOs.map((p) => ({
            sku: p.skuName,
            skuId: p.skuId,
            qty: p.recommendedOrderQty,
            supplier: p.supplierName,
            unitCost: p.unitCostInr,
            totalVal: p.totalPoValueInr,
          })),
        },
        null,
        2
      ),
      edi850Payload: `ISA*00*          *00*          *ZZ*INVGUARD       *01*SAPS4HANA      *${new Date().toISOString().slice(2, 10).replace(/-/g, "")}*1200*U*00401*${Date.now().toString().slice(-9)}*0*P*>~\nGS*PO*INVGUARD*SAPS4HANA*${new Date().toISOString().slice(0, 10).replace(/-/g, "")}*1200*1*X*004010~\nST*850*0001~\nBEG*00*SA*${batchId}**${new Date().toISOString().slice(0, 10).replace(/-/g, "")}~\n${criticalPOs.map((p, idx) => `PO1*${idx + 1}*${p.recommendedOrderQty}*EA*${p.unitCostInr}**VN*${p.skuId}*IN*${p.skuName.replace(/ /g, "_")}~`).join("\n")}\nCTT*${criticalPOs.length}*${totalUnits}~\nSE*${criticalPOs.length + 4}*0001~\nGE*1*1~\nIEA*1*${Date.now().toString().slice(-9)}~`,
    };

    setDispatchedLedger((prev) => [record, ...prev]);

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "PO_DISPATCH",
      targetEntity: batchId,
      details: `Bulk dispatched ${criticalPOs.length} POs (${totalUnits.toLocaleString()} units, ₹${totalVal.toLocaleString("en-IN")}) to ${currentTenant.erpIntegration}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "dispatch",
      title: "Bulk Critical POs Dispatched",
      message: `⚡ ${criticalPOs.length} Purchase Orders (${totalUnits.toLocaleString()} units) dispatched to ${currentTenant.erpIntegration}.`,
      meta: {
        code: batchId,
        hash: record.payloadHash,
        units: totalUnits,
      },
    });
  };

  const handleAutoApproveAllTransfers = () => {
    if (!checkPermission("auto-approve inter-store transfers", ["WAREHOUSE_SUPERVISOR", "INVENTORY_MANAGER"])) {
      return;
    }

    const pendingTransfers = interTransfers.filter(
      (t) => !approvedTransferIds.includes(t.id)
    );

    if (pendingTransfers.length === 0) {
      addToast({
        type: "info",
        title: "All Transfers Approved",
        message: "No pending inter-store transfer recommendations require approval.",
      });
      return;
    }

    const newIds = pendingTransfers.map((t) => t.id);
    setApprovedTransferIds((prev) => [...prev, ...newIds]);

    const totalUnits = pendingTransfers.reduce(
      (acc, t) => acc + t.recommendedTransferQty,
      0
    );

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "INTER_TRANSFER_APPROVAL",
      targetEntity: `BULK-TRANSFERS (${pendingTransfers.length} routes)`,
      details: `Auto-approved ${pendingTransfers.length} inter-store replenishment routes (~${totalUnits.toLocaleString()} units) via intra-city EV vans.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "transfer",
      title: "All Transfers Auto-Approved",
      message: `🚚 ${pendingTransfers.length} Inter-Store Transfer routes approved (~${totalUnits.toLocaleString()} units in transit).`,
      meta: {
        code: `BULK-XFER-${Date.now().toString().slice(-4)}`,
        units: totalUnits,
        latency: "Green EV Fleet",
      },
    });
  };

  const handleApplyMarkdown = (skuId: string, discountPct: number) => {
    if (!checkPermission("trigger promotional markdown liquidations", ["INVENTORY_MANAGER"])) {
      return;
    }

    const s = simulationStates.find((item) => item.sku.id === skuId);
    const skuName = s ? s.sku.name : skuId;

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "MARKDOWN_ACTIVATED",
      targetEntity: `${skuName} (-${discountPct}%)`,
      details: `Triggered flash promotional markdown discount of -${discountPct}% for ${skuName} to liquidate perishable inventory before expiration.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "success",
      title: "Flash Markdown Deployed",
      message: `-${discountPct}% promotional markdown live for ${skuName} across catalog channels (SHA-256 sync verified).`,
      meta: {
        code: `DISC-${discountPct}%`,
        latency: "42ms",
      },
    });
  };

  const handleIssueDebitNote = (supplierName: string, amountInr: number) => {
    if (!checkPermission("issue supplier chargeback debit notes", ["PROCUREMENT_SPECIALIST"])) {
      return;
    }

    const formattedAmount = formatCurrency(amountInr, currency);

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "SLA_DEBIT_NOTE_ISSUED",
      targetEntity: supplierName,
      details: `Dispatched SLA breach debit note for ${formattedAmount} to ERP Accounts Payable for persistent delivery delays.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "dispatch",
      title: "SLA Debit Note Dispatched",
      message: `Formal liquidated damages debit note for ${formattedAmount} dispatched to ERP Accounts Payable for ${supplierName}.`,
      meta: {
        code: `DBN-${Date.now().toString().slice(-4)}`,
        hash: log.cryptoHash,
      },
    });
  };

  const handleDownloadCsv = () => {
    const csvData = generateSupplyChainAuditCsv(
      currentWarehouse,
      simulationStates,
      interTransfers,
      dispatchedLedger
    );
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerCsvDownload(
      csvData,
      `SupplyChain_Audit_${currentWarehouse.id}_${dateStr}.csv`
    );

    const log = StorageService.appendAuditLog({
      tenantId: currentTenant.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionType: "AUDIT_EXPORTED",
      targetEntity: currentWarehouse.name,
      details: `Exported comprehensive supply chain CSV audit dossier for ${currentWarehouse.name}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    addToast({
      type: "export",
      title: "Audit Report CSV Downloaded",
      message: `Complete dataset for ${currentWarehouse.name} exported successfully.`,
    });
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
        isDark ? "dark bg-[#09090B] text-neutral-100" : "bg-[#F8FAFC] text-slate-900"
      }`}
    >
      {viewMode === "landing" ? (
        <LandingPage
          theme={theme}
          onToggleTheme={handleToggleTheme}
          currency={currency}
          onSelectCurrency={setCurrency}
          onEnterApp={handleEnterApp}
          onNavigateToSignIn={handleNavigateToSignIn}
          onNavigateToSignUp={handleNavigateToSignUp}
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenHelpGuide={() => setIsHelpModalOpen(true)}
        />
      ) : viewMode === "login" ? (
        <SignInPage
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onSuccess={handleLoginSuccess}
          onNavigateToSignUp={handleNavigateToSignUp}
          onNavigateToForgotPassword={handleNavigateToForgotPassword}
          onNavigateToLanding={handleGoToLanding}
          redirectUrl={pendingRedirectUrl || undefined}
        />
      ) : viewMode === "signup" ? (
        <SignUpPage
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onSuccess={handleLoginSuccess}
          onNavigateToSignIn={handleNavigateToSignIn}
          onNavigateToLanding={handleGoToLanding}
        />
      ) : viewMode === "forgot-password" ? (
        <ForgotPasswordPage
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onNavigateToSignIn={handleNavigateToSignIn}
          onNavigateToLanding={handleGoToLanding}
        />
      ) : (
        <div className="flex h-screen overflow-hidden w-full">
          {/* Persistent Left Vertical Sidebar */}
          <DashboardSidebar
            activePage={activePage}
            onSelectPage={handleSelectPage}
            criticalCount={criticalSkus.length}
            poCount={purchaseOrders.length}
            transferCount={interTransfers.filter((t) => !approvedTransferIds.includes(t.id)).length}
            currentUser={currentUser}
            currentTenant={currentTenant}
            onSelectRole={handleSelectRole}
            onGoToLanding={handleGoToLanding}
            onSignOut={handleSignOut}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenWmsIngestion={() => setIsWmsModalOpen(true)}
            onOpenAuditLedger={() => setIsAuditModalOpen(true)}
            onOpenExportReport={() => setIsReportModalOpen(true)}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            theme={theme}
            onOpenCopilot={() => setIsCopilotOpen(true)}
            onOpenHelpGuide={() => setIsHelpModalOpen(true)}
          />

          {/* Right Main Column: Header + Scrollable Content */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
            {/* Top Navigation Header */}
            <Header
              currentWarehouse={currentWarehouse}
              warehouses={effectiveWarehouses}
              onSelectWarehouse={handleSelectWarehouse}
              activePage={activePage}
              onSelectPage={handleSelectPage}
              onRefreshData={handleTriggerSimulation}
              isSimulating={isSimulating}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenExportReport={() => setIsReportModalOpen(true)}
              onOpenWmsIngestion={() => setIsWmsModalOpen(true)}
              onOpenAuditLedger={() => setIsAuditModalOpen(true)}
              currentUser={currentUser}
              onSelectRole={handleSelectRole}
              currentTenant={currentTenant}
              onSelectTenant={handleSelectTenant}
              customDatasetName={customDataset?.name}
              onResetCustomDataset={handleResetCustomDataset}
              currentCurrency={currency}
              onSelectCurrency={setCurrency}
              onGoToLanding={handleGoToLanding}
              onSignOut={handleSignOut}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
              onOpenCopilot={() => setIsCopilotOpen(true)}
              onOpenHelpGuide={() => setIsHelpModalOpen(true)}
            />

            {/* Main Spacious Content Canvas with Generous Footer Spacing */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28 sm:pb-36 space-y-6 min-w-0">
        {/* PAGE 1: OVERVIEW & NETWORK TOPOLOGY */}
        {activePage === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* A. Executive Control Tower Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-neutral-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  SUPPLY CHAIN CONTROL TOWER
                </span>
                <div className="flex items-center gap-3 flex-wrap mt-0.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                    Supply Chain Overview
                  </h1>
                  <div className="flex items-center gap-2 text-xs font-mono font-medium">
                    {criticalSkus.length > 0 ? (
                      <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
                        {criticalSkus.length} Critical Stockouts Detected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Network Operating at Equilibrium
                      </span>
                    )}
                    <span className="text-slate-300 dark:text-neutral-700">·</span>
                    <span className="text-slate-600 dark:text-neutral-400">
                      {effectiveWarehouses.length} Active Dark Stores
                    </span>
                    <span className="text-slate-300 dark:text-neutral-700">·</span>
                    <span className="text-slate-600 dark:text-neutral-400">
                      Target CSL: {currentServiceLevel.label.split(" - ")[0]}
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-1 font-medium max-w-3xl">
                  Monitor network health, inventory exposure and operational risk across regional dark store hubs.
                </p>
              </div>

              {/* Current warehouse/network context & Run Engine Action */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Quick Facility Node Switcher */}
                <div
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-2.5 ${
                    isDark
                      ? "bg-neutral-900 border-neutral-800"
                      : "bg-white border-slate-300 shadow-xs"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isDark
                        ? "bg-neutral-800 text-emerald-400"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={selectedWarehouseId}
                        onChange={(e) => handleSelectWarehouse(e.target.value)}
                        className="text-xs font-bold bg-transparent text-slate-950 dark:text-white cursor-pointer focus:outline-none pr-1"
                        aria-label="Select command node"
                      >
                        {effectiveWarehouses.map((w) => (
                          <option
                            key={w.id}
                            value={w.id}
                            className={isDark ? "bg-neutral-900 text-white" : "bg-white text-slate-900"}
                          >
                            {w.name} ({w.city})
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                        {currentWarehouse.id}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium flex items-center gap-1.5">
                      <span>{currentWarehouse.region}</span>
                      <span>·</span>
                      <span>{currentWarehouse.demandFactor.toFixed(2)}x factor</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerSimulation}
                  disabled={isSimulating}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                    isDark
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  <Activity
                    className={`w-3.5 h-3.5 ${
                      isSimulating ? "animate-spin" : ""
                    }`}
                  />
                  <span>{isSimulating ? "Computing Engine..." : "Run Engine"}</span>
                </button>
              </div>
            </div>

            {/* New User Welcome & Doubt Clarification Banner */}
            {!isWelcomeBannerDismissed && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs relative ${
                  isDark
                    ? "bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-indigo-950/30 border-emerald-500/30 text-neutral-100"
                    : "bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 border-emerald-200 text-slate-900 shadow-sm"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsWelcomeBannerDismissed(true);
                    try {
                      localStorage.setItem("inventoryguard_welcome_banner_dismissed", "true");
                    } catch {}
                  }}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 p-1 rounded-lg cursor-pointer transition-colors"
                  title="Dismiss guide banner"
                  aria-label="Dismiss guide banner"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pr-6">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        New User Onboarding &amp; Doubt Resolution Guide
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white leading-snug">
                      Welcome to InventoryGuard AI Control Tower
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                      Predict quick-commerce stock-outs, calculate dual-variance dynamic safety stock, and fulfill urgent shortages in 3–6 hours via green EV inter-store transfers. Have questions or doubts? Click below to clarify!
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsHelpModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Clarify Doubts &amp; FAQ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCopilotOpen(true)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-bold text-xs transition-colors cursor-pointer ${
                        isDark
                          ? "bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border-emerald-500/30"
                          : "bg-white hover:bg-slate-50 text-emerald-700 border-emerald-300 shadow-2xs"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span>Ask AI Copilot</span>
                    </button>
                  </div>
                </div>

                {/* Quick doubt question chips */}
                <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-neutral-800 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                    Common doubts:
                  </span>
                  {[
                    { label: "📐 How is Dynamic Safety Stock calculated?", action: () => setIsHelpModalOpen(true) },
                    { label: "🚚 Why transfer instead of supplier PO?", action: () => setIsHelpModalOpen(true) },
                    { label: "⚡ How does Monte Carlo simulation work?", action: () => handleSelectPage("operations", "simulation") },
                    { label: "📁 Ingest custom WMS CSV dataset", action: () => setIsWmsModalOpen(true) },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={chip.action}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                        isDark
                          ? "bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700 text-neutral-300"
                          : "bg-white hover:bg-emerald-50 border-slate-200 text-slate-700 shadow-2xs"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* B. Executive KPI Row (4 High-Density, Anti-Slop Cards) */}
            <KpiMetrics
              simulationStates={simulationStates}
              selectedCslLabel={currentServiceLevel.label.split(" - ")[0]}
              selectedServiceZ={selectedServiceZ}
              currency={currency}
              theme={theme}
              onDrillDown={(target) => {
                if (target === "inventory" || target === "risk") {
                  handleSelectPage("inventory");
                } else if (target === "procurement") {
                  handleSelectPage("procurement", "po");
                } else if (target === "controls") {
                  handleSelectPage("operations", "simulation");
                }
              }}
            />

            {/* C. Multi-Echelon Dark Store Network Topology Map */}
            <NetworkTopologyMap
              warehouses={effectiveWarehouses}
              selectedWarehouseId={selectedWarehouseId}
              onSelectWarehouse={handleSelectWarehouse}
              interTransfers={interTransfers}
              simulationStates={simulationStates}
              onApproveTransfer={handleApproveTransfer}
              currency={currency}
              theme={theme}
            />

            {/* D. Operational Alerts & Recommended Actions */}
            <OperationalAlerts
              simulationStates={simulationStates}
              interTransfers={interTransfers}
              purchaseOrders={purchaseOrders}
              currentWarehouse={currentWarehouse}
              currency={currency}
              theme={theme}
              onNavigateToPo={(skuId) => {
                handleSelectPage("procurement", "po", skuId);
              }}
              onNavigateToTransfers={() => {
                handleSelectPage("procurement", "transfer");
              }}
              onNavigateToSuppliers={() => {
                handleSelectPage("procurement", "suppliers");
              }}
              onNavigateToInventory={(skuId) => {
                handleSelectPage("inventory", undefined, skuId);
              }}
              onApproveTransfer={handleApproveTransfer}
            />

            {/* E. Facility Comparative Performance & Multi-Echelon Benchmarking Matrix */}
            <FacilityPerformanceMatrix
              warehouses={effectiveWarehouses}
              selectedWarehouseId={selectedWarehouseId}
              onSelectWarehouse={handleSelectWarehouse}
              simulationStates={simulationStates}
              allHistoricalRecords={allHistoricalRecords}
              allSkus={effectiveSkus}
              interTransfers={interTransfers}
              purchaseOrders={purchaseOrders}
              currency={currency}
              theme={theme}
              onNavigateToInventory={(whId) => {
                if (whId) {
                  handleSelectWarehouse(whId);
                }
                handleSelectPage("inventory");
              }}
            />
          </div>
        )}

        {/* PAGE 2: INVENTORY & FORECASTING WORKSPACE */}
        {activePage === "inventory" && (
          <InventoryWorkspace
            simulationStates={simulationStates}
            selectedSkuId={activeSkuId}
            onSelectSkuId={setActiveSkuId}
            currentWarehouse={currentWarehouse}
            warehouses={effectiveWarehouses}
            onSelectWarehouse={handleSelectWarehouse}
            forecastHorizon={forecastHorizon}
            onChangeForecastHorizon={(days) => {
              setForecastHorizon(days);
              handleTriggerSimulation();
            }}
            forecastModel={forecastModel}
            onSelectForecastModel={(model) => {
              setForecastModel(model);
              handleTriggerSimulation();
            }}
            currency={currency}
            theme={theme}
            onTriggerSimulation={handleTriggerSimulation}
            isSimulating={isSimulating}
            onDownloadCsv={handleDownloadCsv}
            onNavigateToProcurement={(skuId) => {
              handleSelectPage("procurement", "po", skuId);
            }}
            onApplyMarkdown={handleApplyMarkdown}
          />
        )}

        {/* PAGE 3: PROCUREMENT & ROUTING */}
        {activePage === "procurement" && (
          <ProcurementWorkspace
            purchaseOrders={purchaseOrders}
            warehouse={currentWarehouse}
            warehouses={effectiveWarehouses}
            onSelectWarehouse={handleSelectWarehouse}
            dispatchedLedger={dispatchedLedger}
            onDispatchPo={handleDispatchPo}
            interTransfers={interTransfers}
            onApproveTransfer={handleApproveTransfer}
            approvedTransferIds={approvedTransferIds}
            simulationStates={simulationStates}
            onIssueDebitNote={handleIssueDebitNote}
            currency={currency}
            theme={theme}
            onTriggerSimulation={handleTriggerSimulation}
            isSimulating={isSimulating}
            onDownloadCsv={handleDownloadCsv}
            initialTab={procurementTab}
            onNavigateToInventory={(skuId) => {
              handleSelectPage("inventory", undefined, skuId);
            }}
          />
        )}

        {/* PAGE 4: OPERATIONS & DATA HUB COMMAND CENTER */}
        {activePage === "operations" && (
          <OperationsWorkspace
            effectiveWarehouses={effectiveWarehouses}
            selectedWarehouseId={selectedWarehouseId}
            onSelectWarehouse={handleSelectWarehouse}
            currentWarehouse={currentWarehouse}
            effectiveSkus={effectiveSkus}
            simulationStates={simulationStates}
            purchaseOrders={purchaseOrders}
            interTransfers={interTransfers}
            approvedTransferIds={approvedTransferIds}
            onApproveTransfer={handleApproveTransfer}
            dispatchedLedger={dispatchedLedger}
            auditLogs={auditLogs}
            customDataset={customDataset}
            onDatasetIngested={handleDatasetIngested}
            onResetCustomDataset={handleResetCustomDataset}
            onOpenIngestionWizard={() => setIsWmsModalOpen(true)}
            onOpenAuditModal={() => setIsAuditModalOpen(true)}
            onDownloadCsv={handleDownloadCsv}
            isSimulating={isSimulating}
            onTriggerSimulation={handleTriggerSimulation}
            forecastModel={forecastModel}
            onSelectForecastModel={(model) => {
              setForecastModel(model);
              handleTriggerSimulation();
            }}
            forecastHorizon={forecastHorizon}
            onChangeForecastHorizon={(days) => {
              setForecastHorizon(days);
              handleTriggerSimulation();
            }}
            monteCarloRuns={monteCarloRuns}
            onChangeMonteCarloRuns={(runs) => {
              setMonteCarloRuns(runs);
              handleTriggerSimulation();
            }}
            selectedServiceZ={selectedServiceZ}
            onSelectServiceZ={(z) => {
              setSelectedServiceZ(z);
              handleTriggerSimulation();
            }}
            promoSurgePct={promoSurgePct}
            onChangePromoSurgePct={(pct) => {
              setPromoSurgePct(pct);
              handleTriggerSimulation();
            }}
            weatherSurgePct={weatherSurgePct}
            onChangeWeatherSurgePct={(pct) => {
              setWeatherSurgePct(pct);
              handleTriggerSimulation();
            }}
            supplierDelayDays={supplierDelayDays}
            onChangeSupplierDelayDays={(days) => {
              setSupplierDelayDays(days);
              handleTriggerSimulation();
            }}
            reorderPolicy={reorderPolicy}
            onSelectReorderPolicy={handleSelectReorderPolicy}
            onApplyPreset={handleApplyPreset}
            pythonCode={pythonCode}
            requirementsTxt={REQUIREMENTS_TXT}
            readmeContent={README_MD}
            currency={currency}
            theme={theme}
            currentUser={currentUser}
            currentTenant={currentTenant}
            onNavigateToInventory={(skuId) => {
              handleSelectPage("inventory", undefined, skuId);
            }}
            onNavigateToProcurement={(tab, skuId) => {
              handleSelectPage("procurement", tab, skuId);
            }}
            onIssueDebitNote={handleIssueDebitNote}
            onApplyMarkdown={handleApplyMarkdown}
            initialTab={
              operationsTab === "datahub" || operationsTab === "ingestion" || operationsTab === "audit"
                ? "DATA_HUB"
                : operationsTab === "code"
                ? "INTELLIGENCE_ENGINE"
                : "COMMAND_CENTER"
            }
          />
        )}
            </main>

            {/* Enterprise Multi-Tier Architectural Footer */}
            <Footer
              currentWarehouse={currentWarehouse}
              currentUser={currentUser}
              auditLogsCount={auditLogs.length}
              currency={currency}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onOpenWmsModal={() => setIsWmsModalOpen(true)}
              onOpenAuditModal={() => setIsAuditModalOpen(true)}
              onTriggerSimulation={handleTriggerSimulation}
              onSelectPage={handleSelectPage}
              isSimulating={isSimulating}
              onGoToLanding={handleGoToLanding}
            />
          </div>
        </div>
      )}

      {/* Global Command Bar Modal (Cmd + K / Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        warehouses={effectiveWarehouses}
        selectedWarehouseId={selectedWarehouseId}
        onSelectWarehouse={handleSelectWarehouse}
        allSkus={effectiveSkus}
        onSelectSku={(id) => {
          handleSelectPage("inventory", undefined, id);
        }}
        onNavigateTab={(tab) => {
          if (tab === "overview" || tab === "network") {
            handleSelectPage("overview");
          } else if (tab === "inventory" || tab === "analytics" || tab === "table") {
            handleSelectPage("inventory");
          } else if (tab === "procurement" || tab === "po") {
            handleSelectPage("procurement", "po");
          } else if (tab === "transfer") {
            handleSelectPage("procurement", "transfer");
          } else if (tab === "suppliers") {
            handleSelectPage("procurement", "suppliers");
          } else if (tab === "operations") {
            handleSelectPage("operations");
          } else if (tab === "code") {
            handleSelectPage("operations", "code");
          }
        }}
        onTriggerSimulation={handleTriggerSimulation}
        onApplyWeatherSurge={(pct) => {
          setWeatherSurgePct(pct);
          handleTriggerSimulation();
          addToast({
            type: "info",
            title: "Weather Shock Applied",
            message: `Monsoon deluge surge set to +${pct}%.`,
          });
        }}
        onApplyPromoSurge={(pct) => {
          setPromoSurgePct(pct);
          handleTriggerSimulation();
          addToast({
            type: "info",
            title: "Promo Shock Applied",
            message: `Flash sale surge set to +${pct}%.`,
          });
        }}
        onApplyServiceLevel={(z) => {
          setSelectedServiceZ(z);
          handleTriggerSimulation();
          addToast({
            type: "info",
            title: "Service Level Set",
            message: `Cycle Service Level locked to Z = ${z}.`,
          });
        }}
        onExportCsv={handleDownloadCsv}
        onOpenPdfReport={() => setIsReportModalOpen(true)}
        theme={theme}
        onGoToLanding={handleGoToLanding}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Executive Printable / PDF Audit Dossier Modal */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        warehouse={currentWarehouse}
        simulationStates={simulationStates}
        interTransfers={interTransfers}
        dispatchedLedger={dispatchedLedger}
        onDownloadCsv={handleDownloadCsv}
        currency={currency}
        theme={theme}
      />

      {/* Real WMS & ERP Data Ingestion Engine Modal */}
      <WmsDataIngestionModal
        isOpen={isWmsModalOpen}
        onClose={() => setIsWmsModalOpen(false)}
        onDatasetIngested={handleDatasetIngested}
        theme={theme}
      />

      {/* Cryptographic Compliance Audit Ledger Modal */}
      <AuditLedgerModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditLogs={auditLogs}
        currentTenant={currentTenant}
        currentUser={currentUser}
        theme={theme}
      />

      {/* New User Doubt Resolution & Interactive Guidebook Modal */}
      <HelpAndDoubtsModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        theme={theme}
        onNavigatePage={handleSelectPage}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenWmsIngestion={() => setIsWmsModalOpen(true)}
      />

      {/* Gemini AI Copilot Assistant & Doubt Clarification */}
      <GeminiCopilot
        isOpen={isCopilotOpen}
        onToggle={() => setIsCopilotOpen((prev) => !prev)}
        currentWarehouse={currentWarehouse}
        activePage={activePage}
        criticalCount={criticalSkus.length}
        currency={currency}
        currentUser={currentUser}
        selectedSkuId={activeSkuId}
        theme={theme}
        onNavigatePage={handleSelectPage}
        onOpenHelpGuide={() => setIsHelpModalOpen(true)}
      />

      {/* Frosted Glass Floating Toast Notification Feedback System */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        theme={theme}
      />
    </div>
  );
}
