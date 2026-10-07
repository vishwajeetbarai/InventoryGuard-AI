export interface Warehouse {
  id: string;
  name: string;
  city: string;
  region: string;
  demandFactor: number;
}

export interface SkuMetadata {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  baseDemand: number;
  leadTimeMean: number;
  leadTimeStd: number;
  holdingCost: number;
  stockoutPenalty: number;
  stockMultiplier: number;
}

export interface DailyRecord {
  date: string;
  warehouseId: string;
  skuId: string;
  unitsSold: number;
  isPromotionalDay: boolean;
  unitPriceInr: number;
  currentStockLevel: number;
  supplierLeadTimeDays: number;
}

export interface ForecastPoint {
  date: string;
  demand: number;
  lowerBound: number;
  upperBound: number;
}

export interface MonteCarloResult {
  dynamicSafetyStock: number;
  dynamicRop: number;
  expectedLeadTimeDemand: number;
  stockoutProbabilityPct: number;
  simulatedDdlt: number[];
  urgency: "CRITICAL REORDER NOW" | "WARNING" | "OPTIMAL";
  recommendedReorderQty: number;
  p95LeadTimeDemand: number;
  p99LeadTimeDemand: number;
}

export interface SkuSimulationState {
  sku: SkuMetadata;
  currentStock: number;
  forecastPoints: ForecastPoint[];
  historicalSales: { date: string; units: number }[];
  rmse: number;
  mae: number;
  mcResult: MonteCarloResult;
  revenueAtRisk: number;
  effectiveLeadTimeMean: number;
  effectiveLeadTimeStd: number;
}

export interface PurchaseOrder {
  poNumber: string;
  warehouseId: string;
  warehouseName: string;
  skuId: string;
  skuName: string;
  category: string;
  currentStock: number;
  dynamicRop: number;
  safetyStock: number;
  recommendedOrderQty: number;
  unitCostInr: number;
  totalPoValueInr: number;
  expectedDeliveryDate: string;
  priority: "URGENT" | "NORMAL";
}
