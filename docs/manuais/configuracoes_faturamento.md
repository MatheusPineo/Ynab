# Manual de Assinatura: Configurações e Playground de Faturamento

Um sistema de elite precisa se adaptar a você, e não o contrário. No Vault Finance OS, a interface é modular, e o ambiente de assinatura serve como um laboratório seguro para testes e personalização.

Descubra como moldar as ferramentas visuais à sua rotina e como explorar nosso motor de faturamento.

---

## 1. Personalização da Interface (A Sidebar Dinâmica)

Você não precisa visualizar abas complexas se não as utiliza no momento. A navegação do Vault foi construída com o princípio de "Single Source of Truth" (Fonte Única de Verdade) enraizado na sua barra lateral (Sidebar).

### Como ocultar ou exibir módulos:
1. Navegue até o rodapé da sua barra lateral esquerda e clique no ícone de **Lápis (Editar Atalhos)**.
2. Um painel interativo será aberto exibindo todos os módulos core do sistema (Ex: Investimentos, Inbox IA, Relatórios 50-30-20, Dívidas).
3. Ative ou desative as chaves seletoras (Toggles) de acordo com o seu momento financeiro atual.
4. **O Efeito Imediato:** Ao salvar, o módulo desaparecerá visualmente do menu. Mas não apenas isso: o nosso motor de rotas bloqueia preventivamente qualquer acesso àquela URL, focando o aplicativo apenas naquilo que importa para você.

> [!TIP]
> Se você desativar o módulo de "Cartões de Crédito", seus dados e históricos **não serão apagados**. Eles apenas ficam adormecidos e invisíveis no banco de dados até você reativar a aba.

---

## 2. O Playground de Faturamento (Billing Simulation)

Para garantir resiliência e demonstrar o funcionamento de integrações críticas (como Stripe, Apple Pay e Google Play Billing), o Vault Finance OS possui um **Ambiente de Simulação de Assinatura** 100% isolado através do `localStorage`. 

### Como brincar no Ambiente de Testes (Sandbox):
Acesse a área de **Assinatura (Billing)** dentro do menu principal de Configurações. Lá, você terá controle total sobre um simulador financeiro sem colocar nenhum dado real de cartão em risco.

* **Quebra de Paywalls (Nudges Nativo):** O sistema tentará ativamente "vender" para você upgrades premium. Ao clicar nos botões de Upgrade, você pode testar a experiência visual e a interatividade dos Modais de Pagamento idênticos aos de produção.
* **Downgrade e Limites:** Ao tentar reverter um plano "Premium" para "Básico", o sistema auditará sua conta na hora e alertará que seu uso atual (Ex: muitas transações) excede a cota gratuita.
* **Emissão de Notas Fiscais Locais (PDF):**
  - O laboratório permite simular o pagamento de assinaturas utilizando Cupons Promocionais.
  - Tente inserir o cupom exclusivo **`VAULTENGINEER`** na aba de checkout! O sistema vai zerar o custo e permitir que você faça o "pagamento simulado".
  - Após a finalização, uma aba de Faturas será liberada onde o app gerará ativamente faturas e notas fiscais em PDF utilizando renderização local diretamente na memória do seu navegador. 

> [!NOTE]
> Nenhum dado inserido na tela de Faturamento do Vault OS trânsita pela rede no modo laboratório. Toda a engrenagem roda localmente, oferecendo uma camada segura e divertida para auditarmos fluxos críticos de conversão.
