import React, { useState } from "react";
import { MarkdownLiquidationItem } from "../types";
import {
  Sparkles,
  Timer,
  TrendingUp,
  Percent,
  CheckCircle2,
  Trash2,
  IndianRupee,
  Flame,
  Zap,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface DynamicMarkdownCardProps {
  items: MarkdownLiquidationItem[];
  onApplyMarkdown: (skuId: string, discountPct: number) => void;
  theme?: "dark" | "light";
}

export const DynamicMarkdownCard: React.FC<DynamicMarkdownCardProps> = ({
  items,
  onApplyMarkdown,
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const [deployedSkuIds, setDeployedSkuIds] = useState<string[]>([]);

  const handleDeploy = (skuId: string, discountPct: number) => {
    setDeployedSkuIds((prev) => [...prev, skuId]);
    onApplyMarkdown(skuId, discountPct);
  };

  const totalDiscardLossAtRisk = items.reduce(
    (acc, item) => acc + item.decayLossAtRiskInr,
    0
  );
  const totalWasteAvoidedRevenue = items.reduce(
    (acc, item) => acc + item.wasteAvoidedRevenueInr,
    0
  );

  if (items.length === 0) {
    return (
      <div
        className={`border rounded-xl p-5 transition-colors ${
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Quick-Commerce Markdown &amp; Spoilage Liquidation</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          No perishable inventory is currently in the critical &lt;72h expiration window. Usable stock decay is within optimal thresholds.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`border rounded-xl p-5 shadow-sm transition-colors ${
        isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4" />
            </span>
            <h3
              className={`text-sm font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Quick-Commerce Dynamic Markdown &amp; Spoilage Liquidation Engine
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Algorithmic flash discounts (20%–35%) triggered when perishable inventory reaches &lt;72h shelf life to prevent discard loss.
          </p>
        </div>

        {/* Global Financial Impact Tag */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Total Waste Avoided
            </div>
            <div className="font-mono text-sm font-extrabold text-emerald-400">
              ₹{totalWasteAvoidedRevenue.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="h-7 w-[1px] bg-slate-800 hidden sm:block" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Discard Loss At Risk
            </div>
            <div className="font-mono text-sm font-extrabold text-rose-400">
              ₹{totalDiscardLossAtRisk.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Markdown Items */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => {
          const isDeployed = deployedSkuIds.includes(item.skuId);
          return (
            <div
              key={item.skuId}
              className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                isDark
                  ? "bg-slate-950/70 border-slate-800/80 hover:border-amber-500/40"
                  : "bg-slate-50 border-slate-200 hover:border-amber-400"
              }`}
            >
              <div>
                {/* SKU Badge & Expiry Timer */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-semibold text-slate-400">
                    {item.skuId} • {item.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    <span>~{item.hoursRemaining}h Shelf-Life</span>
                  </span>
                </div>

                <div
                  className={`mt-1 font-bold text-sm ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {item.skuName}
                </div>

                {/* Pricing & Discount Card */}
                <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">
                      Flash Markdown
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-mono text-lg font-black text-amber-400">
                        ₹{item.discountedPrice}
                      </span>
                      <span className="font-mono text-xs text-slate-500 line-through">
                        ₹{item.basePrice}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded-md text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                      -{item.recommendedDiscountPct}% OFF
                    </span>
                    <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-0.5 justify-end">
                      <TrendingUp className="w-2.5 h-2.5" />
                      <span>{item.expectedSalesVelocityMultiplier}x Sales Velocity</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Matrix */}
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Batch Stock Units:</span>
                    <span className="font-mono text-slate-200">
                      {item.currentStock} units
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Projected Salvaged Units:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {item.projectedUnitsSalvaged} units ({item.salvageEfficiencyPct}% efficiency)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Discard Loss Prevented:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +₹{item.wasteAvoidedRevenueInr.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/60">
                {isDeployed ? (
                  <div className="w-full py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Flash Markdown Live in Catalog</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDeploy(item.skuId, item.recommendedDiscountPct)}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Deploy -{item.recommendedDiscountPct}% Promo to Quick-Commerce</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
