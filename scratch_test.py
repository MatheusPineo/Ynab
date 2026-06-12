with open(r"C:\Users\mathe\PROJETO-YNAB\Ynab\src\modules\finance\pages\Budget.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Acompanhamento" in line or "exclude_from_totals" in line or "investment" in line or "checking" in line:
        print(f"Line {i+1}: {line.strip()}")
