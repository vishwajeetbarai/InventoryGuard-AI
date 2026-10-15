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
  Send,
  Zap,
  Globe,
  Loader2,
  CheckCircle2,
  KeyRound,
  Code2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  dispatchRealOutboundWebhook,
  getHmacVerificationSnippets,
  WebhookDispatchResult,
} from "../utils/cryptoWebhook";

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
  const [activeTab, setActiveTab] = useState<"json" | "edi" | "tester" | "verify">("tester");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Real Outbound Webhook State
  const [customEndpointUrl, setCustomEndpointUrl] = useState(
    "https://httpbin.org/post"
  );
  const [hmacSecret, setHmacSecret] = useState("aegis_sec_live_9f81a7b2c4e5d6");
  const [showSecret, setShowSecret] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<WebhookDispatchResult | null>(null);

  const verificationSnippets = getHmacVerificationSnippets(hmacSecret);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRealDispatch = async () => {
    setIsPinging(true);
    setDispatchResult(null);

    try {
      const result = await dispatchRealOutboundWebhook(
        customEndpointUrl,
        record.rawJsonPayload,
        hmacSecret,
        record.warehouseId,
        "purchase_order.dispatched"
      );
      setDispatchResult(result);
    } catch (err: any) {
      console.error("Outbound dispatch failed:", err);
    } finally {
      setIsPinging(false);
    }
  };

  const bgCls = isDark
    ? "bg-slate-900 border-slate-700/80 text-slate-100"
    : "bg-white border-slate-300 text-slate-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${bgCls}`}
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
                  ERP Webhook Dispatch &amp; Live HTTPS Delivery Engine
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  HTTP {record.httpStatus} DISPATCHED
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
              HMAC-SHA256 Digest:
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
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab("tester")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "tester"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Send className="w-3.5 h-3.5 text-indigo-300" />
              <span>True HTTPS Dispatcher</span>
            </button>

            <button
              onClick={() => setActiveTab("json")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "json"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-950 font-medium"
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
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-950 font-medium"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ANSI X12 EDI 850 Segment</span>
            </button>

            <button
              onClick={() => setActiveTab("verify")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "verify"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-950 font-medium"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>HMAC Verify Code (SDK)</span>
            </button>
          </div>

          {activeTab !== "tester" && activeTab !== "verify" && (
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
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Payload</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Modal Content Body */}
        {activeTab === "tester" ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Live Webhook Dispatch Card */}
            <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <label className={`font-bold flex items-center gap-1.5 ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span>Live Target Webhook Endpoint (HTTPS POST)</span>
                </label>

                {/* Presets */}
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>Live Test Presets:</span>
                  <button
                    onClick={() => setCustomEndpointUrl("https://httpbin.org/post")}
                    className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer font-bold"
                    title="Live Public Reflector (Returns 200 OK + reflects full HMAC headers)"
                  >
                    httpbin.org (Recommended)
                  </button>
                  <span className="text-slate-400">·</span>
                  <button
                    onClick={() => setCustomEndpointUrl("https://webhook.site/inventoryguard-live-test")}
                    className="text-[10px] text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer font-bold"
                  >
                    webhook.site
                  </button>
                  <span className="text-slate-400">·</span>
                  <button
                    onClick={() => setCustomEndpointUrl("https://hooks.slack.com/services/T00/B00/XXXX")}
                    className="text-[10px] text-purple-700 dark:text-purple-400 hover:underline cursor-pointer font-bold"
                  >
                    Slack Webhook
                  </button>
                </div>
              </div>

              {/* Endpoint URL Input */}
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  value={customEndpointUrl}
                  onChange={(e) => setCustomEndpointUrl(e.target.value)}
                  placeholder="https://your-domain.com/webhooks/purchase-orders"
                  className={`flex-1 px-3 py-2 rounded-lg font-mono text-xs border focus:outline-none focus:border-emerald-500 ${
                    isDark
                      ? "bg-slate-900 border-slate-700 text-slate-100"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
                <button
                  onClick={handleRealDispatch}
                  disabled={isPinging || !customEndpointUrl.trim()}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/30 disabled:opacity-60 whitespace-nowrap"
                >
                  {isPinging ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending POST...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Dispatch Real HTTPS POST</span>
                    </>
                  )}
                </button>
              </div>

              {/* HMAC Secret Config */}
              <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] text-slate-400">HMAC-SHA256 Signing Secret:</span>
                  <input
                    type={showSecret ? "text" : "password"}
                    value={hmacSecret}
                    onChange={(e) => setHmacSecret(e.target.value)}
                    className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-900 border border-slate-800 text-amber-300 w-48 sm:w-64"
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showSecret ? "Hide" : "Reveal"}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Header: X-Aegis-Signature: sha256=...
                </span>
              </div>
            </div>

            {/* Live Dispatch Results Display */}
            {dispatchResult && (
              <div
                className={`p-4 rounded-xl border animate-in fade-in duration-200 ${
                  dispatchResult.success
                    ? isDark
                      ? "bg-slate-950/80 border-emerald-500/40"
                      : "bg-white border-emerald-300 shadow-sm"
                    : isDark
                    ? "bg-slate-950/80 border-amber-500/40"
                    : "bg-white border-amber-300 shadow-sm"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-3 border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    {dispatchResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="font-bold text-slate-200">
                      {dispatchResult.httpStatus ? `HTTP ${dispatchResult.httpStatus} ${dispatchResult.statusText}` : dispatchResult.statusText}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        dispatchResult.success
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {dispatchResult.latencyMs}ms Latency
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Delivery ID: {dispatchResult.deliveryId}
                  </span>
                </div>

                {/* Headers Sent */}
                <div className="space-y-3 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 font-sans font-semibold uppercase text-[10px] tracking-wider block mb-1">
                      Outbound Headers Sent (With Real Cryptographic Signature)
                    </span>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5 text-slate-300">
                      {Object.entries(dispatchResult.requestHeaders).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-emerald-400 font-semibold">{key}:</span>
                          <span className="text-slate-300 break-all">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Response Body */}
                  <div>
                    <span className="text-slate-400 font-sans font-semibold uppercase text-[10px] tracking-wider block mb-1">
                      Server Response Body
                    </span>
                    <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 overflow-x-auto max-h-48 leading-relaxed">
                      {dispatchResult.responseBody}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "verify" ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
            <div>
              <h4 className="text-sm font-sans font-bold text-slate-200 mb-1">
                Recipient Webhook Signature Verification SDK
              </h4>
              <p className="text-slate-400 font-sans text-xs mb-3">
                When your ERP or custom microservice receives the webhook, verify the HMAC-SHA256 signature using your shared secret key:
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-400 block mb-1">Python (FastAPI / Flask / Django)</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 overflow-x-auto">
                  {verificationSnippets.python}
                </pre>
              </div>

              <div>
                <span className="text-[11px] font-bold text-emerald-400 block mb-1">Node.js (Express / Next.js / AWS Lambda)</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 overflow-x-auto">
                  {verificationSnippets.node}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 bg-slate-950 font-mono text-xs leading-relaxed text-slate-300">
            <pre className="overflow-x-auto selection:bg-indigo-500 selection:text-white">
              {activeTab === "json" && record.rawJsonPayload}
              {activeTab === "edi" && record.edi850Payload}
            </pre>
          </div>
        )}

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
