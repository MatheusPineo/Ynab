import React, { createContext, useContext, useState, useEffect } from "react";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";

interface SecurityLockContextType {
  isLocked: boolean;
  lockTimestamp: number | null;
  lockApp: () => void;
  unlockApp: () => void;
  verifyBiometrics: () => Promise<boolean>;
}

const SecurityLockContext = createContext<SecurityLockContextType | undefined>(undefined);

export const SecurityLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    // Recupera o estado persistido do bloqueio para evitar bypass em reinicializações do app
    const saved = localStorage.getItem("vault_is_locked");
    if (saved === "true") return true;

    // Se a biometria/PIN estiver ativado, força o estado bloqueado por padrão no Cold Start (evita piscar a tela do app)
    const isBiometricEnabled = localStorage.getItem("vault_biometric_enabled") === "true";
    if (isBiometricEnabled) {
      return true;
    }
    return false;
  });

  const [lockTimestamp, setLockTimestamp] = useState<number | null>(() => {
    const savedTime = localStorage.getItem("vault_lock_timestamp");
    if (savedTime) return parseInt(savedTime, 10);
    
    const isBiometricEnabled = localStorage.getItem("vault_biometric_enabled") === "true";
    if (isBiometricEnabled) return Date.now();
    return null;
  });

  const lockApp = () => {
    setIsLocked(true);
    const now = Date.now();
    setLockTimestamp(now);
    localStorage.setItem("vault_is_locked", "true");
    localStorage.setItem("vault_lock_timestamp", now.toString());
  };

  const unlockApp = () => {
    setIsLocked(false);
    setLockTimestamp(null);
    localStorage.removeItem("vault_is_locked");
    localStorage.removeItem("vault_lock_timestamp");
  };

  const verifyBiometrics = async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      console.warn("Autenticação biométrica simulada em ambiente Web/Desenvolvimento.");
      return true; // Simula sucesso no navegador para facilidade de desenvolvimento
    }

    try {
      const result = await BiometricAuth.checkBiometry();
      if (result.isAvailable) {
        await BiometricAuth.authenticate({
          reason: "Autentique-se para desbloquear sua carteira do Vault Finance OS",
          title: "Bloqueio de Segurança",
          subtitle: "Use a biometria cadastrada no seu aparelho para continuar",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro na autenticação biométrica:", error);
      return false;
    }
  };

  useEffect(() => {
    // Escuta mudanças de estado do app Capacitor (minimizar/abrir)
    const setupAppListener = async () => {
      const handler = await CapApp.addListener("appStateChange", (state) => {
        if (!state.isActive) {
          // O aplicativo foi para segundo plano (background)
          lockApp();
        }
      });
      return handler;
    };

    const listenerPromise = setupAppListener();

    return () => {
      listenerPromise.then((handler) => {
        handler.remove();
      });
    };
  }, []);

  return (
    <SecurityLockContext.Provider
      value={{
        isLocked,
        lockTimestamp,
        lockApp,
        unlockApp,
        verifyBiometrics,
      }}
    >
      {children}
    </SecurityLockContext.Provider>
  );
};

export const useSecurityLock = () => {
  const context = useContext(SecurityLockContext);
  if (!context) {
    throw new Error("useSecurityLock deve ser utilizado dentro de um SecurityLockProvider");
  }
  return context;
};
