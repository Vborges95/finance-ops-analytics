# Finance Ops & Analytics

> Estruturação financeira, operacional e analítica de uma empresa beauty omnichannel — um case completo de FP&A moderno, com automação, modelagem e IA aplicada a operações financeiras.

---

## 🎯 Sobre o projeto

Este projeto simula como uma operação financeira omnichannel pode evoluir de uma rotina operacional descentralizada — fechamento lento, planilhas paralelas, lançamentos sem padrão — para uma estrutura orientada a dados, automação e suporte à decisão.

Mais do que construir dashboards, a proposta foi estruturar **DRE gerencial, fluxo de caixa, capital de giro, indicadores e rotina de fechamento** para gerar previsibilidade, eficiência operacional e melhor visibilidade financeira.

O projeto também foi pensado sob a lógica de um **BPO moderno**: não apenas executar processos, mas utilizar dados, automação e IA aplicada para transformar operações financeiras em inteligência gerencial.

---

## 🔍 O problema

A operação financeira de empresas omnichannel do setor beauty enfrenta desafios recorrentes:

- **Fechamento lento** — fechamento mensal em D+12 ou mais, com retrabalho e conciliações manuais
- **Dados fragmentados** — gateway de pagamento, ERP, marketplace e franquia falando linguagens diferentes
- **Visibilidade limitada** — gestores recebem o resultado tarde demais para agir
- **Classificações inconsistentes** — mesmo lançamento entra em centros de custo diferentes a cada mês
- **Capital de giro pressionado** — PMR longo, PMP curto, sem visibilidade clara da NCG
- **Falta de previsibilidade** — forecast desconectado da realidade operacional

Este projeto demonstra, de ponta a ponta, como **estruturar processos, dados, modelo financeiro e IA aplicada** para resolver esses gargalos.

---

## 🧩 A solução

Sete fases conectadas, do dado bruto à inteligência gerencial:

| Fase | Entrega | O que demonstra |
|------|---------|------------------|
| **1. Base Simulada** | 5 CSVs (vendas, estoque, despesas, pagamentos, clientes) — 14k+ transações em 24 meses | Modelagem de dados de negócio, ruídos operacionais propositais |
| **2. Tratamento e Estruturação** | Pipeline Python em 4 camadas + 9 queries SQL + SQLite | Engenharia de dados aplicada a finanças, modelo dimensional |
| **3. Modelo Financeiro** | Excel com 15 abas (DRE consolidada/canal/categoria, Caixa, NCG, KPIs, Forecast 6M, ROI da transformação) | FP&A clássico, estruturação contábil-gerencial completa |
| **4 + 5. Dashboard + IA Aplicada** | App React em Vite (7 seções, IA integrada) + 4 artifacts standalone + documentação de prompts | Visualização sem BI proprietário · IA contextual em finanças · 5 capabilities de IA (1 integrado + 4 standalone, incluindo 1 bônus) |
| **6. Benchmark Natura** | Análise comparativa em 9 seções + tabela em 6 abas | Validação direcional contra a maior referência pública do setor beauty omnichannel |
| **7. Documentação** | README, metodologia, posts | Comunicação executiva do projeto |

---

## 📂 Estrutura do repositório

```text
finance-ops-analytics/
├── README.md                          # Você está aqui
├── data/
│   ├── raw/                           # CSVs limpos da Fase 1
│   ├── dirty/                         # Sujeira injetada (Fase 2 — etapa 0)
│   ├── processed/                     # Base tratada e padronizada (Fase 2)
│   └── analytics/                     # Modelo dimensional (Fase 2)
│       ├── finance_ops.db             # SQLite com fatos + dimensões + índices
│       ├── fato_vendas.csv
│       ├── fato_pagamentos.csv
│       ├── dim_sku.csv
│       └── dim_calendario.csv
├── scripts/
│   ├── gerar_base.py                  # Fase 1 — geração dos dados sintéticos
│   ├── sujar_base.py                  # Fase 2 — injeta ruído determinístico
│   ├── tratamento_dados.py            # Fase 2 — limpeza, recálculo e dedup
│   ├── consolidacao.py                # Fase 2 — modelo dimensional + SQLite
│   └── queries_analiticas.sql         # Fase 2 — 9 queries analíticas
├── modelo/
│   └── modelo_financeiro.xlsx         # 15 abas — DRE, Caixa, NCG, KPIs, Forecast, ROI (Fase 3)
├── dashboard/                         # App React (Fases 4 + 5)
│   ├── README.md                      # Setup local específico do app
│   ├── package.json                   # React 19 · Vite 8 · Tailwind 3 · Recharts 3 · Lucide
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   ├── index.html
│   ├── .env.example                   # Template da chave Anthropic
│   ├── public/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                    # Dashboard com 7 seções + DATA embarcado
│       └── artifacts/
│           └── Comentarios.jsx        # Artifact 5.2 — integrado ao dashboard
├── ia/                                # Artifacts standalone (Fase 5)
│   ├── classificador.jsx              # 5.1 — Classificador de lançamentos
│   ├── alertas.jsx                    # 5.3 — Monitor de alertas operacionais
│   ├── reconciliacao.jsx              # 5.4 — Reconciliação gateway × ERP
│   ├── analise_variacoes.jsx          # 5.5 — Análise de variações (bônus)
│   └── prompts_ia.md                  # Documentação dos prompts dos 5 artifacts
├── benchmark/
│   ├── benchmark_natura.md            # Análise comparativa escrita (9 seções)
│   └── tabela_comparativa_natura.xlsx # Tabela estruturada (6 abas)
└── docs/
    ├── metodologia.md                 # Documentação técnica geral
    ├── antes_depois.md                # Fluxo operacional comparativo
    ├── fase1_documentacao.md          # Detalhamento da base sintética
    ├── documentacao_tratamento.md     # Detalhamento do tratamento e SQL
    ├── fase3_documentacao.md          # Detalhamento do modelo financeiro
    ├── fase4_5_documentacao.md        # Detalhamento do dashboard e da IA aplicada
    └── fase6_documentacao.md          # Detalhamento do benchmark Natura
```

