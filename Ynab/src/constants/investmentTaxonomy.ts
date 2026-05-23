export interface TaxonomyCategory {
  [categoryName: string]: string[];
}

export interface InvestmentTaxonomyMap {
  BR: TaxonomyCategory;
  GLOBAL: TaxonomyCategory;
  UNIVERSAL: TaxonomyCategory;
}

export const INVESTMENT_TAXONOMY: InvestmentTaxonomyMap = {
  BR: { 
    "Renda Variável": [
      "Ações / Units", "FIIs", "FIAGRO", "FI-Infra", "BDRs", "ETFs", 
      "Direitos / Recibos de Subscrição", "Opções", "Futuros", "Termo de Ações"
    ],
    "Renda Fixa Brasileira": [
      "Tesouro Direto", "CDB / RDB / RDC", "LCA / LCI / LCD", 
      "CRI / CRA", "Debêntures", "FIDC", "LF / LFS / DPGE", "Poupança"
    ]
  },
  GLOBAL: { 
    "Renda Variável Global": [
      "Stocks (Ações)", "REITs", "ETFs Internacionais", "Mutual Funds"
    ],
    "Renda Fixa Global": [
      "Bonds / Treasuries", "Offshore Bonds"
    ]
  },
  UNIVERSAL: { 
    "Criptoativos": [
      "Criptomoedas", "Stablecoins", "Staking / Pools de Liquidez", "NFTs"
    ],
    "Alternativos & Patrimônio": [
      "Real Estate (Imóveis)", "Commodities / Metais", "Moedas / Caixa", 
      "Startups / Equity Crowdfunding", "P2P Loans / Precatórios", 
      "Royalties", "Arte / Joias / Colecionáveis", "Seguro de Vida"
    ]
  }
};
