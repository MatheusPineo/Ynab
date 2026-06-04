import React, { useState } from "react";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { Key, Smartphone, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import { registerPlugin, Capacitor } from "@capacitor/core";
import { trackFormValidationFailure, trackHandledException } from "@/shared/lib/telemetry";

const DeviceAuth = registerPlugin<any>("DeviceAuth");

interface InboxMobileSyncActivationProps {
  onDeviceAdded?: (device: any) => void;
}

export const InboxMobileSyncActivation: React.FC<InboxMobileSyncActivationProps> = ({ onDeviceAdded }) => {
  const { accessToken } = useAuthStore();
  const [deviceName, setDeviceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) {
      const errorMessage = "Por favor, insira um nome descritivo para o dispositivo.";
      toast.error(errorMessage);
      trackFormValidationFailure("inbox_mobile_sync_form", "device_name", errorMessage);
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const response = await fetch(`${baseUrl}/devices/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          custom_name: deviceName.trim(),
          device_name: deviceName.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erro detalhado do backend no registro de dispositivo:", {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        
        let detailedError = "Erro ao registrar o dispositivo.";
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
      
      // Salva nas preferências do dispositivo nativo Android
      if (Capacitor.isNativePlatform()) {
        try {
          await DeviceAuth.storeDeviceKey({ token: data.token });
          localStorage.setItem("DEVICE_KEY", data.token);
        } catch (err) {
          console.error("Falha ao salvar token via plugin nativo:", err);
          trackHandledException(err, { stage: "capacitor_store_device_key", token_length: data.token?.length });
        }
      } else {
        localStorage.setItem("DEVICE_KEY", data.token);
      }
      
      toast.success("Dispositivo autorizado com sucesso!");
      setDeviceName("");
      if (onDeviceAdded) {
        onDeviceAdded(data);
      }
    } catch (error: any) {
      console.error("Erro capturado no handleRegister:", error);
      toast.error(error.message || "Erro ao registrar dispositivo.");
      trackHandledException(error, { deviceName: deviceName.trim() });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 text-slate-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-violet-600/20 text-violet-400 rounded-xl border border-violet-500/20">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Autorizar Novo Telemóvel</h3>
          <p className="text-xs text-slate-400">Gere uma chave de segurança para o seu app de sincronização.</p>
        </div>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="device-name-input" className="text-xs text-slate-400">Nome do Dispositivo</Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="device-name-input"
              placeholder="Ex: Meu Samsung S24"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="bg-slate-950/60 border-slate-800 text-slate-100 rounded-xl h-11"
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="gradient-primary h-11 px-6 rounded-xl font-bold shadow-glow text-white"
            >
              {isLoading ? "Autorizando..." : "Autorizar"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
