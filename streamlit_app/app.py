"""
Finance Ops & Analytics — Dashboard Streamlit
==============================================
Empresa fictícia do setor beauty omnichannel.

Versão Streamlit equivalente ao dashboard React do repositório.
Consome os MESMOS números consolidados do modelo financeiro (Fase 3),
extraídos de dados_consolidados.json — que é o objeto DATA usado pelo
dashboard React. Assim os dois dashboards mostram valores idênticos:
DRE gerencial completa (22 linhas), margem de contribuição, EBITDA,
capital de giro (NCG, ciclo financeiro, PMR por canal), aging de
estoque, top SKUs e ROI da transformação operacional.

Autor: Vinicius Borges — github.com/Vborges95/finance-ops-analytics
"""

import os
import json
import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

# ----------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------
st.set_page_config(
    page_title="Finance Ops & Analytics — Beauty Omnichannel",
    page_icon="💚",
    layout="wide",
    initial_sidebar_state="expanded",
)

VERDE = "#07130F"
VERDE_MED = "#0E6E4E"
ACCENT = "#00B884"
VERMELHO = "#D9534F"
AMBAR = "#E8B84B"
CANAL_COLORS = {
    "E-commerce": "#00B884",
    "Marketplace": "#0E6E4E",
    "Franquia": "#5FD9AA",
    "Loja Própria": "#A7E8CE",
}
PALETA = ["#00B884", "#0E6E4E", "#5FD9AA", "#A7E8CE", "#07130F"]

st.markdown(
    f"""
    <style>
    .stApp {{ background-color: #FAFDFB; }}
    h1, h2, h3 {{ color: {VERDE}; }}
    [data-testid="stMetricValue"] {{ color: {VERDE}; font-size: 1.5rem; }}
    [data-testid="stSidebar"] {{ background-color: #F0F7F3; }}
    </style>
    """,
    unsafe_allow_html=True,
)

# ----------------------------------------------------------------------
# Carregar dados consolidados (mesmos do React) + CSVs raw p/ detalhe cliente
# ----------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


@st.cache_data
def carregar():
    with open(os.path.join(BASE_DIR, "dados_consolidados.json"), encoding="utf-8") as f:
        data = json.load(f)
    # clientes raw (opcional, p/ aba de clientes)
    clientes = None
    for c in [os.path.join(BASE_DIR, "..", "data", "raw", "clientes.csv")]:
        if os.path.exists(c):
            clientes = pd.read_csv(c)
            break
    return data, clientes


DATA, clientes = carregar()
PERIODS = DATA["periods"]
K = DATA["kpis"]

# ----------------------------------------------------------------------
# Helpers de formatação
# ----------------------------------------------------------------------
def brl(v, compact=False):
    if compact:
        if abs(v) >= 1e6:
            return f"R$ {v/1e6:.2f}M"
        if abs(v) >= 1e3:
            return f"R$ {v/1e3:.0f}k"
    return f"R$ {v:,.0f}".replace(",", ".")


def pct(v):
    return f"{v*100:.1f}%"


# ----------------------------------------------------------------------
# Sidebar — filtros (canal + período por índice de mês, igual React)
# ----------------------------------------------------------------------
st.sidebar.title("Filtros")

canais_todos = list(DATA["dre_por_canal"].keys())
canais_sel = st.sidebar.multiselect("Canal", canais_todos, default=canais_todos)

p_ini, p_fim = st.sidebar.select_slider(
    "Período", options=PERIODS, value=(PERIODS[0], PERIODS[-1])
)
i0, i1 = PERIODS.index(p_ini), PERIODS.index(p_fim)
idx = list(range(i0, i1 + 1))  # índices do período selecionado

st.sidebar.markdown("---")
st.sidebar.caption(
    "Números consolidados do modelo financeiro (Fase 3) — "
    "idênticos ao dashboard React. Percentuais recalculados no período filtrado."
)

if not canais_sel:
    st.warning("Selecione ao menos um canal.")
    st.stop()


# ----------------------------------------------------------------------
# Funções de agregação sobre a DRE (soma no período + canais selecionados)
# ----------------------------------------------------------------------
def soma_linha(canal, linha):
    """Soma os valores de uma linha da DRE de um canal no período filtrado."""
    serie = DATA["dre_por_canal"][canal].get(linha)
    if serie is None:
        return 0.0
    return sum(serie[j] for j in idx)


