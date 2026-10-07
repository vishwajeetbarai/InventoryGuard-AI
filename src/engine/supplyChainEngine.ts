import {
  DailyRecord,
  ForecastPoint,
  MonteCarloResult,
  PurchaseOrder,
  SkuMetadata,
  SkuSimulationState,
  Warehouse,
  InterTransferRecommendation,
  DispatchedPoRecord,
  SupplierScorecard,
} from "../types";

export const WAREHOUSES: Warehouse[] = [
  {
    id: "WH-BOM-01",
    name: "Mumbai Central Dark Store",
    city: "Mumbai",
    region: "West Hub",
    demandFactor: 1.25,
  },
  {
    id: "WH-BLR-02",
    name: "Bengaluru Indiranagar Hub",
    city: "Bengaluru",
    region: "South Hub",
    demandFactor: 1.10,
  },
  {
    id: "WH-DEL-03",
    name: "Delhi NCR Fulfillment Node",
    city: "Delhi NCR",
    region: "North Hub",
    demandFactor: 0.95,
  },
];

export const SKUS: SkuMetadata[] = [
  {
    id: "SKU-001",
    name: "Organic Milk 1L",
    category: "Perishables",
    basePrice: 78.0,
    baseDemand: 140,
    leadTimeMean: 2.5,
    leadTimeStd: 0.8,
    holdingCost: 1.80,
    stockoutPenalty: 35.0,
    stockMultiplier: 2.2,
    shelfLifeDays: 4,
    isPerishable: true,
    supplierName: "Amul Fresh Dairy Co.",
  },
  {
    id: "SKU-002",
    name: "Avocado Hass 2pk",
    category: "Fresh Produce",
    basePrice: 249.0,
    baseDemand: 75,
    leadTimeMean: 4.5,
    leadTimeStd: 1.5,
    holdingCost: 4.20,
    stockoutPenalty: 95.0,
    stockMultiplier: 3.1,
    shelfLifeDays: 5,
    isPerishable: true,
    supplierName: "Hass Valley Orchards",
  },
  {
    id: "SKU-003",
    name: "Protein Granola 500g",
    category: "Ambient Grocery",
    basePrice: 425.0,
    baseDemand: 45,
    leadTimeMean: 6.0,
    leadTimeStd: 2.0,
    holdingCost: 2.50,
    stockoutPenalty: 120.0,
    stockMultiplier: 5.0,
    shelfLifeDays: 90,
    isPerishable: false,
    supplierName: "TrueElements Organics",
  },
  {
    id: "SKU-004",
    name: "Cold Brew Coffee 250ml",
    category: "Ready-to-Drink",
    basePrice: 160.0,
    baseDemand: 90,
    leadTimeMean: 3.2,
    leadTimeStd: 1.1,
    holdingCost: 2.10,
    stockoutPenalty: 55.0,
    stockMultiplier: 2.8,
    shelfLifeDays: 14,
    isPerishable: true,
    supplierName: "Blue Tokai Roasters",
  },
  {
    id: "SKU-005",
    name: "Greek Yogurt 400g",
    category: "Dairy / Cold-Chain",
    basePrice: 195.0,
    baseDemand: 65,
    leadTimeMean: 3.0,
    leadTimeStd: 1.0,
    holdingCost: 3.00,
    stockoutPenalty: 70.0,
    stockMultiplier: 2.4,
    shelfLifeDays: 6,
    isPerishable: true,
    supplierName: "Epigamia Dairy Cold-Chain",
  },
];

