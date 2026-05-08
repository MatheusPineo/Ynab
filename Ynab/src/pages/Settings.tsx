import { useState, useRef, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useAccountStore } from "@/store/useAccountStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { formatMoney } from "@/lib/currency-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Settings as SettingsIcon, 
  Database, 
  ShieldCheck, 
  Bell, 
  Globe,
  Trash2,
  Download,
  LogOut,
  LayoutGrid,
  FileEdit,
  Trash,
  Plus
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

import { QRCodeSVG } from "qrcode.react";

const Settings = () => {
  const { user, logout, accessToken } = useAuthStore();
  const { baseCurrency, setBaseCurrency } = useCurrencyStore();

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

  // Template editing states
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editingRows, setEditingRows] = useState<any[]>([]);
  const [editingName, setEditingName] = useState("");


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

      // Atualiza o store local (Zustand)
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
      // Por enquanto, apenas simula o upload para o UI
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
        // Atualiza o store local
        useAuthStore.setState((state) => ({
          user: state.user ? { 
            ...state.user, 
            twoFactorEnabled: true 
          } : null
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
        // Atualiza o store local
        useAuthStore.setState((state) => ({
          user: state.user ? { 
            ...state.user, 
            twoFactorEnabled: false 
          } : null
        }));
      }
    } catch (error) {
      toast.error("Erro de conexão");
    }
  };

  const { 
    distributionTemplates, 
    fetchDistributionTemplates, 
    deleteDistributionTemplate, 
    saveDistributionTemplate,
    getAccountName,
    fetchAccounts,
    tree 
  } = useAccountStore();

  const accountsFlat = useMemo(() => {
    const list: any[] = [];
    const walk = (nodes: any[]) => {
      nodes.forEach(n => {
        list.push(n);
        if (n.children) walk(n.children);
      });
    };
    walk(tree);
    return list;
  }, [tree]);

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setEditingName(template.name);
    setEditingRows(template.items.map((it: any) => ({
      account: String(it.account),
      percentage: it.percentage ? Number(it.percentage) : 0,
      fixed_amount: it.fixed_amount ? Number(it.fixed_amount) : 0
    })));
    setIsEditingTemplate(true);
  };

  const handleEditingRowChange = (index: number, field: string, value: any) => {
    const newRows = [...editingRows];
    const row = { ...newRows[index] };
    if (field === "account") {
      row.account = value;
    } else if (field === "percentage") {
      row.percentage = parseFloat(value) || 0;
    }
    newRows[index] = row;
    setEditingRows(newRows);
  };

  const saveEditedTemplate = async () => {
    if (!editingName.trim()) return;
    const validRows = editingRows.filter(r => r.account);
    await saveDistributionTemplate({
      id: editingTemplate.id,
      name: editingName,
      items: validRows.map(r => ({
        account: Number(r.account),
        percentage: Number((r.percentage || 0).toFixed(2)),
        fixed_amount: null
      }))
    });
    setIsEditingTemplate(false);
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
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
              <span className="hidden xs:inline">Perfil</span>
              <span className="xs:hidden">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 rounded-lg data-[state=active]:bg-background text-xs sm:text-sm">
              <Globe className="h-4 w-4 shrink-0" />
              <span>Preferências</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5 rounded-lg data-[state=active]:bg-background text-xs sm:text-sm">
              <Database className="h-4 w-4 shrink-0" />
              <span>Dados</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5 rounded-lg data-[state=active]:bg-background text-xs sm:text-sm" onClick={() => { fetchDistributionTemplates(); fetchAccounts(); }}>
              <LayoutGrid className="h-4 w-4 shrink-0" />
              <span>Modelos</span>
            </TabsTrigger>
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
                    <Globe className="h-5 w-5 text-primary" /> Regional e Moeda
                  </h3>
                  <p className="text-sm text-muted-foreground">Defina como o Vault deve se comportar visualmente.</p>
                </div>

                <div className="grid gap-6 max-w-md">
                   <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Idioma do Sistema</Label>
                      <Select defaultValue="pt-BR">
                        <SelectTrigger className="bg-background/50 border-border/60 rounded-xl h-11">
                          <SelectValue placeholder="Selecione o idioma" />
                        </SelectTrigger>
                        <SelectContent className="glass border-border/60">
                          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                          <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                    <div className="space-y-3">
                       <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Moeda Principal de Exibição</Label>
                       <Select value={baseCurrency} onValueChange={(val) => setBaseCurrency(val as any)}>
                         <SelectTrigger className="bg-background/50 border-border/60 rounded-xl h-11">
                           <SelectValue placeholder="Selecione a moeda" />
                         </SelectTrigger>
                         <SelectContent className="glass border-border/60">
                           <SelectItem value="EUR">€ EUR — Euro</SelectItem>
                           <SelectItem value="BRL">R$ BRL — Real</SelectItem>
                           <SelectItem value="USD">$ USD — Dólar</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>


                </div>
              </div>
           </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm p-8">
            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" /> Armazenamento
                </h3>
                <p className="text-sm text-muted-foreground">Controle como seus dados são armazenados localmente.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-muted/20 border border-border/40 space-y-4">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">Backup de Segurança</p>
                    <p className="text-xs text-muted-foreground text-pretty">Baixe um arquivo JSON com todos os seus dados para backup manual.</p>
                  </div>
                  <Button variant="outline" className="w-full rounded-xl gap-2 h-10">
                    Exportar JSON
                  </Button>
                </div>
              </div>



              <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sincronizado com o banco de dados oficial
                </div>
                <Button variant="ghost" onClick={handleLogout} className="text-rose-400 hover:text-rose-400 hover:bg-rose-400/10 gap-2 rounded-xl">
                  <LogOut className="h-4 w-4" /> Encerrar Sessão
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <LayoutGrid className="h-5 w-5 text-primary" />
                Modelos de Distribuição
              </CardTitle>
              <CardDescription>Visualize, edite ou exclua suas regras de divisão salvas.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="grid gap-4">
                {distributionTemplates.length === 0 ? (
                  <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-border/40">
                    <p className="text-muted-foreground italic">Nenhum modelo salvo ainda.</p>
                  </div>
                ) : (
                  distributionTemplates.map(template => (
                    <div key={template.id} className="flex flex-col gap-4 p-5 rounded-2xl bg-muted/20 border border-border/40 hover:border-primary/30 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-bold text-foreground text-lg">{template.name}</h4>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                            Criado em: {template.created_at ? new Date(template.created_at).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <FileEdit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-rose-400 hover:bg-rose-400/10 rounded-xl"
                            onClick={() => {
                              if (confirm(`Excluir o modelo "${template.name}"?`)) {
                                deleteDistributionTemplate(template.id);
                              }
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/20">
                        {template.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-background/40 border border-border/20 rounded-lg px-3 py-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground">{getAccountName(item.account)}:</span>
                            <span className="text-xs font-black text-primary">
                              {item.percentage ? `${item.percentage}%` : formatMoney(item.fixed_amount, "BRL")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Modal de Edição de Modelo */}
          <Dialog open={isEditingTemplate} onOpenChange={setIsEditingTemplate}>
            <DialogContent className="rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl sm:max-w-xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Editar Modelo</DialogTitle>
                <DialogDescription>
                  Altere o nome e as regras de distribuição deste modelo.
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto px-1 space-y-6">
                <div className="space-y-2 p-1">
                  <Label>Nome do Modelo</Label>
                  <Input 
                    value={editingName} 
                    onChange={(e) => setEditingName(e.target.value)}
                    className="bg-background/50 h-11"
                    placeholder="Ex: Salário Mensal"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Regras de Destino</Label>
                    <div className="text-[10px] font-black px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                      TOTAL: {editingRows.reduce((acc, r) => acc + (r.percentage || 0), 0).toFixed(2)}% 
                      ({(100 - editingRows.reduce((acc, r) => acc + (r.percentage || 0), 0)).toFixed(2)}% restantes)
                    </div>
                  </div>
                  <div className="space-y-3">
                    {editingRows.map((row, idx) => (
                      <div key={idx} className="flex items-end gap-2 p-3 rounded-xl bg-muted/10 border border-border/40">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Conta de Destino</Label>
                          <Select value={row.account} onValueChange={(v) => handleEditingRowChange(idx, "account", v)}>
                            <SelectTrigger className="h-9 bg-background/50">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="glass">
                              {accountsFlat.map(a => (
                                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-32 space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Porcentagem (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            className="h-9 bg-background/50" 
                            value={row.percentage || ""} 
                            onChange={(e) => handleEditingRowChange(idx, "percentage", e.target.value)}
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-rose-400 hover:bg-rose-400/10"
                          onClick={() => setEditingRows(editingRows.filter((_, i) => i !== idx))}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full border-dashed rounded-xl h-10 text-primary border-primary/30 hover:bg-primary/5"
                      onClick={() => setEditingRows([...editingRows, { account: "", percentage: 0, fixed_amount: 0 }])}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Destino
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border/20 gap-2">
                <Button variant="ghost" onClick={() => setIsEditingTemplate(false)} className="rounded-xl">
                  Cancelar
                </Button>
                <Button 
                  onClick={saveEditedTemplate}
                  className="gradient-primary px-8 rounded-xl font-bold shadow-glow"
                >
                  Salvar Alterações
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
