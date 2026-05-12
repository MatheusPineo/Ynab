import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  LifeBuoy, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  ChevronRight, 
  Star, 
  CheckCircle2, 
  Send, 
  History, 
  BookOpen, 
  Bug, 
  Heart, 
  HelpCircle,
  Sparkles,
  ShieldAlert,
  Globe,
  Database,
  Paperclip,
  X,
  FileText,
  UploadCloud,
  ChevronDown,
  Monitor,
  Cpu,
  Activity,
  User,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { authenticatedFetch } from "@/shared/lib/api";
import { Progress } from "@/shared/components/ui/progress";
import { Badge } from "@/shared/components/ui/badge";

interface Article {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string[];
  tags: string[];
}

interface UserFeedback {
  id: string;
  stars: number;
  category: string;
  comment: string;
  date: string;
}

interface HelpCenterProps {
  isPublic?: boolean;
}

export default function HelpCenter({ isPublic = false }: HelpCenterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "articles";

  // Auth integration
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // Support Form State
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportType, setSupportType] = useState("technical");
  const [supportPriority, setSupportPriority] = useState("medium");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  // Diagnostics and telemetry states
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [showDiagnosticsDetail, setShowDiagnosticsDetail] = useState(false);
  const [latenceSimulated, setLatenceSimulated] = useState<number>(34);

  // Drag and drop states
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback Form State
  const [feedbackStars, setFeedbackStars] = useState(0);
  const [feedbackHoverStars, setFeedbackHoverStars] = useState(0);
  const [feedbackCategory, setFeedbackCategory] = useState("love");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbacksHistory, setFeedbacksHistory] = useState<UserFeedback[]>([]);

  // Simulate network latency and load initial info
  useEffect(() => {
    setLatenceSimulated(Math.floor(22 + Math.random() * 25));
    if (isPublic) {
      window.scrollTo(0, 0);
    }
  }, [activeTab, isPublic]);

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (user) {
      setSupportName(user.name || "");
      setSupportEmail(user.email || "");
    } else {
      setSupportName("");
      setSupportEmail("");
    }
  }, [user]);

  // Load feedbacks history from localStorage on mount
  useEffect(() => {
    const history = localStorage.getItem("vault_user_feedbacks");
    if (history) {
      try {
        setFeedbacksHistory(JSON.parse(history));
      } catch (e) {
        console.error("Erro ao ler feedbacks", e);
      }
    }
  }, []);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
    setSelectedArticleId(null);
    setSubmittedTicket(null);
    handleRemoveFile();
  };

  // Drag over handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileValidationAndUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileValidationAndUpload(file);
    }
  };

  const handleFileValidationAndUpload = (file: File) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato não suportado! Por favor, envie imagens (PNG, JPG, WEBP) ou arquivos PDF.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Limite de tamanho excedido! O arquivo deve ter no máximo 5MB.");
      return;
    }

    setAttachedFile(file);
    setIsUploadingFile(true);
    setUploadProgress(0);

    if (file.type.startsWith("image/")) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploadingFile(false);
        toast.success("Arquivo anexado com sucesso!");
      }
    }, 150);
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    setUploadProgress(0);
    setIsUploadingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getDiagnosticData = () => {
    const ua = navigator.userAgent;
    let os = "Windows OS";
    let browser = "Google Chrome";

    if (ua.includes("Win")) os = "Windows Desktop";
    else if (ua.includes("Mac")) os = "macOS Catalina/BigSur";
    else if (ua.includes("Linux")) os = "GNU/Linux Kernel";
    else if (ua.includes("Android")) os = "Android Mobile";
    else if (ua.includes("like Mac")) os = "iOS Mobile Device";

    if (ua.includes("Chrome")) browser = "V8 Engine / Google Chrome";
    else if (ua.includes("Firefox")) browser = "Gecko / Mozilla Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "WebKit / Apple Safari";
    else if (ua.includes("Edge")) browser = "Chromium / Microsoft Edge";

    return {
      os,
      browser,
      resolution: `${window.screen.width}x${window.screen.height} (${window.innerWidth}x${window.innerHeight} viewport)`,
      appVersion: "v1.17.0 (Production)",
      latence: `${latenceSimulated}ms`,
      lang: navigator.language || "pt-BR",
      cookiesEnabled: navigator.cookieEnabled ? "Ativado" : "Desativado"
    };
  };

  const diagnostics = getDiagnosticData();

  const articles: Article[] = [
    {
      id: "ynab-recursiveness",
      category: "metodologia",
      title: "Como funciona a Recursividade Base-Zero das Contas Mestre?",
      summary: "Entenda a lógica matemática por trás de envelopes recursivos e a consolidação automática de saldos de subcontas.",
      content: [
        "O Vault Finance OS adota o consagrado modelo de orçamento de base-zero (YNAB) associado a uma poderosa inovação de engenharia: as **Contas Mestre Recursivas**.",
        "Em nosso sistema, qualquer Conta ou Categoria de envelope pode conter múltiplas 'subcontas' filhas de forma hierárquica e infinita. Isso significa que você pode segmentar um envelope de 'Moradia' em 'Aluguel', 'Condomínio', 'Luz' e 'Internet'.",
        "**Consolidação Matemática Automática:** Toda vez que você adiciona uma transação em uma subconta, o saldo é consolidado recursivamente para cima. Se a conta 'Internet' recebe um débito de R$ 100, o saldo da conta pai 'Moradia' é automaticamente decrescido em R$ 100 em tempo real.",
        "**Rigidez contra loops cíclicos:** O backend Django impede ativamente que você mova uma conta para dentro de seus próprios descendentes, eliminando loops de recursão infinita que poderiam travar as contas e comprometer a fidedignidade dos seus relatórios financeiros."
      ],
      tags: ["Orçamento", "Recursão", "YNAB", "Matemática"]
    },
    {
      id: "multi-currency-logic",
      category: "moedas",
      title: "Como funciona o Modo Multi-moedas e Conversão Cambial?",
      summary: "Aprenda como o sistema processa transações estrangeiras e unifica seu patrimônio líquido usando o EUR como pivô.",
      content: [
        "O Vault Finance OS suporta mais de 160 moedas globais de forma totalmente integrada. Você pode manter uma conta em USD, uma em BRL e outra em EUR e ver seu saldo consolidado em uma única moeda principal de exibição.",
        "**O Papel do Euro (EUR) como Pivô:** Para realizar conversões de forma eficiente sem necessitar de uma matriz cambial gigantesca, nosso sistema utiliza o **Euro (EUR)** como moeda pivô estável.",
        "Todas as taxas de câmbio são atualizadas diariamente em segundo plano a partir de dados fidedignos e armazenadas em nosso banco de dados. Quando o sistema precisa converter de USD para BRL, ele primeiro converte o valor de USD para EUR (dividindo pela taxa USD/EUR) e, em seguida, converte o resultado de EUR para BRL (multiplicando pela taxa EUR/BRL).",
        "Dessa forma, o cálculo de seu Net Worth global e os relatórios de receitas e despesas permanecem milimetricamente precisos, independente do local físico dos seus ativos."
      ],
      tags: ["Multi-moedas", "Câmbio", "Euro", "Net Worth"]
    },
    {
      id: "security-idor-bola",
      category: "seguranca",
      title: "Como meus dados são blindados contra falhas IDOR e BOLA?",
      summary: "Saiba mais sobre nossos rigorosos protocolos de isolamento de escopo no Django e PostgreSQL.",
      content: [
        "A segurança cibernética dos seus dados financeiros é o pilar fundamental do Vault Finance OS. Empregamos políticas ativas de blindagem lógica de ponta a ponta.",
        "**Proteção Absoluta contra IDOR / BOLA:** As vulnerabilidades do tipo *IDOR (Insecure Direct Object Reference)* ou *BOLA (Broken Object Level Authorization)* ocorrem em sistemas frágeis quando um usuário mal-intencionado altera parâmetros de rota ou chaves primárias na requisição para ler ou modificar dados de terceiros.",
        "No Vault Finance OS, isso é estruturalmente impossível. Todas as nossas rotas de API no backend Django exigem autenticação ativa. Nas consultas ao banco de dados PostgreSQL (queries ORM), adicionamos de forma compulsória e invisível o filtro vinculando o registro ao identificador exclusivo do usuário autenticado (`request.user`).",
        "Nenhum usuário pode visualizar, criar, alterar ou excluir contas, transações ou metas financeiras que não estejam sob sua exclusiva propriedade, blindando o ecossistema de forma rígida."
      ],
      tags: ["Segurança", "IDOR", "BOLA", "Django", "Privacidade"]
    },
    {
      id: "rule-503020-guide",
      category: "metodologia",
      title: "Dominando o Planejamento Financeiro com a Regra 50-30-20",
      summary: "Como mapear e gerenciar sua renda líquida mensal dividida entre Necessidades, Desejos e Prioridades.",
      content: [
        "O módulo **Regra 50-30-20** divide a sua receita mensal líquida em três baldes bem definidos para simplificar o seu direcionamento orçamentário:",
        "1. **50% para Necessidades (Essential):** Gastos cruciais para sua sobrevivência e moradia, como aluguel, alimentação básica, saúde, energia, água e parcelas de dívidas essenciais.",
        "2. **30% para Desejos (Lifestyle):** Gastos voltados ao seu estilo de vida, lazer, hobbies, jantares fora, cinema, assinaturas de streaming e pequenos mimos.",
        "3. **20% para Prioridades/Futuro (Savings/Investment):** Dinheiro focado no seu amanhã, amortização acelerada de passivos caros, poupança para metas de longo prazo ou investimentos diversos.",
        "**Modos de Operação (Manual vs. Integrado):** O Vault Finance OS permite preencher sua renda de forma estática (modo manual) ou ativar o modo **100% Integrado**, onde o sistema soma automaticamente todas as suas receitas reais do mês e exibe medidores comparativos em tempo real do seu consumo real por balde orçamentário mapeado."
      ],
      tags: ["50-30-20", "Orçamento", "Metodologia", "Educação"]
    },
    {
      id: "two-factor-auth",
      category: "seguranca",
      title: "Configurando a Autenticação em Duas Etapas (2FA)",
      summary: "Aumente a proteção da sua conta ativando o login com chave temporária TOTP baseada em tempo.",
      content: [
        "Recomendamos veementemente que todos os usuários ativem a **Autenticação em Duas Etapas (2FA)** para blindar o acesso ao painel contra acessos não-autorizados.",
        "**O que é TOTP?** O algoritmo TOTP (*Time-Based One-Time Password*) gera códigos temporários de 6 dígitos que expiram a cada 30 segundos, sincronizados matematicamente a partir de uma semente secreta compartilhada.",
        "**Como Ativar:** Vá nas suas Configurações do Vault Finance OS, abra a aba de Regional e Segurança, clique em 'Ativar 2FA'. O sistema exibirá um QR Code e uma chave alfanumérica de backup. Escaneie-o usando o seu aplicativo autenticador favorito (Google Authenticator, Microsoft Authenticator, Bitwarden, etc.) e confirme inserindo o primeiro código gerado.",
        "Após ativado, toda vez que fizer login no sistema, além da sua senha principal, o servidor exigirá o código TOTP de 6 dígitos para validar o seu token de acesso JWT, garantindo dupla camada de segurança ativa."
      ],
      tags: ["Segurança", "2FA", "TOTP", "Autenticação"]
    }
  ];

  const filteredArticles = articles.filter((art) => {
    const matchesSearch = 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory ? art.category === selectedCategory : true;
    
    return matchesSearch && matchesCategory;
  });

  const categoriesList = [
    { id: "metodologia", label: "Metodologia YNAB & Orçamento", count: 2, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { id: "moedas", label: "Câmbio & Multimoedas", count: 1, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    { id: "seguranca", label: "Segurança & Privacidade", count: 2, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
  ];

  // Submit Support Ticket Handler
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName || !supportEmail || !supportSubject || !supportMessage) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmittingSupport(true);
    
    try {
      const formData = new FormData();
      formData.append("name", supportName);
      formData.append("email", supportEmail);
      formData.append("ticket_type", supportType);
      formData.append("urgency", supportPriority);
      formData.append("subject", supportSubject);
      formData.append("message", supportMessage);
      
      if (attachedFile) {
        formData.append("attachment", attachedFile);
      }
      
      if (includeDiagnostics) {
        formData.append("diagnostic_data", JSON.stringify(getDiagnosticData()));
      }

      const response = await authenticatedFetch("/tickets/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      setIsSubmittingSupport(false);
      setSubmittedTicket(data.ticket_id);
      toast.success(`Chamado enviado com sucesso! Protocolo: ${data.ticket_id}`);
      
      setSupportSubject("");
      setSupportMessage("");
      handleRemoveFile();
    } catch (error: any) {
      setIsSubmittingSupport(false);
      console.error("Erro ao enviar chamado", error);
      toast.error(error.message || "Não foi possível enviar o chamado no momento. Tente novamente mais tarde.");
    }
  };

  // Submit Feedback Handler
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackStars === 0) {
      toast.error("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    const newFeedback: UserFeedback = {
      id: `FB-${Math.floor(100000 + Math.random() * 900000)}`,
      stars: feedbackStars,
      category: feedbackCategory,
      comment: feedbackComment,
      date: new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    const updatedHistory = [newFeedback, ...feedbacksHistory];
    setFeedbacksHistory(updatedHistory);
    localStorage.setItem("vault_user_feedbacks", JSON.stringify(updatedHistory));

    toast.success("Feedback enviado com sucesso! Muito obrigado pelo seu apoio.");
    
    setFeedbackStars(0);
    setFeedbackComment("");
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "love": return "Amo o App ❤️";
      case "suggestion": return "Sugestão de Melhoria 💡";
      case "bug": return "Bug Encontrado 🐛";
      default: return "Outro 💬";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "articles":
        return (
          <div className="space-y-6">
            {selectedArticleId ? (
              <ArticleReader 
                article={articles.find(a => a.id === selectedArticleId)!} 
                onBack={() => setSelectedArticleId(null)} 
              />
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-border/40 pb-4">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-400 animate-pulse-subtle" />
                      Base de Artigos Técnicos
                    </h2>
                    <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5">Explore informações estruturadas e metodológicas de engenharia.</p>
                  </div>
                </div>

                {/* Search Bar input */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar artigos por palavra-chave (ex: YNAB, 2FA, Câmbio)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-muted/20 border border-border/40 hover:bg-muted/30 focus:border-primary/50 focus:bg-muted/30 rounded-2xl py-3 pl-12 pr-4 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none transition-all"
                  />
                </div>

                {/* Categories Quick Filters */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">Filtro de Categorias</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3.5 py-1.5 rounded-xl border text-[10px] sm:text-xs font-bold transition-all ${
                        selectedCategory === null
                          ? "bg-primary/20 border-primary/30 text-primary"
                          : "bg-muted/20 border-border/40 text-muted-foreground hover:border-border/80 hover:text-foreground"
                      }`}
                    >
                      Todos ({articles.length})
                    </button>
                    {categoriesList.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3.5 py-1.5 rounded-xl border text-[10px] sm:text-xs font-bold transition-all ${
                          selectedCategory === cat.id
                            ? "bg-primary/20 border-primary/30 text-primary"
                            : "bg-muted/20 border-border/40 text-muted-foreground hover:border-border/80 hover:text-foreground"
                        }`}
                      >
                        {cat.label} ({cat.count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Articles list layout */}
                <div className="space-y-4 pt-2">
                  {filteredArticles.length > 0 ? (
                    filteredArticles.map((art) => (
                      <button
                        key={art.id}
                        onClick={() => setSelectedArticleId(art.id)}
                        className="w-full text-left bg-muted/10 border border-border/40 hover:border-primary/30 hover:bg-muted/25 p-5 sm:p-6 rounded-3xl transition-all duration-300 group flex flex-col justify-between h-full relative overflow-hidden shadow-sm hover:shadow-glow"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant="secondary" className="text-[9px] font-mono py-0.5 px-2.5 bg-background/60 border border-border/40 text-muted-foreground uppercase">
                              {art.category}
                            </Badge>
                            {art.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-[9px] text-muted-foreground bg-background/35 px-2 py-0.5 rounded-md border border-border/30 font-mono">
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors leading-snug">
                            {art.title}
                          </h3>
                          <p className="text-muted-foreground text-[11px] sm:text-xs mt-2.5 line-clamp-2 leading-relaxed">
                            {art.summary}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-primary font-bold mt-4 pt-1">
                          <span>Ler artigo completo</span>
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 border border-dashed border-border/60 rounded-3xl bg-muted/10">
                      <HelpCircle className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
                      <p className="text-foreground font-bold text-sm">Nenhum artigo encontrado</p>
                      <p className="text-muted-foreground text-xs mt-1">Tente ajustar suas palavras-chave ou limpe as categorias.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case "support":
        if (isPublic) {
          return (
            <div className="text-center py-12 px-6 border border-border/60 rounded-3xl bg-card/45 backdrop-blur-sm space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden shadow-glow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              <div className="p-4 bg-primary/15 text-primary border border-primary/20 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-100">Área Exclusiva de Clientes</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Para abrir um chamado técnico de engenharia (com telemetria diagnóstica segura e anexo de capturas de tela) você precisa estar logado na sua conta autenticada do sistema.
                </p>
              </div>
              <Link
                to="/auth"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-all text-xs shadow-glow active:scale-[0.98]"
              >
                Entrar no Vault Finance OS
              </Link>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="border-b border-border/40 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-emerald-400 animate-pulse-subtle" />
                  Abertura de Ticket de Suporte
                </h2>
                <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5 font-sans">Nossa equipe de engenharia responderá sua solicitação em até 24 horas úteis.</p>
              </div>
            </div>

            {submittedTicket ? (
              <div className="text-center py-12 px-6 space-y-5 max-w-md mx-auto bg-muted/10 border border-border/40 rounded-3xl relative overflow-hidden shadow-glow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-100">Ticket Aberto com Sucesso!</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    Seu chamado foi registrado na nossa fila de suporte de engenharia sob o protocolo exclusivo:
                  </p>
                </div>
                <div className="py-3 px-5 bg-background border border-border/60 rounded-2xl font-mono text-emerald-400 text-base sm:text-lg font-extrabold select-all inline-block shadow-inner">
                  {submittedTicket}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Um e-mail de confirmação foi encaminhado. Retornaremos sua solicitação de suporte diretamente no e-mail cadastrado.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedTicket(null)}
                  className="mt-6 px-5 py-2.5 bg-muted/20 hover:bg-muted/40 border border-border/40 rounded-2xl text-xs font-bold text-slate-200 transition-all active:scale-95"
                >
                  Abrir Outro Chamado
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-5">
                {user && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="text-[11px] text-emerald-300">
                      Você está logado como <strong>{user.name}</strong>. Os dados cadastrais foram vinculados e travados de forma segura.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">Seu Nome</label>
                    <input
                      type="text"
                      required
                      disabled={!!user}
                      placeholder="Ex: Matheus"
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      className="w-full bg-muted/15 border border-border/40 rounded-2xl p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-muted/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">E-mail de Contato</label>
                    <input
                      type="email"
                      required
                      disabled={!!user}
                      placeholder="Ex: dpo@vaultfinance.os"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full bg-muted/15 border border-border/40 rounded-2xl p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-muted/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">Tipo de Chamado</label>
                    <select
                      value={supportType}
                      onChange={(e) => setSupportType(e.target.value)}
                      className="w-full bg-muted/15 border border-border/40 rounded-2xl p-3.5 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all cursor-pointer font-sans"
                    >
                      <option value="technical" className="bg-card">Problema Técnico ou Bug</option>
                      <option value="account" className="bg-card">Dúvidas de Conta / Login</option>
                      <option value="finance" className="bg-card">Assinatura / Cobrança Pro</option>
                      <option value="other" className="bg-card">Outro Tipo de Dúvida</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">Urgência da Demanda</label>
                    <select
                      value={supportPriority}
                      onChange={(e) => setSupportPriority(e.target.value)}
                      className="w-full bg-muted/15 border border-border/40 rounded-2xl p-3.5 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all cursor-pointer font-sans"
                    >
                      <option value="low" className="bg-card">Baixa — Tirar dúvidas comuns</option>
                      <option value="medium" className="bg-card">Média — Dificuldade de uso</option>
                      <option value="high" className="bg-card">Alta — Falha que impede operação</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">Assunto do Chamado *</label>
                  <input
                    type="text"
                    required
                    placeholder="Digite um resumo curto (ex: Erro ao consolidar teto da conta poupança)..."
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="w-full bg-muted/15 border border-border/40 rounded-2xl p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-muted/25 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">Descrição Detalhada *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Forneça o máximo de detalhes possível, passos para reprodução ou informações relevantes..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full bg-muted/15 border border-border/40 rounded-2xl p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-muted/25 transition-all resize-y"
                  />
                </div>

                {/* Upload drag drop */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">Anexar Print Screen ou Extrato (Opcional)</label>
                  {!attachedFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group select-none ${
                        isDragging 
                          ? "border-primary bg-primary/10 text-primary shadow-glow scale-[0.99]" 
                          : "border-border/60 bg-muted/10 text-muted-foreground hover:border-primary/40 hover:bg-muted/15"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".png,.jpg,.jpeg,.webp,.pdf"
                        className="hidden"
                      />
                      <div className={`p-3.5 rounded-2xl border transition-colors ${
                        isDragging ? "bg-primary/20 border-primary text-primary" : "bg-background/60 border-border/40 text-muted-foreground group-hover:border-primary/30 group-hover:text-foreground"
                      }`}>
                        <UploadCloud className="w-6 h-6 animate-pulse-subtle" />
                      </div>
                      <div className="space-y-1 px-4">
                        <p className="text-[11px] sm:text-xs font-bold text-slate-350">
                          Arraste e solte o arquivo aqui ou <span className="text-primary group-hover:underline">clique para procurar</span>
                        </p>
                        <p className="text-[9px] text-muted-foreground/80 font-mono">
                          Formatos aceitos: PNG, JPG, WEBP ou PDF (Tamanho máximo: 5MB)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/10 border border-border/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
                      <div className="flex items-center gap-3.5 w-full min-w-0">
                        {filePreviewUrl ? (
                          <a href={filePreviewUrl} target="_blank" rel="noreferrer" className="relative h-14 w-14 rounded-xl border border-border/40 overflow-hidden shrink-0 group block">
                            <img src={filePreviewUrl} alt="Preview anexo" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          </a>
                        ) : (
                          <div className="h-14 w-14 rounded-xl border border-border/45 bg-background flex items-center justify-center text-rose-450 shrink-0 select-none">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] sm:text-xs font-bold text-foreground truncate font-mono">{attachedFile.name}</p>
                          <p className="text-[9px] text-muted-foreground mt-1 font-mono">{formatFileSize(attachedFile.size)}</p>
                          {isUploadingFile && (
                            <div className="mt-2 space-y-1">
                              <Progress value={uploadProgress} className="h-1.5" />
                              <p className="text-[9px] text-primary font-mono">Processando arquivo... {uploadProgress}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2.5 bg-background border border-border/40 text-muted-foreground hover:text-rose-450 hover:border-rose-500/30 rounded-xl transition-all shadow-sm shrink-0"
                        title="Remover anexo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Diagnostics */}
                <div className="border border-border/40 rounded-3xl overflow-hidden bg-muted/5 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center justify-between p-4 border-b border-border/30">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeDiagnostics}
                        onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                        className="rounded border-border/60 bg-muted/15 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                      />
                      <div className="text-left">
                        <p className="text-[11px] sm:text-xs font-bold text-slate-200">Anexar Telemetria de Diagnóstico</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 leading-none">Anexa dados técnicos criptografados para triagem de alta performance.</p>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDiagnosticsDetail(!showDiagnosticsDetail)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showDiagnosticsDetail ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {showDiagnosticsDetail && (
                    <div className="p-4 bg-background/40 border-b border-border/30 space-y-3 font-mono text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed animate-fade-in-up">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Sistema: <strong className="text-foreground">{diagnostics.os}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Monitor: <strong className="text-foreground">{diagnostics.resolution}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Navegador: <strong className="text-foreground">{diagnostics.browser}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>App Version: <strong className="text-foreground">{diagnostics.appVersion}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Latência de Rede: <strong className="text-primary">{diagnostics.latence}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>Cookies Local: <strong className="text-foreground">{diagnostics.cookiesEnabled}</strong></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingSupport || isUploadingFile}
                  className="w-full sm:w-max flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 text-zinc-950 font-extrabold hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none text-xs sm:text-sm shadow-glow shrink-0"
                >
                  {isSubmittingSupport ? (
                    <>
                      <span className="h-4 w-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Processando Chamado...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Abrir Chamado Técnico</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        );

      case "feedback":
        if (isPublic) {
          return (
            <div className="text-center py-12 px-6 border border-border/60 rounded-3xl bg-card/45 backdrop-blur-sm space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden shadow-glow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              <div className="p-4 bg-primary/15 text-primary border border-primary/20 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto shadow-inner">
                <Heart className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-100">Diga-nos o que achou</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Queremos ouvir a sua opinião! Se já é cliente do Vault Finance OS, faça login para deixar sua classificação de estrelas e comentários em nossa timeline de feedbacks do app.
                </p>
              </div>
              <Link
                to="/auth"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-all text-xs shadow-glow active:scale-[0.98]"
              >
                Entrar no Vault Finance OS
              </Link>
            </div>
          );
        }

        return (
          <div className="space-y-8">
            <div className="border-b border-border/40 pb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400 animate-pulse-subtle" />
                Deixe sua Opinião e Avaliação
              </h2>
              <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5 font-sans">Sua opinião ajuda nossa equipe de engenharia a calibrar o sistema.</p>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-6 bg-muted/10 border border-border/40 p-5 sm:p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-2.5 text-center sm:text-left">
                <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">Classifique sua Experiência Geral *</label>
                <div className="flex items-center justify-center sm:justify-start gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isGold = (feedbackHoverStars || feedbackStars) >= starValue;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setFeedbackStars(starValue)}
                        onMouseEnter={() => setFeedbackHoverStars(starValue)}
                        onMouseLeave={() => setFeedbackHoverStars(0)}
                        className="focus:outline-none transition-transform active:scale-90"
                        aria-label={`Avaliar como ${starValue} estrelas`}
                      >
                        <Star className={`w-8 h-8 transition-colors ${
                          isGold ? "fill-yellow-450 text-yellow-450 scale-110" : "text-muted-foreground/30 hover:text-muted-foreground/60"
                        }`} />
                      </button>
                    );
                  })}
                  {feedbackStars > 0 && (
                    <Badge variant="outline" className="border-border/60 ml-2 py-0.5 px-2.5 font-mono text-muted-foreground">
                      {feedbackStars} de 5
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">Qual o teor principal? *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "love", icon: Heart, text: "Amo o App", activeCls: "bg-rose-500/10 border-rose-500/30 text-rose-400" },
                    { id: "suggestion", icon: Sparkles, text: "Sugestão", activeCls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
                    { id: "bug", icon: Bug, text: "Bug/Erro", activeCls: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
                    { id: "other", icon: HelpCircle, text: "Outro", activeCls: "bg-blue-500/10 border-blue-500/30 text-blue-400" }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = feedbackCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFeedbackCategory(cat.id)}
                        className={`flex items-center gap-2 justify-center p-3.5 rounded-2xl border text-[11px] font-bold transition-all ${
                          isSelected
                            ? cat.activeCls
                            : "bg-muted/15 border-border/40 text-muted-foreground hover:border-border/80 hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{cat.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">Sua mensagem ou ideias de melhoria</label>
                <textarea
                  rows={4}
                  placeholder="Escreva livremente sua opinião, sugestões de novas telas ou feedbacks de design..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="w-full bg-muted/15 border border-border/40 rounded-2xl p-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-muted/25 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-max flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-100 text-zinc-950 font-extrabold hover:bg-white active:scale-[0.98] transition-all text-xs sm:text-sm shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Avaliação</span>
              </button>
            </form>

            <div className="space-y-4 pt-4 border-t border-border/40">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider font-mono">
                <History className="w-4 h-4 text-emerald-400" />
                Seus Feedbacks Enviados nesta Máquina
              </h3>
              
              {feedbacksHistory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {feedbacksHistory.map((item) => (
                    <div key={item.id} className="bg-muted/10 border border-border/40 rounded-3xl p-5 space-y-3 shadow-sm hover:border-border/60 hover:bg-muted/15 transition-all">
                      <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-2.5">
                        <span className="text-[9px] font-mono py-0.5 px-2 bg-background/60 rounded-md border border-border/40 text-muted-foreground">
                          {item.id}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex text-yellow-450">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < item.stars ? "fill-yellow-450 text-yellow-450" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-primary">{getCategoryLabel(item.category)}</span>
                      </div>
                      {item.comment && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed font-sans italic p-3 bg-background/30 rounded-2xl border border-border/30">
                          "{item.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-border/40 rounded-3xl text-muted-foreground text-xs bg-muted/5">
                  Nenhum feedback enviado anteriormente deste dispositivo.
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderSidebarChannels = () => (
    <aside className={`${isPublic ? "hidden lg:block lg:col-span-4" : "col-span-1 lg:col-span-4"} sticky top-6 bg-card/40 border border-border/60 p-5 sm:p-6 rounded-3xl shadow-glow backdrop-blur-md relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="space-y-6 relative">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-2.5 block font-mono">
          Canais de Suporte
        </span>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleTabChange("articles")}
            className={`w-full flex items-center justify-between text-left p-3.5 rounded-2xl border transition-all duration-300 group relative ${
              activeTab === "articles"
                ? "bg-primary/15 border-primary/30 text-white font-bold shadow-sm"
                : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/15 hover:text-foreground"
            }`}
          >
            {activeTab === "articles" && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full bg-gradient-to-b from-primary to-emerald-500 animate-pulse" />
            )}
            <div className="flex items-center gap-3 pl-1.5 min-w-0">
              <div className={`p-2 rounded-xl border shrink-0 transition-all ${
                activeTab === "articles" ? "bg-primary/20 text-primary border-primary/20" : "bg-background/80 text-muted-foreground/65 border-border/40"
              }`}>
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-extrabold tracking-tight truncate">Artigos e Dicas</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Base de Conhecimento</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("support")}
            className={`w-full flex items-center justify-between text-left p-3.5 rounded-2xl border transition-all duration-300 group relative ${
              activeTab === "support"
                ? "bg-primary/15 border-primary/30 text-white font-bold shadow-sm"
                : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/15 hover:text-foreground"
            }`}
          >
            {activeTab === "support" && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full bg-gradient-to-b from-primary to-emerald-500 animate-pulse" />
            )}
            <div className="flex items-center gap-3 pl-1.5 min-w-0">
              <div className={`p-2 rounded-xl border shrink-0 transition-all ${
                activeTab === "support" ? "bg-primary/20 text-primary border-primary/20" : "bg-background/80 text-muted-foreground/65 border-border/40"
              }`}>
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-extrabold tracking-tight truncate">Suporte Direto</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Abrir Ticket Técnico</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("feedback")}
            className={`w-full flex items-center justify-between text-left p-3.5 rounded-2xl border transition-all duration-300 group relative ${
              activeTab === "feedback"
                ? "bg-primary/15 border-primary/30 text-white font-bold shadow-sm"
                : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/15 hover:text-foreground"
            }`}
          >
            {activeTab === "feedback" && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full bg-gradient-to-b from-primary to-emerald-500 animate-pulse" />
            )}
            <div className="flex items-center gap-3 pl-1.5 min-w-0">
              <div className={`p-2 rounded-xl border shrink-0 transition-all ${
                activeTab === "feedback" ? "bg-primary/20 text-primary border-primary/20" : "bg-background/80 text-muted-foreground/65 border-border/40"
              }`}>
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-extrabold tracking-tight truncate">Enviar Feedback</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Dar Ideias ou Estrelas</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border/30 px-3 text-[10px] sm:text-xs text-muted-foreground leading-relaxed font-mono relative">
        <p>Precisa de suporte imediato?</p>
        <a href="mailto:matheuskrx@gmail.com" className="text-primary hover:underline block mt-1.5 font-bold flex items-center gap-1 group">
          <span>matheuskrx@gmail.com</span>
          <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </a>
      </div>
    </aside>
  );

  if (isPublic) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-100 relative overflow-x-hidden">
        {/* Background Glows */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute top-0 right-1/4 h-[500px] w-[800px] rounded-full bg-emerald-500/5 blur-[120px]" />
          <div className="absolute bottom-10 left-1/4 h-[400px] w-[600px] rounded-full bg-teal-500/5 blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          
          {/* Navigation Top Header */}
          <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-12 border-b border-border/40 pb-6">
            <Link
              to="/"
              className="inline-flex items-center text-primary hover:text-primary-foreground transition-colors gap-2 text-xs sm:text-sm font-bold group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> 
              <span>Voltar para a Home</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono py-1 px-3.5 bg-muted/20 border border-border/40 text-muted-foreground rounded-full flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Suporte Técnico Ativo
              </span>
            </div>
          </header>

          {/* Hero Banner Section */}
          <section className="bg-gradient-to-br from-card/60 via-card/40 to-primary/5 border border-border/60 rounded-3xl p-6 sm:p-10 mb-10 shadow-glow relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/15 transition-colors duration-500" />
            <div className="max-w-3xl relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary text-[10px] font-mono font-bold mb-5 uppercase tracking-wider">
                Help Center / Central de Ajuda
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 mb-4 tracking-tight leading-tight">
                Como podemos ajudar hoje?
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm lg:text-base leading-relaxed">
                Explore nossos artigos explicativos sobre o ecossistema, consulte as lógicas matemáticas do YNAB, abra chamados para nossa equipe de engenharia ou envie feedbacks para moldarmos juntos o amanhã do **Vault Finance OS**.
              </p>
            </div>
          </section>

          {/* Content Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* MOBILE TABS NAVIGATION */}
            <div className="lg:hidden w-full overflow-x-auto no-scrollbar pb-2 mb-4">
              <div className="flex gap-2 min-w-max px-1">
                <button
                  onClick={() => handleTabChange("articles")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    activeTab === "articles"
                      ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Base de Conhecimento</span>
                </button>
                <button
                  onClick={() => handleTabChange("support")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    activeTab === "support"
                      ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span>Abrir Ticket / Suporte</span>
                </button>
                <button
                  onClick={() => handleTabChange("feedback")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    activeTab === "feedback"
                      ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Canal de Feedback</span>
                </button>
              </div>
            </div>

            {/* DESKTOP SIDEBAR */}
            {renderSidebarChannels()}

            {/* MAIN WORKSPACE */}
            <main className="lg:col-span-8 bg-card/40 border border-border/60 rounded-3xl p-6 sm:p-8 shadow-inner backdrop-blur-sm relative overflow-hidden">
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {renderTabContent()}
              </div>
            </main>

          </div>

        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW: 2. LOGGED IN SYSTEM VIEW (isPublic === false)
  // ==========================================================================
  return (
    <>
      <div className="flex items-center justify-between gap-4 mt-2 mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            Central de Ajuda e Suporte
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed font-sans">
            Consulte nossos artigos de engenharia financeira, abra um chamado direto com nossa equipe ou envie sugestões de design.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* MOBILE TABS NAVIGATION (LOGGED) */}
        <div className="lg:hidden w-full overflow-x-auto no-scrollbar pb-2 mb-2">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => handleTabChange("articles")}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[11px] font-extrabold transition-all ${
                activeTab === "articles"
                  ? "bg-primary text-primary-foreground border-primary shadow-soft"
                  : "bg-muted/40 text-muted-foreground border-border"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Artigos e FAQ</span>
            </button>
            <button
              onClick={() => handleTabChange("support")}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[11px] font-extrabold transition-all ${
                activeTab === "support"
                  ? "bg-primary text-primary-foreground border-primary shadow-soft"
                  : "bg-muted/40 text-muted-foreground border-border"
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Abrir Ticket</span>
            </button>
            <button
              onClick={() => handleTabChange("feedback")}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[11px] font-extrabold transition-all ${
                activeTab === "feedback"
                  ? "bg-primary text-primary-foreground border-primary shadow-soft"
                  : "bg-muted/40 text-muted-foreground border-border"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Feedback</span>
            </button>
          </div>
        </div>

        {/* DESKTOP SIDEBAR NAVIGATION (LOGGED) */}
        {renderSidebarChannels()}

        {/* MAIN WORKSPACE (LOGGED) */}
        <main className="col-span-1 lg:col-span-8 bg-card/40 backdrop-blur-sm border border-border/60 rounded-3xl p-5 sm:p-7 shadow-glow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="animate-in fade-in slide-in-from-bottom-1 duration-250 relative">
            {renderTabContent()}
          </div>
        </main>

      </div>
    </>
  );
}

/**
 * Article Reader Secondary Component
 */
function ArticleReader({ article, onBack }: { article: Article; onBack: () => void }) {
  const [voted, setVoted] = useState<"yes" | "no" | null>(null);

  const handleVote = (type: "yes" | "no") => {
    setVoted(type);
    if (type === "yes") {
      toast.success("Ficamos muito felizes em ajudar! Obrigado pelo feedback.");
    } else {
      toast.info("Obrigado pelo seu feedback. Nossa equipe irá refinar este artigo.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Article Navigation Bar */}
      <div className="border-b border-border/30 pb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center text-xs font-bold text-primary hover:text-primary/80 transition-colors gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para os Artigos</span>
        </button>

        <Badge variant="secondary" className="text-[10px] font-mono text-muted-foreground py-0.5 px-2.5 bg-background border border-border/40 select-none uppercase">
          {article.category}
        </Badge>
      </div>

      {/* Article Content */}
      <article className="space-y-5">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 leading-tight">
          {article.title}
        </h1>
        
        <p className="text-xs sm:text-sm font-bold text-muted-foreground border-l-2 border-primary pl-3.5 italic py-0.5 leading-relaxed">
          {article.summary}
        </p>

        <div className="prose prose-invert max-w-none space-y-4.5 text-xs sm:text-sm text-muted-foreground/90 leading-relaxed font-sans">
          {article.content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>

      {/* Tags details */}
      <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border/30">
        {article.tags.map((tag, i) => (
          <span key={i} className="text-[10px] text-muted-foreground/80 bg-background/40 px-2 py-0.5 rounded-md border border-border/30 font-mono">
            #{tag}
          </span>
        ))}
      </div>

      {/* Helpfulness Vote Area */}
      <div className="bg-muted/10 border border-border/40 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="text-center sm:text-left">
          <p className="text-xs sm:text-sm font-extrabold text-slate-200">Este artigo tirou suas dúvidas de uso?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Sua avaliação melhora nossa base continuamente.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {voted ? (
            <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-3.5 rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Obrigado pelo seu voto!</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleVote("yes")}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-background border border-border/40 hover:border-primary/40 hover:text-foreground text-xs text-muted-foreground transition-all active:scale-95"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sim</span>
              </button>
              <button
                type="button"
                onClick={() => handleVote("no")}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-background border border-border/40 hover:border-rose-500/30 hover:text-foreground text-xs text-muted-foreground transition-all active:scale-95"
              >
                <ThumbsDown className="w-3.5 h-3.5 text-rose-450" />
                <span>Não</span>
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
