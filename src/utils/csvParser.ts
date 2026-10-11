import { SkuMetadata, DailyRecord, Warehouse } from "../types";

export interface ParsedCsvResult {
  headers: string[];
  rawRows: Record<string, string>[];
  totalRows: number;
}

export interface ColumnMapping {
  skuId: string;
  skuName: string;
  category: string;
  warehouseId: string;
  currentStock: string;
  unitsSold: string;
  date: string;
  unitCost: string;
  leadTimeDays: string;
  shelfLifeDays: string;
  isPerishable: string;
  supplierName: string;
}

/**
 * Robust CSV/TSV Parser that handles quoted strings and commas
 */
export function parseRawCsvText(text: string): ParsedCsvResult {
  const lines = text.trim().split(/\r\n|\n|\r/);
  if (lines.length === 0 || !lines[0].trim()) {
    return { headers: [], rawRows: [], totalRows: 0 };
  }

  // Detect delimiter (comma vs tab vs semicolon)
  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;

  let delimiter = ",";
  if (tabCount > commaCount && tabCount > semiCount) delimiter = "\t";
  else if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";

  function splitLine(line: string): string[] {
    const row: string[] = [];
    let insideQuotes = false;
    let entry = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        row.push(entry.trim());
        entry = "";
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    return row;
  }

  const rawHeaders = splitLine(lines[0]);
  const headers = rawHeaders.map((h) => h.replace(/^"|"$/g, "").trim());

  const rawRows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitLine(line);
    const rowObj: Record<string, string> = {};
    headers.forEach((hdr, idx) => {
      rowObj[hdr] = (values[idx] || "").replace(/^"|"$/g, "").trim();
    });
    rawRows.push(rowObj);
  }

  return {
    headers,
    rawRows,
    totalRows: rawRows.length,
  };
}

/**
 * Intelligent Column Heuristic Matcher
 */
export function guessColumnMapping(headers: string[]): ColumnMapping {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  const findBest = (patterns: string[]): string => {
    for (const h of headers) {
      const norm = normalize(h);
      for (const p of patterns) {
        if (norm === p || norm.includes(p)) return h;
      }
    }
    return "";
  };

  return {
    skuId: findBest(["skuid", "sku", "itemid", "productid", "itemcode", "matnr", "material", "code"]),
    skuName: findBest(["skuname", "itemname", "productname", "description", "title", "name", "desc"]),
    category: findBest(["category", "dept", "department", "family", "group", "productline"]),
    warehouseId: findBest(["warehouseid", "warehouse", "location", "site", "storeid", "darkstore", "facility", "wh"]),
    currentStock: findBest(["currentstock", "stock", "onhand", "inventory", "stocklevel", "qty", "balance", "available"]),
    unitsSold: findBest(["unitssold", "demand", "sales", "qtydemand", "dailysales", "sold", "volume", "velocity"]),
    date: findBest(["date", "timestamp", "day", "orderdate", "transactiondate", "period"]),
    unitCost: findBest(["unitcost", "cost", "unitprice", "price", "mrp", "rate", "costprice", "baseprice"]),
    leadTimeDays: findBest(["leadtimedays", "leadtime", "lt", "suppliertimedays", "deliverydays", "turnaround"]),
    shelfLifeDays: findBest(["shelflifedays", "shelflife", "expiry", "expirydays", "usebydays"]),
    isPerishable: findBest(["isperishable", "perishable", "coldchain", "chilled", "fresh"]),
    supplierName: findBest(["suppliername", "supplier", "vendor", "vendorname", "source"]),
  };
}

/**
 * Convert user uploaded rows into engine-compatible types
 */
