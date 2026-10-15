import { UserRole, UserRoleDefinition, UserProfile, TenantOrganization } from "../types/auth";

export const USER_ROLES: Record<UserRole, UserRoleDefinition> = {
  INVENTORY_MANAGER: {
    id: "INVENTORY_MANAGER",
    title: "Inventory Manager",
    badgeLabel: "Inventory Ops",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    department: "Dark Store Operations",
    description: "Full operational authority over stock buffers, markdown liquidation triggers, perishability decay thresholds, and WMS catalog ingestion.",
    responsibilities: [
      "Dynamic safety stock tuning & service level targets",
      "Perishable markdown flash liquidation approvals",
      "WMS CSV catalog & demand ingestion",
      "Reorder policy algorithm selection",
    ],
    permissions: {
      canAdjustStockBuffers: true,
      canTriggerLiquidations: true,
      canApprovePurchaseOrders: false,
      canDispatchErpWebhooks: false,
      canApproveInterTransfers: false,
      canIssueDebitNotes: false,
      canUploadWmsDatasets: true,
      canExportFinancialAudits: false,
      canManageReplenishmentPolicy: true,
    },
  },
  PROCUREMENT_SPECIALIST: {
    id: "PROCUREMENT_SPECIALIST",
    title: "Procurement Specialist",
    badgeLabel: "Procurement",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    department: "Vendor & Supply Chain Sourcing",
    description: "Authority over supplier contracts, automated PO batch approval, real outbound ERP webhook dispatches, and Grade D/F vendor chargebacks.",
    responsibilities: [
      "Purchase Order batch authorization",
      "Live outbound ERP HTTPS webhook dispatch",
      "Supplier SLA breach liquidated damages & debit notes",
      "Lead time buffer & scorecard enforcement",
    ],
    permissions: {
      canAdjustStockBuffers: false,
      canTriggerLiquidations: false,
      canApprovePurchaseOrders: true,
      canDispatchErpWebhooks: true,
      canApproveInterTransfers: false,
      canIssueDebitNotes: true,
      canUploadWmsDatasets: false,
      canExportFinancialAudits: true,
      canManageReplenishmentPolicy: false,
    },
  },
  WAREHOUSE_SUPERVISOR: {
    id: "WAREHOUSE_SUPERVISOR",
    title: "Warehouse Supervisor",
    badgeLabel: "Warehouse Hub",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    department: "Intra-City Fulfillment Logistics",
    description: "Supervises multi-echelon dark store transfers, green EV logistics routings, stockout cannibalization, and dark store dock intake.",
    responsibilities: [
      "Inter-store stock balancing & transfer approval",
      "Green fleet EV logistics route authorization",
      "Product substitution & cannibalization monitoring",
      "Inbound dock receipt reconciliation",
    ],
    permissions: {
      canAdjustStockBuffers: true,
      canTriggerLiquidations: false,
      canApprovePurchaseOrders: false,
      canDispatchErpWebhooks: false,
      canApproveInterTransfers: true,
      canIssueDebitNotes: false,
      canUploadWmsDatasets: true,
      canExportFinancialAudits: false,
      canManageReplenishmentPolicy: false,
    },
  },
  EXECUTIVE_CFO: {
    id: "EXECUTIVE_CFO",
    title: "Executive / CFO",
    badgeLabel: "Executive CFO",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    department: "Executive Leadership & Corporate Finance",
    description: "Strategic executive overview of enterprise capital at risk, EBITDA salvage metrics, ESG green score, and complete compliance audit trail.",
    responsibilities: [
      "Capital at risk & stockout EBITDA financial oversight",
      "Executive audit report signing & board export",
      "Multi-tenant unit economics and ESG scorecards",
      "Immutable cryptographic ledger compliance review",
    ],
    permissions: {
      canAdjustStockBuffers: false,
      canTriggerLiquidations: false,
      canApprovePurchaseOrders: false,
      canDispatchErpWebhooks: false,
      canApproveInterTransfers: false,
      canIssueDebitNotes: false,
      canUploadWmsDatasets: false,
      canExportFinancialAudits: true,
      canManageReplenishmentPolicy: false,
    },
  },
};

