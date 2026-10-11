import { ForecastModel } from "../types";

export interface ForecastModelMeta {
  id: ForecastModel;
  name: string;
  vendor: string;
  architecture: string;
  badge: string;
  color: string;
  description: string;
  advantages: string[];
  benchmarkMae: number;
  inferenceLatencyMs: number;
  paperReference: string;
}

export const FORECAST_MODELS_META: Record<ForecastModel, ForecastModelMeta> = {
  META_PROPHET: {
    id: "META_PROPHET",
    name: "Meta Prophet",
    vendor: "Meta Core AI",
    architecture: "Decomposable Generalized Additive Model (GAM)",
    badge: "Industry Standard",
    color: "indigo",
    description:
      "Decomposes demand into non-linear piecewise trend changepoints + Fourier multi-seasonality + external promo/holiday regressors.",
    advantages: [
      "Robust to missing dark-store scans",
      "Handles irregular monsoon flash shocks effortlessly",
      "Interpretable trend changepoints for CFOs",
    ],
    benchmarkMae: 4.8,
    inferenceLatencyMs: 18,
    paperReference: "Taylor & Letham (2018), Forecasting at Scale",
  },
  XGBOOST: {
    id: "XGBOOST",
    name: "XGBoost Regressor",
    vendor: "Distributed ML",
    architecture: "Extreme Gradient Boosted Decision Ensembles",
    badge: "Top Kaggle Choice",
    color: "emerald",
    description:
      "Engineers deep autoregressive feature matrices (lags 1, 7, 14, 28, rolling rolling stats) to learn non-linear demand interactions.",
    advantages: [
      "Fastest tree inference (<8ms)",
      "Captures non-linear cross-product pricing elasticities",
      "Optimal for high-velocity FMCG items",
    ],
    benchmarkMae: 4.2,
    inferenceLatencyMs: 8,
    paperReference: "Chen & Guestrin (2016), XGBoost: A Scalable Tree Boosting System",
  },
  AMAZON_DEEPAR: {
    id: "AMAZON_DEEPAR",
    name: "Amazon DeepAR",
    vendor: "AWS AI Labs",
    architecture: "Autoregressive Recurrent Neural Networks (RNN/LSTM)",
    badge: "Deep Learning Tier",
    color: "purple",
    description:
      "Trained autoregressive RNN producing probabilistic negative binomial distributions with asymmetric P10/P50/P90 quantile bounds.",
    advantages: [
      "Learns cross-SKU latent embeddings across all catalog items",
      "Superior cold-start modeling for new catalog additions",
      "Native asymmetric quantile risk distributions",
    ],
    benchmarkMae: 3.9,
    inferenceLatencyMs: 42,
    paperReference: "Salinas et al. (2020), DeepAR: Probabilistic Forecasting with AR-RNNs",
  },
  HOLT_WINTERS_ARIMA: {
    id: "HOLT_WINTERS_ARIMA",
    name: "Holt-Winters / ARIMA",
    vendor: "Econometrics",
    architecture: "Triple Exponential Smoothing + Box-Jenkins ARIMA(1,1,1)",
    badge: "Classical Benchmark",
    color: "slate",
    description:
      "Closed-form econometric formulation estimating Level (α), Trend (β), and Weekly Multiplicative Seasonality (γ).",
    advantages: [
      "Deterministic closed-form solution",
      "Zero training warmup period",
      "Standard audit-approved baseline for enterprise finance",
    ],
    benchmarkMae: 5.6,
    inferenceLatencyMs: 4,
    paperReference: "Winters (1960) / Box & Jenkins (1970)",
  },
};