// Seeded PRNG for deterministic reproducible simulation runs
function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Standard normal sample via Box-Muller transform
function sampleStandardNormal(rand: () => number): number {
  let u1 = rand();
  let u2 = rand();
  while (u1 <= 1e-15) u1 = rand();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Supplier Reliability Matrix & Scorecard Grading
 * Grades each supplier (Grade A to F) based on lead-time variance (sigma_L)
 * and automatically scales lead-time shock buffer multipliers.
 */
export function evaluateSupplierGrade(
  stdDays: number,
  supplierName: string,
  skuId: string,
  skuName: string
): SupplierScorecard {
  if (stdDays <= 0.9) {
    return {
      skuId,
      skuName,
      supplierName,
      grade: "A",
      onTimeDeliveryPct: 98.6,
      effectiveStdDays: stdDays,
      bufferMultiplier: 1.0,
      riskTier: "LOW",
      auditNotes: "Tier-1 certified supplier. Dedicated cold-chain fleet with GPS telemetry.",
    };
  } else if (stdDays <= 1.2) {
    return {
      skuId,
      skuName,
      supplierName,
      grade: "B",
      onTimeDeliveryPct: 94.4,
      effectiveStdDays: Math.round(stdDays * 1.15 * 10) / 10,
      bufferMultiplier: 1.15,
      riskTier: "MODERATE",
      auditNotes: "Stable regional partner with minor peak-season docking variance.",
    };
  } else if (stdDays <= 1.6) {
    return {
      skuId,
      skuName,
      supplierName,
      grade: "C",
      onTimeDeliveryPct: 88.2,
      effectiveStdDays: Math.round(stdDays * 1.30 * 10) / 10,
      bufferMultiplier: 1.30,
      riskTier: "ELEVATED",
      auditNotes: "Moderate variance due to agricultural harvesting cycles. Buffer expanded +30%.",
    };
  } else if (stdDays <= 2.1) {
    return {
      skuId,
      skuName,
      supplierName,
      grade: "D",
      onTimeDeliveryPct: 81.0,
      effectiveStdDays: Math.round(stdDays * 1.50 * 10) / 10,
      bufferMultiplier: 1.50,
      riskTier: "CRITICAL",
      auditNotes: "High lead-time volatility with freight bottlenecks. Buffer expanded +50%.",
    };
  } else {
    return {
      skuId,
      skuName,
      supplierName,
      grade: "F",
      onTimeDeliveryPct: 70.5,
      effectiveStdDays: Math.round(stdDays * 1.80 * 10) / 10,
      bufferMultiplier: 1.80,
      riskTier: "CRITICAL",
      auditNotes: "Unacceptable dispatch variance. Dual-sourcing procurement mandated.",
    };
  }
}

/**
 * Generates 365 days of synthetic historical records
 */
export function generateSyntheticHistoricalData(): DailyRecord[] {
  const records: DailyRecord[] = [];
  const rand = pseudoRandom(42);

  const today = new Date();

  for (const wh of WAREHOUSES) {
    for (const sku of SKUS) {
      const baseD = sku.baseDemand * wh.demandFactor;
      let simStock = Math.round(baseD * sku.stockMultiplier * (0.8 + rand() * 0.5));

      for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayOfWeek = d.getDay();
        const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);

        const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
        const weekendLift = isWeekend ? 1.35 : 0.90;
        const annualWave = 1.0 + 0.15 * Math.sin((2 * Math.PI * dayOfYear) / 365.0);
        const isPromo = rand() < 0.12 || dayOfWeek === 0;
        const promoMultiplier = isPromo ? 1.65 : 1.0;

        const expectedDemand = baseD * weekendLift * annualWave * promoMultiplier;
        const noise = sampleStandardNormal(rand) * (expectedDemand * 0.12);
        const unitsSold = Math.max(0, Math.round(expectedDemand + noise));

        const simLeadTime = Math.max(1.0, sku.leadTimeMean + sampleStandardNormal(rand) * sku.leadTimeStd);

        if (simStock < Math.round(baseD * 2.2)) {
          simStock += Math.round(baseD * (4.0 + rand() * 3.0));
        }
        simStock = Math.max(0, simStock - unitsSold);

        records.push({
          date: d.toISOString().split("T")[0],
          warehouseId: wh.id,
          skuId: sku.id,
          unitsSold,
          isPromotionalDay: isPromo,
          unitPriceInr: sku.basePrice,
          currentStockLevel: simStock,
          supplierLeadTimeDays: Math.round(simLeadTime * 10) / 10,
        });
      }
    }
  }

  return records;
}

/**
 * Machine Learning demand forecasting pipeline
 */
