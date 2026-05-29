# Metodologia

Documentação técnica do projeto **Finance Ops & Analytics**. Este documento descreve as premissas, decisões de design e a lógica por trás de cada fase, complementando o `README.md` (visão executiva) e o `antes_depois.md` (transformação operacional).

---

## 1. Abordagem geral

O projeto foi construído como uma **cadeia conectada de entregáveis**, em que cada fase produz insumos para a próxima:

```
Fase 1 (dados brutos)
    ↓
Fase 2 (dados tratados + SQL)
    ↓
Fase 3 (modelo financeiro)
    ↓
Fase 4 (dashboard)        Fase 5 (IA aplicada)
    ↓                          ↓
        Fase 6 (benchmark)
                ↓
        Fase 7 (publicação)
```

A premissa de design é simples: **um analista de FP&A deveria poder rodar o projeto inteiro do zero**, gerar a base, tratar, modelar, visualizar e gerar inteligência — sem nenhum dado real, sem nenhuma ferramenta proprietária além do Excel.

---

## 2. Premissas do case

### 2.1 Empresa-modelo

Empresa fictícia do setor **beauty omnichannel brasileiro**, com:

- 24 meses de operação (Jan/2023 → Dez/2024)
- 4 canais de venda: e-commerce próprio (42% do mix), marketplace (28%), franquia (18%) e loja própria (12%)
- 4 categorias de produto: skincare (32%), maquiagem (28%), perfumes (22%), haircare (18%)
- 58 SKUs ativos
- 2.200 clientes (46% recorrentes, com frequência ≥ 3 compras/ano)
- Receita mista: 70% compras pontuais + 30% recorrência
- Crescimento mensal de ~0,8% (≈10% a.a.)
- Volume base de ~500 transações/mês, com sazonalidade aplicada

Para o detalhamento completo da base — premissas, agregados resultantes, dicionários de dados e ruídos embutidos — ver [`docs/fase1_documentacao.md`](fase1_documentacao.md).

### 2.2 Por que beauty omnichannel?

Três razões:

1. **Complexidade real** — o setor combina alta sazonalidade, devoluções relevantes, marketplaces com comissões diferenciadas, franquias com regimes próprios e e-commerce com gateway. É o cenário ideal para mostrar consolidação multi-canal.
2. **Benchmark público disponível** — Natura, Boticário e Avon publicam ITR/DFP, releases e relatórios anuais com riqueza analítica. Permite ancorar o case em referências de mercado.
3. **Aderência ao perfil profissional** — o setor é representativo de operações financeiras complexas, com fechamento intenso, conciliações múltiplas e necessidade real de FP&A estruturado.

### 2.3 Variáveis e ruídos simulados

A base bruta foi gerada com **problemas intencionais**, replicando o que aparece em operações reais. Os principais ruídos embutidos:

- **Divergências entre gateway e ERP** — 33% dos pagamentos consolidados apresentam divergência de valor (taxa, data ou registro)
- **Lotes em status crítico** — 55% dos lotes de estoque com aging > 365 dias (pressiona NCG e giro)
- **Gap competência × pagamento** — despesas com até 15 dias de defasagem entre data de competência e data de pagamento efetivo
- **Comissões variáveis** — variação de ±1 p.p. nas comissões de marketplace, replicando o comportamento real de tarifas
- **Devoluções com lag implícito** — recebíveis afetados retroativamente, distorcendo a margem do mês se não tratado
- **Despesas esporádicas** — juros lançados apenas em meses específicos (Fev, Mar, Jul, Ago), quebrando previsibilidade orçamentária

Esses ruídos são o ponto onde o projeto deixa de ser "demonstração com dados perfeitos" e vira **um case operacional**. Detalhamento completo em `docs/fase1_documentacao.md`.

---

## 3. Fase 1 — Base Simulada

### Stack

Python, Pandas, NumPy, Faker. Seed fixa em 42 — reprodutibilidade total.

### Datasets gerados

| Dataset | Granularidade | Linhas | Colunas |
|---------|---------------|--------|---------|
| `vendas.csv` | Transação | 14.485 | 16 |
| `estoque.csv` | Lote × SKU | 202 | 10 |
| `despesas.csv` | Lançamento | 705 | 12 |
| `pagamentos.csv` | Mês × canal | 96 | 16 |
| `clientes.csv` | Cliente | 2.200 | 13 |

### Agregados resultantes

