# Benchmark Natura — Validação de mercado da empresa-modelo

**Projeto:** Finance Ops & Analytics — Fase 6
**Objetivo:** Validar os problemas operacionais simulados da empresa-modelo (beauty omnichannel) contra a referência de mercado mais relevante do setor: Natura. A leitura busca contextualizar — não comparar de igual para igual — os indicadores de margem, capital de giro, geração de caixa e desafios de omnicanalidade.
**Período de referência:** Empresa-modelo: 2023–2024 (24 meses). Natura: 2023–2025 (FY2023, FY2024, FY2025 + trimestres 4T24, 1T25, 3T25, 1T26 para tendência).

---

## 1. Sumário executivo

A Natura é o **maior player brasileiro de beauty omnichannel** e o benchmark natural para qualquer case do setor. Mas a comparação direta é **assimétrica em escala** (Natura: R$ 22,2 bi de receita líquida em 2025 vs. empresa-modelo: R$ 2,1 MM em 2024 — ordem de grandeza 10.000x). O valor do benchmark, portanto, não está em medir tamanho, mas em **calibrar as direções**: as margens estruturais possíveis no setor, o tamanho típico do desafio de capital de giro, e os problemas operacionais que persistem mesmo na maior operação do segmento.

Quatro leituras consolidam o exercício:

1. **A margem da empresa-modelo (45% de margem de contribuição) está estruturalmente abaixo do potencial do setor** (Natura entrega ~66–67% de margem bruta consolidada). A diferença é explicável (escala, marca, mix), mas indica que existe gordura para expandir conforme a operação madura.
2. **O ciclo financeiro de 384 dias da empresa-modelo é o sintoma operacional mais crítico** — e o benchmark Natura mostra que mesmo uma operação com escala vê o capital de giro como uma das três grandes alavancas de geração de caixa em sua transformação ("Onda 2").
3. **Crescimento de receita não garante sustentabilidade.** A Natura cresceu receita em 2024 (+21,5% YoY) e ainda assim reportou prejuízo de R$ 8,9 bi; em 2025, com receita caindo 5%, gerou caixa positivo. A empresa-modelo cresceu 12,3% entre 2023 e 2024 e continua com EBITDA negativo no acumulado — a mesma lição, em outra escala.
4. **Omnicanalidade é difícil mesmo para quem já fez tudo.** A Natura ainda está integrando canais (Onda 2) seis anos após declarar a estratégia. Para a empresa-modelo, isso valida que os problemas de classificação inconsistente entre canais, divergências entre gateway e ERP, e dificuldade de visão consolidada não são patologias locais — são desafios estruturais do modelo.

---

## 2. A Natura como referência de mercado

A Natura (B3: **NATU3**, ticker alterado em 2025 após a incorporação reversa da Natura &Co Holding pela Natura Cosméticos S.A.) é a maior empresa brasileira de beauty e a referência mundial em vendas diretas combinadas a varejo físico e digital. Opera há mais de cinco décadas e estruturou desde o início dos anos 2010 uma estratégia explícita de omnicanalidade.

**Canais ativos da Natura:**
- **Venda direta (consultoras):** aproximadamente 70% das vendas no Brasil, com base de cerca de 1,8 milhão de consultoras
- **Franquias ("Aqui tem Natura"):** mais de 100 unidades, modelo lançado em 2017
- **Lojas próprias:** abertura acelerada desde 2016 (primeira loja no shopping Morumbi, SP)
- **E-commerce próprio e Rede Natura:** plataforma híbrida que conecta consultoras à venda online
- **Avon (América Latina):** marca incorporada em 2020, em processo de integração ("Onda 2")

**Movimento estratégico atual:** a Natura está em ciclo de **"volta às origens"** — vendeu Aesop (2023), está separando a Avon International (Chapter 11 em curso nos EUA, venda da Avon CARD concluída em 2025, venda da Avon International ex-Rússia anunciada), e concentra esforços na consolidação Brasil + Hispana Latam.