export function trainDemandForecast(
  historicalSales: { date: string; units: number }[],
  forecastHorizon: number,
  promotionalUpliftPct: number
): {
  forecastPoints: ForecastPoint[];
  rmse: number;
  mae: number;
} {
  const n = historicalSales.length;
  const units = historicalSales.map((h) => h.units);

  const testWindow = 30;
  let sse = 0;
  let sae = 0;

  for (let i = n - testWindow; i < n; i++) {
    const lag1 = units[i - 1] || units[i];
    const lag7 = units[i - 7] || lag1;
    const r7 = units.slice(Math.max(0, i - 7), i).reduce((a, b) => a + b, 0) / 7;
    const d = new Date(historicalSales[i].date);
    const isWk = d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6;
    const modelEst = (0.35 * lag1 + 0.35 * lag7 + 0.30 * r7) * (isWk ? 1.15 : 0.95);

    const actual = units[i];
    const err = actual - modelEst;
    sse += err * err;
    sae += Math.abs(err);
  }

  const rmse = Math.sqrt(sse / testWindow);
  const mae = sae / testWindow;

  const buffer = [...units];
  const forecastPoints: ForecastPoint[] = [];
  const lastDate = new Date(historicalSales[n - 1].date);

  for (let step = 1; step <= forecastHorizon; step++) {
    const stepDate = new Date(lastDate);
    stepDate.setDate(lastDate.getDate() + step);
    const dayOfWeek = stepDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

    const bLen = buffer.length;
    const lag1 = buffer[bLen - 1];
    const lag7 = buffer[bLen - 7] || lag1;
    const lag14 = buffer[bLen - 14] || lag7;

    const r7 = buffer.slice(Math.max(0, bLen - 7)).reduce((a, b) => a + b, 0) / 7;
    const r30 = buffer.slice(Math.max(0, bLen - 30)).reduce((a, b) => a + b, 0) / 30;

    let basePred = 0.25 * lag1 + 0.35 * lag7 + 0.15 * lag14 + 0.15 * r7 + 0.10 * r30;
    if (isWeekend) basePred *= 1.25;
    else basePred *= 0.92;

    const adjustedPred = Math.max(0, basePred * (1.0 + promotionalUpliftPct / 100.0));
    buffer.push(adjustedPred);

    const uncertainty = 1.28 * rmse;
    forecastPoints.push({
      date: stepDate.toISOString().split("T")[0],
      demand: Math.round(adjustedPred * 10) / 10,
      lowerBound: Math.max(0, Math.round((adjustedPred - uncertainty) * 10) / 10),
      upperBound: Math.round((adjustedPred + uncertainty) * 10) / 10,
    });
  }

  return {
    forecastPoints,
    rmse: Math.round(rmse * 10) / 10,
    mae: Math.round(mae * 10) / 10,
  };
}

/**
 * Monte Carlo Risk & Safety Stock Simulation
 * Dual Variance Propagation with supplier lead time volatility:
 * SS = Z * sqrt( L_bar * sigma_d^2 + D_bar^2 * sigma_L^2 )
 */
