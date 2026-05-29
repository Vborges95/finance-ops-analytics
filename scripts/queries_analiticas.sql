-- =====================================================================
-- queries_analiticas.sql
-- =====================================================================
-- Fase 2 — Finance Ops & Analytics
-- Banco: data/analytics/finance_ops.db (SQLite)
--
-- Conjunto de queries analíticas usadas para fechamento gerencial e
-- alimentação das fases subsequentes (modelo financeiro e dashboard).
--
-- Como rodar uma query isolada:
--   sqlite3 data/analytics/finance_ops.db < queries_analiticas.sql
-- ou, no Python:
--   pd.read_sql("...", sqlite3.connect("data/analytics/finance_ops.db"))
-- =====================================================================


-- =====================================================================
-- Q1. RECEITA LÍQUIDA POR CANAL E PERÍODO
-- ---------------------------------------------------------------------
-- Visão: para cada (canal, ano_mes), receita bruta, devoluções,
-- comissões, receita líquida, margem de contribuição estimada e share
-- de canal no mês. Insumo direto para DRE gerencial.
-- =====================================================================
WITH receita_canal_mes AS (
    SELECT
        ano_mes,
        canal,
        COUNT(*)                                     AS qtd_transacoes,
        ROUND(SUM(receita_bruta), 2)                 AS receita_bruta,
        ROUND(SUM(valor_devolucao), 2)               AS devolucoes,
        ROUND(SUM(comissao_valor), 2)                AS comissoes,
        ROUND(SUM(receita_liquida), 2)               AS receita_liquida,
        ROUND(SUM(margem_contribuicao), 2)           AS margem_contribuicao,
        ROUND(SUM(margem_contribuicao) * 100.0
              / NULLIF(SUM(receita_liquida), 0), 2)  AS margem_pct
    FROM fato_vendas
    GROUP BY ano_mes, canal
),
total_mes AS (
    SELECT ano_mes, SUM(receita_liquida) AS receita_liquida_mes
    FROM receita_canal_mes
    GROUP BY ano_mes
)
SELECT
    rcm.ano_mes,
    rcm.canal,
    rcm.qtd_transacoes,
    rcm.receita_bruta,
    rcm.devolucoes,
    rcm.comissoes,
    rcm.receita_liquida,
    rcm.margem_contribuicao,
    rcm.margem_pct,
    ROUND(rcm.receita_liquida * 100.0
          / NULLIF(tm.receita_liquida_mes, 0), 2)    AS share_canal_pct
FROM receita_canal_mes rcm
JOIN total_mes tm USING (ano_mes)
ORDER BY rcm.ano_mes, rcm.receita_liquida DESC;


-- =====================================================================
-- Q2. TOP 15 SKUs POR MARGEM DE CONTRIBUIÇÃO
-- ---------------------------------------------------------------------
-- Critério: margem absoluta acumulada nos 24 meses. Útil para
-- priorização de mix e negociação de custos.
-- =====================================================================
SELECT
    fv.sku_id,
    fv.categoria,
    COUNT(*)                                AS qtd_transacoes,
    SUM(fv.quantidade)                      AS unidades_vendidas,
    ROUND(SUM(fv.receita_liquida), 2)       AS receita_liquida,
    ROUND(SUM(fv.custo_total_estimado), 2)  AS custo_total,
    ROUND(SUM(fv.margem_contribuicao), 2)   AS margem_contribuicao,
    ROUND(SUM(fv.margem_contribuicao) * 100.0
          / NULLIF(SUM(fv.receita_liquida), 0), 2) AS margem_pct
FROM fato_vendas fv
GROUP BY fv.sku_id, fv.categoria
ORDER BY margem_contribuicao DESC
LIMIT 15;


-- =====================================================================
-- Q3. AGING DE ESTOQUE POR CATEGORIA
-- ---------------------------------------------------------------------
-- Distribuição do valor parado em estoque por faixa de aging.
-- Status: normal (<= 180), alerta (181-365), crítico (> 365).
-- Sinaliza onde há risco de write-off / obsolescência.
-- =====================================================================
SELECT
    categoria,
    status_aging,
    COUNT(*)                          AS qtd_lotes,
    SUM(quantidade)                   AS qtd_unidades,
    ROUND(SUM(custo_total), 2)        AS valor_estoque,
    ROUND(AVG(aging_dias), 0)         AS aging_medio_dias,
    ROUND(SUM(custo_total) * 100.0
          / SUM(SUM(custo_total)) OVER (PARTITION BY categoria), 2)
                                      AS share_categoria_pct
