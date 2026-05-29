"""
sujar_base.py
=============
Fase 2 — Finance Ops & Analytics
Injeta sujeira CONTROLADA e RASTREÁVEL nos CSVs limpos da Fase 1, simulando
como esses dados chegariam de uma extração real de ERP + gateway + planilhas.

Por que este script existe
--------------------------
A Fase 1 produziu uma base sintética perfeita. No mundo real, o analista
recebe dados com classificações inconsistentes, datas em formatos mistos,
valores como string, duplicatas, lançamentos sem centro de custo, divergências
gateway×ERP, etc. Este script reintroduz esses problemas de forma deterministica
(seed fixa) para que o `tratamento_dados.py` tenha o que limpar e a narrativa
"antes vs depois" tenha sustância.

Cada regra de sujeira aplicada é loggada para auditoria.
"""

from __future__ import annotations

import os
import random
from pathlib import Path

import numpy as np
import pandas as pd

# ── Configuração ──────────────────────────────────────────────────────────────
SEED = 42
np.random.seed(SEED)
random.seed(SEED)

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
DIRTY_DIR = BASE_DIR / "data" / "dirty"
DIRTY_DIR.mkdir(parents=True, exist_ok=True)


# ── Utilidades ────────────────────────────────────────────────────────────────
def log(msg: str) -> None:
    print(f"   • {msg}")


def aplicar_em_amostra(df: pd.DataFrame, frac: float, func) -> pd.DataFrame:
    """Aplica `func(row)` a uma amostra aleatória `frac` do DataFrame."""
    idx = df.sample(frac=frac, random_state=SEED).index
    df.loc[idx] = df.loc[idx].apply(func, axis=1)
    return df


def converter_valor_br(valor: float, com_simbolo: bool = False) -> str:
    """Converte 1234.56 → '1.234,56' (ou 'R$ 1.234,56')."""
    s = f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {s}" if com_simbolo else s


def converter_data_br(data_iso: str) -> str:
    """Converte '2023-01-09' → '09/01/2023'."""
    try:
        return pd.to_datetime(data_iso).strftime("%d/%m/%Y")
    except Exception:
        return data_iso


# ── 1. VENDAS ─────────────────────────────────────────────────────────────────
GRAFIAS_CANAL = {
    "ecommerce":    ["ecommerce", "E-commerce", "e-Commerce", "Ecommerce", "ECOMMERCE", "e-commerce "],
    "marketplace":  ["marketplace", "Marketplace", "MARKETPLACE", "Mkt Place", "marketplace "],
    "franquia":     ["franquia", "Franquia", "FRANQUIA", "Franquias"],
    "loja_propria": ["loja_propria", "Loja Própria", "loja própria", "LojaPropria", "LOJA PRÓPRIA"],
}

GRAFIAS_CATEGORIA = {
    "skincare":  ["skincare", "Skincare", "SKINCARE", "skin care", "skin-care"],
    "maquiagem": ["maquiagem", "Maquiagem", "MAQUIAGEM", "Make Up", "make up"],
    "perfumes":  ["perfumes", "Perfumes", "PERFUMES", "Perfumaria", "Fragrancia"],
    "haircare":  ["haircare", "Haircare", "HAIRCARE", "hair care", "Hair Care"],
}