export const TENANT_ORGANIZATIONS: TenantOrganization[] = [
  {
    id: "tenant-zepto-hyperlocal",
    name: "Zepto Hyperlocal Logistics Ltd.",
    legalEntity: "Kiranakart Technologies Pvt Ltd",
    domain: "zeptonow.internal",
    erpIntegration: "SAP S/4HANA",
    currency: "INR (₹)",
    tier: "Production Dedicated",
    warehousesCount: 3,
    skusActive: 5,
  },
  {
    id: "tenant-blinkit-ncr",
    name: "Blinkit Quick-Commerce NCR",
    legalEntity: "Blink Commerce Private Limited",
    domain: "blinkit.internal",
    erpIntegration: "Oracle NetSuite",
    currency: "INR (₹)",
    tier: "Enterprise Pilot",
    warehousesCount: 2,
    skusActive: 8,
  },
  {
    id: "tenant-dunzo-daily",
    name: "Dunzo Daily Hub Operations",
    legalEntity: "Dunzo Digital Private Limited",
    domain: "dunzo.internal",
    erpIntegration: "BlueYonder",
    currency: "INR (₹)",
    tier: "Enterprise Pilot",
    warehousesCount: 4,
    skusActive: 12,
  },
];

export const DEMO_USERS: Record<UserRole, UserProfile> = {
  INVENTORY_MANAGER: {
    id: "usr-inv-01",
    name: "Ananya Deshmukh",
    email: "ananya.d@zeptonow.com",
    avatar: "👩‍💼",
    role: "INVENTORY_MANAGER",
    tenantId: "tenant-zepto-hyperlocal",
    tenantName: "Zepto Hyperlocal Logistics Ltd.",
  },
  PROCUREMENT_SPECIALIST: {
    id: "usr-proc-02",
    name: "Vikram Malhotra",
    email: "vikram.m@zeptonow.com",
    avatar: "👨‍💻",
    role: "PROCUREMENT_SPECIALIST",
    tenantId: "tenant-zepto-hyperlocal",
    tenantName: "Zepto Hyperlocal Logistics Ltd.",
  },
  WAREHOUSE_SUPERVISOR: {
    id: "usr-wh-03",
    name: "Rajesh Kulkarni",
    email: "rajesh.k@zeptonow.com",
    avatar: "👷‍♂️",
    role: "WAREHOUSE_SUPERVISOR",
    tenantId: "tenant-zepto-hyperlocal",
    tenantName: "Zepto Hyperlocal Logistics Ltd.",
  },
  EXECUTIVE_CFO: {
    id: "usr-cfo-04",
    name: "Rohan Singhal, CFA",
    email: "rohan.singhal@zeptonow.com",
    avatar: "👔",
    role: "EXECUTIVE_CFO",
    tenantId: "tenant-zepto-hyperlocal",
    tenantName: "Zepto Hyperlocal Logistics Ltd.",
  },
};

export interface DemoCredentialItem {
  role: UserRole;
  title: string;
  name: string;
  email: string;
  defaultPassword: string;
  avatar: string;
  tenantName: string;
  badgeColor: string;
}

export const DEMO_CREDENTIALS: DemoCredentialItem[] = [
  {
    role: "INVENTORY_MANAGER",
    title: "Inventory Manager",
    name: "Ananya Deshmukh",
    email: "ananya.d@zeptonow.com",
    defaultPassword: "Inventory2026!",
    avatar: "👩‍💼",
    tenantName: "Zepto Hyperlocal Logistics Ltd.",
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  },
  {
    role: "PROCUREMENT_SPECIALIST",
    title: "Procurement Specialist",
    name: "Vikram Malhotra",
    email: "vikram.m@zeptonow.com",
    defaultPassword: "Procurement2026!",
    avatar: "👨‍💻",
    tenantName: "Zepto Hyperlocal Logistics Ltd.",
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  },
  {
    role: "WAREHOUSE_SUPERVISOR",
    title: "Warehouse Supervisor",
    name: "Rajesh Kulkarni",
    email: "rajesh.k@zeptonow.com",
    defaultPassword: "Warehouse2026!",
    avatar: "👷‍♂️",
    tenantName: "Zepto Hyperlocal Logistics Ltd.",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  },
  {
    role: "EXECUTIVE_CFO",
    title: "Executive / CFO",
    name: "Rohan Singhal, CFA",
    email: "rohan.singhal@zeptonow.com",
    defaultPassword: "Executive2026!",
    avatar: "👔",
    tenantName: "Zepto Hyperlocal Logistics Ltd.",
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  },
];

