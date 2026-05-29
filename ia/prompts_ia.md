# Prompts de IA — Fase 5 · Finance Ops & Analytics

Documentação completa de prompt engineering aplicado nos cinco artifacts da Fase 5. Para cada um: contexto do problema, system prompt na íntegra, user prompt (template), formato de saída esperado e notas de tuning sobre o que foi ajustado e por quê.

> **Por que isso existe.** Em produtos de IA aplicada, o prompt é parte do código. Documentá-lo permite (a) reproduzir resultados, (b) iterar com método em vez de tentativa-e-erro, (c) onboardar outros analistas no padrão. Tratamos prompts como contratos: input estruturado → instrução clara → output em formato fechado.

---

## Stack comum a todos os artifacts

| Item | Valor |
|---|---|
| Modelo | `claude-sonnet-4-20250514` |
| Endpoint | `POST https://api.anthropic.com/v1/messages` |
| Formato de saída | JSON estruturado (exceto Comentários, que é prosa) |
| Max tokens | 1.500–3.000 conforme artifact |
| Estratégia de parsing | `text.replace(/```json|```/g, "").trim()` → `JSON.parse()` |
| Idioma das respostas | Português brasileiro |

> **Observação sobre execução.** Dentro do ambiente artifact do Claude.ai, a chamada à API é proxy automática (sem chave). Para rodar localmente após exportação para GitHub, é necessário adicionar header `x-api-key` e definir a variável de ambiente correspondente.

---

## 5.1 — Classificador Inteligente de Lançamentos

### Problema que resolve
Lançamentos chegam ao Contas a Pagar com descrição livre ("PGTO META PLATFORMS - CAMPANHA BLACK FRIDAY E-COM"). Classificá-los manualmente em categoria + centro de custo consome horas do controller e gera inconsistências entre meses. A IA propõe a classificação, justifica, e o controller mantém a palavra final.

### System prompt

```
Você é um assistente especialista em classificação contábil-gerencial de lançamentos financeiros para uma operação de beauty omnichannel brasileira.

Sua tarefa: analisar a descrição livre de cada lançamento e sugerir:
1. Uma CATEGORIA financeira (de uma lista fechada)
2. Um CENTRO DE CUSTO (de uma lista fechada)
3. Uma JUSTIFICATIVA curta (1-2 frases) explicando os indícios na descrição
4. Um nível de CONFIANÇA: "alta", "media" ou "baixa"

Regras importantes:
- Use APENAS as categorias e centros de custo fornecidos
- Em caso de ambiguidade, escolha confiança "media" ou "baixa" e explique o que falta
- Considere o contexto brasileiro de beauty omnichannel (e-com, marketplace, franquia, loja física)
- Comissões de marketplace SÃO categoria "Comissões de Canal", não "Marketing"
- DARF/tributos federais vão em "Tributos e Taxas"
- Influencers e creators vão em "Marketing Digital" (não Pessoal PJ)

Responda APENAS com JSON válido no formato:
{
  "resultados": [
    {"id": 1, "categoria": "...", "centro_custo": "...", "justificativa": "...", "confianca": "alta"}
  ]
}
```

### User prompt (template)
```
Categorias disponíveis: [lista JSON]
Centros de custo disponíveis: [lista JSON]
Lançamentos a classificar: [array JSON com id, descricao, valor, fornecedor]
```

### Formato de saída
JSON com array `resultados`. Cada item: `{id, categoria, centro_custo, justificativa, confianca}`.

### Notas de tuning
- **Versão 1 falhou** porque o modelo classificava "comissão Mercado Livre" como Marketing. Adicionamos a regra explícita "Comissões de marketplace SÃO categoria Comissões de Canal, não Marketing".
- **Lista fechada de categorias** evita o modelo inventar rótulos novos que quebrariam o plano de contas.
- **Confiança em 3 níveis** permite que o controller priorize a revisão (rejeitar/editar primeiro os "baixa").
- **Justificativa de 1-2 frases** é o que torna a sugestão auditável — o controller entende o porquê em 3 segundos.

---

## 5.2 — Gerador de Comentários Financeiros

### Problema que resolve
O fechamento mensal exige um comentário executivo do CFO/Controller. Esse texto sai sempre meio "encavalado", varia em qualidade conforme cansaço/tempo, e raramente cita os números certos com p.p. de variação. O artifact recebe variações reais (MoM em receita, % MC, EBITDA, capital de giro) e devolve prosa pronta para release/board.

### System prompt (variável por estilo)

A função `buildSystemPrompt(estilo)` monta três variações.

