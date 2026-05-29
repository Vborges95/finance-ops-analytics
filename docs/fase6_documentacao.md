# Fase 6 — Benchmark Natura

Documentação da fase de validação de mercado do projeto. A Fase 6 contextualiza a empresa-modelo (simulada) contra a maior referência pública do setor beauty omnichannel brasileiro, a Natura, usando exclusivamente dados públicos.

---

## 1. Visão geral

| Atributo | Valor |
|----------|-------|
| Objetivo | Validar direcionalmente que os problemas modelados são reais |
| Empresa de referência | Natura (B3: NATU3, antiga NTCO3) |
| Período empresa-modelo | 2023–2024 (24 meses) |
| Período Natura | FY2023, FY2024, FY2025 + trimestres 4T24, 1T25, 3T25, 1T26 |
| Natureza | Direcional, não quantitativa de igual para igual |
| Diferença de escala | ~10.000x (Natura R$ 22,2 bi · empresa-modelo R$ 2,1 MM) |

A escolha da Natura como referência é deliberada: mesmo setor, mesmo modelo de canais (venda direta + franquia + loja + e-commerce), mesmas categorias, mercado brasileiro, e demonstrações públicas trimestrais com detalhamento analítico relevante. As limitações da comparação (escala, verticalização produtiva, operação multinacional) são explicitadas no próprio documento.

---

## 2. Entregáveis

| Arquivo | Tipo | Conteúdo |
|---------|------|----------|
| `benchmark_natura.md` | Markdown (~270 linhas) | Análise comparativa escrita em 9 seções |
| `tabela_comparativa_natura.xlsx` | Excel (6 abas) | Comparativo estruturado lado a lado |

### 2.1 Estrutura do `benchmark_natura.md`

1. Sumário executivo (4 leituras consolidadas)
2. A Natura como referência de mercado
3. Snapshot da empresa-modelo (Fase 3)
4. Análise comparativa em 5 dimensões:
   - 4.1 Margens
   - 4.2 EBITDA — crescimento de receita não garante rentabilidade
   - 4.3 Capital de giro — o problema central da empresa-modelo
   - 4.4 Geração de caixa vs. crescimento de receita
   - 4.5 Desafios de omnicanalidade
5. Tabela comparativa consolidada
6. Leituras críticas para o portfólio
7. Conclusão — *crescimento de receita garante sustentabilidade?*
8. Considerações metodológicas e limitações
9. Fontes utilizadas

### 2.2 Estrutura da `tabela_comparativa_natura.xlsx`

| Aba | Conteúdo |
|-----|----------|
| Capa | Objetivo, empresa de referência, períodos, limitações metodológicas |
| 02_Indicadores | Comparativo lado a lado em 7 dimensões (escala, rentabilidade, capital de giro, estoque, operacional, capital, modelo de canais, transformação) |
| 03_Natura_Tendencia | Evolução trimestral Natura (4T24 → 1T26) |
| 04_Canais | Comparativo do modelo de canais |
| 05_Leituras_Criticas | Diagnóstico por dimensão |
| 06_Fontes | Bibliografia consolidada |

---

## 3. Os quatro achados centrais

A Fase 6 entrega quatro leituras consolidadas — cada uma com implicação direta para a narrativa do projeto.

### 3.1 Margem — gap de 20 p.p. é estrutural, não problema atual

| | Empresa-modelo | Natura |
|---|---|---|
| Margem | 45,2% (margem de contribuição gerencial) | 66,3% (margem bruta IFRS, FY2025) |
| Composição | Comprador de produto acabado, mix commoditizado | Fábrica própria, marcas premium (Ekos, Tododia, Kaiak), poder de barganha |

**Leitura:** o gap é explicável (escala, marca, mix) e indica que existe "gordura" para expandir conforme a operação madura. A margem da empresa-modelo **não é um problema atual — é uma oportunidade futura**.

### 3.2 Crescimento de receita não garante sustentabilidade

Este é o achado mais forte do benchmark — e o que sustenta o argumento central do projeto de transformação.

| Período Natura | Receita | EBITDA / Resultado | FCFL |
|----------------|---------|---------------------|------|
| 2024 | +21,5% YoY | **Prejuízo R$ 8,9 bi** (efeito Avon Chapter 11) | Levemente negativo |
| 2025 | **−5,0% em reais** (+1,8% moeda constante) | Prejuízo R$ 2,2 bi (−75% YoY); EBITDA recorrente +9,5% | **+R$ 138 mi** |
| 1T26 | −7,7% | EBITDA −55,7% | **−R$ 315 mi em um trimestre** |