**Por que a Natura é o benchmark certo aqui:**
- Mesmo setor (beauty)
- Mesmo modelo de canais (venda direta + varejo físico + e-commerce + franquia)
- Mesmas categorias (skincare, maquiagem, perfumes, haircare/personal care)
- Mercado brasileiro como base
- Demonstrações financeiras públicas, trimestrais, com nível de detalhe que permite leitura analítica

**Limites da comparação:**
- Escala: 10.000x maior
- Verticalização produtiva (Natura tem fábrica, P&D, marca consolidada)
- Operação multinacional (LatAm + presença internacional em descontinuação)
- A Natura reporta **margem bruta** segundo padrão CPC/IFRS; a empresa-modelo do projeto reporta **margem de contribuição** em modelo gerencial (Receita Líquida − CMV, sem dedução de tributos federais/estaduais, conforme definição do modelo). Os números são metodologicamente próximos mas não idênticos.

---

## 3. Snapshot da empresa-modelo (Fase 3)

| Métrica | 2023 | 2024 | 24m | Status |
|---|---|---|---|---|
| Receita Bruta | R$ 2,14 MM | R$ 2,40 MM | R$ 4,54 MM | Crescimento 12,3% YoY |
| Receita Líquida | R$ 1,87 MM | R$ 2,10 MM | R$ 3,98 MM | — |
| CMV | R$ 1,02 MM | R$ 1,16 MM | R$ 2,18 MM | — |
| Margem de Contribuição | R$ 0,85 MM | R$ 0,95 MM | R$ 1,80 MM | 45,2% (estável) |
| EBITDA | (R$ 0,30 MM) | (R$ 0,20 MM) | (R$ 0,50 MM) | Negativo, em melhora |
| Margem EBITDA | -16,2% | -9,5% | -12,6% | Break-even cruzado em nov-dez/2024 |
| **PMR ERP** | — | — | **17,8 dias** | OK |
| **PME (estoque)** | — | — | **374 dias** | **Crítico** |
| **PMP** | — | — | **7,8 dias** | Curto demais |
| **Ciclo financeiro** | — | — | **384 dias** | **Atenção máxima** |
| **NCG estimada** | — | — | **R$ 2,66 MM** | 489 dias de receita |
| Giro de estoque | — | — | 0,42x ao ano | Crítico |
| Estoque crítico (aging) | — | — | 56,8% do total | Crítico |
| Taxa de devolução | — | — | 3,96% | Dentro do benchmark (<5%) |

**Diagnóstico operacional:** empresa em virada com break-even cruzado nos últimos dois meses de 2024. O maior gargalo não é margem (45% é razoável para o estágio) — é **capital de giro empatado em estoque**: R$ 2,66 MM de NCG em uma operação que fatura R$ 166 k/mês significa que mais de um ano de receita está parado em estoque.

---

## 4. Análise comparativa

### 4.1 Margens — empresa-modelo opera 20 p.p. abaixo do potencial estrutural do setor

A Natura entregou margem bruta consolidada de 66,3% no 1T25 (+1,1 p.p. a/a), com expansão "em todas as regiões da Onda 2". No 3T25, a margem bruta foi de 67,2%, e o consolidado do ano fechou em 66,3%.

A empresa-modelo, em comparação, opera com **margem de contribuição de 45,2%** estável ao longo dos 24 meses. A diferença de aproximadamente 20 pontos percentuais decorre de:

- **Escala produtiva:** a Natura tem fábrica própria e poder de barganha com fornecedores de insumos (resinas, óleos essenciais, embalagens). A empresa-modelo é compradora de produto acabado.
- **Mix de categorias com posicionamento premium:** Natura tem marcas como Ekos, Tododia, Kaiak e Una, com posicionamento de marca consolidado que permite preços premium. A empresa-modelo opera com mix mais commoditizado.
- **Eficiência logística e de portfólio:** parte da expansão de margem da Natura em 2024–2025 veio justamente da "simplificação do portfólio, centralização da produção e planejamento integrado" — alavancas que a empresa-modelo pode capturar à medida que estrutura sua operação.

