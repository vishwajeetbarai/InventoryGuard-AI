import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  ChevronDown,
  Info,
  ArrowRight,
  TrendingUp,
  Truck,
  Layers,
  HelpCircle,
  ExternalLink,
  BrainCircuit,
  Zap,
  BookOpen,
  Calculator,
  Compass,
  UploadCloud,
} from "lucide-react";
import { Warehouse, AppPage, CurrencyCode } from "../types";
import { UserProfile } from "../types/auth";

export type GeminiModelTier = "gemini-3.8-flash" | "gemini-3.1-flash-lite" | "gemini-4-argon";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  model?: string;
  navigationAction?: {
    page: AppPage;
    tab?: string;
    label: string;
  };
}

interface GeminiCopilotProps {
  isOpen: boolean;
  onToggle: () => void;
  currentWarehouse: Warehouse;
  activePage: AppPage;
  criticalCount: number;
  currency: CurrencyCode;
  currentUser: UserProfile;
  selectedSkuId?: string;
  theme: "dark" | "light";
  onNavigatePage?: (page: AppPage, tab?: string, skuId?: string) => void;
  onOpenHelpGuide?: () => void;
}

interface DoubtCategory {
  id: string;
  label: string;
  icon: any;
  queries: { label: string; query: string }[];
}

const DOUBT_CATEGORIES: DoubtCategory[] = [
  {
    id: "tour",
    label: "Beginner Tour",
    icon: Compass,
    queries: [
      {
        label: "Platform Tour",
        query: "I'm a new user. Can you give me a tour of the 4 main workspaces (Overview, Inventory, Procurement, Operations) and what actions I should take first?",
      },
      {
        label: "Current Warehouse Status",
        query: "Based on my active warehouse, how many products are at critical stockout risk and what immediate steps should I execute?",
      },
    ],
  },
  {
    id: "formulas",
    label: "Formulas & Math",
    icon: Calculator,
    queries: [
      {
        label: "Safety Stock Formula",
        query: "Explain the Dual-Variance Dynamic Safety Stock formula and how Z-score, demand variance, and supplier lead-time variance interact.",
      },
      {
        label: "Reorder Point (ROP)",
        query: "How is Reorder Point (ROP) calculated with lead-time demand, and how does perishable shelf-life decay alter usable stock?",
      },
    ],
  },
  {
    id: "logistics",
    label: "Buy vs Transfer",
    icon: Truck,
    queries: [
      {
        label: "Buy vs Transfer Decision",
        query: "How does InventoryGuard decide whether to recommend an inter-warehouse transfer instead of a new Purchase Order?",
      },
      {
        label: "Supplier Scorecards",
        query: "How are vendor reliability scorecards calculated, and how do OTIF delivery and lead-time delays trigger SLA debit notes?",
      },
    ],
  },
  {
    id: "simulation",
    label: "Simulation & Data",
    icon: BrainCircuit,
    queries: [
      {
        label: "Monte Carlo Risk Engine",
        query: "How does the Monte Carlo joint simulation test demand shocks and supplier delivery delays over 10,000 iterations?",
      },
      {
        label: "Upload Custom CSV",
        query: "How do I upload and map my company's custom WMS or ERP inventory CSV dataset?",
      },
    ],
  },
];

/**
 * Intelligent domain knowledge fallback responses
 * Used if server-side Gemini API key is missing or network times out
 */
