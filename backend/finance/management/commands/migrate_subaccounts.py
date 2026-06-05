"""
migrate_subaccounts.py — Migração Arquitetural: Sub-contas → Categorias YNAB

Comando Django para migrar progressivamente a arquitetura de sub-contas (Account)
para categorias/envelopes YNAB (Category).

FASES:
  Phase 1: Clonagem — Cria Categories espelhando cada sub-conta existente.
  Phase 2: Rebinding — Re-aponta transações, parcelas, dívidas e regras
           das sub-contas para as contas-mãe e categorias mapeadas.
  Phase 3 (FUTURO): Cleanup — Remove sub-contas orphans após validação.

USO:
  python manage.py migrate_subaccounts --dry-run   # Simula sem persistir
  python manage.py migrate_subaccounts              # Executa de fato

SEGURANÇA:
  - Envolvido em transaction.atomic() — rollback total em caso de erro.
  - Flag --dry-run para simulação segura.
  - Idempotente: detecta e pula categorias já migradas (by name + parent group).
  - Usa QuerySet.update() e bulk_update() para performance em tabelas grandes.
  - Transações com save() customizado (balance sync) são tratadas via QuerySet.update()
    direto para evitar disparar signals e loops de saldo.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from decimal import Decimal


class Command(BaseCommand):
    help = (
        "Phase 1+2+3 — Clona sub-contas em Categories YNAB, re-aponta todas as "
        "Foreign Keys (Transaction, CreditCardTransaction, Installment, DebtItem, "
        "DistributionTemplateItem, LearnedTransactionRule) para as contas-mãe e "
        "categorias mapeadas, e purga as sub-contas de forma segura."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            default=False,
            help='Simula a migração sem persistir dados no banco. Imprime o que seria feito.',
        )
        parser.add_argument(
            '--user-id',
            type=int,
            default=None,
            help='Migrar apenas sub-contas de um usuário específico (por ID). Se omitido, migra todos.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        user_id_filter = options.get('user_id')

        if dry_run:
            self.stdout.write(self.style.WARNING("🔍 MODO DRY-RUN — Nenhum dado será persistido.\n"))

        try:
            with transaction.atomic():
                # Phase 1 — Clonagem
                mapping, sub_parent_map = self._run_phase_1(
                    dry_run=dry_run, user_id_filter=user_id_filter
                )

                # Phase 2 — Rebinding (só executa se Phase 1 produziu mapeamento)
                if mapping:
                    self._run_phase_2(
                        subaccount_to_category_map=mapping,
                        subaccount_to_parent_map=sub_parent_map,
                        dry_run=dry_run,
                    )

                    # Phase 3 — Safe Purge
                    self._run_phase_3(
                        subaccount_ids=list(mapping.keys()),
                        dry_run=dry_run,
                    )

                if dry_run:
                    raise _DryRunAbort()

        except _DryRunAbort:
            self.stdout.write(self.style.WARNING(
                "\n🔍 DRY-RUN concluído. Nenhuma alteração foi persistida no banco de dados."
            ))

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Migração Phase 1+2+3 finalizada. "
            f"{len(mapping)} sub-contas processadas."
        ))

    # ════════════════════════════════════════════════════════════════
    #  PHASE 1 — CLONAGEM
    # ════════════════════════════════════════════════════════════════

    def _run_phase_1(
        self, *, dry_run: bool, user_id_filter: int | None
    ) -> tuple[dict[int, int], dict[int, int]]:
        """
        Phase 1 — Clonagem: Cria Categories espelhando sub-contas existentes.

        Retorna:
            subaccount_to_category_map: dict[sub_account_id → category_id]
            subaccount_to_parent_map:   dict[sub_account_id → parent_account_id]
        """
        from finance.models import Account, Category

        self.stdout.write(self.style.HTTP_INFO("\n" + "━" * 60))
        self.stdout.write(self.style.HTTP_INFO("  PHASE 1 — CLONAGEM DE SUB-CONTAS EM CATEGORIES"))
        self.stdout.write(self.style.HTTP_INFO("━" * 60))

        # ──────────────────────────────────────────────────────────
        # 1. Buscar todas as sub-contas (Account com parent preenchido)
        # ──────────────────────────────────────────────────────────
        subaccounts_qs = Account.objects.filter(
            parent__isnull=False
        ).select_related('user', 'parent').order_by('user_id', 'parent_id', 'name')

        if user_id_filter:
            subaccounts_qs = subaccounts_qs.filter(user_id=user_id_filter)

        subaccounts = list(subaccounts_qs)

        if not subaccounts:
            self.stdout.write(self.style.WARNING("⚠️  Nenhuma sub-conta encontrada para migrar."))
            return {}, {}

        self.stdout.write(self.style.HTTP_INFO(
            f"📦 Encontradas {len(subaccounts)} sub-contas para migrar.\n"
        ))

        # ──────────────────────────────────────────────────────────
        # 2. Agrupar sub-contas por usuário
        # ──────────────────────────────────────────────────────────
        users_map: dict[int, list] = {}
        for sub in subaccounts:
            users_map.setdefault(sub.user_id, []).append(sub)

        # ──────────────────────────────────────────────────────────
        # 3. Para cada usuário, criar o CategoryGroup e as Categories
        # ──────────────────────────────────────────────────────────
        subaccount_to_category_map: dict[int, int] = {}
        subaccount_to_parent_map: dict[int, int] = {}
        GROUP_NAME = "Sub-contas Migradas"

        for user_id, user_subaccounts in users_map.items():
            username = user_subaccounts[0].user.username

            self.stdout.write(self.style.HTTP_INFO(
                f"\n👤 Usuário: {username} (ID: {user_id}) — {len(user_subaccounts)} sub-contas"
            ))

            # Criar ou reutilizar o CategoryGroup raiz para este usuário
            group, group_created = Category.objects.get_or_create(
                user_id=user_id,
                name=GROUP_NAME,
                parent=None,
                defaults={
                    'target_value': Decimal('0.00'),
                    'target_type': 'NEEDED_FOR_SPENDING',
                    'ceiling_value': Decimal('0.00'),
                    'macro_allocation': 'NONE',
                }
            )

            status_icon = "🆕 Criado" if group_created else "♻️  Reutilizado"
            self.stdout.write(f"   {status_icon} CategoryGroup: \"{GROUP_NAME}\" (ID: {group.id})")

            # Agrupar sub-contas por conta-mãe para preservar hierarquia de nomes
            parent_groups: dict[int, list] = {}
            for sub in user_subaccounts:
                parent_groups.setdefault(sub.parent_id, []).append(sub)

            for parent_id, children in parent_groups.items():
                parent_name = children[0].parent.name
                self.stdout.write(f"\n   📁 Conta-mãe: \"{parent_name}\" (ID: {parent_id})")

                for sub in children:
                    # Registrar mapeamento sub → parent
                    subaccount_to_parent_map[sub.id] = sub.parent_id

                    # Nome da categoria: "NomeMãe > NomeSub" para evitar colisões
                    category_name = f"{parent_name} > {sub.name}"

                    # Truncar para o limite de 100 chars do CharField
                    if len(category_name) > 100:
                        category_name = category_name[:97] + "..."

                    # Idempotência: verificar se já existe
                    existing = Category.objects.filter(
                        user_id=user_id,
                        name=category_name,
                        parent=group,
                    ).first()

                    if existing:
                        subaccount_to_category_map[sub.id] = existing.id
                        self.stdout.write(
                            f"      ♻️  Já existe: \"{category_name}\" → Category ID: {existing.id}"
                        )
                        continue

                    # Mapear ceiling → target_value (meta do envelope)
                    target_value = Decimal(str(sub.ceiling)) if sub.ceiling else Decimal('0.00')
                    ceiling_value = target_value

                    if dry_run:
                        subaccount_to_category_map[sub.id] = -1  # Placeholder
                        self.stdout.write(
                            f"      🔍 [DRY-RUN] Criaria: \"{category_name}\" "
                            f"(ceiling={sub.ceiling or 0} → target_value={target_value})"
                        )
                    else:
                        category = Category.objects.create(
                            user_id=user_id,
                            name=category_name,
                            parent=group,
                            target_value=target_value,
                            target_type='NEEDED_FOR_SPENDING',
                            ceiling_value=ceiling_value,
                            macro_allocation='NONE',
                        )
                        subaccount_to_category_map[sub.id] = category.id
                        self.stdout.write(
                            f"      ✅ Criada: \"{category_name}\" → Category ID: {category.id} "
                            f"(ceiling→target: {target_value})"
                        )

        # ──────────────────────────────────────────────────────────
        # 4. Sumário Phase 1
        # ──────────────────────────────────────────────────────────
        self.stdout.write(self.style.HTTP_INFO("\n" + "═" * 60))
        self.stdout.write(self.style.HTTP_INFO("📊 SUMÁRIO DA PHASE 1 — CLONAGEM"))
        self.stdout.write(self.style.HTTP_INFO("═" * 60))
        self.stdout.write(f"   Total de sub-contas processadas: {len(subaccounts)}")
        self.stdout.write(f"   Total de mapeamentos criados:    {len(subaccount_to_category_map)}")
        self.stdout.write(f"   Usuários afetados:               {len(users_map)}")

        if subaccount_to_category_map:
            self.stdout.write(self.style.HTTP_INFO("\n📋 MAPEAMENTO (Account.id → Category.id):"))
            for sub_id, cat_id in subaccount_to_category_map.items():
                parent_id = subaccount_to_parent_map.get(sub_id, "?")
                cat_label = f"Category {cat_id}" if cat_id > 0 else "[DRY-RUN placeholder]"
                self.stdout.write(f"   Account {sub_id} → {cat_label} (parent: Account {parent_id})")

        return subaccount_to_category_map, subaccount_to_parent_map

    # ════════════════════════════════════════════════════════════════
    #  PHASE 2 — REBINDING DE FOREIGN KEYS
    # ════════════════════════════════════════════════════════════════

    def _run_phase_2(
        self,
        *,
        subaccount_to_category_map: dict[int, int],
        subaccount_to_parent_map: dict[int, int],
        dry_run: bool,
    ) -> None:
        """
        Phase 2 — Rebinding: Re-aponta todas as FKs que referenciam sub-contas
        para as contas-mãe (Account) e categorias mapeadas (Category).

        Tabelas tratadas (em ordem de prioridade):
          1. Transaction         — account (CASCADE), category (SET_NULL)
          2. CreditCardTransaction — expense_account (RESTRICT)
          3. Installment         — subaccount (RESTRICT)
          4. DebtItem            — origin_subaccount (CASCADE)
          5. DistributionTemplateItem — account (CASCADE) → category
          6. LearnedTransactionRule — assigned_account (CASCADE)

        Usa QuerySet.update() direto para:
          - Performance em tabelas grandes (evita N queries individuais)
          - Evitar o save() customizado do Transaction (que dispara balance sync)
        """
        from finance.models import (
            Transaction, CreditCardTransaction, Installment,
            DebtItem, DistributionTemplateItem, LearnedTransactionRule,
        )

        self.stdout.write(self.style.HTTP_INFO("\n" + "━" * 60))
        self.stdout.write(self.style.HTTP_INFO("  PHASE 2 — REBINDING DE FOREIGN KEYS"))
        self.stdout.write(self.style.HTTP_INFO("━" * 60))

        sub_ids = list(subaccount_to_category_map.keys())

        # ──────────────────────────────────────────────────────────
        # 2.1  Transaction.account → parent, Transaction.category → mapped
        # ──────────────────────────────────────────────────────────
        self.stdout.write(self.style.HTTP_INFO("\n🔗 2.1 — Transaction (account + category)"))

        total_txn_rebound = 0
        for sub_id in sub_ids:
            parent_id = subaccount_to_parent_map[sub_id]
            category_id = subaccount_to_category_map[sub_id]

            txn_qs = Transaction.objects.filter(account_id=sub_id)
            count = txn_qs.count()

            if count == 0:
                continue

            if dry_run:
                self.stdout.write(
                    f"   🔍 [DRY-RUN] Account {sub_id}: {count} transações "
                    f"→ account={parent_id}, category={category_id}"
                )
            else:
                # QuerySet.update() direto — NÃO dispara Transaction.save()
                # Isso é intencional: evita recálculo de saldo e loops de espelho.
                # Os saldos serão reconciliados na Phase 3 ou manualmente.
                update_kwargs = {'account_id': parent_id}
                # Só atribui category se o mapeamento é real (não dry-run placeholder)
                if category_id > 0:
                    update_kwargs['category_id'] = category_id

                updated = txn_qs.update(**update_kwargs)
                self.stdout.write(
                    f"   ✅ Account {sub_id}: {updated} transações "
                    f"→ account={parent_id}, category={category_id}"
                )

            total_txn_rebound += count

        self.stdout.write(f"   📊 Total de transações re-apontadas: {total_txn_rebound}")

        # ──────────────────────────────────────────────────────────
        # 2.2  CreditCardTransaction.expense_account → parent (RESTRICT)
        # ──────────────────────────────────────────────────────────
        self.stdout.write(self.style.HTTP_INFO("\n🔗 2.2 — CreditCardTransaction (expense_account) [RESTRICT]"))

        total_cct_rebound = 0
        for sub_id in sub_ids:
            parent_id = subaccount_to_parent_map[sub_id]
            cct_qs = CreditCardTransaction.objects.filter(expense_account_id=sub_id)
            count = cct_qs.count()

            if count == 0:
                continue

            if dry_run:
                self.stdout.write(
                    f"   🔍 [DRY-RUN] Account {sub_id}: {count} compras de cartão "
                    f"→ expense_account={parent_id}"
                )
            else:
                updated = cct_qs.update(expense_account_id=parent_id)
                self.stdout.write(
                    f"   ✅ Account {sub_id}: {updated} compras de cartão "
                    f"→ expense_account={parent_id}"
                )

            total_cct_rebound += count

        self.stdout.write(f"   📊 Total de compras de cartão re-apontadas: {total_cct_rebound}")

        # ──────────────────────────────────────────────────────────
        # 2.3  Installment.subaccount → parent (RESTRICT)
        # ──────────────────────────────────────────────────────────
        self.stdout.write(self.style.HTTP_INFO("\n🔗 2.3 — Installment (subaccount) [RESTRICT]"))

        total_inst_rebound = 0
        for sub_id in sub_ids:
            parent_id = subaccount_to_parent_map[sub_id]
            inst_qs = Installment.objects.filter(subaccount_id=sub_id)
            count = inst_qs.count()

            if count == 0:
                continue

            if dry_run:
                self.stdout.write(
                    f"   🔍 [DRY-RUN] Account {sub_id}: {count} parcelas "
                    f"→ subaccount={parent_id}"
                )
            else:
                updated = inst_qs.update(subaccount_id=parent_id)
                self.stdout.write(
                    f"   ✅ Account {sub_id}: {updated} parcelas "
                    f"→ subaccount={parent_id}"
                )

            total_inst_rebound += count

        self.stdout.write(f"   📊 Total de parcelas re-apontadas: {total_inst_rebound}")

        # ──────────────────────────────────────────────────────────
        # 2.4  DebtItem.origin_subaccount → parent (CASCADE)
        # ──────────────────────────────────────────────────────────
        self.stdout.write(self.style.HTTP_INFO("\n🔗 2.4 — DebtItem (origin_subaccount) [CASCADE]"))

        total_debt_rebound = 0
        for sub_id in sub_ids:
            parent_id = subaccount_to_parent_map[sub_id]
            debt_qs = DebtItem.objects.filter(origin_subaccount_id=sub_id)
            count = debt_qs.count()

            if count == 0:
                continue

            if dry_run:
                self.stdout.write(
                    f"   🔍 [DRY-RUN] Account {sub_id}: {count} itens de dívida "
                    f"→ origin_subaccount={parent_id}"
                )
            else:
                updated = debt_qs.update(origin_subaccount_id=parent_id)
                self.stdout.write(
                    f"   ✅ Account {sub_id}: {updated} itens de dívida "
                    f"→ origin_subaccount={parent_id}"
                )

            total_debt_rebound += count

        self.stdout.write(f"   📊 Total de itens de dívida re-apontados: {total_debt_rebound}")

        # ──────────────────────────────────────────────────────────
        # 2.5  DistributionTemplateItem.account → null + category → mapped
        # ──────────────────────────────────────────────────────────
        self.stdout.write(self.style.HTTP_INFO(
            "\n🔗 2.5 — DistributionTemplateItem (account→null, category→mapped) [CASCADE]"
        ))

        total_dist_rebound = 0
        for sub_id in sub_ids:
            category_id = subaccount_to_category_map[sub_id]
            dist_qs = DistributionTemplateItem.objects.filter(account_id=sub_id)
            count = dist_qs.count()

            if count == 0:
                continue

            if dry_run:
                self.stdout.write(
                    f"   🔍 [DRY-RUN] Account {sub_id}: {count} itens de template "
                    f"→ account=NULL, category={category_id}"
                )
            else:
                update_kwargs = {'account_id': None}
                if category_id > 0:
                    update_kwargs['category_id'] = category_id
                updated = dist_qs.update(**update_kwargs)
                self.stdout.write(
                    f"   ✅ Account {sub_id}: {updated} itens de template "
                    f"→ account=NULL, category={category_id}"
                )

            total_dist_rebound += count

        self.stdout.write(f"   📊 Total de itens de template re-apontados: {total_dist_rebound}")

        # ──────────────────────────────────────────────────────────
        # 2.6  LearnedTransactionRule.assigned_account → parent (CASCADE)
        # ──────────────────────────────────────────────────────────
        self.stdout.write(self.style.HTTP_INFO(
            "\n🔗 2.6 — LearnedTransactionRule (assigned_account) [CASCADE]"
        ))

        total_rule_rebound = 0
        for sub_id in sub_ids:
            parent_id = subaccount_to_parent_map[sub_id]
            category_id = subaccount_to_category_map[sub_id]
            rule_qs = LearnedTransactionRule.objects.filter(assigned_account_id=sub_id)
            count = rule_qs.count()

            if count == 0:
                continue

            if dry_run:
                self.stdout.write(
                    f"   🔍 [DRY-RUN] Account {sub_id}: {count} regras aprendidas "
                    f"→ assigned_account={parent_id}, assigned_category={category_id}"
                )
            else:
                update_kwargs = {'assigned_account_id': parent_id}
                if category_id > 0:
                    update_kwargs['assigned_category_id'] = category_id
                updated = rule_qs.update(**update_kwargs)
                self.stdout.write(
                    f"   ✅ Account {sub_id}: {updated} regras aprendidas "
                    f"→ assigned_account={parent_id}, assigned_category={category_id}"
                )

            total_rule_rebound += count

        self.stdout.write(f"   📊 Total de regras aprendidas re-apontadas: {total_rule_rebound}")

        # ──────────────────────────────────────────────────────────
        # Sumário Phase 2
        # ──────────────────────────────────────────────────────────
        self.stdout.write(self.style.HTTP_INFO("\n" + "═" * 60))
        self.stdout.write(self.style.HTTP_INFO("📊 SUMÁRIO DA PHASE 2 — REBINDING"))
        self.stdout.write(self.style.HTTP_INFO("═" * 60))
        self.stdout.write(f"   Transaction:               {total_txn_rebound}")
        self.stdout.write(f"   CreditCardTransaction:     {total_cct_rebound}")
        self.stdout.write(f"   Installment:               {total_inst_rebound}")
        self.stdout.write(f"   DebtItem:                  {total_debt_rebound}")
        self.stdout.write(f"   DistributionTemplateItem:  {total_dist_rebound}")
        self.stdout.write(f"   LearnedTransactionRule:    {total_rule_rebound}")
        total = (
            total_txn_rebound + total_cct_rebound + total_inst_rebound
            + total_debt_rebound + total_dist_rebound + total_rule_rebound
        )
        self.stdout.write(self.style.HTTP_INFO(f"   ─────────────────────────────"))
        self.stdout.write(self.style.SUCCESS(f"   TOTAL DE REGISTROS RE-APONTADOS: {total}"))

    # ════════════════════════════════════════════════════════════════
    #  PHASE 3 — SAFE PURGE
    # ════════════════════════════════════════════════════════════════

    def _run_phase_3(
        self,
        *,
        subaccount_ids: list[int],
        dry_run: bool,
    ) -> None:
        """
        Phase 3 — Safe Purge: Apaga as sub-contas que foram migradas.
        Se houver ProtectedError devido a FKs remanescentes com on_delete=PROTECT,
        captura o erro, loga um aviso listando os objetos protegidos e pula a deleção.
        """
        from finance.models import Account
        from django.db.models import ProtectedError

        self.stdout.write(self.style.HTTP_INFO("\n" + "━" * 60))
        self.stdout.write(self.style.HTTP_INFO("  PHASE 3 — SAFE PURGE (LIMPEZA DAS SUB-CONTAS)"))
        self.stdout.write(self.style.HTTP_INFO("━" * 60))

        if not subaccount_ids:
            self.stdout.write(self.style.WARNING("⚠️ Nenhuma sub-conta para deleção."))
            return

        deleted_count = 0
        protected_count = 0

        # Buscamos as contas do banco para deleção individual
        subaccounts = list(Account.objects.filter(id__in=subaccount_ids))

        for sub in subaccounts:
            sub_name = f"{sub.name} (ID: {sub.id})"
            if dry_run:
                self.stdout.write(
                    f"   🔍 [DRY-RUN] Deletaria sub-conta: \"{sub_name}\""
                )
                deleted_count += 1
            else:
                try:
                    sub.delete()
                    self.stdout.write(
                        self.style.SUCCESS(f"   ✅ Sub-conta deletada com sucesso: \"{sub_name}\"")
                    )
                    deleted_count += 1
                except ProtectedError as e:
                    protected_count += 1
                    protected_objects = list(e.protected_objects)
                    protected_details = ", ".join([f"{obj.__class__.__name__} (ID: {obj.id})" for obj in protected_objects[:5]])
                    if len(protected_objects) > 5:
                        protected_details += f" e mais {len(protected_objects) - 5} objetos"
                    
                    self.stdout.write(
                        self.style.WARNING(
                            f"   ⚠️ Não foi possível deletar a sub-conta \"{sub_name}\" devido a restrições de integridade (ProtectedError).\n"
                            f"      Objetos relacionados remanescentes: {protected_details}"
                        )
                    )

        self.stdout.write(self.style.HTTP_INFO("\n" + "═" * 60))
        self.stdout.write(self.style.HTTP_INFO("📊 SUMÁRIO DA PHASE 3 — CLEANUP"))
        self.stdout.write(self.style.HTTP_INFO("═" * 60))
        self.stdout.write(f"   Contas deletadas:    {deleted_count}")
        self.stdout.write(f"   Contas protegidas:   {protected_count}")


class _DryRunAbort(Exception):
    """Exceção controlada para forçar rollback em modo dry-run dentro de transaction.atomic()."""
    pass
