export default {
  title: "Central de Ajuda | Vault Finance OS",
  description: "Manuais, engenharia e central de suporte do Vault Finance OS.",
  themeConfig: {
    search: {
      provider: 'local'
    },
    nav: [
      { text: 'Início', link: '/' },
      { text: 'Operação', link: '/manual_actual_budget' },
      { text: 'Segurança', link: '/wiki_seguranca' }
    ],
    sidebar: [
      {
        text: 'Guia do Usuário',
        items: [
          { text: 'Metodologia de Envelopes (YNAB)', link: '/manuais/orcamento_envelopes' },
          { text: 'Cartões de Crédito e Faturas', link: '/manuais/cartoes_faturas' },
          { text: 'Inbox IA e Reconciliação Contábil', link: '/manuais/inbox_ia_auditoria' },
          { text: 'Gestão de Patrimônio (Wealth)', link: '/manuais/investimentos_patrimonio' },
          { text: 'Configurações e Assinatura', link: '/manuais/configuracoes_faturamento' },
          { text: 'Estabilidade e Diagnóstico (PostHog)', link: '/manuais/observabilidade_posthog' },
          { text: 'Operação do Ledger (Antigo)', link: '/manual_actual_budget' }
        ]
      },
      {
        text: 'Central Analítica',
        items: [
          { text: 'Relatórios, Gráficos e Simuladores', link: '/manuais/relatorios_analise' }
        ]
      },
      {
        text: 'Suporte e FAQ',
        items: [
          { text: 'Perguntas Frequentes (Corner Cases)', link: '/faq/perguntas' }
        ]
      },
      {
        text: 'Wikis de Engenharia',
        items: [
          { text: 'Arquitetura Multimoedas', link: '/wiki_multimoedas' },
          { text: 'Recursividade & Envelopes', link: '/wiki_recursividade_infinita' },
          { text: 'Pipeline de Segurança (JWT/2FA)', link: '/wiki_seguranca' }
        ]
      }
    ]
  }
}