- **Receita bruta total:** R$ 4.571.979,59
- **Receita líquida total:** R$ 3.996.300,05
- **Despesa total:** R$ 2.393.592,52 (pessoal = 51%)
- **Custo imobilizado em estoque:** R$ 2.615.654,42
- **LTV médio dos clientes:** R$ 1.506,72
- **Ticket médio:** R$ 216,43

### Premissas de simulação

- **Sazonalidade:** picos em Mai (1,35×, Dia das Mães), Jun (1,18×, Dia dos Namorados), Nov (1,42×, Black Friday) e Dez (1,28×, Natal)
- **Taxa de devolução por canal:** e-commerce 3% / marketplace 8% / franquia 5% / loja própria 2% — todas validadas no agregado observado
- **Margens-base por categoria:** skincare 62% / maquiagem 55% / perfumes 48% / haircare 50%
- **Comissões por canal:** marketplace 17% / franquia 12% / e-commerce 4% / loja própria 0%

> Detalhamento completo em [`docs/fase1_documentacao.md`](fase1_documentacao.md).

---

## 4. Fase 2 — Tratamento e Estruturação

### Stack

Python (Pandas, NumPy) + SQLite.

### Arquitetura em 4 camadas

Diferente do que o plano original previa (raw → processed), o pipeline final tem **quatro camadas**, com uma etapa explícita de "sujar a base" antes do tratamento:

```
data/raw/      data/dirty/                 data/processed/            data/analytics/
 (Fase 1)  →  (sujar_base.py)         →  (tratamento_dados.py)   →   (consolidacao.py)
              ruído determinístico        limpeza + recálculo         modelo dimensional + SQLite
```

A camada `dirty/` foi adicionada deliberadamente: sem ela, o tratamento ficaria sem o que tratar — e a narrativa "antes vs depois" perderia sustância. Cada problema injetado tem rastro auditável (seed fixa em 42), garantindo reprodutibilidade.

### Princípios do pipeline

| Princípio | Significado prático |
|-----------|---------------------|
| **Idempotente** | Rodar 2x dá o mesmo resultado |
| **Auditável** | Cada regra reporta quantas linhas afetou |
| **Não-destrutivo** | A camada anterior continua intacta |
| **Determinístico** | Zero aleatoriedade na etapa de tratamento |

### Tratamento (`tratamento_dados.py`)

Cinco famílias de regras, aplicadas em ordem específica:

1. **Padronização de domínios categóricos** — função `slugify` normaliza texto (minúsculo → sem acento → snake_case), depois mapeia para dicionários canônicos (`CANAL_ALIAS`, `CATEGORIA_ALIAS`, `UF_ALIAS`, `GENERO_ALIAS`, etc.)
2. **Coerção de tipos** — datas em formato misto (ISO + BR) via parser em cascata; valores monetários em string (`"R$ 1.234,56"`) → float
3. **Recálculo de métricas derivadas** — receita líquida, aging, divergência gateway × ERP, `is_recorrente`, `ano_mes` — todas recomputadas a partir das fontes primárias limpas
4. **Correção de inversões lógicas** — competência > pagamento, primeira_compra > última_compra
5. **Deduplicação no final** — só depois das normalizações, para colapsar linhas que eram logicamente equivalentes mas visualmente diferentes

### Consolidação (`consolidacao.py`)

Modelo dimensional leve sobre as bases tratadas:

| Tabela | Tipo | Conteúdo |
|--------|------|----------|
| `fato_vendas` | Fato | Vendas + custo unitário médio (ponderado por quantidade dos lotes) + margem de contribuição por linha |
| `fato_pagamentos` | Fato | Pagamentos + `float_dias` (gateway → ERP) + classificação da divergência (aceitável/moderada/alta) |
| `dim_sku` | Dimensão | 58 SKUs com categoria, custo médio, preço médio e margem unitária estimada |
| `dim_calendario` | Dimensão | 24 meses com trimestre, mês nominal e flag de alta temporada (Mai, Nov, Dez) |
| `clientes`, `despesas`, `estoque` | Operacional bruto | Preservados para validações cruzadas |

Tudo é persistido em **`finance_ops.db`** (SQLite), com 8 índices em `ano_mes`, `canal`, `sku_id`, `cliente_id` — as colunas mais usadas em join/filtro.

### Camada SQL (`queries_analiticas.sql`)

Nove queries — as cinco do plano original mais quatro bônus:

| # | Análise | Saída |
|---|---------|-------|
| Q1 | Receita líquida por canal e período | 96 linhas (24 meses × 4 canais) |
| Q2 | Top 15 SKUs por margem de contribuição | 15 linhas |
| Q3 | Aging de estoque por categoria | 12 linhas |
| Q4 | PMR, PMP e ciclo financeiro | 1 linha consolidada |
| Q5 | Taxa de devolução por canal | 4 linhas |
| **Q6** | **Receita recorrente vs pontual por canal** | 8 linhas |
| **Q7** | **DRE gerencial light — visão mensal** | 24 linhas |
| **Q8** | **Pagamentos com divergência > 0,5%** | 7 linhas (entrada da Fase 5.4) |
| **Q9** | **Sazonalidade — receita média por mês do ano** | 12 linhas |

### Resultados do tratamento — antes vs depois

| Base | Linhas dirty | Linhas processed | Duplicatas removidas | Nulos restantes |
|------|-------------:|------------------:|---------------------:|----------------:|
| vendas | 14.629 | 14.485 | 144 | 0 |
| despesas | 709 | 705 | 4 | 0 |
| pagamentos | 96 | 96 | 0 | 0 |
| estoque | 202 | 202 | 0 | 0 |
| clientes | 2.206 | 2.200 | 6 | 0 |

Sete pagamentos saem do tratamento com **divergência significativa** (`|div%| > 0,5%`) — exatamente o tipo de caso que vai para a fila de reconciliação manual e que será automatizado na Fase 5.4.

### Decisões importantes

**Por que recalcular em vez de filtrar?** Quando o dado bruto está errado, filtrar perde volume; recalcular preserva o registro e corrige a métrica derivada. Receita líquida, aging e divergência são todos casos onde a fórmula contábil é fonte da verdade, não o valor extraído.

**Por que `nao_classificado` em vez de nulo?** Centros de custo nulos viraram problema operacional — alguém precisa revisar. Substituir por nulo silencioso esconde a falha; uma categoria explícita força visibilidade no dashboard.

**Por que dedup no final?** Em vendas, parte das duplicatas chegou com uma das cópias corrompida (receita_liquida errada). Se o dedup rodasse antes do recálculo, essas duplicatas escapariam. A ordem `normaliza → recalcula → dedup` colapsa linhas equivalentes.

**Por que SQLite e não Parquet/DuckDB?** Para um portfólio aberto no GitHub, SQLite é zero-instalação e roda em qualquer ambiente. As 9 queries rodam em centenas de ms — performance suficiente. DuckDB seria mais rápido em dados maiores; vale considerar se o volume crescer.

**Por que uma camada de consolidação separada?** Análises de FP&A raramente são feitas sobre tabelas operacionais cruas. Isolar o modelo dimensional num passo próprio (1) deixa o tratamento focado em qualidade do dado, (2) torna as queries analíticas mais legíveis, (3) prepara o terreno para o modelo financeiro da Fase 3, que consome agregados e não linhas.

> Detalhamento completo, incluindo dicionários de alias e tabela de problemas injetados, em [`docs/documentacao_tratamento.md`](documentacao_tratamento.md).

---

## 5. Fase 3 — Modelo Financeiro

### Stack

Excel (sem macros, sem complementos externos).

### Estrutura em 15 abas

O plano original previa 10 abas; o modelo final tem 15, organizadas em quatro blocos: **premissas → bases ligadas → análises derivadas → visão executiva**.

| Bloco | Abas | Função |
|-------|------|--------|
| Capa & premissas | 01_Capa, 02_Premissas | Índice, legenda de cores, parâmetros editáveis (forecast, inflação, sazonalidade, antes vs depois) |
| Bases ligadas | 03_Base_Vendas, 04_Base_Despesas, 05_Base_Apoio | Camada intermediária consolidando dados da Fase 2 — evita fórmulas longas pulando entre as abas analíticas |
| DREs e fluxos | 06_DRE_Consolidada, 07_DRE_por_Canal, 08_DRE_por_Categoria, 09_Fluxo_de_Caixa | DRE gerencial mensal + fluxo de caixa direto e indireto |
| Capital, estoque, KPIs | 10_Capital_de_Giro, 11_Estoque_e_Giro, 12_KPIs | PMR/PMP/PME/NCG, aging, giro, painel consolidado |
| Forward-looking | 13_Forecast_6M | Projeção 1S/2025 com média móvel × growth × sazonalidade |
| Transformação | 14_Antes_vs_Depois | ROI do projeto de modernização da controladoria |
| Visão executiva | 15_Dashboard_Exec | Cards, mix por canal/categoria, top SKUs |

