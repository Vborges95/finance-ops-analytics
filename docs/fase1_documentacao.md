# Fase 1 — Base Simulada

Documentação da base sintética que alimenta todas as fases subsequentes do projeto. Esta documentação descreve o que foi efetivamente gerado pelo script `gerar_base.py`, com os números agregados da base atual.

---

## 1. Visão geral

| Atributo | Valor |
|----------|-------|
| Período coberto | Jan/2023 → Dez/2024 (24 meses) |
| Volume base mensal | ~500 transações, com sazonalidade e crescimento |
| Crescimento mensal | 1,008× (≈10% a.a.) |
| Seed de reprodutibilidade | 42 (fixo em `numpy`, `random` e `Faker`) |
| Locale | `pt_BR` |
| Arquivos gerados | 5 CSVs em `data/raw/` |

A base inteira é determinística: rodar `python gerar_base.py` reproduz exatamente os mesmos números.

---

## 2. Premissas estruturais

### 2.1 Canais

| Canal | Peso no mix | Comissão | Taxa de devolução |
|-------|-------------|----------|---------------------|
| E-commerce próprio | 42% | 4,0% | 3% |
| Marketplace | 28% | 17,0% | 8% |
| Franquia | 18% | 12,0% | 5% |
| Loja própria | 12% | 0,0% | 2% |

### 2.2 Categorias

| Categoria | Peso | Margem-base | Ticket médio |
|-----------|------|-------------|--------------|
| Skincare | 32% | 62% | R$ 180 |
| Maquiagem | 28% | 55% | R$ 95 |
| Perfumes | 22% | 48% | R$ 250 |
| Haircare | 18% | 50% | R$ 120 |

### 2.3 Sazonalidade (multiplicador sobre o volume base)

| Mês | Fator | Justificativa |
|-----|-------|----------------|
| Jan | 1,15 | Pós-Natal / produtos de cuidado pós-festas |
| Fev | 0,92 | Baixa pós-temporada |
| Mar | 1,08 | Volta às aulas / autocuidado |
| Abr | 0,95 | Vale operacional |
| **Mai** | **1,35** | **Dia das Mães** |
| Jun | 1,18 | Dia dos Namorados |
| Jul | 0,90 | Férias / baixa de inverno |
| Ago | 0,93 | Vale |
| Set | 0,98 | Início da retomada |
| Out | 1,05 | Aceleração pré-feriados |
| **Nov** | **1,42** | **Black Friday** |
| Dez | 1,28 | Natal |

### 2.4 Mix de receita

- 30% recorrente
- 70% pontual

### 2.5 Distribuição etária e geográfica dos clientes

- UF (top 3): SP (35%), RJ (15%), MG (12%)
- Gênero: F (72%), M (22%), Não-Informado (6%)
- Faixa etária predominante: 25–34 (32%) e 35–44 (28%)

---

## 3. Datasets gerados

### 3.1 `vendas.csv`

**Granularidade:** transação.
**Linhas:** 14.485.
**Colunas:** 16.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `transacao_id` | str | Identificador único da transação (`TXN-NNNNNNN`) |
| `data` | date | Data da transação |
| `ano_mes` | str | Ano-mês (`YYYY-MM`) para agrupamento |
| `canal` | str | `ecommerce` / `marketplace` / `franquia` / `loja_propria` |
| `sku_id` | str | SKU vendido (`SKU-CCC-NNN`) |
| `categoria` | str | Categoria de produto |
| `quantidade` | int | Unidades na transação |
| `preco_unitario` | float | Preço unitário com desconto aplicado |
| `receita_bruta` | float | Receita antes de devoluções/comissões |
| `desconto_pct` | float | Desconto aplicado (%) |
| `valor_devolucao` | float | Valor devolvido (0 se não houve devolução) |
| `devolvido` | bool | Flag de devolução |
| `comissao_pct` | float | Comissão aplicada (%) |
| `comissao_valor` | float | Valor da comissão |
| `receita_liquida` | float | `receita_bruta − devoluções − comissões` |
| `tipo_compra` | str | `recorrente` / `pontual` |

