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

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