### Premissas centralizadas (aba 02)

- **Growth por canal:** e-commerce 2,5% a.m. · marketplace 1,5% · franquia 1,0% · loja própria 0,8%
- **Inflação aplicada às despesas no forecast:** 0,5% a.m. (≈6,2% a.a.)
- **Sazonalidade do forecast:** fatores aplicados a Jan–Jun/2025
- **Antes vs Depois:** parâmetros do projeto de transformação (horas, custo/hora, retrabalho, divergências)

### KPIs implementados

- Margem de contribuição, margem EBITDA, margem operacional (consolidado e por canal/categoria)
- PMR Gateway, PMR ERP, PME, PMP, ciclo financeiro
- NCG estimada (em R$ e em dias de receita)
- Giro de estoque, cobertura em meses
- Taxa de devolução
- EBITDA médio/mês e crescimento de receita por canal

### Achados centrais do modelo

Cinco leituras saem do modelo construído:

1. **Operação em virada** — EBITDA 24m: −R$ 502K, mas Nov-Dez/2024 cruzam o break-even e o forecast 1S/2025 entrega EBITDA positivo (+R$ 30.777, margem 2,3%)
2. **Problema é escala, não margem** — margem de contribuição estável em ~45% nos 24 meses
3. **Perfumes lidera receita (38,5% do mix) mas concentra o maior valor em aging crítico** (R$ 546K) — alvo natural de liquidação
4. **Marketplace amplia o PMR ERP** (30 dias vs 14 do e-commerce) — alavanca principal para reduzir NCG
5. **ROI da transformação operacional: payback 7,7 meses, ROI 56% em 12 meses** — independente do top-line, o investimento em controladoria moderna se paga

### Decisões de design

**Por que modelo gerencial e não fiscal?** O foco é a leitura que o gestor precisa para decidir — margem por canal, geração de caixa, NCG, giro. Tributos federais e estaduais ficaram de fora porque sua inclusão exigiria modelar o regime tributário (Simples × Lucro Presumido × Lucro Real) sem agregar à pergunta central.

**Por que rateio proporcional à receita líquida nas DREs por canal/categoria?** É a convenção mais utilizada em controllerships brasileiros — alternativas (rateio por margem, por volume) distorcem a leitura de quem está rentável ou não.

**Por que NCG estimada e não calculada?** O fluxo de caixa está em regime de competência simplificado. Calcular variação real de NCG entre meses exigiria saldos mensais de contas a receber e pagar, que não vêm do modelo. A estimativa (CR ≈ receita diária × PMR; CP ≈ (CMV + Desp) × PMP) é suficiente para indicar ordem de grandeza.

> Detalhamento completo, incluindo tabelas mensais e narrativas, em [`docs/fase3_documentacao.md`](fase3_documentacao.md).

---

## 6. Fases 4 e 5 — Dashboard e IA Aplicada (entrega fundida)

O plano original previa as Fases 4 e 5 como entregas separadas. Na prática, foram **fundidas em uma única entrega arquitetural** — um dashboard React em Vite com 1 artifact de IA integrado, complementado por 4 artifacts standalone. A fusão respeita o que o produto pede: o gerador de comentários só faz sentido se lê o recorte ativo do dashboard.

### Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | React 19 |
| Build | Vite 8 |
| Estilização | Tailwind CSS 3 |
| Gráficos | Recharts 3 |
| Ícones | Lucide React |
| Tipografia | Cormorant Garamond + Inter + JetBrains Mono |
| IA | API Anthropic — `claude-sonnet-4-20250514` |

### 6.1 Dashboard editorial (Fase 4)

**Sete seções de navegação:**

| # | Seção | Conteúdo |
|---|-------|----------|
| 01 | Visão Geral | Headline KPIs + série temporal + mix por canal |
| 02 | DRE Gerencial | Tabela consolidada com drill-down por canal |
| 03 | Mix & Canais | Composição de receita por canal e categoria |
| 04 | Capital de Giro | PMR (gateway/ERP), PME, PMP, ciclo financeiro, NCG |
| 05 | Estoque & SKUs | Aging por categoria, top SKUs por margem |
| 06 | Antes vs Depois | ROI da transformação (puxado da Fase 3) |
| 07 | IA · Comentários | Gerador de comentários executivos (artifact 5.2 integrado) |

