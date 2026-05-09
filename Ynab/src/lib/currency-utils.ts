import { useSettingsStore } from "@/store/useSettingsStore";
import { Currency } from "../types";

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: "€",
  BRL: "R$",
  USD: "$",
};

export const CURRENCY_LOCALE: Record<Currency, string> = {
  EUR: "pt-PT",
  BRL: "pt-BR",
  USD: "en-US",
};

export function formatMoney(amount: number | string, currency: Currency): string {
  const isPrivateMode = useSettingsStore.getState().isPrivateMode;
  if (isPrivateMode) {
    return `${CURRENCY_SYMBOL[currency]} ••••`;
  }
  const showDecimals = useSettingsStore.getState().showDecimals;
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(numericAmount || 0);
}
