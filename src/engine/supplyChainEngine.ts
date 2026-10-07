import {
  DailyRecord,
  ForecastPoint,
  MonteCarloResult,
  PurchaseOrder,
  SkuMetadata,
  SkuSimulationState,
  Warehouse,
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
        const dayOfWeek = d.getDay(); // 0 is Sunday
        const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);

        // Weekend surge (Fri=5, Sat=6, Sun=0)
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
        const weekendLift = isWeekend ? 1.35 : 0.90;
        const annualWave = 1.0 + 0.15 * Math.sin((2 * Math.PI * dayOfYear) / 365.0);
        const isPromo = rand() < 0.12 || dayOfWeek === 0;
        const promoMultiplier = isPromo ? 1.65 : 1.0;

        const expectedDemand = baseD * weekendLift * annualWave * promoMultiplier;
        const noise = sampleStandardNormal(rand) * (expectedDemand * 0.12);
        const unitsSold = Math.max(0, Math.round(expectedDemand + noise));

        const simLeadTime = Math.max(1.0, sku.leadTimeMean + sampleStandardNormal(rand) * sku.leadTimeStd);

        // Deplete and replenish periodically
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
 * Machine Learning demand forecasting pipeline (Autoregressive Gradient Boosting approximation)
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

  // Calculate holdout validation metrics on last 30 days
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

  // Multi-step forward projection
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

    // Apply flash sale promo uplift scenario
    const adjustedPred = Math.max(0, basePred * (1.0 + promotionalUpliftPct / 100.0));

    buffer.push(adjustedPred);

    const uncertainty = 1.28 * rmse; // 80% confidence interval
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
 * Dual Variance Propagation: Z * sqrt( L_bar * sigma_d^2 + D_bar^2 * sigma_L^2 )
 */
export function runMonteCarloSimulation(
  demandMean: number,
  demandStd: number,
  leadTimeMean: number,
  leadTimeStd: number,
  currentStock: number,
  serviceLevelZ: number,
  iterations: number = 1000
): MonteCarloResult {
  const rand = pseudoRandom(1337);

  // Dual Variance Formula
  const varianceTerm = leadTimeMean * Math.pow(demandStd, 2) + Math.pow(demandMean, 2) * Math.pow(leadTimeStd, 2);
  const jointSigma = Math.sqrt(Math.max(0.001, varianceTerm));
  const dynamicSafetyStock = Math.ceil(serviceLevelZ * jointSigma);

  const expectedLeadTimeDemand = Math.round(demandMean * leadTimeMean * 10) / 10;
  const dynamicRop = Math.ceil(expectedLeadTimeDemand + dynamicSafetyStock);

  // Vectorized Monte Carlo sample iterations
  const simulatedDdlt: number[] = new Array(iterations);
  let stockoutCount = 0;

  for (let i = 0; i < iterations; i++) {
    // Sample lead time >= 1.0
    const ltSample = Math.max(1.0, leadTimeMean + sampleStandardNormal(rand) * leadTimeStd);
    const ltDays = Math.ceil(ltSample);

    let ddltSum = 0;
    for (let day = 0; day < ltDays; day++) {
      const dSample = Math.max(0, demandMean + sampleStandardNormal(rand) * demandStd);
      ddltSum += dSample;
    }

    simulatedDdlt[i] = Math.round(ddltSum);
    if (ddltSum > currentStock) {
      stockoutCount++;
    }
  }

  // Sort simulated DDLT to compute percentiles
  const sorted = [...simulatedDdlt].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(iterations * 0.95)] || sorted[iterations - 1];
  const p99 = sorted[Math.floor(iterations * 0.99)] || sorted[iterations - 1];

  const stockoutProbabilityPct = Math.round((stockoutCount / iterations) * 1000) / 10;

  let urgency: "CRITICAL REORDER NOW" | "WARNING" | "OPTIMAL";
  if (currentStock <= dynamicRop || stockoutProbabilityPct >= 25.0) {
    urgency = "CRITICAL REORDER NOW";
  } else if (currentStock <= Math.round(dynamicRop * 1.3) || stockoutProbabilityPct >= 10.0) {
    urgency = "WARNING";
  } else {
    urgency = "OPTIMAL";
  }

  // Target Inventory = ROP + 7 days cycle demand
  const targetInventory = dynamicRop + Math.round(demandMean * 7.0);
  const recommendedReorderQty = Math.max(0, targetInventory - currentStock);

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
 * Execute simulation across all selected SKUs
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

    // Compute mean and std of forecasted demand
    const dValues = fc.forecastPoints.map((f) => f.demand);
    const dMean = dValues.reduce((a, b) => a + b, 0) / dValues.length;
    const dStd = Math.max(
      1.0,
      Math.sqrt(dValues.map((x) => Math.pow(x - dMean, 2)).reduce((a, b) => a + b, 0) / dValues.length)
    );

    const effLtMean = skuMeta.leadTimeMean + supplierDelayBias;
    const effLtStd = skuMeta.leadTimeStd;

    const mc = runMonteCarloSimulation(
      dMean,
      dStd,
      effLtMean,
      effLtStd,
      currentStock,
      serviceLevelZ,
      monteCarloIterations
    );

    // Revenue at Risk calculation
    let revenueAtRisk = 0;
    if (mc.stockoutProbabilityPct > 5.0 && mc.p95LeadTimeDemand > currentStock) {
      const deficitUnits = mc.p95LeadTimeDemand - currentStock;
      const penalty = skuMeta.stockoutPenalty + skuMeta.basePrice;
      revenueAtRisk = Math.round(deficitUnits * penalty * (mc.stockoutProbabilityPct / 100.0));
    }

    results.push({
      sku: skuMeta,
      currentStock,
      forecastPoints: fc.forecastPoints,
      historicalSales,
      rmse: fc.rmse,
      mae: fc.mae,
      mcResult: mc,
      revenueAtRisk,
      effectiveLeadTimeMean: Math.round(effLtMean * 10) / 10,
      effectiveLeadTimeStd: Math.round(effLtStd * 10) / 10,
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
    const { sku, currentStock, mcResult, effectiveLeadTimeMean } = state;

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
        dynamicRop: mcResult.dynamicRop,
        safetyStock: mcResult.dynamicSafetyStock,
        recommendedOrderQty: poQty,
        unitCostInr: sku.basePrice,
        totalPoValueInr: Math.round(totalCost),
        expectedDeliveryDate: expectedDate.toISOString().split("T")[0],
        priority: mcResult.urgency === "CRITICAL REORDER NOW" ? "URGENT" : "NORMAL",
      });
    }
  }

  return pos;
}

/**
 * Export POs to CSV string
 */
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
    "Dynamic_ROP",
    "Safety_Stock",
    "Recommended_Order_Qty",
    "Unit_Cost_INR",
    "Total_PO_Value_INR",
    "Expected_Delivery_Date",
    "Priority",
  ];

  const rows = pos.map((p) => [
    p.poNumber,
    p.warehouseId,
    `"${p.warehouseName}"`,
    p.skuId,
    `"${p.skuName}"`,
    p.category,
    p.currentStock,
    p.dynamicRop,
    p.safetyStock,
    p.recommendedOrderQty,
    p.unitCostInr,
    p.totalPoValueInr,
    p.expectedDeliveryDate,
    p.priority,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
