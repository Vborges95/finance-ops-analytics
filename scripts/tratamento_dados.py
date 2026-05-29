"""
tratamento_dados.py
===================
Fase 2 — Finance Ops & Analytics
Limpeza, padronização e deduplicação das 5 bases vindas de `data/dirty/`.

Lógica
------
Cada base passa por um pipeline de regras independentes (cada regra é uma
função pequena que loga antes/depois). O resultado final fica em
`data/processed/`, pronto para consolidação e análise SQL.

Por que esse pipeline existe
----------------------------
Replica a rotina de um FP&A que recebe extrações de ERP, gateway e planilhas
de área, e precisa entregar uma base confiável para fechamento — antes de
qualquer dashboard ou modelo financeiro.

Princípios
----------
1. Idempotente: rodar 2x dá o mesmo resultado.
2. Auditável: cada regra reporta quantas linhas tocou.
3. Não-destrutivo: o "antes" continua em `data/dirty/` intacto.
4. Determinístico: sem aleatoriedade nesta etapa.
"""

from __future__ import annotations

import re
import unicodedata
from pathlib import Path

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DIRTY_DIR = BASE_DIR / "data" / "dirty"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# Data de referência para recalcular aging (último dia da base simulada)
DATA_REFERENCIA = pd.Timestamp("2024-12-31")


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  UTILITÁRIOS                                                              ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def log_regra(nome: str, n_afetadas: int, total: int) -> None:
    pct = (n_afetadas / total * 100) if total else 0
    print(f"   ▸ {nome:<55} {n_afetadas:>6,} linhas ({pct:>5.2f}%)")


def slugify(texto: str) -> str:
    """Normaliza texto: minúsculo, sem acento, snake_case, sem pontuação parasita.

    Preserva apenas [a-z0-9_+] no resultado.
    Exemplos: 'São Paulo' → 'sao_paulo' | 'S.P.' → 'sp' | 'n/i' → 'n_i'
              '55+'        → '55+'       | '18-24' → '18_24'
    """
    if pd.isna(texto):
        return texto
    s = str(texto).strip().lower()
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    # tudo que não for letra/dígito/_/+/espaço/hífen vira espaço
    s = re.sub(r"[^a-z0-9_+\s\-]", " ", s)
    # espaços e hífens → underscore
    s = re.sub(r"[\s\-]+", "_", s)
    # colapsa múltiplos underscores e remove das pontas
    s = re.sub(r"_+", "_", s).strip("_")
    return s


def coerce_data(s: pd.Series) -> pd.Series:
    """
    Converte uma série de datas que pode estar em formatos mistos (ISO ou BR)
    para datetime64. Tenta primeiro ISO, depois BR.
    """
    out = pd.to_datetime(s, format="%Y-%m-%d", errors="coerce")
    falta = out.isna() & s.notna()
    if falta.any():
        # tenta BR para o que falhou
        out_br = pd.to_datetime(s[falta], format="%d/%m/%Y", errors="coerce")
        out.loc[falta] = out_br
    # último recurso: parser livre
    falta = out.isna() & s.notna()
    if falta.any():
        out.loc[falta] = pd.to_datetime(s[falta], errors="coerce", dayfirst=True)
    return out


def coerce_monetario(s: pd.Series) -> pd.Series:
    """
    Converte uma série monetária mista (float + strings 'R$ 1.234,56' ou
    '1.234,56') para float.
    """
    def parse(v):
        if pd.isna(v):
            return np.nan
        if isinstance(v, (int, float, np.integer, np.floating)):
            return float(v)
        txt = str(v).strip()
        txt = txt.replace("R$", "").replace(" ", "")
        # se tem vírgula como decimal: remove pontos de milhar, troca vírgula por ponto
        if "," in txt:
            txt = txt.replace(".", "").replace(",", ".")
        try:
            return float(txt)
        except ValueError:
            return np.nan

    return s.apply(parse).astype(float)


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  DICIONÁRIOS DE PADRONIZAÇÃO                                              ║
# ╚══════════════════════════════════════════════════════════════════════════╝

CANAIS_VALIDOS = {"ecommerce", "marketplace", "franquia", "loja_propria"}
CATEGORIAS_VALIDAS = {"skincare", "maquiagem", "perfumes", "haircare"}