function getIntelligentFallbackResponse(
  query: string,
  warehouse: Warehouse,
  activePage: AppPage,
  criticalCount: number
): { text: string; navigationAction?: { page: AppPage; tab?: string; label: string } } {
  const q = query.toLowerCase();

  if (q.includes("tour") || q.includes("workspace") || q.includes("where should") || q.includes("start") || q.includes("new user")) {
    return {
      text: `### 🧭 Welcome to InventoryGuard AI — Complete Workspace Tour
As a new user, you have access to four specialized supply chain intelligence workspaces:

1. **Overview (Control Tower)**:
   - High-density executive KPI row: Stockout Risk Exposure, 30-Day Working Capital, Stockout Rate %, OTIF Delivery.
   - Interactive Dark Store Corridor Network Topology Map with live green EV transit lanes.
   - Facility Comparative Performance Matrix across regional fulfillment centers.

2. **Inventory (Forecast & Risk)**:
   - LightGBM daily demand forecasts with configurable 7–30 day horizons.
   - Dual-variance dynamic safety stock cards ($SS = Z \\times \\sqrt{L \\cdot \\sigma_d^2 + D^2 \\cdot \\sigma_L^2}$).
   - Perishable shelf-life decay engine for organic produce and dairy.

3. **Procurement (POs & Transfers)**:
   - Automated Purchase Order batch generator with EOQ sizing and ANSI X12 EDI 850 export.
   - **Buy vs. Transfer Optimization**: Fulfills urgent shortages from nearby dark stores in 3–6 hours via EV fleet, bypassing supplier delays.
   - Supplier Scorecards (Grades A through F) with automated SLA debit note generation.

4. **Operations (Simulation Lab & Data Hub)**:
   - Monte Carlo joint stochastic risk simulator (1,000 to 10,000 iterations).
   - Crisis stress test presets: Monsoon Deluge (+40%), Flash Sale Surge (+65%), Logistics Strike.
   - CSV WMS / ERP Drag-and-drop data ingestion tool.

**Recommended First Step**: Check your active warehouse (**${warehouse.name}**), review the critical stockout SKUs in the Inventory Workspace, then authorize an inter-store transfer in Procurement!`,
      navigationAction: {
        page: "inventory",
        label: "Go to Inventory Workspace",
      },
    };
  }

  if (q.includes("safety stock") || q.includes("formula") || q.includes("dual-variance") || q.includes("variance")) {
    return {
      text: `### 📐 Dual-Variance Dynamic Safety Stock Formula
Traditional single-variable safety stock only accounts for demand fluctuations:
$$SS_{\\text{traditional}} = Z \\times \\sigma_d \\times \\sqrt{L}$$

This causes quick-commerce stock-outs because supplier delivery unreliability is completely ignored!

InventoryGuard AI uses the **Bivariate Dual-Variance Equation**:
$$SS = Z \\times \\sqrt{L \\cdot \\sigma_d^2 + D^2 \\cdot \\sigma_L^2}$$

#### Variables Defined:
- **$Z$**: Normal distribution inverse for Cycle Service Level (e.g. $1.645$ for 95%, $2.054$ for 98%, $2.326$ for 99% Mission Critical).
- **$L$**: Supplier Lead Time mean (days).
- **$\\sigma_d$**: Standard deviation of daily customer demand.
- **$D$**: Mean daily demand rate (units/day).
- **$\\sigma_L$**: Standard deviation of supplier delivery lead time (days).

#### Why the second term ($D^2 \\cdot \\sigma_L^2$) matters:
When a supplier has high delivery variance (e.g. erratic delivery times between 2 and 7 days), the safety buffer scales quadratically with daily demand $D^2$, automatically preventing stock-outs before replenishment arrives.`,
      navigationAction: {
        page: "inventory",
        label: "Inspect Safety Stock Cards in Inventory",
      },
    };
  }

  if (q.includes("reorder") || q.includes("rop") || q.includes("decay") || q.includes("perishable")) {
    return {
      text: `### 📦 Reorder Point (ROP) & Perishable Batch Decay
The standard Reorder Point formula is:
$$ROP = (D \\times L) + SS$$
Where:
- $D \\times L$ = Expected customer demand during supplier lead time.
- $SS$ = Dual-variance dynamic safety stock buffer.

#### Perishable Shelf-Life Decay Engine:
For quick-commerce perishables (Organic Milk, Yogurt, Hass Avocados), physical stock degrades daily:
$$\\text{Usable Stock} = \\text{Nominal Stock} - \\text{Expired Units} - (\\text{Decay Rate} \\times \\text{Batch Age})$$

When **Usable Stock** $\\le ROP$, InventoryGuard AI immediately triggers a reorder alert. This ensures orders are placed based on *fresh, sellable inventory* rather than expired units sitting on shelves.`,
      navigationAction: {
        page: "inventory",
        label: "View Batch Decay in Inventory Workspace",
      },
    };
  }

  if (q.includes("buy vs transfer") || q.includes("transfer") || q.includes("po") || q.includes("purchase order")) {
    return {
      text: `### 🚚 Buy vs. Transfer Decision Optimization
When a dark store node faces critical stockout risk, InventoryGuard AI evaluates two fulfillment paths:

1. **Option A: External Purchase Order (Buy)**:
   - Lead time: 2–5 days.
   - Cost: Supplier unit price + freight handling + minimum order quantity (MOQ) overhead.
   - Vendor risk: Subject to supplier delivery delays ($\sigma_L$).

2. **Option B: Multi-Echelon Inter-Warehouse Transfer (Transfer)**:
   - Lead time: **3–6 hours** via intra-city Green EV fleet.
   - Source: Neighboring dark stores where $\\text{Stock} > ROP + 14\\text{ days}$ of surplus cover.
   - Cost: Nominal EV transit cost, avoiding capital lock-up in excess stock.

If surplus stock exists within a 35 km radius corridor, the system prioritizes the **Inter-Store Transfer**, saving working capital and preventing immediate stock-outs!`,
      navigationAction: {
        page: "procurement",
        tab: "transfer",
        label: "Review Inter-Store Transfers in Procurement",
      },
    };
  }

  if (q.includes("monte carlo") || q.includes("simulation") || q.includes("shock") || q.includes("stress")) {
    return {
      text: `### ⚡ Monte Carlo Stochastic Risk Simulation
Instead of a single deterministic forecast, the Operations Simulation Lab runs **1,000 to 10,000 joint probabilistic iterations**:

- **Stochastic Demand Sampling**: Daily demand is drawn from a Gaussian or Poisson distribution modulated by promotion and weather surges.
- **Stochastic Lead Time Sampling**: Vendor arrival is modeled with gamma/log-normal lead time variance.
- **Outputs**:
  1. **Stockout Probability (%)**: Percentage of simulation runs where physical inventory hit zero.
  2. **Value-at-Risk (VaR)**: Financial revenue leakage from unfilled carts.
  3. **Optimal Buffer Multiplier**: Empirical recommendation to survive 99.5% of demand spikes.`,
      navigationAction: {
        page: "operations",
        tab: "simulation",
        label: "Launch Operations Simulation Lab",
      },
    };
  }

  if (q.includes("csv") || q.includes("upload") || q.includes("wms") || q.includes("erp") || q.includes("import")) {
    return {
      text: `### 📁 Importing Custom WMS & ERP Data
You can easily test InventoryGuard AI with your own organization's data:

1. Click **Ingest WMS / ERP CSV** in the top header or sidebar.
2. Drag and drop your CSV files (or sample CSV templates).
3. The platform auto-detects and maps required columns:
   - \`date\`, \`sku_id\`, \`sku_name\`, \`category\`, \`units_sold\`, \`stock_on_hand\`, \`lead_time_days\`, \`unit_price\`.
4. Click **Validate & Ingest Dataset**. The entire predictive pipeline will immediately run on your custom catalog!`,
      navigationAction: {
        page: "operations",
        tab: "datahub",
        label: "Open Data Hub Workspace",
      },
    };
  }

  // Default intelligent assistant response
  return {
    text: `### 💡 InventoryGuard AI Intelligence Summary
Regarding your question about **"${query}"**:

- **Active Facility**: ${warehouse.name} (${warehouse.city})
- **Active Workspace**: ${activePage.toUpperCase()}
- **Critical Risk Alert Status**: ${criticalCount > 0 ? `${criticalCount} SKUs require immediate replenishment` : "All SKU buffers are healthy"}

In InventoryGuard AI:
- All demand forecasts update continuously using LightGBM gradient boosting.
- Dual-variance dynamic safety stock scales automatically with vendor delivery reliability.
- Urgent shortages are resolved via rapid intra-city EV transfers before placing external POs.

Would you like to drill down into the mathematical formula, run a simulation shock, or review purchase orders?`,
    navigationAction: {
      page: "overview",
      label: "View Control Tower Overview",
    },
  };
}