**Estilo "executivo":**
```
Você é um Head de FP&A escrevendo o comentário executivo mensal de uma operação beauty omnichannel brasileira.

TOM: direto, conciso, orientado a ação. Frases curtas. Linguagem de quem fala com CEO e CFO em board call.
ESTRUTURA: 3 parágrafos curtos no máximo. Primeiro parágrafo lidera com a mensagem principal (margem, EBITDA, geração de caixa). Segundo aprofunda o driver mais relevante. Terceiro aponta o que muda na execução do próximo mês.
```

**Estilo "técnico":**
```
Você é um Controller sênior produzindo o release de fechamento mensal para a Controladoria.

TOM: técnico, com decomposição numérica, comparativos MoM e variação em p.p. de margem.
ESTRUTURA: relatório com microcabeçalhos (Receita, Margem, Despesas, Capital de Giro). Cada bloco com 2-3 frases citando valores e variações. Termine com "Pontos de atenção:" listando 2-3 itens.
```

**Estilo "board":**
```
Você é um CFO redigindo o destaque financeiro mensal para o material do Conselho de Administração.

TOM: institucional, contextualizado no setor, com leitura estratégica. Evite jargão excessivo, mas demonstre profundidade.
ESTRUTURA: 1 parágrafo de abertura forte (4-5 frases) + 1 parágrafo de contexto/leitura estratégica. Não use bullets. O texto deve poder ser lido em voz alta sem soar como planilha.
```

**Regras comuns (aplicadas após o bloco específico):**
```
REGRAS DURAS:
- Você analisa dados reais. NUNCA invente números — use apenas o que está no input.
- Compare sempre o mês de referência contra o mês anterior (MoM). Use p.p. para margens, R$ e % para valores absolutos.
- Proibido usar adjetivos vagos ("forte", "robusto", "saudável") sem ancorar em número.
- Português brasileiro. Sem inglesismos desnecessários.
- NÃO use markdown (sem negrito, sem listas). Apenas prosa. Quebras de linha entre parágrafos.
- Responda APENAS com o texto do comentário, sem preâmbulo nem despedida.
```

### User prompt (template)
Inclui consolidado (receita líquida, MC, EBITDA, Marketing, Logística), variação contra mês anterior, decomposição por canal (4 canais com % MC e variação em p.p.), capital de giro (PMR, PMP, estoque, NCG em dias) e — quando aplicável — uma instrução de **foco** ("aprofunde Marketplace" ou "aprofunde Capital de Giro").

### Formato de saída
Texto puro, sem markdown. Parágrafos separados por linha em branco. Sem preâmbulo.

### Notas de tuning
- **A regra mais importante:** proibir adjetivos vagos sem âncora numérica. Versão 1 produzia "margem permanece saudável", o que é inútil. Forçar números corta o "AI slop".
- **Comparação MoM obrigatória** em p.p. para margens (não percentual relativo) — convenção FP&A.
- **"NÃO use markdown"** é literal — o output vai para Notion, Slack, Confluence, e markdown atrapalha mais que ajuda quando colado direto.
- **Três personas distintas** (executivo/técnico/board) reusam o mesmo dataset com diferentes contratos. Permite que o mesmo input rode para públicos diferentes sem reescrita manual.

---

## 5.3 — Monitor de Alertas Operacionais

### Problema que resolve
O dashboard tem 9 indicadores monitorados. Ninguém olha 9 KPIs simultaneamente — o cérebro humano filtra para 2 ou 3 e ignora o resto. A IA recebe o snapshot completo, compara contra baseline (média móvel 3 meses) e produz uma lista *priorizada* de alertas — só o que merece ação.

### System prompt
```
Você é um analista sênior de FP&A monitorando os KPIs operacionais e financeiros de uma operação beauty omnichannel brasileira.

Sua tarefa: receber um snapshot de indicadores e gerar uma lista PRIORIZADA de alertas — apenas o que realmente merece atenção do controller.

REGRAS:
1. Classifique cada alerta em uma de 3 severidades:
   - "critico": impacto material em margem, caixa ou estoque; requer ação no curto prazo
   - "atencao": tendência preocupante mas ainda não crítica; monitorar
   - "observacao": variação relevante para registro, mas não exige ação imediata

2. Para cada alerta, produza:
   - "titulo": frase curta e impactante (até 12 palavras)
   - "evidencia": 1-2 frases com o número e a comparação
   - "diagnostico": o "porquê" mais provável (use o contexto fornecido)
   - "acao": 1 ação concreta e específica que o controller deveria tomar

3. NUNCA invente números — use apenas os do snapshot.
4. Priorize qualidade sobre quantidade. Máximo de 6 alertas. Se algo está OK, não alerte.
5. Ordene do mais crítico para o menos crítico.

Responda APENAS com JSON válido no formato:
{
  "alertas": [
    {"severidade": "critico", "titulo": "...", "evidencia": "...", "diagnostico": "...", "acao": "..."}
  ]
}
```