---

## 🔧 Stack

- **Dados:** Python 3.10+ (Pandas, NumPy, Faker), SQLite
- **Modelagem:** Excel (15 abas — DRE gerencial, fluxo de caixa, NCG, forecast)
- **Visualização:** React 19 + Vite 8 + Tailwind CSS 3 + Recharts 3 + Lucide React
- **IA aplicada:** API Anthropic — `claude-sonnet-4-20250514`
- **Documentação:** Markdown

---

## 📊 Highlights por fase

### Fase 1 — Base Simulada
24 meses (Jan/2023 → Dez/2024) de operação de uma empresa beauty omnichannel — **14.485 transações, R$ 4,57M de receita bruta, 2.200 clientes e 58 SKUs**, distribuídos entre 4 canais (e-commerce 42%, marketplace 28%, franquia 18%, loja própria 12%) e 4 categorias (skincare, maquiagem, perfumes, haircare), com sazonalidade real do setor (picos em Dia das Mães, Black Friday e Natal), 28,9% de recorrência e ruídos operacionais propositais — incluindo **divergências gateway × ERP em 33% dos pagamentos** que servem de matéria-prima para as fases seguintes. Base 100% determinística (seed fixa). Documentação completa em [`docs/fase1_documentacao.md`](docs/fase1_documentacao.md).

### Fase 2 — Tratamento de Dados
Pipeline em **4 camadas** — `raw/ → dirty/ → processed/ → analytics/`. A camada `dirty/` injeta ruído determinístico (canais com 20 grafias, valores em string com `R$`, datas BR misturadas com ISO, divergências gateway × ERP reforçadas, duplicatas). O tratamento aplica regras idempotentes e auditáveis: padronização via `slugify`, recálculo de receita líquida quando divergente, aging recalculado vs data de referência, inversão competência×pagamento corrigida e flag `divergencia_significativa` (> 0,5%) — que isola exatamente os **7 pagamentos** que vão para a fila de reconciliação manual. O resultado é consolidado em modelo dimensional leve (fato_vendas, fato_pagamentos, dim_sku, dim_calendario) persistido em **SQLite com 8 índices**. **9 queries SQL** (5 do plano + 4 bônus) alimentam diretamente Fases 3 e 4. Documentação completa em [`docs/documentacao_tratamento.md`](docs/documentacao_tratamento.md).

### Fase 3 — Modelo Financeiro
O coração analítico do projeto. **15 abas** estruturadas em premissas centralizadas → bases ligadas → DREs (consolidada, por canal, por categoria) → fluxo de caixa (direto + indireto) → capital de giro (PMR, PMP, PME, NCG, ciclo financeiro) → estoque (aging, giro, cobertura) → KPIs → forecast 6M → Antes vs Depois → dashboard executivo. A operação simulada conta uma história forte: **EBITDA acumulado negativo (−R$ 502K em 24m), mas com break-even cruzado em Nov-Dez/2024 e forecast 1S/2025 positivo** — uma empresa em virada, não em equilíbrio. A margem de contribuição estável em ~45% mostra que o problema não é preço/CMV, é escala. **O cálculo de ROI da transformação operacional entrega payback de 7,7 meses e ROI de 56% em 12 meses, independentemente do desempenho top-line** — argumento sustentável para modernização da controladoria mesmo em empresa deficitária. Documentação completa em [`docs/fase3_documentacao.md`](docs/fase3_documentacao.md).

