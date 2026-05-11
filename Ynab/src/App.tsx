import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { Toaster } from "@/shared/components/ui/toaster";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Layout } from "@/shared/components/dashboard/Layout";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import Dashboard from "@/modules/finance/pages/Dashboard";
import Accounts from "@/modules/finance/pages/Accounts";
import Transactions from "@/modules/finance/pages/Transactions";
import Budget from "@/modules/finance/pages/Budget";
import Goals from "@/modules/finance/pages/Goals";
import Insights from "@/modules/finance/pages/Insights";
import Settings from "@/modules/auth/pages/Settings";
import AccountDetails from "@/modules/finance/pages/AccountDetails";
import Debts from "@/modules/finance/pages/Debts";
import Auth from "@/modules/auth/pages/Auth";
import Landing from "@/modules/auth/pages/Landing";
import NotFound from "@/modules/auth/pages/NotFound";
import TermsOfUse from "@/modules/auth/pages/TermsOfUse";
import PrivacyPolicy from "@/modules/auth/pages/PrivacyPolicy";
import CookiePolicy from "@/modules/auth/pages/CookiePolicy";
import CookieBanner from "@/modules/auth/components/CookieBanner";
import { useConsentTracker } from "@/shared/hooks/useConsentTracker";
import { FinanceDataTab, FinanceTemplatesTab } from "@/modules/finance/components/FinanceSettingsTab";
import { Database, LayoutGrid } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => {
  useConsentTracker();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    const syncLanguage = async () => {
      if (isAuthenticated && user && accessToken) {
        const isExplicit = localStorage.getItem("vault_lang_explicit") === "true";
        const browserLang = i18n.language;
        const profileLang = user.language;

        if (isExplicit) {
          // O usuário escolheu explicitamente este idioma no site/app nesta máquina.
          // Se for diferente do perfil no banco, atualiza o banco para ficar igual.
          if (profileLang !== browserLang) {
            try {
              const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
              const response = await fetch(`${baseUrl}/auth/profile/update/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ language: browserLang })
              });
              if (response.ok) {
                // Atualiza no Zustand local para que ambos estejam sincronizados
                useAuthStore.setState((state) => ({
                  user: state.user ? { ...state.user, language: browserLang } : null
                }));
              }
            } catch (err) {
              console.error("Erro ao sincronizar idioma com o backend:", err);
            }
          }
        } else {
          // Sem escolha explícita nesta máquina (ex: novo dispositivo ou primeiro acesso).
          // Respeita o idioma salvo no perfil do banco de dados se ele existir.
          if (profileLang && profileLang !== browserLang) {
            i18n.changeLanguage(profileLang);
          }
        }
      }
    };

    syncLanguage();
  }, [isAuthenticated, user?.language, accessToken, i18n]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CookieBanner />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/termos-de-uso" element={<TermsOfUse />} />
              <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
              <Route path="/politica-de-cookies" element={<CookiePolicy />} />

              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="budget" element={<Budget />} />
                <Route path="goals" element={<Goals />} />
                <Route path="debts" element={<Debts />} />
                <Route path="insights" element={<Insights />} />
                <Route 
                  path="settings" 
                  element={
                    <Settings 
                      extraTabs={[
                        {
                          value: "data",
                          trigger: (
                            <>
                              <Database className="h-4 w-4 shrink-0" />
                              <span>Dados</span>
                            </>
                          ),
                          content: <FinanceDataTab />
                        },
                        {
                          value: "templates",
                          trigger: (
                            <>
                              <LayoutGrid className="h-4 w-4 shrink-0" />
                              <span>Modelos</span>
                            </>
                          ),
                          content: <FinanceTemplatesTab />
                        }
                      ]} 
                    />
                  } 
                />
                <Route path="account/:id" element={<AccountDetails />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;


