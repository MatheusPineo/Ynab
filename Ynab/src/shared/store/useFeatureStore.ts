import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface EnabledFeatures {
  dashboard: boolean;
  accounts: boolean;
  transactions: boolean;
  budget: boolean;
  debts: boolean;
  goals: boolean;
  insights: boolean;
  rule503020: boolean;
  credit_cards: boolean;
  
  // Relatórios Opcionais (v1.17.3)
  report_beginner: boolean;
  report_intermediate: boolean;
  report_advanced: boolean;
  report_compliance: boolean;
  report_performance: boolean;
  report_risk: boolean;
  report_audit: boolean;
  report_business: boolean;
  report_integrity: boolean;
}

interface FeatureState {
  features: EnabledFeatures;
  toggleFeature: (key: keyof EnabledFeatures) => void;
  setFeatures: (features: Partial<EnabledFeatures>) => void;
}

const defaultFeatures: EnabledFeatures = {
  dashboard: true,
  accounts: true,
  transactions: true,
  budget: true,
  debts: true,
  goals: true,
  insights: true,
  rule503020: true,
  credit_cards: true,
  
  // Relatórios Opcionais (v1.17.3)
  report_beginner: true,
  report_intermediate: true,
  report_advanced: true,
  report_compliance: true,
  report_performance: true,
  report_risk: true,
  report_audit: true,
  report_business: true,
  report_integrity: true,
};

export const useFeatureStore = create<FeatureState>()(
  persist(
    (set) => ({
      features: defaultFeatures,
      toggleFeature: (key) =>
        set((state) => ({
          features: {
            ...state.features,
            [key]: !state.features[key],
          },
        })),
      setFeatures: (newFeatures) =>
        set((state) => ({
          features: {
            ...state.features,
            ...newFeatures,
          },
        })),
    }),
    {
      name: "vault_features_config",
    }
  )
);
