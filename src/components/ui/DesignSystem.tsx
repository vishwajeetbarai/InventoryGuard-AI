import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Search,
  X,
  Loader2,
} from "lucide-react";

/**
 * ─────────────────────────────────────────────────────────────
 * 1. UNIFIED STATUS SYSTEM (Section 9 Requirements)
 * ─────────────────────────────────────────────────────────────
 * Standard statuses:
 * - SUCCESS: Healthy, Completed, Ready, Approved
 * - WARNING: Attention, Pending, Watch, Delayed
 * - CRITICAL: Critical, Failed, Stock-out Risk, Unavailable
 * - NEUTRAL: Draft, Not Available, Unknown, Idle
 * - INFO: System, Operational, Reference
 *
 * Never communicates critical state through color alone.
 */
export type StatusType = "SUCCESS" | "WARNING" | "CRITICAL" | "NEUTRAL" | "INFO";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "sm",
  showIcon = true,
  className = "",
}) => {
  const displayLabel = label || status;

  let icon = <CheckCircle2 className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
  let colorClasses =
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20";

  switch (status) {
    case "SUCCESS":
      icon = <CheckCircle2 className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
      colorClasses =
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20";
      break;
    case "WARNING":
      icon = <AlertTriangle className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
      colorClasses =
        "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20";
      break;
    case "CRITICAL":
      icon = <AlertCircle className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
      colorClasses =
        "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20";
      break;
    case "NEUTRAL":
      icon = <Clock className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
      colorClasses =
        "bg-slate-200/80 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-300 dark:border-neutral-700";
      break;
    case "INFO":
      icon = <Info className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
      colorClasses =
        "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
      break;
  }

  const sizeClasses =
    size === "sm" ? "text-[10px] px-2 py-0.5 gap-1.5" : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold rounded-md uppercase tracking-wider select-none shrink-0 ${sizeClasses} ${colorClasses} ${className}`}
    >
      {showIcon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 2. STANDARDIZED BUTTON HIERARCHY (Section 8 Requirements)
 * ─────────────────────────────────────────────────────────────
 * PRIMARY: Main action (Emerald fill)
 * SECONDARY: Supporting action (Border / Slate surface)
 * TERTIARY / OUTLINE: Low emphasis border
 * DANGER: Destructive action (Rose fill)
 * GHOST: Quiet hoverable text button
 */
export type ButtonVariant = "PRIMARY" | "SECONDARY" | "TERTIARY" | "DANGER" | "GHOST";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  variant = "PRIMARY",
  size = "md",
  loading = false,
  icon,
  iconRight,
  disabled,
  className = "",
  ...props
}) => {
  const sizeClasses =
    size === "sm"
      ? "text-xs py-1.5 px-3 gap-1.5 h-8"
      : size === "lg"
      ? "text-sm py-2.5 px-5 gap-2.5 h-11"
      : "text-xs py-2 px-4 gap-2 h-9";

  let variantClasses = "";
  switch (variant) {
    case "PRIMARY":
      variantClasses =
        "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold shadow-xs disabled:bg-emerald-600/50";
      break;
    case "SECONDARY":
      variantClasses =
        "bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 font-semibold shadow-2xs disabled:opacity-50";
      break;
    case "TERTIARY":
      variantClasses =
        "bg-transparent border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 font-medium disabled:opacity-50";
      break;
    case "DANGER":
      variantClasses =
        "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold shadow-xs disabled:bg-rose-600/50";
      break;
    case "GHOST":
      variantClasses =
        "bg-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60 font-medium disabled:opacity-50";
      break;
  }

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 3. STANDARDIZED CARD SYSTEM (Section 10 Requirements)
 * ─────────────────────────────────────────────────────────────
 */
interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  isDark?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  className = "",
  isDark,
  ...props
}) => {
  return (
    <div
      className={`p-5 rounded-xl border transition-colors bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 shadow-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const AppCardHeader: React.FC<{
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, eyebrow, action, icon, className = "" }) => {
  return (
    <div
      className={`flex items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-neutral-800/80 ${className}`}
    >
      <div className="space-y-0.5">
        {eyebrow && (
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {eyebrow}
          </div>
        )}
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-500 dark:text-neutral-400">{icon}</span>}
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 4. STANDARDIZED EMPTY STATE (Section 15 Requirements)
 * ─────────────────────────────────────────────────────────────
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}) => {
  return (
    <div
      className={`py-12 px-4 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center text-slate-400 dark:text-neutral-400 mb-3.5 shadow-2xs">
        {icon || <Info className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
        {title}
      </h4>
      <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed mb-4 max-w-xs">
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-2">
          {actionLabel && onAction && (
            <AppButton variant="PRIMARY" size="sm" onClick={onAction}>
              {actionLabel}
            </AppButton>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <AppButton variant="SECONDARY" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </AppButton>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 5. LOADING SKELETON (Section 14 Requirements)
 * ─────────────────────────────────────────────────────────────
 */
export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-neutral-800 ${className}`}
    />
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 6. STANDARDIZED SEARCH INPUT (Section 13 Requirements)
 * ─────────────────────────────────────────────────────────────
 */
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChangeValue: (val: string) => void;
  placeholder?: string;
  className?: string;
  shortcut?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeValue,
  placeholder = "Search...",
  className = "",
  shortcut,
  ...props
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 dark:text-neutral-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-1.5 rounded-lg border text-xs bg-slate-50 dark:bg-neutral-800/80 border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChangeValue("")}
          className="absolute right-2.5 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 cursor-pointer"
          title="Clear search"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : shortcut ? (
        <span className="absolute right-2.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-neutral-700 text-slate-500 dark:text-neutral-400 pointer-events-none">
          {shortcut}
        </span>
      ) : null}
    </div>
  );
};