**Leitura para o case:** a margem da empresa-modelo não é um problema atual — é uma oportunidade futura. O gap de 20 p.p. é diluído à medida que a operação ganha escala, refina mix e renegocia condições com fornecedores. Para um portfólio profissional, esta leitura é importante: o problema central da empresa-modelo **não é vender com margem baixa, é não capturar caixa dessa margem**.

### 4.2 EBITDA — crescimento de receita não garante rentabilidade

Aqui o benchmark é desconcertante. A Natura, com receita de R$ 24 bi em 2024 e crescimento de 21,5% no ano, ainda assim reportou:

- **EBITDA recorrente 4T24:** R$ 703,3 milhões, margem 9,1% (redução de 70 bps na base anual)
- **Prejuízo líquido 4T24:** R$ 438,5 milhões
- **Prejuízo líquido FY2024:** R$ 8,9 bilhões, revertendo lucro de R$ 2,97 bilhões em 2023 (efeito do Chapter 11 da Avon Products Inc.)

E em 2025, **com receita caindo 5% em reais**, a Natura conseguiu o oposto:

- **EBITDA recorrente 2025:** R$ 3,1 bilhões, alta de 9,5%, margem 14,1%, expansão de 190 pontos-base
- **FCFL 2025:** R$ 138 milhões positivos, ante R$ 28 milhões negativos em 2024

**A empresa-modelo segue o mesmo padrão:** receita cresce 12,3% entre 2023 e 2024, e o EBITDA acumulado segue negativo em -R$ 502 mil. A diferença entre o EBITDA 2023 (-R$ 304 mil) e 2024 (-R$ 199 mil) mostra melhora — break-even cruzado em nov-dez/2024 — mas o resultado anual ainda é negativo.

**Leitura central:** crescimento de receita é condição necessária, mas não suficiente para sustentabilidade financeira. A Natura demonstrou em 2025 que **expansão de margem + disciplina de capital** geram mais caixa do que crescer faturamento sem ajustar estrutura. A empresa-modelo precisa internalizar esse princípio antes de qualquer projeção otimista de forecast.

### 4.3 Capital de giro — o problema central da empresa-modelo, validado pelo benchmark

A Natura não publica PMR, PME e PMP individualmente em seus releases trimestrais (o detalhamento aparece em ITRs e DFPs na CVM), mas a comunicação da gestão é explícita sobre o tema. No Investor Day de 2025, a XP destacou "margem, capital de giro e impostos como alavancas de geração de caixa, com a gestão de estoques apoiada pela simplificação do portfólio, centralização da produção e planejamento integrado". O Bradesco BBI complementou: "a análise destacou oportunidades em inovação, novos canais e capital de giro. A estratégia de retornar às bases anteriores às aquisições, com margens mais altas e distribuição de dividendos, foi considerada positiva."

O sinal aqui é importante: **mesmo a maior operação de beauty do país elege capital de giro como uma das três grandes alavancas estratégicas**. E isso aparece nos números trimestrais:

- **1T25:** queima de caixa de R$ 692 milhões, sazonalidade típica do primeiro trimestre com investimento em contas a receber e estoque
- **3T24:** geração de caixa forte de R$ 1,3 bilhão, devido a melhora nos resultados operacionais, melhor dinâmica de capital de giro, principalmente em recebíveis e contas a pagar, e Capex mais enxuto
- **1T26:** fluxo de caixa negativo de R$ 315 milhões no trimestre

Ou seja: a Natura tem **sazonalidade explícita** no capital de giro (queima no 1T, geração no 4T), e o ciclo aparece como linha primária da comunicação ao mercado.

