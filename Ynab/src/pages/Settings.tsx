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

const Settings = () => {
  const { user, logout, accessToken } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(localStorage.getItem("user_bio") || "Organizando o futuro...");
  const [isSaving, setIsSaving] = useState(false);
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
        body: JSON.stringify({ name, bio })
      });

      if (!response.ok) throw new Error("Erro ao salvar perfil");

      // Salva a bio localmente por enquanto já que o modelo User padrão não tem esse campo
      localStorage.setItem("user_bio", bio);
      
      // Atualiza o store local (Zustand)
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, name: name } : null
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

  const handleResetData = () => {
    if (confirm("Tem certeza? Isso apagará TODAS as suas contas, transações e orçamentos permanentemente.")) {
      localStorage.clear();
      toast.success("Dados redefinidos com sucesso.");
      window.location.reload();
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
                    <p className="text-xs text-muted-foreground">Última alteração há 3 meses</p>
                  </div>
                  <Button variant="ghost" className="text-primary font-bold hover:bg-primary/10 rounded-xl px-4 h-9">
                    Alterar
                  </Button>
               </div>
               <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/40">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Autenticação em Duas Etapas (2FA)</p>
                    <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</p>
                  </div>
                  <Button variant="outline" className="rounded-xl px-4 h-9">Ativar</Button>
               </div>
            </CardContent>
          </Card>
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
                      <select className="flex h-11 w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                        <option>€ EUR — Euro</option>
                        <option>R$ BRL — Real</option>
                        <option>$ USD — Dólar</option>
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

                <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 space-y-4">
                  <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-rose-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-rose-500">Zona de Perigo</p>
                    <p className="text-xs text-muted-foreground text-pretty">Apague permanentemente todos os dados armazenados neste dispositivo.</p>
                  </div>
                  <Button variant="destructive" onClick={handleResetData} className="w-full rounded-xl gap-2 h-10 shadow-lg shadow-rose-500/10">
                    Limpar Tudo
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sincronizado localmente no navegador
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
