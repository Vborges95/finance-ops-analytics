# Antes vs Depois — Fluxo Operacional

Este documento descreve o **antes vs depois** da rotina financeira da empresa-modelo. É a leitura operacional do projeto: o que mudou no dia a dia do time de finanças após a estruturação proposta.

A leitura é prática. Não é sobre "ter dashboard" — é sobre **como a operação financeira passa a funcionar** quando dados, processo e IA aplicada estão estruturados.

---

## 1. Visão consolidada

| Dimensão | Antes | Depois |
|----------|-------|--------|
| **Prazo de fechamento** | D+12 | D+5 |
| **Classificação de lançamentos** | Manual, inconsistente entre meses | Sugerida por IA, com explicação e aprovação |
| **Reconciliação gateway × ERP** | 1–2 dias de trabalho manual | Automatizada com divergências classificadas |
| **Comentário executivo do mês** | 1–2 dias do controller escrevendo | Draft gerado por IA, controller revisa |
| **Visibilidade de capital de giro** | Calculado uma vez por mês, em planilha solta | Painel sempre atualizado (PMR, PMP, NCG) |
| **Identificação de anomalias** | Reativa — alguém percebe que algo está errado | Proativa — monitor de alertas prioriza |
| **Drill-down por canal/categoria** | Demanda do gestor → analista monta sob demanda | Self-service no dashboard |
| **Forecast** | Replicação do mês anterior + ajustes manuais | Modelo de projeção integrado ao DRE |
| **Auditabilidade** | "Confia no Excel da [pessoa]" | Pipeline rastreável: dado bruto → tratamento → modelo |

---

## 2. O fluxo operacional, passo a passo

### 2.1 Antes — Fechamento D+12

```
D+1  →  Times de canal mandam fechamentos em planilhas separadas
D+3  →  Analista consolida manualmente em planilha master
D+4  →  Aparecem divergências entre gateway e ERP, começa a investigação
D+6  →  Classificações pendentes ainda esperando o responsável "decidir"
D+8  →  Conciliações concluídas, modelo financeiro começa a ser atualizado
D+10 →  KPIs calculados, controller começa a escrever comentário do mês
D+12 →  Resultado mensal entregue à diretoria
```

**Sintomas:**
- O gestor lê o resultado quando a janela de ação já passou
- Cada mês, classificações similares são feitas de formas diferentes
- A divergência gateway × ERP volta no mês seguinte porque o tratamento foi paliativo, não estrutural
- O comentário executivo é escrito sob pressão, sem tempo para análise de variações relevantes

### 2.2 Depois — Fechamento D+5

```
D+1  →  Pipeline de tratamento roda automaticamente
            Base consolidada disponível para todos os canais
D+2  →  Classificador de IA processa lançamentos novos
            Analista revisa apenas exceções (~10% do volume)
            Reconciliação gateway × ERP gera relatório de divergências classificadas
D+3  →  Modelo financeiro atualizado, KPIs disponíveis no dashboard
            Monitor de alertas roda e prioriza desvios para análise
D+4  →  Gerador de comentários produz draft do mês
            Controller revisa e ajusta narrativa
D+5  →  Resultado mensal entregue à diretoria, já com comentários e alertas priorizados
```

**Ganhos observados:**
- **7 dias de antecipação** no fechamento
- **~90% das classificações automatizadas**, com analista atuando como revisor de exceções
- **Comentário executivo entra em revisão, não em escrita**
- **Alertas chegam priorizados**, não como lista de 40 KPIs

---

## 3. O que mudou em cada etapa do processo

### 3.1 Coleta e padronização de dados

**Antes:** cada canal manda em formato próprio. Marketplace em uma planilha, gateway em outra, ERP em outra. Analista junta tudo na mão.

**Depois:** pipeline Python lê os arquivos, normaliza SKUs, padroniza centros de custo, alinha datas de competência. O dado chega ao modelo já consolidado.

### 3.2 Classificação de lançamentos

**Antes:** lançamento `"Mídia digital - influencer Janeiro"` pode ser classificado como Marketing, como Vendas, como Comercial. Depende de quem está classificando naquele mês.

**Depois:** classificador de IA recebe o lançamento, propõe categoria e centro de custo, explica o raciocínio (ex: *"sugiro Marketing Digital porque o histórico de lançamentos similares foi classificado assim em 87% dos casos, e a descrição inclui 'influencer'"*). O analista aceita, ajusta ou rejeita — e isso vira aprendizado para os próximos.

### 3.3 Reconciliação gateway × ERP

**Antes:** controller abre os dois extratos lado a lado e procura divergência. Quando acha uma diferença de R$ 47,32, abre uma terceira aba para investigar se é taxa, lançamento duplicado, ou problema de data.

**Depois:** reconciliação assistida compara automaticamente e classifica cada divergência. No tratamento da Fase 2, **7 dos 96 pagamentos consolidados saem com `divergência_significativa = True`** (acima da tolerância de 0,5%) — esses são os casos que vão para a fila da IA, com tipo já pré-classificado:
- *Taxa incorreta:* X registros
- *Lançamento duplicado:* Y registros
- *Divergência de data:* Z registros

Controller atua na investigação **depois** que o problema foi classificado, não antes.