**Para a empresa-modelo, a leitura é:**
- O ciclo financeiro de 384 dias **não é normal** — é patológico. Mesmo permitindo ajustes metodológicos (a Natura reporta capital de giro em valor absoluto, não em dias), o sinal está claro: nenhuma operação saudável de beauty mantém estoque com aging crítico em mais de 56% do total.
- O PME de 374 dias da empresa-modelo é o equivalente operacional de **uma "Avon Chapter 11" em miniatura**: capital empatado que precisa ser destravado para que qualquer crescimento futuro tenha base de financiamento. A NCG de R$ 2,66 MM equivale a 489 dias de receita — mais de 16 meses de operação parados em recebíveis e estoque.
- A direção correta é a mesma que a Natura adotou: **simplificação de portfólio, planejamento integrado, e foco em giro**. Os 58 SKUs ativos da empresa-modelo, dos quais o top 15 explica a maior parte da margem, sugerem espaço relevante para racionalização.

### 4.4 Geração de caixa vs. crescimento de receita

Este é o teste de qualidade do crescimento. Aqui está a evolução comparada:

**Natura — comportamento clássico de operação madura em transformação:**
- 2024: receita +21,5%, **prejuízo de R$ 8,9 bi** (impacto não-recorrente Avon API), FCFL ligeiramente negativo
- 2025: receita -5% em reais (+1,8% em moeda constante), **prejuízo de R$ 2,2 bi** (-75% YoY), **FCFL +R$ 138 mi**
- 1T26: receita -7,7%, EBITDA -55,7%, FCFL negativo em R$ 315 milhões — reorganização ainda pesa
- Alavancagem 2025: 1,57x EBITDA, dentro da faixa ótima da companhia
- Capex 2025: R$ 386 milhões, 1,7% da receita, abaixo dos R$ 548 milhões de 2024 (2,3% da receita)

**Empresa-modelo:**
- 2023: receita R$ 1,87 MM, EBITDA -R$ 304 k (margem -16,2%)
- 2024: receita R$ 2,10 MM (+12,3%), EBITDA -R$ 199 k (margem -9,5%)
- Direção de melhora consistente; break-even cruzado em nov-dez/2024
- NCG empatada equivale a ~16 meses de receita — operação não auto-financia o crescimento

**A leitura comparativa importante:** a Natura entrega o sinal de que, no setor beauty, **quanto mais maduro o ciclo, mais a geração de caixa depende de disciplina operacional (margem, giro, capex) e não de aceleração de top line**. A empresa-modelo está no início desse ciclo — ainda precisa cruzar o break-even operacional consistentemente — mas a lógica é a mesma: o crescimento de receita só vira valor financeiro quando o ciclo financeiro acompanha.

### 4.5 Desafios de omnicanalidade — difíceis mesmo para quem tem 50 anos de operação

A Natura é o caso de sucesso brasileiro mais citado em omnicanalidade. E ainda assim, em 2025, a empresa **continuava integrando canais**:

- **Onda 2 (Wave 2):** integração comercial e logística de Natura + Avon na América Latina, com etapas concluídas no Brasil, Peru, Colômbia e México, e Argentina prevista para meados de 2025. "A partir de 2026, com o fim do ciclo de integração e a captura plena dos benefícios da onda 2, virá o fim da era do 'Ebitda ajustado' e o foco total na alocação de capital."
- **Conflito histórico entre canais:** havia receio interno de que os meios digitais empobrecessem o relacionamento das consultoras com clientes ou mesmo que substituíssem as vendas diretas — o mesmo dilema que aparece em qualquer operação omnichannel real.
- **Integração logística:** "Apesar da integração comercial das duas marcas, os pedidos ainda serão feitos e entregues separadamente, uma vez que consolidação logística está prevista apenas para 2024". A integração logística só foi concluída no Brasil em 2024; em 2025 ainda havia mercados em ramp-up.
- **Capital de giro adicional durante integração:** o ramp-up gera "sazonalidade desfavorável do primeiro trimestre envolvendo capital de giro operacional".

**Por que isso valida a empresa-modelo:** os problemas simulados na Fase 2 (classificações inconsistentes entre canais, divergências entre gateway e ERP, lançamentos sem centro de custo, SKUs duplicados com grafias diferentes) **são problemas estruturais reais** que persistem mesmo em operações de escala. A Natura nunca declarou publicamente ter resolvido todos eles — e os releases trimestrais mostram que cada nova fase de integração reabre frentes novas de reconciliação contábil, divergência de sistemas e ajuste de prazo.