**Filtros globais** sticky no header (canais multi-select + período em atalhos) propagam para todas as seções via props (`selectedCanais`, `periodIndices`) — inclusive para o componente de IA.

**Visual editorial dark mode:** fundo `#07130F` com acentos rosa/verde/dourado, headline *"A operação, decifrada em números."* Tipografia serifada para títulos, mono para números. A escolha é deliberada — um portfólio precisa **chamar atenção visual** sem perder profissionalismo.

**Dados embarcados:** snapshot do modelo financeiro da Fase 3 em uma constante `DATA` dentro do próprio `App.jsx`. Aplicação roda sem backend, deploy trivial em qualquer host estático.

### 6.2 IA Aplicada (Fase 5) — 5 artifacts

A entrega final tem **5 artifacts**, não 4 como o plano original previa. O quinto é um bônus que surgiu naturalmente:

| ID | Artifact | Status | O que demonstra |
|----|----------|--------|------------------|
| 5.1 | **Classificador Inteligente** | Standalone | Lançamentos com descrição livre → categoria + centro de custo + justificativa + nível de confiança |
| 5.2 | **Gerador de Comentários** | **Integrado** | Recorte do dashboard → comentário executivo em 3 estilos × 3 focos |
| 5.3 | **Monitor de Alertas** | Standalone | KPIs vs baseline → IA prioriza anomalias com severidade |
| 5.4 | **Reconciliação Assistida** | Standalone | Extratos gateway × ERP → IA classifica divergências |
| 5.5 | **Análise de Variações** *(bônus)* | Standalone | Dois períodos comparáveis → drivers + perguntas-piloto |

**Padrão técnico comum:**
- Modelo `claude-sonnet-4-20250514`
- Saída em JSON estruturado (exceto Comentários, que é prosa)
- Parsing comum: `text.replace(/```json|```/g, "").trim()` → `JSON.parse()`
- Max tokens entre 1.500 e 3.000
- Idioma: português brasileiro

**Diferença técnica entre standalone e integrado:**

Os 4 standalone foram desenhados para rodar **dentro do ambiente artifact do Claude.ai** — chamam `/v1/messages` sem headers de autenticação, e o ambiente faz proxy automático.

O Comentários (integrado) foi adaptado para o ambiente **Vite + browser** — usa `import.meta.env.VITE_ANTHROPIC_API_KEY` e o flag `anthropic-dangerous-direct-browser-access: true`. Em produção real, a chave passaria por um backend proxy; para um portfólio com chave do próprio autor, é aceitável e documentado.

### 6.3 Decisões de design

**Por que fundir Fase 4 e 5?** O gerador de comentários precisa ler o recorte ativo do dashboard. Forçar separação significaria duplicar filtros, duplicar dados, perder contextualização.

**Por que manter 4 artifacts standalone em vez de integrar todos?** Cada artifact demonstra uma capability autossuficiente. Standalone, eles ganham vida própria — abrem direto no Claude.ai e são linkáveis individualmente. Isso **multiplica o material de divulgação**: 1 post por artifact = 7 posts de portfólio ao longo de semanas.

**Por que React 19 + Vite 8?** Versões correntes, bundle pequeno, dev server rápido. Vite escolhido sobre Next porque o app é puramente client-side — não há SSR nem rotas no servidor.

**Por que dados embarcados em vez de fetch?** Trade-off claro para portfólio: app que abre instantaneamente em qualquer host estático supera arquitetura cliente-servidor "correta". Em uma versão "produção", esses dados viriam de um endpoint.

**Por que JSON estruturado na maioria dos artifacts?** O output precisa ser **consumível por código**, não apenas legível por humano. JSON com schema previsível permite renderizar, ordenar, filtrar e auditar — coisa que prosa livre não permite. Comentários é a exceção porque o output **é** o produto final.

**Por que documentar prompts em arquivo separado?** Em IA aplicada, o prompt é parte do código. O `ia/prompts_ia.md` traz para cada artifact: contexto, system prompt, user prompt template, formato de saída e notas de tuning. **Tratamos prompts como contratos**: input estruturado → instrução clara → output em formato fechado.

> Detalhamento completo das 7 seções do dashboard, da arquitetura dos 5 artifacts e de cada decisão técnica em [`docs/fase4_5_documentacao.md`](fase4_5_documentacao.md).

---

## 7. Fase 6 — Benchmark Natura

