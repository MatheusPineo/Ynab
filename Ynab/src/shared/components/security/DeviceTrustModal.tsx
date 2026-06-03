import React, { useState, useEffect } from "react";
import { registerPlugin, Capacitor } from "@capacitor/core";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { ShieldCheck, Smartphone, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const DeviceAuth = registerPlugin<any>("DeviceAuth");

export const DeviceTrustModal: React.FC = () => {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkDeviceTrust = async () => {
      // Executa APENAS UMA VEZ na inicialização do aplicativo
      const localKey = localStorage.getItem("DEVICE_KEY");
      let hasNativeKey = false;

      if (Capacitor.isNativePlatform()) {
        try {
          const result = await DeviceAuth.getDeviceKey();
          if (result && result.key) {
            hasNativeKey = true;
          }
        } catch (err) {
          console.error("Erro ao verificar chave nativa no boot:", err);
        }
      }

      if (!localKey && !hasNativeKey) {
        setIsOpen(true);
      }
    };

    checkDeviceTrust();
  }, []);

  const handleTrustDevice = async () => {
    if (!isAuthenticated || !accessToken) {
      toast.error("Você precisa estar autenticado para registrar o dispositivo.");
      return;
    }

    setIsLoading(true);
    try {
      const isWeb = Capacitor.getPlatform() === 'web';
      
      const currentDateTime = new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).replace(",", "");

      // Coleta o nome personalizado / amigável
      let deviceName = `Web Session - ${currentDateTime}`;
      if (!isWeb) {
        deviceName = `Dispositivo Móvel - ${currentDateTime}`;
      }

      // Tenta detectar mais detalhes do browser ou dispositivo no Web
      const userAgent = navigator.userAgent || "";
      if (isWeb) {
        if (userAgent.includes("Windows")) {
          deviceName = `Windows PC - ${currentDateTime}`;
        } else if (userAgent.includes("Macintosh")) {
          deviceName = `Mac - ${currentDateTime}`;
        } else if (userAgent.includes("Linux")) {
          deviceName = `Linux PC - ${currentDateTime}`;
        }
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";

      // Gera um UUID para o device_key
      const randomUuid = crypto.randomUUID ? crypto.randomUUID() : "generated-" + Math.random().toString(36).substring(2, 15);

      const response = await fetch(`${baseUrl}/devices/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          device_name: deviceName,
          device_key: randomUuid,
          raw_user_agent: userAgent,
          timezone: timezone
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erro detalhado do backend ao autorizar aparelho:", {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        
        let detailedError = "Falha ao registrar dispositivo no servidor.";
        if (errorData) {
          if (typeof errorData === "string") {
            detailedError = errorData;
          } else if (errorData.error) {
            detailedError = errorData.error;
          } else if (errorData.detail) {
            detailedError = errorData.detail;
          } else if (typeof errorData === "object" && Object.keys(errorData).length > 0) {
            const values = Object.values(errorData).flat();
            detailedError = values.map(val => typeof val === 'object' ? JSON.stringify(val) : String(val)).join(', ');
          }
        }
        
        throw new Error(detailedError);
      }

      const data = await response.json();

      // Salva no armazenamento adequado com base na plataforma (Plugin nativo ou localStorage)
      if (!isWeb) {
        try {
          await DeviceAuth.storeDeviceKey({ token: data.token });
        } catch (pluginErr) {
          console.warn("Falha ao salvar no plugin DeviceAuth nativo, usando localStorage como fallback:", pluginErr);
        }
      }
      localStorage.setItem("DEVICE_KEY", data.token);

      toast.success("Este dispositivo agora é confiável e sincronizará notificações!");
      setIsOpen(false);
    } catch (err: any) {
      console.error("Erro capturado no handleTrustDevice:", err);
      toast.error(err.message || "Erro ao autorizar este aparelho.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    toast.warning("Sincronização móvel desativada para este dispositivo.");
    setIsOpen(false);
  };

  // Bloqueia a UI apenas se for necessário autorizar E o usuário estiver autenticado
  if (!isOpen || !isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3.5 bg-primary/10 text-primary rounded-full border border-primary/20 animate-bounce">
            <Smartphone className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Confiar neste aparelho?</h2>
            <p className="text-xs text-muted-foreground leading-relaxed px-2">
              Permitir que este dispositivo sincronize notificações financeiras de forma segura com a sua carteira do Vault Finance OS.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl border border-amber-500/20 text-[10px]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Isso ativará a captura automatizada do Inbox IA.</span>
          </div>

          <div className="flex w-full gap-3 pt-2">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              type="button"
              className="flex-1 py-3 text-sm font-semibold rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all duration-150 active:scale-95"
            >
              Depois
            </button>
            <button
              onClick={handleTrustDevice}
              disabled={isLoading}
              type="button"
              className="flex-1 py-3 text-sm font-semibold rounded-xl gradient-primary text-white shadow-glow transition-all duration-150 active:scale-95"
            >
              {isLoading ? "Autorizando..." : "Sim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