Para um case profissional, isso significa que a transformação proposta na empresa-modelo (fechamento D+12 → D+5, conciliação assistida, IA aplicada a classificação e alertas) **não é um exercício teórico** — é exatamente o tipo de capacidade que opera no nível mais alto do setor.

---

## 5. Tabela comparativa consolidada

| Dimensão | Empresa-modelo | Natura | Leitura |
|---|---|---|---|
| **Receita líquida (último ano fechado)** | R$ 2,10 MM (2024) | R$ 22,2 bi (2025) | Diferença de escala 10.000x — comparar direções, não tamanhos |
| **Crescimento de receita YoY** | +12,3% (2024 vs 2023) | -5,0% em reais / +1,8% em moeda constante (2025 vs 2024) | Empresa-modelo em fase de tração; Natura em ciclo de simplificação |
| **Margem bruta / contribuição** | 45,2% (margem de contribuição, modelo gerencial) | 66,3% (margem bruta consolidada 2025) | Gap de ~20 p.p. explicado por escala, marca, mix; oportunidade futura |
| **Margem EBITDA** | -12,6% (24m); -9,5% (2024) | 14,1% (2025, recorrente) | Empresa-modelo abaixo de break-even; Natura em patamar saudável |
| **Resultado líquido** | -R$ 591 k (24m); -R$ 241 k (2024) | -R$ 2,2 bi (2025); -R$ 8,9 bi (2024) | Ambas com prejuízo; Natura por reorganização Avon, empresa-modelo por escala e capital empatado |
| **Capital de giro / NCG** | NCG R$ 2,66 MM = 489 dias de receita | Tema central da estratégia; FCFL positivo em R$ 138 mi (2025) | Empresa-modelo: NCG patológica; Natura: ciclo sazonal sob controle |
| **PMR** | 17,8 dias (média ponderada) | Não publicado em release; varia por canal | Empresa-modelo em patamar razoável |
| **PME (estoque)** | 374 dias | Não publicado diretamente; gestão de portfólio em foco | Empresa-modelo: crítico (16x acima do ideal de ~30-60 dias para beauty) |
| **PMP** | 7,8 dias | Não publicado | Empresa-modelo: curto demais; sem alavanca de capital com fornecedor |
| **Ciclo financeiro** | 384 dias | Não publicado | Empresa-modelo: o número-chave do diagnóstico |
| **Giro de estoque anual** | 0,42x | Não publicado; foco em simplificação de portfólio | Empresa-modelo: estoque gira menos de meio ciclo por ano |
| **Estoque com aging crítico** | 56,8% do total (R$ 1,48 MM) | Não detalhado | Empresa-modelo: gargalo operacional principal |
| **Taxa de devolução** | 3,96% | Não publicada por canal | Empresa-modelo: dentro do benchmark (<5%) |
| **Canais de venda** | E-commerce, Marketplace, Franquia, Loja Própria | Venda direta (consultoras ~70%), Franquia, Loja própria, E-commerce, Rede Natura | Mesma lógica omnichannel; empresa-modelo sem canal de venda direta |
| **Estratégia de integração de canais** | Em estruturação (Fase 2 → 5 do projeto) | "Onda 2" — integração Natura + Avon em curso, conclusão prevista 2025-2026 | Mesmo desafio em escalas diferentes |
| **Capex / Receita** | Não modelado explicitamente | 1,7% em 2025 (R$ 386 mi) | Benchmark de Capex leve para o setor |
| **Alavancagem (Dívida líq./EBITDA)** | n/a (estrutura não modelada) | 1,57x (2025) | Faixa considerada saudável pela própria Natura |

---

## 6. Leituras críticas para o portfólio

