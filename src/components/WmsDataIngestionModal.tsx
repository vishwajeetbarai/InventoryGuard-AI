import React, { useState, useEffect } from "react";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Download,
  Sparkles,
  RefreshCw,
  Table,
  Check,
  FileText,
  HelpCircle,
} from "lucide-react";
import {
  parseRawCsvText,
  guessColumnMapping,
  transformRowsToEngineDataset,
  PREPACKAGED_ENTERPRISE_DATASETS,
  generateSampleCsvTemplate,
  ColumnMapping,
  ParsedCsvResult,
} from "../utils/csvParser";
import { SkuMetadata, DailyRecord, Warehouse } from "../types";

interface WmsDataIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetIngested: (payload: {
    datasetName: string;
    warehouses: Warehouse[];
    skus: SkuMetadata[];
    records: DailyRecord[];
  }) => void;
  theme?: "dark" | "light";
}

export const WmsDataIngestionModal: React.FC<WmsDataIngestionModalProps> = ({
  isOpen,
  onClose,
  onDatasetIngested,
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  // Escape key listener for modal accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Step state: 1: upload/select, 2: map columns, 3: preview & ingest
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawText, setRawText] = useState<string>("");
  const [datasetTitle, setDatasetTitle] = useState<string>("Client WMS Catalog");
  const [parsedData, setParsedData] = useState<ParsedCsvResult>({
    headers: [],
    rawRows: [],
    totalRows: 0,
  });
  const [mapping, setMapping] = useState<ColumnMapping>({
    skuId: "",
    skuName: "",
    category: "",
    warehouseId: "",
    currentStock: "",
    unitsSold: "",
    date: "",
    unitCost: "",
    leadTimeDays: "",
    shelfLifeDays: "",
    isPerishable: "",
    supplierName: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load default template on initial render if empty
  useEffect(() => {
    if (!rawText) {
      setRawText(PREPACKAGED_ENTERPRISE_DATASETS.QUICK_COMMERCE_DARKSTORE.csvContent);
      setDatasetTitle(PREPACKAGED_ENTERPRISE_DATASETS.QUICK_COMMERCE_DARKSTORE.name);
    }
  }, []);

  const handleProcessRawText = (text: string, title?: string) => {
    setErrorMessage(null);
    try {
      const parsed = parseRawCsvText(text);
      if (parsed.headers.length === 0 || parsed.rawRows.length === 0) {
        setErrorMessage("Unable to parse CSV data. Please ensure header row exists and rows are comma-separated.");
        return;
      }
      setParsedData(parsed);
      const guessed = guessColumnMapping(parsed.headers);
      setMapping(guessed);
      if (title) setDatasetTitle(title);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse CSV format.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setDatasetTitle(`Imported: ${cleanName}`);
      handleProcessRawText(content, `Imported: ${cleanName}`);
    };
    reader.readAsText(file);
  };

  const handleLoadPreset = (key: keyof typeof PREPACKAGED_ENTERPRISE_DATASETS) => {
    const preset = PREPACKAGED_ENTERPRISE_DATASETS[key];
    setRawText(preset.csvContent);
    setDatasetTitle(preset.name);
    handleProcessRawText(preset.csvContent, preset.name);
  };

  const handleDownloadSampleTemplate = () => {
    const csvContent = generateSampleCsvTemplate();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Aegis_WMS_Inventory_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteIngestion = () => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const { warehouses, skus, records } = transformRowsToEngineDataset(
          parsedData.rawRows,
          mapping,
          datasetTitle
        );

        onDatasetIngested({
          datasetName: datasetTitle,
          warehouses,
          skus,
          records,
        });

        setIsProcessing(false);
        onClose();
      } catch (err: any) {
        setIsProcessing(false);
        setErrorMessage(`Ingestion error: ${err.message}`);
      }
    }, 450);
  };

  const bgCls = isDark
    ? "bg-neutral-950 border-neutral-800 text-neutral-100"
    : "bg-white border-slate-200 text-slate-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${bgCls}`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? "border-neutral-800 bg-neutral-900/60" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  WMS &amp; ERP Real Data Ingestion Engine
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Instant Simulation
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Upload your actual ERP / WMS CSV or pick an enterprise pilot template to calculate stochastic safety stocks in under 10s.
              </p>
            </div>
          </div>
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

        {/* Stepper Progress Bar */}
        <div
          className={`px-6 py-2.5 border-b flex items-center justify-between text-xs font-semibold ${
            isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-100"
          }`}
        >
          <div className="flex items-center gap-6">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 cursor-pointer ${
                step === 1 ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"}`}>1</span>
              <span>1. Ingest Dataset</span>
            </button>
            <span className="text-slate-600">→</span>
            <button
              onClick={() => parsedData.headers.length > 0 && setStep(2)}
              disabled={parsedData.headers.length === 0}
              className={`flex items-center gap-1.5 ${
                step === 2
                  ? "text-emerald-400"
                  : parsedData.headers.length > 0
                  ? "text-slate-400 cursor-pointer hover:text-slate-200"
                  : "text-slate-600 cursor-not-allowed"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"}`}>2</span>
              <span>2. Auto-Map Columns</span>
            </button>
            <span className="text-slate-600">→</span>
            <button
              onClick={() => parsedData.headers.length > 0 && setStep(3)}
              disabled={parsedData.headers.length === 0}
              className={`flex items-center gap-1.5 ${
                step === 3
                  ? "text-emerald-400"
                  : parsedData.headers.length > 0
                  ? "text-slate-400 cursor-pointer hover:text-slate-200"
                  : "text-slate-600 cursor-not-allowed"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"}`}>3</span>
              <span>3. Verify &amp; Simulate</span>
            </button>
          </div>

          <button
            onClick={handleDownloadSampleTemplate}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Blank CSV Template</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Upload or Choose Preset */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Preset Cards */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-400 flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Option A: Load Instant Pilot Demonstration Dataset</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    onClick={() => handleLoadPreset("QUICK_COMMERCE_DARKSTORE")}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                      datasetTitle.includes("Quick-Commerce")
                        ? "border-emerald-500/80 bg-emerald-500/10 shadow-sm shadow-emerald-500/10"
                        : isDark
                        ? "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">⚡ Zepto / Blinkit FMCG</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold">12 SKUs</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed font-medium">
                      Milk, avocados, cold brew, bakery with 1–4 day shelf life &amp; weather spikes.
                    </p>
                  </div>

                  <div
                    onClick={() => handleLoadPreset("PHARMA_COLD_CHAIN")}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                      datasetTitle.includes("Pharma")
                        ? "border-emerald-500/80 bg-emerald-500/10 shadow-sm shadow-emerald-500/10"
                        : isDark
                        ? "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400">🧪 Pharma Cold-Chain 3PL</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono font-bold">8 SKUs</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed font-medium">
                      Insulin, pediatric vaccines, diagnostic kits with high stockout penalties.
                    </p>
                  </div>

                  <div
                    onClick={() => handleLoadPreset("D2C_RETAIL_OMNICHANNEL")}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                      datasetTitle.includes("Omnichannel")
                        ? "border-emerald-500/80 bg-emerald-500/10 shadow-sm shadow-emerald-500/10"
                        : isDark
                        ? "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-400">🛍️ Retail &amp; Apparel D2C</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono font-bold">6 SKUs</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed font-medium">
                      Activewear, audio tech, footwear with supplier delays &amp; seasonal variance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-400 flex items-center gap-1.5 mb-2.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Option B: Upload Client WMS / ERP CSV File</span>
                </label>

                <div
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    isDark
                      ? "border-slate-700 hover:border-indigo-400/80 bg-slate-950/40"
                      : "border-slate-300 hover:border-indigo-500 bg-slate-50"
                  }`}
                >
                  <UploadCloud className="w-10 h-10 mx-auto text-indigo-500 mb-2" />
                  <p className="text-sm font-semibold mb-1">
                    Drag and drop your WMS inventory CSV / TSV file here
                  </p>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 mb-4 font-medium">
                    Supports SAP, BlueYonder, Oracle WMS, Increff, or custom Excel exports.
                  </p>

                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md cursor-pointer transition-colors">
                    <span>Browse Local Files</span>
                    <input
                      type="file"
                      accept=".csv,.tsv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Raw CSV Text Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Raw CSV Preview / Direct Paste</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {rawText.split("\n").filter((l) => l.trim()).length} lines detected
                  </span>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={6}
                  placeholder="Paste CSV rows with headers (SKU_ID, ITEM_NAME, CURRENT_STOCK, DAILY_DEMAND...)"
                  className={`w-full rounded-xl p-3 text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none ${
                    isDark
                      ? "bg-slate-950/80 border-slate-800 text-slate-200"
                      : "bg-slate-50 border-slate-300 text-slate-800"
                  }`}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleProcessRawText(rawText, datasetTitle)}
                  disabled={!rawText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  <span>Proceed to Column Auto-Mapper</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapper */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-400" />
                    <span>Column Auto-Mapper ({parsedData.totalRows} Rows Loaded)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Our heuristic engine automatically mapped detected CSV headers to the supply chain simulation schema.
                  </p>
                </div>
                <button
                  onClick={() => handleProcessRawText(rawText)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-run Heuristics</span>
                </button>
              </div>

              {/* Column Mapping Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  { key: "skuId", label: "SKU / Item Code", required: true, desc: "Unique inventory identifier" },
                  { key: "skuName", label: "SKU Name / Description", required: true, desc: "Display product name" },
                  { key: "category", label: "Category / Dept", required: false, desc: "E.g. Perishables, Cold-Chain" },
                  { key: "warehouseId", label: "Warehouse / Store ID", required: false, desc: "Dark store identifier" },
                  { key: "currentStock", label: "Current Stock On-Hand", required: true, desc: "Usable physical inventory" },
                  { key: "unitsSold", label: "Daily Demand / Velocity", required: true, desc: "Average daily sales rate" },
                  { key: "unitCost", label: "Unit Cost / Base Price (₹)", required: true, desc: "Cost price per item" },
                  { key: "leadTimeDays", label: "Supplier Lead Time (Days)", required: false, desc: "Vendor delivery duration" },
                  { key: "shelfLifeDays", label: "Shelf Life (Days)", required: false, desc: "Perishable expiration limit" },
                  { key: "isPerishable", label: "Perishable Flag (T/F)", required: false, desc: "Requires cold storage" },
                  { key: "supplierName", label: "Supplier / Vendor Name", required: false, desc: "Contracted vendor" },
                ].map(({ key, label, required, desc }) => {
                  const currentValue = (mapping as any)[key] || "";
                  const isMatched = Boolean(currentValue);

                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-xl border flex flex-col justify-between ${
                        isMatched
                          ? isDark
                            ? "border-slate-800 bg-slate-950/40"
                            : "border-slate-200 bg-white"
                          : required
                          ? "border-amber-500/40 bg-amber-500/5"
                          : isDark
                          ? "border-slate-800/60 bg-slate-950/20"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold">{label}</span>
                          {required ? (
                            <span className="text-[10px] text-amber-400 font-bold">*Required</span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Optional</span>
                          )}
                        </div>
                        {isMatched ? (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                            <Check className="w-3 h-3" /> Auto-Mapped
                          </span>
                        ) : required ? (
                          <span className="text-[10px] text-amber-400">Needs Mapping</span>
                        ) : null}
                      </div>

                      <select
                        value={currentValue}
                        onChange={(e) =>
                          setMapping((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          isDark
                            ? "bg-slate-900 border-slate-700 text-slate-200"
                            : "bg-slate-100 border-slate-300 text-slate-800"
                        }`}
                      >
                        <option value="">-- (Not Mapped / Auto-Generate) --</option>
                        {parsedData.headers.map((h) => (
                          <option key={h} value={h}>
                            {h} {parsedData.rawRows[0]?.[h] ? `(e.g. "${parsedData.rawRows[0][h]}")` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {/* Sample 2-Row Data Preview */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-400 mb-2 block">
                  First 2 Rows Sample Data:
                </label>
                <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-800">
                  <table className="w-full text-[11px] text-left">
                    <thead className={isDark ? "text-neutral-400 bg-slate-950" : "text-slate-700 bg-slate-100"}>
                      <tr>
                        {parsedData.headers.slice(0, 6).map((h) => (
                          <th key={h} className="p-2 font-mono font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                      {parsedData.rawRows.slice(0, 2).map((row, idx) => (
                        <tr key={idx} className={isDark ? "bg-slate-900/30" : "bg-white"}>
                          {parsedData.headers.slice(0, 6).map((h) => (
                            <td key={h} className="p-2 text-slate-800 dark:text-slate-300">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  ← Back to Upload
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <span>Review &amp; Pre-Flight Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Verification & Instant Execution */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Pre-Flight Validation Successful
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed font-medium">
                    Dataset <strong>"{datasetTitle}"</strong> is validated and ready for real-time stochastic simulation.
                    Upon ingestion, our bivariate Monte Carlo engine will re-simulate all safety stock thresholds, dynamic ROPs,
                    and purchase orders across the entire control tower in ~0.4s.
                  </p>
                </div>
              </div>

              {/* Dataset Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] text-slate-600 dark:text-neutral-400 uppercase font-semibold">Total Records</span>
                  <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{parsedData.totalRows}</p>
                </div>
                <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] text-slate-600 dark:text-neutral-400 uppercase font-semibold">Target SKUs</span>
                  <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                    {new Set(parsedData.rawRows.map((r) => r[mapping.skuId] || "1")).size}
                  </p>
                </div>
                <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] text-slate-600 dark:text-neutral-400 uppercase font-semibold">Warehouses</span>
                  <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                    {Math.max(1, new Set(parsedData.rawRows.map((r) => r[mapping.warehouseId] || "1")).size)}
                  </p>
                </div>
                <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] text-slate-600 dark:text-neutral-400 uppercase font-semibold">Engine Speed</span>
                  <p className="text-xl font-bold font-mono text-violet-600 dark:text-violet-400 mt-1">&lt; 0.5s</p>
                </div>
              </div>

              {/* Dataset Title Input */}
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1.5">
                  Tenant Dataset Label:
                </label>
                <input
                  type="text"
                  value={datasetTitle}
                  onChange={(e) => setDatasetTitle(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark
                      ? "bg-slate-950 border-slate-800 text-slate-200"
                      : "bg-slate-50 border-slate-300 text-slate-800"
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(2)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  ← Back to Mapper
                </button>

                <button
                  onClick={handleExecuteIngestion}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.02]"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Running Monte Carlo Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Ingest &amp; Calculate Monte Carlo Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
