import { describe, it, expect } from "vitest";

// Lógica pura simplificada para testes unitários
const calculateMillionaireProjection = (startingPrincipal: number, monthlyContribution: number, expectedReturn: number) => {
  const target = 1000000;
  const monthlyRate = Math.pow(1 + expectedReturn / 100, 1 / 12) - 1;

  let balance = startingPrincipal;
  let monthsElapsed = 0;

  while (balance < target && monthsElapsed < 600) {
    monthsElapsed++;
    balance = balance * (1 + monthlyRate) + monthlyContribution;
  }

  const years = Math.floor(monthsElapsed / 12);
  const remainingMonths = monthsElapsed % 12;

  return {
    monthsElapsed,
    years,
    remainingMonths,
    reached: balance >= target,
  };
};

const calculateFIRENumber = (monthlyExpenses: number, safeWithdrawalRate: number) => {
  const annualExpenses = monthlyExpenses * 12;
  return Math.round(annualExpenses / (safeWithdrawalRate / 100));
};

describe("Dynamic Financial Calculators Logic Tests", () => {
  it("should calculate Millionaire projection correctly with simple returns", () => {
    // Caso trivial: Patrimônio inicial alto e aportes mensais
    const result = calculateMillionaireProjection(800000, 5000, 8);
    expect(result.reached).toBe(true);
    expect(result.years).toBeLessThan(5); // Deve atingir 1 milhão rapidamente
  });

  it("should calculate FIRE Target using 4% rule", () => {
    const fireTarget = calculateFIRENumber(3000, 4); // Despesa 3.000 / mês
    // 3000 * 12 = 36000
    // 36000 / 0.04 = 900.000
    expect(fireTarget).toBe(900000);
  });

  it("should calculate FIRE Target using 3% rule", () => {
    const fireTarget = calculateFIRENumber(3000, 3);
    // 3000 * 12 = 36000
    // 36000 / 0.03 = 1.200.000
    expect(fireTarget).toBe(1200000);
  });
});