### 6.1 O que a empresa-modelo está fazendo certo
- **Margem de contribuição estável em 45,2%** ao longo de 24 meses — sinal de disciplina de preço e mix consistente
- **Taxa de devolução em 3,96%** — abaixo do benchmark setorial de 5%
- **Tendência de melhora do EBITDA** entre 2023 (-16,2%) e 2024 (-9,5%) — direção correta
- **PMR de 17,8 dias** — controle de recebimento em patamar razoável para mix omnichannel
- **Modelo de canais alinhado com a referência de mercado** — Natura opera nos mesmos canais (sem venda direta na empresa-modelo, que é a única diferença estrutural relevante)

### 6.2 Onde a empresa-modelo precisa concentrar esforço
- **Capital de giro é o gargalo número 1.** O PME de 374 dias com 56,8% do estoque em aging crítico é incompatível com qualquer operação saudável do setor. A Natura, por contraste, faz da gestão de estoques uma das três alavancas centrais de sua estratégia atual.
- **Margem tem espaço para expandir, mas não no curto prazo.** O gap de 20 p.p. para Natura é estrutural; só fecha com escala, marca e renegociação de fornecedores. Não há atalho.
- **PMP de 7,8 dias é curto demais.** Empresas do setor com poder de barganha negociam prazos de 30-60 dias com fornecedores. Esta é uma alavanca direta de redução de NCG.
- **Crescimento de receita sem ajuste de capital de giro vai destruir mais caixa.** A Natura mostra em 2024 e 1T26 que crescer receita sem disciplina amplifica o problema.

### 6.3 O que o benchmark Natura ensina sobre o roadmap do projeto
- **Onda 2 (Natura) ≈ transformação do BPO moderno (empresa-modelo):** o paralelo é direto. A Natura está unificando sistemas, processos, logística e equipes comerciais entre Natura e Avon. A transformação operacional simulada na empresa-modelo (fechamento D+12 → D+5, conciliação assistida, IA aplicada a classificação) responde ao mesmo tipo de problema, em escala menor.
- **A captura plena de sinergias leva anos.** A Natura iniciou a integração com Avon em 2020-2021 e prevê conclusão plena para 2026 — cinco a seis anos. Casos profissionais de transformação financeira precisam comunicar essa temporalidade com honestidade.
- **EBITDA ajustado vs. recorrente é uma linha que importa.** A Natura comunica explicitamente "que, a partir de 2026, com o fim do ciclo de integração e a captura plena dos benefícios da onda 2, virá o fim da era do 'Ebitda ajustado' e o foco total na alocação de capital". Operações em virada precisam ser claras sobre o que é recorrente e o que é não-recorrente — princípio aplicável também ao modelo gerencial da empresa-modelo.

---

## 7. Conclusão — crescimento de receita garante sustentabilidade?

**Não.** Esta é a resposta que o benchmark Natura entrega com mais clareza.

- Em 2024, a Natura cresceu receita em 21,5% e reportou prejuízo de R$ 8,9 bi.
- Em 2025, com receita caindo 5%, gerou caixa positivo de R$ 138 mi pela primeira vez no ciclo.
- No 1T26, com receita caindo 7,7% e EBITDA recuando 55,7%, queimou R$ 315 mi de caixa em um único trimestre.

A sustentabilidade não vem do crescimento da linha de receita. Vem de:

1. **Margem estrutural** (mix, escala, marca)
2. **Disciplina de capital de giro** (estoque, recebíveis, fornecedores)
3. **Capex controlado** (1-2% da receita, não muito mais)
4. **Alavancagem dentro da faixa ótima** (até 2x EBITDA)
5. **Distinção clara entre resultado recorrente e não-recorrente** na comunicação ao mercado

Para a empresa-modelo, a leitura é direta: **o projeto de transformação Finance Ops & Analytics não é sobre fazer a empresa crescer receita — é sobre fazer a empresa transformar a receita que já tem em caixa**. O fechamento D+12 → D+5, a reconciliação automática gateway × ERP, os comentários financeiros gerados por IA, e o monitor de alertas operacionais são instrumentos que atuam exatamente sobre esses cinco pontos: dão visibilidade para tomar decisão de margem, identificam gaps de capital de giro, controlam capex e alavancagem, e separam ruído de sinal estrutural.

