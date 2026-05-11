import { useSettingsStore } from "@/modules/auth/store/useSettingsStore";
import { Currency } from "../types";

export const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: "€",
  BRL: "R$",
  USD: "$",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
  CNY: "元",
};

export function getCurrencySymbol(currency: string): string {
  if (CURRENCY_SYMBOL[currency]) {
    return CURRENCY_SYMBOL[currency];
  }
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    });
    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find((part) => part.type === "currency");
    return symbolPart ? symbolPart.value : currency;
  } catch {
    return currency;
  }
}

export function getCurrencyLocale(currency: string): string {
  const mapping: Record<string, string> = {
    EUR: "pt-PT",
    BRL: "pt-BR",
    USD: "en-US",
    GBP: "en-GB",
    JPY: "ja-JP",
    CAD: "en-CA",
    AUD: "en-AU",
    CHF: "fr-CH",
    CNY: "zh-CN",
    INR: "en-IN",
  };
  return mapping[currency] || "en-US";
}

export function formatMoney(amount: number | string, currency: Currency): string {
  const isPrivateMode = useSettingsStore.getState().isPrivateMode;
  if (isPrivateMode) {
    return `${getCurrencySymbol(currency || "EUR")} ••••`;
  }
  const showDecimals = useSettingsStore.getState().showDecimals;
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const locale = getCurrencyLocale(currency || "EUR");
  
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(numericAmount || 0);
  } catch (e) {
    return `${getCurrencySymbol(currency || "EUR")} ${(numericAmount || 0).toLocaleString(locale, {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    })}`;
  }
}