# slug → canônico (quando o slug não bate com o canônico)
CANAL_ALIAS = {
    "ecommerce":     "ecommerce",
    "e_commerce":    "ecommerce",
    "marketplace":   "marketplace",
    "mkt_place":     "marketplace",
    "franquia":      "franquia",
    "franquias":     "franquia",
    "loja_propria":  "loja_propria",
    "lojapropria":   "loja_propria",
}

CATEGORIA_ALIAS = {
    "skincare":    "skincare",
    "skin_care":   "skincare",
    "maquiagem":   "maquiagem",
    "make_up":     "maquiagem",
    "perfumes":    "perfumes",
    "perfumaria":  "perfumes",
    "fragrancia":  "perfumes",
    "haircare":    "haircare",
    "hair_care":   "haircare",
}

CATEGORIA_DESPESA_ALIAS = {
    "pessoal":         "pessoal",
    "aluguel":         "aluguel",
    "marketing":       "marketing",
    "logistica":       "logistica",
    "tecnologia":      "tecnologia",
    "ti":              "tecnologia",
    "financeiro":      "financeiro",
    "administrativo":  "administrativo",
    "adm":             "administrativo",
    "depreciacao":     "depreciacao",
    "outros":          "outros",
    "diversos":        "outros",
}

UF_ALIAS = {
    "sp": "SP", "sao_paulo": "SP", "s_p": "SP",
    "rj": "RJ", "rio_de_janeiro": "RJ",
    "mg": "MG", "minas_gerais": "MG",
    "rs": "RS", "rio_grande_do_sul": "RS",
    "pr": "PR", "parana": "PR",
    "ba": "BA", "bahia": "BA",
    "sc": "SC", "santa_catarina": "SC",
    "go": "GO", "goias": "GO",
    "pe": "PE", "pernambuco": "PE",
    "df": "DF", "distrito_federal": "DF", "brasilia": "DF",
}

GENERO_ALIAS = {
    "f": "F", "feminino": "F", "fem": "F",
    "m": "M", "masculino": "M", "masc": "M",
    "ni": "NI", "nao_informado": "NI", "n_i": "NI", "n": "NI", "": "NI",
}

FAIXA_ETARIA_ALIAS = {
    "18_24": "18-24", "18_a_24": "18-24",
    "25_34": "25-34", "25_a_34": "25-34",
    "35_44": "35-44", "35_a_44": "35-44",
    "45_54": "45-54", "45_a_54": "45-54",
    "55+":   "55+",   "55_ou_mais": "55+", "55_anos+": "55+",
}

STATUS_PAGAMENTO_ALIAS = {
    "liquidado":   "liquidado",
    "pago":        "liquidado",
    "pendente":    "pendente",
    "em_aberto":   "pendente",
    "em_disputa":  "em_disputa",
    "disputa":     "em_disputa",
}