export function transformRowsToEngineDataset(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  datasetName: string = "Uploaded Enterprise Catalog"
): {
  warehouses: Warehouse[];
  skus: SkuMetadata[];
  records: DailyRecord[];
} {
  const skusMap = new Map<string, SkuMetadata>();
  const whMap = new Map<string, Warehouse>();
  const records: DailyRecord[] = [];

  const parseNum = (val: any, fallback: number = 0): number => {
    const cleaned = String(val || "").replace(/[^0-9.-]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? fallback : n;
  };

  const parseBool = (val: any, fallback: boolean = false): boolean => {
    if (!val) return fallback;
    const s = String(val).toLowerCase().trim();
    return s === "true" || s === "1" || s === "yes" || s === "y" || s === "perishable";
  };

  rawRows.forEach((row, idx) => {
    const skuId = (mapping.skuId && row[mapping.skuId]) || `SKU-${String(idx + 1).padStart(3, "0")}`;
    const skuName = (mapping.skuName && row[mapping.skuName]) || `Item ${skuId}`;
    const category = (mapping.category && row[mapping.category]) || "General Merchandise";
    const whId = (mapping.warehouseId && row[mapping.warehouseId]) || "WH-USER-01";
    const currentStock = Math.max(0, parseNum(mapping.currentStock && row[mapping.currentStock], 120));
    const unitsSold = Math.max(0, parseNum(mapping.unitsSold && row[mapping.unitsSold], 25));
    const unitCost = Math.max(1, parseNum(mapping.unitCost && row[mapping.unitCost], 150));
    const leadTime = Math.max(1, parseNum(mapping.leadTimeDays && row[mapping.leadTimeDays], 3));
    const shelfLife = Math.max(1, parseNum(mapping.shelfLifeDays && row[mapping.shelfLifeDays], 14));
    const isPerishable = parseBool(mapping.isPerishable && row[mapping.isPerishable], shelfLife <= 14);
    const supplierName = (mapping.supplierName && row[mapping.supplierName]) || "Primary Vendor Co.";
    const dateStr = (mapping.date && row[mapping.date]) || new Date().toISOString().split("T")[0];

    // Register warehouse if not yet registered
    if (!whMap.has(whId)) {
      whMap.set(whId, {
        id: whId,
        name: whId.includes("WH") ? `Facility ${whId}` : whId,
        city: "Primary Hub",
        region: "Regional Center",
        demandFactor: 1.0,
      });
    }

    // Register SKU if not registered
    if (!skusMap.has(skuId)) {
      skusMap.set(skuId, {
        id: skuId,
        name: skuName,
        category,
        basePrice: Math.round(unitCost * 100) / 100,
        baseDemand: unitsSold > 0 ? unitsSold : 40,
        leadTimeMean: Math.round(leadTime * 10) / 10,
        leadTimeStd: Math.max(0.5, Math.round(leadTime * 0.25 * 10) / 10),
        holdingCost: Math.round(unitCost * 0.02 * 100) / 100,
        stockoutPenalty: Math.round(unitCost * 0.45 * 100) / 100,
        stockMultiplier: Math.max(1.5, Math.min(5.0, Math.round((currentStock / (unitsSold || 20)) * 10) / 10)),
        shelfLifeDays: shelfLife,
        isPerishable,
        supplierName,
        weatherSensitivity: isPerishable ? 1.25 : 0.8,
      });
    }

    // Add daily record
    records.push({
      date: dateStr,
      warehouseId: whId,
      skuId,
      unitsSold,
      isPromotionalDay: false,
      unitPriceInr: unitCost,
      currentStockLevel: currentStock,
      supplierLeadTimeDays: leadTime,
    });
  });

  // If there are few historical records per SKU, expand backward to simulate 30 days of real demand series
  const expandedRecords: DailyRecord[] = [];
  const uniqueSkus = Array.from(skusMap.values());
  const uniqueWhs = Array.from(whMap.values());

  uniqueWhs.forEach((wh) => {
    uniqueSkus.forEach((sku) => {
      const existingForSku = records.filter((r) => r.warehouseId === wh.id && r.skuId === sku.id);
      if (existingForSku.length >= 14) {
        expandedRecords.push(...existingForSku);
      } else {
        // Expand 30-day baseline
        const baseD = sku.baseDemand;
        const now = new Date();
        for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
          const d = new Date(now);
          d.setDate(d.getDate() - dayOffset);
          const dayOfWeek = d.getDay();
          const weekendLift = dayOfWeek === 0 || dayOfWeek === 6 ? 1.35 : 1.0;
          const noise = (Math.sin(dayOffset * 1.5) * 0.2 + (Math.random() - 0.5) * 0.25);
          const simDemand = Math.max(2, Math.round(baseD * weekendLift * (1 + noise)));
          const simStock = Math.max(0, Math.round(sku.baseDemand * sku.stockMultiplier * (1 - (dayOffset % 5) * 0.15)));

          expandedRecords.push({
            date: d.toISOString().split("T")[0],
            warehouseId: wh.id,
            skuId: sku.id,
            unitsSold: simDemand,
            isPromotionalDay: dayOfWeek === 0,
            unitPriceInr: sku.basePrice,
            currentStockLevel: dayOffset === 0 ? (existingForSku[0]?.currentStockLevel || simStock) : simStock,
            supplierLeadTimeDays: sku.leadTimeMean,
          });
        }
      }
    });
  });

  return {
    warehouses: Array.from(whMap.values()),
    skus: uniqueSkus,
    records: expandedRecords,
  };
}