export function runMonteCarloSimulation(
  demandMean: number,
  demandStd: number,
  leadTimeMean: number,
  leadTimeStd: number,
  usableStock: number,
  serviceLevelZ: number,
  iterations: number = 1000
): MonteCarloResult {
  const rand = pseudoRandom(1337);

  const varianceTerm = leadTimeMean * Math.pow(demandStd, 2) + Math.pow(demandMean, 2) * Math.pow(leadTimeStd, 2);
  const jointSigma = Math.sqrt(Math.max(0.001, varianceTerm));
  const dynamicSafetyStock = Math.ceil(serviceLevelZ * jointSigma);

  const expectedLeadTimeDemand = Math.round(demandMean * leadTimeMean * 10) / 10;
  const dynamicRop = Math.ceil(expectedLeadTimeDemand + dynamicSafetyStock);

  const simulatedDdlt: number[] = new Array(iterations);
  let stockoutCount = 0;

  for (let i = 0; i < iterations; i++) {
    const ltSample = Math.max(1.0, leadTimeMean + sampleStandardNormal(rand) * leadTimeStd);
    const ltDays = Math.ceil(ltSample);

    let ddltSum = 0;
    for (let day = 0; day < ltDays; day++) {
      const dSample = Math.max(0, demandMean + sampleStandardNormal(rand) * demandStd);
      ddltSum += dSample;
    }

    simulatedDdlt[i] = Math.round(ddltSum);
    // Evaluated against usable stock (spoilage discounted)
    if (ddltSum > usableStock) {
      stockoutCount++;
    }
  }

  const sorted = [...simulatedDdlt].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(iterations * 0.95)] || sorted[iterations - 1];
  const p99 = sorted[Math.floor(iterations * 0.99)] || sorted[iterations - 1];

  const stockoutProbabilityPct = Math.round((stockoutCount / iterations) * 1000) / 10;

  let urgency: "CRITICAL REORDER NOW" | "WARNING" | "OPTIMAL";
  if (usableStock <= dynamicRop || stockoutProbabilityPct >= 25.0) {
    urgency = "CRITICAL REORDER NOW";
  } else if (usableStock <= Math.round(dynamicRop * 1.3) || stockoutProbabilityPct >= 10.0) {
    urgency = "WARNING";
  } else {
    urgency = "OPTIMAL";
  }

  const targetInventory = dynamicRop + Math.round(demandMean * 7.0);
  const recommendedReorderQty = Math.max(0, targetInventory - usableStock);

  return {
    dynamicSafetyStock,
    dynamicRop,
    expectedLeadTimeDemand,
    stockoutProbabilityPct,
    simulatedDdlt,
    urgency,
    recommendedReorderQty,
    p95LeadTimeDemand: p95,
    p99LeadTimeDemand: p99,
  };
}

/**
 * Execute simulation across all selected SKUs with:
 * 1. Perishable Batch Decay & Expiry Engine
 * 2. Supplier Reliability Matrix Buffer Scaling
 */
export function executeSupplyChainEngine(
  allRecords: DailyRecord[],
  warehouseId: string,
  selectedSkuIds: string[],
  serviceLevelZ: number,
  forecastHorizon: number,
  monteCarloIterations: number,
  promoUpliftPct: number,
  supplierDelayBias: number
): SkuSimulationState[] {
  const results: SkuSimulationState[] = [];

  for (const sId of selectedSkuIds) {
    const skuMeta = SKUS.find((s) => s.id === sId);
    if (!skuMeta) continue;

    const skuRecords = allRecords
      .filter((r) => r.warehouseId === warehouseId && r.skuId === sId)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (skuRecords.length === 0) continue;

    const latest = skuRecords[skuRecords.length - 1];
    const currentStock = latest.currentStockLevel;

    const historicalSales = skuRecords.map((r) => ({
      date: r.date,
      units: r.unitsSold,
    }));

    const fc = trainDemandForecast(historicalSales, forecastHorizon, promoUpliftPct);

    const dValues = fc.forecastPoints.map((f) => f.demand);
    const dMean = dValues.reduce((a, b) => a + b, 0) / dValues.length;
    const dStd = Math.max(
      1.0,
      Math.sqrt(dValues.map((x) => Math.pow(x - dMean, 2)).reduce((a, b) => a + b, 0) / dValues.length)
    );

    // 1. Supplier Reliability Scorecard & Buffer Scaling
    const scorecard = evaluateSupplierGrade(
      skuMeta.leadTimeStd,
      skuMeta.supplierName,
      skuMeta.id,
      skuMeta.name
    );

    // Scale lead-time std deviation by supplier risk multiplier + operational delay bias
    const effLtStd = Math.round((skuMeta.leadTimeStd * scorecard.bufferMultiplier) * 10) / 10;
    const effLtMean = Math.round((skuMeta.leadTimeMean + supplierDelayBias) * 10) / 10;

    // 2. Perishable Batch Decay Engine
    // Models batch aging and calculates usable stock discount prior to ROP calculation
    let decayRatePct = 0;
    let decayedUnits = 0;
    let usableStock = currentStock;

    if (skuMeta.isPerishable) {
      const daysOfSupply = currentStock / Math.max(1, dMean);
      // If days of supply approaches or exceeds shelf life, decay accelerates
      const ratio = daysOfSupply / skuMeta.shelfLifeDays;
      decayRatePct = Math.min(35.0, Math.max(4.0, Math.round(ratio * 14.5 * 10) / 10));
      decayedUnits = Math.round(currentStock * (decayRatePct / 100.0));
      usableStock = Math.max(0, currentStock - decayedUnits);
    }

    // Run Monte Carlo against usable stock (discounting expired/decayed batches)
    const mc = runMonteCarloSimulation(
      dMean,
      dStd,
      effLtMean,
      effLtStd,
      usableStock,
      serviceLevelZ,
      monteCarloIterations
    );

    let revenueAtRisk = 0;
    if (mc.stockoutProbabilityPct > 5.0 && mc.p95LeadTimeDemand > usableStock) {
      const deficitUnits = mc.p95LeadTimeDemand - usableStock;
      const penalty = skuMeta.stockoutPenalty + skuMeta.basePrice;
      revenueAtRisk = Math.round(deficitUnits * penalty * (mc.stockoutProbabilityPct / 100.0));
    }

    results.push({
      sku: skuMeta,
      currentStock,
      usableStock,
      decayedUnits,
      decayRatePct,
      forecastPoints: fc.forecastPoints,
      historicalSales,
      rmse: fc.rmse,
      mae: fc.mae,
      mcResult: mc,
      revenueAtRisk,
      effectiveLeadTimeMean: effLtMean,
      effectiveLeadTimeStd: effLtStd,
      supplierScorecard: scorecard,
    });
  }

  return results;
}

