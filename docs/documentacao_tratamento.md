# Tratamento de Dados — Fase 2

**Projeto:** Finance Ops & Analytics — Empresa Beauty Omnichannel
**Etapa:** Estruturação e limpeza dos dados operacionais antes da modelagem financeira.

---

## 1. Visão geral

A Fase 1 entregou cinco datasets simulados em condições ideais (sem nulos, sem inconsistências). No mundo real, dados de fechamento chegam de extrações de ERP, gateways de pagamento e planilhas de área — e quase nunca chegam prontos. Esta fase reproduz esse cenário e o resolve.

O pipeline tem três etapas:

```
raw/          dirty/                     processed/                     analytics/
 (Fase 1)  →  (simulação ERP real)  →   (limpeza + padronização)  →   (consolidação + SQL)
              sujar_base.py             tratamento_dados.py            consolidacao.py
                                                                       queries_analiticas.sql
```

A camada `dirty/` foi adicionada à arquitetura original porque, sem ela, o tratamento ficaria sem o que tratar — e a narrativa "antes vs depois" perde substância. Cada problema injetado tem rastro determinístico (seed fixa), garantindo reprodutibilidade.

---

## 2. Problemas plantados (camada `dirty/`)

Cada problema simula uma falha operacional real recorrente em FP&A.

### vendas.csv

| Problema injetado                                            | Volume |  Origem real correspondente                                |
| ------------------------------------------------------------ | ------:| ---------------------------------------------------------- |
| Canal com grafias inconsistentes (20 variações)              | ~25%   | Cada canal exporta o nome do canal num formato diferente   |
| Categoria com grafias inconsistentes (20 variações)          | ~20%   | Cadastros desalinhados entre ERP e marketplace             |
| SKU com case/espaços (`sku-ski-001`, ` SKU-SKI-001 `)        | ~8%    | Concatenação manual de planilhas                           |
| Datas em formato BR misturadas com ISO                       | ~5%    | Export do gateway é BR, ERP é ISO                          |
| Valores monetários como string com vírgula (`"266,11"`)      | ~3%    | Export do ERP brasileiro sem padronização numérica         |
| Duplicatas exatas                                            | ~1%    | Re-extração acidental do mesmo período                     |
| Receita líquida com fórmula errada                           | ~0,5%  | Cálculo manual em planilha de fechamento                   |

### despesas.csv

| Problema injetado                                            | Volume |  Origem real correspondente                               |
| ------------------------------------------------------------ | ------:| --------------------------------------------------------- |
| Centro de custo nulo                                         | ~5%    | Lançamento manual sem CC selecionado                      |
| Categoria com grafia inconsistente                           | ~25%   | Plano de contas implementado de forma livre               |
| Datas competência × pagamento invertidas                     | ~4%    | Provisão lançada após o pagamento real                    |
| Valor como string com símbolo (`"R$ 27.719,13"`)             | ~3%    | Cópia/cola de extrato bancário                            |
| Campo `ano_mes` em formato `Jan/2023`                        | ~5%    | Coluna calculada por usuário em planilha auxiliar         |
| Duplicidade                                                  | ~0,7%  | Lançamento manual repetido                                |

### pagamentos.csv

| Problema injetado                                            | Volume |  Origem real correspondente                                |
| ------------------------------------------------------------ | ------:| ---------------------------------------------------------- |
| Canal com grafia inconsistente                               | ~30%   | Cadastro do gateway com nomenclatura diferente do ERP      |
| Status com grafia inconsistente (`Pago`, `LIQUIDADO`)        | ~40%   | Cada gateway/marketplace tem nomenclatura própria          |
| Datas em formato BR                                          | ~10%   | Mistura de extratos                                        |
| Divergência ERP × gateway reforçada                          | ~10%   | Reconciliação não captada no fechamento                    |

### estoque.csv

| Problema injetado                                            | Volume |  Origem real correspondente                                |
| ------------------------------------------------------------ | ------:| ---------------------------------------------------------- |
| SKU com case/espaços                                         | ~10%   | Cadastros divergentes entre sistema de estoque e ERP       |
| Categoria com grafia inconsistente                           | ~15%   | Variações no cadastro de produtos                          |
| Status de aging desatualizado (forçado `normal`)             | ~8%    | Campo calculado em planilha não atualizado                 |
| Data de entrada em formato BR                                | ~5%    | Mistura ERP × planilha de recebimento                      |

### clientes.csv

