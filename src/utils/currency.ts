import { CurrencyCode } from "../types";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateFromInr: number; // Multiply INR by this to get foreign currency
  locale: string;
  flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    rateFromInr: 1.0,
    locale: "en-IN",
    flag: "🇮🇳",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    rateFromInr: 1 / 85.5,
    locale: "en-US",
    flag: "🇺🇸",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    rateFromInr: 1 / 93.0,
    locale: "de-DE",
    flag: "🇪🇺",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    rateFromInr: 1 / 109.0,
    locale: "en-GB",
    flag: "🇬🇧",
  },
};

const STORAGE_KEY = "aegis_preferred_currency";

export function getStoredCurrency(): CurrencyCode {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val && ["USD", "EUR", "GBP", "INR"].includes(val)) {
      return val as CurrencyCode;
    }
  } catch {
    // ignore
  }
  return "INR";
}

export function setStoredCurrency(c: CurrencyCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, c);
  } catch {
    // ignore
  }
}

/**
 * Convert an amount given in base INR to the target currency
 */
export function convertFromInr(amountInInr: number, target: CurrencyCode): number {
  const config = CURRENCIES[target] || CURRENCIES.INR;
  return amountInInr * config.rateFromInr;
}

/**
 * Convert an amount in target currency back to base INR
 */
export function convertToInr(amount: number, source: CurrencyCode): number {
  const config = CURRENCIES[source] || CURRENCIES.INR;
  return amount / config.rateFromInr;
}

/**
 * Formats an amount originally in INR into the target currency with correct symbol and locale
 */
export function formatCurrency(
  amountInInr: number,
  targetCurrency: CurrencyCode = "INR",
  options?: {
    compact?: boolean;
    decimals?: number;
    showCode?: boolean;
  }
): string {
  const config = CURRENCIES[targetCurrency] || CURRENCIES.INR;
  const converted = convertFromInr(amountInInr, targetCurrency);

  const decimals = options?.decimals !== undefined
    ? options.decimals
    : (targetCurrency === "INR" ? 0 : 2);

  if (options?.compact && Math.abs(converted) >= 1000) {
    if (Math.abs(converted) >= 1_000_000) {
      return `${config.symbol}${(converted / 1_000_000).toFixed(1)}M${options?.showCode ? ` ${config.code}` : ""}`;
    }
    if (Math.abs(converted) >= 1_000) {
      return `${config.symbol}${(converted / 1_000).toFixed(1)}k${options?.showCode ? ` ${config.code}` : ""}`;
    }
  }

  const formattedNum = converted.toLocaleString(config.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${config.symbol}${formattedNum}${options?.showCode ? ` ${config.code}` : ""}`;
}