/**
 * Generate automated purchase orders
 */
export function generatePurchaseOrders(
  simulationStates: SkuSimulationState[],
  warehouse: Warehouse
): PurchaseOrder[] {
  const pos: PurchaseOrder[] = [];
  const todayStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const poBatchId = `PO-${todayStr}-${warehouse.id}`;

  for (const state of simulationStates) {
    const { sku, currentStock, usableStock, mcResult, effectiveLeadTimeMean, supplierScorecard } = state;

    if (mcResult.recommendedReorderQty > 0 || mcResult.urgency === "CRITICAL REORDER NOW" || mcResult.urgency === "WARNING") {
      const poQty = Math.max(mcResult.recommendedReorderQty, Math.round(mcResult.dynamicSafetyStock * 1.5));
      const totalCost = poQty * sku.basePrice;

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + Math.ceil(effectiveLeadTimeMean));

      pos.push({
        poNumber: `${poBatchId}-${sku.id}`,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        skuId: sku.id,
        skuName: sku.name,
        category: sku.category,
        currentStock,
        usableStock,
        dynamicRop: mcResult.dynamicRop,
        safetyStock: mcResult.dynamicSafetyStock,
        recommendedOrderQty: poQty,
        unitCostInr: sku.basePrice,
        totalPoValueInr: Math.round(totalCost),
        expectedDeliveryDate: expectedDate.toISOString().split("T")[0],
        priority: mcResult.urgency === "CRITICAL REORDER NOW" ? "URGENT" : "NORMAL",
        supplierName: sku.supplierName,
        supplierGrade: supplierScorecard.grade,
      });
    }
  }

  return pos;
}

/**
 * Multi-Echelon Dark Store Inter-Transfer Engine
 */
