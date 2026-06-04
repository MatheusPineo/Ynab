import React, { useState, useEffect } from 'react';
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { Shield, Trash2, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from "sonner";

interface Device {
  id: number;
  device_name: string;
  custom_name?: string | null;
  os_browser_info?: string | null;
  ip_address?: string | null;
  location_string?: string | null;
  token_key: string;
  last_used: string | null;
  last_used_at?: string | null;
  created_at: string;
  is_current_device?: boolean;
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
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
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
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
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

    const handleDeviceRegistered = () => {
      fetchDevices();
    };

    window.addEventListener("device-registered", handleDeviceRegistered);
    return () => {
      window.removeEventListener("device-registered", handleDeviceRegistered);
    };
  }, []);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Nunca usado';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Nunca usado';
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-6 text-neutral-100 shadow-2xl font-sans">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-800 text-orange-500 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white uppercase">Dispositivos Autorizados</h2>
            <p className="text-sm text-neutral-400">Gerencie os navegadores e aplicativos autorizados a acessar sua conta.</p>
          </div>
        </div>
        <button 
          onClick={fetchDevices} 
          disabled={isLoading}
          type="button"
          className="p-2 text-neutral-450 hover:text-white rounded-lg transition-all active:scale-95 hover:bg-neutral-800"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-400">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm">Carregando lista de dispositivos...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-800 rounded-lg">
          <Smartphone className="w-12 h-12 mx-auto text-neutral-700 mb-3" />
          <p className="text-neutral-400 font-semibold">Nenhum dispositivo ativo encontrado.</p>
          <p className="text-sm text-neutral-505 mt-1">Configure o app mobile para iniciar a sincronização automática.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {devices.map((device, index) => (
            <div 
              key={device.id} 
              className={`flex items-center justify-between py-6 ${
                index !== devices.length - 1 ? 'border-b border-neutral-800' : ''
              }`}
            >
              <div className="flex flex-col gap-1">
                {/* Main Title */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg text-neutral-100">
                    {device.os_browser_info || device.device_name}
                  </span>
                  {device.is_current_device && (
                    <span className="text-xs text-orange-500 font-bold uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded">
                      dispositivo atual
                    </span>
                  )}
                </div>

                {/* Subtitle (Indented) */}
                {device.custom_name && (
                  <div className="pl-4 text-neutral-300 text-sm font-medium">
                    {device.custom_name}
                  </div>
                )}

                {/* Metadata (Indented, lighter text) */}
                <div className="pl-4 mt-1.5 flex flex-col gap-1 text-xs text-neutral-400">
                  <div>
                    <span className="text-neutral-500">Localização:</span> {device.location_string || 'Desconhecida'}
                  </div>
                  <div>
                    <span className="text-neutral-500">Data de ativação:</span> {formatDate(device.created_at)}
                  </div>
                  <div>
                    <span className="text-neutral-500">Usado pela última vez:</span> {formatDate(device.last_used_at || device.last_used)}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleRevoke(device.id)}
                disabled={revokingId === device.id}
                type="button"
                className="text-orange-500 hover:text-orange-400 text-sm font-black tracking-widest uppercase py-2 px-4 transition-all hover:bg-neutral-800/50 rounded-lg active:scale-95 disabled:opacity-50"
              >
                Desativar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};