**Agregados resultantes:**

- Receita bruta total: **R$ 4.571.979,59**
- Receita líquida total: **R$ 3.996.300,05**
- Devoluções: **R$ 181.246,05** (653 transações)
- Comissões: **R$ 394.433,49**

**Distribuição efetiva por canal:**

| Canal | Receita bruta | Participação |
|-------|----------------|---------------|
| E-commerce | R$ 1.943.188,92 | 42,5% |
| Marketplace | R$ 1.295.670,23 | 28,3% |
| Franquia | R$ 807.258,09 | 17,7% |
| Loja própria | R$ 525.862,35 | 11,5% |

**Distribuição efetiva por categoria:**

| Categoria | Receita bruta | Participação |
|-----------|----------------|---------------|
| Perfumes | R$ 1.755.327,94 | 38,4% |
| Skincare | R$ 1.523.730,49 | 33,3% |
| Maquiagem | R$ 697.004,30 | 15,2% |
| Haircare | R$ 595.916,86 | 13,0% |

> Observação: perfumes assumem a liderança em receita apesar de terem peso de mix menor (22%), devido ao ticket médio mais alto (R$ 250).

**Taxa de devolução observada:**

| Canal | Premissa | Observado |
|-------|----------|-----------|
| E-commerce | 3% | 3,15% |
| Marketplace | 8% | 7,09% |
| Franquia | 5% | 5,21% |
| Loja própria | 2% | 2,24% |

**Mix recorrente vs pontual:**

| Tipo | Receita | Participação |
|------|---------|---------------|
| Pontual | R$ 3.252.589,41 | 71,1% |
| Recorrente | R$ 1.319.390,18 | 28,9% |

**Trajetória de receita:**

- Primeiros 3 meses (Jan-Mar/2023): R$ 489.268,89
- Últimos 3 meses (Out-Dez/2024): R$ 718.040,15
- Pico: Nov/2024 → R$ 278.690,48 (Black Friday)
- Mínimo: Fev/2023 → R$ 144.550,49

---

### 3.2 `estoque.csv`

**Granularidade:** lote.
**Linhas:** 202.
**Colunas:** 10.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `lote_id` | str | Identificador do lote (`LOTE-NNNNNN`) |
| `sku_id` | str | SKU associado |
| `categoria` | str | Categoria do produto |
| `descricao` | str | Descrição |
| `data_entrada` | date | Data de entrada do lote no estoque |
| `quantidade` | int | Quantidade no lote |
| `custo_unitario` | float | Custo unitário |
| `custo_total` | float | `quantidade × custo_unitario` |
| `aging_dias` | int | Dias desde a entrada até `END_DATE` |
| `status_aging` | str | `normal` (≤180d) / `alerta` (181–365d) / `crítico` (>365d) |

**Agregados:**

- SKUs distintos: 58
- Custo total imobilizado em estoque: **R$ 2.615.654,42**
- Distribuição de aging:
   - Crítico (>1 ano): 111 lotes (55%)
   - Alerta (6–12 meses): 46 lotes (23%)
   - Normal (≤6 meses): 45 lotes (22%)

> Observação: a concentração em status "crítico" é proposital — replica um problema operacional real de gestão de estoque omnichannel e será explorada no modelo financeiro (giro, cobertura, NCG).

---

### 3.3 `despesas.csv`

**Granularidade:** lançamento.
**Linhas:** 705.
**Colunas:** 12.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `lancamento_id` | str | Identificador (`EXP-NNNNNN`) |
| `data_competencia` | date | Data de competência contábil |
| `data_pagamento` | date | Data de pagamento efetivo |
| `ano_mes` | str | Mês de competência |
| `categoria` | str | Macro-categoria de despesa |
| `centro_custo` | str | Centro de custo |
| `descricao` | str | Descrição |
| `valor` | float | Valor do lançamento |
| `recorrencia` | str | `mensal` / `trimestral` / `esporadico` |
| `fornecedor` | str | Razão social (fake) |
| `nota_fiscal` | str | Número da NF (sintético) |
| `aprovado_por` | str | `financeiro` / `diretoria` / `gestão` |

