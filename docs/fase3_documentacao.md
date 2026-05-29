# Fase 3 — Modelo Financeiro

Documentação do modelo financeiro em Excel — o coração analítico do projeto. Esta documentação descreve a estrutura, as premissas e os principais achados do modelo, conforme construído em `modelo/modelo_financeiro.xlsx`.

---

## 1. Visão geral

| Atributo | Valor |
|----------|-------|
| Período coberto | Jan/2023 → Dez/2024 (24 meses) |
| Período projetado | Jan/2025 → Jun/2025 (forecast 6 meses) |
| Abas no workbook | 15 |
| Tipo de modelo | Gerencial (sem tributação federal/estadual) |
| Definição de receita líquida | Receita bruta − devoluções − comissões de canal |
| Convenção de cores | Azul = input · Preto = fórmula · Verde = link entre abas · Amarelo = premissa-chave |
| Status da operação | Em virada — break-even cruzado em Nov-Dez/2024 |

---

## 2. Estrutura do workbook

| # | Aba | Conteúdo |
|---|-----|----------|
| 01 | Capa | Índice, legenda de cores, premissas contábeis |
| 02 | Premissas | Parâmetros editáveis (forecast, inflação, sazonalidade, antes vs depois) |
| 03 | Base_Vendas | Base agregada 24m × 4 canais × 4 categorias |
| 04 | Base_Despesas | Base agregada de despesas por categoria |
| 05 | Base_Apoio | Pagamentos, estoque, clientes, calendário |
| 06 | DRE_Consolidada | DRE gerencial mensal — receita → resultado operacional |
| 07 | DRE_por_Canal | DRE replicada por canal (rateio proporcional de despesas centrais) |
| 08 | DRE_por_Categoria | DRE replicada por categoria (mesmo critério de rateio) |
| 09 | Fluxo_de_Caixa | Métodos direto e indireto + caixa operacional acumulado |
| 10 | Capital_de_Giro | PMR · PME · PMP · ciclo financeiro · NCG estimada |
| 11 | Estoque_e_Giro | Aging por categoria · cobertura · giro · top 15 SKUs por margem |
| 12 | KPIs | Painel consolidado de rentabilidade, capital e operação |
| 13 | Forecast_6M | Projeção 1S/2025 + comparativo com 2S/2024 real |
| 14 | Antes_vs_Depois | ROI da transformação operacional |
| 15 | Dashboard_Exec | Visão executiva consolidada do biênio |

O workbook segue uma arquitetura clássica de modelo financeiro: **premissas centralizadas (02) → bases ligadas (03–05) → análises derivadas (06–14) → visão executiva (15)**. Qualquer ajuste em 02 propaga para todas as abas seguintes.

---

## 3. Premissas (aba 02)

### 3.1 Forecast — crescimento mensal por canal

| Canal | Growth %a.m. | Janela média móvel | Racional |
|-------|--------------|---------------------|----------|
| E-commerce | 2,5% | 3 meses | Canal com maior elasticidade — alvo de tração |
| Marketplace | 1,5% | 3 meses | Crescimento moderado, dependente de comissão |
| Franquia | 1,0% | 3 meses | Expansão controlada, novas unidades em ramp-up |
| Loja Própria | 0,8% | 3 meses | Footprint físico estável, foco em produtividade |

### 3.2 Inflação aplicada às despesas

- 0,5% a.m. (≈6,2% a.a., proxy IPCA)

### 3.3 Sazonalidade do forecast (fatores multiplicativos)

| Mês | Fator | Observação |
|-----|-------|------------|
| Jan | 0,95 | Pós-festas |
| Fev | 0,90 | Mês curto |
| Mar | 1,00 | Neutro |
| Abr | 0,95 | Neutro/baixa |
| Mai | 1,20 | Dia das Mães |
| Jun | 1,05 | Namorados |

### 3.4 Premissas do Antes vs Depois