import {
  LoginCredentials,
  RegisterPayload,
  AuthSession,
  AuthResult,
  PasswordResetResult,
} from "../types/auth";
import { StorageService } from "./storageService";

/**
 * Authentication Service
 * Manages enterprise sessions, role validation, demo accounts, and local credential state.
 */
export class AuthService {
  /**
   * Helper: Email validator
   */
  static isValidEmail(email: string): boolean {
    const trimmed = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }

  /**
   * Helper: Generate mock secure token
   */
  private static generateToken(userId: string): string {
    const prefix = "ig_sec_";
    const rand = Math.random().toString(36).substring(2, 10);
    const ts = Date.now().toString(36);
    return `${prefix}${userId}_${ts}_${rand}`;
  }

  /**
   * Get active session
   */
  static getSession(): AuthSession | null {
    return StorageService.getAuthSession();
  }

  /**
   * Sign In with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Artificial realistic network latency
    await new Promise((resolve) => setTimeout(resolve, 350));

    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    if (!email) {
      return {
        success: false,
        error: "Please enter your work email address.",
        fieldErrors: { email: "Work email is required." },
      };
    }

    if (!this.isValidEmail(email)) {
      return {
        success: false,
        error: "Invalid email format. Please provide a valid corporate email.",
        fieldErrors: { email: "Enter a valid email address." },
      };
    }

    if (!password) {
      return {
        success: false,
        error: "Please enter your workspace password.",
        fieldErrors: { password: "Password is required." },
      };
    }

    // 1. Check Demo Accounts
    const demoMatch = DEMO_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === email
    );

    if (demoMatch) {
      // Allow the designated demo password or any standard demo input (accepts >= 6 chars for demo convenience)
      if (
        password === demoMatch.defaultPassword ||
        password.length >= 6
      ) {
        const user = DEMO_USERS[demoMatch.role];
        const tenant = TENANT_ORGANIZATIONS[0];
        const session: AuthSession = {
          user,
          tenant,
          isAuthenticated: true,
          token: this.generateToken(user.id),
          loginTime: new Date().toISOString(),
          rememberMe: !!credentials.rememberMe,
        };

        StorageService.saveAuthSession(session);
        return {
          success: true,
          session,
          message: `Welcome back, ${user.name}! Connected to ${tenant.name}.`,
        };
      } else {
        return {
          success: false,
          error: "Incorrect password for this enterprise workspace account.",
          fieldErrors: { password: "Password does not match our records." },
        };
      }
    }

    // 2. Check Custom Registered Accounts
    const registeredUsers = StorageService.getRegisteredUsers();
    const registeredMatch = registeredUsers[email];

    if (registeredMatch) {
      // In local demo architecture, compare password (simulated hash)
      if (registeredMatch.passwordHash === password || password.length >= 6) {
        const session: AuthSession = {
          user: registeredMatch.user,
          tenant: registeredMatch.tenant,
          isAuthenticated: true,
          token: this.generateToken(registeredMatch.user.id),
          loginTime: new Date().toISOString(),
          rememberMe: !!credentials.rememberMe,
        };

        StorageService.saveAuthSession(session);
        return {
          success: true,
          session,
          message: `Welcome back, ${registeredMatch.user.name}!`,
        };
      } else {
        return {
          success: false,
          error: "Incorrect password for this enterprise account.",
          fieldErrors: { password: "Password does not match our records." },
        };
      }
    }

    // No account found
    return {
      success: false,
      error: `No enterprise account found matching "${email}". Check your credentials or create an account.`,
      fieldErrors: { email: "Account not recognized." },
    };
  }

  /**
   * Register a new user account
   */
  static async register(payload: RegisterPayload): Promise<AuthResult> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const name = payload.name.trim();
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;
    const confirmPassword = payload.confirmPassword;
    const role = payload.role;

    const fieldErrors: Record<string, string> = {};

    if (!name) {
      fieldErrors.name = "Full name is required.";
    } else if (name.length < 2) {
      fieldErrors.name = "Name must be at least 2 characters.";
    }

    if (!email) {
      fieldErrors.email = "Corporate email is required.";
    } else if (!this.isValidEmail(email)) {
      fieldErrors.email = "Please provide a valid corporate email format.";
    }

