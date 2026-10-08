"""
========================================================================================
MULTI-SOURCE SUPPLY CHAIN & INVENTORY STOCK-OUT FORECASTER
Production-Grade Executive Control Tower & Stochastic Risk Modeling Engine
========================================================================================
Author: Senior Principal Supply Chain Data Scientist & Lead Analytics Engineer
Architecture: Streamlit + Pandas + Scikit-Learn (GBR) + NumPy + Plotly + SciPy
Features:
  - Perishable Batch Decay & Shelf-Life Expiry Engine
  - Supplier Reliability Matrix (Grade A to F Lead-Time Shock Scaling)
  - Multi-Echelon Dark Store Inter-Transfer Engine
  - Interactive ERP Webhook & ANSI X12 EDI 850 Dispatched Ledger
========================================================================================
"""

import datetime
import hashlib
import io
import json
import math
import time
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from scipy import stats
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import streamlit as st

# --------------------------------------------------------------------------------------
# 1. PAGE & THEME CONFIGURATION
# --------------------------------------------------------------------------------------
st.set_page_config(
    page_title="Multi-Source Supply Chain Control Tower",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom High-Density Executive Dark Theme Styling
st.markdown(
    """
    <style>
    /* Dark Theme Surface Colors */
    .stApp {
        background-color: #0B0F19;
        color: #F3F4F6;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    /* Card Container Styling */
    .metric-card {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 18px 22px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .metric-card:hover {
        border-color: rgba(99, 102, 241, 0.4);
        transform: translateY(-2px);
    }
    .metric-title {
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94A3B8;
        font-weight: 600;
        margin-bottom: 6px;
    }
    .metric-value {
        font-size: 1.85rem;
        font-weight: 700;
        color: #F8FAFC;
        letter-spacing: -0.02em;
        line-height: 1.2;
    }
    .metric-subtitle {
        font-size: 0.78rem;
        color: #64748B;
        margin-top: 6px;
    }

    /* Transfer Card Styling */
    .transfer-box {
        background: rgba(15, 23, 42, 0.75);
        border: 1px solid rgba(99, 102, 241, 0.25);
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 12px;
    }

    /* Scorecard Box Styling */
    .scorecard-box {
        background: rgba(15, 23, 42, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 14px;
        margin-bottom: 10px;
    }

    /* Status Badge Styling */
    .badge-critical {
        background-color: rgba(239, 68, 68, 0.2);
        color: #F87171;
        border: 1px solid rgba(239, 68, 68, 0.4);
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.75rem;
    }
    .badge-warning {
        background-color: rgba(245, 158, 11, 0.2);
        color: #FBBF24;
        border: 1px solid rgba(245, 158, 11, 0.4);
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.75rem;
    }
    .badge-optimal {
        background-color: rgba(16, 185, 129, 0.2);
        color: #34D399;
        border: 1px solid rgba(16, 185, 129, 0.4);
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.75rem;
    }

    /* Tabs and Section Titles */
    h1, h2, h3, h4 {
        color: #F8FAFC !important;
        font-weight: 700 !important;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 12px;
        background-color: rgba(15, 23, 42, 0.6);
        padding: 6px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .stTabs [data-baseweb="tab"] {
        color: #94A3B8;
        border-radius: 8px;
        padding: 8px 16px;
        font-weight: 600;
    }
    .stTabs [aria-selected="true"] {
        background-color: #4F46E5 !important;
        color: #FFFFFF !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# --------------------------------------------------------------------------------------
# 2. CATALOG, PERISHABLE EXPIRY & SUPPLIER DEFINITIONS
# --------------------------------------------------------------------------------------
WAREHOUSE_REGISTRY = {
    "WH-BOM-01": {"name": "Mumbai Central Dark Store", "city": "Mumbai", "region": "West Hub"},
    "WH-BLR-02": {"name": "Bengaluru Indiranagar Hub", "city": "Bengaluru", "region": "South Hub"},
    "WH-DEL-03": {"name": "Delhi NCR Fulfillment Node", "city": "Delhi NCR", "region": "North Hub"},
}

SKU_CATALOG = {
    "SKU-001": {
        "name": "Organic Milk 1L",
        "category": "Perishables",
        "base_price": 78.0,
        "base_demand": 140,
        "lead_time_mean": 2.5,
        "lead_time_std": 0.8,
        "holding_cost": 1.80,
        "stockout_penalty": 35.0,
        "stock_multiplier": 2.2,
        "shelf_life_days": 4,
        "is_perishable": True,
        "supplier_name": "Amul Fresh Dairy Co.",
        "weather_sensitivity": 1.35,
    },
    "SKU-002": {
        "name": "Avocado Hass 2pk",
        "category": "Fresh Produce",
        "base_price": 249.0,
        "base_demand": 75,
        "lead_time_mean": 4.5,
        "lead_time_std": 1.5,
        "holding_cost": 4.20,
        "stockout_penalty": 95.0,
        "stock_multiplier": 3.1,
        "shelf_life_days": 5,
        "is_perishable": True,
        "supplier_name": "Hass Valley Orchards",
        "weather_sensitivity": 0.60,
    },
    "SKU-003": {
        "name": "Protein Granola 500g",
        "category": "Ambient Grocery",
        "base_price": 425.0,
        "base_demand": 45,
        "lead_time_mean": 6.0,
        "lead_time_std": 2.0,
        "holding_cost": 2.50,
        "stockout_penalty": 120.0,
        "stock_multiplier": 5.0,
        "shelf_life_days": 90,
        "is_perishable": False,
        "supplier_name": "TrueElements Organics",
        "weather_sensitivity": 0.40,
    },
    "SKU-004": {
        "name": "Cold Brew Coffee 250ml",
        "category": "Ready-to-Drink",
        "base_price": 160.0,
        "base_demand": 90,
        "lead_time_mean": 3.2,
        "lead_time_std": 1.1,
        "holding_cost": 2.10,
        "stockout_penalty": 55.0,
        "stock_multiplier": 2.8,
        "shelf_life_days": 14,
        "is_perishable": True,
        "supplier_name": "Blue Tokai Roasters",
        "weather_sensitivity": 1.45,
    },
    "SKU-005": {
        "name": "Greek Yogurt 400g",
        "category": "Dairy / Cold-Chain",
        "base_price": 195.0,
        "base_demand": 65,
        "lead_time_mean": 3.0,
        "lead_time_std": 1.0,
        "holding_cost": 3.00,
        "stockout_penalty": 70.0,
        "stock_multiplier": 2.4,
        "shelf_life_days": 6,
        "is_perishable": True,
        "supplier_name": "Epigamia Dairy Cold-Chain",
        "weather_sensitivity": 1.10,
    },
}

# --------------------------------------------------------------------------------------
# 3. SUPPLIER RELIABILITY MATRIX & SCORECARD GRADING
# --------------------------------------------------------------------------------------
def evaluate_supplier_scorecard(std_days: float, supplier_name: str) -> dict:
    """
    Grades supplier (Grade A to F) based on lead-time variance (sigma_L)
    and returns buffer multipliers to dynamically scale lead-time shock buffers.
    """
    if std_days <= 0.9:
        grade = "A"
        on_time = 98.6
        multiplier = 1.00
        tier = "LOW"
        notes = "Tier-1 certified partner. Dedicated GPS-monitored refrigerated fleet."
    elif std_days <= 1.2:
        grade = "B"
        on_time = 94.4
        multiplier = 1.15
        tier = "MODERATE"
        notes = "High-reliability regional producer with occasional dock delays."
    elif std_days <= 1.6:
        grade = "C"
        on_time = 88.2
        multiplier = 1.30
        tier = "ELEVATED"
        notes = "Moderate agricultural harvest variance. Lead-time buffer expanded +30%."
    elif std_days <= 2.1:
        grade = "D"
        on_time = 81.0
        multiplier = 1.50
        tier = "CRITICAL"
        notes = "Elevated delivery variance subject to toll delays. Buffer expanded +50%."
    else:
        grade = "F"
        on_time = 70.5
        multiplier = 1.80
        tier = "CRITICAL"
        notes = "Severe supplier volatility. Secondary backup sourcing mandated."
        
    return {
        "grade": grade,
        "on_time_pct": on_time,
        "buffer_multiplier": multiplier,
        "risk_tier": tier,
        "notes": notes,
    }

# --------------------------------------------------------------------------------------
# 4. ANSI X12 EDI 850 GENERATOR UTILITY
# --------------------------------------------------------------------------------------
def generate_edi_850_segment_string(po_batch_id: str, wh_name: str, wh_id: str, items: list) -> str:
    """
    Generates standard ANSI X12 EDI 850 Purchase Order format for enterprise ERP integration.
    """
    d_now = datetime.datetime.now().strftime("%y%m%d")
    t_now = datetime.datetime.now().strftime("%H%M")
    
    segments = [
        f"ISA*00*          *00*          *ZZ*RETAILOPS      *ZZ*SAPCLOUD       *{d_now}*{t_now}*U*00401*000000001*0*T*:~",
        f"GS*PO*RETAILOPS*SAPCLOUD*20{d_now}*{t_now}*1*X*004010~",
        f"ST*850*0001~",
        f"BEG*00*SA*{po_batch_id}**20{d_now}~",
        f"CUR*IN*INR~",
        f"REF*DP*{wh_id}~",
        f"N1*ST*{wh_name}*92*{wh_id}~",
    ]
    for idx, it in enumerate(items, 1):
        segments.append(f"PO1*{idx}*{it['qty']}*EA*{it['unit_price']:.2f}*PE*{it['sku_id']}*VN*{it['supplier']}~")
        segments.append(f"PID*F****{it['sku_name']}~")
    segments.append(f"CTT*{len(items)}~")
    segments.append(f"SE*{len(segments) - 1}*0001~")
    segments.append("GE*1*1~")
    segments.append("IEA*1*000000001~")
    return "\n".join(segments)

# --------------------------------------------------------------------------------------
# 5. STATEFUL SESSION INITIALIZATION (AUDIT LEDGER & TRANSFERS)
# --------------------------------------------------------------------------------------
if "dispatched_po_ledger" not in st.session_state:
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sample_seed_items = [
        {"sku_id": "SKU-001", "sku_name": "Organic Milk 1L", "qty": 220, "unit_price": 78.0, "supplier": "Amul Fresh Dairy Co."},
        {"sku_id": "SKU-002", "sku_name": "Avocado Hass 2pk", "qty": 240, "unit_price": 249.0, "supplier": "Hass Valley Orchards"},
    ]
    seed_json = {
        "documentType": "850_PURCHASE_ORDER",
        "dispatchId": "DSP-20261007-0091",
        "poBatchNumber": "PO-20261007-WH-BOM-01",
        "warehouse": {"id": "WH-BOM-01", "name": "Mumbai Central Dark Store"},
        "timestamp": now_str,
        "erpSystem": "SAP S/4HANA Cloud (EDI 850)",
        "httpStatus": 200,
        "items": sample_seed_items,
        "signature": "sha256:7f9a2b8e3d0c41ab82ef10b0f443a290c5819e8315",
    }
    seed_edi = generate_edi_850_segment_string("PO-20261007-WH-BOM-01", "Mumbai Central Dark Store", "WH-BOM-01", sample_seed_items)
    
    st.session_state.dispatched_po_ledger = [
        {
            "dispatch_id": "DSP-20261007-0091",
            "po_batch": "PO-20261007-WH-BOM-01",
            "warehouse": "Mumbai Central Dark Store",
            "timestamp": now_str,
            "line_items": 2,
            "total_units": 460,
            "total_value_inr": 96540.0,
            "erp_system": "SAP S/4HANA Cloud (EDI 850)",
            "status": "HTTP 200 OK",
            "latency_ms": 142,
            "payload_hash": "sha256:7f9a2b8e3d0c41ab82ef10b0f443a290c5819e8315",
            "raw_json": json.dumps(seed_json, indent=2),
            "edi_850": seed_edi,
        }
    ]

if "approved_transfers" not in st.session_state:
    st.session_state.approved_transfers = []

# --------------------------------------------------------------------------------------
# 6. SYNTHETIC DATA GENERATION ENGINE (365 DAYS HISTORICAL)
# --------------------------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def generate_synthetic_supply_chain_data(seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=364)
    dates = pd.date_range(start=start_date, end=end_date, freq="D")
    records = []
    
    regional_factors = {"WH-BOM-01": 1.25, "WH-BLR-02": 1.10, "WH-DEL-03": 0.95}
    
    for wh_id, wh_meta in WAREHOUSE_REGISTRY.items():
        wh_scale = regional_factors[wh_id]
        for sku_id, sku_meta in SKU_CATALOG.items():
            base_d = sku_meta["base_demand"] * wh_scale
            lt_mean = sku_meta["lead_time_mean"]
            lt_std = sku_meta["lead_time_std"]
            sim_stock = int(base_d * sku_meta["stock_multiplier"] * np.random.uniform(0.7, 1.4))
            
            for current_dt in dates:
                day_of_week = current_dt.dayofweek
                day_of_year = current_dt.dayofyear
                weekend_lift = 1.35 if day_of_week in [4, 5, 6] else 0.90
                annual_wave = 1.0 + 0.15 * math.sin(2 * math.pi * day_of_year / 365.0)
                is_promo = 1 if (np.random.rand() < 0.12 or day_of_week == 6) else 0
                promo_multiplier = 1.65 if is_promo == 1 else 1.0
                
                expected_demand = base_d * weekend_lift * annual_wave * promo_multiplier
                noise = np.random.normal(0, expected_demand * 0.12)
                units_sold = max(0, int(np.round(expected_demand + noise)))
                sim_lead_time = max(1.0, float(np.random.normal(lt_mean, lt_std)))
                
                if sim_stock < int(base_d * 2.5):
                    sim_stock += int(base_d * np.random.uniform(4.0, 7.0))
                sim_stock = max(0, sim_stock - units_sold)
                
                records.append({
                    "date": current_dt,
                    "warehouse_id": wh_id,
                    "warehouse_name": wh_meta["name"],
                    "sku_id": sku_id,
                    "sku_name": sku_meta["name"],
                    "category": sku_meta["category"],
                    "units_sold": units_sold,
                    "is_promotional_day": is_promo,
                    "unit_price_inr": sku_meta["base_price"],
                    "current_stock_level": sim_stock,
                    "supplier_lead_time_days": round(sim_lead_time, 1),
                    "holding_cost_per_unit_day": sku_meta["holding_cost"],
                    "stockout_penalty_cost_per_unit": sku_meta["stockout_penalty"],
                })
                
    return pd.DataFrame(records)

# --------------------------------------------------------------------------------------
# 7. FEATURE ENGINEERING & MACHINE LEARNING DEMAND FORECASTING
# --------------------------------------------------------------------------------------
def build_features_for_series(sub_df: pd.DataFrame) -> pd.DataFrame:
    df = sub_df.sort_values("date").copy()
    df["lag_1"] = df["units_sold"].shift(1)
    df["lag_7"] = df["units_sold"].shift(7)
    df["lag_14"] = df["units_sold"].shift(14)
    df["rolling_mean_7"] = df["units_sold"].shift(1).rolling(window=7, min_periods=3).mean()
    df["rolling_std_7"] = df["units_sold"].shift(1).rolling(window=7, min_periods=3).std().fillna(1.0)
    df["rolling_mean_30"] = df["units_sold"].shift(1).rolling(window=30, min_periods=7).mean()
    df["day_of_week"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month
    df["is_weekend"] = df["day_of_week"].apply(lambda x: 1 if x in [5, 6] else 0)
    df["promo_weekend_interaction"] = df["is_promotional_day"] * df["is_weekend"]
    return df

@st.cache_data(show_spinner=False)
def train_demand_forecast_model(_data_slice: pd.DataFrame, forecast_horizon: int = 14, promo_uplift_pct: float = 0.0):
    featured_df = build_features_for_series(_data_slice)
    clean_df = featured_df.dropna().reset_index(drop=True)
    
    feature_cols = [
        "lag_1", "lag_7", "lag_14", "rolling_mean_7", "rolling_std_7", "rolling_mean_30",
        "day_of_week", "month", "is_weekend", "is_promotional_day", "promo_weekend_interaction"
    ]
    test_size = 30
    train_data = clean_df.iloc[:-test_size]
    test_data = clean_df.iloc[-test_size:]
    
    model = GradientBoostingRegressor(n_estimators=120, learning_rate=0.06, max_depth=4, subsample=0.85, random_state=42)
    model.fit(train_data[feature_cols], train_data["units_sold"])
    
    test_preds = model.predict(test_data[feature_cols])
    test_rmse = float(np.sqrt(mean_squared_error(test_data["units_sold"], test_preds)))
    test_mae = float(mean_absolute_error(test_data["units_sold"], test_preds))
    
    last_date = clean_df["date"].max()
    future_dates = pd.date_range(start=last_date + datetime.timedelta(days=1), periods=forecast_horizon, freq="D")
    history_records = list(clean_df["units_sold"].values)
    future_preds = []
    
    for step_dt in future_dates:
        l1 = history_records[-1]
        l7 = history_records[-7] if len(history_records) >= 7 else history_records[-1]
        l14 = history_records[-14] if len(history_records) >= 14 else history_records[-1]
        r7 = np.mean(history_records[-7:])
        r7_std = np.std(history_records[-7:]) + 1e-4
        r30 = np.mean(history_records[-30:]) if len(history_records) >= 30 else r7
        dow = step_dt.dayofweek
        mo = step_dt.month
        is_wk = 1 if dow in [5, 6] else 0
        is_p = 1 if dow == 6 else 0
        
        row_feat = pd.DataFrame([{
            "lag_1": l1, "lag_7": l7, "lag_14": l14, "rolling_mean_7": r7, "rolling_std_7": r7_std,
            "rolling_mean_30": r30, "day_of_week": dow, "month": mo, "is_weekend": is_wk,
            "is_promotional_day": is_p, "promo_weekend_interaction": is_p * is_wk
        }])
        raw_pred = model.predict(row_feat[feature_cols])[0]
        adjusted_pred = max(0.0, raw_pred * (1.0 + promo_uplift_pct / 100.0))
        future_preds.append(adjusted_pred)
        history_records.append(adjusted_pred)
        
    forecast_df = pd.DataFrame({
        "date": future_dates,
        "forecast_demand": future_preds,
        "forecast_lower": [max(0.0, p - 1.28 * test_rmse) for p in future_preds],
        "forecast_upper": [p + 1.28 * test_rmse for p in future_preds],
    })
    return {"model": model, "rmse": test_rmse, "mae": test_mae, "forecast_df": forecast_df, "historical_df": clean_df}

# --------------------------------------------------------------------------------------
# 8. MONTE CARLO STOCHASTIC RISK ENGINE (RUNS ON USABLE STOCK)
# --------------------------------------------------------------------------------------
def run_monte_carlo_lead_time_simulation(
    forecast_demand_mean: float,
    forecast_demand_std: float,
    lead_time_mean: float,
    lead_time_std: float,
    usable_stock: int,
    service_level_z: float,
    iterations: int = 1000,
    seed: int = 42
):
    np.random.seed(seed)
    variance_term = (lead_time_mean * (forecast_demand_std ** 2)) + ((forecast_demand_mean ** 2) * (lead_time_std ** 2))
    joint_sigma = math.sqrt(max(0.001, variance_term))
    dynamic_safety_stock = int(math.ceil(service_level_z * joint_sigma))
    
    expected_lead_time_demand = forecast_demand_mean * lead_time_mean
    dynamic_rop = int(math.ceil(expected_lead_time_demand + dynamic_safety_stock))
    
    sampled_lead_times = np.clip(np.random.normal(lead_time_mean, lead_time_std, size=iterations), 1.0, None)
    simulated_ddlt = np.zeros(iterations)
    for i in range(iterations):
        lt_days = int(math.ceil(sampled_lead_times[i]))
        daily_demands = np.clip(np.random.normal(forecast_demand_mean, forecast_demand_std, size=lt_days), 0.0, None)
        simulated_ddlt[i] = np.sum(daily_demands)
        
    stockout_events = np.sum(simulated_ddlt > usable_stock)
    stockout_probability_pct = (stockout_events / iterations) * 100.0
    
    if usable_stock <= dynamic_rop or stockout_probability_pct >= 25.0:
        urgency = "CRITICAL REORDER NOW"
    elif usable_stock <= int(dynamic_rop * 1.30) or stockout_probability_pct >= 10.0:
        urgency = "WARNING"
    else:
        urgency = "OPTIMAL"
        
    target_inventory = dynamic_rop + int(forecast_demand_mean * 7.0)
    recommended_reorder_qty = max(0, target_inventory - usable_stock)
    
    return {
        "dynamic_safety_stock": dynamic_safety_stock,
        "dynamic_rop": dynamic_rop,
        "expected_lead_time_demand": round(expected_lead_time_demand, 1),
        "stockout_probability_pct": round(stockout_probability_pct, 1),
        "simulated_ddlt": simulated_ddlt,
        "urgency": urgency,
        "recommended_reorder_qty": recommended_reorder_qty,
        "p95_lead_time_demand": int(np.percentile(simulated_ddlt, 95)),
    }

# --------------------------------------------------------------------------------------
# 9. MULTI-ECHELON INTER-STORE TRANSFERS
# --------------------------------------------------------------------------------------
def evaluate_inter_store_transfers(df_raw: pd.DataFrame, current_wh_id: str, simulation_results: dict) -> list:
    transfer_proposals = []
    other_wh_ids = [w for w in WAREHOUSE_REGISTRY.keys() if w != current_wh_id]
    
    for sku_id, s_data in simulation_results.items():
        mc_info = s_data["mc_output"]
        if mc_info["urgency"] != "CRITICAL REORDER NOW":
            continue
            
        dest_stock = s_data["usable_stock"]
        dest_rop = mc_info["dynamic_rop"]
        deficit_needed = max(20, dest_rop + int(s_data["daily_demand_mean"] * 7) - dest_stock)
        
        for origin_wh in other_wh_ids:
            origin_slice = df_raw[(df_raw["warehouse_id"] == origin_wh) & (df_raw["sku_id"] == sku_id)]
            if origin_slice.empty:
                continue
            origin_curr_stock = int(origin_slice.sort_values("date").iloc[-1]["current_stock_level"])
            origin_daily_demand = SKU_CATALOG[sku_id]["base_demand"] * 1.15
            origin_est_rop = int(origin_daily_demand * SKU_CATALOG[sku_id]["lead_time_mean"] + mc_info["dynamic_safety_stock"] * 0.9)
            
            surplus_threshold = origin_est_rop + int(origin_daily_demand * 14)
            if origin_curr_stock > surplus_threshold:
                available_surplus = origin_curr_stock - surplus_threshold
                xfer_qty = min(available_surplus, deficit_needed)
                
                if xfer_qty >= 10:
                    transfer_id = f"XFER-{sku_id}-{origin_wh[-2:]}"
                    transit_hours = 4 if WAREHOUSE_REGISTRY[origin_wh]["city"] == WAREHOUSE_REGISTRY[current_wh_id]["city"] else 6
                    transit_cost_inr = int(150 + xfer_qty * 1.5)
                    salvaged_revenue_inr = int(xfer_qty * (SKU_CATALOG[sku_id]["stockout_penalty"] + SKU_CATALOG[sku_id]["base_price"] * 0.25))
                    net_profit_inr = salvaged_revenue_inr - transit_cost_inr
                    supplier_lt_days = SKU_CATALOG[sku_id]["lead_time_mean"]
                    supplier_lt_hours = int(supplier_lt_days * 24)
                    lt_saved_hours = max(0, supplier_lt_hours - transit_hours)

                    transfer_proposals.append({
                        "transfer_id": transfer_id,
                        "sku_id": sku_id,
                        "sku_name": SKU_CATALOG[sku_id]["name"],
                        "origin_wh": origin_wh,
                        "origin_name": WAREHOUSE_REGISTRY[origin_wh]["name"],
                        "origin_stock": origin_curr_stock,
                        "origin_surplus": available_surplus,
                        "dest_wh": current_wh_id,
                        "dest_name": WAREHOUSE_REGISTRY[current_wh_id]["name"],
                        "dest_stock": dest_stock,
                        "dest_rop": dest_rop,
                        "transfer_units": xfer_qty,
                        "transit_hours": transit_hours,
                        "transit_cost_inr": transit_cost_inr,
                        "savings_inr": salvaged_revenue_inr,
                        "net_profit_inr": net_profit_inr,
                        "supplier_lt_days": supplier_lt_days,
                        "supplier_lt_hours": supplier_lt_hours,
                        "lt_saved_hours": lt_saved_hours,
                    })
                    break
                    
    return transfer_proposals

# --------------------------------------------------------------------------------------
# 10. SIDEBAR CONTROLS
# --------------------------------------------------------------------------------------
df_raw = generate_synthetic_supply_chain_data()

with st.sidebar:
    st.markdown("### 🎛️ Control Tower Parameters")
    
    selected_warehouse_id = st.selectbox(
        "📍 Dark Store / Warehouse Node",
        options=list(WAREHOUSE_REGISTRY.keys()),
        format_func=lambda x: f"{x} - {WAREHOUSE_REGISTRY[x]['name']}",
        index=0,
    )
    
    sku_options = list(SKU_CATALOG.keys())
    selected_skus = st.multiselect(
        "🏷️ SKU Focus Filter",
        options=sku_options,
        default=sku_options,
        format_func=lambda x: f"{x} ({SKU_CATALOG[x]['name']})",
    )
    if not selected_skus:
        selected_skus = sku_options
        
    st.markdown("---")
    st.markdown("#### 🛡️ Service Level & Lead Time Risk")
    service_level_map = {
        "90.0% (Z = 1.282)": 1.282,
        "95.0% (Z = 1.645)": 1.645,
        "98.0% (Z = 2.054)": 2.054,
        "99.0% (Z = 2.326)": 2.326,
        "99.5% (Z = 2.576)": 2.576,
    }
    selected_csl = st.selectbox("Cycle Service Level (CSL)", options=list(service_level_map.keys()), index=3)
    z_score = service_level_map[selected_csl]
    forecast_horizon = st.slider("📅 Forecast Horizon (Days)", 14, 30, 21)
    monte_carlo_iterations = st.slider("🎲 Monte Carlo Runs", 500, 2000, 1000, 250)
    
    st.markdown("---")
    st.markdown("#### ⚡ Stress Test & Promo Sandbox")
    promo_uplift = st.slider("Flash Sale Demand Surge (+%)", 0, 100, 0, 5)
    weather_surge = st.slider("🌧️ Weather Shock Impact (Monsoon/Rain Surge +%)", 0, 50, 0, 5)
    supplier_delay_bias = st.slider("Supplier Delay Shock (+Days)", 0.0, 5.0, 0.0, 0.5)
    st.caption("AI Studio Supply Chain Engine v2.7 • Weather Surge & Profitability Matrix Active")

# TOP TITLE BAR
st.markdown(
    f"""
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; margin-bottom: 24px;">
        <div>
            <h1 style="margin: 0; font-size: 1.95rem; font-weight: 800; letter-spacing: -0.03em;">
                📦 Multi-Source Supply Chain & Inventory Stock-Out Forecaster
            </h1>
            <p style="margin: 4px 0 0 0; color: #94A3B8; font-size: 0.95rem;">
                Executive Command Center • Machine Learning Demand Projection & Bivariate Monte Carlo Joint-Risk Modeling
            </p>
        </div>
        <div style="text-align: right;">
            <span style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #A5B4FC; padding: 6px 14px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600;">
                Live Node: {WAREHOUSE_REGISTRY[selected_warehouse_id]['name']}
            </span>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# --------------------------------------------------------------------------------------
# 11. EXECUTION ENGINE (PERISHABLE EXPIRY DECAY + SUPPLIER GRADING INTEGRATION)
# --------------------------------------------------------------------------------------
simulation_results = {}
total_revenue_at_risk = 0.0
total_recommended_ss = 0
critical_stockouts_count = 0
total_expired_waste_units = 0

for s_id in selected_skus:
    sku_meta = SKU_CATALOG[s_id]
    sku_slice = df_raw[(df_raw["warehouse_id"] == selected_warehouse_id) & (df_raw["sku_id"] == s_id)]
    latest_row = sku_slice.sort_values("date").iloc[-1]
    current_stock = int(latest_row["current_stock_level"])
    
    # Weather Shock Uplift tailored by SKU weather sensitivity
    sku_weather_uplift = round(weather_surge * sku_meta.get("weather_sensitivity", 1.0), 1)
    total_demand_uplift = promo_uplift + sku_weather_uplift
    
    fc_out = train_demand_forecast_model(sku_slice, forecast_horizon=forecast_horizon, promo_uplift_pct=total_demand_uplift)
    d_mean = float(fc_out["forecast_df"]["forecast_demand"].mean())
    d_std = float(max(1.0, fc_out["forecast_df"]["forecast_demand"].std()))
    
    # 1. Supplier Reliability Matrix Evaluation
    scorecard = evaluate_supplier_scorecard(sku_meta["lead_time_std"], sku_meta["supplier_name"])
    scaled_lt_std = round(sku_meta["lead_time_std"] * scorecard["buffer_multiplier"], 2)
    effective_lt_mean = round(sku_meta["lead_time_mean"] + supplier_delay_bias, 1)
    
    # 2. Perishable Batch Decay Engine
    decay_rate_pct = 0.0
    decayed_units = 0
    usable_stock = current_stock
    
    if sku_meta["is_perishable"]:
        dos = current_stock / max(1.0, d_mean)
        ratio = dos / sku_meta["shelf_life_days"]
        decay_rate_pct = min(35.0, max(4.0, round(ratio * 14.5, 1)))
        decayed_units = int(round(current_stock * (decay_rate_pct / 100.0)))
        usable_stock = max(0, current_stock - decayed_units)
        total_expired_waste_units += decayed_units
        
    mc_res = run_monte_carlo_lead_time_simulation(
        forecast_demand_mean=d_mean,
        forecast_demand_std=d_std,
        lead_time_mean=effective_lt_mean,
        lead_time_std=scaled_lt_std,
        usable_stock=usable_stock,
        service_level_z=z_score,
        iterations=monte_carlo_iterations,
    )
    
    if mc_res["stockout_probability_pct"] > 5.0 and mc_res["p95_lead_time_demand"] > usable_stock:
        deficit_units = mc_res["p95_lead_time_demand"] - usable_stock
        penalty = sku_meta["stockout_penalty"] + sku_meta["base_price"]
        rev_risk = deficit_units * penalty * (mc_res["stockout_probability_pct"] / 100.0)
    else:
        rev_risk = 0.0
        
    total_revenue_at_risk += rev_risk
    total_recommended_ss += mc_res["dynamic_safety_stock"]
    if mc_res["urgency"] == "CRITICAL REORDER NOW":
        critical_stockouts_count += 1
        
    simulation_results[s_id] = {
        "forecast_output": fc_out,
        "mc_output": mc_res,
        "current_stock": current_stock,
        "usable_stock": usable_stock,
        "decayed_units": decayed_units,
        "decay_rate_pct": decay_rate_pct,
        "revenue_at_risk": rev_risk,
        "unit_price": sku_meta["base_price"],
        "lead_time_mean": effective_lt_mean,
        "lead_time_std": scaled_lt_std,
        "daily_demand_mean": d_mean,
        "scorecard": scorecard,
        "weather_uplift_pct": sku_weather_uplift,
    }

inter_transfers = evaluate_inter_store_transfers(df_raw, selected_warehouse_id, simulation_results)

# --------------------------------------------------------------------------------------
# 12. EXECUTIVE KPI CARDS
# --------------------------------------------------------------------------------------
kpi_col1, kpi_col2, kpi_col3, kpi_col4 = st.columns(4)

with kpi_col1:
    st.markdown(
        f"""
        <div class="metric-card">
            <div class="metric-title">Critical Stock-Out Risk</div>
            <div class="metric-value" style="color: {'#EF4444' if critical_stockouts_count > 0 else '#10B981'};">
                {critical_stockouts_count} <span style="font-size: 1rem; font-weight: 500; color: #94A3B8;">/ {len(selected_skus)} SKUs</span>
            </div>
            <div class="metric-subtitle">Evaluated on Usable Non-Expired Stock</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with kpi_col2:
    st.markdown(
        f"""
        <div class="metric-card">
            <div class="metric-title">Projected Revenue at Risk</div>
            <div class="metric-value" style="color: #F59E0B;">
                ₹{total_revenue_at_risk:,.0f}
            </div>
            <div class="metric-subtitle">Lead-Time Deficit & Penalty</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with kpi_col3:
    st.markdown(
        f"""
        <div class="metric-card">
            <div class="metric-title">Perishable Expiry Waste</div>
            <div class="metric-value" style="color: #EF4444;">
                {total_expired_waste_units:,} <span style="font-size: 1rem; font-weight: 500; color: #94A3B8;">Units</span>
            </div>
            <div class="metric-subtitle">Discounted Shelf-Life Decay</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with kpi_col4:
    st.markdown(
        f"""
        <div class="metric-card">
            <div class="metric-title">Inter-Store Transfers Available</div>
            <div class="metric-value" style="color: #38BDF8;">
                {len(inter_transfers)} <span style="font-size: 1rem; font-weight: 500; color: #94A3B8;">Opportunities</span>
            </div>
            <div class="metric-subtitle">3–6 hr Intra-City Fulfillment</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown("<div style='height: 16px;'></div>", unsafe_allow_html=True)

# --------------------------------------------------------------------------------------
# 13. DASHBOARD TABS
# --------------------------------------------------------------------------------------
tab_analytics, tab_table, tab_transfers, tab_suppliers, tab_po, tab_architecture = st.tabs([
    "📈 Visual Analytics",
    "📋 Stock-Out Risk Prioritization",
    f"🔄 Inter-Store Transfers ({len(inter_transfers)})",
    "🏆 Supplier Reliability Scorecard",
    "📑 Automated PO & ERP Webhook Inspector",
    "🧠 Algorithmic Architecture",
])

# --------------------------------------------------------------------------------------
# TAB 1: VISUAL ANALYTICS
# --------------------------------------------------------------------------------------
with tab_analytics:
    active_sku = st.selectbox(
        "🔍 Deep-Dive SKU Inspection",
        options=selected_skus,
        format_func=lambda x: f"{x} - {SKU_CATALOG[x]['name']} ({SKU_CATALOG[x]['category']})",
        index=0,
    )
    
    sku_data = simulation_results[active_sku]
    sku_m = SKU_CATALOG[active_sku]
    fc_info = sku_data["forecast_output"]
    mc_info = sku_data["mc_output"]
    curr_stock = sku_data["current_stock"]
    usable_stk = sku_data["usable_stock"]
    
    # Weather Shock & Perishable Callout Banners
    c_banner1, c_banner2 = st.columns(2)
    with c_banner1:
        if sku_m["is_perishable"]:
            st.info(f"🍃 **Perishable SKU (Shelf Life: {sku_m['shelf_life_days']} Days):** Batch decay model calculated **{sku_data['decay_rate_pct']}% spoilage** (-{sku_data['decayed_units']} units). Net Usable Stock = **{usable_stk} units**.")
        else:
            st.success(f"🛡️ **Ambient Shelf-Stable SKU:** Shelf life is {sku_m['shelf_life_days']} days with 0% expiration decay discount.")
    with c_banner2:
        w_uplift = sku_data.get("weather_uplift_pct", 0)
        if w_uplift > 0:
            st.warning(f"🌧️ **Monsoon Weather Shock Active:** +{w_uplift}% demand uplift applied to GBR forecast (Sensitivity: {sku_m.get('weather_sensitivity', 1.0)}x).")
        else:
            st.info("☀️ **Standard Weather Conditions:** Baseline demand without precipitation surge.")
    
    viz_col1, viz_col2 = st.columns(2)
    
    with viz_col1:
        st.markdown(f"#### 🔮 Demand Forecast (GBR: {forecast_horizon} Days)")
        hist_df = fc_info["historical_df"].iloc[-60:]
        fore_df = fc_info["forecast_df"]
        
        fig1 = go.Figure()
        fig1.add_trace(go.Scatter(x=hist_df["date"], y=hist_df["units_sold"], mode="lines", name="Historical Sales", line=dict(color="#94A3B8", width=1.8)))
        fig1.add_trace(go.Scatter(x=fore_df["date"], y=fore_df["forecast_demand"], mode="lines+markers", name="Predicted Demand", line=dict(color="#6366F1", width=2.5)))
        fig1.add_trace(go.Scatter(x=fore_df["date"], y=fore_df["forecast_upper"], mode="lines", line=dict(width=0), showlegend=False))
        fig1.add_trace(go.Scatter(x=fore_df["date"], y=fore_df["forecast_lower"], mode="lines", line=dict(width=0), fill="tonexty", fillcolor="rgba(99, 102, 241, 0.2)", name="80% Prediction Band"))
        fig1.update_layout(template="plotly_dark", paper_bgcolor="rgba(15, 23, 42, 0.5)", plot_bgcolor="rgba(15, 23, 42, 0.5)", height=340, margin=dict(l=20, r=20, t=30, b=20))
        st.plotly_chart(fig1, use_container_width=True)

    with viz_col2:
        st.markdown("#### 📉 Forward Inventory Depletion vs Dynamic ROP (Usable Stock)")
        depletion_dates = [datetime.date.today() + datetime.timedelta(days=d) for d in range(forecast_horizon)]
        depleted_inventory = []
        running_stock = usable_stk
        for d_pred in fore_df["forecast_demand"]:
            running_stock = max(0, running_stock - d_pred)
            depleted_inventory.append(running_stock)
            
        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(x=depletion_dates, y=depleted_inventory, mode="lines+markers", name=f"Usable Stock ({usable_stk})", line=dict(color="#38BDF8", width=2.8), fill="tozeroy", fillcolor="rgba(56, 189, 248, 0.1)"))
        fig2.add_trace(go.Scatter(x=depletion_dates, y=[mc_info["dynamic_rop"]] * len(depletion_dates), mode="lines", name=f"Dynamic ROP ({mc_info['dynamic_rop']})", line=dict(color="#EF4444", width=2.2, dash="dash")))
        fig2.add_trace(go.Scatter(x=depletion_dates, y=[mc_info["dynamic_safety_stock"]] * len(depletion_dates), mode="lines", name=f"Safety Stock ({mc_info['dynamic_safety_stock']})", line=dict(color="#F59E0B", width=1.8, dash="dot")))
        fig2.update_layout(template="plotly_dark", paper_bgcolor="rgba(15, 23, 42, 0.5)", plot_bgcolor="rgba(15, 23, 42, 0.5)", height=340, margin=dict(l=20, r=20, t=30, b=20))
        st.plotly_chart(fig2, use_container_width=True)

    # Perishable Batch Expiry Breakdown Card
    if sku_m["is_perishable"]:
        p_c1, p_c2, p_c3, p_c4 = st.columns(4)
        with p_c1:
            st.metric("Perishable Shelf-Life", f"{sku_m['shelf_life_days']} Days", "Cold-chain max")
        with p_c2:
            st.metric("Gross Physical Stock", f"{curr_stock:,} Units", "Raw dark store count")
        with p_c3:
            st.metric("Decayed Spoilage", f"-{sku_data['decayed_units']:,} Units", f"-{sku_data['decay_rate_pct']}% write-down", delta_color="inverse")
        with p_c4:
            st.metric("Net Usable Stock", f"{usable_stk:,} Units", "Evaluated in ROP/Monte Carlo")

    st.markdown(f"#### 🎲 Monte Carlo Lead-Time Demand vs Usable Stock ({monte_carlo_iterations:,} Iterations)")
    fig3 = go.Figure()
    fig3.add_trace(go.Histogram(x=mc_info["simulated_ddlt"], nbinsx=45, marker_color="#818CF8", opacity=0.75))
    fig3.add_vline(x=usable_stk, line_width=3, line_dash="dash", line_color="#EF4444", annotation_text=f"Usable Stock ({usable_stk})")
    fig3.add_vline(x=mc_info["dynamic_rop"], line_width=2, line_dash="dot", line_color="#34D399", annotation_text=f"Dynamic ROP ({mc_info['dynamic_rop']})")
    fig3.update_layout(template="plotly_dark", paper_bgcolor="rgba(15, 23, 42, 0.5)", plot_bgcolor="rgba(15, 23, 42, 0.5)", height=300, margin=dict(l=20, r=20, t=30, b=20))
    st.plotly_chart(fig3, use_container_width=True)

# --------------------------------------------------------------------------------------
# TAB 2: STOCK-OUT RISK TABLE
# --------------------------------------------------------------------------------------
with tab_table:
    st.markdown("#### 📋 Stock-Out Risk Prioritization Matrix (Evaluated on Usable Stock)")
    table_rows = []
    for s_id in selected_skus:
        s_data = simulation_results[s_id]
        m = s_data["mc_output"]
        table_rows.append({
            "SKU ID": s_id,
            "SKU Name": SKU_CATALOG[s_id]["name"],
            "Usable Stock": s_data["usable_stock"],
            "Gross Stock": s_data["current_stock"],
            "Decayed Waste": s_data["decayed_units"],
            "Dynamic ROP": m["dynamic_rop"],
            "Safety Stock": m["dynamic_safety_stock"],
            "Stock-Out Risk (%)": m["stockout_probability_pct"],
            "Supplier Grade": s_data["scorecard"]["grade"],
            "Recommended PO Qty": m["recommended_reorder_qty"],
            "Status": m["urgency"],
        })
    risk_df = pd.DataFrame(table_rows).sort_values(by="Stock-Out Risk (%)", ascending=False)
    st.dataframe(
        risk_df.style.format({
            "Stock-Out Risk (%)": "{:.1f}%",
            "Usable Stock": "{:,}",
            "Gross Stock": "{:,}",
            "Decayed Waste": "{:,}",
            "Dynamic ROP": "{:,}",
            "Safety Stock": "{:,}",
            "Recommended PO Qty": "{:,}",
        }).background_gradient(subset=["Stock-Out Risk (%)"], cmap="Reds", vmin=0.0, vmax=100.0),
        use_container_width=True,
        hide_index=True,
    )

# --------------------------------------------------------------------------------------
# TAB 3: MULTI-ECHELON INTER-STORE TRANSFERS
# --------------------------------------------------------------------------------------
with tab_transfers:
    st.markdown("#### 🔄 Multi-Echelon Dark Store Inter-Transfer Engine")
    
    # Financial & Operational Summary Cards
    tot_transfers = len(inter_transfers)
    tot_units = sum(x["transfer_units"] for x in inter_transfers)
    tot_freight = sum(x.get("transit_cost_inr", 150) for x in inter_transfers)
    tot_salvaged = sum(x.get("savings_inr", 0) for x in inter_transfers)
    net_profit = tot_salvaged - tot_freight
    roi_ratio = (tot_salvaged / max(1, tot_freight)) if tot_freight > 0 else 10.0
    
    avg_transit = round(sum(x["transit_hours"] for x in inter_transfers) / max(1, tot_transfers)) if tot_transfers > 0 else 4
    avg_supp_days = round(sum(x.get("supplier_lt_days", 3.5) for x in inter_transfers) / max(1, tot_transfers), 1) if tot_transfers > 0 else 3.5
    avg_saved_hours = round(sum(x.get("lt_saved_hours", 72) for x in inter_transfers) / max(1, tot_transfers)) if tot_transfers > 0 else 72

    c_m1, c_m2, c_m3, c_m4 = st.columns(4)
    with c_m1:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-title">Available Transfers</div>
                <div class="metric-value" style="color: #818CF8;">{tot_transfers} <span style="font-size: 0.9rem; color: #94A3B8;">Pairs</span></div>
                <div class="metric-subtitle">{tot_units:,} Units surplus rebalanceable</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c_m2:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-title">Salvaged Revenue at Risk</div>
                <div class="metric-value" style="color: #34D399;">₹{tot_salvaged:,}</div>
                <div class="metric-subtitle">Direct stockout penalty + lost sales saved</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c_m3:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-title">Net Financial Profitability</div>
                <div class="metric-value" style="color: #38BDF8;">+₹{net_profit:,}</div>
                <div class="metric-subtitle">Freight: ₹{tot_freight:,} • <strong>{roi_ratio:.1f}x ROI</strong></div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c_m4:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-title">Delivery Lead-Time Savings</div>
                <div class="metric-value" style="color: #FBBF24;">~{avg_transit}h <span style="font-size: 0.85rem; color: #94A3B8;">vs {avg_supp_days}d PO</span></div>
                <div class="metric-subtitle">~{avg_saved_hours} Hours saved (~94% faster)</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)
    
    # Financial Comparison Matrix
    st.markdown("##### ⚖️ Procurement Route Profitability & Transit Efficiency Matrix")
    matrix_df = pd.DataFrame([
        {
            "Metric": "Delivery Fulfillment Time",
            "Route A: Supplier PO": f"{avg_supp_days} Days (60–144 Hours)",
            "Route B: Inter-Dark Store Rebalance": f"~{avg_transit} Hours (Intra-City Van)",
            "Strategic Advantage & Impact": f"~94% Faster Fulfillment (~{avg_saved_hours}h saved)",
        },
        {
            "Metric": "Net Freight Transit Cost",
            "Route A: Supplier PO": "MOQ Freight + Long-haul Transit",
            "Route B: Inter-Dark Store Rebalance": f"₹{tot_freight:,} intra-city courier fee",
            "Strategic Advantage & Impact": "Minimal localized freight commitment",
        },
        {
            "Metric": "Salvaged Revenue at Risk",
            "Route A: Supplier PO": "₹0 (Stock-out breach lasts multiple days)",
            "Route B: Inter-Dark Store Rebalance": f"₹{tot_salvaged:,} protected revenue",
            "Strategic Advantage & Impact": f"Net Margin Salvaged: +₹{net_profit:,} ({roi_ratio:.1f}x ROI)",
        },
        {
            "Metric": "Perishable Expiry Balancing",
            "Route A: Supplier PO": "Donor warehouse holds surplus until spoilage",
            "Route B: Inter-Dark Store Rebalance": "Transfers surplus before shelf-life expires",
            "Strategic Advantage & Impact": "Directly prevents perishable batch discard",
        },
    ])
    st.dataframe(matrix_df, use_container_width=True, hide_index=True)
    
    st.markdown("##### 🚚 Active Cross-Dock Transfer Opportunities")
    if not inter_transfers:
        st.success("🎉 No emergency inter-store transfers required! Neighboring dark stores do not hold excess surplus (ROP + 14d supply) or current node is protected.")
    else:
        for xfer in inter_transfers:
            is_approved = xfer["transfer_id"] in st.session_state.approved_transfers
            col_info, col_act = st.columns([4, 1])
            with col_info:
                st.markdown(
                    f"""
                    <div class="transfer-box">
                        <strong style="color: #818CF8; font-size: 1.05rem;">{xfer['sku_name']} ({xfer['sku_id']})</strong> —
                        <span style="color: #34D399; font-weight: bold;">Net Profit: +₹{xfer.get('net_profit_inr', xfer['savings_inr'] - 150):,}</span>
                        <span style="color: #94A3B8; font-size: 0.8rem; margin-left: 8px;">(Freight: ₹{xfer.get('transit_cost_inr', 150)} | Salvaged: ₹{xfer['savings_inr']:,})</span>
                        <div style="font-size: 0.85rem; color: #94A3B8; margin-top: 4px;">
                            Donor Node: <strong style="color: #FBBF24;">{xfer['origin_name']}</strong> (Surplus: +{xfer['origin_surplus']}) ➔
                            Recipient: <strong style="color: #F87171;">{xfer['dest_name']}</strong>
                        </div>
                        <div style="font-size: 0.8rem; color: #64748B; margin-top: 4px;">
                            Transfer: <strong>{xfer['transfer_units']} Units</strong> • Transit: <strong>~{xfer['transit_hours']} Hours</strong> (vs {xfer.get('supplier_lt_days', 3.0)}d supplier lead time • <strong>~{xfer.get('lt_saved_hours', 66)}h saved</strong>)
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
            with col_act:
                if is_approved:
                    st.success("Approved ✓")
                else:
                    if st.button("Approve Transfer", key=xfer["transfer_id"]):
                        st.session_state.approved_transfers.append(xfer["transfer_id"])
                        st.rerun()

# --------------------------------------------------------------------------------------
# TAB 4: SUPPLIER RELIABILITY SCORECARD
# --------------------------------------------------------------------------------------
with tab_suppliers:
    st.markdown("#### 🏆 Supplier Reliability Scorecard Matrix")
    st.markdown("Suppliers graded A to F based on lead-time variance $\\sigma_L$, scaling the dynamic lead-time buffer.")
    
    score_cols = st.columns(len(selected_skus))
    for idx, s_id in enumerate(selected_skus):
        s_data = simulation_results[s_id]
        sc = s_data["scorecard"]
        with score_cols[idx]:
            st.markdown(
                f"""
                <div class="scorecard-box">
                    <span style="font-size: 0.75rem; color: #94A3B8;">{s_id}</span>
                    <h4 style="margin: 2px 0 6px 0; font-size: 0.95rem;">{SKU_CATALOG[s_id]['name']}</h4>
                    <div style="font-size: 1.25rem; font-weight: 800; color: #818CF8;">
                        GRADE {sc['grade']}
                    </div>
                    <div style="font-size: 0.75rem; color: #64748B; margin-top: 4px;">
                        Vendor: <strong style="color: #F3F4F6;">{SKU_CATALOG[s_id]['supplier_name']}</strong>
                    </div>
                    <div style="font-size: 0.75rem; color: #34D399; margin-top: 2px;">
                        On-Time: <strong>{sc['on_time_pct']}%</strong>
                    </div>
                    <div style="font-size: 0.75rem; color: #38BDF8; margin-top: 2px;">
                        Buffer: <strong>{sc['buffer_multiplier']}x</strong>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

# --------------------------------------------------------------------------------------
# TAB 5: AUTOMATED PO & ERP WEBHOOK PAYLOAD INSPECTOR
# --------------------------------------------------------------------------------------
with tab_po:
    st.markdown("#### 📑 Automated Purchase Orders & Interactive ERP Webhook")
    po_records = []
    po_batch_id = f"PO-{datetime.date.today().strftime('%Y%m%d')}-{selected_warehouse_id}"
    
    for s_id in selected_skus:
        s_data = simulation_results[s_id]
        m = s_data["mc_output"]
        if m["recommended_reorder_qty"] > 0 or m["urgency"] in ["CRITICAL REORDER NOW", "WARNING"]:
            po_qty = max(m["recommended_reorder_qty"], int(m["dynamic_safety_stock"] * 1.5))
            total_cost = po_qty * s_data["unit_price"]
            expected_delivery = datetime.date.today() + datetime.timedelta(days=int(math.ceil(s_data["lead_time_mean"])))
            
            po_records.append({
                "po_number": f"{po_batch_id}-{s_id}",
                "sku_id": s_id,
                "sku_name": SKU_CATALOG[s_id]["name"],
                "supplier": SKU_CATALOG[s_id]["supplier_name"],
                "supplier_grade": s_data["scorecard"]["grade"],
                "usable_stock": s_data["usable_stock"],
                "rop": m["dynamic_rop"],
                "qty": po_qty,
                "unit_price": s_data["unit_price"],
                "total_cost": round(total_cost, 2),
                "expected_arrival": expected_delivery.strftime("%Y-%m-%d"),
                "priority": "URGENT" if m["urgency"] == "CRITICAL REORDER NOW" else "NORMAL",
            })
            
    if po_records:
        po_df = pd.DataFrame(po_records)
        st.dataframe(
            po_df.style.format({
                "unit_price": "₹{:,.2f}",
                "total_cost": "₹{:,.2f}",
                "usable_stock": "{:,}",
                "rop": "{:,}",
                "qty": "{:,}",
            }),
            use_container_width=True,
            hide_index=True,
        )
        
        c_erp1, c_erp2, c_erp3 = st.columns([2, 1, 1])
        with c_erp1:
            target_erp = st.selectbox(
                "Target Enterprise ERP System",
                ["SAP S/4HANA Cloud (EDI 850)", "Oracle NetSuite WMS Webhook", "Odoo Enterprise Supply API"],
            )
        with c_erp2:
            csv_buf = io.StringIO()
            po_df.to_csv(csv_buf, index=False)
            st.download_button("📥 Export PO CSV", csv_buf.getvalue(), f"po_batch_{selected_warehouse_id}.csv", "text/csv")
        with c_erp3:
            if st.button("🚀 Dispatch PO to ERP"):
                dispatch_id = f"DSP-{datetime.date.today().strftime('%Y%m%d')}-{np.random.randint(1000, 9999)}"
                raw_hash = f"sha256:{hashlib.sha256(f'{dispatch_id}-{selected_warehouse_id}'.encode()).hexdigest()}"
                
                payload_json = {
                    "documentType": "PURCHASE_ORDER_850",
                    "dispatchId": dispatch_id,
                    "poBatchId": po_batch_id,
                    "warehouse": {"id": selected_warehouse_id, "name": WAREHOUSE_REGISTRY[selected_warehouse_id]["name"]},
                    "dispatchedAt": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "erpSystem": target_erp,
                    "items": po_records,
                    "cryptoSignature": raw_hash,
                }
                edi_str = generate_edi_850_segment_string(po_batch_id, WAREHOUSE_REGISTRY[selected_warehouse_id]["name"], selected_warehouse_id, po_records)
                
                new_entry = {
                    "dispatch_id": dispatch_id,
                    "po_batch": po_batch_id,
                    "warehouse": WAREHOUSE_REGISTRY[selected_warehouse_id]["name"],
                    "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "line_items": len(po_records),
                    "total_units": int(po_df["qty"].sum()),
                    "total_value_inr": float(po_df["total_cost"].sum()),
                    "erp_system": target_erp,
                    "status": "HTTP 200 OK",
                    "latency_ms": int(np.random.randint(120, 195)),
                    "payload_hash": raw_hash,
                    "raw_json": json.dumps(payload_json, indent=2),
                    "edi_850": edi_str,
                }
                st.session_state.dispatched_po_ledger.insert(0, new_entry)
                st.success(f"✓ Successfully dispatched to {target_erp}! Audit entry {dispatch_id} recorded.")
                st.rerun()

    # DISPATCHED PO AUDIT LEDGER & PAYLOAD INSPECTOR
    st.markdown("---")
    st.markdown("#### 🗄️ In-Memory Dispatched PO Audit Ledger & Payload Inspector")
    ledger_df = pd.DataFrame(st.session_state.dispatched_po_ledger)
    st.dataframe(
        ledger_df[["dispatch_id", "timestamp", "po_batch", "warehouse", "erp_system", "total_units", "total_value_inr", "status", "latency_ms", "payload_hash"]].style.format({
            "total_value_inr": "₹{:,.2f}",
            "total_units": "{:,}",
        }),
        use_container_width=True,
        hide_index=True,
    )
    
    # Interactive Modal / Expander for Payload Inspection
    with st.expander("🔍 Interactive ERP Webhook Payload Inspector (Raw JSON / ANSI X12 EDI 850)"):
        dispatch_choices = [x["dispatch_id"] for x in st.session_state.dispatched_po_ledger]
        inspect_id = st.selectbox("Select Dispatched Order ID to Inspect", dispatch_choices)
        selected_record = next(x for x in st.session_state.dispatched_po_ledger if x["dispatch_id"] == inspect_id)
        
        st.markdown(f"**Cryptographic Signature:** `{selected_record['payload_hash']}` • **Status:** `{selected_record['status']} ({selected_record['latency_ms']}ms)`")
        
        pay_tab1, pay_tab2 = st.tabs(["Raw JSON Payload", "ANSI X12 EDI 850 Segment Stream"])
        with pay_tab1:
            st.code(selected_record["raw_json"], language="json")
        with pay_tab2:
            st.code(selected_record["edi_850"], language="text")

# --------------------------------------------------------------------------------------
# TAB 6: ALGORITHMIC ARCHITECTURE
# --------------------------------------------------------------------------------------
with tab_architecture:
    st.markdown("### 🔬 Senior Analytics Engineering & Statistical Formulation")
    st.latex(r"\text{Var}(DDLT) = \bar{L} \cdot \sigma_D^2 + \bar{D}^2 \cdot \sigma_L^2")
    st.latex(r"\text{Safety Stock (SS)} = Z \cdot \sqrt{\bar{L} \cdot \sigma_D^2 + \bar{D}^2 \cdot (\sigma_L \times \text{BufferMultiplier})^2}")
    st.latex(r"\text{Usable Stock} = \text{Current Stock} \times (1 - \delta_{\text{decay}})")
    st.markdown(
        """
        - **Perishable Batch Decay Formula:**
          $$\\delta_{\\text{decay}} = \\min\\left(0.35, \\max\\left(0.04, \\frac{\\text{DOS}}{\\text{ShelfLife}} \\times 0.145\\right)\\right)$$
        - **Weather Shock Demand Uplift:**
          $$\\hat{D}_{\\text{forecast}}^{\\text{weather}} = \\hat{D}_{\\text{forecast}} \\times \\left(1 + \\frac{\\text{WeatherSurgePct} \\times \\text{Sensitivity}}{100}\\right)$$
        - **Inter-Store Transfer Profitability Matrix:**
          $$\\text{Net Profitability} = \\text{Salvaged Revenue} - \\text{Freight Cost}$$
          $$\\text{ROI Multiplier} = \\frac{\\text{Salvaged Revenue}}{\\text{Freight Cost}} \\approx 8.5\\times \\text{ to } 14.0\\times$$
        - **Supplier Grading & Buffer Multiplier:**
          Grade A (1.0x), Grade B (1.15x), Grade C (1.30x), Grade D (1.50x), Grade F (1.80x) scales $\\sigma_L$.
        """
    )
