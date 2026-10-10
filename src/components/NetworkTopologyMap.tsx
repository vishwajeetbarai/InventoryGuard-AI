import React, { useState } from "react";
import { Warehouse, InterTransferRecommendation, SkuSimulationState } from "../types";
import {
  MapPin,
  ArrowRightLeft,
  Truck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  Radio,
  CheckCircle2,
  TrendingDown,
  Navigation,
} from "lucide-react";

interface NetworkTopologyMapProps {
  warehouses: Warehouse[];
  selectedWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  interTransfers: InterTransferRecommendation[];
  simulationStates: SkuSimulationState[];
  onApproveTransfer: (id: string) => void;
  theme: "dark" | "light";
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  label: string;
  city: string;
  state: string;
  region: string;
}

const NODE_POSITIONS: Record<string, NodePosition> = {
  "WH-DEL-03": {
    id: "WH-DEL-03",
    x: 400,
    y: 110,
    label: "Delhi NCR Hub",
    city: "Delhi NCR",
    state: "Delhi",
    region: "North Hub",
  },
  "WH-BOM-01": {
    id: "WH-BOM-01",
    x: 230,
    y: 310,
    label: "Mumbai Central",
    city: "Mumbai",
    state: "Maharashtra",
    region: "West Hub",
  },
  "WH-BLR-02": {
    id: "WH-BLR-02",
    x: 340,
    y: 490,
    label: "Bengaluru Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    region: "South Hub",
  },
};

const CORRIDOR_ROUTES = [
  {
    from: "WH-DEL-03",
    to: "WH-BOM-01",
    label: "Delhi ⇄ Mumbai Freight Corridor",
    distanceKm: 1410,
    transitHours: 6,
    path: "M 400 110 Q 300 200 230 310",
  },
  {
    from: "WH-BOM-01",
    to: "WH-BLR-02",
    label: "Mumbai ⇄ Bengaluru Express Link",
    distanceKm: 980,
    transitHours: 4,
    path: "M 230 310 Q 280 410 340 490",
  },
  {
    from: "WH-DEL-03",
    to: "WH-BLR-02",
    label: "Delhi ⇄ Bengaluru High-Speed Spine",
    distanceKm: 2150,
    transitHours: 6.5,
    path: "M 400 110 Q 420 300 340 490",
  },
];

