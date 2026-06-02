import React, { useState, useEffect } from 'react';
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { Shield, Trash2, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from "sonner";

interface Device {
  id: number;
  device_name: string;
  token_key: string;
  last_used: string | null;
  created_at: string;
}

export const TrustedDevicesManager: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const fetchDevices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
      const response = await fetch(`${baseUrl}/devices/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Falha ao buscar dispositivos autorizados.');
      const data = await response.json();
      setDevices(data);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Deseja realmente revogar o acesso deste dispositivo? Ele perderá a capacidade de sincronização imediatamente.')) {
      return;
    }
    
    setRevokingId(id);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
      const response = await fetch(`${baseUrl}/devices/${id}/revoke/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Não foi possível revogar o acesso.');
      
      setDevices(prev => prev.filter(device => device.id !== id));
      toast.success("Acesso do dispositivo revogado com sucesso.");
    } catch (err: any) {
      toast.error(err.message || 'Erro ao revogar o dispositivo.');
    } finally {
      setRevokingId(null);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 text-slate-100 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-600/20 text-violet-400 rounded-xl border border-violet-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Dispositivos Confiáveis</h2>
            <p className="text-xs text-slate-400">Tokens de longa duração ativos para sincronização em background.</p>
          </div>
        </div>
        <button 
          onClick={fetchDevices} 
          disabled={isLoading}
          type="button"
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-850 rounded-lg transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-950/40 border border-red-800/40 rounded-xl text-red-300 text-xs">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Carregando lista de dispositivos...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
          <Smartphone className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">Nenhum dispositivo ativo encontrado.</p>
          <p className="text-xs text-slate-500 mt-1">Configure o app mobile para iniciar a sincronização automática.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {devices.map(device => (
            <div 
              key={device.id} 
              className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-850 rounded-lg text-slate-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{device.device_name}</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-850 text-slate-400 rounded-full border border-slate-800">
                      ID: {device.token_key}***
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-4 text-xs text-slate-500 mt-1">
                    <span>Registrado em: {new Date(device.created_at).toLocaleDateString('pt-BR')}</span>
                    <span>Último uso: {device.last_used ? new Date(device.last_used).toLocaleString('pt-BR') : 'Nunca sincronizado'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRevoke(device.id)}
                disabled={revokingId === device.id}
                type="button"
                className="flex items-center gap-2 px-3 py-2 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-900/30 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Revogar Acesso</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};