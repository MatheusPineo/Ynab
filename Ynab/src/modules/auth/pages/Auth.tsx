import { useState } from "react";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/shared/components/ui/card";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { toast } from "sonner";
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from "@/shared/components/ui/input-otp";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [userIdFor2FA, setUserIdFor2FA] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  
  const { login, register, isAuthenticated, googleLogin, verify2FA } = useAuthStore();
  const navigate = useNavigate();


  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        await googleLogin(tokenResponse.access_token);
        toast.success("Login com Google realizado!");
        navigate("/dashboard");
      } catch (error: any) {
        toast.error(error.message || "Falha na autenticação com o backend");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      toast.error("Falha no login com Google");
      setIsLoading(false);
    },
  });

  const onGoogleLoginClick = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        setIsLoading(true);
        
        // Inicializa o plugin de forma explícita com o Client ID para garantir que ele não quebre no Android
        GoogleAuth.initialize({
          clientId: '285793186636-n535672dqu974h5hisrced9rdmp4idmm.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });

        const result = await GoogleAuth.signIn();
        const idToken = result.authentication.idToken || result.idToken;
        if (!idToken) throw new Error("Não foi possível obter o ID Token do Google.");
        
        await googleLogin(idToken);
        toast.success("Login com Google realizado!");
        navigate("/dashboard");
      } catch (error: any) {
        if (error?.message !== "user_cancelled") {
          console.error("Erro no Google Auth Nativo:", error);
          toast.error(error.message || "Falha na autenticação com o Google.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      handleGoogleLogin();
    }
  };

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
    const name = formData.get("name") as string;

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result?.twoFactorRequired) {
          setTwoFactorRequired(true);
          setUserIdFor2FA(result.userId || null);
          toast.info("Autenticação em duas etapas necessária.");
        } else {
          toast.success("Bem-vindo de volta!");
          navigate("/dashboard");
        }
      } else {
        await register(name, email, password);
        toast.success("Conta criada com sucesso! Faça login.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao autenticar.");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdFor2FA || twoFactorCode.length !== 6) return;

    setIsLoading(true);
    try {
      await verify2FA(userIdFor2FA, twoFactorCode);
      toast.success("Autenticado com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Código inválido.");
      setTwoFactorCode("");
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
              {twoFactorRequired ? "Verificação em Duas Etapas" : isLogin ? "Entrar na sua conta" : "Criar nova conta"}
            </CardTitle>
            <CardDescription>
              {twoFactorRequired 
                ? "Insira o código de 6 dígitos gerado pelo seu aplicativo autenticador."
                : isLogin 
                  ? "Bem-vindo de volta! Insira suas credenciais." 
                  : "Comece sua jornada para a liberdade financeira."}
            </CardDescription>
          </CardHeader>

          {twoFactorRequired ? (
            <form onSubmit={handle2FASubmit}>
              <CardContent className="space-y-6 flex flex-col items-center py-6">
                <InputOTP
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(value) => setTwoFactorCode(value)}
                  render={({ slots }) => (
                    <InputOTPGroup className="gap-2">
                      {slots.map((slot, index) => (
                        <InputOTPSlot 
                          key={index} 
                          {...slot} 
                          className="w-12 h-14 text-xl rounded-xl border-border/60 bg-background/50"
                        />
                      ))}
                    </InputOTPGroup>
                  )}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Abra o Google Authenticator ou similar para ver o código.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  type="submit" 
                  className="w-full gradient-primary rounded-xl h-11 font-bold group" 
                  disabled={isLoading || twoFactorCode.length !== 6}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Verificar Código
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  type="button"
                  onClick={() => setTwoFactorRequired(false)}
                  className="w-full text-xs"
                >
                  Voltar para o login
                </Button>
              </CardFooter>
            </form>
          ) : (
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

                <div className="w-full flex justify-center pt-2">
                  <Button 
                    type="button"
                    onClick={onGoogleLoginClick}
                    className="w-full h-12 rounded-full gradient-primary hover:shadow-glow transition-all gap-3 font-bold text-primary-foreground group"
                  >
                    <div className="bg-white p-1 rounded-full">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    </div>
                    Continuar com Google
                  </Button>
                </div>
              </CardFooter>
            </form>
          )}
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
