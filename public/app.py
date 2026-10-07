"""
========================================================================================
MULTI-SOURCE SUPPLY CHAIN & INVENTORY STOCK-OUT FORECASTER
Production-Grade Executive Control Tower & Stochastic Risk Modeling Engine
========================================================================================
Author: Senior Principal Supply Chain Data Scientist & Lead Analytics Engineer
Architecture: Streamlit + Pandas + Scikit-Learn (GBR) + NumPy + Plotly + SciPy
========================================================================================
"""

import datetime
import io
import math
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
# 2. CATALOG & LOCATION DEFINITIONS
# --------------------------------------------------------------------------------------
WAREHOUSE_REGISTRY = {
    "WH-BOM-01": {"name": "Mumbai Central Dark Store", "city": "Mumbai", "region": "West"},
    "WH-BLR-02": {"name": "Bengaluru Indiranagar Hub", "city": "Bengaluru", "region": "South"},
    "WH-DEL-03": {"name": "Delhi NCR Fulfillment Node", "city": "Delhi NCR", "region": "North"},
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
    },
}

# --------------------------------------------------------------------------------------
# 3. SYNTHETIC DATA GENERATION ENGINE (365 DAYS HISTORICAL)
# --------------------------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def generate_synthetic_supply_chain_data(seed: int = 42) -> pd.DataFrame:
    """
    Generates 365 days of realistic, multi-SKU, multi-warehouse operational inventory
    and sales logs with non-stationary seasonality, promo spikes, and supplier stochasticity.
    """
    np.random.seed(seed)
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=364)
    dates = pd.date_range(start=start_date, end=end_date, freq="D")
    
    records = []
    
    # Regional demand scaling factors
    regional_factors = {
        "WH-BOM-01": 1.25, # High density
        "WH-BLR-02": 1.10, # Tech hub
        "WH-DEL-03": 0.95, # High seasonal variance
    }
    
    for wh_id, wh_meta in WAREHOUSE_REGISTRY.items():
        wh_scale = regional_factors[wh_id]
        
        for sku_id, sku_meta in SKU_CATALOG.items():
            base_d = sku_meta["base_demand"] * wh_scale
            lt_mean = sku_meta["lead_time_mean"]
            lt_std = sku_meta["lead_time_std"]
            
            # Initial stock level roughly 3-6 days of forward supply
            sim_stock = int(base_d * sku_meta["stock_multiplier"] * np.random.uniform(0.7, 1.4))
            
            for i, current_dt in enumerate(dates):
                day_of_week = current_dt.dayofweek
                day_of_year = current_dt.dayofyear
                
                # Seasonality: Weekend lift (Fri-Sun)
                weekend_lift = 1.35 if day_of_week in [4, 5, 6] else 0.90
                
                # Annual wave
                annual_wave = 1.0 + 0.15 * math.sin(2 * math.pi * day_of_year / 365.0)
                
                # Random promotional campaign (~12% probability)
                is_promo = 1 if (np.random.rand() < 0.12 or day_of_week == 6) else 0
                promo_multiplier = 1.65 if is_promo == 1 else 1.0
                
                # Stochastic demand draw
                expected_demand = base_d * weekend_lift * annual_wave * promo_multiplier
                noise = np.random.normal(0, expected_demand * 0.12)
                units_sold = max(0, int(np.round(expected_demand + noise)))
                
                # Supplier lead time realized for orders placed that day
                # Lead time modeled as log-normal clipped to >= 1 day
                sim_lead_time = max(1.0, float(np.random.normal(lt_mean, lt_std)))
                
                # Inventory depletion and periodic simulated replenishment
                # Simulate a realistic reorder trigger in historical log
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
                
    df = pd.DataFrame(records)
    return df