### 3.4 Análise de variações

**Antes:** "A margem do marketplace caiu este mês." → analista volta na base, cruza com comissões, devoluções, mix de SKU. Demora horas para chegar na causa.

**Depois:** monitor de alertas já sinaliza: *"Margem do marketplace caiu 3,2 p.p. — driver principal: aumento de comissão (+1,8 p.p.) e devoluções acima da média (+1,1 p.p.)"*. Analista valida, controller já tem a leitura.

### 3.5 Geração do comentário executivo

**Antes:** controller olha os números, abre o Word, escreve 4 a 6 parágrafos descrevendo o desempenho do mês. Consome 1 a 2 dias úteis.

**Depois:** gerador de comentários recebe os números, gera draft estruturado (visão geral → margem por canal → capital de giro → destaques) em estilo configurável. Controller revisa, edita o que precisa de contexto humano, entrega.

### 3.6 Visibilidade de capital de giro

**Antes:** PMR, PMP e NCG são calculados uma vez no fechamento, ficam em uma planilha que ninguém abre depois.

**Depois:** painel sempre atualizado. Gestor abre o dashboard e vê NCG em dias de receita, evolução nos últimos 12 meses, contribuição de cada canal.

---

## 4. O que **não** mudou (e por que isso importa)

O projeto **não** propõe substituir o controller, nem o analista. Propõe **redirecionar o tempo deles**.

- O controller continua sendo o responsável pelo número final entregue.
- O analista continua sendo quem investiga as exceções relevantes.
- A IA não toma decisão — ela **prepara o trabalho de decisão**.

O ganho não é "fazer com menos gente". O ganho é **fazer com a mesma gente, mais rápido, com mais profundidade analítica e menos retrabalho operacional**.

---

## 5. Impacto consolidado — números do modelo

Os números abaixo saem da aba **14_Antes_vs_Depois** do modelo financeiro (Fase 3), com premissas vinculadas à aba 02 do mesmo workbook.

### 5.1 Premissas operacionais

| Métrica | Antes | Depois | Variação |
|---------|-------|--------|----------|
| Prazo de fechamento mensal | D+12 | D+5 | **−7 dias** |
| Horas/mês — analista financeiro | 200h | 80h | **−60%** |
| Lançamentos com retrabalho/mês | 12 | 2 | **−83%** |
| Divergências gateway × ERP/mês | 7 | 1 | **−86%** |
| Horas escrevendo comentário do mês | 16h | 4h | **−75%** |

### 5.2 Custo mensal de controladoria

| Componente | Antes (R$/mês) | Depois (R$/mês) | Economia |
|------------|----------------:|-----------------:|----------:|
| Capacidade analítica (horas regulares) | R$ 17.000 | R$ 6.800 | R$ 10.200 |
| Custo de retrabalho | R$ 4.080 | R$ 680 | R$ 3.400 |
| Investigação de divergências | R$ 1.190 | R$ 170 | R$ 1.020 |
| Comentários executivos manuais | R$ 1.360 | R$ 340 | R$ 1.020 |
| **TOTAL MENSAL** | **R$ 23.630** | **R$ 7.990** | **R$ 15.640 (−66%)** |

### 5.3 ROI do projeto

| Indicador | Valor |
|-----------|-------|
| Economia mensal | R$ 15.640 |
| Economia anual estimada | R$ 187.680 |
| Investimento estimado | R$ 120.000 |
| **Payback** | **7,7 meses** |
| **ROI 12 meses** | **56,4%** |

> **Estes não são números genéricos**: são o resultado consolidado da aba "Antes vs Depois" do modelo financeiro, calculado com R$ 85/hora de analista (folha + encargos), volume operacional do biênio simulado e investimento estimado de R$ 120K (setup + ferramentas + treinamento).

---

## 6. Por que essa conta importa

O modelo financeiro do projeto mostra uma **operação em prejuízo** durante a maior parte dos 24 meses simulados (EBITDA acumulado −R$ 502K). E ainda assim, **a transformação operacional retorna 56% em 12 meses**.

Esse é o argumento central do caso: **modernizar a controladoria não depende do core business estar lucrativo**. Em uma empresa em virada — com margem de contribuição saudável (45%) mas escala insuficiente — o gestor precisa, mais do que nunca, de fechamento rápido, leitura precisa de capital de giro e visibilidade dos alavancas de NCG (no caso simulado, o marketplace com PMR de 30 dias).

A transformação financeira não é um projeto "de empresa lucrativa que quer otimizar"; é um projeto **especialmente útil em operações pressionadas**, onde cada dia de antecipação no fechamento é um dia a mais de janela de ação do gestor.

---

## 6. Leitura final

O projeto descreve um movimento que vai além de "automação financeira": é a passagem de **operação reativa** (todo mês corre atrás do fechamento) para **operação preditiva** (todo mês prepara a decisão do próximo).

Esse movimento é o que define o **BPO financeiro moderno** e, mais amplamente, o futuro da função de Finance Operations: dados estruturados, processos automatizados e IA aplicada para que o time financeiro deixe de ser o "centro de custo de processamento" e vire o **centro de inteligência da empresa**.

---

*Documento operacional — Finance Ops & Analytics*