def soma_consolidada(linha):
    return sum(soma_linha(c, linha) for c in canais_sel)


# ----------------------------------------------------------------------
# Cabeçalho + KPIs
# ----------------------------------------------------------------------
st.title("Finance Ops & Analytics")
st.markdown(
    f"**Beauty Omnichannel** · período **{p_ini} → {p_fim}** · "
    f"{len(canais_sel)}/{len(canais_todos)} canais"
)

rec_liq = soma_consolidada("Receita Líquida")
cmv = soma_consolidada("(−) CMV")
mc = soma_consolidada("Margem de Contribuição")
ebitda = soma_consolidada("EBITDA")
result_op = soma_consolidada("Resultado Operacional")
rec_bruta = soma_consolidada("Receita Bruta")

mc_pct = mc / rec_liq if rec_liq else 0
ebitda_pct = ebitda / rec_liq if rec_liq else 0
op_pct = result_op / rec_liq if rec_liq else 0

c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("Receita Líquida", brl(rec_liq, True))
c2.metric("Margem Contribuição", brl(mc, True), pct(mc_pct))
c3.metric("EBITDA", brl(ebitda, True), pct(ebitda_pct),
          delta_color="normal" if ebitda >= 0 else "inverse")
c4.metric("Resultado Operacional", brl(result_op, True), pct(op_pct),
          delta_color="normal" if result_op >= 0 else "inverse")
c5.metric("NCG (dias de receita)", f"{K['ncg_dias']:.0f} dias")

if ebitda < 0:
    st.info(
        "⚠️ **Insight central do case:** mesmo com receita crescendo, a operação "
        f"queima caixa — EBITDA de {pct(ebitda_pct)} e NCG de {K['ncg_dias']:.0f} dias "
        "de receita. O problema não é margem, é o ciclo de capital de giro."
    )

st.markdown("---")

# ----------------------------------------------------------------------
# Abas
# ----------------------------------------------------------------------
tab_dre, tab_rec, tab_giro, tab_estoque, tab_roi = st.tabs(
    ["DRE Gerencial", "Receita & Margem", "Capital de Giro", "Estoque & SKUs", "ROI da Transformação"]
)

# ===================== DRE =====================
with tab_dre:
    st.subheader("DRE Gerencial Consolidada")
    st.caption("22 linhas · soma dos canais selecionados no período filtrado")

    linhas = [
        "Receita Bruta", "(−) Devoluções", "(−) Comissões de canal", "Receita Líquida",
        "(−) CMV", "Margem de Contribuição", "(−) Pessoal", "(−) Aluguel",
        "(−) Marketing", "(−) Logística", "(−) Tecnologia", "(−) Administrativo",
        "(−) Outros", "Total Despesas Operac.", "EBITDA", "(−) Depreciação",
        "EBIT", "(−) Despesas Financeiras", "Resultado Operacional",
    ]
    destaques = {"Receita Líquida", "Margem de Contribuição", "EBITDA", "EBIT", "Resultado Operacional"}
    linhas_disp = [ln for ln in linhas if ln in DATA["dre_consolidada"]]

    valores = [soma_consolidada(ln) for ln in linhas_disp]
    df_dre = pd.DataFrame({
        "Linha": linhas_disp,
        "Valor (R$)": valores,
        "% Rec. Líq.": [v / rec_liq if rec_liq else 0 for v in valores],
    })

    def realce(row):
        if row["Linha"] in destaques:
            return ["font-weight: 700; background-color: #EAF6F0"] * len(row)
        return [""] * len(row)

    st.dataframe(
        df_dre.style
        .apply(realce, axis=1)
        .format({"Valor (R$)": lambda v: brl(v), "% Rec. Líq.": lambda v: pct(v)}),
        width='stretch', hide_index=True, height=560,
    )

    # Drill-down por canal
    st.subheader("Resultado Operacional por canal")
    dd = []
    for canal in canais_sel:
        r = soma_linha(canal, "Resultado Operacional")
        rl = soma_linha(canal, "Receita Líquida")
        dd.append({"Canal": canal, "Resultado Op.": r,
                   "Margem Op.": r / rl if rl else 0})
    df_dd = pd.DataFrame(dd)
    fig = go.Figure(go.Bar(
        x=df_dd["Canal"], y=df_dd["Resultado Op."],
        marker_color=[CANAL_COLORS.get(c, ACCENT) for c in df_dd["Canal"]],
        text=[brl(v, True) for v in df_dd["Resultado Op."]], textposition="auto",
    ))
    fig.update_layout(height=320, margin=dict(l=0, r=0, t=10, b=0),
                      plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
                      yaxis_title="R$")
    st.plotly_chart(fig, width='stretch')

