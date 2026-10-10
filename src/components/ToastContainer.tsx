import React, { useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Send,
  ArrowRightLeft,
  X,
  FileSpreadsheet,
} from "lucide-react";

export interface ToastItem {
  id: string;
  type: "success" | "info" | "warning" | "dispatch" | "transfer" | "export";
  title: string;
  message: string;
  timestamp: string;
  meta?: {
    code?: string;
    hash?: string;
    latency?: string;
    units?: number;
  };
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  theme: "dark" | "light";
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  theme,
}) => {
  const isDark = theme === "dark";

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          isDark={isDark}
        />
      ))}
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  isDark: boolean;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss, isDark }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4500);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case "dispatch":
        return <Send className="w-4 h-4 text-indigo-400" />;
      case "transfer":
        return <ArrowRightLeft className="w-4 h-4 text-emerald-400" />;
      case "export":
        return <FileSpreadsheet className="w-4 h-4 text-sky-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "info":
        return <Info className="w-4 h-4 text-sky-400" />;
      case "success":
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "dispatch":
        return "border-indigo-500/40 shadow-indigo-500/10";
      case "transfer":
        return "border-emerald-500/40 shadow-emerald-500/10";
      case "export":
        return "border-sky-500/40 shadow-sky-500/10";
      case "warning":
        return "border-amber-500/40 shadow-amber-500/10";
      default:
        return "border-slate-700/60 shadow-slate-900/20";
    }
  };

  return (
    <div
      role="status"
      className={`pointer-events-auto rounded-xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${getBorderColor()} ${
        isDark
          ? "bg-slate-900/90 text-slate-100"
          : "bg-white/95 text-slate-900 border-slate-300 shadow-slate-300/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
            isDark ? "bg-slate-800" : "bg-slate-100"
          }`}
        >
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold truncate">{toast.title}</h4>
            <span
              className={`text-[10px] shrink-0 ${
                isDark ? "text-slate-400" : "text-slate-400"
              }`}
            >
              {toast.timestamp}
            </span>
          </div>

          <p
            className={`text-xs mt-1 leading-relaxed ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {toast.message}
          </p>

          {toast.meta && (
            <div className="mt-2 pt-2 border-t border-slate-700/40 flex flex-wrap items-center gap-2 text-[10px] font-mono">
              {toast.meta.code && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/30">
                  {toast.meta.code}
                </span>
              )}
              {toast.meta.hash && (
                <span
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 truncate max-w-[150px]"
                  title={toast.meta.hash}
                >
                  SHA-256: {toast.meta.hash.slice(0, 8)}...
                </span>
              )}
              {toast.meta.latency && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                  ⚡ {toast.meta.latency}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
            isDark
              ? "text-slate-400 hover:text-white hover:bg-slate-800"
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          }`}
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
