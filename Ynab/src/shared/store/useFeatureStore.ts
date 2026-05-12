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
