import codecs
with codecs.open(r'c:\Users\mathe\PROJETO-YNAB\CHANGELOG.md', 'r', 'utf-8', errors='ignore') as f:
    content = f.read()

new_entry = '''## [1.35.5] - 2026-05-23\n\n### Features & Integrations\n- **Agrupamento de Faturas de Cartao:** Refatoracao completa da tela de transacoes (Mobile e Desktop) para agrupar visualmente as transacoes de cartao de credito atraves de um "Master Row" (Fatura), empacotando os debitos subjacentes dentro de um elemento colapsavel (Invoice Packaging).\n- **Governanca UX/UI (Cartoes):** Implementado um estado customizado para as validacoes nativas dos navegadores e adequacao da nomenclatura sistemica, mudando de "Categoria YNAB" para "Subconta de Despesa".\n\n'''

content = content.replace('## [1.35.4]', new_entry + '## [1.35.4]', 1)

with codecs.open(r'c:\Users\mathe\PROJETO-YNAB\CHANGELOG.md', 'w', 'utf-8') as f:
    f.write(content)

print('Updated')