export const NetworkTopologyMap: React.FC<NetworkTopologyMapProps> = ({
  warehouses,
  selectedWarehouseId,
  onSelectWarehouse,
  interTransfers,
  simulationStates,
  onApproveTransfer,
  theme,
}) => {
  const isDark = theme === "dark";
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState<"normal" | "fast">("normal");

  // Determine health per warehouse
  const getNodeHealth = (whId: string) => {
    // If it is the active warehouse, we can evaluate current simulationStates
    if (whId === selectedWarehouseId) {
      const hasCritical = simulationStates.some(
        (s) => s.mcResult.urgency === "CRITICAL REORDER NOW"
      );
      if (hasCritical) return { status: "critical", color: "rose", label: "Critical Stockout Deficit" };
      const hasWarning = simulationStates.some(
        (s) => s.mcResult.urgency === "WARNING"
      );
      if (hasWarning) return { status: "warning", color: "amber", label: "Inventory Warning" };
      return { status: "optimal", color: "emerald", label: "Optimal Stock" };
    }

    // For other warehouses, check if they are acting as donor or recipient in transfer proposals
    const isDonor = interTransfers.some((t) => t.originWarehouseId === whId);
    const isRecipient = interTransfers.some((t) => t.destWarehouseId === whId);

    if (isRecipient) {
      return { status: "critical", color: "rose", label: "Incoming Emergency Transfer" };
    }
    if (isDonor) {
      return { status: "surplus", color: "amber", label: "Surplus Donor Node" };
    }
    return { status: "optimal", color: "emerald", label: "Optimal Equilibrium" };
  };

  const activeWh = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];
  const focusedNodeId = hoveredNode || selectedWarehouseId;
  const focusedWh = warehouses.find((w) => w.id === focusedNodeId) || activeWh;
  const focusedHealth = getNodeHealth(focusedNodeId);

  // Active transfers for selected warehouse
  const relevantTransfers = interTransfers.filter(
    (t) =>
      t.originWarehouseId === selectedWarehouseId ||
      t.destWarehouseId === selectedWarehouseId
  );

  return (
    <div className="space-y-6">
      {/* Topology Header Banner */}
      <div
        className={`border rounded-xl p-5 shadow-sm transition-colors ${
          isDark
            ? "bg-slate-900/80 border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Navigation className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold">
                Multi-Echelon Dark Store Network Topology Map
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Geographic network telemetry across 3 regional dark stores with active cross-dock transit pulses and dynamic stock health.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                Deficit
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                Surplus Donor
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                Optimal
              </span>
            </div>

            <button
              onClick={() =>
                setAnimationSpeed((prev) => (prev === "normal" ? "fast" : "normal"))
              }
              className={`px-2.5 py-1 text-[11px] rounded-lg border font-semibold transition-colors cursor-pointer ${
                animationSpeed === "fast"
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : isDark
                  ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}
            >
              {animationSpeed === "fast" ? "⚡ Fast Pulse" : "Pulse: Normal"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas + Live Node Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Network Canvas */}
        <div
          className={`lg:col-span-8 border rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between ${
            isDark
              ? "bg-[#0A0E1A] border-slate-800/90"
              : "bg-gradient-to-b from-slate-50 to-slate-100 border-slate-200"
          }`}
        >
          {/* Subtle grid background pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, ${isDark ? "#ffffff" : "#000000"} 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />

          {/* Canvas SVG */}
          <div className="relative w-full aspect-[4/3] max-h-[520px] flex items-center justify-center">
            <svg
              viewBox="0 0 640 580"
              className="w-full h-full select-none"
              style={{ overflow: "visible" }}
            >
              <defs>
                {/* Gradient for links */}
                <linearGradient id="linkGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
                </linearGradient>

                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Corridor Route Paths */}
              {CORRIDOR_ROUTES.map((route, idx) => {
                const hasActiveTransfer = interTransfers.some(
                  (t) =>
                    (t.originWarehouseId === route.from &&
                      t.destWarehouseId === route.to) ||
                    (t.originWarehouseId === route.to &&
                      t.destWarehouseId === route.from)
                );

                const pulseDuration =
                  animationSpeed === "fast" ? "2.5s" : "4.5s";

                return (
                  <g key={idx}>
                    {/* Background route glow line */}
                    <path
                      d={route.path}
                      fill="none"
                      stroke={
                        hasActiveTransfer
                          ? "#F59E0B"
                          : isDark
                          ? "#1E293B"
                          : "#CBD5E1"
                      }
                      strokeWidth={hasActiveTransfer ? 3 : 1.5}
                      strokeDasharray={hasActiveTransfer ? "none" : "5,5"}
                      strokeLinecap="round"
                    />

                    {/* Animated moving pulse dots along the route */}
                    <circle r="4.5" fill={hasActiveTransfer ? "#F59E0B" : "#818CF8"}>
                      <animateMotion
                        path={route.path}
                        dur={pulseDuration}
                        repeatCount="indefinite"
                        rotate="auto"
                      />
                    </circle>

                    {/* Return pulse in opposite direction */}
                    <circle r="3" fill="#38BDF8" opacity="0.75">
                      <animateMotion
                        path={route.path}
                        dur={animationSpeed === "fast" ? "3.2s" : "5.8s"}
                        repeatCount="indefinite"
                        keyPoints="1;0"
                        keyTimes="0;1"
                        rotate="auto"
                      />
                    </circle>

                    {/* Distance / Latency pill badge in mid-path */}
                    <g
                      transform={`translate(${
                        idx === 0
                          ? 290
                          : idx === 1
                          ? 285
                          : 405
                      }, ${idx === 0 ? 210 : idx === 1 ? 400 : 310})`}
                    >
                      <rect
                        x="-48"
                        y="-10"
                        width="96"
                        height="20"
                        rx="10"
                        fill={isDark ? "#0F172A" : "#FFFFFF"}
                        stroke={
                          hasActiveTransfer
                            ? "#F59E0B"
                            : isDark
                            ? "#334155"
                            : "#E2E8F0"
                        }
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="600"
                        fill={
                          hasActiveTransfer
                            ? "#F59E0B"
                            : isDark
                            ? "#94A3B8"
                            : "#475569"
                        }
                      >
                        {route.transitHours}h · {route.distanceKm} km
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Warehouse Nodes */}
              {warehouses.map((wh) => {
                const pos = NODE_POSITIONS[wh.id] || {
                  x: 300,
                  y: 300,
                  label: wh.name,
                  city: wh.city,
                  state: wh.city,
                  region: wh.region,
                };
                const health = getNodeHealth(wh.id);
                const isSelected = wh.id === selectedWarehouseId;
                const isHovered = wh.id === hoveredNode;

                let ringColor = "#10B981"; // emerald
                if (health.status === "critical") ringColor = "#F43F5E"; // rose
                if (health.status === "surplus" || health.status === "warning")
                  ringColor = "#F59E0B"; // amber

                return (
                  <g
                    key={wh.id}
                    className="cursor-pointer transition-transform duration-200"
                    onClick={() => onSelectWarehouse(wh.id)}
                    onMouseEnter={() => setHoveredNode(wh.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Selection halo */}
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="32"
                        fill="none"
                        stroke={ringColor}
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        opacity="0.8"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from={`0 ${pos.x} ${pos.y}`}
                          to={`360 ${pos.x} ${pos.y}`}
                          dur="12s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Outer glow circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isHovered || isSelected ? "24" : "20"}
                      fill={ringColor}
                      opacity={isSelected ? "0.25" : "0.15"}
                      filter="url(#glow)"
                    />

                    {/* Main node disc */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isHovered || isSelected ? "18" : "15"}
                      fill={isDark ? "#0F172A" : "#FFFFFF"}
                      stroke={ringColor}
                      strokeWidth={isSelected ? "3.5" : "2.5"}
                    />

                    {/* Inner core status beacon */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="6"
                      fill={ringColor}
                    />

                    {/* Node Text Label */}
                    <text
                      x={pos.x}
                      y={pos.y + 36}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill={isDark ? "#F8FAFC" : "#0F172A"}
                    >
                      {pos.label}
                    </text>

                    {/* Node Subtitle (City + Status) */}
                    <text
                      x={pos.x}
                      y={pos.y + 50}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="500"
                      fill={isDark ? "#94A3B8" : "#64748B"}
                    >
                      {wh.city} · {health.label}
                    </text>

                    {/* Active live badge */}
                    {isSelected && (
                      <g transform={`translate(${pos.x - 30}, ${pos.y - 42})`}>
                        <rect
                          width="60"
                          height="18"
                          rx="4"
                          fill="#4F46E5"
                        />
                        <text
                          x="30"
                          y="12"
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#FFFFFF"
                        >
                          ACTIVE NODE
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive footer guide inside canvas */}
          <div
            className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between text-xs ${
              isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Click any node disc to switch executive command context</span>
            </div>
            <span className="font-mono text-[11px]">
              Active Corridor Links: {CORRIDOR_ROUTES.length} · Live Dark Stores: 3
            </span>
          </div>
        </div>

        {/* Right Telemetry Details Card for Focused Node */}
        <div className="lg:col-span-4 space-y-4">
          <div
            className={`border rounded-xl p-5 shadow-sm transition-colors ${
              isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm">
                  {focusedWh.name}
                </h3>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  focusedHealth.status === "critical"
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    : focusedHealth.status === "surplus"
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {focusedHealth.label}
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/20">
                <span className="text-slate-400">Node ID:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {focusedWh.id}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/20">
                <span className="text-slate-400">Geographic Region:</span>
                <span className="font-semibold text-slate-200">
                  {focusedWh.region} ({focusedWh.city})
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/20">
                <span className="text-slate-400">Inventory Equilibrium:</span>
                <span
                  className={`font-semibold ${
                    focusedHealth.status === "critical"
                      ? "text-rose-400"
                      : "text-emerald-400"
                  }`}
                >
                  {focusedHealth.label}
                </span>
              </div>

              {focusedWh.id === selectedWarehouseId && (
                <>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/20">
                    <span className="text-slate-400">Active SKUs Analyzed:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {simulationStates.length} SKUs
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/20">
                    <span className="text-slate-400">Critical Stockout Alerts:</span>
                    <span className="font-mono font-bold text-rose-400">
                      {
                        simulationStates.filter(
                          (s) => s.mcResult.urgency === "CRITICAL REORDER NOW"
                        ).length
                      }{" "}
                      SKUs
                    </span>
                  </div>
                </>
              )}

              <div className="pt-2">
                {focusedWh.id !== selectedWarehouseId ? (
                  <button
                    onClick={() => onSelectWarehouse(focusedWh.id)}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Switch Command View to this Node</span>
                  </button>
                ) : (
                  <div className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-center font-bold text-xs border border-emerald-500/20 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Currently Active Command Node</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Inter-Store Cross-Dock Transfers on Corridor */}
          <div
            className={`border rounded-xl p-5 shadow-sm transition-colors ${
              isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
              <h3 className="font-bold text-xs flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>Inter-Node Transit Operations</span>
              </h3>
              <span className="text-[11px] font-mono text-indigo-400 font-bold">
                {interTransfers.length} Active
              </span>
            </div>

            <div className="mt-3 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {interTransfers.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">
                  No emergency transfers required across corridors.
                </div>
              ) : (
                interTransfers.map((xfer) => {
                  const isApproved = xfer.status === "APPROVED";
                  const originWh =
                    warehouses.find((w) => w.id === xfer.originWarehouseId)?.name ||
                    xfer.originWarehouseId;
                  const destWh =
                    warehouses.find((w) => w.id === xfer.destWarehouseId)?.name ||
                    xfer.destWarehouseId;

                  return (
                    <div
                      key={xfer.id}
                      className={`p-2.5 rounded-lg border text-xs ${
                        isDark
                          ? "bg-slate-800/50 border-slate-700/60"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-400">
                          {xfer.skuName}
                        </span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          +{xfer.recommendedTransferQty} Units
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>
                          {originWh.split(" ")[0]} ➔ {destWh.split(" ")[0]}
                        </span>
                        <span>~{xfer.transitHours}h van</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-700/40 text-[10px]">
                        <span className="text-sky-400 font-semibold">
                          Net Profit: +₹{xfer.netProfitabilityInr?.toLocaleString() || "1,200"}
                        </span>
                        {isApproved ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> In Transit
                          </span>
                        ) : (
                          <button
                            onClick={() => onApproveTransfer(xfer.id)}
                            className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer transition-colors"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
