import { useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useAccountStore } from "@/store/useAccountStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
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
  LogOut
} from "lucide-react";
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

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências de conta, segurança e sincronização de dados.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-muted/20 border border-border/60 p-1 mb-8 rounded-xl">
          <TabsTrigger value="profile" className="gap-2 rounded-lg data-[state=active]:bg-background">
            <User className="h-4 w-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 rounded-lg data-[state=active]:bg-background">
            <Globe className="h-4 w-4" /> Preferências
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2 rounded-lg data-[state=active]:bg-background">
            <Database className="h-4 w-4" /> Dados
          </TabsTrigger>
        </TabsList>

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
                      <select className="flex h-11 w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                        <option>Português (Brasil)</option>
                        <option>Português (Portugal)</option>
                        <option>English (US)</option>
                      </select>
                   </div>
                    <div className="space-y-3">
                       <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Moeda Principal de Exibição</Label>
                       <select 
                         value={baseCurrency}
                         onChange={(e) => setBaseCurrency(e.target.value as any)}
                         className="flex h-11 w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                       >
                         <option value="EUR">€ EUR — Euro</option>
                         <option value="BRL">R$ BRL — Real</option>
                         <option value="USD">$ USD — Dólar</option>
                       </select>
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
      </Tabs>
      <div className="h-10" />
    </div>
  );
};

export default Settings;
