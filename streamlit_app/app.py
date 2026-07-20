"""
Finance Ops & Analytics — Dashboard Streamlit
==============================================
Empresa fictícia do setor beauty omnichannel.

Este app lê os datasets em data/raw/ e reconstrói, em Python puro,
os principais painéis financeiros e operacionais do case:
DRE gerencial simplificada, evolução de margem, capital de giro e KPIs.

Observação metodológica:
- vendas.csv não contém CMV por transação. A margem bruta detalhada
  vive no modelo Excel (Fase 3). Aqui, para manter consistência com o
  dado bruto, trabalhamos com Receita Líquida (já deduzidas comissões
  e devoluções) e derivamos o resultado operacional subtraindo as
  despesas por competência de despesas.csv. Onde um KPI depende do
  modelo Excel, isso é sinalizado na interface.

Autor: Vinicius Borges — github.com/Vborges95/finance-ops-analytics
"""

import os
import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

# ----------------------------------------------------------------------
# Configuração da página
# ----------------------------------------------------------------------
st.set_page_config(
    page_title="Finance Ops & Analytics — Beauty Omnichannel",
    page_icon="💚",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Identidade visual (inspiração O Boticário — verde escuro do dashboard)
VERDE = "#07130F"
VERDE_CLARO = "#0E6E4E"
ACCENT = "#1FB980"
PALETA = ["#0E6E4E", "#1FB980", "#5FD9AA", "#A7E8CE", "#07130F"]

st.markdown(
    f"""
    <style>
    .stApp {{ background-color: #FAFDFB; }}
    h1, h2, h3 {{ color: {VERDE}; }}
    [data-testid="stMetricValue"] {{ color: {VERDE}; }}
    [data-testid="stSidebar"] {{ background-color: #F0F7F3; }}
    </style>
    """,
    unsafe_allow_html=True,
)

# ----------------------------------------------------------------------
# Localização dos dados (funciona local e no Streamlit Cloud)
# ----------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Tenta base tratada; se vazia, cai para raw
CANDIDATOS = [
    os.path.join(BASE_DIR, "..", "data", "processed"),
    os.path.join(BASE_DIR, "..", "data", "raw"),
    os.path.join(BASE_DIR, "data"),
]


def achar_data_dir():
    for d in CANDIDATOS:
        if os.path.isdir(d) and os.path.exists(os.path.join(d, "vendas.csv")):
            return d
    return CANDIDATOS[1]  # fallback raw


DATA_DIR = achar_data_dir()


@st.cache_data
def carregar_dados():
    vendas = pd.read_csv(os.path.join(DATA_DIR, "vendas.csv"), parse_dates=["data"])
    estoque = pd.read_csv(os.path.join(DATA_DIR, "estoque.csv"), parse_dates=["data_entrada"])
    despesas = pd.read_csv(os.path.join(DATA_DIR, "despesas.csv"), parse_dates=["data_competencia"])
    pagamentos = pd.read_csv(os.path.join(DATA_DIR, "pagamentos.csv"))
    clientes = pd.read_csv(os.path.join(DATA_DIR, "clientes.csv"))
    return vendas, estoque, despesas, pagamentos, clientes


vendas, estoque, despesas, pagamentos, clientes = carregar_dados()

# ----------------------------------------------------------------------
# Sidebar — filtros
# ----------------------------------------------------------------------
st.sidebar.title("Filtros")

canais_disp = sorted(vendas["canal"].unique())
canais_sel = st.sidebar.multiselect(
    "Canal", options=canais_disp, default=canais_disp
)

meses_disp = sorted(vendas["ano_mes"].unique())
mes_ini, mes_fim = st.sidebar.select_slider(
    "Período (ano-mês)",
    options=meses_disp,
    value=(meses_disp[0], meses_disp[-1]),
)

cats_disp = sorted(vendas["categoria"].unique())
cats_sel = st.sidebar.multiselect(
    "Categoria", options=cats_disp, default=cats_disp
)

st.sidebar.markdown("---")
st.sidebar.caption(
    f"Fonte de dados: `{os.path.relpath(DATA_DIR, BASE_DIR)}`\n\n"
    "Receita Líquida = receita bruta − comissões − devoluções."
)

# Aplicar filtros
mask = (
    vendas["canal"].isin(canais_sel)
    & vendas["categoria"].isin(cats_sel)
    & (vendas["ano_mes"] >= mes_ini)
    & (vendas["ano_mes"] <= mes_fim)
)
v = vendas[mask].copy()

desp = despesas[
    (despesas["ano_mes"] >= mes_ini) & (despesas["ano_mes"] <= mes_fim)
].copy()

# ----------------------------------------------------------------------
# Cabeçalho
# ----------------------------------------------------------------------
st.title("Finance Ops & Analytics")
st.markdown(
    f"**Beauty Omnichannel** · período **{mes_ini} → {mes_fim}** · "
    f"canais: {', '.join(canais_sel) if canais_sel else '—'}"
)

if v.empty:
    st.warning("Nenhum dado para os filtros selecionados.")
    st.stop()

# ----------------------------------------------------------------------
# KPIs principais
# ----------------------------------------------------------------------
receita_liq = v["receita_liquida"].sum()
receita_bruta = v["receita_bruta"].sum()
devolucoes = v["valor_devolucao"].sum()
comissoes = v["comissao_valor"].sum()
despesa_total = desp["valor"].sum()
resultado_op = receita_liq - despesa_total
margem_op = (resultado_op / receita_liq * 100) if receita_liq else 0
taxa_dev = (devolucoes / receita_bruta * 100) if receita_bruta else 0
ticket = v.groupby("transacao_id")["receita_liquida"].sum().mean()
pct_recorrente = (
    v[v["tipo_compra"] == "recorrente"]["receita_liquida"].sum() / receita_liq * 100
    if receita_liq else 0
)

c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("Receita Líquida", f"R$ {receita_liq/1e6:.2f}M")
c2.metric("Resultado Operacional", f"R$ {resultado_op/1e6:.2f}M", f"{margem_op:.1f}% margem")
c3.metric("Taxa de Devolução", f"{taxa_dev:.1f}%")
c4.metric("Ticket Médio", f"R$ {ticket:.0f}")
c5.metric("% Receita Recorrente", f"{pct_recorrente:.1f}%")

st.markdown("---")

# ----------------------------------------------------------------------
# Linha 1 — Evolução de receita e DRE por canal
# ----------------------------------------------------------------------
col_a, col_b = st.columns([3, 2])

with col_a:
    st.subheader("Evolução da Receita Líquida")
    serie = (
        v.groupby(["ano_mes", "canal"])["receita_liquida"].sum().reset_index()
    )
    fig = px.area(
        serie, x="ano_mes", y="receita_liquida", color="canal",
        color_discrete_sequence=PALETA,
    )
    fig.update_layout(
        margin=dict(l=0, r=0, t=10, b=0), height=340,
        legend_title_text="", xaxis_title="", yaxis_title="R$",
        plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(fig, use_container_width=True)

with col_b:
    st.subheader("Receita por Canal")
    por_canal = (
        v.groupby("canal")["receita_liquida"].sum().sort_values(ascending=True)
    )
    fig2 = go.Figure(
        go.Bar(
            x=por_canal.values, y=por_canal.index, orientation="h",
            marker_color=ACCENT,
            text=[f"R$ {x/1e6:.2f}M" for x in por_canal.values],
            textposition="auto",
        )
    )
    fig2.update_layout(
        margin=dict(l=0, r=0, t=10, b=0), height=340,
        xaxis_title="", yaxis_title="",
        plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(fig2, use_container_width=True)

# ----------------------------------------------------------------------
# Linha 2 — DRE gerencial simplificada
# ----------------------------------------------------------------------
st.subheader("DRE Gerencial Simplificada")
st.caption(
    "Reconstruída a partir do dado bruto. CMV/margem bruta detalhada "
    "estão no modelo Excel (Fase 3) — aqui partimos da Receita Líquida."
)

dre = pd.DataFrame(
    {
        "Linha": [
            "Receita Bruta",
            "(−) Comissões",
            "(−) Devoluções",
            "(=) Receita Líquida",
            "(−) Despesas Operacionais",
            "(=) Resultado Operacional",
        ],
        "Valor (R$)": [
            receita_bruta,
            -comissoes,
            -devolucoes,
            receita_liq,
            -despesa_total,
            resultado_op,
        ],
    }
)
dre["% Rec. Líquida"] = dre["Valor (R$)"] / receita_liq * 100
st.dataframe(
    dre.style.format({"Valor (R$)": "R$ {:,.0f}", "% Rec. Líquida": "{:.1f}%"}),
    use_container_width=True, hide_index=True,
)

# Despesas por categoria
col_c, col_d = st.columns(2)
with col_c:
    st.subheader("Despesas por Categoria")
    dcat = desp.groupby("categoria")["valor"].sum().sort_values(ascending=False)
    figd = px.bar(
        dcat, color_discrete_sequence=[VERDE_CLARO],
    )
    figd.update_layout(
        margin=dict(l=0, r=0, t=10, b=0), height=300, showlegend=False,
        xaxis_title="", yaxis_title="R$",
        plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(figd, use_container_width=True)

with col_d:
    st.subheader("Receita por Categoria de Produto")
    pcat = v.groupby("categoria")["receita_liquida"].sum()
    figp = px.pie(
        values=pcat.values, names=pcat.index, hole=0.55,
        color_discrete_sequence=PALETA,
    )
    figp.update_layout(
        margin=dict(l=0, r=0, t=10, b=0), height=300,
        plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(figp, use_container_width=True)

# ----------------------------------------------------------------------
# Linha 3 — Capital de giro e estoque
# ----------------------------------------------------------------------
st.markdown("---")
st.subheader("Capital de Giro & Estoque")

# PMR a partir de pagamentos (prazo ERP = quando o caixa realmente entra)
pmr = pagamentos["prazo_erp_dias"].mean()
pmr_gateway = pagamentos["prazo_gateway_dias"].mean()
# Estoque: cobertura simples = custo estoque / (despesa media mensal como proxy)
custo_estoque = estoque["custo_total"].sum()
criticos = estoque[estoque["status_aging"] == "crítico"]["custo_total"].sum()
pct_critico = criticos / custo_estoque * 100 if custo_estoque else 0

k1, k2, k3, k4 = st.columns(4)
k1.metric("PMR (ERP)", f"{pmr:.0f} dias", help="Prazo médio até o caixa entrar no ERP")
k2.metric("PMR (Gateway)", f"{pmr_gateway:.0f} dias", help="Liquidação no gateway")
k3.metric("Estoque (custo)", f"R$ {custo_estoque/1e6:.2f}M")
k4.metric("Estoque Crítico", f"{pct_critico:.1f}%", help="Aging em status crítico")

col_e, col_f = st.columns(2)
with col_e:
    st.subheader("Aging de Estoque")
    aging = estoque.groupby("status_aging")["custo_total"].sum()
    ordem = ["normal", "alerta", "crítico"]
    aging = aging.reindex([o for o in ordem if o in aging.index])
    figa = px.bar(
        aging, color=aging.index,
        color_discrete_map={"normal": ACCENT, "alerta": "#E8B84B", "crítico": "#D9534F"},
    )
    figa.update_layout(
        margin=dict(l=0, r=0, t=10, b=0), height=300, showlegend=False,
        xaxis_title="", yaxis_title="R$ (custo)",
        plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(figa, use_container_width=True)

with col_f:
    st.subheader("Gap de Liquidação: Gateway vs ERP")
    st.markdown(
        f"""
        O caixa liquida no **gateway em ~{pmr_gateway:.0f} dia(s)**, mas só é
        reconhecido no **ERP em ~{pmr:.0f} dias**. Esse gap de
        **{pmr - pmr_gateway:.0f} dias** é um dos pontos centrais do case:
        a operação tinha caixa disponível antes do que o controle enxergava,
        distorcendo a leitura de capital de giro.

        Ver detalhamento completo (NCG, ciclo financeiro) no modelo Excel
        e no benchmark Natura do repositório.
        """
    )

# ----------------------------------------------------------------------
# Rodapé
# ----------------------------------------------------------------------
st.markdown("---")
st.caption(
    "Finance Ops & Analytics · case de portfólio · dados simulados · "
    "github.com/Vborges95/finance-ops-analytics"
)
