import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini API Client initialization
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const DEFAULT_SYSTEM_INSTRUCTION = `You are the InventoryGuard AI Copilot & Supply Chain Intelligence Specialist.
Your mission is to welcome new and existing users, answer questions, explain concepts, and guide them through the InventoryGuard AI application.

APPLICATION ARCHITECTURE & CAPABILITIES:
1. OVERVIEW & SUPPLY CHAIN CONTROL TOWER:
   - Real-time multi-echelon network visibility across regional dark stores / fulfillment centers (e.g., Mumbai Central WH-MUM-01, Bangalore South WH-BLR-02, Delhi NCR WH-DEL-03).
   - High-density KPI metrics: Stockout Risk Exposure, 30-Day Working Capital, Stockout Rate %, OTIF Delivery.
   - Interactive Dark Store Corridor Network Topology Map with live transit pulses and inter-facility transfer lanes.
   - Facility Comparative Performance & Multi-Echelon Benchmarking Matrix.

2. INVENTORY & FORECAST WORKSPACE:
   - High-velocity demand forecasting using LightGBM / Gradient Boosting algorithms with configurable forecast horizons (7, 14, 21, 30 days).
   - Dual-Variance Dynamic Safety Stock Formula:
     SS = Z * sqrt(L * sigma_d^2 + D^2 * sigma_L^2)
     where Z = Cycle Service Level factor (e.g. 1.28 for 90%, 1.645 for 95%, 2.054 for 98%, 2.326 for 99%, 2.576 for 99.5%),
     L = Lead Time mean, sigma_d = daily demand standard deviation, D = daily demand mean, sigma_L = lead time standard deviation.
   - Reorder Point (ROP): ROP = (Daily Demand * Lead Time) + Safety Stock.
   - Perishable Shelf-Life Decay & Batch Expiry: Models daily degradation for perishables (Dairy, Hass Avocados, Bakery) so reorders are based on usable unexpired stock.
   - Monte Carlo joint stochastic risk simulation (1,000 to 10,000 iterations).

3. PROCUREMENT & ROUTING INTELLIGENCE:
   - Automated Purchase Order (PO) batch generation with EOQ sizing.
   - Buy vs. Transfer Optimization: Evaluates whether neighboring dark stores have surplus inventory to transfer via Green EV routes before generating external purchase orders, saving lead-time and freight cost.
   - Supplier Scorecard Matrix: Evaluates suppliers (Grade A through F) on OTIF % (On-Time In-Full), lead-time variance, and automatic SLA chargeback debit notes.
   - ANSI X12 EDI 850 payload inspection and cryptographic HMAC-SHA256 event audit logging.

4. OPERATIONS COMMAND CENTER & DATA HUB:
   - Live exception detection and resolution workflows (stockouts, batch expiries, vendor delays).
   - Facility throughput and fulfillment health.
   - WMS / ERP CSV Drag-and-drop data ingestion with schema mapping and validation.
   - Simulation Lab with scenario shocks: Monsoon Weather Deluge (+40%), Flash Sale Surge (+65%), Freight Logistics Strike.
   - Python / Streamlit code inspection (app.py).

TONE & STYLE GUIDELINES:
- Welcoming, clear, concise, and mathematically authoritative.
- When explaining formulas, format them clearly with variable definitions and real-world examples.
- When guiding a new user, explain where to click or navigate within the app (e.g. "You can switch dark stores from the facility dropdown in the top header", "Press Cmd+K to launch the Command Palette").
- If asked about live context (active warehouse, SKU count, critical risks), refer to the provided context data.`;

// POST /api/chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const {
      messages = [],
      model = "gemini-3.8-flash",
      systemInstruction = DEFAULT_SYSTEM_INSTRUCTION,
      context = {},
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing or invalid 'messages' array" });
    }

    // Supported models per system guidelines
    const allowedModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-4-argon"];
    const selectedModel = allowedModels.includes(model) ? model : "gemini-3.8-flash";

    // Enrich system instruction with active runtime context if provided
    let enrichedInstruction = systemInstruction;
    if (context && Object.keys(context).length > 0) {
      enrichedInstruction += `\n\nCURRENT APPLICATION RUNTIME CONTEXT:
- Active Dark Store Node: ${context.currentWarehouse?.name || "Mumbai Central Hub"} (${context.currentWarehouse?.city || "Mumbai"})
- Active Workspace Page: ${context.activePage || "overview"}
- Active SKU Selection: ${context.selectedSkuName || "None"} (${context.selectedSkuId || "N/A"})
- Critical Risk SKUs Count: ${context.criticalCount ?? 0}
- Current Base Currency: ${context.currency || "USD"}
- User Role: ${context.userRole || "Inventory Manager"}
- Crisis Scenario Active: ${context.activeCrisisPreset || "Normal Baseline"}`;
    }

    // Format contents array for GoogleGenAI multi-turn chat
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contents,
      config: {
        systemInstruction: enrichedInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I processed your request, but received an empty response.";

    return res.json({
      text: replyText,
      model: selectedModel,
    });
  } catch (err: any) {
    console.error("Gemini API error:", err);
    return res.status(500).json({
      error: err.message || "Failed to process chat query with Gemini API",
    });
  }
});

// GET /api/health endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} (production: ${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