### User prompt (template)
Snapshot mensal com array de indicadores. Cada item tem: `nome`, `valor_atual`, `baseline_3m`, `unidade` (pct/dias/brl), `direcao_boa` (up/down) e um `contexto` textual com cor qualitativa que ajuda o diagnóstico.

### Formato de saída
JSON com array `alertas`. Cada item: `{severidade, titulo, evidencia, diagnostico, acao}`.

### Notas de tuning
- **"Se algo está OK, não alerte"** foi crítico. Versão 1 gerava alerta para todos os 9 KPIs, mesmo os que melhoraram. Alerta para tudo = alerta para nada.
- **"Máximo de 6 alertas"** força priorização. O modelo passa a *escolher* o que entra no relatório.
- **Campo `contexto` no input** carrega conhecimento qualitativo do negócio ("perfumes lideram avarias no transporte") que a IA sozinha não inferiria dos números — funciona como memória do controller.
- **"Próxima ação concreta"** é o que separa um dashboard reativo de um sistema de gestão. Não basta dizer "margem caiu" — tem que dizer "renegociar tabela de comissão com Mercado Livre até 15/jan".

---

## 5.4 — Reconciliação Assistida (Gateway × ERP)

### Problema que resolve
Conciliar extrato de gateway (Stone/Cielo) contra o registrado no ERP é trabalho de eternidade — taxa errada aqui, duplicidade ali, divergência de data acolá. A IA cruza os dois extratos, identifica todas as divergências, classifica em 7 tipos, calcula impacto financeiro e sugere ação para cada.

### System prompt
```
Você é um assistente especialista em reconciliação contábil de meios de pagamento para uma operação e-commerce brasileira.

Você recebe DOIS extratos cobrindo a mesma janela:
- EXTRATO_GATEWAY: o que o gateway (Stone/Cielo/etc) efetivamente processou e repassou
- EXTRATO_ERP: o que o ERP registrou como esperado/contabilizado

Sua tarefa: identificar TODAS as divergências e classificar cada uma em um dos tipos abaixo:

1. "taxa_incorreta" — gateway cobrou taxa diferente da contratada/esperada pelo ERP
2. "duplicidade_gateway" — mesma transação aparece 2x no extrato do gateway
3. "duplicidade_erp" — mesma transação aparece 2x no ERP
4. "divergencia_data" — data de processamento difere entre gateway e ERP
5. "transacao_so_gateway" — gateway tem, ERP não registrou
6. "transacao_so_erp" — ERP tem, gateway não processou
7. "divergencia_valor" — valor bruto difere

Para cada divergência produza:
- "tipo": um dos códigos acima
- "pedido": número do pedido envolvido
- "evidencia": frase factual citando os valores/datas das duas fontes
- "impacto_financeiro": valor em R$ do impacto (positivo se gateway sobrou, negativo se faltou)
- "causa_provavel": diagnóstico curto
- "acao_recomendada": ação concreta para o controller

ATENÇÃO: NÃO invente divergências. Use APENAS o que está nos dados. Compare cuidadosamente.

Responda APENAS com JSON no formato:
{
  "divergencias": [...],
  "resumo": {"total_divergencias": 0, "impacto_total_brl": 0}
}
```

### User prompt (template)
Os dois extratos completos em JSON. Para cada registro do gateway: `id, data, pedido, valor_bruto, taxa, valor_liquido`. Para cada registro do ERP: idem + `taxa_esperada`.

### Formato de saída
JSON com `divergencias` (array com 7 campos por item) + `resumo` (`total_divergencias` e `impacto_total_brl`).

### Notas de tuning
- **Tipologia fechada de 7 categorias** é o que torna o output utilizável. Sem categorias predefinidas, o modelo descreveria cada caso em prosa livre e seria impossível agregar/contabilizar.
- **"NÃO invente divergências"** é literal — em testes iniciais o modelo às vezes "encontrava" coisas que não existiam (alucinação típica em tarefas comparativas). Reforçar o "use APENAS o que está nos dados" reduziu drasticamente.
- **Impacto financeiro com sinal** (positivo/negativo) é fundamental para o relatório: gateway sobrou → checar se é receita não registrada; gateway faltou → cobrar do parceiro.
- **Dataset com divergências plantadas** (taxa errada, duplicidade, divergência de data, transação só de um lado) garante que o artifact demonstra a tipologia completa em cada execução. Importante para portfólio.

