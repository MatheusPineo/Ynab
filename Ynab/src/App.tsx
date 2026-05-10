import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/dashboard/Layout";
import { useAuthStore } from "@/store/useAuthStore";
import Dashboard from "./pages/Dashboard.tsx";
import Accounts from "./pages/Accounts.tsx";
import Transactions from "./pages/Transactions.tsx";
import Budget from "./pages/Budget.tsx";
import Goals from "./pages/Goals.tsx";
import Insights from "./pages/Insights.tsx";
import Settings from "./pages/Settings.tsx";
import AccountDetails from "./pages/AccountDetails.tsx";
import Debts from "./pages/Debts.tsx";
import Auth from "./pages/Auth.tsx";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import TermsOfUse from "./pages/TermsOfUse.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import CookiePolicy from "./pages/CookiePolicy.tsx";
import CookieBanner from "@/components/ui/CookieBanner.tsx";
import { useConsentTracker } from "@/hooks/useConsentTracker";

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
                <Route path="settings" element={<Settings />} />
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