def mapear(serie: pd.Series, alias: dict, default=None) -> pd.Series:
    """Aplica slug → alias. Valores não mapeados ficam como default ou NaN."""
    slug = serie.apply(slugify)
    return slug.map(alias).fillna(default if default is not None else slug)


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  1. VENDAS                                                                ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def tratar_vendas() -> pd.DataFrame:
    print("\n📦 VENDAS")
    df = pd.read_csv(DIRTY_DIR / "vendas.csv")
    total = len(df)
    print(f"   Linhas brutas: {total:,}")

    # 1) Padroniza canal
    canais_antes = df["canal"].nunique()
    df["canal"] = mapear(df["canal"], CANAL_ALIAS)
    log_regra(f"Canal padronizado ({canais_antes}→{df['canal'].nunique()} valores)", canais_antes - df["canal"].nunique(), total)

    # 2) Padroniza categoria
    cats_antes = df["categoria"].nunique()
    df["categoria"] = mapear(df["categoria"], CATEGORIA_ALIAS)
    log_regra(f"Categoria padronizada ({cats_antes}→{df['categoria'].nunique()} valores)", cats_antes - df["categoria"].nunique(), total)

    # 3) SKU normalizado (uppercase, sem espaços)
    n_sku_alterados = (df["sku_id"] != df["sku_id"].str.strip().str.upper()).sum()
    df["sku_id"] = df["sku_id"].str.strip().str.upper()
    log_regra("SKU normalizado (uppercase, trim)", n_sku_alterados, total)

    # 4) Data normalizada (ISO)
    n_data_invalida_antes = pd.to_datetime(df["data"], errors="coerce").isna().sum()
    df["data"] = coerce_data(df["data"])
    n_data_ok = df["data"].notna().sum()
    log_regra(f"Datas convertidas para ISO ({n_data_invalida_antes} estavam não-ISO)", n_data_invalida_antes, total)

    # 5) ano_mes recalculado a partir de data (fonte única da verdade)
    df["ano_mes"] = df["data"].dt.strftime("%Y-%m")
    log_regra("ano_mes recalculado a partir de `data`", total, total)

    # 6) Colunas monetárias coercidas
    for col in ["preco_unitario", "receita_bruta", "valor_devolucao",
                "comissao_valor", "receita_liquida"]:
        df[col] = coerce_monetario(df[col])
    log_regra("Colunas monetárias coercidas para float", total, total)

    # 7) Recalcula receita_liquida onde divergente OU nula
    receita_calc = (df["receita_bruta"] - df["valor_devolucao"] - df["comissao_valor"]).round(2)
    divergentes = df["receita_liquida"].isna() | (np.abs(df["receita_liquida"] - receita_calc) > 0.05)
    n_corrigidas = divergentes.sum()
    df.loc[divergentes, "receita_liquida"] = receita_calc[divergentes]
    log_regra("Receita líquida recalculada (divergências e nulos)", n_corrigidas, len(df))

    # 8) Remove duplicatas exatas (após normalizações para que linhas equivalentes colapsem)
    n_antes = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    log_regra("Duplicatas exatas removidas", n_antes - len(df), n_antes)

    # 9) Tipagem final
    df["quantidade"] = df["quantidade"].astype("int32")
    df["devolvido"] = df["devolvido"].astype("bool")
    df["tipo_compra"] = df["tipo_compra"].astype("category")
    df["canal"] = df["canal"].astype("category")
    df["categoria"] = df["categoria"].astype("category")

    print(f"   ✅ Linhas finais: {len(df):,}")
    return df


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  2. DESPESAS                                                              ║
# ╚══════════════════════════════════════════════════════════════════════════╝

# Regra de negócio: quando o centro de custo está nulo, inferir pela categoria.
# Mapeamento conservador — só se aplica quando há um CC dominante na categoria.
CC_DEFAULT_POR_CATEGORIA = {
    "aluguel":      "operacional",
    "depreciacao":  "ativos",
    "financeiro":   "taxas_bancarias",
    "outros":       "varios",
}


def tratar_despesas() -> pd.DataFrame:
    print("\n📦 DESPESAS")
    df = pd.read_csv(DIRTY_DIR / "despesas.csv")
    total = len(df)
    print(f"   Linhas brutas: {total:,}")

    # 1) Categoria padronizada
    cats_antes = df["categoria"].nunique()
    df["categoria"] = mapear(df["categoria"], CATEGORIA_DESPESA_ALIAS)
    log_regra(f"Categoria padronizada ({cats_antes}→{df['categoria'].nunique()})", cats_antes - df["categoria"].nunique(), total)

    # 2) Centro de custo: inferir por categoria onde possível, senão flag explícita
    nulos_antes = df["centro_custo"].isna().sum()
    mask_nulo = df["centro_custo"].isna()
    df.loc[mask_nulo, "centro_custo"] = df.loc[mask_nulo, "categoria"].map(CC_DEFAULT_POR_CATEGORIA)
    # o que sobrou nulo vira "nao_classificado" (sinaliza que precisa revisão manual)
    n_imputados = mask_nulo.sum() - df["centro_custo"].isna().sum()
    df["centro_custo"] = df["centro_custo"].fillna("nao_classificado")
    log_regra(f"CC inferido por categoria (sobraram {df.eq('nao_classificado').any(axis=1).sum()} nao_classificado)", n_imputados, total)

    # 3) Datas
    df["data_competencia"] = coerce_data(df["data_competencia"])
    df["data_pagamento"] = coerce_data(df["data_pagamento"])
    log_regra("Datas convertidas para ISO (competência e pagamento)", total, total)

    # 4) Inversão competência×pagamento: se competência > pagamento, trocar
    mask_inv = df["data_competencia"] > df["data_pagamento"]
    n_inv = mask_inv.sum()
    df.loc[mask_inv, ["data_competencia", "data_pagamento"]] = \
        df.loc[mask_inv, ["data_pagamento", "data_competencia"]].values
    log_regra("Datas competência×pagamento corrigidas (inversão)", n_inv, total)

    # 5) ano_mes recalculado a partir de competência
    df["ano_mes"] = df["data_competencia"].dt.strftime("%Y-%m")
    log_regra("ano_mes recalculado a partir de data_competencia", total, total)

    # 6) Valor coercido
    df["valor"] = coerce_monetario(df["valor"])
    log_regra("Valor coercido para float", total, total)

    # 7) Duplicatas exatas
    n_antes = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    log_regra("Duplicatas exatas removidas", n_antes - len(df), n_antes)

    # 8) Tipagem
    df["categoria"] = df["categoria"].astype("category")
    df["recorrencia"] = df["recorrencia"].astype("category")

    print(f"   ✅ Linhas finais: {len(df):,}")
    return df


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  3. PAGAMENTOS                                                            ║
# ╚══════════════════════════════════════════════════════════════════════════╝

