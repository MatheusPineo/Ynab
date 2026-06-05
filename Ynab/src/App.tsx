import React, { useEffect, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/shared/components/ui/error-boundary";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { Toaster } from "@/shared/components/ui/toaster";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Layout } from "@/shared/components/dashboard/Layout";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
// Code Splitting / Lazy Loading de módulos e bibliotecas pesadas para otimizar o bundle inicial
// Wrapper defensivo: após um deploy, chunks antigos são invalidados e o import dinâmico falha.
// lazyWithRetry detecta a falha e força UM único reload para buscar os chunks atualizados.
const lazyWithRetry = (importFn: () => Promise<any>) =>
  React.lazy(() =>
    importFn().catch((error: Error) => {
      const isChunkError =
        error.message.includes("Failed to fetch dynamically imported module") ||
        error.message.includes("Loading chunk") ||
        error.message.includes("Loading CSS chunk");
      if (isChunkError && !sessionStorage.getItem("chunk_reload")) {
        sessionStorage.setItem("chunk_reload", "1");
        window.location.reload();
        return { default: () => null as any };
      }
      sessionStorage.removeItem("chunk_reload");
      throw error;
    })
  );
// Limpa o flag de reload ao carregar com sucesso (prova que o reload funcionou)
if (sessionStorage.getItem("chunk_reload")) sessionStorage.removeItem("chunk_reload");

const Dashboard = lazyWithRetry(() => import("@/modules/finance/pages/Dashboard"));
const Accounts = lazyWithRetry(() => import("@/modules/finance/pages/Accounts"));
const Transactions = lazyWithRetry(() => import("@/modules/finance/pages/Transactions"));
const Budget = lazyWithRetry(() => import("@/modules/finance/pages/Budget"));
const Goals = lazyWithRetry(() => import("@/modules/finance/pages/Goals"));
const Settings = lazyWithRetry(() => import("@/modules/auth/pages/Settings"));
const AccountDetails = lazyWithRetry(() => import("@/modules/finance/pages/AccountDetails"));
const BillDetails = lazyWithRetry(() => import("@/modules/finance/pages/BillDetails"));
const Debts = lazyWithRetry(() => import("@/modules/finance/pages/Debts"));
const DebtorProfile = lazyWithRetry(() => import("@/modules/finance/pages/DebtorProfile"));
const Rule503020 = lazyWithRetry(() => import("@/modules/finance/pages/Rule503020"));
const Reports = lazyWithRetry(() => import("@/modules/finance/pages/Reports"));
const CreditCards = lazyWithRetry(() => import("@/modules/finance/pages/CreditCards"));
const Investments = lazyWithRetry(() => import("@/modules/finance/pages/Investments"));
const Assets = lazyWithRetry(() => import("@/modules/finance/pages/Assets"));
const Simulators = lazyWithRetry(() => import("@/modules/finance/pages/Simulators"));
const Inbox = lazyWithRetry(() => import("@/modules/finance/pages/Inbox"));
const Auth = lazyWithRetry(() => import("@/modules/auth/pages/Auth"));
const Landing = lazyWithRetry(() => import("@/modules/auth/pages/Landing"));
const NotFound = lazyWithRetry(() => import("@/modules/auth/pages/NotFound"));
const LegalCenter = lazyWithRetry(() => import("@/modules/auth/pages/LegalCenter"));
const HelpCenter = lazyWithRetry(() => import("@/modules/auth/pages/HelpCenter"));
import CookieBanner from "@/modules/auth/components/CookieBanner";
import { useConsentTracker } from "@/shared/hooks/useConsentTracker";
import { FinanceDataTab, FinanceTemplatesTab } from "@/modules/finance/components/FinanceSettingsTab";
import { Database, LayoutGrid } from "lucide-react";
import { useSidebarStore } from "@/shared/store/useSidebarStore";

import { Capacitor } from "@capacitor/core";
import { SecurityLockProvider } from "@/shared/context/SecurityLockContext";
import { SecurityLockScreen } from "@/shared/components/security/SecurityLockScreen";
import { DeviceTrustModal } from "@/shared/components/security/DeviceTrustModal";
import { authenticatedFetch } from "@/shared/lib/api";

export const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const FeatureProtectedRoute = ({ children, featureKey }: { children: React.ReactNode; featureKey: string }) => {
  const { hiddenItems } = useSidebarStore();
  const isHidden = hiddenItems.includes(featureKey);
  
  if (isHidden) {
    if (featureKey !== "dashboard" && !hiddenItems.includes("dashboard")) {
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
              const response = await authenticatedFetch("/auth/profile/update/", {
                method: "POST",
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
        <SecurityLockProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SecurityLockScreen />
            <DeviceTrustModal />
            <BrowserRouter>
              <CookieBanner />
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-xs text-muted-foreground">Carregando módulo...</p>
                  </div>
                }>
                  <Routes>
                  <Route path="/" element={Capacitor.isNativePlatform() ? <Navigate to="/dashboard" replace /> : <Landing />} />
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
                    <Route path="reports" element={<FeatureProtectedRoute featureKey="reports"><Reports /></FeatureProtectedRoute>} />
                    <Route path="rule-503020" element={<FeatureProtectedRoute featureKey="rule503020"><Rule503020 /></FeatureProtectedRoute>} />
                    <Route path="credit-cards" element={<FeatureProtectedRoute featureKey="credit_cards"><CreditCards /></FeatureProtectedRoute>} />
                    <Route path="investments" element={<FeatureProtectedRoute featureKey="investments"><Investments /></FeatureProtectedRoute>} />
                    <Route path="assets" element={<FeatureProtectedRoute featureKey="assets"><Assets /></FeatureProtectedRoute>} />
                    <Route path="simulators" element={<FeatureProtectedRoute featureKey="simulators"><Simulators /></FeatureProtectedRoute>} />
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
                    <Route path="debtor/:id" element={<DebtorProfile />} />
                    <Route path="bill/:cardId/:billId" element={<BillDetails />} />
                    <Route path="help" element={<HelpCenter isPublic={false} />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </SecurityLockProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;