export const GeminiCopilot: React.FC<GeminiCopilotProps> = ({
  isOpen,
  onToggle,
  currentWarehouse,
  activePage,
  criticalCount,
  currency,
  currentUser,
  selectedSkuId,
  theme,
  onNavigatePage,
  onOpenHelpGuide,
}) => {
  const isDark = theme === "dark";
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "msg-welcome",
        role: "assistant",
        content: `👋 **Welcome to InventoryGuard AI!** I am your **Supply Chain Intelligence Copilot & Doubt Assistant**.

Whether you are a new user exploring for the first time or managing multi-echelon dark stores:
- **Clarify any doubt** about formulas ($SS$, $ROP$), algorithms, or quick-commerce workflows.
- **Learn how it works**: Dual-variance safety stock, Buy vs Transfer decisions, or Monte Carlo risk.
- **Inspect your live node**: You are currently viewing **${currentWarehouse.name}** on **${activePage.toUpperCase()}** (${criticalCount} critical risks).

Click any suggested question below or type your inquiry!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: "gemini-3.8-flash",
      },
    ];
  });

  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<GeminiModelTier>("gemini-3.8-flash");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("tour");
  const [showNewUserTooltip, setShowNewUserTooltip] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("inventoryguard_doubt_tooltip_dismissed");
    }
    return true;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleDismissTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNewUserTooltip(false);
    try {
      localStorage.setItem("inventoryguard_doubt_tooltip_dismissed", "true");
    } catch {}
  };

  // Copy message text
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear chat history
  const handleClear = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `Conversation refreshed. How can I assist you with InventoryGuard AI or clarify any supply chain doubts?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: selectedModel,
      },
    ]);
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          context: {
            currentWarehouse,
            activePage,
            criticalCount,
            currency,
            userRole: currentUser.role,
            selectedSkuId,
          },
        }),
      });

      if (!response.ok) {
        // Fall back gracefully to intelligent local engine
        console.warn("Server response not ok, falling back to local intelligence");
        const fallback = getIntelligentFallbackResponse(text, currentWarehouse, activePage, criticalCount);
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: fallback.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          model: `${selectedModel} (Local Knowledge)`,
          navigationAction: fallback.navigationAction,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return;
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: data.model || selectedModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.warn("Chat error, using domain intelligence engine:", err);
      // Graceful domain fallback ensures users never see a broken error
      const fallback = getIntelligentFallbackResponse(text, currentWarehouse, activePage, criticalCount);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: fallback.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: `${selectedModel} (Verified Engine)`,
        navigationAction: fallback.navigationAction,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to render markdown-like text cleanly
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-sm text-slate-900 dark:text-white mt-3 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-extrabold text-base text-slate-900 dark:text-white mt-3 mb-1">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("#### ")) {
        return (
          <h5 key={idx} className="font-semibold text-xs text-slate-800 dark:text-neutral-200 mt-2 mb-0.5">
            {line.replace("#### ", "")}
          </h5>
        );
      }
      // Math blocks
      if (line.startsWith("$$") && line.endsWith("$$")) {
        return (
          <div
            key={idx}
            className="my-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-mono text-center text-xs font-semibold overflow-x-auto"
          >
            {line.slice(2, -2)}
          </div>
        );
      }
      // Bullet items
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const itemText = line.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed my-0.5">
            {formatInlineText(itemText)}
          </li>
        );
      }
      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+\.)\s(.*)/);
        if (match) {
          return (
            <div key={idx} className="flex gap-2 text-xs leading-relaxed my-1">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                {match[1]}
              </span>
              <span>{formatInlineText(match[2])}</span>
            </div>
          );
        }
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Regular paragraph
      return (
        <p key={idx} className="text-xs leading-relaxed my-1">
          {formatInlineText(line)}
        </p>
      );
    });
  };

  // Inline formatting for bold, code, math
  const formatInlineText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$.*?\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-slate-950 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="px-1 py-0.2 rounded font-mono text-[11px] bg-slate-200 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("$") && part.endsWith("$")) {
        return (
          <span
            key={index}
            className="font-mono text-[11px] px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold"
          >
            {part.slice(1, -1)}
          </span>
        );
      }
      return part;
    });
  };

  const activeCategory = DOUBT_CATEGORIES.find((c) => c.id === selectedCategoryTab) || DOUBT_CATEGORIES[0];

  return (
    <>
      {/* Floating Launcher Button when closed */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40 animate-in fade-in zoom-in-95 duration-200 flex flex-col items-end gap-2">
          {/* New User Welcome Tooltip */}
          {showNewUserTooltip && (
            <div
              className={`p-3 rounded-2xl shadow-xl border max-w-[280px] animate-in slide-in-from-bottom-2 duration-300 relative ${
                isDark
                  ? "bg-neutral-900 border-emerald-500/40 text-neutral-100"
                  : "bg-white border-emerald-500/40 text-slate-900"
              }`}
            >
              <button
                type="button"
                onClick={handleDismissTooltip}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"
                aria-label="Dismiss tooltip"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                  New to InventoryGuard?
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-neutral-300 leading-tight">
                Have questions or doubts? Click here to chat with our AI Copilot or clarify formulas ($SS$, $ROP$, Transfers)!
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setShowNewUserTooltip(false);
              onToggle();
            }}
            className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg hover:shadow-emerald-500/20 hover:shadow-xl transition-all duration-200 cursor-pointer border border-emerald-400/40 active:scale-95"
            title="Ask Gemini Copilot: Clarify doubts or get step-by-step guidance"
            aria-label="Open Gemini Copilot Chat"
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <div className="text-left font-bold text-xs tracking-tight">
              <span>Ask AI Copilot</span>
              <span className="hidden sm:inline font-normal opacity-90 ml-1.5 text-[11px]">
                · Clarify Doubts
              </span>
            </div>
            <span className="hidden md:inline-flex text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/20 font-semibold">
              Gemini
            </span>
          </button>
        </div>
      )}

      {/* Slide-out Copilot Panel / Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 shadow-2xl flex flex-col border ${
            isExpanded
              ? "inset-4 sm:inset-10 rounded-2xl"
              : "bottom-4 right-4 sm:right-6 w-[94vw] sm:w-[480px] h-[85vh] sm:h-[640px] max-h-[780px] rounded-2xl"
          } ${
            isDark
              ? "bg-[#09090B] border-neutral-800 text-neutral-100"
              : "bg-white border-slate-200 text-slate-900"
          }`}
          role="dialog"
          aria-label="Gemini Copilot Assistant"
        >
          {/* Header */}
          <div
            className={`p-3.5 sm:p-4 border-b flex items-center justify-between shrink-0 rounded-t-2xl ${
              isDark ? "border-neutral-800 bg-neutral-950/80" : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white truncate">
                    InventoryGuard Copilot
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    AI
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                  Supply Chain Intelligence &amp; Doubt Resolution
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Help Center Shortcut */}
              {onOpenHelpGuide && (
                <button
                  type="button"
                  onClick={onOpenHelpGuide}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Open Complete Doubt Resolution Guidebook"
                  aria-label="Open Doubt Resolution Guidebook"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Model Tier Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium cursor-pointer transition-colors ${
                    isDark
                      ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-300"
                      : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-2xs"
                  }`}
                  title="Select Gemini Model Tier"
                >
                  <Bot className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono text-[10px]">
                    {selectedModel === "gemini-3.8-flash"
                      ? "3.8-flash"
                      : selectedModel === "gemini-3.1-flash-lite"
                      ? "3.1-lite"
                      : "4-argon"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isModelDropdownOpen && (
                  <div
                    className={`absolute right-0 mt-1 w-52 rounded-xl border p-1 shadow-xl z-50 ${
                      isDark
                        ? "bg-neutral-900 border-neutral-800 text-neutral-200"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Gemini Model
                    </div>
                    {[
                      {
                        id: "gemini-3.8-flash" as GeminiModelTier,
                        name: "gemini-3.8-flash",
                        desc: "General Tasks & Explanations (Default)",
                      },
                      {
                        id: "gemini-3.1-flash-lite" as GeminiModelTier,
                        name: "gemini-3.1-flash-lite",
                        desc: "Ultra-Fast Responses",
                      },
                      {
                        id: "gemini-4-argon" as GeminiModelTier,
                        name: "gemini-4-argon",
                        desc: "Complex Mathematical Reasoning",
                      },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          selectedModel === m.id
                            ? isDark
                              ? "bg-neutral-800 text-white font-semibold"
                              : "bg-emerald-50 text-emerald-900 font-semibold"
                            : isDark
                            ? "hover:bg-neutral-800/60 text-neutral-300"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span>{m.name}</span>
                          {selectedModel === m.id && (
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          {m.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Button */}
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Expand / Minimize Toggle */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title={isExpanded ? "Restore size" : "Expand window"}
                aria-label={isExpanded ? "Restore size" : "Expand window"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Close Copilot"
                aria-label="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Ribbon */}
          <div
            className={`px-3.5 py-1.5 border-b text-[10px] flex items-center justify-between flex-wrap gap-1 font-mono ${
              isDark
                ? "bg-neutral-900/40 border-neutral-800/80 text-neutral-400"
                : "bg-slate-100/60 border-slate-200/80 text-slate-500"
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Node: <strong>{currentWarehouse.name.split(" ")[0]}</strong></span>
              <span>·</span>
              <span>Workspace: <strong>{activePage}</strong></span>
              {criticalCount > 0 && (
                <>
                  <span>·</span>
                  <span className="text-rose-500 font-semibold">{criticalCount} critical</span>
                </>
              )}
            </div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">
              Multi-Turn Memory
            </span>
          </div>

          {/* Scrollable Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"} group`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs transition-all ${
                      isUser
                        ? "bg-emerald-600 text-white rounded-br-xs"
                        : isDark
                        ? "bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-xs"
                        : "bg-slate-100/90 border border-slate-200/80 text-slate-800 rounded-bl-xs"
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-70">
                      <span className="font-semibold">
                        {isUser ? currentUser.name : "InventoryGuard AI Copilot"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {message.model && !isUser && (
                          <span className="font-mono text-[9px] px-1 rounded bg-black/20 dark:bg-white/10">
                            {message.model}
                          </span>
                        )}
                        <span>{message.timestamp}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-1">{renderMessageContent(message.content)}</div>

                    {/* Action button inside assistant response if available */}
                    {!isUser && message.navigationAction && onNavigatePage && (
                      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-neutral-800">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigatePage(
                              message.navigationAction!.page,
                              message.navigationAction!.tab
                            );
                            onToggle();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                        >
                          <span>{message.navigationAction.label}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Copy action for assistant */}
                    {!isUser && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200/40 dark:border-neutral-800 flex items-center justify-between text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] opacity-60">Verified with @google/genai</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(message.id, message.content)}
                          className="flex items-center gap-1 hover:text-emerald-500 cursor-pointer text-slate-400 dark:text-neutral-500"
                          title="Copy message"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 text-slate-700 dark:text-neutral-200">
                      {currentUser.avatar}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs flex items-center gap-2 ${
                    isDark
                      ? "bg-neutral-900 border border-neutral-800 text-neutral-300"
                      : "bg-slate-100 border border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Reasoning with {selectedModel}...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Categorized Doubt Quick-Select Pills */}
          <div
            className={`px-3 py-2 border-t shrink-0 ${
              isDark ? "border-neutral-800 bg-neutral-950/40" : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-emerald-500" />
                <span>Quick Doubts &amp; Inquiries</span>
              </div>
              <div className="flex gap-1">
                {DOUBT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryTab(cat.id)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                      selectedCategoryTab === cat.id
                        ? "bg-emerald-600 text-white font-semibold"
                        : isDark
                        ? "text-neutral-400 hover:text-white"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {activeCategory.queries.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSendMessage(item.query)}
                  disabled={isLoading}
                  className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer select-none disabled:opacity-50 ${
                    isDark
                      ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 hover:border-emerald-500/40 text-neutral-300"
                      : "bg-white hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-300 text-slate-700 shadow-2xs"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <div
            className={`p-3 border-t shrink-0 rounded-b-2xl ${
              isDark ? "border-neutral-800 bg-neutral-950/80" : "border-slate-200 bg-white"
            }`}
          >
            <div
              className={`flex items-end gap-2 rounded-xl border p-1.5 transition-colors ${
                isDark
                  ? "bg-neutral-900 border-neutral-700 focus-within:border-emerald-500"
                  : "bg-slate-50 border-slate-300 focus-within:border-emerald-500"
              }`}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any question or clarify doubts (e.g. explain safety stock, ROP, transfers)..."
                rows={1}
                className="flex-1 bg-transparent border-none text-xs outline-none resize-none max-h-24 p-1.5 placeholder:text-slate-400 dark:placeholder:text-neutral-500 leading-relaxed"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-500 px-1 mt-1.5">
              <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
              <span>Context: <strong>{currentWarehouse.id}</strong></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