| Problema injetado                                            | Volume |  Origem real correspondente                                |
| ------------------------------------------------------------ | ------:| ---------------------------------------------------------- |
| UF inconsistente (`sp`, `São Paulo`, `S.P.`)                 | ~15%   | Cadastros vindos de diferentes pontos de captura           |
| Gênero (`F`, `Feminino`, `fem`, `-`, `n/i`)                  | ~20%   | Forms com campos livres                                    |
| Datas primeira × última compra invertidas                    | ~2%    | Erro de cadastro                                           |
| Faixa etária (`18 a 24`, `25_34`)                            | ~10%   | Cadastros importados de fontes distintas                   |
| Duplicidade por cliente_id                                   | ~0,3%  | Re-importação parcial                                      |

---

## 3. Regras aplicadas (camada `processed/`)

O `tratamento_dados.py` aplica regras determinísticas, idempotentes e auditáveis. Cada regra reporta quantas linhas modificou.

### Padronização de domínios categóricos

Função `slugify` normaliza texto: minúsculo → sem acento → remove pontuação → snake_case. Resultado mapeado para canônico via dicionários `*_ALIAS`. Domínios fechados após limpeza:

- **Canal:** `{ecommerce, marketplace, franquia, loja_propria}`
- **Categoria (venda):** `{skincare, maquiagem, perfumes, haircare}`
- **Categoria (despesa):** `{pessoal, aluguel, marketing, logistica, tecnologia, financeiro, administrativo, depreciacao, outros}`
- **UF:** sigla de 2 letras
- **Gênero:** `{F, M, NI}`
- **Faixa etária:** `{18-24, 25-34, 35-44, 45-54, 55+}`
- **Status pagamento:** `{liquidado, pendente, em_disputa}`

### Tipagem e coerção

- **Datas:** parser tenta ISO → BR → parser livre. Resultado em `datetime64[ns]`.
- **Monetários:** parser remove `R$`, espaços, pontos de milhar; converte vírgula decimal em ponto; resultado em `float64`.
- **Inteiros/booleans:** convertidos onde aplicável após limpeza.
- **Categóricos:** convertidos a `category` no final do pipeline (reduz memória e força integridade).

### Regras de negócio

| Regra                                                              | Tabela        | Decisão de design |
| ------------------------------------------------------------------ | ------------- | ----------------- |
| Recalcular `ano_mes` a partir da data primária                     | vendas, despesas | `ano_mes` vira coluna derivada, não fonte de verdade |
| Recalcular `receita_liquida` quando divergente ou nula (`>R$0,05`) | vendas        | A fórmula contábil prevalece sobre o valor extraído |
| Recalcular `aging_dias` em relação à data de referência (2024-12-31) | estoque       | Aging precisa ser ancorado a uma data; evita "tempo congelado" |
| Recalcular `status_aging` a partir do `aging_dias` recalculado     | estoque       | Status é função do tempo, não pode contradizer o dado |
| Recalcular divergência gateway × ERP                               | pagamentos    | Garante consistência interna |
| Recalcular prazos (gateway/ERP) a partir das datas limpas          | pagamentos    | Mesma lógica |
| Flag `divergencia_significativa` quando \|%\| > 0,5%               | pagamentos    | Limiar configurável; insumo para Fase 5.4 (reconciliação assistida) |
| Inverter `data_competencia` × `data_pagamento` quando invertidas   | despesas      | Provisão não pode ser posterior ao pagamento |
| Inverter `data_primeira_compra` × `data_ultima_compra` se invertidas | clientes    | Erro de cadastro corrigido por regra |
| Inferir `centro_custo` por categoria onde possível, senão `nao_classificado` | despesas | Sobreviventes ficam sinalizados para revisão manual, não viram nulo silencioso |
| `is_recorrente` recalculado a partir de `frequencia_compras_ano ≥ 3` | clientes    | Definição operacional consistente |
| Remoção de duplicatas exatas (vendas, despesas) ou por chave (estoque, clientes) | todos | Dedup acontece **após** todos os recálculos, para colapsar linhas equivalentes |

---

## 4. Resultados — antes vs depois

Execução do pipeline (`python3 scripts/tratamento_dados.py`):

| Base        | Linhas dirty | Linhas processed | Duplicatas removidas | Nulos restantes | Domínios consolidados |
| ----------- | -----------: | ---------------: | -------------------: | --------------: | --------------------- |
| vendas      |       14.629 |           14.485 |                  144 |               0 | Canal 20→4 / Cat 20→4 |
| despesas    |          709 |              705 |                    4 |               0 | Cat 35→9              |
| pagamentos  |           96 |               96 |                    0 |               0 | Status 11→3           |
| estoque     |          202 |              202 |                    0 |               0 | Cat e status reescritos |
| clientes    |        2.206 |            2.200 |                    6 |               0 | UF 28→10 / Gên 10→3   |

