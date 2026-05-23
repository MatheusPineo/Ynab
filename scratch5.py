# -*- coding: utf-8 -*-
import codecs
with codecs.open(r'c:\Users\mathe\PROJETO-YNAB\docs\changelog\novidades.md', 'r', 'utf-8', errors='ignore') as f:
    content = f.read()

new_entry = '''## [1.35.5] - 23 de Maio de 2026\n\n### ?? Organização de Faturas de Cartão\nA tela de Transações agora empacota de forma inteligente todas as suas compras feitas no cartão de crédito dentro da respectiva Fatura (Master Row). Com apenas um clique, você pode expandir a Fatura para visualizar o detalhamento de cada compra, qual subconta de despesa ela pertence e o impacto exato. Isso traz muito mais clareza para o acompanhamento do seu fluxo de caixa.\n\n### ?? Prevenção de Erros no Lançamento\nMelhoramos o fluxo de Nova Compra no Cartão de Crédito! Agora, o sistema exige e valida corretamente a escolha da Subconta de Despesa. O termo genérico 'Categoria YNAB' foi atualizado para alinhar com a forma exata como você organiza o seu dinheiro (Subcontas).\n\n'''

content = content.replace('## [', new_entry + '## [', 1)

with codecs.open(r'c:\Users\mathe\PROJETO-YNAB\docs\changelog\novidades.md', 'w', 'utf-8') as f:
    f.write(content)

print('Updated novidades.md')
