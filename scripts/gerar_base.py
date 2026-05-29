"""
gerar_base.py
=============
Fase 1 — Finance Ops & Analytics
Geração dos datasets simulados para empresa beauty omnichannel fictícia.

Premissas:
- Período: 24 meses (Jan/2023 a Dez/2024)
- Volume: ~500 transações/mês (pequeno porte)
- Mix receita: 30% recorrente / 70% pontual
- Canal de maior peso: E-commerce próprio
- Devoluções: E-com 3% | Mktplace 8% | Franquia 5% | Loja própria 2%
"""

import pandas as pd
import numpy as np
from faker import Faker
import random
from datetime import datetime, timedelta
import os

SEED = 42
np.random.seed(SEED)
random.seed(SEED)
fake = Faker("pt_BR")
Faker.seed(SEED)

OUTPUT_DIR = "data/raw"
os.makedirs(OUTPUT_DIR, exist_ok=True)

START_DATE = datetime(2023, 1, 1)
END_DATE   = datetime(2024, 12, 31)
MESES      = pd.date_range(start=START_DATE, end=END_DATE, freq="MS")

# ── Domínios — E-commerce com maior peso ──────────────────────────────────────
CANAIS = {
    "ecommerce":     {"peso": 0.42, "comissao": 0.04, "devolucao": 0.03},
    "marketplace":   {"peso": 0.28, "comissao": 0.17, "devolucao": 0.08},
    "franquia":      {"peso": 0.18, "comissao": 0.12, "devolucao": 0.05},
    "loja_propria":  {"peso": 0.12, "comissao": 0.00, "devolucao": 0.02},
}

CATEGORIAS = {
    "skincare":  {"peso": 0.32, "margem_base": 0.62, "ticket_medio": 180},
    "maquiagem": {"peso": 0.28, "margem_base": 0.55, "ticket_medio":  95},
    "perfumes":  {"peso": 0.22, "margem_base": 0.48, "ticket_medio": 250},
    "haircare":  {"peso": 0.18, "margem_base": 0.50, "ticket_medio": 120},
}

SAZONALIDADE = {
    1: 1.15, 2: 0.92, 3: 1.08, 4: 0.95,
    5: 1.35, 6: 1.18, 7: 0.90, 8: 0.93,
    9: 0.98, 10: 1.05, 11: 1.42, 12: 1.28,
}

CRESCIMENTO_MENSAL = 1.008  # ~10% a.a.

def gerar_skus():
    skus = []
    for cat, cfg in CATEGORIAS.items():
        n = max(8, int(60 * cfg["peso"]))
        for i in range(n):
            preco = round(cfg["ticket_medio"] * np.random.uniform(0.6, 1.8), 2)
            custo = round(preco * (1 - cfg["margem_base"]) * np.random.uniform(0.9, 1.1), 2)
            skus.append({
                "sku_id":      f"SKU-{cat[:3].upper()}-{i+1:03d}",
                "categoria":   cat,
                "descricao":   f"{fake.word().capitalize()} {cat.capitalize()} {i+1}",
                "preco_bruto": preco,
                "custo":       custo,
            })
    return pd.DataFrame(skus)

SKU_DF = gerar_skus()