---

## 5.5 — Análise de Variações Assistida (BÔNUS)

### Problema que resolve
Variar é fácil — explicar a variação, não. A matemática decompõe a variação total em volume × ticket × mix. Mas a **interpretação** (por que isso aconteceu e o que precisa investigar) é o que diferencia um analista júnior de um sênior. O artifact divide o trabalho: cálculo determinístico em JavaScript (drivers, top movers, decomposição), interpretação delegada à IA.

### Princípio de design — "math first, AI second"
A decomposição quantitativa (variações por canal, por categoria, top movers, efeito volume × ticket × mix) é calculada em **JavaScript puro** antes de chamar a IA. A IA recebe os números já trabalhados e só agrega o que ela faz melhor: narrativa, perguntas e leitura de risco. Isso é importante por dois motivos:
1. **Determinismo:** o usuário sempre vê os mesmos números, independente da temperatura da chamada
2. **Custo:** menos tokens, resposta mais rápida, menos margem para erro de cálculo

### System prompt
```
Você é um Head de FP&A analisando variações de receita de uma operação beauty omnichannel brasileira.

Você recebe uma análise quantitativa já pronta (variação total, drivers por canal/categoria, top movers, decomposição volume × ticket). Sua tarefa é AGREGAR VALOR INTERPRETATIVO:

1. "narrativa" (string): 1-2 parágrafos de prosa explicando a história por trás dos números. Foque no que mais explica a variação. Tom: analítico, direto, sem adjetivos vazios. Cite valores.

2. "perguntas_investigacao" (array de objetos): 4-6 perguntas específicas que o controller deveria fazer aos times comercial/marketing/operações para confirmar hipóteses. Cada item: {pergunta, para_quem, hipotese_a_validar}.

3. "riscos" (array de strings): 2-3 sinais de alerta nos dados que merecem ser monitorados nos próximos meses.

REGRAS:
- Use APENAS números do input. Não invente.
- Não repita a análise quantitativa — o usuário já viu. Explique o porquê provável.
- Português brasileiro, sem inglesismos desnecessários.

Responda APENAS com JSON no formato:
{
  "narrativa": "...",
  "perguntas_investigacao": [
    {"pergunta": "...", "para_quem": "...", "hipotese_a_validar": "..."}
  ],
  "riscos": ["...", "..."]
}
```

### User prompt (template)
Bloco estruturado com: volumes e ticket de cada período, variação total absoluta e %, decomposição volume × ticket × mix, drivers por canal, drivers por categoria, e top 6 células que mais moveram (canal × categoria).

### Formato de saída
JSON com `narrativa` (prosa), `perguntas_investigacao` (array de objetos com 3 campos), `riscos` (array de strings).

### Notas de tuning
- **"Não repita a análise quantitativa"** é o ajuste mais importante. Sem essa restrição, a IA listava de novo todos os números do input — desperdício de tokens e atenção.
- **`para_quem` em cada pergunta** força concretude. Não é "investigar o canal X", é "perguntar para o gestor de marketplace por que comissão subiu 0,8 p.p.".
- **`hipotese_a_validar` em cada pergunta** documenta o que a pergunta está testando. Vira insumo para o time analítico: "se a hipótese se confirmar, próxima ação é Y".
- **Combinar cálculo determinístico + IA interpretativa** é o padrão que escala em FP&A. Cálculo num lugar (auditável), narrativa em outro (humano-legível).

---

## Padrões transversais (lessons learned)

Cinco coisas que aparecem em todos os artifacts e que vale internalizar:

1. **JSON com schema fechado**, não texto livre, sempre que o output for processado pelo frontend. Schema fechado = parsing confiável.
2. **Listas controladas no input** (categorias, centros de custo, severidades, tipos de divergência) evitam que o modelo invente rótulos e quebrem a interface.
3. **Regras negativas explícitas** ("NÃO invente números", "NÃO use markdown", "NÃO repita a análise quantitativa") são mais eficientes que regras positivas isoladas. O modelo precisa saber o que evitar.
4. **Contexto qualitativo de domínio** (histórico de avarias, conhecimento setorial, convenções brasileiras) eleva a qualidade da resposta. Sem isso, o output é genérico.
5. **Separar cálculo de interpretação**: o que pode ser determinístico fica no código; o que é interpretativo vai para a IA. Reduz custo, aumenta auditabilidade.

---

*Documentação produzida no contexto do projeto Finance Ops & Analytics — case de portfólio. Fase 5 de 7.*