### Fontes públicas utilizadas

| Categoria | Itens |
|-----------|-------|
| Demonstrações Natura | Releases 4T24 → 1T26 (5 trimestres), Investor Day 2025, ITRs e DFPs (CVM e site de RI) |
| Análises sell-side | XP, Bradesco BBI, BTG Pactual, Itaú BBA, Nord, BB Investalk |
| Veículos jornalísticos | InfoMoney, Exame, Money Times, Valor, NeoFeed, Reuters Brasil, Suno, entre outros |

### Estrutura da entrega

| Arquivo | Tipo |
|---------|------|
| `benchmark_natura.md` | Análise escrita em 9 seções |
| `tabela_comparativa_natura.xlsx` | Comparativo estruturado em 6 abas |

### Análises construídas

Quatro leituras consolidadas, cada uma com implicação direta para a narrativa do projeto:

1. **Gap de margem de ~20 p.p.** entre empresa-modelo (45,2% de margem de contribuição) e Natura (66,3% de margem bruta IFRS, FY2025). Explicável por escala, marca e mix — sinaliza oportunidade futura, não problema atual.

2. **Crescimento de receita não garante sustentabilidade.** A Natura demonstrou em 2024 (+21,5% YoY com prejuízo de R$ 8,9 bi) e 2025 (−5,0% em reais com FCFL +R$ 138 mi) que a geração de caixa depende de **margem + capital de giro + capex + alavancagem** — não de aceleração de top line.

3. **Capital de giro como alavanca estratégica declarada.** A Natura cita capital de giro nas três grandes alavancas de geração de caixa no Investor Day 2025. A empresa-modelo apresenta NCG patológica (489 dias de receita) — o que valida o diagnóstico da Fase 3.

4. **Omnicanalidade segue desafio estrutural mesmo para a maior referência.** A Natura está em "Onda 2" de integração com a Avon Latam desde 2020, com conclusão plena prevista para 2026 (5–6 anos de ciclo). Isso valida que os problemas modelados na Fase 2 (classificação inconsistente, divergência gateway × ERP, SKUs duplicados) **são problemas estruturais reais do setor**, não patologias locais.

### Decisão metodológica

O benchmark **não busca recriar a Natura nem comparar performance de igual para igual** — a diferença de escala (10.000x) impede comparação de magnitude. O que faz sentido é calibrar **direção**: "estoque com 56% de aging crítico é compatível com o que a maior referência do setor tolera?". A resposta é "não", e isso valida o diagnóstico.

A entrega explicita as limitações:

- Diferença entre margem de contribuição gerencial (empresa-modelo) e margem bruta IFRS (Natura)
- Verticalização produtiva e poder de marca da Natura
- Operação multinacional vs operação simulada local
- Detalhamento de PMR/PME/PMP não publicado pela Natura em releases trimestrais

> Detalhamento completo, incluindo as 9 seções da análise e a tabela em 6 abas, em [`docs/fase6_documentacao.md`](fase6_documentacao.md).

---

## 8. Decisões transversais

### Por que dados sintéticos?

Dados reais de empresa do setor não são públicos, e usar dados sigilosos compromete o projeto. Dados sintéticos com **ruído realista** entregam o mesmo aprendizado pedagógico sem risco.

### Por que Excel no modelo central?

Porque é onde o FP&A vive. O projeto não está provando que sabe fazer modelo em Python — está mostrando que entende a operação real, e ela passa por planilhas auditáveis com fórmulas rastreáveis.

### Por que IA com API e não com framework?

Chamar a API Anthropic diretamente (sem LangChain, sem orchestration) deixa o código **legível e auditável**. Em finanças, auditabilidade do raciocínio é requisito, não detalhe.

---

## 9. Limitações e próximos passos

### Limitações reconhecidas

- A base é sintética — padrões e correlações foram desenhados, não observados
- O modelo não cobre tributação completa (foco no gerencial, não fiscal)
- O dashboard React é demonstrativo, sem backend de produção
- A IA aplicada usa prompts fixos — em produção, fine-tuning ou few-shot com histórico próprio seria o próximo passo

### Próximos passos possíveis

- Conectar a IA a uma base histórica real para aprendizado
- Adicionar uma camada de orçamento com workflow de aprovação
- Modelar cenários (otimista/base/pessimista) com sensibilidade
- Integrar com ferramentas reais via MCP (Asana, Slack, Google Drive)

---

*Documento técnico — Finance Ops & Analytics*