# ─── 1. VENDAS ────────────────────────────────────────────────────────────────
def gerar_vendas():
    registros = []
    base_volume = 500

    for idx_mes, mes_dt in enumerate(MESES):
        fator_saz   = SAZONALIDADE[mes_dt.month]
        fator_cresc = CRESCIMENTO_MENSAL ** idx_mes
        volume_mes  = int(base_volume * fator_saz * fator_cresc)

        for _ in range(volume_mes):
            canal = random.choices(list(CANAIS.keys()),
                                   weights=[v["peso"] for v in CANAIS.values()])[0]
            canal_cfg = CANAIS[canal]

            cat = random.choices(list(CATEGORIAS.keys()),
                                 weights=[v["peso"] for v in CATEGORIAS.values()])[0]
            sku_row = SKU_DF[SKU_DF["categoria"] == cat].sample(1).iloc[0]

            dia  = random.randint(1, 28)
            data = mes_dt.replace(day=dia)

            quantidade = random.choices([1, 2, 3, 4, 5], weights=[55, 25, 12, 5, 3])[0]

            desconto = np.random.choice([0, 0.05, 0.10, 0.15, 0.20],
                                        p=[0.60, 0.15, 0.12, 0.08, 0.05])
            preco_unitario = round(sku_row["preco_bruto"] * (1 - desconto), 2)
            receita_bruta  = round(preco_unitario * quantidade, 2)

            devolvido      = np.random.random() < canal_cfg["devolucao"]
            valor_devolucao = round(receita_bruta * random.uniform(0.8, 1.0), 2) if devolvido else 0.0

            comissao_pct   = canal_cfg["comissao"] + np.random.uniform(-0.01, 0.01)
            comissao_valor = round(receita_bruta * comissao_pct, 2)

            tipo_compra = random.choices(["recorrente", "pontual"], weights=[0.30, 0.70])[0]

            registros.append({
                "transacao_id":    f"TXN-{len(registros)+1:07d}",
                "data":            data.strftime("%Y-%m-%d"),
                "ano_mes":         data.strftime("%Y-%m"),
                "canal":           canal,
                "sku_id":          sku_row["sku_id"],
                "categoria":       sku_row["categoria"],
                "quantidade":      quantidade,
                "preco_unitario":  preco_unitario,
                "receita_bruta":   receita_bruta,
                "desconto_pct":    round(desconto * 100, 1),
                "valor_devolucao": valor_devolucao,
                "devolvido":       devolvido,
                "comissao_pct":    round(comissao_pct * 100, 2),
                "comissao_valor":  comissao_valor,
                "receita_liquida": round(receita_bruta - valor_devolucao - comissao_valor, 2),
                "tipo_compra":     tipo_compra,
            })

    df = pd.DataFrame(registros)
    df.to_csv(f"{OUTPUT_DIR}/vendas.csv", index=False)
    print(f"✅ vendas.csv — {len(df):,} registros")
    return df

# ─── 2. ESTOQUE ───────────────────────────────────────────────────────────────
def gerar_estoque():
    registros = []
    for _, sku in SKU_DF.iterrows():
        n_lotes = random.randint(2, 5)
        for _ in range(n_lotes):
            data_entrada   = START_DATE + timedelta(days=random.randint(0, 700))
            quantidade     = random.randint(20, 300)
            custo_unitario = round(sku["custo"] * np.random.uniform(0.95, 1.05), 2)
            aging_dias     = (END_DATE - data_entrada).days
            status = ("crítico" if aging_dias > 365 else
                      "alerta"  if aging_dias > 180 else "normal")

            registros.append({
                "lote_id":        f"LOTE-{len(registros)+1:06d}",
                "sku_id":         sku["sku_id"],
                "categoria":      sku["categoria"],
                "descricao":      sku["descricao"],
                "data_entrada":   data_entrada.strftime("%Y-%m-%d"),
                "quantidade":     quantidade,
                "custo_unitario": custo_unitario,
                "custo_total":    round(quantidade * custo_unitario, 2),
                "aging_dias":     aging_dias,
                "status_aging":   status,
            })

    df = pd.DataFrame(registros)
    df.to_csv(f"{OUTPUT_DIR}/estoque.csv", index=False)
    print(f"✅ estoque.csv — {len(df):,} registros")
    return df

# ─── 3. DESPESAS ──────────────────────────────────────────────────────────────
ESTRUTURA_DESPESAS = [
    ("pessoal",        "administrativo",  28000, "mensal",     0.05),
    ("pessoal",        "comercial",       14000, "mensal",     0.08),
    ("pessoal",        "logistica",        9000, "mensal",     0.06),
    ("aluguel",        "operacional",      6500, "mensal",     0.00),
    ("aluguel",        "estoque",          3000, "mensal",     0.00),
    ("marketing",      "digital",         10000, "mensal",     0.25),
    ("marketing",      "trade",            3500, "mensal",     0.30),
    ("logistica",      "frete_saida",      7000, "mensal",     0.20),
    ("logistica",      "armazenagem",      3000, "mensal",     0.12),
    ("tecnologia",     "plataformas",      4500, "mensal",     0.05),
    ("tecnologia",     "erp_gateway",      2200, "mensal",     0.00),
    ("financeiro",     "taxas_bancarias",  1300, "mensal",     0.10),
    ("financeiro",     "juros",               0, "esporadico", 0.00),
    ("administrativo", "juridico",         1800, "trimestral", 0.15),
    ("administrativo", "contabilidade",    2500, "mensal",     0.00),
    ("depreciacao",    "ativos",           2200, "mensal",     0.00),
    ("outros",         "varios",            900, "mensal",     0.35),
]

