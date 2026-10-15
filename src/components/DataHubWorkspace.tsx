import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  FileText,
  Table,
  Layers,
  Database,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  Sparkles,
  Lock,
  ExternalLink,
} from "lucide-react";
import {
  parseRawCsvText,
  guessColumnMapping,
  transformRowsToEngineDataset,
  PREPACKAGED_ENTERPRISE_DATASETS,
  generateSampleCsvTemplate,
  ParsedCsvResult,
} from "../utils/csvParser";
import { SkuMetadata, DailyRecord, Warehouse, CurrencyCode } from "../types";
import { AuditLogEntry } from "../types/auth";
import { CustomDatasetPayload } from "../services/storageService";
import { formatCurrency } from "../utils/currency";

interface IngestPayload {
  datasetName: string;
  warehouses: Warehouse[];
  skus: SkuMetadata[];
  records: DailyRecord[];
}

interface DataHubWorkspaceProps {
  customDataset: CustomDatasetPayload | null;
  effectiveWarehouses: Warehouse[];
  effectiveSkus: SkuMetadata[];
  onDatasetIngested: (payload: IngestPayload) => void;
  onResetCustomDataset: () => void;
  onOpenIngestionWizard: () => void;
  onDownloadCsv: () => void;
  auditLogs: AuditLogEntry[];
  onOpenAuditModal: () => void;
  currency?: CurrencyCode;
  theme?: "dark" | "light";
}