**Estrutura de despesa (17 linhas-base que se desdobram em até 3 lançamentos/mês):**

| Categoria | Centro de custo | Valor base mensal | Recorrência |
|-----------|------------------|---------------------|---------------|
| pessoal | administrativo | R$ 28.000 | mensal |
| pessoal | comercial | R$ 14.000 | mensal |
| pessoal | logistica | R$ 9.000 | mensal |
| aluguel | operacional | R$ 6.500 | mensal |
| aluguel | estoque | R$ 3.000 | mensal |
| marketing | digital | R$ 10.000 | mensal (com sazonalidade) |
| marketing | trade | R$ 3.500 | mensal (com sazonalidade) |
| logistica | frete_saida | R$ 7.000 | mensal |
| logistica | armazenagem | R$ 3.000 | mensal |
| tecnologia | plataformas | R$ 4.500 | mensal |
| tecnologia | erp_gateway | R$ 2.200 | mensal |
| financeiro | taxas_bancarias | R$ 1.300 | mensal |
| financeiro | juros | variável | esporádico (Fev, Mar, Jul, Ago) |
| administrativo | juridico | R$ 1.800 | trimestral |
| administrativo | contabilidade | R$ 2.500 | mensal |
| depreciacao | ativos | R$ 2.200 | mensal |
| outros | varios | R$ 900 | mensal |

**Agregados:**

- Despesa total no período: **R$ 2.393.592,52**
- Concentração em pessoal: R$ 1.232.369,57 (51%)
- Marketing: R$ 350.191,86 (15%) — com sazonalidade aplicada
- Logística: R$ 238.776,73 (10%)

> Observação: marketing recebe o fator de sazonalidade do calendário (intensifica em Mai/Nov/Dez), simulando o comportamento real do setor beauty em campanhas de Dia das Mães, Black Friday e Natal.

---

### 3.4 `pagamentos.csv`

**Granularidade:** mês × canal (agregado de liquidações).
**Linhas:** 96 (24 meses × 4 canais).
**Colunas:** 16.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `pagamento_id` | str | Identificador (`PAG-NNNNNN`) |
| `ano_mes` | str | Mês de referência |
| `canal` | str | Canal |
| `data_venda_ref` | date | Data de referência da venda |
| `data_liquidacao_gateway` | date | Data de liquidação no gateway |
| `data_liquidacao_erp` | date | Data de reconhecimento no ERP |
| `valor_bruto` | float | Receita líquida da venda |
| `taxa_gateway_pct` | float | Taxa do gateway (%) |
| `taxa_gateway_valor` | float | Valor da taxa |
| `valor_gateway` | float | Valor líquido após taxa |
| `valor_erp` | float | Valor registrado no ERP |
| `divergencia_valor` | float | `valor_erp − valor_gateway` |
| `divergencia_pct` | float | Divergência percentual |
| `prazo_gateway_dias` | int | Dias até liquidação no gateway |
| `prazo_erp_dias` | int | Dias até reconhecimento no ERP |
| `status` | str | `liquidado` / `pendente` / `em_disputa` |

**Prazos e taxas por canal:**

| Canal | Prazo gateway | Prazo ERP | Taxa gateway |
|-------|---------------|------------|---------------|
| E-commerce | 2 dias | 14 dias | 1,49% |
| Marketplace | 2 dias | 30 dias | 1,99% |
| Franquia | 0 dias | 21 dias | 0,00% |
| Loja própria | 1 dia | 3 dias | 2,29% |

**Agregados:**

- Total de taxas pagas: **R$ 58.630,45**
- **32 de 96 pagamentos (33,3%) com divergência entre gateway e ERP** — material direto para a reconciliação assistida da Fase 5.4
- Valor líquido total de divergências: R$ 2.688,54
- Status: 80 liquidados / 10 pendentes / 6 em disputa

