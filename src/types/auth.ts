/**
 * Multi-Tenant Authentication & Role-Based Access Control (RBAC) Types
 */

export type UserRole =
  | "INVENTORY_MANAGER"
  | "PROCUREMENT_SPECIALIST"
  | "WAREHOUSE_SUPERVISOR"
  | "EXECUTIVE_CFO";

export interface UserRoleDefinition {
  id: UserRole;
  title: string;
  badgeLabel: string;
  badgeColor: string;
  department: string;
  description: string;
  responsibilities: string[];
  permissions: {
    canAdjustStockBuffers: boolean;
    canTriggerLiquidations: boolean;
    canApprovePurchaseOrders: boolean;
    canDispatchErpWebhooks: boolean;
    canApproveInterTransfers: boolean;
    canIssueDebitNotes: boolean;
    canUploadWmsDatasets: boolean;
    canExportFinancialAudits: boolean;
    canManageReplenishmentPolicy: boolean;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
}

export interface TenantOrganization {
  id: string;
  name: string;
  legalEntity: string;
  domain: string;
  erpIntegration: "SAP S/4HANA" | "Oracle NetSuite" | "Microsoft Dynamics 365" | "BlueYonder";
  currency: string;
  tier: "Enterprise Pilot" | "Production Dedicated";
  warehousesCount: number;
  skusActive: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  actionType:
    | "PO_DISPATCH"
    | "INTER_TRANSFER_APPROVAL"
    | "SLA_DEBIT_NOTE_ISSUED"
    | "MARKDOWN_ACTIVATED"
    | "WMS_DATA_INGESTED"
    | "POLICY_MODIFIED"
    | "SIMULATION_TRIGGERED"
    | "AUDIT_EXPORTED";
  targetEntity: string;
  details: string;
  cryptoHash: string;
  status: "COMMITTED" | "VERIFIED";
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role: UserRole;
  tenantId?: string;
  tenantName?: string;
  acceptedTerms?: boolean;
}

export interface AuthSession {
  user: UserProfile;
  tenant: TenantOrganization;
  isAuthenticated: boolean;
  token: string;
  loginTime: string;
  rememberMe: boolean;
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  error?: string;
}