export function evaluateInterWarehouseTransfers(
  allRecords: DailyRecord[],
  currentWarehouseId: string,
  criticalStates: SkuSimulationState[]
): InterTransferRecommendation[] {
  const recommendations: InterTransferRecommendation[] = [];
  const destWarehouse = WAREHOUSES.find((w) => w.id === currentWarehouseId);
  if (!destWarehouse) return recommendations;

  const otherWarehouses = WAREHOUSES.filter((w) => w.id !== currentWarehouseId);

  for (const critState of criticalStates) {
    if (critState.mcResult.urgency !== "CRITICAL REORDER NOW") continue;

    const skuId = critState.sku.id;
    const destDailyDemand = critState.sku.baseDemand * destWarehouse.demandFactor;
    const destDeficit = Math.max(
      15,
      critState.mcResult.dynamicRop + Math.round(destDailyDemand * 7) - critState.usableStock
    );

    for (const originWh of otherWarehouses) {
      const originRecords = allRecords
        .filter((r) => r.warehouseId === originWh.id && r.skuId === skuId)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (originRecords.length === 0) continue;

      const originCurrentStock = originRecords[originRecords.length - 1].currentStockLevel;
      const originDailyDemand = critState.sku.baseDemand * originWh.demandFactor;
      const originEstRop = Math.round(
        originDailyDemand * critState.sku.leadTimeMean + critState.mcResult.dynamicSafetyStock * 0.9
      );
      const surplusThreshold = originEstRop + Math.round(originDailyDemand * 14);

      if (originCurrentStock > surplusThreshold) {
        const availableSurplus = originCurrentStock - surplusThreshold;
        const transferQty = Math.min(availableSurplus, destDeficit);

        if (transferQty >= 10) {
          const transitHours = originWh.city === destWarehouse.city ? 3 : 6;
          const transitCostInr = 150 + transferQty * 1.5;
          const stockoutLossPreventedInr = Math.round(
            transferQty * (critState.sku.stockoutPenalty + critState.sku.basePrice * 0.25)
          );

          recommendations.push({
            id: `XFER-${Date.now().toString().slice(-4)}-${skuId}-${originWh.id.slice(-2)}`,
            skuId,
            skuName: critState.sku.name,
            category: critState.sku.category,
            destWarehouseId: destWarehouse.id,
            destWarehouseName: destWarehouse.name,
            destStock: critState.usableStock,
            destRop: critState.mcResult.dynamicRop,
            originWarehouseId: originWh.id,
            originWarehouseName: originWh.name,
            originStock: originCurrentStock,
            originRop: originEstRop,
            originSurplusUnits: availableSurplus,
            recommendedTransferQty: transferQty,
            transitHours,
            transitCostInr: Math.round(transitCostInr),
            stockoutLossPreventedInr,
            status: "PENDING",
          });
          break;
        }
      }
    }
  }

  return recommendations;
}

/**
 * Generates an ANSI X12 EDI 850 Purchase Order format payload
 */
export function generateEdi850Payload(
  poBatch: string,
  warehouse: { id: string; name: string },
  items: { skuId: string; skuName: string; qty: number; unitCost: number; supplier: string }[]
): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const timeStr = new Date().toISOString().slice(11, 16).replace(/:/g, "");

  const segments = [
    `ISA*00*          *00*          *ZZ*RETAILOPS      *ZZ*SAPCLOUD       *${dateStr}*${timeStr}*U*00401*000000001*0*T*:~`,
    `GS*PO*RETAILOPS*SAPCLOUD*20${dateStr}*${timeStr}*1*X*004010~`,
    `ST*850*0001~`,
    `BEG*00*SA*${poBatch}**20${dateStr}~`,
    `CUR*IN*INR~`,
    `REF*DP*${warehouse.id}~`,
    `N1*ST*${warehouse.name}*92*${warehouse.id}~`,
  ];

  items.forEach((item, idx) => {
    segments.push(
      `PO1*${idx + 1}*${item.qty}*EA*${item.unitCost.toFixed(2)}*PE*${item.skuId}*VN*${item.supplier}~`
    );
    segments.push(`PID*F****${item.skuName}~`);
  });

  segments.push(`CTT*${items.length}~`);
  segments.push(`SE*${segments.length - 2}*0001~`);
  segments.push(`GE*1*1~`);
  segments.push(`IEA*1*000000001~`);

  return segments.join("\n");
}

/**
 * Generates initial seed ledger of dispatched POs for enterprise audit tracking
 */
