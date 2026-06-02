import React, { useState } from "react";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { Key, Smartphone, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import { registerPlugin, Capacitor } from "@capacitor/core";

const DeviceAuth = registerPlugin<any>("DeviceAuth");

export const InboxMobileSyncActivation: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [deviceName, setDeviceName] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) {
      toast.error("Por favor, insira um nome descritivo para o dispositivo.");
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
      const response = await fetch(`${baseUrl}/devices/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ device_name: deviceName.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erro detalhado do backend no registro de dispositivo:", {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        const detailedError = errorData.error || errorData.detail || JSON.stringify(errorData) || "Erro ao registrar o dispositivo.";
        throw new Error(detailedError);
      }

      const data = await response.json();
      setGeneratedToken(data.token);
      
      // Salva nas preferências do dispositivo nativo Android
      if (Capacitor.isNativePlatform()) {
        try {
          await DeviceAuth.storeDeviceKey({ token: data.token });
          localStorage.setItem("DEVICE_KEY", data.token);
        } catch (err) {
          console.error("Falha ao salvar token via plugin nativo:", err);
        }
      } else {
        localStorage.setItem("DEVICE_KEY", data.token);
      }
      
      toast.success("Dispositivo autorizado com sucesso!");
    } catch (error: any) {
      console.error("Erro capturado no handleRegister:", error);
      toast.error(error.message || "Erro ao registrar dispositivo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      toast.success("Token copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 text-slate-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-violet-600/20 text-violet-400 rounded-xl border border-violet-500/20">
          <Key className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Autorizar Novo Telemóvel</h3>
          <p className="text-xs text-slate-400">Gere uma chave de segurança para o seu app de sincronização.</p>
        </div>
      </div>

      {!generatedToken ? (
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
                {isLoading ? "Gerando..." : "Gerar Chave"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-400 space-y-1">
              <p className="font-bold">Atenção: Copie a chave agora!</p>
              <p>Por motivos de segurança, esta chave de acesso não será exibida novamente no painel.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Chave de Acesso (Token)</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={generatedToken}
                className="bg-slate-950/80 border-slate-800 text-emerald-400 font-mono text-sm rounded-xl h-11"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                className="h-11 px-4 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-100 rounded-xl gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copiado" : "Copiar"}</span>
              </Button>
            </div>
          </div>

          <Button
            onClick={() => {
              setGeneratedToken(null);
              setDeviceName("");
            }}
            variant="ghost"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Autorizar outro telemóvel
          </Button>
        </div>
      )}
    </div>
  );
};