# --------------------------------------------------------------------------------------
# 4. FEATURE ENGINEERING & MACHINE LEARNING DEMAND FORECASTING
# --------------------------------------------------------------------------------------
def build_features_for_series(sub_df: pd.DataFrame) -> pd.DataFrame:
    """
    Creates temporal lag and rolling features for tabular gradient boosting forecaster:
    - lag_1, lag_7, lag_14
    - rolling_7d, rolling_30d
    - calendar features: day_of_week, month, is_weekend
    - promotional interaction features
    """
    df = sub_df.sort_values("date").copy()
    
    # Lag features
    df["lag_1"] = df["units_sold"].shift(1)
    df["lag_7"] = df["units_sold"].shift(7)
    df["lag_14"] = df["units_sold"].shift(14)
    
    # Rolling aggregations
    df["rolling_mean_7"] = df["units_sold"].shift(1).rolling(window=7, min_periods=3).mean()
    df["rolling_std_7"] = df["units_sold"].shift(1).rolling(window=7, min_periods=3).std().fillna(1.0)
    df["rolling_mean_30"] = df["units_sold"].shift(1).rolling(window=30, min_periods=7).mean()
    
    # Calendar features
    df["day_of_week"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month
    df["is_weekend"] = df["day_of_week"].apply(lambda x: 1 if x in [5, 6] else 0)
    
    # Interaction: promo * day_of_week
    df["promo_weekend_interaction"] = df["is_promotional_day"] * df["is_weekend"]
    
    return df

@st.cache_data(show_spinner=False)
def train_demand_forecast_model(
    _data_slice: pd.DataFrame,
    forecast_horizon: int = 14,
    promo_uplift_pct: float = 0.0
):
    """
    Trains a Scikit-Learn GradientBoostingRegressor on historical daily demand
    and predicts forward for the specified horizon with uncertainty bounds.
    """
    featured_df = build_features_for_series(_data_slice)
    clean_df = featured_df.dropna().reset_index(drop=True)
    
    feature_cols = [
        "lag_1", "lag_7", "lag_14",
        "rolling_mean_7", "rolling_std_7", "rolling_mean_30",
        "day_of_week", "month", "is_weekend", "is_promotional_day",
        "promo_weekend_interaction"
    ]
    
    # Split: holdout last 30 days for out-of-sample evaluation
    test_size = 30
    train_data = clean_df.iloc[:-test_size]
    test_data = clean_df.iloc[-test_size:]
    
    X_train = train_data[feature_cols]
    y_train = train_data["units_sold"]
    X_test = test_data[feature_cols]
    y_test = test_data["units_sold"]
    
    # Gradient Boosting Regressor (robust to non-linear promo spikes)
    model = GradientBoostingRegressor(
        n_estimators=120,
        learning_rate=0.06,
        max_depth=4,
        subsample=0.85,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    test_preds = model.predict(X_test)
    test_rmse = float(np.sqrt(mean_squared_error(y_test, test_preds)))
    test_mae = float(mean_absolute_error(y_test, test_preds))
    
    # Recursive Multi-Step Forward Forecasting for next `forecast_horizon` days
    last_date = clean_df["date"].max()
    future_dates = pd.date_range(start=last_date + datetime.timedelta(days=1), periods=forecast_horizon, freq="D")
    
    history_records = list(clean_df["units_sold"].values)
    future_preds = []
    
    for step_dt in future_dates:
        # Construct dynamic lag values from known + predicted buffer
        l1 = history_records[-1]
        l7 = history_records[-7] if len(history_records) >= 7 else history_records[-1]
        l14 = history_records[-14] if len(history_records) >= 14 else history_records[-1]
        
        r7 = np.mean(history_records[-7:])
        r7_std = np.std(history_records[-7:]) + 1e-4
        r30 = np.mean(history_records[-30:]) if len(history_records) >= 30 else r7
        
        dow = step_dt.dayofweek
        mo = step_dt.month
        is_wk = 1 if dow in [5, 6] else 0
        is_p = 1 if dow == 6 else 0 # Sunday promo default
        
        row_feat = pd.DataFrame([{
            "lag_1": l1,
            "lag_7": l7,
            "lag_14": l14,
            "rolling_mean_7": r7,
            "rolling_std_7": r7_std,
            "rolling_mean_30": r30,
            "day_of_week": dow,
            "month": mo,
            "is_weekend": is_wk,
            "is_promotional_day": is_p,
            "promo_weekend_interaction": is_p * is_wk
        }])
        
        raw_pred = model.predict(row_feat[feature_cols])[0]
        # Apply hypothetical promotional scenario uplift if set
        adjusted_pred = max(0.0, raw_pred * (1.0 + promo_uplift_pct / 100.0))
        future_preds.append(adjusted_pred)
        history_records.append(adjusted_pred)
        
    forecast_df = pd.DataFrame({
        "date": future_dates,
        "forecast_demand": future_preds,
        # Uncertainty intervals (80% confidence interval based on test RMSE)
        "forecast_lower": [max(0.0, p - 1.28 * test_rmse) for p in future_preds],
        "forecast_upper": [p + 1.28 * test_rmse for p in future_preds],
    })
    
    return {
        "model": model,
        "rmse": test_rmse,
        "mae": test_mae,
        "forecast_df": forecast_df,
        "historical_df": clean_df,
        "test_actuals": y_test.values,
        "test_preds": test_preds,
    }

# --------------------------------------------------------------------------------------
# 5. MONTE CARLO STOCHASTIC RISK & SAFETY STOCK ENGINE
# --------------------------------------------------------------------------------------
def run_monte_carlo_lead_time_simulation(
    forecast_demand_mean: float,
    forecast_demand_std: float,
    lead_time_mean: float,
    lead_time_std: float,
    current_stock: int,
    service_level_z: float,
    iterations: int = 1000,
    seed: int = 42
):
    """
    Performs joint bivariate Monte Carlo risk simulations over the supplier lead-time window:
    
    1. Sample simulated supplier lead times L_i ~ Normal(lead_time_mean, lead_time_std) (>= 1.0)
    2. Sample daily demand draws d_{i,t} ~ Normal(forecast_demand_mean, forecast_demand_std)
    3. Aggregate simulated Demand During Lead Time (DDLT_i) = sum_{t=1}^{ceil(L_i)} d_{i,t}
    4. Compute Dynamic Safety Stock (SS) with dual variance propagation:
       SS = Z * sqrt( L_mean * (sigma_d)^2 + (D_mean)^2 * (sigma_L)^2 )
    5. Dynamic Reorder Point (ROP) = (D_mean * L_mean) + SS
    6. Stock-Out Probability = Fraction of iterations where DDLT_i > current_stock
    """
    np.random.seed(seed)
    
    # Dual Variance Dynamic Safety Stock Formula (Silver-Pyke-Peterson Framework)
    # Term 1: Demand uncertainty over average lead time = L_bar * sigma_d^2
    # Term 2: Lead time uncertainty over average demand = D_bar^2 * sigma_L^2
    variance_term = (lead_time_mean * (forecast_demand_std ** 2)) + ((forecast_demand_mean ** 2) * (lead_time_std ** 2))
    joint_sigma = math.sqrt(max(0.001, variance_term))
    dynamic_safety_stock = int(math.ceil(service_level_z * joint_sigma))
    
    # Dynamic Reorder Point (ROP)
    expected_lead_time_demand = forecast_demand_mean * lead_time_mean
    dynamic_rop = int(math.ceil(expected_lead_time_demand + dynamic_safety_stock))
    
    # Vectorized Monte Carlo Sampling
    # Draw supplier lead times (clipped at min 1.0 day to reflect realistic operational lag)
    sampled_lead_times = np.clip(np.random.normal(lead_time_mean, lead_time_std, size=iterations), 1.0, None)
    
    simulated_ddlt = np.zeros(iterations)
    for i in range(iterations):
        lt_days = int(math.ceil(sampled_lead_times[i]))
        # Daily demand draws during this lead time
        daily_demands = np.clip(np.random.normal(forecast_demand_mean, forecast_demand_std, size=lt_days), 0.0, None)
        simulated_ddlt[i] = np.sum(daily_demands)
        
    stockout_events = np.sum(simulated_ddlt > current_stock)
    stockout_probability_pct = (stockout_events / iterations) * 100.0
    
    # Urgency Classification
    if current_stock <= dynamic_rop or stockout_probability_pct >= 25.0:
        urgency = "CRITICAL REORDER NOW"
        urgency_class = "badge-critical"
    elif current_stock <= int(dynamic_rop * 1.30) or stockout_probability_pct >= 10.0:
        urgency = "WARNING"
        urgency_class = "badge-warning"
    else:
        urgency = "OPTIMAL"
        urgency_class = "badge-optimal"
        
    # Suggested Reorder Quantity: Target Stock (ROP + 7 days cycle stock) - Current Stock
    target_inventory = dynamic_rop + int(forecast_demand_mean * 7.0)
    recommended_reorder_qty = max(0, target_inventory - current_stock)
    
    return {
        "dynamic_safety_stock": dynamic_safety_stock,
        "dynamic_rop": dynamic_rop,
        "expected_lead_time_demand": round(expected_lead_time_demand, 1),
        "stockout_probability_pct": round(stockout_probability_pct, 1),
        "simulated_ddlt": simulated_ddlt,
        "urgency": urgency,
        "urgency_class": urgency_class,
        "recommended_reorder_qty": recommended_reorder_qty,
        "p95_lead_time_demand": int(np.percentile(simulated_ddlt, 95)),
        "p99_lead_time_demand": int(np.percentile(simulated_ddlt, 99)),
    }

# --------------------------------------------------------------------------------------
# 6. APPLICATION HEADER & CONTROLS
# --------------------------------------------------------------------------------------
df_raw = generate_synthetic_supply_chain_data()

# SIDEBAR CONTROLS
with st.sidebar:
    st.markdown("### 🎛️ Control Tower Parameters")
    st.markdown("Configure operational thresholds and simulation parameters.")
    
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
        selected_skus = sku_options # Fallback to all
        
    st.markdown("---")
    st.markdown("#### 🛡️ Service Level & Lead Time Risk")
    
    service_level_map = {
        "90.0% (Z = 1.282) - Budget": 1.282,
        "95.0% (Z = 1.645) - Standard": 1.645,
        "98.0% (Z = 2.054) - Premium": 2.054,
        "99.0% (Z = 2.326) - Mission Critical": 2.326,
        "99.5% (Z = 2.576) - Zero-Tolerance": 2.576,
    }
    selected_csl = st.selectbox(
        "Cycle Service Level (CSL Target)",
        options=list(service_level_map.keys()),
        index=3, # 99.0% Mission critical
    )
    z_score = service_level_map[selected_csl]
    
    forecast_horizon = st.slider(
        "📅 Forecast Horizon (Days)",
        min_value=14,
        max_value=30,
        value=21,
        step=1,
    )
    
    monte_carlo_iterations = st.slider(
        "🎲 Monte Carlo Simulation Runs",
        min_value=500,
        max_value=2000,
        value=1000,
        step=250,
    )
    
    st.markdown("---")
    st.markdown("#### ⚡ Stress Test & Promo Sandbox")
    promo_uplift = st.slider(
        "Hypothetical Flash Sale Demand Surge (+%)",
        min_value=0,
        max_value=100,
        value=0,
        step=5,
        help="Simulate unexpected promotional velocity impact on stock-out risk.",
    )
    
    supplier_delay_bias = st.slider(
        "Supplier Lead Time Delay Shock (+Days)",
        min_value=0.0,
        max_value=5.0,
        value=0.0,
        step=0.5,
        help="Add systematic delay to model monsoon/port congestion disruptions.",
    )
    
    st.caption("AI Studio Supply Chain Engine v2.4 • Production Grade")

# TOP TITLE BAR
st.markdown(
    """
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
                Live Node: """ + WAREHOUSE_REGISTRY[selected_warehouse_id]["name"] + """
            </span>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# --------------------------------------------------------------------------------------
# 7. EXECUTION ENGINE & AGGREGATE METRICS
# --------------------------------------------------------------------------------------
# Run forecasting and Monte Carlo simulations across all selected SKUs
simulation_results = {}
total_revenue_at_risk = 0.0
total_recommended_ss = 0
critical_stockouts_count = 0
lead_time_variances = []

for s_id in selected_skus:
    sku_slice = df_raw[(df_raw["warehouse_id"] == selected_warehouse_id) & (df_raw["sku_id"] == s_id)]
    latest_row = sku_slice.sort_values("date").iloc[-1]
    
    # Train ML Model & Forecast
    fc_out = train_demand_forecast_model(sku_slice, forecast_horizon=forecast_horizon, promo_uplift_pct=promo_uplift)
    
    # Statistical demand properties
    d_mean = float(fc_out["forecast_df"]["forecast_demand"].mean())
    d_std = float(max(1.0, fc_out["forecast_df"]["forecast_demand"].std()))
    
    # Lead time properties with scenario shock
    base_lt_mean = SKU_CATALOG[s_id]["lead_time_mean"] + supplier_delay_bias
    base_lt_std = SKU_CATALOG[s_id]["lead_time_std"]
    lead_time_variances.append(base_lt_std)
    
    current_stock = int(latest_row["current_stock_level"])
    
    # Monte Carlo simulation
    mc_res = run_monte_carlo_lead_time_simulation(
        forecast_demand_mean=d_mean,
        forecast_demand_std=d_std,
        lead_time_mean=base_lt_mean,
        lead_time_std=base_lt_std,
        current_stock=current_stock,
        service_level_z=z_score,
        iterations=monte_carlo_iterations,
    )
    
    # Revenue at Risk = Stockout Probability * (Lead Time Demand - Current Stock) * Unit Price
    if mc_res["stockout_probability_pct"] > 5.0 and mc_res["p95_lead_time_demand"] > current_stock:
        deficit_units = mc_res["p95_lead_time_demand"] - current_stock
        stockout_pen = SKU_CATALOG[s_id]["stockout_penalty"] + SKU_CATALOG[s_id]["base_price"]
        rev_risk = deficit_units * stockout_pen * (mc_res["stockout_probability_pct"] / 100.0)
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
        "revenue_at_risk": rev_risk,
        "unit_price": SKU_CATALOG[s_id]["base_price"],
        "lead_time_mean": base_lt_mean,
        "lead_time_std": base_lt_std,
    }

avg_lead_time_std = float(np.mean(lead_time_variances)) if lead_time_variances else 0.0

# --------------------------------------------------------------------------------------
# 8. EXECUTIVE HEADER KPI METRIC CARDS
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
            <div class="metric-subtitle">Requiring Immediate Procurement PO</div>
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
            <div class="metric-subtitle">Lead-Time Deficit & Penalty Exposure</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with kpi_col3:
    st.markdown(
        f"""
        <div class="metric-card">
            <div class="metric-title">Dynamic Safety Stock Buffer</div>
            <div class="metric-value" style="color: #6366F1;">
                {total_recommended_ss:,} <span style="font-size: 1rem; font-weight: 500; color: #94A3B8;">Units</span>
            </div>
            <div class="metric-subtitle">Target CSL: {selected_csl.split(' ')[0]}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with kpi_col4:
    st.markdown(
        f"""
        <div class="metric-card">
            <div class="metric-title">Avg Supplier Lead-Time Volatility</div>
            <div class="metric-value" style="color: #38BDF8;">
                ±{avg_lead_time_std:.2f} <span style="font-size: 1rem; font-weight: 500; color: #94A3B8;">Days</span>
            </div>
            <div class="metric-subtitle">Standard Deviation across Vendors</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown("<div style='height: 16px;'></div>", unsafe_allow_html=True)

# --------------------------------------------------------------------------------------
# 9. DASHBOARD TABS
# --------------------------------------------------------------------------------------
tab_analytics, tab_table, tab_po, tab_architecture = st.tabs([
    "📈 Visual Analytics & Stochastic Deep-Dive",
    "📋 Stock-Out Risk & Reorder Action Table",
    "📑 Automated Purchase Order (PO) Generator",
    "🧠 Algorithmic Architecture & Methodology",
])

# --------------------------------------------------------------------------------------
# TAB 1: VISUAL ANALYTICS SECTION (PLOTLY CHARTS)
# --------------------------------------------------------------------------------------
with tab_analytics:
    active_sku = st.selectbox(
        "🔍 Deep-Dive SKU Inspection",
        options=selected_skus,
        format_func=lambda x: f"{x} - {SKU_CATALOG[x]['name']} ({SKU_CATALOG[x]['category']})",
        index=0,
    )
    
    sku_data = simulation_results[active_sku]
    fc_info = sku_data["forecast_output"]
    mc_info = sku_data["mc_output"]
    curr_stock = sku_data["current_stock"]
    
    viz_col1, viz_col2 = st.columns(2)
    
    # CHART 1: Historical vs Predicted Demand Forecast Curve
    with viz_col1:
        st.markdown(f"#### 🔮 Demand Forecast (Scikit-Learn GBR: {forecast_horizon} Days)")
        
        hist_df = fc_info["historical_df"].iloc[-60:]
        fore_df = fc_info["forecast_df"]
        
        fig1 = go.Figure()
        
        # Historical actual sales
        fig1.add_trace(go.Scatter(
            x=hist_df["date"],
            y=hist_df["units_sold"],
            mode="lines",
            name="Historical Sales (Last 60d)",
            line=dict(color="#94A3B8", width=1.8),
        ))
        
        # Predicted demand line
        fig1.add_trace(go.Scatter(
            x=fore_df["date"],
            y=fore_df["forecast_demand"],
            mode="lines+markers",
            name="ML Predicted Demand",
            line=dict(color="#6366F1", width=2.5),
            marker=dict(size=4),
        ))
        
        # Upper confidence bound
        fig1.add_trace(go.Scatter(
            x=fore_df["date"],
            y=fore_df["forecast_upper"],
            mode="lines",
            line=dict(width=0),
            showlegend=False,
            name="Upper 80% Bound",
        ))
        
        # Shaded confidence band
        fig1.add_trace(go.Scatter(
            x=fore_df["date"],
            y=fore_df["forecast_lower"],
            mode="lines",
            line=dict(width=0),
            fill="tonexty",
            fillcolor="rgba(99, 102, 241, 0.2)",
            name="80% Prediction Band",
        ))
        
        fig1.update_layout(
            template="plotly_dark",
            paper_bgcolor="rgba(15, 23, 42, 0.5)",
            plot_bgcolor="rgba(15, 23, 42, 0.5)",
            height=340,
            margin=dict(l=20, r=20, t=30, b=20),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            xaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.06)"),
            yaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.06)", title="Daily Units"),
        )
        st.plotly_chart(fig1, use_container_width=True)
        st.caption(f"Model Diagnostics: Holdout RMSE: **{fc_info['rmse']:.1f} units** | MAE: **{fc_info['mae']:.1f} units**")

    # CHART 2: Inventory Depletion & Dynamic ROP Alert Chart
    with viz_col2:
        st.markdown("#### 📉 Forward Inventory Depletion vs Dynamic Reorder Point")
        
        # Compute forward projected stock day by day
        depletion_dates = [datetime.date.today() + datetime.timedelta(days=d) for d in range(forecast_horizon)]
        depleted_inventory = []
        running_stock = curr_stock
        
        for d_pred in fore_df["forecast_demand"]:
            running_stock = max(0, running_stock - d_pred)
            depleted_inventory.append(running_stock)
            
        fig2 = go.Figure()
        
        fig2.add_trace(go.Scatter(
            x=depletion_dates,
            y=depleted_inventory,
            mode="lines+markers",
            name="Projected Inventory on Hand",
            line=dict(color="#38BDF8", width=2.8),
            fill="tozeroy",
            fillcolor="rgba(56, 189, 248, 0.1)",
        ))
        
        # Dynamic ROP line
        fig2.add_trace(go.Scatter(
            x=depletion_dates,
            y=[mc_info["dynamic_rop"]] * len(depletion_dates),
            mode="lines",
            name=f"Dynamic ROP ({mc_info['dynamic_rop']} units)",
            line=dict(color="#EF4444", width=2.2, dash="dash"),
        ))
        
        # Dynamic Safety Stock line
        fig2.add_trace(go.Scatter(
            x=depletion_dates,
            y=[mc_info["dynamic_safety_stock"]] * len(depletion_dates),
            mode="lines",
            name=f"Safety Stock ({mc_info['dynamic_safety_stock']} units)",
            line=dict(color="#F59E0B", width=1.8, dash="dot"),
        ))
        
        fig2.update_layout(
            template="plotly_dark",
            paper_bgcolor="rgba(15, 23, 42, 0.5)",
            plot_bgcolor="rgba(15, 23, 42, 0.5)",
            height=340,
            margin=dict(l=20, r=20, t=30, b=20),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            xaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.06)"),
            yaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.06)", title="Stock on Hand"),
        )
        st.plotly_chart(fig2, use_container_width=True)
        st.caption(f"Current Stock: **{curr_stock} units** | Dynamic Reorder Point: **{mc_info['dynamic_rop']} units**")

    # CHART 3: Monte Carlo Stock-Out Risk Distribution Histogram
    st.markdown(f"#### 🎲 Monte Carlo Demand During Lead Time ({monte_carlo_iterations:,} Stochastic Runs)")
    
    sim_ddlt = mc_info["simulated_ddlt"]
    
    fig3 = go.Figure()
    
    fig3.add_trace(go.Histogram(
        x=sim_ddlt,
        nbinsx=45,
        name="Simulated Lead Time Demand",
        marker_color="#818CF8",
        opacity=0.75,
    ))
    
    # Threshold: Current Stock on hand
    fig3.add_vline(
        x=curr_stock,
        line_width=3,
        line_dash="dash",
        line_color="#EF4444",
        annotation_text=f"Current Stock ({curr_stock})",
        annotation_position="top right",
    )
    
    # Threshold: Dynamic ROP
    fig3.add_vline(
        x=mc_info["dynamic_rop"],
        line_width=2,
        line_dash="dot",
        line_color="#34D399",
        annotation_text=f"Target ROP ({mc_info['dynamic_rop']})",
        annotation_position="top left",
    )
    
    fig3.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(15, 23, 42, 0.5)",
        plot_bgcolor="rgba(15, 23, 42, 0.5)",
        height=320,
        margin=dict(l=20, r=20, t=30, b=20),
        xaxis=dict(title="Simulated Units Demanded Over Supplier Lead Time Window", showgrid=True, gridcolor="rgba(255,255,255,0.06)"),
        yaxis=dict(title="Frequency of Simulation Iterations", showgrid=True, gridcolor="rgba(255,255,255,0.06)"),
    )
    st.plotly_chart(fig3, use_container_width=True)
    
    st.info(
        f"💡 **Stochastic Simulation Result for {SKU_CATALOG[active_sku]['name']}**: "
        f"Out of {monte_carlo_iterations:,} iterations, simulated demand during lead time exceeded current physical inventory "
        f"in **{mc_info['stockout_probability_pct']}%** of iterations. "
        f"P95 worst-case demand during lead time is **{mc_info['p95_lead_time_demand']} units**."
    )

# --------------------------------------------------------------------------------------
# TAB 2: STOCK-OUT RISK & REORDER ACTION TABLE
# --------------------------------------------------------------------------------------
with tab_table:
    st.markdown("#### 📋 Comprehensive SKU Stock-Out Risk Prioritization")
    st.markdown("Dynamic evaluation based on joint lead-time and demand variance propagation.")
    
    table_rows = []
    for s_id in selected_skus:
        s_data = simulation_results[s_id]
        m = s_data["mc_output"]
        table_rows.append({
            "SKU ID": s_id,
            "SKU Name": SKU_CATALOG[s_id]["name"],
            "Category": SKU_CATALOG[s_id]["category"],
            "Stock on Hand": s_data["current_stock"],
            "Dynamic ROP": m["dynamic_rop"],
            "Safety Stock (SS)": m["dynamic_safety_stock"],
            "Stock-Out Risk (%)": m["stockout_probability_pct"],
            "Revenue at Risk (₹)": round(s_data["revenue_at_risk"], 2),
            "Recommended PO Qty": m["recommended_reorder_qty"],
            "Status": m["urgency"],
        })
        
    risk_df = pd.DataFrame(table_rows).sort_values(by="Stock-Out Risk (%)", ascending=False)
    
    # Styled Display
    st.dataframe(
        risk_df.style.format({
            "Stock-Out Risk (%)": "{:.1f}%",
            "Revenue at Risk (₹)": "₹{:,.2f}",
            "Stock on Hand": "{:,}",
            "Dynamic ROP": "{:,}",
            "Safety Stock (SS)": "{:,}",
            "Recommended PO Qty": "{:,}",
        }).background_gradient(
            subset=["Stock-Out Risk (%)"],
            cmap="Reds",
            vmin=0.0,
            vmax=100.0,
        ),
        use_container_width=True,
        hide_index=True,
    )
    
    st.caption("Sortable operational table. Critical SKUs are highlighted with elevated stock-out probability.")

# --------------------------------------------------------------------------------------
# TAB 3: EXPORT & PROCUREMENT PO GENERATOR
# --------------------------------------------------------------------------------------
with tab_po:
    st.markdown("#### 📑 Automated Purchase Order (PO) Batch Generator")
    st.markdown("Instantly export enterprise-ready Purchase Orders with optimal replenishment quantities.")
    
    po_records = []
    po_batch_id = f"PO-{datetime.date.today().strftime('%Y%m%d')}-{selected_warehouse_id}"
    
    for s_id in selected_skus:
        s_data = simulation_results[s_id]
        m = s_data["mc_output"]
        
        # Only order if reorder quantity > 0 or status is Critical/Warning
        if m["recommended_reorder_qty"] > 0 or m["urgency"] in ["CRITICAL REORDER NOW", "WARNING"]:
            po_qty = max(m["recommended_reorder_qty"], int(m["dynamic_safety_stock"] * 1.5))
            total_cost = po_qty * s_data["unit_price"]
            expected_delivery = datetime.date.today() + datetime.timedelta(days=int(math.ceil(s_data["lead_time_mean"])))
            
            po_records.append({
                "PO_Number": po_batch_id,
                "Warehouse_ID": selected_warehouse_id,
                "Warehouse_Name": WAREHOUSE_REGISTRY[selected_warehouse_id]["name"],
                "SKU_ID": s_id,
                "SKU_Name": SKU_CATALOG[s_id]["name"],
                "Current_Stock": s_data["current_stock"],
                "Dynamic_ROP": m["dynamic_rop"],
                "Safety_Stock": m["dynamic_safety_stock"],
                "Recommended_Order_Qty": po_qty,
                "Unit_Cost_INR": s_data["unit_price"],
                "Total_PO_Value_INR": round(total_cost, 2),
                "Expected_Delivery_Date": expected_delivery.strftime("%Y-%m-%d"),
                "Priority": "URGENT" if m["urgency"] == "CRITICAL REORDER NOW" else "NORMAL",
            })
            
    if po_records:
        po_df = pd.DataFrame(po_records)
        st.dataframe(
            po_df.style.format({
                "Unit_Cost_INR": "₹{:,.2f}",
                "Total_PO_Value_INR": "₹{:,.2f}",
                "Current_Stock": "{:,}",
                "Dynamic_ROP": "{:,}",
                "Safety_Stock": "{:,}",
                "Recommended_Order_Qty": "{:,}",
            }),
            use_container_width=True,
            hide_index=True,
        )
        
        total_po_val = po_df["Total_PO_Value_INR"].sum()
        total_po_units = po_df["Recommended_Order_Qty"].sum()
        
        c1, c2 = st.columns(2)
        with c1:
            st.metric("Total Purchase Order Commitment", f"₹{total_po_val:,.2f}")
        with c2:
            st.metric("Total Procurement Replenishment Units", f"{total_po_units:,} Units")
            
        csv_buffer = io.StringIO()
        po_df.to_csv(csv_buffer, index=False)
        csv_data = csv_buffer.getvalue()
        
        st.download_button(
            label="📥 Download Procurement Purchase Orders (.CSV)",
            data=csv_data,
            file_name=f"procurement_po_batch_{selected_warehouse_id}_{datetime.date.today().strftime('%Y%m%d')}.csv",
            mime="text/csv",
            type="primary",
        )
    else:
        st.success("🎉 All inventory levels are optimal! No procurement purchase orders currently required.")

# --------------------------------------------------------------------------------------
# TAB 4: ALGORITHMIC ARCHITECTURE & METHODOLOGY
# --------------------------------------------------------------------------------------
with tab_architecture:
    st.markdown("### 🔬 Senior Analytics Engineering & Statistical Formulation")
    
    st.markdown(
        """
        #### 1. Propagation of Variance in Supply Chains
        Traditional supply chain models assume deterministic supplier lead times. In modern quick-commerce,
        both demand ($D$) and lead time ($L$) are mutually independent random variables with finite variance:
        - $\bar{D} = \mathbb{E}[D]$, $\sigma_D^2 = \text{Var}(D)$
        - $\bar{L} = \mathbb{E}[L]$, $\sigma_L^2 = \text{Var}(L)$
        
        By applying the **Law of Total Variance**, the variance of Demand During Lead Time ($DDLT$) is:
        """
    )
    st.latex(r"\text{Var}(DDLT) = \bar{L} \cdot \sigma_D^2 + \bar{D}^2 \cdot \sigma_L^2")
    
    st.markdown(
        """
        Consequently, for a specified Cycle Service Level $CSL$ with standard normal quantile $Z = \Phi^{-1}(CSL)$:
        """
    )
    st.latex(r"\text{Safety Stock (SS)} = Z \cdot \sqrt{\bar{L} \cdot \sigma_D^2 + \bar{D}^2 \cdot \sigma_L^2}")
    st.latex(r"\text{Reorder Point (ROP)} = (\bar{D} \cdot \bar{L}) + \text{Safety Stock}")
    
    st.markdown(
        """
        #### 2. Machine Learning Demand Forecasting Pipeline
        - **Model:** Scikit-Learn `GradientBoostingRegressor` (120 estimators, depth=4, learning rate=0.06).
        - **Feature Engineering:**
          - Temporal autoregressive lags: $t-1, t-7, t-14$
          - Rolling statistical windows: 7-day mean, 7-day standard deviation, 30-day mean
          - Calendar variables: Day of week, month, weekend indicator
          - Interaction features: Promotional flash sales combined with weekend consumer velocity
        - **Recursive Multi-Step Horizon:** Roll-forward forecasting dynamically projecting demand up to 30 days ahead.
        
        #### 3. Bivariate Monte Carlo Risk Engine
        While analytical formulas approximate Gaussian distributions, real-world lead times exhibit tail skewness.
        The Monte Carlo simulator draws $N$ joint samples from:
        $$L_i \sim \text{Truncated-Normal}(\mu_L, \sigma_L^2, a=1)$$
        $$d_{i,t} \sim \text{Normal}(\hat{y}_t, \text{RMSE}^2)$$
        $$DDLT_i = \sum_{t=1}^{\lceil L_i \rceil} d_{i,t}$$
        $$\text{Stock-Out Probability} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}(DDLT_i > \text{Current Stock})$$
        """
    )

st.markdown("---")
st.markdown(
    """
    <div style="text-align: center; color: #64748B; font-size: 0.8rem; padding: 12px 0;">
        Multi-Source Supply Chain & Inventory Stock-Out Forecaster • Engineered for Quick-Commerce & Modern Retail
    </div>
    """,
    unsafe_allow_html=True,
)