A Natura está fazendo o mesmo, em escala 10.000x maior. O case profissional ganha legitimidade quando se posiciona nesse mesmo eixo de transformação.

---

## 8. Considerações metodológicas e limitações

**O que esta análise é:**
- Uma comparação direcional entre uma empresa-modelo simulada e a maior referência setorial pública brasileira
- Uma validação de mercado dos problemas e direções modeladas no projeto
- Uma leitura crítica sobre o que crescimento de receita representa em termos de geração de valor financeiro real

**O que esta análise não é:**
- Um benchmarking quantitativo de igual para igual (escala impede)
- Uma recomendação de investimento sobre NATU3
- Uma reconciliação contábil entre a metodologia gerencial da empresa-modelo (margem de contribuição) e a metodologia IFRS/CPC da Natura (margem bruta)

**Diferenças metodológicas relevantes:**
- A empresa-modelo trabalha com **modelo gerencial sem tributos federais/estaduais** — receita líquida = receita bruta − devoluções − comissões de canal. A Natura reporta margem bruta sobre receita líquida fiscal completa.
- A Natura reporta consolidado **com Avon** em 2024 e 2025 (com Avon International reclassificada como descontinuada em parte dos períodos). Para comparações específicas, idealmente usar números de "Natura &Co Latam ex-Argentina e ex-TBS" — não disponíveis em todos os releases.
- O ticker NTCO3 foi alterado para **NATU3** em 2025 após a incorporação reversa da Natura &Co Holding pela Natura Cosméticos S.A.
- Em 2025, a Avon Industrial e a Natura &Co Holding foram incorporadas pela Natura Cosméticos S.A., simplificando a estrutura societária.

---

## 9. Fontes utilizadas

**Demonstrações e releases oficiais (Natura):**
- Press Release 4T24 / FY2024 (divulgado em 13/mar/2025)
- Press Release 1T25 (divulgado em 12/mai/2025)
- Press Release 3T25 (divulgado em 10/nov/2025)
- Press Release 4T25 / FY2025 (divulgado em mar/2026)
- Press Release 1T26 (divulgado em mai/2026)
- Investor Day Natura, jun/2025
- ITRs e DFPs disponíveis na CVM (cvm.gov.br) e no site de RI da Natura

**Análises de mercado (sell-side) referenciadas:**
- XP Investimentos — "Natura&Co (NTCO3): O que já sabemos sobre a Onda 2" (ago/2023); "De volta às suas origens" (jul/2025); "Resultados sólidos no 3T24" (nov/2024); "Um 3º trimestre fraco" (nov/2025)
- Bradesco BBI — análises 4T24 (mar/2025) e Investor Day (jun/2025)
- BTG Pactual — análise 4T24 (mar/2025)
- Itaú BBA — análise 3T25 (nov/2025)
- Nord Investimentos — análise 3T24 (nov/2024); análise 1T25 (mai/2025); análise 3T25 (nov/2025)
- BB Investalk — análises 4T24 (mar/2025), 1T25 (mai/2025) e 3T25 (nov/2025)

**Veículos jornalísticos consultados:**
- InfoMoney, Exame, Money Times, Valor, NeoFeed, Reuters Brasil, ADVFN News, Seu Dinheiro, Suno Notícias, Visno Invest, Acionista, Stock Titan, Gazeta do Povo, Jornal do Comércio, Investidor10, BPMoney, 55 Invest

**Base de comparação (empresa-modelo):**
- `modelo_financeiro.xlsx` — Fase 3 do projeto Finance Ops & Analytics (este projeto)
- Abas referenciadas: 06_DRE_Consolidada, 10_Capital_de_Giro, 11_Estoque_e_Giro, 12_KPIs

---

*Documento produzido como parte da Fase 6 do projeto Finance Ops & Analytics — case profissional de FP&A e Controladoria para portfólio LinkedIn / GitHub.*