| Métrica | Antes | Depois | Δ |
|---------|-------|--------|---|
| Prazo de fechamento (dias úteis) | 12 | 5 | −7 |
| Horas/mês — analista financeiro | 200 | 80 | −120 |
| Custo R$/hora analista | R$ 85 | R$ 85 | — |
| Lançamentos retrabalho/mês | 12 | 2 | −10 |
| Tempo médio retrabalho (h) | 4 | 4 | — |
| Divergências gateway × ERP/mês | 7 | 1 | −6 |
| Comentários executivos manuais (h) | 16 | 4 | −12 |

---

## 4. Resultados consolidados — 24 meses

### 4.1 Linhas principais da DRE Consolidada

| Linha | Total 24m | 2023 | 2024 |
|-------|-----------|------|------|
| Receita Bruta | R$ 4.540.779,61 | R$ 2.142.429,67 | R$ 2.398.349,94 |
| Receita Líquida | R$ 3.975.053,71 | R$ 1.872.717,89 | R$ 2.102.335,82 |
| (−) CMV | R$ 2.178.990,09 | R$ 1.023.954,95 | R$ 1.155.035,14 |
| **Margem de Contribuição** | **R$ 1.796.063,62** | **R$ 848.762,94** | **R$ 947.300,68** |
| (−) Despesas Operacionais | R$ 2.298.567,72 | R$ 1.152.279,18 | R$ 1.146.288,53 |
| **EBITDA** | **(R$ 502.504,10)** | **(R$ 303.516,25)** | **(R$ 198.987,85)** |
| (−) Depreciação | R$ 52.799,91 | R$ 26.399,84 | R$ 26.400,07 |
| (−) Despesas Financeiras | R$ 35.628,56 | R$ 19.821,95 | R$ 15.806,61 |
| **Resultado Operacional** | **(R$ 590.932,57)** | **(R$ 349.738,05)** | **(R$ 241.194,52)** |

### 4.2 Margens

| Margem | 24m | 2023 | 2024 |
|--------|-----|------|------|
| Contribuição | 45,2% | 45,3% | 45,1% |
| EBITDA | −12,6% | −16,2% | −9,5% |
| Operacional | −14,9% | −18,7% | −11,5% |

### 4.3 Composição do mix de receita (24m)

**Por canal:**

| Canal | Receita Líq. 24m | Mix | 2023 | 2024 | Crescimento |
|-------|------------------:|-----|------|------|-------------|
| E-commerce | R$ 1.807.879 | 45,2% | R$ 867.454 | R$ 940.426 | +8,4% |
| Marketplace | R$ 998.627 | 25,0% | R$ 448.130 | R$ 550.497 | +22,8% |
| Franquia | R$ 673.621 | 16,9% | R$ 320.501 | R$ 353.119 | +10,2% |
| Loja Própria | R$ 516.173 | 12,9% | R$ 236.633 | R$ 279.540 | +18,1% |
| **Total** | **R$ 3.996.300** | **100%** | **R$ 1.872.718** | **R$ 2.123.582** | **+13,4%** |

**Por categoria:**

| Categoria | Receita Líq. 24m | Mix | Margem | Margem % |
|-----------|------------------:|-----|--------|----------|
| Perfumes | R$ 1.540.426 | 38,5% | R$ 598.644 | 38,9% |
| Skincare | R$ 1.321.379 | 33,1% | R$ 718.941 | 54,4% |
| Maquiagem | R$ 609.850 | 15,3% | R$ 274.109 | 44,9% |
| Haircare | R$ 524.645 | 13,1% | R$ 213.164 | 40,6% |

---

## 5. Capital de giro (aba 10)

### 5.1 Prazos médios