def sujar_vendas() -> None:
    print("\n📋 Sujando vendas.csv …")
    df = pd.read_csv(RAW_DIR / "vendas.csv")
    n_original = len(df)

    # 1) Inconsistência de grafia no canal — 25% das linhas
    def varia_canal(canal):
        return random.choice(GRAFIAS_CANAL[canal])
    idx = df.sample(frac=0.25, random_state=SEED).index
    df.loc[idx, "canal"] = df.loc[idx, "canal"].apply(varia_canal)
    log(f"Canal com grafia inconsistente em {len(idx):,} linhas")

    # 2) Inconsistência de grafia na categoria — 20%
    def varia_cat(cat):
        return random.choice(GRAFIAS_CATEGORIA[cat])
    idx = df.sample(frac=0.20, random_state=SEED + 1).index
    df.loc[idx, "categoria"] = df.loc[idx, "categoria"].apply(varia_cat)
    log(f"Categoria com grafia inconsistente em {len(idx):,} linhas")

    # 3) SKU com espaços/case — 8%
    def varia_sku(sku):
        op = random.choice(["upper", "lower", "espacos", "minusc"])
        if op == "upper": return sku.upper()
        if op == "lower": return sku.lower()
        if op == "espacos": return f"  {sku}  "
        return sku.replace("SKU", "sku")
    idx = df.sample(frac=0.08, random_state=SEED + 2).index
    df.loc[idx, "sku_id"] = df.loc[idx, "sku_id"].apply(varia_sku)
    log(f"SKU com case/espaços inconsistentes em {len(idx):,} linhas")

    # 4) Datas em formato BR (dd/mm/yyyy) — 5%
    idx = df.sample(frac=0.05, random_state=SEED + 3).index
    df.loc[idx, "data"] = df.loc[idx, "data"].apply(converter_data_br)
    log(f"Data em formato BR (dd/mm/yyyy) em {len(idx):,} linhas")

    # 5) Valores monetários como string com vírgula decimal — 3%
    for col in ["preco_unitario", "receita_bruta", "receita_liquida"]:
        df[col] = df[col].astype(object)  # permite mix numeric/string
        idx = df.sample(frac=0.03, random_state=SEED + 4).index
        df.loc[idx, col] = df.loc[idx, col].apply(lambda v: converter_valor_br(float(v)))
    log(f"Colunas monetárias como string com vírgula em ~3% das linhas")

    # 6) Duplicatas exatas — ~1%
    n_dup = int(n_original * 0.01)
    duplicatas = df.sample(n=n_dup, random_state=SEED + 5)
    df = pd.concat([df, duplicatas], ignore_index=True)
    log(f"{n_dup:,} duplicatas exatas inseridas (total agora: {len(df):,})")

    # 7) Receita líquida calculada errada — 0.5% (consolidação operacional falha)
    idx = df.sample(frac=0.005, random_state=SEED + 6).index
    df.loc[idx, "receita_liquida"] = (
        pd.to_numeric(df.loc[idx, "receita_bruta"], errors="coerce") * 0.85
    ).round(2)
    log(f"Receita líquida com cálculo errado em {len(idx):,} linhas")

    # Embaralha
    df = df.sample(frac=1, random_state=SEED + 7).reset_index(drop=True)
    df.to_csv(DIRTY_DIR / "vendas.csv", index=False)
    print(f"   ✅ Salvo em {DIRTY_DIR/'vendas.csv'} ({len(df):,} linhas)")


# ── 2. DESPESAS ───────────────────────────────────────────────────────────────
GRAFIAS_CATEGORIA_DESPESA = {
    "pessoal":        ["pessoal", "Pessoal", "PESSOAL", "pessoal ", " pessoal"],
    "aluguel":        ["aluguel", "Aluguel", "ALUGUEL"],
    "marketing":      ["marketing", "Marketing", "MARKETING", " marketing"],
    "logistica":      ["logistica", "Logistica", "Logística", "LOGISTICA"],
    "tecnologia":     ["tecnologia", "Tecnologia", "TI", "TECNOLOGIA"],
    "financeiro":     ["financeiro", "Financeiro", "FINANCEIRO"],
    "administrativo": ["administrativo", "Administrativo", "ADM", "Adm"],
    "depreciacao":    ["depreciacao", "Depreciação", "Depreciacao", "DEPRECIACAO"],
    "outros":         ["outros", "Outros", "OUTROS", "diversos"],
}


