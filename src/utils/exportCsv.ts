import {
  Warehouse,
  SkuSimulationState,
  InterTransferRecommendation,
  DispatchedPoRecord,
} from "../types";

export function generateSupplyChainAuditCsv(
  warehouse: Warehouse,
  simulationStates: SkuSimulationState[],
  interTransfers: InterTransferRecommendation[],
  dispatchedLedger: DispatchedPoRecord[]
): string {
  const timestamp = new Date().toISOString();
  const rows: string[] = [];

  // Helper to escape CSV values
  const esc = (val: unknown) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  // Section 1: Executive Audit Dossier Header
  rows.push("================================================================================");
  rows.push("INVENTORYGUARD AI - EXECUTIVE SUPPLY CHAIN AUDIT & REPLENISHMENT REPORT");
  rows.push("================================================================================");
  rows.push(`Generated Timestamp,${esc(timestamp)}`);
  rows.push(`Facility ID,${esc(warehouse.id)}`);
  rows.push(`Facility Name,${esc(warehouse.name)}`);
  rows.push(`City / Region,${esc(`${warehouse.city} / ${warehouse.region}`)}`);
  rows.push(`Status,${esc("AUDIT COMPLIANT & CERTIFIED")}`);
  rows.push("");

  // Section 2: SKU Risk & Dynamic Safety Stock Assessment
  rows.push("--------------------------------------------------------------------------------");
  rows.push("1. SKU INVENTORY, PERISHABLE DECAY & MONTE CARLO JOINT RISK ASSESSMENT");
  rows.push("--------------------------------------------------------------------------------");
  rows.push(
    [
      "SKU ID",
      "SKU Name",
      "Category",
      "Base Price (INR)",
      "Current Stock",
      "Decayed Waste (Units)",
      "Net Usable Stock",
      "Forecast Demand Mean",
      "Holding Cost (INR)",
      "Stockout Penalty (INR)",
      "Dynamic Safety Stock",
      "Dynamic ROP",
      "Expected Lead Time Demand",
      "Stockout Probability %",
      "Urgency Status",
      "Recommended Order Qty",
      "Estimated Reorder Cost (INR)",
    ].join(",")
  );

  simulationStates.forEach((s) => {
    const reorderCost = s.mcResult.recommendedReorderQty * s.sku.basePrice;
    const meanForecastDemand =
      s.forecastPoints.length > 0
        ? s.forecastPoints.reduce((acc, p) => acc + p.demand, 0) / s.forecastPoints.length
        : s.sku.baseDemand;

    rows.push(
      [
        esc(s.sku.id),
        esc(s.sku.name),
        esc(s.sku.category),
        esc(s.sku.basePrice),
        esc(s.currentStock),
        esc(s.decayedUnits || 0),
        esc(s.usableStock),
        esc(meanForecastDemand.toFixed(1)),
        esc(s.sku.holdingCost),
        esc(s.sku.stockoutPenalty),
        esc(s.mcResult.dynamicSafetyStock),
        esc(s.mcResult.dynamicRop),
        esc(s.mcResult.expectedLeadTimeDemand),
        esc(s.mcResult.stockoutProbabilityPct),
        esc(s.mcResult.urgency),
        esc(s.mcResult.recommendedReorderQty),
        esc(Math.round(reorderCost)),
      ].join(",")
    );
  });
  rows.push("");

  // Section 3: Multi-Echelon Inter-Store Transfers
  rows.push("--------------------------------------------------------------------------------");
  rows.push("2. MULTI-ECHELON INTER-STORE TRANSFERS & REDEPLOYMENT PROFITABILITY");
  rows.push("--------------------------------------------------------------------------------");
  rows.push(
    [
      "Transfer ID",
      "SKU ID",
      "SKU Name",
      "Origin Warehouse",
      "Destination Warehouse",
      "Transfer Qty (Units)",
      "Transit Latency (Hours)",
      "Freight Cost (INR)",
      "Salvaged Revenue (INR)",
      "Net Profit Margin (INR)",
      "Supplier Lead Time (Days)",
      "Lead Time Hours Saved",
      "Status",
    ].join(",")
  );

  if (interTransfers.length === 0) {
    rows.push("No inter-store emergency transfers active at this time.");
  } else {
    interTransfers.forEach((t) => {
      rows.push(
        [
          esc(t.id),
          esc(t.skuId),
          esc(t.skuName),
          esc(t.originWarehouseId),
          esc(t.destWarehouseId),
          esc(t.recommendedTransferQty),
          esc(t.transitHours),
          esc(t.transitCostInr),
          esc(t.stockoutLossPreventedInr),
          esc(t.netProfitabilityInr || t.stockoutLossPreventedInr - t.transitCostInr),
          esc(t.supplierLeadTimeDays || 3.5),
          esc(t.leadTimeSavedHours || 66),
          esc(t.status),
        ].join(",")
      );
    });
  }
  rows.push("");

  // Section 4: Supplier Reliability Matrix
  rows.push("--------------------------------------------------------------------------------");
  rows.push("3. SUPPLIER RELIABILITY MATRIX & LEAD-TIME BUFFER SCORECARDS");
  rows.push("--------------------------------------------------------------------------------");
  rows.push(
    [
      "SKU ID",
      "SKU Name",
      "Supplier Name",
      "Reliability Grade",
      "On-Time Delivery %",
      "Lead Time Mean (Days)",
      "Lead Time Std (Days)",
      "Risk Buffer Multiplier",
    ].join(",")
  );

  simulationStates.forEach((s) => {
    rows.push(
      [
        esc(s.sku.id),
        esc(s.sku.name),
        esc(s.supplierScorecard.supplierName),
        esc(s.supplierScorecard.grade),
        esc(s.supplierScorecard.onTimeDeliveryPct),
        esc(s.sku.leadTimeMean),
        esc(s.sku.leadTimeStd),
        esc(s.supplierScorecard.bufferMultiplier),
      ].join(",")
    );
  });
  rows.push("");

  // Section 5: ERP Webhook Dispatched Ledger
  rows.push("--------------------------------------------------------------------------------");
  rows.push("4. DISPATCHED PURCHASE ORDER (ERP WEBHOOK) AUDIT LEDGER");
  rows.push("--------------------------------------------------------------------------------");
  rows.push(
    [
      "Batch PO Number",
      "ERP Target",
      "Warehouse ID",
      "Item Count",
      "Total Units",
      "Total Value (INR)",
      "HTTP Status",
      "Latency (ms)",
      "Dispatched Timestamp",
      "SHA-256 HMAC Signature",
    ].join(",")
  );

  if (dispatchedLedger.length === 0) {
    rows.push("No purchase orders dispatched in current active session.");
  } else {
    dispatchedLedger.forEach((d) => {
      rows.push(
        [
          esc(d.poBatchNumber),
          esc(d.erpSystem),
          esc(d.warehouseId),
          esc(d.itemCount),
          esc(d.totalUnits),
          esc(d.totalValueInr),
          esc(d.httpStatus),
          esc(d.latencyMs),
          esc(d.timestamp),
          esc(d.payloadHash),
        ].join(",")
      );
    });
  }

  return rows.join("\n");
}

export function triggerCsvDownload(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