export function getInitialDispatchedLedger(): DispatchedPoRecord[] {
  const now = new Date();
  const t1 = new Date(now.getTime() - 1000 * 60 * 42).toISOString();
  const t2 = new Date(now.getTime() - 1000 * 60 * 180).toISOString();

  const seed1Items = [
    { skuId: "SKU-001", skuName: "Organic Milk 1L", qty: 220, unitCost: 78.0, supplier: "Amul Fresh Dairy Co." },
    { skuId: "SKU-002", skuName: "Avocado Hass 2pk", qty: 240, unitCost: 249.0, supplier: "Hass Valley Orchards" },
  ];

  const seed2Items = [
    { skuId: "SKU-003", skuName: "Protein Granola 500g", qty: 180, unitCost: 425.0, supplier: "TrueElements Organics" },
    { skuId: "SKU-004", skuName: "Cold Brew Coffee 250ml", qty: 260, unitCost: 160.0, supplier: "Blue Tokai Roasters" },
    { skuId: "SKU-005", skuName: "Greek Yogurt 400g", qty: 180, unitCost: 195.0, supplier: "Epigamia Dairy" },
  ];

  return [
    {
      dispatchId: "DSP-20261007-0091",
      poBatchNumber: "PO-20261007-WH-BOM-01",
      warehouseId: "WH-BOM-01",
      warehouseName: "Mumbai Central Dark Store",
      timestamp: t1,
      itemCount: 2,
      totalUnits: 460,
      totalValueInr: 96540,
      erpSystem: "SAP S/4HANA Cloud (EDI 850)",
      endpointUrl: "https://api.erp.retail-logistics.io/v2/orders/inbound",
      httpStatus: 200,
      latencyMs: 142,
      payloadHash: "sha256:7f9a2b8e3d0c41ab82ef10b0f443a290c5819e8315",
      skuList: ["SKU-001 (Organic Milk)", "SKU-002 (Avocado Hass)"],
      rawJsonPayload: JSON.stringify(
        {
          schemaVersion: "2026-10",
          messageType: "PURCHASE_ORDER_OUTBOUND",
          poBatchId: "PO-20261007-WH-BOM-01",
          fulfillmentNode: { id: "WH-BOM-01", name: "Mumbai Central Dark Store" },
          dispatchedAt: t1,
          protocol: "EDI_850_OVER_AS2",
          items: seed1Items,
          signature: "sha256:7f9a2b8e3d0c41ab82ef10b0f443a290c5819e8315",
        },
        null,
        2
      ),
      edi850Payload: generateEdi850Payload(
        "PO-20261007-WH-BOM-01",
        { id: "WH-BOM-01", name: "Mumbai Central Dark Store" },
        seed1Items
      ),
    },
    {
      dispatchId: "DSP-20261007-0088",
      poBatchNumber: "PO-20261007-WH-BLR-02",
      warehouseId: "WH-BLR-02",
      warehouseName: "Bengaluru Indiranagar Hub",
      timestamp: t2,
      itemCount: 3,
      totalUnits: 620,
      totalValueInr: 145200,
      erpSystem: "Oracle NetSuite WMS Webhook",
      endpointUrl: "https://netsuite.quickcommerce-ops.internal/webhook/po-ingress",
      httpStatus: 200,
      latencyMs: 198,
      payloadHash: "sha256:1a84f3c9e67d9834ba90ef81e4b882310ca981249b",
      skuList: ["SKU-003 (Protein Granola)", "SKU-004 (Cold Brew)", "SKU-005 (Greek Yogurt)"],
      rawJsonPayload: JSON.stringify(
        {
          schemaVersion: "2026-10",
          messageType: "PURCHASE_ORDER_OUTBOUND",
          poBatchId: "PO-20261007-WH-BLR-02",
          fulfillmentNode: { id: "WH-BLR-02", name: "Bengaluru Indiranagar Hub" },
          dispatchedAt: t2,
          protocol: "REST_WEBHOOK_JSON",
          items: seed2Items,
          signature: "sha256:1a84f3c9e67d9834ba90ef81e4b882310ca981249b",
        },
        null,
        2
      ),
      edi850Payload: generateEdi850Payload(
        "PO-20261007-WH-BLR-02",
        { id: "WH-BLR-02", name: "Bengaluru Indiranagar Hub" },
        seed2Items
      ),
    },
  ];
}

/**
 * Creates a new dispatched PO record for the audit ledger
 */
