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
  shelfLifeDays: number;
  isPerishable: boolean;
  supplierName: string;
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

export interface SupplierScorecard {
  skuId: string;
  skuName: string;
  supplierName: string;
  grade: "A" | "B" | "C" | "D" | "F";
  onTimeDeliveryPct: number;
  effectiveStdDays: number;
  bufferMultiplier: number;
  riskTier: "LOW" | "MODERATE" | "ELEVATED" | "CRITICAL";
  auditNotes: string;
}

export interface SkuSimulationState {
  sku: SkuMetadata;
  currentStock: number;
  usableStock: number;
  decayedUnits: number;
  decayRatePct: number;
  forecastPoints: ForecastPoint[];
  historicalSales: { date: string; units: number }[];
  rmse: number;
  mae: number;
  mcResult: MonteCarloResult;
  revenueAtRisk: number;
  effectiveLeadTimeMean: number;
  effectiveLeadTimeStd: number;
  supplierScorecard: SupplierScorecard;
}

export interface PurchaseOrder {
  poNumber: string;
  warehouseId: string;
  warehouseName: string;
  skuId: string;
  skuName: string;
  category: string;
  currentStock: number;
  usableStock: number;
  dynamicRop: number;
  safetyStock: number;
  recommendedOrderQty: number;
  unitCostInr: number;
  totalPoValueInr: number;
  expectedDeliveryDate: string;
  priority: "URGENT" | "NORMAL";
  supplierName: string;
  supplierGrade: string;
}

export interface InterTransferRecommendation {
  id: string;
  skuId: string;
  skuName: string;
  category: string;
  destWarehouseId: string;
  destWarehouseName: string;
  destStock: number;
  destRop: number;
  originWarehouseId: string;
  originWarehouseName: string;
  originStock: number;
  originRop: number;
  originSurplusUnits: number;
  recommendedTransferQty: number;
  transitHours: number;
  transitCostInr: number;
  stockoutLossPreventedInr: number;
  status: "PENDING" | "APPROVED" | "IN_TRANSIT";
}

export interface DispatchedPoRecord {
  dispatchId: string;
  poBatchNumber: string;
  warehouseId: string;
  warehouseName: string;
  timestamp: string;
  itemCount: number;
  totalUnits: number;
  totalValueInr: number;
  erpSystem: string;
  endpointUrl: string;
  httpStatus: number;
  latencyMs: number;
  payloadHash: string;
  skuList: string[];
  rawJsonPayload: string;
  edi850Payload: string;
}
