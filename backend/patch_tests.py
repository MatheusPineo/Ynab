import os
import re

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # In tests, a test_user fixture is used. Let's create `exp_acc` if it doesn't exist, using get_or_create.
    content = re.sub(
        r'(card_acc = Account\.objects\.create[^\n]+)',
        r'\1\n        exp_acc, _ = Account.objects.get_or_create(user=test_user, name="Expense", account_type="expense", balance=0)',
        content
    )
    
    # Add expense_account=exp_acc
    content = re.sub(
        r'(CreditCardTransaction\.objects\.create\([^)]+)(?!expense_account=)',
        r'\1, expense_account=exp_acc',
        content
    )
    
    # Clean up double injections if any
    content = content.replace(', expense_account=exp_acc, expense_account=exp_acc', ', expense_account=exp_acc')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

patch_file('C:/Users/mathe/PROJETO-YNAB/backend/finance/test_credit_cards.py')
patch_file('C:/Users/mathe/PROJETO-YNAB/backend/finance/test_reports.py')