| Indicador | Valor (dias) | Interpretação |
|-----------|--------------|----------------|
| PMR Gateway (média ponderada) | 1,5 | Crédito do gateway após a venda |
| PMR ERP (média ponderada) | 17,8 | Disponibilidade efetiva em conta |
| PME (estoque, ponderado por valor) | 374,3 | Aging médio do estoque parado |
| PMP (despesas, ponderado por valor) | 7,8 | Competência → pagamento |
| **Ciclo Financeiro** = PMR ERP + PME − PMP | **384,3** | Desembolso → recebimento |

### 5.2 NCG estimada

| Item | Valor |
|------|-------|
| Receita líquida diária média | R$ 5.445 |
| Contas a Receber estimadas | R$ 96.926 |
| Estoque a valor corrente | R$ 2.615.654 |
| Contas a Pagar estimadas | R$ 47.842 |
| **NCG estimada** | **R$ 2.664.738** |
| **NCG em dias de receita** | **489 dias** |

### 5.3 PMR por canal

| Canal | PMR Gateway | PMR ERP | Float | Volume 24m |
|-------|------------:|--------:|------:|------------:|
| E-commerce | 2 | 14 | 12 | R$ 1.807.879 |
| Marketplace | 2 | 30 | 28 | R$ 998.627 |
| Franquia | 0 | 21 | 21 | R$ 673.621 |
| Loja Própria | 1 | 3 | 2 | R$ 516.173 |

> Marketplace amplia a média ponderada — é a alavanca mais sensível de capital de giro.

---

## 6. Estoque (aba 11)

| Categoria | Normal | Alerta | Crítico | Total | % Crítico | PME (dias) |
|-----------|-------:|-------:|--------:|------:|----------:|-----------:|
| Skincare | R$ 144.295 | R$ 212.317 | R$ 508.852 | R$ 865.464 | 58,8% | 383,6 |
| Maquiagem | R$ 103.523 | R$ 25.049 | R$ 232.642 | R$ 361.214 | 64,4% | 391,1 |
| Perfumes | R$ 236.611 | R$ 296.164 | R$ 546.496 | R$ 1.079.272 | 50,6% | 353,4 |
| Haircare | R$ 44.089 | R$ 68.710 | R$ 196.907 | R$ 309.706 | 63,6% | 401,4 |
| **TOTAL** | **R$ 528.518** | **R$ 602.240** | **R$ 1.484.896** | **R$ 2.615.654** | **56,8%** | **374,3** |

| Indicador | Valor |
|-----------|-------|
| Giro anual (CMV 12m / estoque) | 0,42 vezes |
| Cobertura em meses | 28,8 meses |
| Estoque / Receita Líquida 12m | 1,32 |

> Estoque é mais de uma vez a receita anual — capital empatado relevante. **Perfumes concentra o maior valor em aging crítico** (R$ 546K), apesar de ser a categoria líder em mix de receita.

---

## 7. Forecast 1S/2025 (aba 13)

| Linha | Total 6M | Jan/25 | Fev/25 | Mar/25 | Abr/25 | Mai/25 | Jun/25 |
|-------|---------:|-------:|-------:|-------:|-------:|-------:|-------:|
| Receita Líquida | R$ 1.358.985 | R$ 203.718 | R$ 196.410 | R$ 222.103 | R$ 214.750 | R$ 276.099 | R$ 245.905 |
| Margem Contribuição | R$ 614.035 | R$ 92.047 | R$ 88.744 | R$ 100.354 | R$ 97.031 | R$ 124.751 | R$ 111.108 |
| Despesas Operacionais | R$ 583.258 | R$ 96.002 | R$ 96.482 | R$ 96.964 | R$ 97.449 | R$ 97.936 | R$ 98.426 |
| **EBITDA** | **R$ 30.777** | (R$ 3.955) | (R$ 7.737) | **R$ 3.390** | (R$ 418) | **R$ 26.815** | **R$ 12.682** |
| Margem EBITDA | 2,3% | −1,9% | −3,9% | 1,5% | −0,2% | 9,7% | 5,2% |

### Comparativo 1S2025 (forecast) vs 2S2024 (real)