def gerar_despesas():
    registros = []
    for mes_dt in MESES:
        for cat, cc, valor_base, recorrencia, variab in ESTRUTURA_DESPESAS:
            if recorrencia == "trimestral" and mes_dt.month % 3 != 1:
                continue
            if recorrencia == "esporadico" and random.random() > 0.3:
                continue

            fator = SAZONALIDADE[mes_dt.month] if cat == "marketing" else 1.0

            if cat == "financeiro" and cc == "juros":
                if mes_dt.month in [2, 3, 7, 8]:
                    valor_base = random.randint(800, 5000)
                else:
                    continue

            n_lanc = random.randint(1, 3) if recorrencia == "mensal" else 1
            for _ in range(n_lanc):
                valor      = round(valor_base * fator * np.random.uniform(1 - variab, 1 + variab) / n_lanc, 2)
                data_comp  = mes_dt + timedelta(days=random.randint(0, 27))
                data_pgto  = data_comp + timedelta(days=random.randint(0, 15))

                registros.append({
                    "lancamento_id":    f"EXP-{len(registros)+1:06d}",
                    "data_competencia": data_comp.strftime("%Y-%m-%d"),
                    "data_pagamento":   data_pgto.strftime("%Y-%m-%d"),
                    "ano_mes":          mes_dt.strftime("%Y-%m"),
                    "categoria":        cat,
                    "centro_custo":     cc,
                    "descricao":        f"{cat.replace('_',' ').title()} — {cc.replace('_',' ').title()}",
                    "valor":            valor,
                    "recorrencia":      recorrencia,
                    "fornecedor":       fake.company(),
                    "nota_fiscal":      f"NF-{random.randint(10000,99999)}",
                    "aprovado_por":     random.choice(["financeiro", "diretoria", "gestão"]),
                })

    df = pd.DataFrame(registros)
    df.to_csv(f"{OUTPUT_DIR}/despesas.csv", index=False)
    print(f"✅ despesas.csv — {len(df):,} registros")
    return df

# ─── 4. PAGAMENTOS ────────────────────────────────────────────────────────────
PRAZOS = {
    "ecommerce":     {"gateway_dias": 2,  "erp_dias": 14, "taxa_gateway": 0.0149},
    "marketplace":   {"gateway_dias": 2,  "erp_dias": 30, "taxa_gateway": 0.0199},
    "franquia":      {"gateway_dias": 0,  "erp_dias": 21, "taxa_gateway": 0.0000},
    "loja_propria":  {"gateway_dias": 1,  "erp_dias": 3,  "taxa_gateway": 0.0229},
}

def gerar_pagamentos(df_vendas):
    registros = []
    agg = (df_vendas.groupby(["ano_mes", "canal"])["receita_liquida"]
           .sum().reset_index())

    for _, row in agg.iterrows():
        canal  = row["canal"]
        cfg    = PRAZOS[canal]
        mes_dt = datetime.strptime(row["ano_mes"] + "-01", "%Y-%m-%d")
        valor  = row["receita_liquida"]

        div_pct     = np.random.choice([0, 0.002, -0.003, 0.005], p=[0.7, 0.1, 0.1, 0.1])
        valor_gw    = round(valor * (1 - cfg["taxa_gateway"]), 2)
        valor_erp   = round(valor_gw * (1 + div_pct), 2)
        data_venda  = mes_dt + timedelta(days=15)

        registros.append({
            "pagamento_id":              f"PAG-{len(registros)+1:06d}",
            "ano_mes":                   row["ano_mes"],
            "canal":                     canal,
            "data_venda_ref":            data_venda.strftime("%Y-%m-%d"),
            "data_liquidacao_gateway":   (data_venda + timedelta(days=cfg["gateway_dias"])).strftime("%Y-%m-%d"),
            "data_liquidacao_erp":       (data_venda + timedelta(days=cfg["erp_dias"])).strftime("%Y-%m-%d"),
            "valor_bruto":               round(valor, 2),
            "taxa_gateway_pct":          round(cfg["taxa_gateway"] * 100, 2),
            "taxa_gateway_valor":        round(valor * cfg["taxa_gateway"], 2),
            "valor_gateway":             valor_gw,
            "valor_erp":                 valor_erp,
            "divergencia_valor":         round(valor_erp - valor_gw, 2),
            "divergencia_pct":           round(div_pct * 100, 3),
            "prazo_gateway_dias":        cfg["gateway_dias"],
            "prazo_erp_dias":            cfg["erp_dias"],
            "status":                    random.choices(["liquidado","pendente","em_disputa"],
                                                        weights=[0.85, 0.10, 0.05])[0],
        })

    df = pd.DataFrame(registros)
    df.to_csv(f"{OUTPUT_DIR}/pagamentos.csv", index=False)
    print(f"✅ pagamentos.csv — {len(df):,} registros")
    return df

