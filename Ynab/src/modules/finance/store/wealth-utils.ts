import { AssetHolding, InvestmentActivity } from "./useWealthStore";

export interface UnitaryAssetNode extends AssetHolding {
  net_value: number;
}

export interface MacroCategoryNode {
  name: string;
  net_value: number;
  assets: UnitaryAssetNode[];
}

export interface AccountNode {
  account_id: number | null;
  account_name: string;
  net_value: number;
  macroCategories: MacroCategoryNode[];
}

/**
 * Agrupa os ativos de holdings em uma estrutura de árvore hierárquica:
 * Account -> Macro Category -> Unitary Assets.
 */
export function groupWealthHoldings(
  holdings: AssetHolding[],
  activities: InvestmentActivity[],
  accounts: { id: number; name: string }[]
): AccountNode[] {
  // 1. Mapeia asset_id para account_id da última atividade cadastrada
  const assetToAccountMap = new Map<number, number | null>();
  // Ordena as atividades cronologicamente para pegar a conta mais recente
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  sortedActivities.forEach((act) => {
    if (act.asset && act.account) {
      assetToAccountMap.set(act.asset, act.account);
    }
  });

  // 2. Agrupando por Account e Macro Category
  const accountMap = new Map<number | null, Map<string, AssetHolding[]>>();

  holdings.forEach((holding) => {
    const accountId = assetToAccountMap.get(holding.asset_id) ?? null;
    const macroCategory = holding.macro_category || "Outros";

    if (!accountMap.has(accountId)) {
      accountMap.set(accountId, new Map<string, AssetHolding[]>());
    }

    const macroMap = accountMap.get(accountId)!;
    if (!macroMap.has(macroCategory)) {
      macroMap.set(macroCategory, []);
    }

    macroMap.get(macroCategory)!.push(holding);
  });

  // 3. Monta o resultado final estruturado
  const accountNodes: AccountNode[] = [];

  accountMap.forEach((macroMap, accountId) => {
    const accountName =
      accounts.find((a) => a.id === accountId)?.name ||
      (accountId === null ? "Custódia Não Informada" : `Conta #${accountId}`);

    const macroCategories: MacroCategoryNode[] = [];
    let accountNetValue = 0;

    macroMap.forEach((assets, macroName) => {
      let macroNetValue = 0;
      const unitaryAssets = assets.map((a) => {
        const val = a.net_value ?? a.quantity * (a.current_price ?? a.average_cost);
        macroNetValue += val;
        return {
          ...a,
          net_value: Number(val.toFixed(2)),
        };
      });

      accountNetValue += macroNetValue;

      macroCategories.push({
        name: macroName,
        net_value: Number(macroNetValue.toFixed(2)),
        assets: unitaryAssets,
      });
    });

    accountNodes.push({
      account_id: accountId,
      account_name: accountName,
      net_value: Number(accountNetValue.toFixed(2)),
      macroCategories: macroCategories.sort((a, b) => a.name.localeCompare(b.name)),
    });
  });

  return accountNodes.sort((a, b) => a.account_name.localeCompare(b.account_name));
}

/**
 * Distribui um novo saldo macro de forma proporcional entre os ativos filhos.
 * Resolve divisões por zero de forma igualitária e arredondamentos aplicando o resto no maior ativo.
 */
export function distributeProportionally(
  assets: UnitaryAssetNode[],
  newMacroBalance: number
): { asset_id: number; new_balance: number }[] {
  if (assets.length === 0) return [];

  const oldMacroBalance = assets.reduce((sum, asset) => sum + asset.net_value, 0);
  const targetTotal = Number(newMacroBalance.toFixed(2));

  let distributed: { asset_id: number; new_balance: number; old_net_value: number }[] = [];
  let sumDistributed = 0;

  if (oldMacroBalance > 0) {
    distributed = assets.map((asset) => {
      const share = asset.net_value / oldMacroBalance;
      const val = Number((targetTotal * share).toFixed(2));
      sumDistributed += val;
      return {
        asset_id: asset.asset_id,
        new_balance: val,
        old_net_value: asset.net_value,
      };
    });
  } else {
    // Se o saldo anterior for zero, distribui igualitariamente
    const equalShare = Number((targetTotal / assets.length).toFixed(2));
    distributed = assets.map((asset) => {
      sumDistributed += equalShare;
      return {
        asset_id: asset.asset_id,
        new_balance: equalShare,
        old_net_value: asset.net_value,
      };
    });
  }

  // Tratamento do resto de arredondamento
  const remainder = Number((targetTotal - sumDistributed).toFixed(2));
  if (remainder !== 0 && distributed.length > 0) {
    // Acha o ativo com maior saldo anterior (ou maior ID se empatar)
    let largestIndex = 0;
    let maxVal = distributed[0].old_net_value;

    for (let i = 1; i < distributed.length; i++) {
      if (distributed[i].old_net_value > maxVal) {
        maxVal = distributed[i].old_net_value;
        largestIndex = i;
      }
    }

    distributed[largestIndex].new_balance = Number(
      (distributed[largestIndex].new_balance + remainder).toFixed(2)
    );
  }

  return distributed.map((d) => ({
    asset_id: d.asset_id,
    new_balance: d.new_balance,
  }));
}