Sete pagamentos ficam com **divergência significativa** (> 0,5%) — exatamente o tipo de caso que vai para a fila de reconciliação manual e que será automatizado na Fase 5.4.

---

## 5. Consolidação (camada `analytics/`)

O `consolidacao.py` cria um modelo dimensional leve sobre as bases tratadas:

- **`fato_vendas`** — vendas + custo unitário médio (ponderado por quantidade dos lotes) + margem de contribuição por linha.
- **`fato_pagamentos`** — pagamentos + `float_dias` (gateway → ERP) + classificação da divergência (`aceitavel`/`moderada`/`alta`).
- **`dim_sku`** — 58 SKUs com categoria, custo médio, preço médio praticado e margem unitária estimada.
- **`dim_calendario`** — 24 meses com trimestre, mês nominal e flag de alta temporada.
- **`clientes`, `despesas`, `estoque`** — operacional bruto preservado para validações.

Tudo é persistido em **`finance_ops.db`** (SQLite), com 8 índices nas colunas usadas em join/filtro (ano_mes, canal, sku_id, cliente_id). Esta base é o ponto de entrada das próximas fases — o modelo financeiro (Fase 3) e o dashboard (Fase 4) leem daqui.

---

## 6. Queries analíticas

`queries_analiticas.sql` traz 9 queries — as 5 do plano e 4 bônus que alimentam diretamente as fases seguintes.

| # | Análise | Saída |
| - | ------- | ----- |
| Q1 | Receita líquida por canal e período | 96 linhas (24 meses × 4 canais) |
| Q2 | Top 15 SKUs por margem de contribuição | 15 linhas |
| Q3 | Aging de estoque por categoria | 12 linhas (4 cat × 3 status) |
| Q4 | PMR, PMP e ciclo financeiro | 1 linha consolidada |
| Q5 | Taxa de devolução por canal (volume + valor) | 4 linhas |
| Q6 | Receita recorrente vs pontual por canal | 8 linhas |
| Q7 | DRE gerencial light — visão mensal | 24 linhas |
| Q8 | Pagamentos com divergência gateway × ERP | 7 linhas |
| Q9 | Sazonalidade — receita por mês do ano | 12 linhas |

Resultados em `data/analytics/resultados/Q*.csv`.

---

## 7. Decisões importantes documentadas

**Por que recalcular em vez de filtrar?** Quando o dado bruto está errado, filtrar perde volume; recalcular preserva o registro e corrige a métrica derivada. A receita líquida, o aging e a divergência são todos exemplos onde a fórmula contábil é a fonte da verdade, não o valor extraído.

**Por que `nao_classificado` em vez de nulo?** Centros de custo nulos viraram problema operacional (alguém precisa revisar). Substituir por nulo silencioso esconde a falha; uma categoria explícita força visibilidade. O dashboard vai mostrar isso como linha separada — é exatamente o que se quer.

**Por que dedup acontece no final?** Em vendas, parte das duplicatas chegou com uma das cópias corrompida (receita_liquida errada). Se o dedup rodasse antes do recálculo, essas duplicatas escapariam. A ordem `normaliza → recalcula → dedup` colapsa linhas que são logicamente equivalentes mas estavam visualmente diferentes.

**Por que SQLite e não Parquet ou DuckDB?** Para um portfólio que será aberto no GitHub e usado por outras pessoas, SQLite é zero-instalação e roda em qualquer ambiente. As 9 queries rodam em centenas de ms — performance suficiente. DuckDB seria mais rápido em dados maiores; vale considerar nas próximas fases se o volume crescer.

**Por que uma camada de consolidação separada?** Análises de FP&A raramente são feitas sobre tabelas operacionais cruas. Isolar o modelo dimensional num passo próprio: (1) deixa o tratamento focado em qualidade do dado, (2) torna as queries analíticas mais legíveis, (3) prepara o terreno para o modelo financeiro da Fase 3 (que vai consumir agregados, não linhas).

---

## 8. Como reproduzir

```bash
# Pré-requisitos: Python 3.10+, pandas, numpy
pip install pandas numpy faker

# 1. Gerar base limpa (Fase 1)
python3 scripts/gerar_base.py

# 2. Injetar sujeira (Fase 2 — etapa 0)
python3 scripts/sujar_base.py

# 3. Tratar e padronizar
python3 scripts/tratamento_dados.py

# 4. Consolidar e popular SQLite
python3 scripts/consolidacao.py

# 5. Rodar queries analíticas
sqlite3 data/analytics/finance_ops.db < scripts/queries_analiticas.sql
```

Todo o pipeline é determinístico (seed 42). Rodar de novo dá o mesmo resultado.