export function createDispatchedPoRecord(
  pos: PurchaseOrder[],
  warehouse: Warehouse,
  erpSystem: string = "SAP S/4HANA Cloud (EDI 850)"
): DispatchedPoRecord {
  const now = new Date();
  const dispatchNum = Math.floor(1000 + Math.random() * 9000);
  const totalUnits = pos.reduce((acc, p) => acc + p.recommendedOrderQty, 0);
  const totalVal = pos.reduce((acc, p) => acc + p.totalPoValueInr, 0);
  const hashHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  const poBatchNumber = pos[0]?.poNumber ? pos[0].poNumber.split("-").slice(0, 4).join("-") : `PO-${warehouse.id}`;

  const payloadItems = pos.map((p) => ({
    skuId: p.skuId,
    skuName: p.skuName,
    qty: p.recommendedOrderQty,
    unitCost: p.unitCostInr,
    supplier: p.supplierName,
  }));

  const rawJson = JSON.stringify(
    {
      documentType: "850_PURCHASE_ORDER",
      dispatchId: `DSP-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${dispatchNum}`,
      poBatchNumber,
      warehouseNode: {
        id: warehouse.id,
        name: warehouse.name,
        city: warehouse.city,
      },
      dispatchedTimestampUtc: now.toISOString(),
      targetSystem: erpSystem,
      httpStatusExpected: 200,
      financialCommitment: {
        currency: "INR",
        totalValuation: totalVal,
        totalPhysicalUnits: totalUnits,
      },
      lineItems: pos.map((p, idx) => ({
        lineIndex: idx + 1,
        skuId: p.skuId,
        skuName: p.skuName,
        category: p.category,
        supplierName: p.supplierName,
        supplierGrade: p.supplierGrade,
        orderedQuantity: p.recommendedOrderQty,
        unitCostInr: p.unitCostInr,
        extendedTotalInr: p.totalPoValueInr,
        expectedDeliveryDate: p.expectedDeliveryDate,
        priority: p.priority,
      })),
      cryptoVerification: {
        algorithm: "HMAC-SHA256",
        signature: `sha256:${hashHex}`,
      },
    },
    null,
    2
  );

  const edi850 = generateEdi850Payload(poBatchNumber, warehouse, payloadItems);

  return {
    dispatchId: `DSP-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${dispatchNum}`,
    poBatchNumber,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    timestamp: now.toISOString(),
    itemCount: pos.length,
    totalUnits,
    totalValueInr: totalVal,
    erpSystem,
    endpointUrl: "https://api.erp.retail-logistics.io/v2/orders/inbound",
    httpStatus: 200,
    latencyMs: Math.floor(110 + Math.random() * 90),
    payloadHash: `sha256:${hashHex}`,
    skuList: pos.map((p) => `${p.skuId} (${p.skuName})`),
    rawJsonPayload: rawJson,
    edi850Payload: edi850,
  };
}

export function exportPurchaseOrdersToCsv(pos: PurchaseOrder[]): string {
  if (pos.length === 0) return "";

  const headers = [
    "PO_Number",
    "Warehouse_ID",
    "Warehouse_Name",
    "SKU_ID",
    "SKU_Name",
    "Category",
    "Current_Stock",
    "Usable_Stock",
    "Dynamic_ROP",
    "Safety_Stock",
    "Recommended_Order_Qty",
    "Unit_Cost_INR",
    "Total_PO_Value_INR",
    "Expected_Delivery_Date",
    "Priority",
    "Supplier_Name",
    "Supplier_Grade",
  ];

  const rows = pos.map((p) => [
    p.poNumber,
    p.warehouseId,
    `"${p.warehouseName}"`,
    p.skuId,
    `"${p.skuName}"`,
    p.category,
    p.currentStock,
    p.usableStock,
    p.dynamicRop,
    p.safetyStock,
    p.recommendedOrderQty,
    p.unitCostInr,
    p.totalPoValueInr,
    p.expectedDeliveryDate,
    p.priority,
    `"${p.supplierName}"`,
    p.supplierGrade,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportDispatchedLedgerToCsv(records: DispatchedPoRecord[]): string {
  if (records.length === 0) return "";
  const headers = [
    "Dispatch_ID",
    "PO_Batch_Number",
    "Warehouse_ID",
    "Warehouse_Name",
    "Timestamp",
    "Item_Count",
    "Total_Units",
    "Total_Value_INR",
    "ERP_System",
    "HTTP_Status",
    "Latency_MS",
    "Payload_Hash",
  ];
  const rows = records.map((r) => [
    r.dispatchId,
    r.poBatchNumber,
    r.warehouseId,
    `"${r.warehouseName}"`,
    r.timestamp,
    r.itemCount,
    r.totalUnits,
    r.totalValueInr,
    `"${r.erpSystem}"`,
    r.httpStatus,
    r.latencyMs,
    r.payloadHash,
  ]);
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
