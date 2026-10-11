import { DispatchedPoRecord, SkuMetadata, DailyRecord, Warehouse } from "../types";
import { AuditLogEntry, UserProfile, TenantOrganization } from "../types/auth";
import { DEMO_USERS, TENANT_ORGANIZATIONS } from "./authService";

const STORAGE_KEYS = {
  CURRENT_USER: "aegis_current_user_v1",
  CURRENT_TENANT: "aegis_current_tenant_v1",
  DISPATCHED_LEDGER: "aegis_dispatched_ledger_v1",
  APPROVED_TRANSFERS: "aegis_approved_transfers_v1",
  AUDIT_LOGS: "aegis_audit_logs_v1",
  DEBIT_NOTES: "aegis_debit_notes_v1",
  CUSTOM_DATASET: "aegis_custom_dataset_v1",
};

/**
 * Initial enterprise audit logs to demonstrate compliance & traceability
 */
const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "aud-001",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    tenantId: "tenant-zepto-hyperlocal",
    userId: "usr-inv-01",
    userName: "Ananya Deshmukh",
    userRole: "INVENTORY_MANAGER",
    actionType: "POLICY_MODIFIED",
    targetEntity: "Dynamic AI Safety Stock (Bivariate Monte Carlo)",
    details: "Switched replenishment algorithm to Dynamic AI with 99% Cycle Service Level (Z=2.326).",
    cryptoHash: "sha256:4a8b79e2c019dbf83e201a",
    status: "VERIFIED",
  },
  {
    id: "aud-002",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    tenantId: "tenant-zepto-hyperlocal",
    userId: "usr-proc-02",
    userName: "Vikram Malhotra",
    userRole: "PROCUREMENT_SPECIALIST",
    actionType: "PO_DISPATCH",
    targetEntity: "PO-20261010-WH-BOM-01-SKU-001",
    details: "Authorized urgent PO for 350 units Organic Milk 1L via SAP S/4HANA EDI 850 gateway.",
    cryptoHash: "sha256:9c123df7a884efb30219cc",
    status: "VERIFIED",
  },
  {
    id: "aud-003",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    tenantId: "tenant-zepto-hyperlocal",
    userId: "usr-wh-03",
    userName: "Rajesh Kulkarni",
    userRole: "WAREHOUSE_SUPERVISOR",
    actionType: "INTER_TRANSFER_APPROVAL",
    targetEntity: "TRF-SKU-004-WH-BLR-02",
    details: "Approved multi-echelon transfer of 180 units Cold Brew Coffee via EV Van route.",
    cryptoHash: "sha256:f02781cb9a3e4901b088e1",
    status: "VERIFIED",
  },
];

export interface CustomDatasetPayload {
  name: string;
  uploadedAt: string;
  source: string;
  warehouses: Warehouse[];
  skus: SkuMetadata[];
  records: DailyRecord[];
}

export class StorageService {
  /**
   * Current authenticated user profile
   */
  static getCurrentUser(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    return DEMO_USERS.INVENTORY_MANAGER;
  }

  static setCurrentUser(user: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }

  /**
   * Current tenant organization
   */
  static getCurrentTenant(): TenantOrganization {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_TENANT);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    return TENANT_ORGANIZATIONS[0];
  }

  static setCurrentTenant(tenant: TenantOrganization): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TENANT, JSON.stringify(tenant));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }

  /**
   * Dispatched Purchase Orders Ledger
   */
  static getDispatchedLedger(fallback: DispatchedPoRecord[]): DispatchedPoRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DISPATCHED_LEDGER);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    return fallback;
  }

  static saveDispatchedLedger(ledger: DispatchedPoRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DISPATCHED_LEDGER, JSON.stringify(ledger));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }

  /**
   * Approved Transfer IDs
   */
  static getApprovedTransferIds(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPROVED_TRANSFERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    return [];
  }

  static saveApprovedTransferIds(ids: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.APPROVED_TRANSFERS, JSON.stringify(ids));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }

  /**
   * Immutable Audit Ledger
   */
  static getAuditLogs(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    return INITIAL_AUDIT_LOGS;
  }

  static appendAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp" | "cryptoHash" | "status">): AuditLogEntry {
    const existing = this.getAuditLogs();
    const timestamp = new Date().toISOString();
    const id = `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Pseudo crypto hash
    const rawData = `${id}|${timestamp}|${entry.userId}|${entry.actionType}|${entry.targetEntity}`;
    let hash = 0;
    for (let i = 0; i < rawData.length; i++) {
      hash = (hash << 5) - hash + rawData.charCodeAt(i);
      hash |= 0;
    }
    const cryptoHash = `sha256:${Math.abs(hash).toString(16).padStart(16, "0")}${Math.random().toString(16).substring(2, 10)}`;

    const newLog: AuditLogEntry = {
      ...entry,
      id,
      timestamp,
      cryptoHash,
      status: "COMMITTED",
    };

    const updated = [newLog, ...existing].slice(0, 100);
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
    return newLog;
  }

  /**
   * Custom Uploaded WMS / ERP Dataset
   */
  static getCustomDataset(): CustomDatasetPayload | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_DATASET);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    return null;
  }

  static saveCustomDataset(dataset: CustomDatasetPayload | null): void {
    try {
      if (!dataset) {
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_DATASET);
      } else {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_DATASET, JSON.stringify(dataset));
      }
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }

  /**
   * Database Snapshot Export / Import
   */
  static exportFullDatabaseSnapshot(): string {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      schemaVersion: "2.4.0",
      currentUser: this.getCurrentUser(),
      currentTenant: this.getCurrentTenant(),
      dispatchedLedger: this.getDispatchedLedger([]),
      approvedTransfers: this.getApprovedTransferIds(),
      auditLogs: this.getAuditLogs(),
      customDataset: this.getCustomDataset(),
    };
    return JSON.stringify(snapshot, null, 2);
  }

  static clearDatabase(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}
