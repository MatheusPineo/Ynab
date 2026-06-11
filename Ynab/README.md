# Vault — Finance OS 💎

Vault é um sistema de gestão financeira pessoal de alta performance, inspirado na metodologia YNAB, desenvolvido com foco em experiência de usuário (UX) premium, segurança e controle total de patrimônio multimoeda.

Este projeto utiliza uma arquitetura moderna para garantir rapidez na manipulação de dados e uma interface visualmente polida, utilizando o que há de mais recente no ecossistema React.

## 🚀 Tecnologias e Arquitetura

- **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Tipagem forte para segurança financeira)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Estado Global:** [Zustand](https://github.com/pmndrs/zustand) (Gerenciamento leve e persistente no LocalStorage)
- **Roteamento:** [React Router Dom v6](https://reactrouter.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Notificações:** [Sonner](https://sonner.emilkowal.ski/)

## ✨ Funcionalidades Atuais

- [x] **Dashboard Multimoeda:** Suporte nativo para EUR, BRL e USD com conversão automática.
- [x] **Árvore de Contas Recursiva:** Estrutura dinâmica de contas e sub-contas com herança de saldo.
- [x] **Cartões de Crédito com Integração YNAB:** Modal de transações de cartão de crédito totalmente integrado com a seleção de categorias do YNAB.
- [x] **Persistência Local:** Dados salvos automaticamente no navegador para continuidade de uso.
- [x] **Interface Responsiva:** Design otimizado para Desktop e dispositivos móveis (Mobile-first).
- [x] **Patrimônio Líquido em Tempo Real:** Cálculo instantâneo do valor total baseado nas taxas de câmbio (mock).

## 🛠️ Como Iniciar

### Pré-requisitos
- Node.js (v18 ou superior) ou Bun (v1.0 ou superior)

### Instalação
1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO/vault-finance-os.git
   ```
2. Entre na pasta do projeto:
   ```bash
   cd Ynab
   ```
3. Instale as dependências:
   ```bash
   bun install  # ou npm install
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   bun dev  # ou npm run dev
   ```



---

Desenvolvido com foco em precisão e design. Este é um software focado em controle financeiro rigoroso.