# ===================== RECEITA & MARGEM =====================
with tab_rec:
    st.subheader("Evolução da Receita Líquida por canal")
    linhas_serie = []
    for canal in canais_sel:
        serie = DATA["dre_por_canal"][canal]["Receita Líquida"]
        for j in idx:
            linhas_serie.append({"Período": PERIODS[j], "Canal": canal,
                                 "Receita Líquida": serie[j]})
    df_s = pd.DataFrame(linhas_serie)
    fig = px.area(df_s, x="Período", y="Receita Líquida", color="Canal",
                  color_discrete_map=CANAL_COLORS)
    fig.update_layout(height=340, margin=dict(l=0, r=0, t=10, b=0), legend_title_text="",
                      plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig, width='stretch')

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Mix de receita por canal")
        mix = [{"Canal": c, "Receita": soma_linha(c, "Receita Líquida")} for c in canais_sel]
        df_mix = pd.DataFrame(mix)
        fig = px.pie(df_mix, values="Receita", names="Canal", hole=0.55,
                     color="Canal", color_discrete_map=CANAL_COLORS)
        fig.update_layout(height=320, margin=dict(l=0, r=0, t=10, b=0),
                          paper_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig, width='stretch')

    with col2:
        st.subheader("Margem de contribuição por categoria")
        cats = DATA["mix_categoria"]
        df_cat = pd.DataFrame(cats)
        fig = go.Figure(go.Bar(
            x=df_cat["categoria"], y=df_cat["margem_pct"] * 100,
            marker_color=VERDE_MED,
            text=[f"{v*100:.1f}%" for v in df_cat["margem_pct"]], textposition="auto",
        ))
        fig.update_layout(height=320, margin=dict(l=0, r=0, t=10, b=0), yaxis_title="MC %",
                          plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
        st.plotly_chart(fig, width='stretch')
        st.caption("Margem por categoria vem do modelo (base 24m, não filtrável por período).")

# ===================== CAPITAL DE GIRO =====================
with tab_giro:
    st.subheader("Capital de Giro & Ciclo Financeiro")
    st.caption("Indicadores do modelo — base 24 meses consolidada")

    g1, g2, g3, g4 = st.columns(4)
    g1.metric("PMR (ERP)", f"{K['pmr_erp']:.0f} dias")
    g2.metric("PME (estoque)", f"{K['pme']:.0f} dias")
    g3.metric("PMP (fornec.)", f"{K['pmp']:.0f} dias")
    g4.metric("Ciclo Financeiro", f"{K['ciclo_financeiro']:.0f} dias")

    g5, g6, g7, g8 = st.columns(4)
    g5.metric("NCG", brl(K["ncg"], True))
    g6.metric("NCG em dias de receita", f"{K['ncg_dias']:.0f}")
    g7.metric("Giro de estoque", f"{K['giro_estoque']:.2f}x")
    g8.metric("Cobertura", f"{K['cobertura_meses']:.1f} meses")

    st.markdown(
        f"""
        **Leitura:** o ciclo financeiro de **{K['ciclo_financeiro']:.0f} dias** é
        dominado pelo PME de **{K['pme']:.0f} dias** — estoque parado. A NCG de
        **{brl(K['ncg'], True)}** equivale a **{K['ncg_dias']:.0f} dias de receita**
        imobilizados na operação. Esse é o achado central validado contra os dados
        reais da Natura no benchmark do repositório.
        """
    )

    st.subheader("PMR por canal (Float = ERP − Gateway)")
    df_pmr = pd.DataFrame(DATA["pmr_por_canal"])
    fig = go.Figure()
    fig.add_bar(name="Gateway", x=df_pmr["canal"], y=df_pmr["pmr_gateway"], marker_color=ACCENT)
    fig.add_bar(name="Float (ERP−Gateway)", x=df_pmr["canal"], y=df_pmr["float_dias"], marker_color=AMBAR)
    fig.update_layout(barmode="stack", height=320, margin=dict(l=0, r=0, t=10, b=0),
                      yaxis_title="dias", legend_title_text="",
                      plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig, width='stretch')

# ===================== ESTOQUE & SKUs =====================
with tab_estoque:
    st.subheader("Aging de estoque por categoria")
    aging = DATA["aging_estoque"]
    df_ag = pd.DataFrame(aging)
    fig = go.Figure()
    fig.add_bar(name="Normal", x=df_ag["categoria"], y=df_ag["normal"], marker_color=ACCENT)
    fig.add_bar(name="Alerta", x=df_ag["categoria"], y=df_ag["alerta"], marker_color=AMBAR)
    fig.add_bar(name="Crítico", x=df_ag["categoria"], y=df_ag["critico"], marker_color=VERMELHO)
    fig.update_layout(barmode="stack", height=340, margin=dict(l=0, r=0, t=10, b=0),
                      yaxis_title="R$ (custo)", legend_title_text="",
                      plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig, width='stretch')

    st.subheader("Top 10 SKUs por margem")
    df_sku = pd.DataFrame(DATA["top_skus"])[
        ["rank", "sku", "categoria", "unidades", "receita", "cmv", "margem", "margem_pct"]
    ]
    st.dataframe(
        df_sku.style.format({
            "receita": lambda v: brl(v, True), "cmv": lambda v: brl(v, True),
            "margem": lambda v: brl(v, True), "margem_pct": lambda v: pct(v),
            "unidades": "{:.0f}",
        }),
        width='stretch', hide_index=True,
    )

# ===================== ROI =====================
with tab_roi:
    st.subheader("ROI da Transformação Financeira")
    ad = DATA["antes_depois"]
    roi = ad["roi"]

    r1, r2, r3, r4 = st.columns(4)
    r1.metric("Economia mensal", brl(roi["economia_mensal"], True))
    r2.metric("Economia anual", brl(roi["economia_anual"], True))
    r3.metric("Investimento", brl(roi["investimento"], True))
    r4.metric("Payback", f"{roi['payback_meses']:.1f} meses", f"ROI 12m {pct(roi['roi_12m'])}")

    st.markdown("#### Antes → Depois (métricas operacionais)")
    df_m = pd.DataFrame(ad["metricas"])
    df_m["Redução"] = (df_m["antes"] - df_m["depois"]) / df_m["antes"]
    df_m = df_m.rename(columns={"metrica": "Métrica", "antes": "Antes",
                                "depois": "Depois", "unidade": "Unidade"})
    st.dataframe(
        df_m[["Métrica", "Antes", "Depois", "Unidade", "Redução"]]
        .style.format({"Redução": lambda v: f"−{v*100:.0f}%"}),
        width='stretch', hide_index=True,
    )

    st.markdown("#### Custo mensal de controladoria")
    df_c = pd.DataFrame(ad["custos"])
    total_antes = df_c["antes"].sum()
    total_depois = df_c["depois"].sum()
    fig = go.Figure()
    fig.add_bar(name="Antes", x=df_c["componente"], y=df_c["antes"], marker_color=VERMELHO)
    fig.add_bar(name="Depois", x=df_c["componente"], y=df_c["depois"], marker_color=ACCENT)
    fig.update_layout(barmode="group", height=340, margin=dict(l=0, r=0, t=10, b=0),
                      yaxis_title="R$/mês", legend_title_text="",
                      plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig, width='stretch')
    st.caption(
        f"Custo total: {brl(total_antes, True)}/mês → {brl(total_depois, True)}/mês · "
        f"economia de {brl(total_antes - total_depois, True)}/mês."
    )

st.markdown("---")
st.caption(
    "Finance Ops & Analytics · case de portfólio · dados simulados · "
    "números idênticos ao dashboard React · github.com/Vborges95/finance-ops-analytics"
)
