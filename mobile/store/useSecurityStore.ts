import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

interface SecurityState {
  isBiometricEnabled: boolean;
  isUnlocked: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  isLoading: boolean;

  initSecurity: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setUnlocked: (unlocked: boolean) => void;
  authenticate: () => Promise<boolean>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isBiometricEnabled: false,
  isUnlocked: false,
  hasHardware: false,
  isEnrolled: false,
  isLoading: true,

  initSecurity: async () => {
    try {
      set({ isLoading: true });
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      const storedEnabled = await AsyncStorage.getItem("@vault_biometric_enabled");
      const isBiometricEnabled = storedEnabled === "true";

      set({
        hasHardware,
        isEnrolled,
        isBiometricEnabled: hasHardware && isEnrolled && isBiometricEnabled,
        isUnlocked: !(hasHardware && isEnrolled && isBiometricEnabled), // If biometrics is off, it is unlocked by default
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  setBiometricEnabled: async (enabled) => {
    try {
      await AsyncStorage.setItem("@vault_biometric_enabled", String(enabled));
      set({ isBiometricEnabled: enabled });
      if (!enabled) {
        set({ isUnlocked: true });
      }
    } catch (error) {
      console.error("Erro ao persistir configuração de biometria", error);
    }
  },

  setUnlocked: (unlocked) => {
    set({ isUnlocked: unlocked });
  },

  authenticate: async () => {
    const { isBiometricEnabled, hasHardware, isEnrolled } = get();
    if (!isBiometricEnabled || !hasHardware || !isEnrolled) {
      set({ isUnlocked: true });
      return true;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Desbloquear o Vault OS",
        fallbackLabel: "Senha do Dispositivo",
        disableDeviceFallback: false,
      });

      if (result.success) {
        set({ isUnlocked: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro na autenticação biométrica", error);
      return false;
    }
  },
}));