### Fase 4 — Dashboard editorial
**App React + Vite 8** com 7 seções de navegação (Visão Geral, DRE, Mix & Canais, Capital de Giro, Estoque & SKUs, Antes vs Depois, e IA · Comentários). Visual editorial dark mode — Cormorant Garamond para títulos, JetBrains Mono para números, paleta verde-petróleo com acentos rosa e dourado — assina autoria e contrasta com BI proprietário genérico. Filtros sticky de canal e período propagam para todas as seções, inclusive a de IA. Dados embarcados como snapshot da Fase 3, deploy trivial em qualquer host estático.

### Fase 5 — IA Aplicada (5 artifacts)

A fase final entrega **cinco aplicações de IA** com a API Anthropic (Claude Sonnet 4) — uma integrada ao dashboard e quatro como artifacts standalone que podem ser abertos individualmente no Claude.ai:

| ID | Artifact | Status | O que demonstra |
|----|----------|--------|------------------|
| **5.1** | **Classificador Inteligente** | Standalone | Lançamentos com descrição livre → categoria + centro de custo + justificativa + nível de confiança |
| **5.2** | **Gerador de Comentários** | **Integrado** | Recorte ativo do dashboard → comentário executivo em 3 estilos (Executivo/Técnico/Board) × 3 focos |
| **5.3** | **Monitor de Alertas** | Standalone | KPIs do mês vs baseline → IA prioriza anomalias com severidade e sugestão de ação |
| **5.4** | **Reconciliação Assistida** | Standalone | Extratos gateway × ERP → IA classifica divergências (taxa, duplicidade, data) |
| **5.5** | **Análise de Variações** *(bônus)* | Standalone | Dois períodos comparáveis → IA decompõe a variação em drivers + perguntas-piloto |

Acompanha **`prompts_ia.md`** com a documentação completa dos system prompts, user prompts e notas de tuning de cada artifact — engenharia de prompt como **ativo do projeto**, não detalhe escondido. Documentação técnica completa em [`docs/fase4_5_documentacao.md`](docs/fase4_5_documentacao.md).

### Fase 6 — Benchmark Natura
Validação direcional do case contra a maior referência pública do setor beauty omnichannel brasileiro. Análise comparativa escrita em 9 seções + tabela estruturada em 6 abas, usando exclusivamente dados públicos (releases 4T24 → 1T26, Investor Day 2025, ITRs/DFPs da CVM e análises sell-side de XP, Bradesco BBI, BTG, Itaú BBA, Nord). A diferença de escala (10.000x) impede comparação de magnitude, mas viabiliza calibrar **direção**. Quatro achados centrais: (1) margem de contribuição da empresa-modelo 20 p.p. abaixo do potencial estrutural do setor — explicável por escala, marca e mix; (2) **a Natura provou em 2024-2026 que crescimento de receita não garante sustentabilidade** (cresceu 21,5% em 2024 com prejuízo de R$ 8,9 bi; caiu 5% em 2025 gerando R$ 138 mi de caixa positivo); (3) capital de giro patológico na empresa-modelo (NCG = 489 dias de receita) — e capital de giro é uma das três grandes alavancas estratégicas declaradas da Natura no Investor Day 2025; (4) omnicanalidade segue desafio estrutural mesmo para a Natura, em "Onda 2" de integração com a Avon há 5+ anos. Documentação completa em [`docs/fase6_documentacao.md`](docs/fase6_documentacao.md).

---

## 💡 Por que este projeto

Existe muito conteúdo sobre dashboards de finanças. Existe pouco conteúdo sobre **o processo financeiro por trás do dashboard** — fechamento, conciliação, classificação, controle orçamentário, capital de giro. E existe quase nada sobre como **IA aplicada a operações financeiras** muda esse processo no dia a dia.

Este projeto se posiciona exatamente nessa interseção: **Financial Operations + Process Improvement + IA aplicada a finanças**.

---

## 👤 Autor

**Vinicius Borges** — Profissional de FP&A e Controladoria com experiência em fechamento, conciliações, controle orçamentário e análise de variações. Posicionamento na interseção entre Financial Operations, Process Improvement e IA aplicada a finanças.

- 💼 [LinkedIn](https://linkedin.com/in/viniciusagborges)
- ✉️ [Email](mailto:borgesavvg95@hotmail.com)

---

## 📜 Licença

Este projeto é um case de portfólio. Os dados são integralmente simulados. A comparação com a Natura utiliza exclusivamente informações públicas (CVM, releases, relatórios anuais).