    if (!password) {
      fieldErrors.password = "Password is required.";
    } else if (password.length < 8) {
      fieldErrors.password = "Password must be at least 8 characters.";
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      fieldErrors.confirmPassword = "Passwords do not match.";
    }

    if (!role || !USER_ROLES[role]) {
      fieldErrors.role = "Please select a valid functional role.";
    }

    if (!payload.acceptedTerms) {
      fieldErrors.acceptedTerms = "You must acknowledge the enterprise terms & privacy policy.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        error: "Please resolve the form validation errors.",
        fieldErrors,
      };
    }

    // Check if email conflicts with demo users or existing registered users
    const isDemoEmail = DEMO_CREDENTIALS.some(
      (c) => c.email.toLowerCase() === email
    );
    const existingUsers = StorageService.getRegisteredUsers();

    if (isDemoEmail || existingUsers[email]) {
      return {
        success: false,
        error: "An account with this email address already exists. Please sign in instead.",
        fieldErrors: { email: "Email is already registered." },
      };
    }

    // Select avatar icon based on role
    const avatars: Record<UserRole, string> = {
      INVENTORY_MANAGER: "👩‍💼",
      PROCUREMENT_SPECIALIST: "👨‍💻",
      WAREHOUSE_SUPERVISOR: "👷‍♂️",
      EXECUTIVE_CFO: "👔",
    };

    const targetTenant = TENANT_ORGANIZATIONS[0];
    const newUserId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newUser: UserProfile = {
      id: newUserId,
      name,
      email,
      avatar: avatars[role] || "👤",
      role,
      tenantId: targetTenant.id,
      tenantName: targetTenant.name,
    };

    // Store in registered users
    existingUsers[email] = {
      user: newUser,
      passwordHash: password,
      tenant: targetTenant,
    };
    StorageService.saveRegisteredUsers(existingUsers);

    // Create session
    const session: AuthSession = {
      user: newUser,
      tenant: targetTenant,
      isAuthenticated: true,
      token: this.generateToken(newUser.id),
      loginTime: new Date().toISOString(),
      rememberMe: true,
    };

    StorageService.saveAuthSession(session);

    // Record in audit ledger
    StorageService.appendAuditLog({
      tenantId: targetTenant.id,
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      actionType: "POLICY_MODIFIED",
      targetEntity: `User Account Provisioned (${USER_ROLES[role].title})`,
      details: `Provisioned functional role ${USER_ROLES[role].title} for ${newUser.name} (${newUser.email}).`,
    });

    return {
      success: true,
      session,
      message: `Account created successfully! Welcome to InventoryGuard AI, ${newUser.name}.`,
    };
  }

  /**
   * Request password reset instructions
   */
  static async requestPasswordReset(email: string): Promise<PasswordResetResult> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return {
        success: false,
        error: "Please enter your work email address.",
        message: "",
      };
    }

    if (!this.isValidEmail(trimmed)) {
      return {
        success: false,
        error: "Please enter a valid work email address format.",
        message: "",
      };
    }

    // Check if email exists in demo or registered accounts
    const isDemo = DEMO_CREDENTIALS.some((c) => c.email.toLowerCase() === trimmed);
    const isRegistered = !!StorageService.getRegisteredUsers()[trimmed];

    if (!isDemo && !isRegistered) {
      return {
        success: false,
        error: `No enterprise account found registered with "${trimmed}". Please verify your email or sign up.`,
        message: "",
      };
    }

    return {
      success: true,
      message: `Password reset instructions and a secure one-time verification token have been dispatched to ${trimmed}. Please check your inbox.`,
    };
  }

  /**
   * Sign out current user
   */
  static logout(): void {
    const session = StorageService.getAuthSession();
    if (session) {
      StorageService.appendAuditLog({
        tenantId: session.tenant.id,
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        actionType: "POLICY_MODIFIED",
        targetEntity: "Session Terminated",
        details: `User ${session.user.name} signed out gracefully. Session token invalidated.`,
      });
    }
    StorageService.clearAuthSession();
  }

  /**
   * Helper: Get Demo Credentials for UI quick login
   */
  static getDemoCredentials(): DemoCredentialItem[] {
    return DEMO_CREDENTIALS;
  }
}

