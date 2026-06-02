import { useState, useRef, useMemo } from "react";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { useSettingsStore } from "@/modules/auth/store/useSettingsStore";

import { formatMoney, getCurrencySymbol } from "@/shared/lib/currency-utils";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { TrustedDevicesManager } from "@/modules/finance/components/TrustedDevicesManager";
import { InboxMobileSyncActivation } from "@/modules/finance/components/InboxMobileSyncActivation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { 
  User, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Globe,
  LogOut,
  Check,
  ChevronsUpDown,
  Search,
  CreditCard,
  Star,
  Sparkles,
  Calendar,
  Download,
  ExternalLink,
  AlertTriangle,
  Laptop,
  Smartphone,
  BadgePercent,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  RefreshCw,
  Coins,
  ShieldAlert
} from "lucide-react";
import { SubscriptionPanel } from "@/modules/auth/components/SubscriptionPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/shared/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";

export interface ExtraTab {
  value: string;
  trigger: React.ReactNode;
  content: React.ReactNode;
  onTriggerClick?: () => void;
}

interface SettingsProps {
  extraTabs?: ExtraTab[];
}

const Settings = ({ extraTabs = [] }: SettingsProps) => {
  const { user, logout, accessToken } = useAuthStore();
  const { isPrivateMode, showDecimals, togglePrivateMode, toggleDecimals } = useSettingsStore();

  const { t, i18n } = useTranslation();

  // Preferências Regionais de Moeda (Mockadas no Boilerplate se não houver cotações ou lendo do Settings se necessário)
  // Como o Boilerplate precisa rodar de forma autônoma, definimos uma lista simples de moedas comuns e usamos o EUR/BRL/USD/GBP padrão.
  const rates = { "EUR": 1, "BRL": 6.1, "USD": 1.08, "GBP": 0.86 }; 
  const baseCurrency = user?.preferredCurrency || "EUR";
  const setBaseCurrency = (val: string) => {
    useAuthStore.setState((state) => ({
      user: state.user ? { ...state.user, preferredCurrency: val } : null
    }));
  };

  const [currencySearch, setCurrencySearch] = useState("");
  const [openCurrencyPopover, setOpenCurrencyPopover] = useState(false);

  const currencyKeys = useMemo(() => {
    return Object.keys(rates).sort();
  }, []);

  const currencyNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([i18n.language], { type: "currency" });
    } catch {
      return new Intl.DisplayNames(["pt-BR"], { type: "currency" });
    }
  }, [i18n.language]);

  const filteredCurrencies = useMemo(() => {
    const query = currencySearch.toLowerCase().trim();
    return currencyKeys.map(code => {
      let name = code;
      try {
        name = currencyNames.of(code) || code;
      } catch {}
      const symbol = getCurrencySymbol(code);
      return { code, name, symbol };
    }).filter(item => {
      return item.code.toLowerCase().includes(query) || item.name.toLowerCase().includes(query);
    });
  }, [currencyKeys, currencyNames, currencySearch]);

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "Organizando o futuro...");

  const [isBiometricEnabled, setIsBiometricEnabled] = useState(() => {
    return localStorage.getItem("vault_biometric_enabled") === "true";
  });

  const handleToggleBiometrics = () => {
    const newValue = !isBiometricEnabled;
    setIsBiometricEnabled(newValue);
    localStorage.setItem("vault_biometric_enabled", String(newValue));
    if (newValue) {
      toast.success("Desbloqueio por biometria ativado com sucesso!");
    } else {
      toast.info("Desbloqueio por biometria desativado.");
    }
  };

  // Estados e manipuladores de faturamento simulado movidos para o componente SubscriptionPanel modularizado.

  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // 2FA states
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFactorURI, setTwoFactorURI] = useState("");
  const [twoFactorVerifyCode, setTwoFactorVerifyCode] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
      const response = await fetch(`${baseUrl}/auth/profile/update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ name, bio, preferred_currency: baseCurrency })
      });

      if (!response.ok) throw new Error("Erro ao salvar perfil");

      useAuthStore.setState((state) => ({
        user: state.user ? { 
          ...state.user, 
          name: name,
          bio: bio,
          preferredCurrency: baseCurrency
        } : null
      }));

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Falha ao salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        useAuthStore.setState((state) => ({
          user: state.user ? { ...state.user, avatar: reader.result as string } : null
        }));
        toast.success("Foto atualizada localmente!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenPasswordModal = () => {
    if (!user?.has_password) {
      toast.error("Sua conta está vinculada ao Google. A senha deve ser gerenciada pelo painel do Google.");
      return;
    }
    setIsPasswordModalOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
      const response = await fetch(`${baseUrl}/auth/password/change/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          new_password: newPassword, 
          confirm_password: confirmPassword 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao alterar senha");

      toast.success("Senha alterada com sucesso!");
      setIsPasswordModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSetup2FA = async () => {
    setIsSettingUp2FA(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
      const response = await fetch(`${baseUrl}/auth/2fa/setup/`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setTwoFactorURI(data.provisioning_uri);
        setIs2FAModalOpen(true);
      } else {
        toast.error(data.error || "Erro ao iniciar 2FA");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorVerifyCode.length !== 6) return;
    setIsVerifying2FA(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
      const response = await fetch(`${baseUrl}/auth/2fa/verify/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ code: twoFactorVerifyCode })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Autenticação em duas etapas ativada!");
        useAuthStore.setState((state) => ({
          user: state.user ? { ...state.user, twoFactorEnabled: true } : null
        }));
        setIs2FAModalOpen(false);
        setTwoFactorVerifyCode("");
      } else {
        toast.error(data.error || "Código inválido");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("Tem certeza que deseja desativar o 2FA? Sua conta ficará menos protegida.")) return;
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
      const response = await fetch(`${baseUrl}/auth/2fa/disable/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      if (response.ok) {
        toast.success("2FA desativado.");
        useAuthStore.setState((state) => ({
          user: state.user ? { ...state.user, twoFactorEnabled: false } : null
        }));
      }
    } catch (error) {
      toast.error("Erro de conexão");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const handleEnableDemo = async () => {
    if (!confirm("Isso apagará todos os seus dados atuais e carregará dados fictícios. Deseja continuar?")) return;
    setIsDemoLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
      const res = await fetch(`${baseUrl}/onboarding/demo-mode/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      if (res.ok) {
        toast.success("Modo de demonstração ativado! Recarregando dados...");
        setTimeout(() => window.location.href = "/", 1500);
      } else {
        toast.error("Erro ao ativar modo demo.");
      }
    } catch (e) {
      toast.error("Erro de conexão.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm("ATENÇÃO: Isso apagará TODOS OS SEUS DADOS de forma permanente e irreversível. Tem certeza absoluta?")) return;
    setIsDemoLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
      const res = await fetch(`${baseUrl}/onboarding/reset/`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      if (res.ok) {
        toast.success("Todos os dados foram resetados. Começando do zero!");
        setTimeout(() => window.location.href = "/", 1500);
      } else {
        toast.error("Erro ao resetar dados.");
      }
    } catch (e) {
      toast.error("Erro de conexão.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-500">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex flex-row items-center gap-3">
            <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas preferências de conta, segurança e sincronização de dados.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout} 
          className="h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm rounded-xl font-semibold sm:font-bold border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:border-rose-500/30 gap-1.5 self-start sm:self-center shadow-sm"
        >
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Encerrar Sessão
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-muted/20 border border-border/60 p-1 mb-6 sm:mb-8 rounded-xl flex-nowrap w-max sm:w-full min-w-full">
            <TabsTrigger value="profile" className="gap-1.5 rounded-lg data-[state=active]:bg-background text-xs sm:text-sm">
              <User className="h-4 w-4 shrink-0" />
              <span>Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 rounded-lg data-[state=active]:bg-background text-xs sm:text-sm">
              <Globe className="h-4 w-4 shrink-0" />
              <span>Preferências</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-1.5 rounded-lg data-[state=active]:bg-background text-xs sm:text-sm">
              <Smartphone className="h-4 w-4 shrink-0" />
              <span>Dispositivos</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-1.5 rounded-lg data-[state=active]:bg-background text-xs sm:text-sm">
              <CreditCard className="h-4 w-4 shrink-0" />
              <span>Assinatura</span>
            </TabsTrigger>
            <TabsTrigger value="demo" className="gap-1.5 rounded-lg data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-500 text-xs sm:text-sm">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Modo Demo & Reset</span>
            </TabsTrigger>
            {extraTabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="gap-1.5 rounded-lg data-[state=active]:bg-background text-xs sm:text-sm"
                onClick={tab.onTriggerClick}
              >
                {tab.trigger}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/10 pb-8 pt-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-2xl gradient-primary text-white font-bold">
                    {user?.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left space-y-1">
                  <CardTitle className="text-2xl font-bold">{user?.name}</CardTitle>
                  <CardDescription className="text-base">{user?.email}</CardDescription>
                  <div className="mt-2">
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/10 hover:bg-primary/20">
                      Plano Premium
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handlePhotoClick}
                  className="sm:ml-auto rounded-xl h-10 border-border/60"
                >
                  Alterar Foto
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSave} className="grid gap-6 max-w-2xl">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="bg-background/50 rounded-xl" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de Acesso</Label>
                    <Input id="email" readOnly defaultValue={user?.email} className="bg-background/50 rounded-xl opacity-70 cursor-not-allowed" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / Nota Pessoal</Label>
                  <Input 
                    id="bio" 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Organizando o futuro..." 
                    className="bg-background/50 rounded-xl" 
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="gradient-primary px-8 rounded-xl font-bold shadow-glow"
                  >
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                Segurança da Conta
              </CardTitle>
              <CardDescription>Gerencie sua senha e métodos de autenticação.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex flex-col gap-4">
               <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/40">
                  <div className="space-y-1">
                     <p className="text-sm font-bold">Senha</p>
                     <p className="text-xs text-muted-foreground">
                       {user?.has_password ? "Última alteração há 3 meses" : "Conectado via Google (sem senha manual)"}
                     </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={handleOpenPasswordModal}
                    className="text-primary font-bold hover:bg-primary/10 rounded-xl px-4 h-9"
                  >
                    Alterar
                  </Button>
               </div>
               <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/40">
                  <div className="space-y-1">
                     <p className="text-sm font-bold">Autenticação em Duas Etapas (2FA)</p>
                     <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</p>
                  </div>
                  <Button 
                    variant={user?.twoFactorEnabled ? "destructive" : "outline"}
                    onClick={user?.twoFactorEnabled ? handleDisable2FA : handleSetup2FA}
                    disabled={isSettingUp2FA}
                    className="rounded-xl px-4 h-9"
                  >
                    {isSettingUp2FA ? "Carregando..." : user?.twoFactorEnabled ? "Desativar" : "Ativar"}
                  </Button>
               </div>
               <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/40">
                  <div className="space-y-1">
                     <p className="text-sm font-bold">Desbloqueio por Biometria</p>
                     <p className="text-xs text-muted-foreground">Use a digital ou reconhecimento facial do aparelho para acessar o app</p>
                  </div>
                  <Button 
                    variant={isBiometricEnabled ? "destructive" : "outline"}
                    onClick={handleToggleBiometrics}
                    className="rounded-xl px-4 h-9 font-bold"
                  >
                    {isBiometricEnabled ? "Desativar" : "Ativar"}
                  </Button>
               </div>
            </CardContent>
          </Card>

          {/* Modal de Configuração de 2FA */}
          <Dialog open={is2FAModalOpen} onOpenChange={setIs2FAModalOpen}>
            <DialogContent className="rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Configurar 2FA</DialogTitle>
                <DialogDescription>
                  Escaneie o código QR abaixo com seu aplicativo autenticador (Google Authenticator, Authy, etc).
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col items-center gap-6 py-6">
                <div className="p-4 bg-white rounded-2xl shadow-xl">
                  {twoFactorURI && (
                    <QRCodeSVG 
                      value={twoFactorURI} 
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                  )}
                </div>
                
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="2fa-code" className="text-center block">Código de Verificação</Label>
                    <Input 
                      id="2fa-code"
                      placeholder="000000"
                      value={twoFactorVerifyCode}
                      onChange={(e) => setTwoFactorVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-2xl tracking-[0.5em] font-mono h-14 bg-background/50 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setIs2FAModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleVerify2FA}
                  disabled={isVerifying2FA || twoFactorVerifyCode.length !== 6}
                  className="gradient-primary px-6 rounded-xl font-bold shadow-glow"
                >
                  {isVerifying2FA ? "Verificando..." : "Ativar 2FA"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Alteração de Senha */}
          <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
            <DialogContent className="rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Alterar Senha</DialogTitle>
                <DialogDescription>
                  Crie uma nova senha forte para proteger sua conta do Vault.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleChangePassword} className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="bg-background/50 rounded-xl h-11" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="bg-background/50 rounded-xl h-11" 
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4 gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isChangingPassword}
                    className="gradient-primary px-6 rounded-xl font-bold shadow-glow"
                  >
                    {isChangingPassword ? "Alterando..." : "Confirmar Alteração"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="appearance" className="space-y-6">
           <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" /> {t("settings.regional_preferences")}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t("nav_descriptions.settings")}</p>
                </div>

                <div className="grid gap-6 max-w-md">
                   <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("settings.system_language")}</Label>
                      <Select 
                        value={i18n.language} 
                        onValueChange={async (val) => {
                          i18n.changeLanguage(val);
                          localStorage.setItem("vault_lang_explicit", "true");
                          try {
                            const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
                            const response = await fetch(`${baseUrl}/auth/profile/update/`, {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                "Authorization": "Bearer " + accessToken
                              },
                              body: JSON.stringify({ language: val })
                            });
                            if (response.ok) {
                              useAuthStore.setState((state) => ({
                                user: state.user ? { ...state.user, language: val } : null
                              }));
                            }
                          } catch (err) {
                            console.error("Erro ao sincronizar idioma no banco:", err);
                          }
                        }}
                      >
                        <SelectTrigger className="bg-background/50 border-border/60 rounded-xl h-11">
                          <SelectValue placeholder={t("settings.select_language")} />
                        </SelectTrigger>
                        <SelectContent className="glass border-border/60">
                          <SelectItem value="pt-BR">Português</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="it">Italiano</SelectItem>
                          <SelectItem value="nl">Nederlands</SelectItem>
                          <SelectItem value="pl">Polski</SelectItem>
                          <SelectItem value="zh">简体中文</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="ja">日本語</SelectItem>
                          <SelectItem value="hi">हिन्दी</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                    <div className="space-y-3 relative">
                       <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("settings.main_currency")}</Label>
                       <Popover open={openCurrencyPopover} onOpenChange={setOpenCurrencyPopover}>
                         <PopoverTrigger asChild>
                           <Button
                             variant="outline"
                             role="combobox"
                             aria-expanded={openCurrencyPopover}
                             className="w-full bg-background/50 border-border/60 rounded-xl h-11 justify-between text-left font-normal hover:bg-background/80"
                           >
                             <span className="truncate flex items-center gap-2">
                               <span className="font-bold text-primary shrink-0 min-w-[28px]">{getCurrencySymbol(baseCurrency)}</span>
                               <span className="text-muted-foreground shrink-0">{baseCurrency}</span>
                               <span className="truncate text-foreground">— {currencyNames.of(baseCurrency) || baseCurrency}</span>
                             </span>
                             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent className="glass border-border/60 p-0 w-[350px] rounded-2xl overflow-hidden shadow-glow" align="start">
                           <div className="flex items-center border-b border-border/40 px-3 bg-muted/20">
                             <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
                             <input
                               type="text"
                               className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                               placeholder={t("settings.select_currency")}
                               value={currencySearch}
                               onChange={(e) => setCurrencySearch(e.target.value)}
                             />
                           </div>
                           <div className="max-h-[280px] overflow-y-auto scrollbar-thin p-1 space-y-0.5">
                             {filteredCurrencies.length === 0 ? (
                               <p className="text-xs text-center py-6 text-muted-foreground">Nenhuma moeda encontrada.</p>
                             ) : (
                               filteredCurrencies.map((item) => (
                                 <button
                                   key={item.code}
                                   type="button"
                                   onClick={() => {
                                     setBaseCurrency(item.code);
                                     setOpenCurrencyPopover(false);
                                     setCurrencySearch("");
                                     toast.success(`Moeda de exibição alterada para ${item.code}!`);
                                   }}
                                   className={cn(
                                     "flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                                     baseCurrency === item.code 
                                       ? "bg-primary/20 text-foreground font-bold" 
                                       : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                                   )}
                                 >
                                   <span className="flex items-center gap-2.5 min-w-0 flex-1">
                                     <span className="font-bold text-primary shrink-0 w-8 text-center bg-background/40 rounded-md py-0.5 border border-border/30">{item.symbol}</span>
                                     <span className="font-semibold text-foreground shrink-0">{item.code}</span>
                                     <span className="truncate text-xs opacity-80">— {item.name}</span>
                                   </span>
                                   {baseCurrency === item.code && (
                                     <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                                   )}
                                 </button>
                               ))
                             )}
                           </div>
                         </PopoverContent>
                       </Popover>
                    </div>

                    <div className="space-y-3">
                       <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("settings.value_display")}</Label>
                       <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
                          <div className="space-y-1">
                            <p className="text-sm font-bold">{t("settings.show_cents")}</p>
                            <p className="text-xs text-muted-foreground">{t("settings.show_cents_desc")}</p>
                          </div>
                          <Button 
                            variant={showDecimals ? "outline" : "destructive"}
                            onClick={toggleDecimals}
                            className="rounded-xl px-4 h-9 font-bold"
                          >
                            {showDecimals ? t("settings.cents_active") : t("settings.cents_inactive")}
                          </Button>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("settings.panel_privacy")}</Label>
                       <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
                          <div className="space-y-1">
                            <p className="text-sm font-bold">{t("settings.hide_balances")}</p>
                            <p className="text-xs text-muted-foreground">{t("settings.hide_balances_desc")}</p>
                          </div>
                          <Button 
                            variant={isPrivateMode ? "destructive" : "outline"}
                            onClick={togglePrivateMode}
                            className="rounded-xl px-4 h-9 font-bold animate-pulse-subtle"
                          >
                            {isPrivateMode ? t("settings.balances_hidden") : t("settings.balances_visible")}
                          </Button>
                       </div>
                    </div>
                </div>
              </div>
           </Card>
        </TabsContent>


        {extraTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-6">
            {tab.content}
          </TabsContent>
         ))}

          {/* Subscription Tab (Gerenciamento de Assinaturas e Planos) */}
          <TabsContent value="subscription" className="space-y-6 animate-in fade-in duration-300">
            <SubscriptionPanel />
          </TabsContent>
          {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
           <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" /> Sincronização Mobile
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Faça a gestão dos telemóveis autorizados a intercetar notificações e enviar dados para a Inbox IA.
                  </p>
                </div>

                <div className="grid gap-6">
                  {/* O botão que pede permissão e gera o token */}
                  <InboxMobileSyncActivation />
                  
                  {/* A tabela que mostra os telemóveis autorizados */}
                  <TrustedDevicesManager />
                </div>
              </div>
           </Card>
        </TabsContent>

        
          {/* Demo & Reset Tab */}
          <TabsContent value="demo" className="space-y-6 animate-in fade-in duration-300">
            <Card className="rounded-3xl border-rose-500/20 bg-card/40 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-rose-500/5 border-b border-rose-500/10">
                <CardTitle className="text-xl flex items-center gap-2 font-bold text-rose-500">
                  <ShieldAlert className="h-6 w-6" />
                  Área de Testes e Reset (Danger Zone)
                </CardTitle>
                <CardDescription>
                  Ações destrutivas e recursos de demonstração do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/40 gap-4">
                  <div className="space-y-1">
                    <p className="text-base font-bold flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-emerald-500" />
                      Testar com Dados Fictícios
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Povoa sua conta com transações falsas, bancos e investimentos para que você possa entender como a plataforma funciona na prática. <strong className="text-foreground">Isso apagará seus dados atuais.</strong>
                    </p>
                  </div>
                  <Button 
                    onClick={handleEnableDemo}
                    disabled={isDemoLoading}
                    className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-glow"
                  >
                    {isDemoLoading ? "Carregando..." : "Ativar Modo Demo"}
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 gap-4">
                  <div className="space-y-1">
                    <p className="text-base font-bold text-rose-500 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Limpar e Começar Meu Orçamento Real
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Apaga de forma irreversível todas as suas contas, transações e dívidas. O sistema retornará às categorias limpas padrão do YNAB.
                    </p>
                  </div>
                  <Button 
                    variant="destructive"
                    onClick={handleResetData}
                    disabled={isDemoLoading}
                    className="shrink-0 rounded-xl"
                  >
                    {isDemoLoading ? "Apagando..." : "Resetar Minha Conta"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>

      <div className="h-10" />
    </div>
  );
};

export default Settings;
