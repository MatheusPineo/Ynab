import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Sparkles, ArrowRight, Loader2, Github, Mail } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // If already logged in, go to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await login(email, password);
      toast.success("Bem-vindo de volta!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Erro ao autenticar. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Background Orbs */}
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[400px] z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-glow mb-2">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground">Vault</h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em]">Finance OS</p>
        </div>

        <Card className="border-border/60 bg-card/40 backdrop-blur-xl shadow-elevated rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              {isLogin ? "Entrar na sua conta" : "Criar nova conta"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Bem-vindo de volta! Insira suas credenciais." 
                : "Comece sua jornada para a liberdade financeira."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" name="name" placeholder="Como quer ser chamado?" required className="bg-background/50" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="seu@email.com" required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {isLogin && <button type="button" className="text-xs text-primary hover:underline">Esqueceu?</button>}
                </div>
                <Input id="password" name="password" type="password" placeholder="••••••••" required className="bg-background/50" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full gradient-primary rounded-xl h-11 font-bold group" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Entrar" : "Criar Conta"}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <div className="relative w-full py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-muted-foreground bg-transparent px-2 tracking-widest">
                  Ou continue com
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <Button type="button" variant="outline" className="rounded-xl bg-background/50 border-border/60">
                  <Github className="mr-2 h-4 w-4" /> Github
                </Button>
                <Button type="button" variant="outline" className="rounded-xl bg-background/50 border-border/60">
                  <Mail className="mr-2 h-4 w-4" /> Google
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Não tem uma conta?" : "Já possui uma conta?"}{" "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? "Criar agora" : "Fazer login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