def sujar_despesas() -> None:
    print("\n📋 Sujando despesas.csv …")
    df = pd.read_csv(RAW_DIR / "despesas.csv")
    n_original = len(df)

    # 1) Centro de custo nulo em 5% — "lançamento sem CC"
    idx = df.sample(frac=0.05, random_state=SEED).index
    df.loc[idx, "centro_custo"] = np.nan
    log(f"Centro de custo NULO em {len(idx):,} linhas")

    # 2) Categoria com grafia inconsistente — 25%
    def varia_cat(cat):
        return random.choice(GRAFIAS_CATEGORIA_DESPESA[cat])
    idx = df.sample(frac=0.25, random_state=SEED + 1).index
    df.loc[idx, "categoria"] = df.loc[idx, "categoria"].apply(varia_cat)
    log(f"Categoria com grafia inconsistente em {len(idx):,} linhas")

    # 3) data_competencia > data_pagamento — 4% (provisão lançada DEPOIS do pagamento)
    idx = df.sample(frac=0.04, random_state=SEED + 2).index
    df.loc[idx, "data_competencia"], df.loc[idx, "data_pagamento"] = (
        df.loc[idx, "data_pagamento"].values, df.loc[idx, "data_competencia"].values
    )
    log(f"Datas competência×pagamento invertidas em {len(idx):,} linhas")

    # 4) Valor como string com 'R$' e vírgula — 3%
    df["valor"] = df["valor"].astype(object)
    idx = df.sample(frac=0.03, random_state=SEED + 3).index
    df.loc[idx, "valor"] = df.loc[idx, "valor"].apply(lambda v: converter_valor_br(float(v), com_simbolo=True))
    log(f"Valor monetário como string 'R$ x,yy' em {len(idx):,} linhas")

    # 5) ano_mes com formato alternativo "Jan/2023" — 5%
    idx = df.sample(frac=0.05, random_state=SEED + 4).index
    df.loc[idx, "ano_mes"] = pd.to_datetime(df.loc[idx, "data_competencia"], errors="coerce")\
        .dt.strftime("%b/%Y")
    log(f"Campo ano_mes em formato 'MMM/YYYY' em {len(idx):,} linhas")

    # 6) Duplicidade — ~0.7%
    n_dup = max(1, int(n_original * 0.007))
    duplicatas = df.sample(n=n_dup, random_state=SEED + 5)
    df = pd.concat([df, duplicatas], ignore_index=True)
    log(f"{n_dup:,} duplicatas exatas inseridas")

    df = df.sample(frac=1, random_state=SEED + 6).reset_index(drop=True)
    df.to_csv(DIRTY_DIR / "despesas.csv", index=False)
    print(f"   ✅ Salvo em {DIRTY_DIR/'despesas.csv'} ({len(df):,} linhas)")


