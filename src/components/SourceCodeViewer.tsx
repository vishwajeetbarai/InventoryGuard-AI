import React, { useState } from "react";
import { Copy, Check, Download, Terminal, Code2, FileText, BookOpen } from "lucide-react";

interface SourceCodeViewerProps {
  appPyCode: string;
  requirementsTxt: string;
  readmeContent: string;
}

export const SourceCodeViewer: React.FC<SourceCodeViewerProps> = ({
  appPyCode,
  requirementsTxt,
  readmeContent,
}) => {
  const [activeTab, setActiveTab] = useState<"appPy" | "requirements" | "readme">("appPy");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Quickstart Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-500/20 text-indigo-400">
                <Terminal className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Production Python Streamlit Deliverable Ready
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              100% executable single-file Streamlit application with Scikit-Learn GradientBoostingRegressor,
              in-memory synthetic multi-SKU data generator, and bivariate Monte Carlo joint risk engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload(appPyCode, "app.py", "text/x-python")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download app.py</span>
            </button>
            <button
              onClick={() => handleDownload(requirementsTxt, "requirements.txt", "text/plain")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>requirements.txt</span>
            </button>
          </div>
        </div>

        {/* Quickstart Command Box */}
        <div className="mt-4 p-3 rounded-lg bg-black/60 border border-slate-800 flex items-center justify-between">
          <div className="font-mono text-xs text-indigo-300 flex items-center gap-2 overflow-x-auto">
            <span className="text-slate-500 select-none">$</span>
            <span>pip install -r requirements.txt &amp;&amp; streamlit run app.py</span>
          </div>
          <button
            onClick={() =>
              handleCopy(
                "pip install -r requirements.txt && streamlit run app.py",
                "cmd"
              )
            }
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            title="Copy terminal command"
          >
            {copiedKey === "cmd" ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("appPy")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "appPy"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>app.py (Streamlit App)</span>
            </button>

            <button
              onClick={() => setActiveTab("requirements")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "requirements"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>requirements.txt</span>
            </button>

            <button
              onClick={() => setActiveTab("readme")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "readme"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>README.md (Architecture &amp; Docs)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const text =
                  activeTab === "appPy"
                    ? appPyCode
                    : activeTab === "requirements"
                    ? requirementsTxt
                    : readmeContent;
                handleCopy(text, activeTab);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition-colors"
            >
              {copiedKey === activeTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto max-h-[600px] bg-slate-950 font-mono text-xs leading-relaxed text-slate-300">
          <pre>
            {activeTab === "appPy" && appPyCode}
            {activeTab === "requirements" && requirementsTxt}
            {activeTab === "readme" && readmeContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
