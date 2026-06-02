import React, { useState, useEffect } from "react";
import { useSecurityLock } from "@/shared/context/SecurityLockContext";
import { ShieldCheck, Delete, Fingerprint, Lock, ShieldAlert } from "lucide-react";

export const SecurityLockScreen: React.FC = () => {
  const { isLocked, unlockApp, verifyBiometrics } = useSecurityLock();
  const [pin, setPin] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [attempts, setAttempts] = useState<number>(0);

  // O PIN padrão do aplicativo é "1234" se o usuário não configurou nenhum personalizado ainda
  const targetPin = localStorage.getItem("vault_security_pin") || "1234";

  // Aciona a autenticação biométrica automaticamente ao montar a tela
  useEffect(() => {
    if (isLocked) {
      handleBiometricAuth();
    }
  }, [isLocked]);

  const handleBiometricAuth = async () => {
    setErrorMsg("");
    const success = await verifyBiometrics();
    if (success) {
      unlockApp();
      setPin("");
      setErrorMsg("");
      setAttempts(0);
    } else {
      setErrorMsg("Falha na autenticação biométrica. Use seu PIN.");
    }
  };

  const handleKeyPress = (num: string) => {
    setErrorMsg("");
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      // Valida se o PIN completo foi inserido
      // O sistema aceita PINs de 4 a 6 dígitos. Vamos validar imediatamente se bater com o targetPin ou quando o comprimento chegar no máximo.
      if (nextPin === targetPin) {
        unlockApp();
        setPin("");
        setAttempts(0);
      } else if (nextPin.length >= targetPin.length && nextPin.length >= 4) {
        // Se já atingiu ou superou o tamanho do PIN alvo e não bateu
        if (nextPin.length === targetPin.length) {
          setErrorMsg("PIN incorreto. Tente novamente.");
          setPin("");
          setAttempts(prev => prev + 1);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background/60 backdrop-blur-2xl transition-all duration-300">
      <div className="w-full max-w-md px-6 flex flex-col items-center justify-between h-[100dvh] py-6 overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col items-center space-y-2 mt-2">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary border border-primary/20 animate-pulse">
            <Lock className="w-6 h-6" />
            <ShieldCheck className="w-4 h-4 absolute bottom-0.5 right-0.5 text-emerald-500 bg-background rounded-full" />
          </div>
          
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Vault Finance OS</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Dispositivo Seguro & Protegido</p>
          </div>
        </div>

        {/* Indicadores de PIN */}
        <div className="flex flex-col items-center w-full space-y-3 my-4">
          <div className="flex justify-center space-x-3.5 h-4 items-center">
            {[...Array(Math.max(4, targetPin.length))].map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-250 ${
                  i < pin.length
                    ? "bg-primary border-primary scale-110 shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                    : "border-muted-foreground/30 bg-transparent"
                }`}
              />
            ))}
          </div>

          {errorMsg ? (
            <div className="flex items-center space-x-1.5 text-red-500 text-xs bg-red-500/10 px-3.5 py-1 rounded-full border border-red-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Insira seu PIN de segurança ou use a Biometria (PIN Padrão: {targetPin})
            </p>
          )}
        </div>

        {/* Teclado Numérico */}
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-3 mb-4 mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              type="button"
              className="flex items-center justify-center w-16 h-16 mx-auto text-xl font-semibold rounded-full bg-secondary/30 hover:bg-secondary/60 text-secondary-foreground border border-border/40 hover:scale-105 active:scale-95 transition-all duration-150 shadow-sm backdrop-blur-md"
            >
              {num}
            </button>
          ))}

          {/* Botão de Limpar */}
          <button
            onClick={handleClear}
            type="button"
            className="flex items-center justify-center w-16 h-16 mx-auto text-xs font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-all duration-150"
          >
            Limpar
          </button>

          {/* Botão 0 */}
          <button
            onClick={() => handleKeyPress("0")}
            type="button"
            className="flex items-center justify-center w-16 h-16 mx-auto text-xl font-semibold rounded-full bg-secondary/30 hover:bg-secondary/60 text-secondary-foreground border border-border/40 hover:scale-105 active:scale-95 transition-all duration-150 shadow-sm backdrop-blur-md"
          >
            0
          </button>

          {/* Botão de Apagar */}
          <button
            onClick={handleBackspace}
            type="button"
            className="flex items-center justify-center w-16 h-16 mx-auto rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/20 hover:scale-105 active:scale-95 transition-all duration-150"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Botão de Fallback para Biometria */}
        <div className="w-full flex justify-center mb-2">
          <button
            onClick={handleBiometricAuth}
            type="button"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/95 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-150 text-sm"
          >
            <Fingerprint className="w-4 h-4" />
            <span>Usar Biometria</span>
          </button>
        </div>
      </div>
    </div>
  );
};
