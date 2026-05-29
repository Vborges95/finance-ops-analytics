"""
consolidacao.py
===============
Fase 2 — Finance Ops & Analytics
Integra as 5 bases tratadas em visões consolidadas no formato fato/dimensão e
carrega tudo em um banco SQLite (`finance_ops.db`) que sustenta as análises
da `queries_analiticas.sql`.

Saídas em `data/analytics/`
---------------------------
- finance_ops.db       — SQLite com todas as tabelas
- fato_vendas.csv      — vendas enriquecidas com custo unitário médio e margem
- fato_pagamentos.csv  — pagamentos com reconciliação resumida
- dim_sku.csv          — dimensão SKU (categoria, custo médio)
- dim_calendario.csv   — calendário mensal (24 meses)

Lógica de integração
--------------------
1. fato_vendas = vendas × custo_médio_por_sku (de estoque, ponderado por qtde)
   → permite calcular margem de contribuição por linha
2. dim_sku consolida SKU+categoria+custo médio
3. dim_calendario alimenta análises temporais
4. dim_cliente herda direto de clientes (após tratamento)
5. fato_pagamentos = pagamentos com flags pré-calculadas

Por que esta etapa existe
-------------------------
Análises de FP&A raramente são feitas sobre tabelas operacionais cruas.
Esta camada de consolidação é o "modelo dimensional leve" que dá performance
para queries analíticas e clareza conceitual para Fase 3 (modelo financeiro)
e Fase 4 (dashboard).
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
ANALYTICS_DIR = BASE_DIR / "data" / "analytics"
ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = ANALYTICS_DIR / "finance_ops.db"


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  DIMENSÕES                                                                ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def construir_dim_sku(vendas: pd.DataFrame, estoque: pd.DataFrame) -> pd.DataFrame:
    """
    Dimensão SKU: cada SKU com sua categoria e custo unitário médio ponderado
    pela quantidade dos lotes em estoque (proxy de custo de venda).
    """
    custo_medio = (estoque
                   .groupby("sku_id")
                   .apply(lambda g: np.average(g["custo_unitario"], weights=g["quantidade"]),
                          include_groups=False)
                   .rename("custo_unitario_medio")
                   .reset_index())

    # Pega categoria via vendas (mais frequente por SKU); fallback para estoque
    cat_vendas = (vendas.groupby("sku_id")["categoria"]
                  .agg(lambda s: s.mode().iat[0])
                  .reset_index())
    cat_estoque = (estoque.groupby("sku_id")["categoria"]
                   .agg(lambda s: s.mode().iat[0])
                   .reset_index().rename(columns={"categoria": "categoria_estoque"}))

    dim = (cat_vendas.merge(cat_estoque, on="sku_id", how="outer")
                     .merge(custo_medio, on="sku_id", how="left"))
    dim["categoria"] = dim["categoria"].fillna(dim["categoria_estoque"])
    dim = dim.drop(columns=["categoria_estoque"])

    # Preço médio praticado em vendas
    preco_medio = (vendas.groupby("sku_id")["preco_unitario"]
                   .mean().round(2)
                   .rename("preco_unitario_medio").reset_index())
    dim = dim.merge(preco_medio, on="sku_id", how="left")
    dim["margem_unitaria_estimada"] = (dim["preco_unitario_medio"] - dim["custo_unitario_medio"]).round(2)
    dim["margem_pct_estimada"] = (dim["margem_unitaria_estimada"] / dim["preco_unitario_medio"] * 100).round(2)
    return dim.sort_values("sku_id").reset_index(drop=True)


def construir_dim_calendario() -> pd.DataFrame:
    """Calendário mensal cobrindo o período da base (24 meses)."""
    datas = pd.date_range("2023-01-01", "2024-12-31", freq="MS")
    dim = pd.DataFrame({"ano_mes": datas.strftime("%Y-%m"),
                        "ano": datas.year,
                        "trimestre": (datas.month - 1) // 3 + 1,
                        "mes_num": datas.month,
                        "mes_nome": datas.strftime("%b")})
    dim["periodo"] = dim["ano"].astype(str) + "-T" + dim["trimestre"].astype(str)
    dim["is_alta_temporada"] = dim["mes_num"].isin([5, 11, 12])  # Mães, Black Friday, Natal
    return dim


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  FATOS                                                                    ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def construir_fato_vendas(vendas: pd.DataFrame, dim_sku: pd.DataFrame) -> pd.DataFrame:
    """
    fato_vendas = vendas + custo médio do SKU + métricas derivadas:
      - custo_total_estimado = custo_unitario_medio * quantidade
      - margem_contribuicao  = receita_liquida - custo_total_estimado
      - margem_pct           = margem / receita_liquida
    """
    fato = vendas.merge(
        dim_sku[["sku_id", "custo_unitario_medio"]],
        on="sku_id", how="left"
    )
    fato["custo_total_estimado"] = (fato["quantidade"] * fato["custo_unitario_medio"]).round(2)
    fato["margem_contribuicao"] = (fato["receita_liquida"] - fato["custo_total_estimado"]).round(2)
    fato["margem_pct"] = np.where(
        fato["receita_liquida"] != 0,
        (fato["margem_contribuicao"] / fato["receita_liquida"] * 100).round(2),
        np.nan,
    )
    return fato


def construir_fato_pagamentos(pagamentos: pd.DataFrame) -> pd.DataFrame:
    """fato_pagamentos = pagamentos + flags pré-calculadas para reconciliação."""
    fato = pagamentos.copy()
    fato["float_dias"] = fato["prazo_erp_dias"] - fato["prazo_gateway_dias"]
    fato["tipo_divergencia"] = pd.cut(
        fato["divergencia_pct"].abs(),
        bins=[-0.001, 0.5, 1.0, np.inf],
        labels=["aceitavel", "moderada", "alta"]
    )
    return fato


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  PERSISTÊNCIA: CSVs + SQLite                                              ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def persistir_sqlite(tabelas: dict[str, pd.DataFrame]) -> None:
    """Salva todas as tabelas em finance_ops.db, sobrescrevendo se já existir."""
    if DB_PATH.exists():
        DB_PATH.unlink()
    con = sqlite3.connect(DB_PATH)
    try:
        for nome, df in tabelas.items():
            df.to_sql(nome, con, index=False, if_exists="replace")
            print(f"   📊 {nome:<22} {len(df):>6,} linhas")

        # Índices para acelerar joins/filtros mais comuns
        cur = con.cursor()
        cur.executescript("""
            CREATE INDEX IF NOT EXISTS ix_fato_vendas_anomes ON fato_vendas(ano_mes);
            CREATE INDEX IF NOT EXISTS ix_fato_vendas_canal  ON fato_vendas(canal);
            CREATE INDEX IF NOT EXISTS ix_fato_vendas_sku    ON fato_vendas(sku_id);
            CREATE INDEX IF NOT EXISTS ix_despesas_anomes    ON despesas(ano_mes);
            CREATE INDEX IF NOT EXISTS ix_despesas_cat       ON despesas(categoria);
            CREATE INDEX IF NOT EXISTS ix_pagto_anomes       ON fato_pagamentos(ano_mes);
            CREATE INDEX IF NOT EXISTS ix_clientes_id        ON clientes(cliente_id);
            CREATE INDEX IF NOT EXISTS ix_estoque_sku        ON estoque(sku_id);
        """)
        con.commit()
        print(f"   🔑 8 índices criados")
    finally:
        con.close()


def salvar_csv(df: pd.DataFrame, nome: str) -> None:
    df.to_csv(ANALYTICS_DIR / f"{nome}.csv", index=False, date_format="%Y-%m-%d")


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  MAIN                                                                     ║
# ╚══════════════════════════════════════════════════════════════════════════╝

if __name__ == "__main__":
    print("\n🔗 Consolidação multi-canal — Finance Ops & Analytics")
    print("=" * 70)

    # Lê bases tratadas
    print("\n📥 Carregando bases tratadas …")
    vendas     = pd.read_csv(PROCESSED_DIR / "vendas.csv", parse_dates=["data"])
    despesas   = pd.read_csv(PROCESSED_DIR / "despesas.csv",
                             parse_dates=["data_competencia", "data_pagamento"])
    pagamentos = pd.read_csv(PROCESSED_DIR / "pagamentos.csv",
                             parse_dates=["data_venda_ref",
                                          "data_liquidacao_gateway",
                                          "data_liquidacao_erp"])
    estoque    = pd.read_csv(PROCESSED_DIR / "estoque.csv", parse_dates=["data_entrada"])
    clientes   = pd.read_csv(PROCESSED_DIR / "clientes.csv",
                             parse_dates=["data_primeira_compra", "data_ultima_compra"])
    print(f"   vendas={len(vendas):,} | despesas={len(despesas):,} | pagamentos={len(pagamentos):,}"
          f" | estoque={len(estoque):,} | clientes={len(clientes):,}")

    # Constrói dimensões
    print("\n🏗️  Construindo dimensões …")
    dim_sku = construir_dim_sku(vendas, estoque)
    dim_calendario = construir_dim_calendario()
    print(f"   dim_sku        — {len(dim_sku):,} SKUs únicos")
    print(f"   dim_calendario — {len(dim_calendario):,} meses")

    # Constrói fatos
    print("\n🏗️  Construindo fatos …")
    fato_vendas = construir_fato_vendas(vendas, dim_sku)
    fato_pagamentos = construir_fato_pagamentos(pagamentos)
    print(f"   fato_vendas      — {len(fato_vendas):,} transações enriquecidas")
    print(f"   fato_pagamentos  — {len(fato_pagamentos):,} liquidações")

    # Salva CSVs analíticos
    print("\n💾 Salvando CSVs analíticos …")
    for nome, df in [
        ("fato_vendas", fato_vendas),
        ("fato_pagamentos", fato_pagamentos),
        ("dim_sku", dim_sku),
        ("dim_calendario", dim_calendario),
    ]:
        salvar_csv(df, nome)
        print(f"   data/analytics/{nome}.csv")

    # Persiste tudo no SQLite
    print(f"\n💾 Carregando tudo em SQLite ({DB_PATH.relative_to(BASE_DIR)}) …")
    persistir_sqlite({
        # fatos
        "fato_vendas":     fato_vendas,
        "fato_pagamentos": fato_pagamentos,
        # dimensões
        "dim_sku":         dim_sku,
        "dim_calendario":  dim_calendario,
        "clientes":        clientes,
        # operacional bruto (útil para validações)
        "despesas":        despesas,
        "estoque":         estoque,
    })

    print("\n" + "=" * 70)
    print("✅ Consolidação concluída.")
