import { useState, useRef, useMemo } from "react";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { useSettingsStore } from "@/modules/auth/store/useSettingsStore";
import { useFeatureStore, EnabledFeatures } from "@/shared/store/useFeatureStore";
import { formatMoney, getCurrencySymbol } from "@/shared/lib/currency-utils";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
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
  const { features, toggleFeature } = useFeatureStore();
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

  // Estados interativos de gerenciamento de assinatura
  const [simulatedTier, setSimulatedTier] = useState<"free" | "pro">(() => {
    return (localStorage.getItem("vault_simulated_tier") as "free" | "pro") || "pro";
  });
  const [simulatedPlatform, setSimulatedPlatform] = useState<"stripe" | "apple" | "google">(() => {
    return (localStorage.getItem("vault_simulated_platform") as "stripe" | "apple" | "google") || "stripe";
  });
  const [simulatedInterval, setSimulatedInterval] = useState<"monthly" | "yearly">(() => {
    return (localStorage.getItem("vault_simulated_interval") as "monthly" | "yearly") || "monthly";
  });
  const [couponCode, setCouponCode] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0); // em porcentagem
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState<Record<string, boolean>>({});

  const handleUpdateTier = (newTier: "free" | "pro") => {
    setSimulatedTier(newTier);
    localStorage.setItem("vault_simulated_tier", newTier);
    toast.success(`Plano simulado alterado para: ${newTier === "pro" ? "PRO / PREMIUM 🌟" : "GRÁTIS 💸"}`);
  };

  const handleUpdatePlatform = (newPlatform: "stripe" | "apple" | "google") => {
    setSimulatedPlatform(newPlatform);
    localStorage.setItem("vault_simulated_platform", newPlatform);
    toast.success(`Plano de faturamento alterado para: ${
      newPlatform === "stripe" ? "Stripe (Web) 💳" : newPlatform === "apple" ? "Apple App Store 🍏" : "Google Play Store 🤖"
    }`);
  };

  const handleUpdateInterval = (newInterval: "monthly" | "yearly") => {
    setSimulatedInterval(newInterval);
    localStorage.setItem("vault_simulated_interval", newInterval);
    toast.success(`Ciclo de cobrança alterado para: ${newInterval === "monthly" ? "Mensal 📆" : "Anual 🗓️"}`);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCoupon = couponCode.trim().toUpperCase();
    if (cleanCoupon === "VAULTENGINEER") {
      setIsCouponApplied(true);
      setAppliedDiscount(100);
      toast.success("Cupom 'VAULTENGINEER' aplicado! Desconto de 100% concedido. Acesso Pro Grátis!");
    } else if (cleanCoupon === "FIRSTPRO") {
      setIsCouponApplied(true);
      setAppliedDiscount(30);
      toast.success("Cupom 'FIRSTPRO' aplicado! Desconto de 30% concedido na primeira fatura.");
    } else if (cleanCoupon === "") {
      toast.error("Por favor, digite um cupom.");
    } else {
      toast.error("Cupom inválido ou expirado!");
    }
  };

  const handleCancelSubscriptionSimulated = () => {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura Pro? Você perderá o acesso ilimitado aos recursos premium.")) return;
    setIsCancellingSubscription(true);
    setTimeout(() => {
      setIsCancellingSubscription(false);
      setSimulatedTier("free");
      localStorage.setItem("vault_simulated_tier", "free");
      toast.success("Assinatura cancelada com sucesso. Você foi migrado para o plano Free.");
    }, 1200);
  };

  const handleUpgradeSimulated = () => {
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmUpgrade = () => {
    setIsCheckoutModalOpen(false);
    setSimulatedTier("pro");
    localStorage.setItem("vault_simulated_tier", "pro");
    toast.success("Upgrade realizado com sucesso! Bem-vindo ao Vault Finance Pro! 🎉");
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Iniciando download do recibo ${invoiceId}...`);
    const invoicePrice = simulatedInterval === "monthly" ? "29,90" : "299,00";
    const discountVal = isCouponApplied ? (parseFloat(invoicePrice) * (appliedDiscount / 100)).toFixed(2) : "0,00";
    const finalVal = isCouponApplied ? (parseFloat(invoicePrice) * (1 - appliedDiscount / 100)).toFixed(2) : invoicePrice;
    
    const data = `==================================================\n             VAULT FINANCE OS RECIBO             \n==================================================\nFatura: ${invoiceId}\nData: 12/05/2026\nCliente: ${user?.name || "Matheus Pineo"}\nE-mail: ${user?.email || "matheus@vaultfinance.os"}\n--------------------------------------------------\nPlano: VAULT FINANCE PRO (${simulatedInterval === "monthly" ? "Mensal" : "Anual"})\nPlataforma: ${simulatedPlatform.toUpperCase()}\n--------------------------------------------------\nValor Original: R$ ${invoicePrice}\nDesconto Aplicado: R$ ${discountVal} (${appliedDiscount}%)\nVALOR TOTAL PAGO: R$ ${finalVal}\nStatus do Pagamento: CONFIRMADO / PAGO\n--------------------------------------------------\nObrigado por apoiar a engenharia independente do\nVault Finance OS!\n==================================================`;
    
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Recibo_Vault_${invoiceId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleFaq = (id: string) => {
    setIsFaqOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
            <TabsTrigger value="features" className="gap-1.5 rounded-lg data-[state=active]:bg-background text-xs sm:text-sm">
              <SettingsIcon className="h-4 w-4 shrink-0" />
              <span>Módulos</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-1.5 rounded-lg data-[state=active]:bg-background text-xs sm:text-sm">
              <CreditCard className="h-4 w-4 shrink-0" />
              <span>Assinatura</span>
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
         {/* Features Tab */}
         <TabsContent value="features" className="space-y-6 animate-in fade-in duration-300">
            <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm p-8">
               <div className="space-y-6">
                 <div className="space-y-2">
                   <h3 className="font-bold text-lg flex items-center gap-2">
                     <SettingsIcon className="h-5 w-5 text-primary animate-pulse-subtle" /> Módulos Ativos do Sistema
                   </h3>
                   <p className="text-sm text-muted-foreground">
                     Ative ou remova funções e páginas inteiras do seu painel de controle de forma 100% dinâmica. As seções desativadas serão instantaneamente removidas da barra lateral e do menu móvel de celular, dando total controle do seu sistema.
                   </p>
                 </div>

                 <div className="grid gap-4 max-w-2xl">
                   {Object.keys(features).map((featureKey) => {
                     const key = featureKey as keyof EnabledFeatures;
                     const isEnabled = features[key];
                     
                     // Fornece títulos legíveis e amigáveis em português
                     const featureNames: Record<keyof EnabledFeatures, string> = {
                       dashboard: "Visão Geral (Dashboard)",
                       accounts: "Árvore de Contas",
                       transactions: "Extrato de Transações",
                       budget: "Orçamento Base-Zero",
                       debts: "Controle de Dívidas",
                       goals: "Metas Financeiras",
                       insights: "Insights Inteligentes",
                       rule503020: "Regra 50-30-20",
                     };

                     const featureDescriptions: Record<keyof EnabledFeatures, string> = {
                       dashboard: "Painel principal com Net Worth consolidado, gráficos de despesas, distribuição de saldos e atividades recentes.",
                       accounts: "Visualização hierárquica e controle de contas mestre, subcontas, saldos e transferência de valores.",
                       transactions: "Lançamento de receitas, despesas, transferências e histórico completo de movimentações com busca avançada.",
                       budget: "Alocação inteligente e controle de categorias por envelopes base-zero para o mês e ano correspondentes.",
                       debts: "Gerenciamento de devedores, credores, acréscimos e abatimento de empréstimos com histórico de auditoria.",
                       goals: "Criação de objetivos de poupança inteligente e acompanhamento percentual com prazos e emojis customizáveis.",
                       insights: "Relatórios de desempenho e analítica avançada sobre o comportamento e distribuição de seus recursos.",
                     };

                     const label = featureNames[key] || key;
                     const description = featureDescriptions[key] || "";
                     
                     return (
                       <div 
                         key={key} 
                         className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-all duration-300"
                       >
                         <div className="space-y-1">
                           <p className="text-sm font-bold text-foreground">
                             {label}
                           </p>
                           <p className="text-xs text-muted-foreground leading-relaxed pr-2">
                             {description}
                           </p>
                         </div>
                         <Button 
                           variant={isEnabled ? "outline" : "destructive"}
                           type="button"
                           onClick={() => {
                             toggleFeature(key);
                             toast.success(`Módulo "${label}" ${isEnabled ? "desativado" : "ativado"}!`);
                           }}
                           className={cn(
                             "rounded-xl px-5 h-10 font-bold shrink-0 shadow-sm transition-all text-xs border border-border/50",
                             isEnabled 
                               ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                               : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                           )}
                         >
                           {isEnabled ? "✓ Habilitado" : "✗ Desabilitado"}
                         </Button>
                       </div>
                     );
                   })}
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
            {/* Playground de Simulação (Nudge Educativo e Playground de Testes de Faturamento) */}
            <div className="p-5 border border-amber-500/20 bg-amber-500/5 rounded-2xl space-y-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200">Playground de Faturamento (Simulador Ativo)</h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                    Este ecossistema utiliza Stripe (Web), Apple Store (iOS) e Google Play (Android). Para auxiliar os testes de design em tempo real, use os seletores abaixo para simular diferentes cenários de faturamento e ver a tela se adaptar instantaneamente!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Seletor de Plano */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">1. Nível do Plano</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateTier("free")}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold transition-all ${
                        simulatedTier === "free"
                          ? "bg-amber-500/10 border-amber-500/35 text-amber-400"
                          : "bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800"
                      }`}
                    >
                      Grátis (Free)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateTier("pro")}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold transition-all ${
                        simulatedTier === "pro"
                          ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400"
                          : "bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800"
                      }`}
                    >
                      🌟 Pro (Premium)
                    </button>
                  </div>
                </div>

                {/* Seletor de Plataforma */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">2. Plataforma Ativa</span>
                  <div className="flex gap-1">
                    {[
                      { id: "stripe", label: "Stripe Web" },
                      { id: "apple", label: "Apple IAP" },
                      { id: "google", label: "Google Play" }
                    ].map((plat) => (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => handleUpdatePlatform(plat.id as any)}
                        className={`flex-1 py-1.5 px-1.5 rounded-lg border text-[9px] font-bold transition-all truncate ${
                          simulatedPlatform === plat.id
                            ? "bg-primary/20 border-primary/30 text-primary"
                            : "bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800"
                        }`}
                        title={plat.label}
                      >
                        {plat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seletor de Ciclo */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">3. Intervalo de Cobrança</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateInterval("monthly")}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold transition-all ${
                        simulatedInterval === "monthly"
                          ? "bg-blue-500/10 border-blue-500/35 text-blue-400"
                          : "bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800"
                      }`}
                    >
                      Mensal (Mês)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateInterval("yearly")}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold transition-all ${
                        simulatedInterval === "yearly"
                          ? "bg-purple-500/10 border-purple-500/35 text-purple-400"
                          : "bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800"
                      }`}
                    >
                      Anual (Ano)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* CARD DE PREÇOS / PLANO ATUAL (Esquerda: 7 colunas) */}
              <div className="lg:col-span-7 space-y-6">
                
                {simulatedTier === "pro" ? (
                  /* CARD DE ASSINATURA PRO ATIVA */
                  <div className="relative border border-emerald-500/25 bg-slate-950/40 p-6 sm:p-8 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.04)] group backdrop-blur-md">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/8 transition-colors duration-500" />
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 flex items-center gap-1.5">
                            Vault Finance Pro
                          </h3>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-0.5 px-2 animate-pulse-subtle text-[10px] font-mono uppercase">
                            Ativo
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-xs">Acesso ilimitado e telemetria avançada de finanças ativa.</p>
                      </div>

                      <div className="py-1 px-3.5 rounded-full bg-slate-900 border border-slate-850 text-slate-300 text-xs font-mono font-bold shrink-0">
                        {simulatedInterval === "monthly" ? "Mensal" : "Anual"}
                      </div>
                    </div>

                    <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-900">
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Preço de Assinatura</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-3xl font-black text-slate-100">
                            {isCouponApplied && appliedDiscount === 100 ? "R$ 0,00" : simulatedInterval === "monthly" ? "R$ 29,90" : "R$ 299,00"}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            /{simulatedInterval === "monthly" ? "mês" : "ano"}
                          </span>
                        </div>
                        {isCouponApplied && (
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/5 py-0.5 px-2 border border-emerald-500/10 rounded font-mono block w-max">
                            Cupom com {appliedDiscount}% de desconto aplicado!
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Próxima Cobrança</span>
                        <div className="flex items-center gap-2 text-slate-200">
                          <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="text-xs sm:text-sm font-bold font-mono">
                            {simulatedInterval === "monthly" ? "12 de Junho, 2026" : "12 de Maio, 2027"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">Renovação automática no cartão cadastrado.</p>
                      </div>
                    </div>

                    <div className="pt-6 space-y-4">
                      {/* Detalhes de Plataforma */}
                      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-2.5">
                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Método de Faturamento Vinculado</span>
                        
                        {simulatedPlatform === "stripe" && (
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                                <CreditCard className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-200">Faturamento Web via Stripe</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Mastercard final **** 4242</p>
                              </div>
                            </div>
                            <a
                              href="https://billing.stripe.com/"
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1.5 active:scale-[0.98]"
                            >
                              <span>Gerenciar no Stripe</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {simulatedPlatform === "apple" && (
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-slate-100/10 border border-slate-200/20 text-slate-100 rounded-xl">
                                <Laptop className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-200">Faturamento iOS via Apple Store</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">matheus***@icloud.com</p>
                              </div>
                            </div>
                            <a
                              href="https://apps.apple.com/account/subscriptions"
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1.5 active:scale-[0.98]"
                            >
                              <span>Gerenciar Apple ID</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {simulatedPlatform === "google" && (
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                                <Smartphone className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-200">Faturamento Android via Google Play</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">matheus***@gmail.com</p>
                              </div>
                            </div>
                            <a
                              href="https://play.google.com/store/account/subscriptions"
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1.5 active:scale-[0.98]"
                            >
                              <span>Gerenciar Google Play</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Cancel button */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleCancelSubscriptionSimulated}
                          disabled={isCancellingSubscription}
                          className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 rounded-xl text-xs font-semibold transition-all text-center"
                        >
                          {isCancellingSubscription ? "Cancelando..." : "Cancelar Assinatura"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CARD DE ASSINATURA FREE */
                  <div className="border border-slate-800 bg-slate-950/20 p-6 sm:p-8 rounded-3xl overflow-hidden shadow-soft space-y-6 relative">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-200">Plano Vault Finance Free</h3>
                        <Badge className="bg-slate-800 text-slate-400 border-slate-750 py-0.5 px-2 text-[10px] font-mono">Grátis</Badge>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        Você está aproveitando as funções básicas gratuitas do sistema. Faça o upgrade agora para desbloquear o poder total do Vault Finance OS.
                      </p>
                    </div>

                    {/* Nudge of limitations */}
                    <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl space-y-4">
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Uso de Recursos Atuais</span>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                            <span>Árvore de Contas e Subcontas</span>
                            <span>3 de 5 utilizadas</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: "60%" }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                            <span>Categorias de Envelopes Base-Zero</span>
                            <span>8 de 12 utilizadas</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: "66%" }} />
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                        ⚠️ O limite do plano grátis impede a criação de novas contas mestre ou subcontas. Assine o Pro para obter recursos **ilimitados**.
                      </p>
                    </div>

                    {/* Upgrade button */}
                    <button
                      type="button"
                      onClick={handleUpgradeSimulated}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-all text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:shadow-[0_0_35px_rgba(16,185,129,0.35)] active:scale-[0.98] animate-pulse-subtle"
                    >
                      <Sparkles className="h-4.5 w-4.5 fill-zinc-950" />
                      <span>Fazer Upgrade para o Pro (R$ 29,90/mês)</span>
                    </button>
                  </div>
                )}

                {/* HISTÓRICO DE EXTRATOS DE ASSINATURA */}
                <div className="border border-slate-900 bg-slate-950/10 p-5 sm:p-6 rounded-3xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider font-mono">
                    <Coins className="h-4 w-4 text-emerald-400" />
                    Histórico de Extratos e Faturas
                  </h3>

                  {simulatedTier === "pro" ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase">
                            <th className="pb-3 font-semibold">Fatura ID</th>
                            <th className="pb-3 font-semibold">Data</th>
                            <th className="pb-3 font-semibold">Método</th>
                            <th className="pb-3 font-semibold text-right">Valor</th>
                            <th className="pb-3 font-semibold text-center">Status</th>
                            <th className="pb-3 font-semibold text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/50 text-slate-300">
                          {[
                            { id: "INV-2026-003", date: "12/05/2026" },
                            { id: "INV-2026-002", date: "12/04/2026" },
                            { id: "INV-2026-001", date: "12/03/2026" }
                          ].map((inv, idx) => {
                            // Se cupom 100% estiver ativo, as faturas mais recentes simulam R$ 0,00!
                            const isFirstInv = idx === 0;
                            const displayPrice = isFirstInv && isCouponApplied && appliedDiscount === 100 
                              ? "R$ 0,00" 
                              : isFirstInv && isCouponApplied && appliedDiscount === 30
                                ? simulatedInterval === "monthly" ? "R$ 20,93" : "R$ 209,30"
                                : simulatedInterval === "monthly" ? "R$ 29,90" : "R$ 299,00";
                            
                            return (
                              <tr key={inv.id} className="hover:bg-slate-900/20">
                                <td className="py-3 font-semibold text-slate-400">{inv.id}</td>
                                <td className="py-3 text-slate-400">{inv.date}</td>
                                <td className="py-3">
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 font-mono uppercase">
                                    {simulatedPlatform}
                                  </span>
                                </td>
                                <td className="py-3 text-right font-bold text-slate-200">{displayPrice}</td>
                                <td className="py-3 text-center">
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <span className="h-1 w-1 rounded-full bg-emerald-500" /> Pago
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadInvoice(inv.id)}
                                    className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:text-emerald-400 rounded-lg text-slate-400 transition-all inline-flex items-center justify-center"
                                    title="Baixar Nota Fiscal (PDF)"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-slate-900 rounded-2xl text-slate-600 text-xs">
                      Não há faturas ou histórico de extratos para contas sob o plano Grátis.
                    </div>
                  )}
                </div>
              </div>

              {/* COMPARATIVOS DE PLANO E CUPONS (Direita: 5 colunas) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* APLICADOR DE CUPOM REATIVO */}
                <div className="border border-slate-900 bg-slate-950/15 p-5 rounded-3xl space-y-3.5">
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                      <BadgePercent className="h-4 w-4 text-emerald-400" />
                      Cupom Promocional
                    </h4>
                    <p className="text-[10px] text-slate-500">Insira um código de desconto válido para abater nos preços de assinatura.</p>
                  </div>

                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: VAULTENGINEER"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors uppercase font-mono"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-100 text-zinc-950 font-bold rounded-xl text-xs hover:bg-white active:scale-95 transition-all"
                    >
                      Aplicar
                    </button>
                  </form>

                  {isCouponApplied && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-300">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                      <p className="text-[10px] text-emerald-300 font-semibold leading-relaxed">
                        Desconto de <strong>{appliedDiscount}%</strong> validado com sucesso! Abate ativo no checkout.
                      </p>
                    </div>
                  )}
                </div>

                {/* TABELA COMPARATIVA */}
                <div className="border border-slate-900 bg-slate-950/10 p-5 rounded-3xl space-y-4">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Comparação de Recursos</span>
                  
                  <div className="space-y-3">
                    {[
                      { item: "Contas & Subcontas", free: "Até 5", pro: "Ilimitado ✓", isPremium: true },
                      { item: "Envelopes Base-Zero", free: "Até 12", pro: "Ilimitado ✓", isPremium: true },
                      { item: "Conversão Cambial", free: "Pivô EUR Manual", pro: "Câmbio Real Automatizado ✓", isPremium: true },
                      { item: "Regra 50-30-20", free: "Preenchimento Manual", pro: "Totalmente Automatizada ✓", isPremium: true },
                      { item: "Sincronização em Nuvem", free: "Não (Local)", pro: "Nuvem Reativa Instantânea ✓", isPremium: true },
                      { item: "Suporte e Diagnóstico", free: "Comunidade", pro: "Telemetria e Engenharia 24h ✓", isPremium: true }
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-xs border-b border-slate-900/40 pb-2">
                        <span className="text-slate-400 font-medium">{row.item}</span>
                        <div className="flex gap-4 font-mono text-[10px]">
                          <span className="text-slate-600 shrink-0">{row.free}</span>
                          <span className="text-emerald-400 font-bold shrink-0">{row.pro}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ DE FATURAMENTO COBRANÇA */}
                <div className="border border-slate-900 bg-slate-950/10 p-5 rounded-3xl space-y-4">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Dúvidas de Faturamento</span>

                  <div className="space-y-2.5">
                    {[
                      {
                        id: "faq-1",
                        q: "Posso usar a assinatura em múltiplos aparelhos?",
                        a: "Sim! A assinatura Pro é vinculada de forma segura na nuvem ao seu e-mail cadastrado. Se você assinar no iOS, poderá usar o Pro no Web, Desktop e Android sem custos adicionais."
                      },
                      {
                        id: "faq-2",
                        q: "Como funcionam os reembolsos?",
                        a: "Para faturamento Stripe Web, reembolsos podem ser pleiteados em até 7 dias via suporte@vaultfinance.os. Para assinaturas Apple ou Google Play, os estornos são gerenciados e aprovados de forma estrita pelas respectivas lojas."
                      },
                      {
                        id: "faq-3",
                        q: "O cancelamento possui multa?",
                        a: "Não. Nossas assinaturas não possuem fidelidade nem multas rescisórias. Você cancela a qualquer hora e usufrui do Pro até o fim do ciclo vigente já quitado."
                      }
                    ].map((item) => {
                      const isOpen = !!isFaqOpen[item.id];
                      return (
                        <div key={item.id} className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20">
                          <button
                            type="button"
                            onClick={() => toggleFaq(item.id)}
                            className="w-full p-3 text-left flex items-center justify-between gap-2 hover:bg-slate-900/30 transition-all"
                          >
                            <span className="text-[11px] font-bold text-slate-300 leading-snug">{item.q}</span>
                            <ChevronDown className={`h-3.5 w-3.5 text-slate-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                          {isOpen && (
                            <div className="p-3 pt-0 text-[10px] text-slate-400 leading-relaxed font-sans border-t border-slate-900/40 bg-slate-950/40 animate-fade-in">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* MODAL SIMULADO DE CHECKOUT (UPGRADE) */}
            <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
              <DialogContent className="rounded-3xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl sm:max-w-[425px] text-slate-100">
                <DialogHeader className="space-y-2 text-center sm:text-left">
                  <DialogTitle className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                    Confirmar Upgrade Premium
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs sm:text-sm">
                    Preste suporte à engenharia independente do sistema e desbloqueie o poder total das finanças recursivas.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-5 space-y-4 font-mono">
                  {/* Detalhes do Plano */}
                  <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-2.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Resumo do Checkout</span>
                    
                    <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-200">
                      <span>Plano Vault Finance Pro</span>
                      <span>
                        {simulatedInterval === "monthly" ? "Mensal" : "Anual"}
                      </span>
                    </div>

                    <div className="h-px bg-slate-800/40" />

                    <div className="flex justify-between items-baseline text-xs text-slate-400">
                      <span>Valor de Tabela:</span>
                      <span>
                        {simulatedInterval === "monthly" ? "R$ 29,90" : "R$ 299,00"}
                      </span>
                    </div>

                    {isCouponApplied && (
                      <div className="flex justify-between items-baseline text-xs text-emerald-400">
                        <span>Desconto Aplicado ({appliedDiscount}%):</span>
                        <span>
                          -{simulatedInterval === "monthly" 
                            ? `R$ ${(29.90 * (appliedDiscount / 100)).toFixed(2)}` 
                            : `R$ ${(299.00 * (appliedDiscount / 100)).toFixed(2)}`}
                        </span>
                      </div>
                    )}

                    <div className="h-px bg-slate-800" />

                    <div className="flex justify-between items-baseline text-sm sm:text-base font-black text-slate-100">
                      <span>VALOR TOTAL:</span>
                      <span className="text-emerald-400">
                        {isCouponApplied && appliedDiscount === 100 
                          ? "R$ 0,00" 
                          : isCouponApplied && appliedDiscount === 30
                            ? simulatedInterval === "monthly" ? "R$ 20,93" : "R$ 209,30"
                            : simulatedInterval === "monthly" ? "R$ 29,90" : "R$ 299,00"}
                      </span>
                    </div>
                  </div>

                  {/* Informações da Plataforma de Cobrança */}
                  <div className="p-3 bg-slate-900/30 border border-slate-850 rounded-xl flex gap-3 items-start text-[10px] leading-relaxed text-slate-400">
                    {simulatedPlatform === "stripe" && (
                      <>
                        <CreditCard className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <p>
                          <strong>Faturamento Stripe Web:</strong> Pagamento processado de forma criptografada pelo gateway Stripe. Aceita Cartão de Crédito, PIX e Boleto.
                        </p>
                      </>
                    )}
                    {simulatedPlatform === "apple" && (
                      <>
                        <Laptop className="h-5 w-5 text-slate-300 shrink-0 mt-0.5" />
                        <p>
                          <strong>Faturamento Apple App Store:</strong> Transação integrada nativamente via In-App Purchase da Apple no seu aparelho iOS.
                        </p>
                      </>
                    )}
                    {simulatedPlatform === "google" && (
                      <>
                        <Smartphone className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        <p>
                          <strong>Faturamento Google Play Store:</strong> Transação integrada nativamente via Google Play Billing Library no seu aparelho Android.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="rounded-xl h-10 border border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmUpgrade}
                    className="gradient-primary px-6 rounded-xl h-10 font-bold shadow-glow text-zinc-950 hover:bg-emerald-400"
                  >
                    Confirmar e Ativar Pro
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
      </Tabs>

      <div className="h-10" />
    </div>
  );
};

export default Settings;