# ── 3. PAGAMENTOS ─────────────────────────────────────────────────────────────
def sujar_pagamentos() -> None:
    print("\n📋 Sujando pagamentos.csv …")
    df = pd.read_csv(RAW_DIR / "pagamentos.csv")

    # 1) Canal com grafia inconsistente — 30%
    def varia_canal(canal):
        return random.choice(GRAFIAS_CANAL[canal])
    idx = df.sample(frac=0.30, random_state=SEED).index
    df.loc[idx, "canal"] = df.loc[idx, "canal"].apply(varia_canal)
    log(f"Canal com grafia inconsistente em {len(idx):,} linhas")

    # 2) Status com grafia inconsistente — 40%
    mapa_status = {
        "liquidado":  ["liquidado", "Liquidado", "LIQUIDADO", "Pago", "pago"],
        "pendente":   ["pendente", "Pendente", "PENDENTE", "Em Aberto"],
        "em_disputa": ["em_disputa", "Em Disputa", "EM DISPUTA", "disputa", "Em disputa "],
    }
    idx = df.sample(frac=0.40, random_state=SEED + 1).index
    df.loc[idx, "status"] = df.loc[idx, "status"].apply(lambda s: random.choice(mapa_status[s]))
    log(f"Status com grafia inconsistente em {len(idx):,} linhas")

    # 3) Datas em formato BR — 10%
    for col in ["data_liquidacao_gateway", "data_liquidacao_erp"]:
        idx = df.sample(frac=0.10, random_state=SEED + 2).index
        df.loc[idx, col] = df.loc[idx, col].apply(converter_data_br)
    log(f"Datas em formato BR em ~10% das linhas (gateway e ERP)")

    # 4) Reforçar a divergência — em ~10% das linhas, força um valor_erp diferente
    # (simula erro de conciliação que NÃO foi captado pelo gerador)
    idx = df.sample(frac=0.10, random_state=SEED + 3).index
    ruido = np.random.uniform(-0.015, 0.015, size=len(idx))
    df.loc[idx, "valor_erp"] = (df.loc[idx, "valor_gateway"] * (1 + ruido)).round(2)
    df.loc[idx, "divergencia_valor"] = (df.loc[idx, "valor_erp"] - df.loc[idx, "valor_gateway"]).round(2)
    log(f"Divergência gateway×ERP reforçada em {len(idx):,} linhas")

    df = df.sample(frac=1, random_state=SEED + 4).reset_index(drop=True)
    df.to_csv(DIRTY_DIR / "pagamentos.csv", index=False)
    print(f"   ✅ Salvo em {DIRTY_DIR/'pagamentos.csv'} ({len(df):,} linhas)")


# ── 4. ESTOQUE ────────────────────────────────────────────────────────────────
def sujar_estoque() -> None:
    print("\n📋 Sujando estoque.csv …")
    df = pd.read_csv(RAW_DIR / "estoque.csv")

    # 1) SKU com variações de case/espaços — 10%
    def varia_sku(sku):
        op = random.choice(["upper", "lower", "espacos", "minusc"])
        if op == "upper": return sku.upper()
        if op == "lower": return sku.lower()
        if op == "espacos": return f" {sku} "
        return sku.replace("SKU", "sku")
    idx = df.sample(frac=0.10, random_state=SEED).index
    df.loc[idx, "sku_id"] = df.loc[idx, "sku_id"].apply(varia_sku)
    log(f"SKU com case/espaços em {len(idx):,} linhas")

    # 2) Categoria inconsistente — 15%
    def varia_cat(cat):
        return random.choice(GRAFIAS_CATEGORIA[cat])
    idx = df.sample(frac=0.15, random_state=SEED + 1).index
    df.loc[idx, "categoria"] = df.loc[idx, "categoria"].apply(varia_cat)
    log(f"Categoria com grafia inconsistente em {len(idx):,} linhas")

    # 3) status_aging desatualizado — 8% (cálculo errado vs aging_dias atual)
    idx = df.sample(frac=0.08, random_state=SEED + 2).index
    df.loc[idx, "status_aging"] = "normal"  # marca como normal mesmo se estiver crítico
    log(f"status_aging desatualizado (forçado 'normal') em {len(idx):,} linhas")

    # 4) Data de entrada em formato BR — 5%
    idx = df.sample(frac=0.05, random_state=SEED + 3).index
    df.loc[idx, "data_entrada"] = df.loc[idx, "data_entrada"].apply(converter_data_br)
    log(f"data_entrada em formato BR em {len(idx):,} linhas")

    df = df.sample(frac=1, random_state=SEED + 4).reset_index(drop=True)
    df.to_csv(DIRTY_DIR / "estoque.csv", index=False)
    print(f"   ✅ Salvo em {DIRTY_DIR/'estoque.csv'} ({len(df):,} linhas)")