| Indicador | 2S24 real | 1S25 forecast | Δ | Δ% |
|-----------|----------:|--------------:|-----:|-----:|
| Receita Líquida | R$ 1.072.089 | R$ 1.358.985 | +R$ 286.896 | +26,8% |
| EBITDA | (R$ 77.425) | R$ 30.777 | +R$ 108.202 | +139,8% |

> Forecast mostra **virada operacional sustentada**: depois do break-even cruzado em Nov-Dez/2024, o 1S2025 entrega EBITDA positivo agregado, com diluição progressiva das despesas fixas em uma receita crescente.

---

## 8. Antes vs Depois — ROI da transformação (aba 14)

### 8.1 Custo mensal de controladoria

| Componente | Antes (R$/mês) | Depois (R$/mês) | Economia | Economia % |
|------------|----------------:|-----------------:|----------:|-----------:|
| Capacidade analítica (horas regulares) | R$ 17.000 | R$ 6.800 | R$ 10.200 | 60,0% |
| Custo de retrabalho | R$ 4.080 | R$ 680 | R$ 3.400 | 83,3% |
| Investigação de divergências | R$ 1.190 | R$ 170 | R$ 1.020 | 85,7% |
| Comentários executivos manuais | R$ 1.360 | R$ 340 | R$ 1.020 | 75,0% |
| **TOTAL MENSAL** | **R$ 23.630** | **R$ 7.990** | **R$ 15.640** | **66,2%** |

### 8.2 Visão anual

| Indicador | Valor |
|-----------|-------|
| Economia mensal total | R$ 15.640 |
| Economia anual estimada | R$ 187.680 |
| Redução horas/mês | 184 |
| Redução do prazo de fechamento | 7 dias (D+12 → D+5) |
| Investimento estimado no projeto | R$ 120.000 |
| **Payback** | **7,7 meses** |
| **ROI 12 meses** | **56,4%** |

> **Este é o resultado mais relevante do modelo**: a transformação operacional se paga em menos de 8 meses **independentemente do desempenho top-line**. Mesmo numa operação em prejuízo, o investimento em controladoria moderna retorna 56% no primeiro ano.

---

## 9. Painel de KPIs (aba 12)

### 9.1 Rentabilidade

| KPI | 24m | 2023 | 2024 |
|-----|-----|------|------|
| Receita Bruta | R$ 4,54 MM | R$ 2,14 MM | R$ 2,40 MM |
| Receita Líquida | R$ 3,98 MM | R$ 1,87 MM | R$ 2,10 MM |
| Margem de Contribuição % | 45,2% | 45,3% | 45,1% |
| Margem EBITDA % | −12,6% | −16,2% | −9,5% |
| Margem Operacional % | −14,9% | −18,7% | −11,5% |

### 9.2 Capital e ciclo

| KPI | Valor | Unidade | Status |
|-----|-------|---------|--------|
| PMR ERP | 17,8 | dias | OK |
| PME | 374,3 | dias | **Crítico** |
| PMP | 7,8 | dias | Monitorar |
| Ciclo financeiro | 384,3 | dias | Atenção |
| NCG estimada | R$ 2,66 MM | — | — |
| NCG em dias de receita | 489 | dias | Atenção |

### 9.3 Operação

| KPI | Valor | Benchmark |
|-----|-------|-----------|
| Taxa de devolução | 3,96% | < 5% (bom) |
| Giro de estoque | 0,42x | > 3x (bom) |
| Receita média/mês | R$ 165.627 | — |
| EBITDA médio/mês | (R$ 20.938) | — |

---

## 10. Narrativa executiva — os 5 achados centrais

1. **A operação está em virada, não em crise.** EBITDA acumulado de 24m é negativo (−R$ 502K), mas **Nov-Dez/2024 cruzam o break-even pela primeira vez** e o forecast 1S/2025 sustenta a inflexão.

