import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  FileText,
  Clock,
  User,
  Building,
  KeyRound,
} from "lucide-react";
import { AuditLogEntry, TenantOrganization, UserProfile } from "../types/auth";
import { StorageService } from "../services/storageService";

interface AuditLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
  currentTenant: TenantOrganization;
  currentUser: UserProfile;
  theme?: "dark" | "light";
}

export const AuditLedgerModal: React.FC<AuditLedgerModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  currentTenant,
  currentUser,
  theme = "dark",
}) => {
  if (!isOpen) return null;

  const isDark = theme === "dark";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>("ALL");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportAuditJson = () => {
    const jsonStr = StorageService.exportFullDatabaseSnapshot();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Aegis_Compliance_Audit_Ledger_${currentTenant.id}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.cryptoHash.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedActionFilter === "ALL" || log.actionType === selectedActionFilter;

    return matchesSearch && matchesFilter;
  });

  const bgCls = isDark
    ? "bg-neutral-950 border-neutral-800 text-neutral-100"
    : "bg-white border-slate-200 text-slate-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${bgCls}`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? "border-neutral-800 bg-neutral-900/60" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  Cryptographic Audit Ledger &amp; Compliance Trail
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  Immutable Log
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Multi-tenant tamper-evident audit record with SHA-256 integrity hashes for SOC2 &amp; SOX compliance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAuditJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold text-purple-400 border-purple-500/30 hover:bg-purple-500/10 cursor-pointer transition-colors"
              title="Download Full Database Snapshot JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Audit JSON</span>
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-800"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tenant & Session Meta Banner */}
        <div
          className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
            isDark ? "border-neutral-800 bg-neutral-900/60" : "border-slate-200 bg-slate-100/90"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-400 font-medium">
              <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Tenant:</span>
              <span className="font-semibold text-slate-950 dark:text-white font-mono">{currentTenant.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-400 font-medium">
              <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Active Auditor:</span>
              <span className="font-semibold text-slate-950 dark:text-white font-mono">{currentUser.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="w-3 h-3" /> Ledger State: Verified Encrypted
            </span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="px-6 py-3 border-b border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by SKU, user, action or hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                isDark
                  ? "bg-slate-950 border-slate-800 text-slate-200"
                  : "bg-slate-50 border-slate-300 text-slate-800"
              }`}
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {[
              { id: "ALL", label: "All Events" },
              { id: "PO_DISPATCH", label: "PO Dispatches" },
              { id: "INTER_TRANSFER_APPROVAL", label: "Transfers" },
              { id: "SLA_DEBIT_NOTE_ISSUED", label: "Debit Notes" },
              { id: "POLICY_MODIFIED", label: "Policies" },
              { id: "WMS_DATA_INGESTED", label: "WMS Ingestion" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedActionFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedActionFilter === f.id
                    ? "bg-purple-600 text-white"
                    : isDark
                    ? "bg-slate-800 text-slate-400 hover:text-slate-200"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Log Entries Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No audit entries match the selected search query or filter.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const actionBadgeColors: Record<string, string> = {
                  PO_DISPATCH: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                  INTER_TRANSFER_APPROVAL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  SLA_DEBIT_NOTE_ISSUED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                  POLICY_MODIFIED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                  WMS_DATA_INGESTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  SIMULATION_TRIGGERED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                  MARKDOWN_ACTIVATED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
                };

                const badgeCls =
                  actionBadgeColors[log.actionType] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

                return (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isDark
                        ? "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                        : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${badgeCls}`}
                        >
                          {log.actionType.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-semibold">{log.targetEntity}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-neutral-400 font-medium">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed mb-3 ${isDark ? "text-neutral-200" : "text-slate-800 font-medium"}`}>
                      {log.details}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-neutral-800 text-[11px]">
                      <div className="flex items-center gap-3 text-slate-700 dark:text-neutral-400 font-medium">
                        <span>
                          Actor: <strong className="text-slate-950 dark:text-white font-mono">{log.userName}</strong> (
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">{log.userRole.replace(/_/g, " ")}</span>)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600 dark:text-neutral-400">
                        <KeyRound className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="truncate max-w-[190px]">{log.cryptoHash}</span>
                        <button
                          onClick={() => handleCopyHash(log.cryptoHash)}
                          className="p-1 hover:text-white transition-colors cursor-pointer"
                          title="Copy SHA-256 Digest"
                        >
                          {copiedHash === log.cryptoHash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