FROM estoque
GROUP BY categoria, status_aging
ORDER BY categoria,
         CASE status_aging
             WHEN 'critico' THEN 1
             WHEN 'alerta'  THEN 2
             WHEN 'normal'  THEN 3 END;


-- =====================================================================
-- Q4. PMR e PMP — PRAZOS MÉDIOS CONSOLIDADOS
-- ---------------------------------------------------------------------
-- PMR (prazo médio de recebimento): média ponderada dos prazos ERP
-- (gateway → conta da empresa) pelos valores de pagamento.
-- PMP (prazo médio de pagamento): média de (data_pagamento - data_competencia)
-- nas despesas, ponderada por valor.
-- Ciclo financeiro = PMR + PME(estoque) - PMP.
-- =====================================================================
WITH pmr AS (
    SELECT
        ROUND(SUM(prazo_erp_dias * 1.0 * valor_bruto)
              / NULLIF(SUM(valor_bruto), 0), 1) AS pmr_dias_ponderado,
        ROUND(AVG(prazo_erp_dias * 1.0), 1)     AS pmr_dias_simples,
        ROUND(AVG(prazo_gateway_dias * 1.0), 1) AS pmr_gateway_dias
    FROM fato_pagamentos
),
pmp AS (
    SELECT
        ROUND(SUM(julianday(data_pagamento) - julianday(data_competencia))
              * 1.0 * valor / NULLIF(SUM(valor), 0), 1)   AS pmp_dias_ponderado,
        ROUND(AVG(julianday(data_pagamento) - julianday(data_competencia)), 1)
                                                          AS pmp_dias_simples
    FROM despesas
    WHERE data_pagamento >= data_competencia
),
pme AS (
    -- prazo médio de estoque ≈ aging médio ponderado pelo custo
    SELECT
        ROUND(SUM(aging_dias * 1.0 * custo_total)
              / NULLIF(SUM(custo_total), 0), 1) AS pme_dias_ponderado
    FROM estoque
)
SELECT
    pmr.pmr_gateway_dias,
    pmr.pmr_dias_ponderado AS pmr_erp_ponderado,
    pmp.pmp_dias_ponderado AS pmp_ponderado,
    pme.pme_dias_ponderado AS pme_ponderado,
    ROUND(pmr.pmr_dias_ponderado + pme.pme_dias_ponderado
          - pmp.pmp_dias_ponderado, 1) AS ciclo_financeiro_dias
FROM pmr, pmp, pme;


-- =====================================================================
-- Q5. TAXA DE DEVOLUÇÃO POR CANAL
-- ---------------------------------------------------------------------
-- Visão financeira: quanto da receita bruta volta como devolução.
-- Marketplace tende a ter mais devolução; loja própria menos.
-- =====================================================================
SELECT
    canal,
    COUNT(*)                                              AS qtd_transacoes,
    SUM(CASE WHEN devolvido THEN 1 ELSE 0 END)            AS qtd_devolvidas,
    ROUND(SUM(CASE WHEN devolvido THEN 1 ELSE 0 END) * 100.0
          / COUNT(*), 2)                                  AS taxa_devolucao_volume_pct,
    ROUND(SUM(receita_bruta), 2)                          AS receita_bruta,
    ROUND(SUM(valor_devolucao), 2)                        AS valor_devolvido,
    ROUND(SUM(valor_devolucao) * 100.0
          / NULLIF(SUM(receita_bruta), 0), 2)             AS taxa_devolucao_valor_pct
FROM fato_vendas
GROUP BY canal
ORDER BY taxa_devolucao_valor_pct DESC;


-- =====================================================================
-- Q6 (BÔNUS). RECEITA RECORRENTE vs PONTUAL POR CANAL
-- ---------------------------------------------------------------------
-- Métrica estratégica: % de receita previsível por canal.
-- =====================================================================
SELECT
    canal,
    tipo_compra,
    COUNT(*)                                        AS qtd_transacoes,
    ROUND(SUM(receita_liquida), 2)                  AS receita_liquida,
    ROUND(SUM(receita_liquida) * 100.0
          / SUM(SUM(receita_liquida)) OVER (PARTITION BY canal), 2)
                                                    AS share_canal_pct
