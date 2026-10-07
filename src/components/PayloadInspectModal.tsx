import React, { useState } from "react";
import { DispatchedPoRecord } from "../types";
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  FileCode,
  FileText,
  Clock,
} from "lucide-react";

interface PayloadInspectModalProps {
  record: DispatchedPoRecord | null;
  onClose: () => void;
  theme?: "dark" | "light";
}

export const PayloadInspectModal: React.FC<PayloadInspectModalProps> = ({
  record,
  onClose,
  theme = "dark",
}) => {
  if (!record) return null;

  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<"json" | "edi">("json");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const bgCls = isDark
    ? "bg-slate-900 border-slate-700/80 text-slate-100"
    : "bg-white border-slate-300 text-slate-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${bgCls}`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? "border-slate-800 bg-slate-950/70" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  ERP Webhook Dispatch Payload Inspector
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  HTTP {record.httpStatus} OK
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {record.dispatchId} • {record.erpSystem} ({record.latencyMs}ms)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? "border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white"
                : "border-slate-300 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cryptographic SHA-256 Verification Ribbon */}
        <div
          className={`px-6 py-2.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono ${
            isDark
              ? "bg-indigo-950/30 border-slate-800 text-indigo-300"
              : "bg-indigo-50 border-slate-200 text-indigo-800"
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-400 shrink-0">
              HMAC-SHA256 Signed:
            </span>
            <span className="truncate opacity-90">{record.payloadHash}</span>
          </div>

          <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(record.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {/* View Selection Bar */}
        <div
          className={`px-6 py-2.5 border-b flex items-center justify-between gap-4 ${
            isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-slate-100/60"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("json")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "json"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Raw JSON Webhook</span>
            </button>

            <button
              onClick={() => setActiveTab("edi")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "edi"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ANSI X12 EDI 850 Segment</span>
            </button>
          </div>

          <button
            onClick={() => {
              const text =
                activeTab === "json" ? record.rawJsonPayload : record.edi850Payload;
              handleCopy(text, activeTab);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300"
            }`}
          >
            {copiedKey === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Payload</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-950 font-mono text-xs leading-relaxed text-slate-300">
          <pre className="overflow-x-auto selection:bg-indigo-500 selection:text-white">
            {activeTab === "json" && record.rawJsonPayload}
            {activeTab === "edi" && record.edi850Payload}
          </pre>
        </div>

        {/* Footer Meta */}
        <div
          className={`px-6 py-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 ${
            isDark ? "border-slate-800 bg-slate-950/70" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span>
              Target: <strong className="text-slate-200">{record.erpSystem}</strong>
            </span>
            <span>•</span>
            <span>
              Items: <strong className="text-slate-200">{record.itemCount} SKUs</strong>
            </span>
            <span>•</span>
            <span>
              Total:{" "}
              <strong className="text-emerald-400">
                ₹{record.totalValueInr.toLocaleString("en-IN")}
              </strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer self-end sm:self-auto"
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
};
