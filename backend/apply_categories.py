import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from finance.models import Transaction, Category

# Mapeamento com os nomes que apareceram na sua lista
mappings = {
    "Nubank": "Nubank > Crunchyroll | R$200",
    "Novo Banco": "Sub-contas (EUR)", # Se quiser outra, ajuste para o nome exato da lista
    "Minha Carteira": "Sub-contas (BRL)",
    "Conta Teste": "Sub-contas (BRL)",
    "Tesssss": "teste",
    "Tesouro Direto": "Sub-contas (BRL)"
}

print("=== INICIANDO CATEGORIZAÇÃO (MODO RESILIENTE) ===")

transacoes_sem_categoria = Transaction.objects.filter(is_income=True, category__isnull=True)

for tx in transacoes_sem_categoria:
    account_name = tx.account.name
    
    if account_name in mappings:
        cat_name = mappings[account_name]
        # Usamos filter().first() para pegar o primeiro ID que aparecer, ignorando o erro de duplicata
        category = Category.objects.filter(name=cat_name).first()
        
        if category:
            tx.category = category
            tx.save()
            print(f"Sucesso: Transação {tx.id} ({tx.description}) da conta '{account_name}' movida para '{cat_name}' (ID: {category.id}).")
        else:
            print(f"Aviso: A categoria '{cat_name}' não foi encontrada.")
    else:
        print(f"Aviso: Conta '{account_name}' não mapeada.")

print("\nProcesso finalizado.")