A leitura é clara: a Natura cresceu receita em 21,5% em 2024 e queimou caixa; em 2025, com receita caindo 5%, gerou caixa positivo pela primeira vez no ciclo. **Sustentabilidade vem de margem + disciplina de capital + capex controlado + alavancagem ótima — não de aceleração de top line.**

A empresa-modelo segue o mesmo padrão em escala menor: cresceu 12,3% entre 2023 e 2024, e o EBITDA acumulado segue negativo em −R$ 502 mil. A direção de melhora é correta, mas o resultado ainda é negativo.

### 3.3 Capital de giro — patológico na empresa-modelo, alavanca estratégica na Natura

A Natura não publica PMR/PME/PMP individuais nos releases trimestrais, mas a comunicação da gestão é explícita. Nas falas do Investor Day 2025 e nos releases dos últimos 6 trimestres, **capital de giro aparece como uma das três grandes alavancas estratégicas de geração de caixa**, ao lado de margem e tributos.

Para a empresa-modelo:

| Indicador | Valor | Status |
|-----------|-------|--------|
| Ciclo financeiro | 384 dias | **Patológico** |
| PME (estoque) | 374 dias | Crítico — 16x acima do ideal (30–60 dias para beauty) |
| PMP | 7,8 dias | Curto demais — sem alavanca com fornecedor |
| NCG estimada | R$ 2,66 MM | Equivale a 489 dias de receita |
| Estoque com aging crítico | 56,8% do total | Equivale a uma "Avon Chapter 11" em miniatura |

**Implicação:** o ciclo financeiro de 384 dias não é normal — é patológico. Mesmo permitindo ajustes metodológicos (a Natura reporta capital de giro em valor absoluto, não em dias), o sinal está claro: nenhuma operação saudável de beauty mantém estoque com aging crítico em mais de metade do total.

### 3.4 Omnicanalidade é difícil mesmo para quem tem 50 anos de operação

A Natura é o caso brasileiro mais citado em omnicanalidade. E ainda assim, em 2025, continuava integrando canais:

- **"Onda 2":** integração comercial e logística Natura + Avon Latam, iniciada em 2020, com conclusão plena prevista para 2026 (5–6 anos de ciclo)
- **Conflitos históricos entre canais:** receio interno de que o digital empobrecesse o relacionamento das consultoras — o mesmo dilema que aparece em qualquer operação omnichannel real
- **Integração logística:** concluída no Brasil em 2024; em 2025 ainda havia mercados em ramp-up
- **Capital de giro adicional durante integração:** ramp-up gera "sazonalidade desfavorável do primeiro trimestre envolvendo capital de giro operacional"

**Validação direta da Fase 2:** os problemas simulados (classificações inconsistentes entre canais, divergências gateway × ERP, lançamentos sem centro de custo, SKUs duplicados com grafias diferentes) **são problemas estruturais reais** que persistem mesmo em operações de escala. A Natura nunca declarou publicamente ter resolvido todos eles.

---

## 4. Conclusão da Fase — *crescimento de receita garante sustentabilidade?*

**Não.** O benchmark Natura entrega essa resposta com clareza desconcertante.

A sustentabilidade financeira vem de cinco frentes:

1. **Margem estrutural** (mix, escala, marca)
2. **Disciplina de capital de giro** (estoque, recebíveis, fornecedores)
3. **Capex controlado** (1–2% da receita, não muito mais)
4. **Alavancagem dentro da faixa ótima** (até 2x EBITDA)
5. **Distinção clara entre resultado recorrente e não-recorrente** na comunicação ao mercado

Para a empresa-modelo, a leitura é direta: o projeto de transformação Finance Ops & Analytics **não é sobre fazer a empresa crescer receita — é sobre fazer a empresa transformar a receita que já tem em caixa**. Fechamento D+12 → D+5, reconciliação automática gateway × ERP, comentários financeiros gerados por IA, monitor de alertas operacionais — todos esses instrumentos atuam exatamente sobre os cinco pontos acima: dão visibilidade para decisão de margem, identificam gaps de capital de giro, controlam capex e alavancagem, e separam ruído de sinal estrutural.

