import { describe, it, expect, vi, beforeEach } from "vitest";
import posthog from "posthog-js";
import { assertBusinessLogic } from "@/shared/lib/businessInvariants";

// Mock posthog-js
vi.mock("posthog-js", () => {
  return {
    default: {
      capture: vi.fn(),
    },
  };
});

// Função pura simulando a lógica de splitDetails de IncomeSplitterModal.tsx
function calculateSplitDetails(grossInput: number, selectedRule: string, fixedNeedsValue: number) {
  let toFundNeeds = 0;
  let remainingPartner = 0;

  if (selectedRule === "partner_fixed_needs") {
    toFundNeeds = Math.min(grossInput, fixedNeedsValue);
    remainingPartner = Math.max(0, grossInput - fixedNeedsValue);
  } else if (selectedRule === "fifty_fifty") {
    toFundNeeds = Number((grossInput * 0.5).toFixed(2));
    remainingPartner = Number((grossInput * 0.5).toFixed(2));
  } else if (selectedRule === "custom_percentage") {
    toFundNeeds = Number((grossInput * 0.7).toFixed(2));
    remainingPartner = Number((grossInput * 0.3).toFixed(2));
  }

  const resultToFund = Number(toFundNeeds.toFixed(2));
  const resultRemaining = Number(remainingPartner.toFixed(2));
  const sum = Number((resultToFund + resultRemaining).toFixed(2));

  const isMatched = Math.abs(sum - grossInput) <= 0.01;

  assertBusinessLogic(isMatched, "income_splitter_mismatch", {
    grossInput,
    selectedRule,
    toFundNeeds: resultToFund,
    remainingPartner: resultRemaining,
    difference: Number((sum - grossInput).toFixed(2))
  });

  return {
    toFundNeeds: resultToFund,
    remainingPartner: resultRemaining,
    isMatched,
  };
}

describe("Income Splitter & Business Invariant Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve calcular a regra fifty_fifty corretamente", () => {
    const result = calculateSplitDetails(100.00, "fifty_fifty", 500);
    expect(result.toFundNeeds).toBe(50.00);
    expect(result.remainingPartner).toBe(50.00);
    expect(result.isMatched).toBe(true);
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("deve calcular a regra custom_percentage (70/30) corretamente", () => {
    const result = calculateSplitDetails(150.00, "custom_percentage", 500);
    expect(result.toFundNeeds).toBe(105.00);
    expect(result.remainingPartner).toBe(45.00);
    expect(result.isMatched).toBe(true);
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("deve calcular a regra partner_fixed_needs corretamente quando receita menor que necessidades", () => {
    const result = calculateSplitDetails(300.00, "partner_fixed_needs", 500.00);
    expect(result.toFundNeeds).toBe(300.00);
    expect(result.remainingPartner).toBe(0);
    expect(result.isMatched).toBe(true);
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("deve calcular a regra partner_fixed_needs corretamente quando receita maior que necessidades", () => {
    const result = calculateSplitDetails(800.00, "partner_fixed_needs", 500.00);
    expect(result.toFundNeeds).toBe(500.00);
    expect(result.remainingPartner).toBe(300.00);
    expect(result.isMatched).toBe(true);
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("deve disparar o evento business_logic_anomaly do PostHog quando ocorrer mismatch de soma", () => {
    // Para simular um bug silencioso (ex: erro matemático forçado)
    const badCalculationSum = 99.98; // Gross é 100, mas a soma dá 99.98
    const gross = 100.00;
    
    // Testa assertBusinessLogic diretamente com uma condição falsa
    assertBusinessLogic(false, "income_splitter_mismatch", {
      grossInput: gross,
      selectedRule: "fifty_fifty",
      toFundNeeds: 49.99,
      remainingPartner: 49.99,
      difference: -0.02
    });

    expect(posthog.capture).toHaveBeenCalledWith("business_logic_anomaly", {
      anomaly_name: "income_splitter_mismatch",
      grossInput: gross,
      selectedRule: "fifty_fifty",
      toFundNeeds: 49.99,
      remainingPartner: 49.99,
      difference: -0.02
    });
  });
});