FROM fato_vendas
GROUP BY canal, tipo_compra
ORDER BY canal, tipo_compra;


-- =====================================================================
-- Q7 (BÔNUS). DRE GERENCIAL LIGHT — VISÃO MENSAL
-- ---------------------------------------------------------------------
-- Cruza receita (vendas) com despesas operacionais por competência.
-- Insumo direto para a aba DRE Gerencial da Fase 3.
-- =====================================================================
WITH receita AS (
    SELECT ano_mes,
           ROUND(SUM(receita_liquida), 2)      AS receita_liquida,
           ROUND(SUM(margem_contribuicao), 2)  AS margem_contribuicao
    FROM fato_vendas
    GROUP BY ano_mes
),
despesa AS (
    SELECT ano_mes,
           ROUND(SUM(valor), 2)                AS despesas_totais,
           ROUND(SUM(CASE WHEN categoria IN ('pessoal','aluguel','administrativo')
                          THEN valor ELSE 0 END), 2)  AS desp_fixas,
           ROUND(SUM(CASE WHEN categoria IN ('marketing','logistica','tecnologia')
                          THEN valor ELSE 0 END), 2)  AS desp_operacionais,
           ROUND(SUM(CASE WHEN categoria IN ('financeiro')
                          THEN valor ELSE 0 END), 2)  AS desp_financeiras,
           ROUND(SUM(CASE WHEN categoria = 'depreciacao'
                          THEN valor ELSE 0 END), 2)  AS depreciacao
    FROM despesas
    GROUP BY ano_mes
)
SELECT
    r.ano_mes,
    r.receita_liquida,
    r.margem_contribuicao,
    d.desp_fixas,
    d.desp_operacionais,
    d.desp_financeiras,
    d.depreciacao,
    d.despesas_totais,
    ROUND(r.margem_contribuicao - d.despesas_totais, 2)        AS resultado_estimado,
    ROUND((r.margem_contribuicao - d.despesas_totais) * 100.0
          / NULLIF(r.receita_liquida, 0), 2)                   AS margem_op_pct
FROM receita r
LEFT JOIN despesa d USING (ano_mes)
ORDER BY r.ano_mes;


-- =====================================================================
-- Q8 (BÔNUS). PAGAMENTOS COM DIVERGÊNCIA GATEWAY × ERP
-- ---------------------------------------------------------------------
-- Insumo para reconciliação assistida (Fase 5.4). Mostra cada divergência
-- relevante com canal, valor e severidade.
-- =====================================================================
SELECT
    pagamento_id,
    ano_mes,
    canal,
    valor_gateway,
    valor_erp,
    divergencia_valor,
    divergencia_pct,
    tipo_divergencia,
    status
FROM fato_pagamentos
WHERE divergencia_significativa = 1
ORDER BY ABS(divergencia_pct) DESC;


-- =====================================================================
-- Q9 (BÔNUS). SAZONALIDADE — RECEITA POR MÊS DO ANO
-- ---------------------------------------------------------------------
-- Identifica padrões sazonais (Dia das Mães, Black Friday, Natal etc).
-- =====================================================================
SELECT
    dc.mes_num,
    dc.mes_nome,
    ROUND(AVG(receita_total), 2)        AS receita_media_mes,
    ROUND(MIN(receita_total), 2)        AS receita_min,
    ROUND(MAX(receita_total), 2)        AS receita_max,
    ROUND(AVG(receita_total) * 100.0
          / (SELECT AVG(receita_total) FROM (
                SELECT SUM(receita_liquida) AS receita_total
                FROM fato_vendas GROUP BY ano_mes)) - 100, 1)
                                        AS desvio_media_pct
FROM (
    SELECT ano_mes, SUM(receita_liquida) AS receita_total
    FROM fato_vendas
    GROUP BY ano_mes
) t
JOIN dim_calendario dc USING (ano_mes)
GROUP BY dc.mes_num, dc.mes_nome
ORDER BY dc.mes_num;