2. **O problema não é margem, é escala.** Margem de contribuição estável em ~45% nos 24 meses — preço e CMV estão saudáveis. O resultado negativo vem da **subdiluição das despesas fixas** (pessoal sozinho = R$ 1,23 MM nos 24m, ~30% da receita líquida).

3. **Perfumes lidera receita mas concentra o maior aging crítico.** R$ 546K em estoque crítico em uma única categoria — alvo natural para liquidação dirigida e revisão de sortimento.

4. **Marketplace é a alavanca de capital de giro mais sensível.** PMR ERP de 30 dias no marketplace vs 14 no e-commerce — renegociar D+ junto ao marketplace tem o maior impacto unitário sobre NCG.

5. **A transformação operacional vale a pena mesmo numa operação deficitária.** Payback de 7,7 meses, ROI 56% em 12 meses — esse argumento sustenta o projeto de modernização da controladoria independentemente da rentabilidade do core business.

---

## 11. Decisões de design

**Por que modelo gerencial e não fiscal?** O foco é a leitura que o gestor precisa para decidir — margem por canal, geração de caixa, NCG, giro. Tributos federais e estaduais ficaram de fora porque sua inclusão exigiria modelagem de regime tributário (Simples × Lucro Presumido × Lucro Real) sem agregar à pergunta central do projeto.

**Por que rateio proporcional à receita líquida?** Pessoal, aluguel, tecnologia e administrativo são despesas indiretas em relação ao canal/categoria. Rateio pela receita líquida do mês é a convenção mais utilizada em controllerships brasileiros — alternativas (rateio por margem, por volume) distorcem a leitura de quem está rentável ou não.

**Por que NCG estimada (não calculada)?** O fluxo de caixa do modelo está em regime de competência (caixa ≈ competência, simplificação) — calcular variação real de NCG entre meses exigiria saldos mensais de contas a receber e contas a pagar, que não vêm do modelo simulado. A versão "estimada" usa CR ≈ receita diária × PMR e CP ≈ (CMV + Despesa) × PMP, suficiente para indicar a ordem de grandeza.

**Por que 15 abas e não as 10 do plano original?** O plano previa 10 abas, mas o modelo cresceu para 15 por dois motivos: (1) inclusão de **3 abas de bases** entre premissas e DREs (Base_Vendas, Base_Despesas, Base_Apoio) para evitar fórmulas longas pulando entre as 15 abas seguintes; (2) separação de DRE por canal e por categoria, que ganharam abas próprias porque ambas eram demandas analíticas legítimas.

**Por que forecast simplificado e não cenário com sensibilidade?** O forecast 6M atende ao plano original. Cenário (otimista/base/pessimista) com sensibilidade ficou na lista de "próximos passos" da metodologia — é trabalho de 1ª camada que valeria como Fase 3.5.

---

## 12. Conexão com as outras fases

| Aba do modelo | Origem (Fase 2) | Consumo (próximas fases) |
|---------------|-----------------|--------------------------|
| 03–05 (Bases) | `fato_vendas`, `despesas`, `fato_pagamentos`, `estoque`, `clientes`, `dim_calendario` | — |
| 06–08 (DREs) | Bases | Fase 4 (visualização) |
| 09 (Caixa) | Bases + DRE | Fase 4 |
| 10 (Capital de giro) | Q4 SQL + estoque | Fase 4 |
| 11 (Estoque) | Q3 SQL + estoque | Fase 4 |
| 12 (KPIs) | Todas | Fase 4 (cards do dashboard) |
| 13 (Forecast) | Bases + premissas | Fase 5.2 — gerador de comentários (integrado ao dashboard, lê do recorte ativo) |
| 14 (Antes vs Depois) | Premissas + DRE | Fase 7 (post LinkedIn) |
| 15 (Dashboard) | Todas | Fase 4 (espelho web) |

---

*Documentação técnica — Fase 3, Finance Ops & Analytics*
