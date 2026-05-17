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
import Rule503020 from "@/modules/finance/pages/Rule503020";
import Reports from "@/modules/finance/pages/Reports";
import CreditCards from "@/modules/finance/pages/CreditCards";
import Inbox from "@/modules/finance/pages/Inbox";
import Auth from "@/modules/auth/pages/Auth";
import Landing from "@/modules/auth/pages/Landing";
import NotFound from "@/modules/auth/pages/NotFound";
import LegalCenter from "@/modules/auth/pages/LegalCenter";
import HelpCenter from "@/modules/auth/pages/HelpCenter";
import CookieBanner from "@/modules/auth/components/CookieBanner";
import { useConsentTracker } from "@/shared/hooks/useConsentTracker";
import { FinanceDataTab, FinanceTemplatesTab } from "@/modules/finance/components/FinanceSettingsTab";
import { Database, LayoutGrid } from "lucide-react";
import { useFeatureStore, type EnabledFeatures } from "@/shared/store/useFeatureStore";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const FeatureProtectedRoute = ({ children, featureKey }: { children: React.ReactNode; featureKey: keyof EnabledFeatures }) => {
  const { features } = useFeatureStore();
  const isEnabled = features[featureKey] !== false;
  
  if (!isEnabled) {
    if (featureKey !== "dashboard" && features.dashboard !== false) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/settings" replace />;
  }
  
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
              <Route path="/termos-de-uso" element={<Navigate to="/legal?tab=termos" replace />} />
              <Route path="/politica-de-privacidade" element={<Navigate to="/legal?tab=privacidade" replace />} />
              <Route path="/politica-de-cookies" element={<Navigate to="/legal?tab=cookies" replace />} />
              <Route path="/legal" element={<LegalCenter />} />
              <Route path="/help-center" element={<HelpCenter isPublic={true} />} />
              <Route path="/ajuda" element={<Navigate to="/help-center?tab=articles" replace />} />

              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<FeatureProtectedRoute featureKey="dashboard"><Dashboard /></FeatureProtectedRoute>} />
                <Route path="accounts" element={<FeatureProtectedRoute featureKey="accounts"><Accounts /></FeatureProtectedRoute>} />
                <Route path="transactions" element={<FeatureProtectedRoute featureKey="transactions"><Transactions /></FeatureProtectedRoute>} />
                <Route path="inbox" element={<Inbox />} />
                <Route path="budget" element={<FeatureProtectedRoute featureKey="budget"><Budget /></FeatureProtectedRoute>} />
                <Route path="goals" element={<FeatureProtectedRoute featureKey="goals"><Goals /></FeatureProtectedRoute>} />
                <Route path="debts" element={<FeatureProtectedRoute featureKey="debts"><Debts /></FeatureProtectedRoute>} />
                <Route path="insights" element={<FeatureProtectedRoute featureKey="insights"><Insights /></FeatureProtectedRoute>} />
                <Route path="reports" element={<FeatureProtectedRoute featureKey="insights"><Reports /></FeatureProtectedRoute>} />
                <Route path="rule-503020" element={<FeatureProtectedRoute featureKey="rule503020"><Rule503020 /></FeatureProtectedRoute>} />
                <Route path="credit-cards" element={<FeatureProtectedRoute featureKey="credit_cards"><CreditCards /></FeatureProtectedRoute>} />
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
                <Route path="help" element={<HelpCenter isPublic={false} />} />
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