export const DataHubWorkspace: React.FC<DataHubWorkspaceProps> = ({
  customDataset,
  effectiveWarehouses,
  effectiveSkus,
  onDatasetIngested,
  onResetCustomDataset,
  onOpenIngestionWizard,
  onDownloadCsv,
  auditLogs,
  onOpenAuditModal,
  currency = "USD",
  theme = "light",
}) => {
  const isDark = theme === "dark";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "parsing" | "preview" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [stagedParsed, setStagedParsed] = useState<ParsedCsvResult | null>(null);
  const [stagedFileName, setStagedFileName] = useState<string>("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // File drop handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".tsv") && !file.name.endsWith(".txt")) {
      setErrorMessage("Unsupported file format. Please upload a standard CSV or TSV file.");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("parsing");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || !text.trim()) {
          setErrorMessage("The uploaded file is empty.");
          setUploadStatus("error");
          return;
        }

        const parsed = parseRawCsvText(text);
        if (parsed.headers.length === 0 || parsed.rawRows.length === 0) {
          setErrorMessage(
            "Could not parse valid CSV headers or rows. Please check file format."
          );
          setUploadStatus("error");
          return;
        }

        setStagedParsed(parsed);
        setStagedFileName(file.name.replace(/\.[^/.]+$/, ""));
        setUploadStatus("preview");
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to parse CSV file.");
        setUploadStatus("error");
      }
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read file contents.");
      setUploadStatus("error");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleApplyStagedDataset = () => {
    if (!stagedParsed) return;
    try {
      const mapping = guessColumnMapping(stagedParsed.headers);
      const dataset = transformRowsToEngineDataset(
        stagedParsed.rawRows,
        mapping,
        stagedFileName || "Uploaded Enterprise Catalog"
      );

      onDatasetIngested({
        datasetName: stagedFileName || "Uploaded Enterprise Catalog",
        warehouses: dataset.warehouses,
        skus: dataset.skus,
        records: dataset.records,
      });

      setSuccessMessage(
        `Successfully integrated ${dataset.skus.length} SKUs across ${dataset.warehouses.length} facility nodes.`
      );
      setUploadStatus("success");
      setStagedParsed(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Error transforming rows into engine format.");
      setUploadStatus("error");
    }
  };

  const handleLoadPrepackaged = (key: keyof typeof PREPACKAGED_ENTERPRISE_DATASETS) => {
    const ds = PREPACKAGED_ENTERPRISE_DATASETS[key];
    const parsed = parseRawCsvText(ds.csvContent);
    const mapping = guessColumnMapping(parsed.headers);
    const transformed = transformRowsToEngineDataset(parsed.rawRows, mapping, ds.name);

    onDatasetIngested({
      datasetName: ds.name,
      warehouses: transformed.warehouses,
      skus: transformed.skus,
      records: transformed.records,
    });

    setSuccessMessage(`Loaded ${ds.name} successfully.`);
    setUploadStatus("success");
  };

  const handleDownloadSample = () => {
    const csvContent = generateSampleCsvTemplate();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "InventoryGuard_WMS_Sample_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCustomActive = Boolean(customDataset);

  return (
    <div className="space-y-6">
      {/* Top Header & Dataset Status Banner */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isDark
            ? "bg-neutral-900 border-neutral-800 text-neutral-100"
            : "bg-white border-slate-200/90 shadow-xs text-slate-900"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                Enterprise Data Hub &amp; Ingestion Center
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 font-medium">
              Manage live inventory feeds, upload custom WMS CSV datasets, preview raw records, and review cryptographic compliance logs.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleDownloadSample}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isDark
                  ? "border-neutral-700 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200"
                  : "border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample Template</span>
            </button>

            <button
              onClick={onOpenIngestionWizard}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Full Ingestion Wizard</span>
            </button>
          </div>
        </div>

        {/* Dataset Status Banner */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-950/60 border border-slate-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isCustomActive
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-indigo-500"
              }`}
            />
            <div>
              <div className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                Active Catalog Mode:
              </div>
              <div className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span>
                  {isCustomActive
                    ? `Custom Ingested: ${customDataset?.name}`
                    : "Baseline Quick-Commerce Dark Store Sandbox"}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    isCustomActive
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                  }`}
                >
                  {isCustomActive ? "USER DATASET" : "SANDBOX DEFAULT"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCustomActive && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Sandbox</span>
              </button>
            )}
            <button
              onClick={onDownloadCsv}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isDark
                  ? "border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                  : "border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md p-6 rounded-2xl border shadow-xl ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                Revert to Baseline Sandbox?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              This will remove the currently ingested custom dataset (
              <strong>{customDataset?.name}</strong>) and restore the default 12-SKU Quick-Commerce catalog across Mumbai, Bangalore, and Delhi.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowResetConfirm(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  isDark
                    ? "border-neutral-700 hover:bg-neutral-800 text-neutral-300"
                    : "border-slate-300 hover:bg-slate-100 text-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResetCustomDataset();
                  setShowResetConfirm(false);
                  setSuccessMessage("Reverted to baseline sandbox catalog.");
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Upload Area & Quick Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Drag & Drop Ingestion Zone */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className={`p-6 rounded-2xl border transition-all ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-500" />
                <span>Drag &amp; Drop CSV File Ingestion</span>
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                UTF-8 .CSV or .TSV supported
              </span>
            </div>

            {/* Drop Zone Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/10"
                  : isDark
                  ? "border-neutral-700 hover:border-emerald-500/60 bg-neutral-950/40"
                  : "border-slate-300 hover:border-emerald-500/60 bg-slate-50/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                Drag and drop your enterprise WMS CSV catalog here
              </p>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                or click anywhere to browse from your local device
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-700 dark:text-neutral-300 font-semibold">
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 font-mono">
                  sku_id
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 font-mono">
                  sku_name
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 font-mono">
                  stock
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 font-mono">
                  units_sold
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 font-mono">
                  unit_cost
                </span>
              </div>
            </div>

            {/* Parsing State Indicator */}
            {uploadStatus === "parsing" && (
              <div className="mt-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-2 font-medium">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Parsing CSV headers and validating schema...</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Staged File Preview & Quick Ingestion */}
            {uploadStatus === "preview" && stagedParsed && (
              <div className="mt-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                      <span>{stagedFileName}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                      {stagedParsed.totalRows} rows detected &bull;{" "}
                      {stagedParsed.headers.length} columns (
                      {stagedParsed.headers.slice(0, 4).join(", ")}...)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setStagedParsed(null);
                        setUploadStatus("idle");
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleApplyStagedDataset}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Import &amp; Ingest Now</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Prepackaged Quick Scenarios */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className={`p-6 rounded-2xl border transition-all ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Prepackaged Industry Datasets</span>
              </h3>
              <span className="text-[10px] uppercase font-bold text-indigo-500">
                1-Click Load
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mb-4 leading-relaxed font-medium">
              Instantly test the engine with pre-calibrated enterprise supply-chain datasets:
            </p>

            <div className="space-y-2.5">
              {/* 1. Quick Commerce Dark Store */}
              <button
                onClick={() => handleLoadPrepackaged("QUICK_COMMERCE_DARKSTORE")}
                className={`w-full p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  isDark
                    ? "bg-neutral-950 border-neutral-800 hover:border-emerald-500/70 hover:bg-neutral-900"
                    : "bg-slate-50 border-slate-200 hover:border-emerald-500/70 hover:bg-emerald-50/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    🛒 Quick-Commerce Dark Store
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                    12 SKUs &bull; Fresh
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  High velocity perishable groceries, dairy batches, and 10-minute delivery SLA.
                </p>
              </button>

              {/* 2. Omnichannel Retail */}
              <button
                onClick={() => handleLoadPrepackaged("D2C_RETAIL_OMNICHANNEL")}
                className={`w-full p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  isDark
                    ? "bg-neutral-950 border-neutral-800 hover:border-indigo-500/70 hover:bg-neutral-900"
                    : "bg-slate-50 border-slate-200 hover:border-indigo-500/70 hover:bg-indigo-50/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    📱 Omnichannel Consumer Electronics
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                    High Unit Cost
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Expensive SKU portfolio with volatile import lead times and high stockout penalties.
                </p>
              </button>

              {/* 3. FMCG Perishables */}
              <button
                onClick={() => handleLoadPrepackaged("PHARMA_COLD_CHAIN")}
                className={`w-full p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  isDark
                    ? "bg-neutral-950 border-neutral-800 hover:border-sky-500/70 hover:bg-neutral-900"
                    : "bg-slate-50 border-slate-200 hover:border-sky-500/70 hover:bg-sky-50/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    ❄️ Cold-Chain &amp; Pharmaceuticals
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">
                    Batch Expiry
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Strict temperature-sensitive cold chain items with mandatory shelf-life degradation curves.
                </p>
              </button>
            </div>
          </div>

          {/* Cryptographic Ledger Card */}
          <div
            className={`p-5 rounded-2xl border transition-colors ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-950 dark:text-white">
                    Compliance Audit Trail
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                    {auditLogs.length} verified cryptographic ledger entries
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenAuditModal}
                className="px-3 py-1.5 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                View Ledger
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-600 dark:text-neutral-400">
              Latest Event:{" "}
              <span className="font-mono text-slate-900 dark:text-white font-bold">
                {auditLogs[0]?.details || "System initialized"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Dataset Schema Preview Table */}
      <div
        className={`rounded-2xl border transition-colors overflow-hidden ${
          isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200/90 shadow-xs"
        }`}
      >
        <div className="p-5 border-b border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-950 dark:text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-500" />
              <span>Active Catalog Data &amp; Schema Preview</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-0.5">
              Showing active SKU metadata loaded in memory ({effectiveSkus.length} catalog items across {effectiveWarehouses.length} facilities)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-neutral-400">
            <span>{effectiveSkus.length} SKUs</span>
            <span>&bull;</span>
            <span>{effectiveWarehouses.length} Facilities</span>
          </div>
        </div>

        {/* Responsive Table with comfortable spacing and clear hierarchy */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b text-[11px] uppercase tracking-wider font-bold ${
                  isDark
                    ? "bg-neutral-950/60 border-neutral-800 text-neutral-400"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <th className="py-3 px-4">SKU ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Base Price</th>
                <th className="py-3 px-4 text-right">Lead Time</th>
                <th className="py-3 px-4">Perishable / Shelf Life</th>
                <th className="py-3 px-4">Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
              {effectiveSkus.slice(0, 10).map((sku) => (
                <tr
                  key={sku.id}
                  className={`transition-colors ${
                    isDark
                      ? "hover:bg-neutral-800/40 text-neutral-300"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {sku.id}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    {sku.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
                      {sku.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium">
                    {formatCurrency(sku.basePrice, currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {sku.leadTimeMean} days
                  </td>
                  <td className="py-3 px-4">
                    {sku.isPerishable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <span>⏳</span> {sku.shelfLifeDays}d Shelf-life
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400">
                        Non-perishable
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600 dark:text-neutral-400">
                    {sku.supplierName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