> Observação: o "gap" entre prazo gateway e prazo ERP é a base do **capital de giro do projeto** — gera a diferença entre quando o dinheiro entra na conta e quando ele aparece como receita reconhecida.

---

### 3.5 `clientes.csv`

**Granularidade:** cliente.
**Linhas:** 2.200.
**Colunas:** 13.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `cliente_id` | str | Identificador (`CLI-NNNNNN`) |
| `canal_aquisicao` | str | Canal de aquisição |
| `categoria_preferida` | str | Categoria mais comprada |
| `data_primeira_compra` | date | Primeira compra |
| `data_ultima_compra` | date | Última compra |
| `frequencia_compras_ano` | int | Frequência anual (1–12) |
| `ticket_medio` | float | Ticket médio do cliente |
| `ltv_estimado` | float | LTV estimado |
| `is_recorrente` | bool | True se frequência ≥ 3 |
| `status` | str | `ativo` / `em_risco` / `inativo` |
| `uf` | str | UF |
| `genero` | str | F / M / NI |
| `faixa_etaria` | str | 18-24 / 25-34 / 35-44 / 45-54 / 55+ |

**Agregados:**

- Total de clientes: 2.200
- Recorrentes (freq ≥ 3): 1.020 (46,4%)
- Ticket médio: R$ 216,43
- LTV médio estimado: R$ 1.506,72
- Status: 1.194 ativos / 455 em risco / 551 inativos

---

## 4. Ruídos e problemas operacionais embutidos

A base não é "limpa" propositalmente — vários ruídos operacionais foram introduzidos para servirem de matéria-prima para a Fase 2 (Tratamento). Os principais:

| Ruído | Onde aparece | Por que importa |
|-------|--------------|------------------|
| **Divergências gateway × ERP** | `pagamentos.csv` (33% dos registros) | Base da reconciliação assistida (Fase 5.4) |
| **Gap entre data de competência e data de pagamento** | `despesas.csv` | Materializa o problema de fechamento por competência |
| **Lotes em status crítico (>365d)** | `estoque.csv` (55% dos lotes) | Pressiona NCG e giro no modelo financeiro |
| **Comissões variáveis (±1 p.p.)** | `vendas.csv` | Replica o comportamento real de tarifas de marketplace |
| **Devoluções com lag implícito** | `vendas.csv` | Distorce margem do mês se não tratado |
| **Despesas esporádicas (juros)** | `despesas.csv` | Quebra o padrão de previsibilidade do orçamento |

---

## 5. Como reproduzir

```bash
# 1. Clonar o repositório
git clone <url>
cd finance-ops-analytics

# 2. Instalar dependências
pip install pandas numpy faker

# 3. Executar
python scripts/gerar_base.py
```

A base será gerada em `data/raw/`. A seed fixa (42) garante reprodutibilidade — todos os números desta documentação são determinísticos.

---

## 6. Conexão com as fases seguintes

| Dataset | Próxima fase | Como será usado |
|---------|--------------|------------------|
| `vendas.csv` | Fase 2 (deduplicação de SKUs) → Fase 3 (DRE por canal/categoria) → Fase 4 (filtros do dashboard) | Espinha dorsal da receita |
| `estoque.csv` | Fase 3 (giro, cobertura, NCG) | Capital de giro |
| `despesas.csv` | Fase 2 (padronização de centro de custo) → Fase 3 (estrutura de custos) → Fase 5.1 (classificador IA) | Estrutura de custos |
| `pagamentos.csv` | Fase 2 (reconciliação) → Fase 3 (fluxo de caixa) → Fase 5.4 (reconciliação IA) | Caixa e PMR |
| `clientes.csv` | Fase 3 (recorrência, LTV) → Fase 6 (benchmark Natura — base de assinantes) | Recorrência |

---

*Documentação técnica — Fase 1, Finance Ops & Analytics*