TOLERANCIA_DIVERGENCIA = 0.005  # 0,5%


def tratar_pagamentos() -> pd.DataFrame:
    print("\n📦 PAGAMENTOS")
    df = pd.read_csv(DIRTY_DIR / "pagamentos.csv")
    total = len(df)
    print(f"   Linhas brutas: {total:,}")

    # 1) Canal padronizado
    df["canal"] = mapear(df["canal"], CANAL_ALIAS)
    log_regra("Canal padronizado", total, total)

    # 2) Status padronizado
    df["status"] = mapear(df["status"], STATUS_PAGAMENTO_ALIAS)
    log_regra("Status padronizado", total, total)

    # 3) Datas
    for col in ["data_venda_ref", "data_liquidacao_gateway", "data_liquidacao_erp"]:
        df[col] = coerce_data(df[col])
    log_regra("Datas convertidas para ISO", total, total)

    # 4) Recalcula divergência (valor e %) a partir dos valores limpos
    df["divergencia_valor"] = (df["valor_erp"] - df["valor_gateway"]).round(2)
    df["divergencia_pct"] = (df["divergencia_valor"] / df["valor_gateway"] * 100).round(3)
    log_regra("Divergência valor/% recalculada", total, total)

    # 5) Flag de divergência acima da tolerância
    df["divergencia_significativa"] = df["divergencia_pct"].abs() > (TOLERANCIA_DIVERGENCIA * 100)
    n_sig = df["divergencia_significativa"].sum()
    log_regra(f"Flag de divergência >{TOLERANCIA_DIVERGENCIA*100:.1f}% setada", n_sig, total)

    # 6) Prazo real (gateway e ERP) a partir das datas limpas
    df["prazo_gateway_dias"] = (df["data_liquidacao_gateway"] - df["data_venda_ref"]).dt.days
    df["prazo_erp_dias"] = (df["data_liquidacao_erp"] - df["data_venda_ref"]).dt.days
    log_regra("Prazos recalculados a partir das datas limpas", total, total)

    # 7) Duplicatas
    n_antes = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    log_regra("Duplicatas removidas", n_antes - len(df), n_antes)

    df["canal"] = df["canal"].astype("category")
    df["status"] = df["status"].astype("category")

    print(f"   ✅ Linhas finais: {len(df):,}")
    return df


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  4. ESTOQUE                                                               ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def tratar_estoque() -> pd.DataFrame:
    print("\n📦 ESTOQUE")
    df = pd.read_csv(DIRTY_DIR / "estoque.csv")
    total = len(df)
    print(f"   Linhas brutas: {total:,}")

    # 1) SKU normalizado
    df["sku_id"] = df["sku_id"].str.strip().str.upper()
    log_regra("SKU normalizado", total, total)

    # 2) Categoria padronizada
    df["categoria"] = mapear(df["categoria"], CATEGORIA_ALIAS)
    log_regra("Categoria padronizada", total, total)

    # 3) Data de entrada coercida
    df["data_entrada"] = coerce_data(df["data_entrada"])
    log_regra("data_entrada convertida para ISO", total, total)

    # 4) aging_dias RECALCULADO em relação a DATA_REFERENCIA
    df["aging_dias"] = (DATA_REFERENCIA - df["data_entrada"]).dt.days
    log_regra(f"aging_dias recalculado vs {DATA_REFERENCIA.date()}", total, total)

    # 5) status_aging RECALCULADO a partir de aging_dias (fonte da verdade)
    def classifica_aging(dias):
        if dias > 365: return "critico"
        if dias > 180: return "alerta"
        return "normal"
    df["status_aging"] = df["aging_dias"].apply(classifica_aging)
    log_regra("status_aging recalculado (>365=critico, >180=alerta)", total, total)

    # 6) Duplicatas
    n_antes = len(df)
    df = df.drop_duplicates(subset=["lote_id"]).reset_index(drop=True)
    log_regra("Duplicatas por lote_id removidas", n_antes - len(df), n_antes)

    df["categoria"] = df["categoria"].astype("category")
    df["status_aging"] = df["status_aging"].astype("category")

    print(f"   ✅ Linhas finais: {len(df):,}")
    return df


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  5. CLIENTES                                                              ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def tratar_clientes() -> pd.DataFrame:
    print("\n📦 CLIENTES")
    df = pd.read_csv(DIRTY_DIR / "clientes.csv")
    total = len(df)
    print(f"   Linhas brutas: {total:,}")

    # 1) Canais e categoria padronizados
    df["canal_aquisicao"] = mapear(df["canal_aquisicao"], CANAL_ALIAS)
    df["categoria_preferida"] = mapear(df["categoria_preferida"], CATEGORIA_ALIAS)
    log_regra("Canal aquisição e categoria preferida padronizados", total, total)

    # 2) UF padronizada para sigla
    df["uf"] = mapear(df["uf"], UF_ALIAS)
    log_regra("UF padronizada para sigla", total, total)

    # 3) Gênero
    df["genero"] = mapear(df["genero"], GENERO_ALIAS)
    log_regra("Gênero padronizado (F/M/NI)", total, total)

    # 4) Faixa etária
    df["faixa_etaria"] = mapear(df["faixa_etaria"], FAIXA_ETARIA_ALIAS)
    log_regra("Faixa etária padronizada", total, total)

    # 5) Datas
    df["data_primeira_compra"] = coerce_data(df["data_primeira_compra"])
    df["data_ultima_compra"] = coerce_data(df["data_ultima_compra"])
    log_regra("Datas de compra convertidas para ISO", total, total)

    # 6) Inversão primeira>última: corrigir
    mask_inv = df["data_primeira_compra"] > df["data_ultima_compra"]
    n_inv = mask_inv.sum()
    df.loc[mask_inv, ["data_primeira_compra", "data_ultima_compra"]] = \
        df.loc[mask_inv, ["data_ultima_compra", "data_primeira_compra"]].values
    log_regra("Datas primeira×última corrigidas (inversão)", n_inv, total)

    # 7) is_recorrente recalculado a partir de frequencia_compras_ano (≥3)
    df["is_recorrente"] = (df["frequencia_compras_ano"] >= 3).astype(bool)
    log_regra("is_recorrente recalculado", total, total)

    # 8) Duplicatas: mantém o primeiro registro por cliente_id
    n_antes = len(df)
    df = df.drop_duplicates(subset=["cliente_id"]).reset_index(drop=True)
    log_regra("Duplicatas por cliente_id removidas", n_antes - len(df), n_antes)

    # 9) Tipagem
    df["canal_aquisicao"] = df["canal_aquisicao"].astype("category")
    df["categoria_preferida"] = df["categoria_preferida"].astype("category")
    df["uf"] = df["uf"].astype("category")
    df["genero"] = df["genero"].astype("category")
    df["faixa_etaria"] = df["faixa_etaria"].astype("category")
    df["status"] = df["status"].astype("category")

    print(f"   ✅ Linhas finais: {len(df):,}")
    return df


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  MAIN                                                                     ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def salvar(df: pd.DataFrame, nome: str) -> None:
    out = PROCESSED_DIR / f"{nome}.csv"
    df.to_csv(out, index=False, date_format="%Y-%m-%d")
    print(f"   💾 {out.relative_to(BASE_DIR)} ({len(df):,} linhas)")


if __name__ == "__main__":
    print("\n🧹 Tratamento de dados — Finance Ops & Analytics")
    print("=" * 70)

    df_vendas     = tratar_vendas();     salvar(df_vendas,     "vendas")
    df_despesas   = tratar_despesas();   salvar(df_despesas,   "despesas")
    df_pagamentos = tratar_pagamentos(); salvar(df_pagamentos, "pagamentos")
    df_estoque    = tratar_estoque();    salvar(df_estoque,    "estoque")
    df_clientes   = tratar_clientes();   salvar(df_clientes,   "clientes")

    print("\n" + "=" * 70)
    print(f"📁 Bases tratadas em: {PROCESSED_DIR}/")
    print("✅ Tratamento concluído.")