# ── 5. CLIENTES ───────────────────────────────────────────────────────────────
def sujar_clientes() -> None:
    print("\n📋 Sujando clientes.csv …")
    df = pd.read_csv(RAW_DIR / "clientes.csv")
    n_original = len(df)

    # 1) UF com grafias inconsistentes — 15%
    mapa_uf = {
        "SP": ["SP", "sp", "São Paulo", "SAO PAULO", " SP", "S.P."],
        "RJ": ["RJ", "rj", "Rio de Janeiro", "RIO DE JANEIRO"],
        "MG": ["MG", "mg", "Minas Gerais"],
        "RS": ["RS", "rs", "Rio Grande do Sul"],
        "PR": ["PR", "pr", "Paraná"],
        "BA": ["BA", "ba", "Bahia"],
        "SC": ["SC", "sc", "Santa Catarina"],
        "GO": ["GO", "go", "Goiás"],
        "PE": ["PE", "pe", "Pernambuco"],
        "DF": ["DF", "df", "Distrito Federal", "Brasília"],
    }
    idx = df.sample(frac=0.15, random_state=SEED).index
    df.loc[idx, "uf"] = df.loc[idx, "uf"].apply(lambda u: random.choice(mapa_uf[u]))
    log(f"UF com grafia inconsistente em {len(idx):,} linhas")

    # 2) Gênero inconsistente — 20%
    mapa_gen = {
        "F":  ["F", "f", "Feminino", "FEM", "fem"],
        "M":  ["M", "m", "Masculino", "MASC", "masc"],
        "NI": ["NI", "ni", "Não informado", "n/i", "-"],
    }
    idx = df.sample(frac=0.20, random_state=SEED + 1).index
    df.loc[idx, "genero"] = df.loc[idx, "genero"].apply(lambda g: random.choice(mapa_gen[g]))
    log(f"Gênero com grafia inconsistente em {len(idx):,} linhas")

    # 3) data_ultima_compra anterior à data_primeira_compra — 2% (erro de cadastro)
    idx = df.sample(frac=0.02, random_state=SEED + 2).index
    df.loc[idx, "data_primeira_compra"], df.loc[idx, "data_ultima_compra"] = (
        df.loc[idx, "data_ultima_compra"].values, df.loc[idx, "data_primeira_compra"].values
    )
    log(f"Datas primeira×última compra invertidas em {len(idx):,} linhas")

    # 4) Faixa etária com grafias — 10%
    mapa_faixa = {
        "18-24": ["18-24", "18 a 24", "18_24"],
        "25-34": ["25-34", "25 a 34"],
        "35-44": ["35-44", "35 a 44"],
        "45-54": ["45-54", "45 a 54"],
        "55+":   ["55+", "55 ou mais", "55 anos+"],
    }
    idx = df.sample(frac=0.10, random_state=SEED + 3).index
    df.loc[idx, "faixa_etaria"] = df.loc[idx, "faixa_etaria"].apply(lambda f: random.choice(mapa_faixa[f]))
    log(f"Faixa etária com grafia inconsistente em {len(idx):,} linhas")

    # 5) Duplicidade rara (~0.3%)
    n_dup = max(1, int(n_original * 0.003))
    duplicatas = df.sample(n=n_dup, random_state=SEED + 4)
    df = pd.concat([df, duplicatas], ignore_index=True)
    log(f"{n_dup:,} duplicatas inseridas")

    df = df.sample(frac=1, random_state=SEED + 5).reset_index(drop=True)
    df.to_csv(DIRTY_DIR / "clientes.csv", index=False)
    print(f"   ✅ Salvo em {DIRTY_DIR/'clientes.csv'} ({len(df):,} linhas)")


# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n🧪 Injetando sujeira nos CSVs da Fase 1 (simulando ERP real)")
    print("=" * 70)
    sujar_vendas()
    sujar_despesas()
    sujar_pagamentos()
    sujar_estoque()
    sujar_clientes()
    print("\n" + "=" * 70)
    print(f"📁 Bases sujas salvas em: {DIRTY_DIR}/")
    print("✅ Sujeira injetada com sucesso (seed determinística).")