/**
 * Sample Enterprise Datasets for instant pilot demos
 */
export const PREPACKAGED_ENTERPRISE_DATASETS = {
  QUICK_COMMERCE_DARKSTORE: {
    name: "Quick-Commerce Dark Store Hub (Zepto/Blinkit 12-SKU)",
    description: "High-velocity hyper-perishable FMCG, dairy cold-chain, and ambient fast-movers with shelf-life under 7 days.",
    csvContent: `SKU_ID,ITEM_NAME,CATEGORY,WAREHOUSE_ID,CURRENT_STOCK,DAILY_DEMAND,UNIT_COST_INR,LEAD_TIME_DAYS,SHELF_LIFE_DAYS,IS_PERISHABLE,SUPPLIER_NAME
SKU-QC-101,A2 Organic Whole Milk 1L,Dairy Cold-Chain,WH-BOM-01,95,180,82.00,1.5,3,TRUE,Country Delight Fresh Farms
SKU-QC-102,Artisan Sourdough Loaf 400g,Bakery & Fresh,WH-BOM-01,24,65,145.00,1.0,2,TRUE,The Baker's Dozen
SKU-QC-103,Hass Avocado Mexico 2-Pack,Fresh Produce,WH-BOM-01,42,80,260.00,3.0,4,TRUE,Freshop Agri-Logistics
SKU-QC-104,Cold Pressed Orange Juice 300ml,Beverages Cold,WH-BOM-01,30,95,120.00,2.0,5,TRUE,Raw Pressery Beverages
SKU-QC-105,Farm Fresh Brown Eggs 6-Pack,Poultry & Fresh,WH-BOM-01,110,140,95.00,2.0,10,TRUE,Eggoz Fresh Farms
SKU-QC-106,Greek Blueberry Yogurt 200g,Dairy Cold-Chain,WH-BOM-01,38,110,85.00,2.5,5,TRUE,Epigamia Cold Foods
SKU-QC-107,Tender Coconut Water 200ml,Beverages,WH-BOM-01,160,130,55.00,3.0,30,FALSE,Raw Nature Organics
SKU-QC-108,Protein Granola Dark Chocolate 450g,Ambient Grocery,WH-BOM-01,85,50,449.00,5.0,90,FALSE,TrueElements Foods
SKU-QC-109,Organic Baby Spinach 200g,Fresh Produce,WH-BOM-01,18,75,45.00,1.0,2,TRUE,Kisankonnect Fresh
SKU-QC-110,Whey Protein Isolate Sachet 30g,Health & Wellness,WH-BOM-01,190,85,135.00,4.0,180,FALSE,MuscleBlaze Nutrition
SKU-QC-111,Artisan Mozzarella Cheese 200g,Dairy Cold-Chain,WH-BOM-01,28,45,210.00,3.0,8,TRUE,Flanders Dairy Co.
SKU-QC-112,Sparkling Cold Brew Can 250ml,Ready-To-Drink,WH-BOM-01,62,90,140.00,2.5,14,TRUE,Blue Tokai Coffee
`,
  },

  PHARMA_COLD_CHAIN: {
    name: "Pharma Cold-Chain & Vaccine 3PL Hub",
    description: "Strict 2°C–8°C temperature sensitive biopharmaceuticals, insulins, diagnostic kits with critical stockout penalties.",
    csvContent: `SKU_ID,ITEM_NAME,CATEGORY,WAREHOUSE_ID,CURRENT_STOCK,DAILY_DEMAND,UNIT_COST_INR,LEAD_TIME_DAYS,SHELF_LIFE_DAYS,IS_PERISHABLE,SUPPLIER_NAME
MED-CC-201,Insulin Glargine Pen 100IU,Cold-Chain Pharma,WH-BLR-02,45,60,680.00,3.5,60,TRUE,Sanofi Biologics India
MED-CC-202,mRNA Pediatric Vaccine Vial,Vaccines 2-8C,WH-BLR-02,28,40,1250.00,4.0,30,TRUE,Serum Institute Supply
MED-CC-203,Rapid RT-PCR Diagnostics Kit 25pk,Diagnostics Lab,WH-BLR-02,120,95,850.00,2.0,120,FALSE,Mylab Discovery Solutions
MED-CC-204,Heparin Sodium Injection 5000IU,Emergency Critical,WH-BLR-02,32,55,340.00,2.5,45,TRUE,Gland Pharma Logistics
MED-CC-205,Sterile Saline IV Infusion 500ml,Infusion & Fluid,WH-BLR-02,340,180,65.00,2.0,365,FALSE,Aculife Healthcare
MED-CC-206,Interferon Alpha Pre-filled Syringe,Biologics Cold,WH-BLR-02,16,25,2800.00,5.0,25,TRUE,Biocon Biologics Ltd
MED-CC-207,Nitrile Exam Gloves Box 100pk,Medical Consumables,WH-BLR-02,210,110,480.00,4.0,730,FALSE,Kimberly-Clark Health
MED-CC-208,Monoclonal Antibody Infusion Vial,Specialty Oncology,WH-BLR-02,8,12,8500.00,6.0,40,TRUE,Roche India Specialty
`,
  },

  D2C_RETAIL_OMNICHANNEL: {
    name: "Omnichannel D2C Retail & Apparel Fulfillment",
    description: "Fast-fashion, lifestyle footwear, accessories with seasonal demand spikes and promotional sensitivity.",
    csvContent: `SKU_ID,ITEM_NAME,CATEGORY,WAREHOUSE_ID,CURRENT_STOCK,DAILY_DEMAND,UNIT_COST_INR,LEAD_TIME_DAYS,SHELF_LIFE_DAYS,IS_PERISHABLE,SUPPLIER_NAME
RET-OM-301,Pro-Fit Seamless Performance Tee M,Activewear,WH-DEL-03,85,120,899.00,6.0,365,FALSE,Alcis Sports Tech
RET-OM-302,Carbon-Plated Road Running Shoe 9,Footwear Tech,WH-DEL-03,34,45,4599.00,8.0,730,FALSE,Vibram Apex Distribution
RET-OM-303,Insulated Hydro Flask 1000ml,Gear & Hydration,WH-DEL-03,110,70,1299.00,5.0,1000,FALSE,HydroVibe Global
RET-OM-304,ANC Wireless Earbuds Matte Black,Electronics D2C,WH-DEL-03,48,85,2999.00,7.0,500,FALSE,AcousticLab Shenzhen
RET-OM-305,Ultralight Packable Windbreaker L,Outerwear,WH-DEL-03,26,60,2199.00,6.5,730,FALSE,Wildcraft Technical Wear
RET-OM-306,Recovery Foam Roller High-Density,Fitness Hardware,WH-DEL-03,75,40,799.00,4.0,1200,FALSE,Decathlon Sourcing
`,
  },
};

/**
 * Generate sample CSV template for users to download
 */
export function generateSampleCsvTemplate(): string {
  return `SKU_ID,ITEM_NAME,CATEGORY,WAREHOUSE_ID,CURRENT_STOCK,DAILY_DEMAND,UNIT_COST_INR,LEAD_TIME_DAYS,SHELF_LIFE_DAYS,IS_PERISHABLE,SUPPLIER_NAME
SKU-SAMPLE-01,Organic Cow Milk 1L,Dairy,WH-BOM-01,80,120,75.00,2.0,3,TRUE,Heritage Foods
SKU-SAMPLE-02,Sourdough Bread 400g,Bakery,WH-BOM-01,35,60,120.00,1.5,2,TRUE,Artisan Bakers
SKU-SAMPLE-03,Protein Bar Box 12pk,Snacks,WH-BOM-01,150,45,650.00,5.0,90,FALSE,YogaBar Nutrition
SKU-SAMPLE-04,Cold Brew Coffee 250ml,Beverages,WH-BOM-01,40,85,160.00,2.5,14,TRUE,Blue Tokai
SKU-SAMPLE-05,Hass Avocado 2pk,Fresh,WH-BOM-01,25,50,220.00,3.0,5,TRUE,FreshFarms
`;
}