# ─── 5. CLIENTES ──────────────────────────────────────────────────────────────
def gerar_clientes(df_vendas):
    n_clientes = 2200

    clientes = []
    for i in range(n_clientes):
        canal_aq = random.choices(list(CANAIS.keys()),
                                  weights=[v["peso"] for v in CANAIS.values()])[0]
        cat_pref = random.choices(list(CATEGORIAS.keys()),
                                  weights=[v["peso"] for v in CATEGORIAS.values()])[0]
        ticket   = round(CATEGORIAS[cat_pref]["ticket_medio"] * np.random.uniform(0.5, 2.2), 2)
        freq     = random.choices([1, 2, 3, 4, 6, 12], weights=[25, 30, 20, 12, 8, 5])[0]

        data_primeira = START_DATE + timedelta(days=random.randint(0, 650))
        data_ultima   = min(data_primeira + timedelta(days=random.randint(0, 400)), END_DATE)

        clientes.append({
            "cliente_id":             f"CLI-{i+1:06d}",
            "canal_aquisicao":        canal_aq,
            "categoria_preferida":    cat_pref,
            "data_primeira_compra":   data_primeira.strftime("%Y-%m-%d"),
            "data_ultima_compra":     data_ultima.strftime("%Y-%m-%d"),
            "frequencia_compras_ano": freq,
            "ticket_medio":           ticket,
            "ltv_estimado":           round(ticket * freq * np.random.uniform(1.5, 3.0), 2),
            "is_recorrente":          freq >= 3,
            "status":                 random.choices(["ativo","em_risco","inativo"],
                                                     weights=[0.55, 0.20, 0.25])[0],
            "uf":                     random.choices(
                                          ["SP","RJ","MG","RS","PR","BA","SC","GO","PE","DF"],
                                          weights=[35,15,12,8,7,5,5,4,4,5])[0],
            "genero":                 random.choices(["F","M","NI"], weights=[72,22,6])[0],
            "faixa_etaria":           random.choices(["18-24","25-34","35-44","45-54","55+"],
                                                     weights=[18,32,28,14,8])[0],
        })

    df = pd.DataFrame(clientes)
    df.to_csv(f"{OUTPUT_DIR}/clientes.csv", index=False)
    print(f"✅ clientes.csv — {len(df):,} registros")
    return df

# ─── MAIN ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n🚀 Iniciando geração dos datasets — Finance Ops & Analytics\n")
    print("=" * 60)

    df_vendas   = gerar_vendas()
    df_estoque  = gerar_estoque()
    df_despesas = gerar_despesas()
    df_pagtos   = gerar_pagamentos(df_vendas)
    df_clientes = gerar_clientes(df_vendas)

    print("\n" + "=" * 60)
    print("📊 Resumo dos datasets gerados:")
    print(f"   vendas.csv     — {len(df_vendas):>7,} linhas | R$ {df_vendas['receita_bruta'].sum():>12,.2f} receita bruta total")
    print(f"   estoque.csv    — {len(df_estoque):>7,} linhas | R$ {df_estoque['custo_total'].sum():>12,.2f} custo total em estoque")
    print(f"   despesas.csv   — {len(df_despesas):>7,} linhas | R$ {df_despesas['valor'].sum():>12,.2f} despesas totais")
    print(f"   pagamentos.csv — {len(df_pagtos):>7,} linhas")
    print(f"   clientes.csv   — {len(df_clientes):>7,} linhas")
    print(f"\n📁 Arquivos salvos em: {OUTPUT_DIR}/")
    print("\n✅ Fase 1 concluída.")