A Natura está fazendo o mesmo em escala 10.000x maior. **O case profissional ganha legitimidade quando se posiciona nesse mesmo eixo de transformação.**

---

## 5. Fontes consultadas

### Demonstrações e releases oficiais (Natura)

- Press Release 4T24 / FY2024 (13/mar/2025)
- Press Release 1T25 (12/mai/2025)
- Press Release 3T25 (10/nov/2025)
- Press Release 4T25 / FY2025 (mar/2026)
- Press Release 1T26 (mai/2026)
- Investor Day Natura (jun/2025)
- ITRs e DFPs (CVM e site de RI)

### Análises sell-side referenciadas

- **XP Investimentos** — "Natura&Co (NTCO3): O que já sabemos sobre a Onda 2" (ago/2023); "De volta às suas origens" (jul/2025); "Resultados sólidos no 3T24" (nov/2024); "Um 3º trimestre fraco" (nov/2025)
- **Bradesco BBI** — análises 4T24 (mar/2025) e Investor Day (jun/2025)
- **BTG Pactual** — análise 4T24 (mar/2025)
- **Itaú BBA** — análise 3T25 (nov/2025)
- **Nord Investimentos** — análises 3T24 (nov/2024), 1T25 (mai/2025), 3T25 (nov/2025)
- **BB Investalk** — análises 4T24, 1T25 e 3T25

### Veículos jornalísticos consultados

InfoMoney, Exame, Money Times, Valor, NeoFeed, Reuters Brasil, ADVFN News, Seu Dinheiro, Suno Notícias, Visno Invest, Acionista, Stock Titan, Gazeta do Povo, Jornal do Comércio, Investidor10, BPMoney, 55 Invest.

---

## 6. Decisões metodológicas

**Por que Natura e não outra empresa?** Boticário é capital fechado (sem demonstrações públicas detalhadas). Avon foi absorvida pela própria Natura. L'Oréal Brasil, Unilever Brasil e P&G Brasil são consolidados em demonstrações globais sem detalhamento Brasil. **A Natura é a única opção com (1) escala relevante, (2) mesmo setor, (3) mesmo modelo omnichannel, (4) demonstrações públicas trimestrais detalhadas em PT-BR.**

**Por que comparação direcional e não de igual para igual?** A diferença de escala de 10.000x impede comparação de magnitude (não faz sentido perguntar "a empresa-modelo tem o mesmo PMR da Natura"). O que faz sentido é perguntar **direção**: "estoque com 56% de aging crítico é compatível com o que a maior referência do setor tolera?". A resposta é "não", e isso valida o diagnóstico.

**Por que mencionar limitações metodológicas explicitamente?** Porque um portfólio que esconde limitações perde mais credibilidade do que ganha. A diferença entre margem de contribuição gerencial (empresa-modelo) e margem bruta IFRS (Natura) é explicitada no documento — e isso fortalece a análise, não enfraquece.

**Por que reportar números trimestrais e não só anuais?** Porque a história da Natura em 2024-2026 só aparece com clareza no nível trimestral: a virada de 2025 (geração de caixa apesar de queda de receita) e a recaída do 1T26 (queima de R$ 315 mi em um trimestre) reforçam a leitura de que crescimento de receita ≠ sustentabilidade.

---

## 7. Conexão com as outras fases

| Achado da Fase 6 | Conecta com | Como reforça |
|------------------|-------------|--------------|
| Margem de contribuição saudável mas baixa para o setor | Fase 3 (DRE) | Confirma que o problema da empresa-modelo não é preço/CMV — é escala |
| Capital de giro patológico | Fase 2 (33% de divergência gateway × ERP) + Fase 3 (NCG 489 dias) | Mostra que mesmo a Natura usa capital de giro como alavanca estratégica explícita |
| Crescimento ≠ sustentabilidade | Fase 3 (forecast 1S/2025) | Valida o forecast conservador, que privilegia eficiência operacional sobre top line |
| Omnicanalidade é difícil | Fase 2 (limpeza de dados multi-canal) + Fase 5 (reconciliação assistida) | Mostra que os problemas simulados são problemas estruturais reais do setor |
| ROI da transformação se paga em operação deficitária | Fase 3 (aba 14 — payback 7,7 m) | A Natura demonstra: a transformação operacional é alavanca, não dependente de lucro |

---

*Documentação técnica — Fase 6, Finance Ops & Analytics*
