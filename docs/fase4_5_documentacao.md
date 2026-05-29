# Fases 4 e 5 — Dashboard e IA Aplicada

Documentação técnica da camada de visualização e inteligência artificial do projeto. As Fases 4 e 5 foram intencionalmente **fundidas** em uma única entrega arquitetural: um dashboard editorial em React com 1 ferramenta de IA integrada, complementado por 4 artifacts standalone que demonstram outras aplicações de IA em finanças.

---

## 1. Visão geral

| Atributo | Valor |
|----------|-------|
| Aplicação principal | Dashboard React em `dashboard/` (Vite + React 19 + Tailwind + Recharts) |
| Seções de navegação | 7 (6 analíticas + 1 de IA integrada) |
| Artifacts de IA | 5 no total (1 integrado ao app + 4 standalone) |
| Modelo de IA | `claude-sonnet-4-20250514` |
| Forma de execução dos standalone | Diretamente no Claude.ai (proxy automático) ou exportáveis para ambiente próprio |
| Fonte de dados | Snapshot do modelo financeiro da Fase 3 embutido em `App.jsx` |

A decisão de fundir as duas fases nasceu naturalmente do design: o **gerador de comentários** (5.2) precisa ler o recorte ativo do dashboard (canal + período + métricas) para gerar narrativa contextualizada. Mantê-lo como artifact órfão romperia essa integração. As outras 4 ferramentas de IA não compartilham essa dependência e permanecem standalone — o que é uma virtude, não uma limitação.

---

## 2. Camada 1 — Dashboard editorial (Fase 4)

### 2.1 Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | React 19 |
| Build | Vite 8 |
| Estilização | Tailwind CSS 3 |
| Gráficos | Recharts 3 |
| Ícones | Lucide React |
| Tipografia | Cormorant Garamond (títulos) + Inter (corpo) + JetBrains Mono (números) |

### 2.2 Visual e identidade

A identidade visual foge do "dashboard de SaaS branco genérico". Dark mode editorial:

- Fundo: `#07130F` (verde-petróleo escuro)
- Acentos: `#FF5EAD` (rosa) · `#00B884` (verde) · `#D6B06A` (dourado fosco)
- Headline: *"A operação, decifrada em números."*
- Grain overlay sutil + gradientes radiais nos cantos
- Tipografia serifada para títulos, mono para valores numéricos

A escolha é deliberada: um portfólio precisa **chamar atenção visual** sem perder profissionalismo. O visual editorial sinaliza autoria, contraste com BI proprietário e cuidado de design.

### 2.3 As 7 seções de navegação

| # | Seção | Conteúdo |
|---|-------|----------|
| 01 | **Visão Geral** | Headline KPIs (receita, MC, EBITDA, resultado), série temporal, mix por canal |
| 02 | **DRE Gerencial** | Tabela de DRE consolidada com drill-down por canal |
| 03 | **Mix & Canais** | Composição de receita por canal e categoria com gráficos comparativos |
| 04 | **Capital de Giro** | PMR (gateway/ERP), PME, PMP, ciclo financeiro, NCG estimada |
| 05 | **Estoque & SKUs** | Aging por categoria, top SKUs por margem, indicadores de giro |
| 06 | **Antes vs Depois** | ROI da transformação operacional (puxado da Fase 3) |
| 07 | **IA · Comentários** | Gerador de comentários executivos integrado *(Fase 5.2)* |

### 2.4 Filtros globais

Header sticky com filtros que afetam todas as seções:

- **Canais** — multi-select (E-commerce, Marketplace, Franquia, Loja Própria)
- **Período** — atalhos para todos os meses, ano corrente, trimestres específicos

Esses filtros são propagados para o componente `Comentarios` via props (`selectedCanais`, `periodIndices`), o que viabiliza a IA contextual.

### 2.5 Dados embarcados

Os dados ficam em uma constante `DATA` no próprio `App.jsx` — snapshot dos números do modelo financeiro da Fase 3. Essa decisão tem três motivos:

1. **Reprodutibilidade** — qualquer pessoa que clone o repositório roda o app sem provisionar backend ou banco
2. **Performance** — gráficos renderizam instantaneamente, sem loading
3. **Hospedagem trivial** — deploy possível em qualquer host estático (Vercel, Netlify, GitHub Pages)

Em uma versão de produção, esses dados viriam de um endpoint, mas para um portfólio o trade-off é claro: simplicidade de execução supera a "elegância" de uma arquitetura cliente-servidor.

---

## 3. Camada 2 — IA Aplicada (Fase 5)

### 3.1 Cinco artifacts (não quatro)

O plano original previa 4 artifacts. A entrega final tem **5**, incluindo um bônus:

| ID | Artifact | Status | O que demonstra |
|----|----------|--------|------------------|
| 5.1 | **Classificador Inteligente** | Standalone | Lançamentos com descrição livre → categoria + centro de custo + justificativa + nível de confiança |
| 5.2 | **Gerador de Comentários** | **Integrado ao dashboard** | Recorte ativo (canal + período) → comentário executivo em 3 estilos × 3 focos |
| 5.3 | **Monitor de Alertas** | Standalone | KPIs do mês vs baseline → IA prioriza anomalias com sugestão de ação |
| 5.4 | **Reconciliação Assistida** | Standalone | Extratos gateway × ERP → IA classifica divergências (taxa, duplicidade, data) |
| 5.5 | **Análise de Variações** *(bônus)* | Standalone | Dois períodos comparáveis → IA decompõe a variação em drivers + gera perguntas-piloto |

### 3.2 Por que 1 integrado + 4 standalone

A diferença não é arbitrária — vem da natureza dos artifacts:

**O que justifica integração:**
- Depender de um recorte ativo no dashboard (Comentários precisa saber qual canal e qual período o usuário está olhando)
- Compor com KPIs e gráficos exibidos na mesma sessão

**O que justifica standalone:**
- Demonstrar uma capability isolada que não precisa do dashboard para fazer sentido
- Ser linkável individualmente (cada artifact é uma "vitrine" autônoma)
- Permitir abrir direto no Claude.ai sem precisar de setup local

Essa separação faz com que **cada artifact tenha sua própria audiência e seu próprio momento de compartilhamento**. Estrategicamente, isso multiplica o material de divulgação.

### 3.3 Padrão técnico comum

Todos os 5 artifacts compartilham:

| Item | Valor |
|------|-------|
| Modelo | `claude-sonnet-4-20250514` |
| Endpoint | `POST https://api.anthropic.com/v1/messages` |
| Max tokens | 1.500–3.000 conforme artifact |
| Formato de saída | JSON estruturado *(exceto Comentários, que é prosa)* |
| Parsing | `text.replace(/```json|```/g, "").trim()` → `JSON.parse()` |
| Idioma | Português brasileiro |

### 3.4 Standalone vs integrado — diferença na chamada à API

**Standalone (5.1, 5.3, 5.4, 5.5):**

```js
fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ model, max_tokens, system, messages })
});
```

Sem `x-api-key`, sem flag de browser-direct. Funciona dentro do **ambiente artifact do Claude.ai**, que faz proxy automático da chamada.

**Integrado — Comentários (5.2):**

```js
fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  },
  body: JSON.stringify({ model, max_tokens, system, messages })
});
```

Adaptado para o ambiente Vite — chave de API via variável de ambiente, flag explícita para chamada direta do browser. Em produção real, essa chamada passaria por um backend para não expor a chave ao cliente; para um case de portfólio com chave do próprio autor, é aceitável e documentado.

---

## 4. Detalhamento dos artifacts de IA

### 4.1 Classificador Inteligente (5.1)

**Problema:** lançamentos chegam ao Contas a Pagar com descrição livre (`"PGTO META PLATFORMS - CAMPANHA BLACK FRIDAY E-COM"`). Classificar manualmente em categoria + centro de custo consome horas e gera inconsistência entre meses.

**O artifact mostra:**
- Mock de 8–10 lançamentos típicos de uma operação beauty omnichannel
- IA classifica cada um em **categoria + centro de custo**, com justificativa e nível de confiança (alta/média/baixa)
- Controller pode aceitar, editar ou rejeitar cada sugestão

**System prompt destaca:**
- "Comissões de marketplace SÃO categoria 'Comissões de Canal', não 'Marketing'"
- "Influencers e creators vão em 'Marketing Digital' (não Pessoal PJ)"
- "DARF/tributos federais vão em 'Tributos e Taxas'"

Essas regras vêm da experiência real do FP&A brasileiro e são o que diferencia o classificador de uma "categorização genérica".

### 4.2 Gerador de Comentários (5.2 — integrado)

**Problema:** escrever o comentário executivo do fechamento mensal consome 12-16h do controller. A IA gera o draft a partir dos números reais, controller revisa.

**O artifact (integrado) faz:**
- Lê o recorte ativo do dashboard (canal + período)
- Calcula automaticamente a janela comparativa equivalente imediatamente anterior
- Pergunta ao usuário **estilo** (Executivo / Técnico / Board) e **foco** (Consolidado / Canais / Rentabilidade)
- Gera comentário em prosa pura, sem markdown, no estilo escolhido

**Diferenciais:**
- **Prompts diferenciados por estilo:** Executivo (3 parágrafos curtos, orientado a ação), Técnico (microcabeçalhos com decomposição numérica), Board (1 parágrafo de abertura forte + leitura estratégica)
- **Regras duras:** "NUNCA invente números — use apenas o que está no input"; "Proibido usar adjetivos vagos ('forte', 'robusto', 'saudável') sem ancorar em número"

### 4.3 Monitor de Alertas Operacionais (5.3)

**Problema:** o controller olha 40+ KPIs no fechamento. Sabe que 3 ou 4 demandam ação, mas qual? A IA prioriza.

**O artifact mostra:**
- Snapshot de KPIs do mês de referência vs baseline (média do trimestre anterior)
- IA identifica anomalias, atribui severidade (crítica / atenção / informativa) e gera sugestão de ação para cada

**Decisão importante:** a IA não "descobre" anomalias do zero — recebe as métricas já calculadas e o baseline. Ela classifica e prioriza, contextualizando o número. Isso evita alucinação numérica e mantém a IA no papel certo (interpretar, não medir).

### 4.4 Reconciliação Assistida (5.4)

**Problema:** comparar manualmente extrato do gateway com o ERP é um dos processos mais penosos do fechamento. Quando aparece uma diferença de R$ 47,32, controller abre uma terceira aba para investigar se é taxa, duplicidade ou data.

**O artifact mostra:**
- Dois extratos lado a lado (gateway Stone × ERP) da mesma janela, com divergências plantadas
- IA classifica cada divergência por **tipo** (taxa incorreta / lançamento duplicado / divergência de data) e **severidade**
- Para cada uma, gera sugestão de tratamento

**Stack didático:** o usuário não precisa entender nada de reconciliação — abre o artifact e vê na prática o que a IA faria com extratos reais.

### 4.5 Análise de Variações Assistida (5.5 — bônus)

**Problema:** ao comparar dois períodos (Q4-2024 vs Q4-2023, por exemplo), o controller precisa decompor a variação em drivers (volume? preço? mix? margem? custo?) e formular as perguntas certas para investigar.

**O artifact faz:**
- Calcula a decomposição da variação total de forma **determinística** (antes de chamar a IA)
- Envia drivers + valores para a IA
- IA gera a leitura analítica + 3-5 perguntas-piloto para o controller investigar

**Por que é bônus:** não estava no plano original, mas surgiu naturalmente. É a peça que conecta o universo "explicação de número" com o universo "análise FP&A próxima da decisão".

---

## 5. Documentação dos prompts

O arquivo `ia/prompts_ia.md` traz, para cada um dos 5 artifacts:

1. Contexto do problema
2. System prompt na íntegra
3. User prompt (template)
4. Formato de saída esperado
5. Notas de tuning — o que foi ajustado e por quê

Em produtos de IA aplicada, o prompt é parte do código. Documentá-lo permite (a) reproduzir resultados, (b) iterar com método em vez de tentativa-e-erro, (c) onboardar outros analistas no padrão. **Tratamos prompts como contratos:** input estruturado → instrução clara → output em formato fechado.

---

## 6. Estrutura de pastas

```text
dashboard/
├── .env.example                # Template para a chave da API
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json                # React 19, Vite 8, Tailwind 3, Recharts 3, Lucide
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── README.md                   # Setup local (ver seção 7 abaixo)
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                # Entry point
    ├── App.jsx                 # Dashboard com 7 seções + DATA embarcado
    └── artifacts/
        └── Comentarios.jsx     # Artifact 5.2 — integrado

ia/
├── classificador.jsx           # Artifact 5.1 — standalone
├── alertas.jsx                 # Artifact 5.3 — standalone
├── reconciliacao.jsx           # Artifact 5.4 — standalone
├── analise_variacoes.jsx       # Artifact 5.5 — standalone (bônus)
└── prompts_ia.md               # Documentação completa dos prompts
```

---

## 7. Como rodar o dashboard localmente

```bash
# 1. Clone o repositório
git clone <url>
cd dashboard

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e cole sua chave Anthropic em VITE_ANTHROPIC_API_KEY

# 4. Rodar em desenvolvimento
npm run dev
```

A aplicação abre em `http://localhost:5173`.

### Como executar os artifacts standalone

Os 4 artifacts em `ia/*.jsx` foram desenhados para rodar **dentro do Claude.ai**, onde a chamada à API Anthropic é proxy automática (sem necessidade de chave). Para executá-los:

1. Copie o conteúdo de `ia/<artifact>.jsx`
2. Cole em uma conversa do Claude.ai pedindo "renderize esse artifact"
3. O artifact abrirá com a IA já conectada

Alternativamente, podem ser adaptados para o ambiente Vite seguindo o padrão do `Comentarios.jsx` — basta adicionar os headers `x-api-key` e `anthropic-dangerous-direct-browser-access`.

---

## 8. Decisões de design

**Por que fundir Fase 4 e 5 em uma entrega?** O plano original tratava dashboard e IA como entregas separadas, mas o gerador de comentários (5.2) só faz sentido se lê o recorte ativo do dashboard. Forçar separação significaria duplicar filtros, duplicar dados, perder contextualização. A fusão respeita o que o produto pede.

**Por que manter 4 artifacts standalone em vez de integrar todos?** Cada artifact tem uma audiência diferente e demonstra uma capability autossuficiente. Forçar todos no dashboard inflaria o app sem ganho proporcional e diluiria a leitura de cada um. Standalone, eles ganham vida própria — abrindo direto, viralizando individualmente em posts de LinkedIn.

**Por que React 19 + Vite 8?** Versões correntes (final de 2025), com bundle pequeno e dev server rápido. Vite escolhido sobre Next porque o app é puramente client-side — não há SSR, não há rotas no servidor, não há ganho de Next aqui.

**Por que dados embarcados em vez de fetch?** Para um portfólio, o trade-off é claro: app que abre instantaneamente em qualquer host estático supera arquitetura cliente-servidor "correta". A constante `DATA` é gerada a partir do modelo da Fase 3 e atualizar é trivial (re-extrair as series do Excel).

**Por que tipografia editorial?** Dashboards de FP&A tendem a ser visualmente intercambiáveis. O visual editorial assina autoria: passa a sinalizar "este aqui foi feito por alguém que pensou no design", o que separa o projeto do mar de Power BIs idênticos.

**Por que JSON estruturado na maioria dos artifacts?** Em IA aplicada a fluxos operacionais, o output precisa ser **consumível por código**, não apenas legível por humano. JSON com schema previsível permite renderizar, ordenar, filtrar e auditar — coisa que prosa livre não permite. Comentários é a exceção porque o output **é** o produto final.

---

## 9. Limitações reconhecidas

- **Chave da API no client:** o `Comentarios.jsx` expõe a chave Anthropic ao browser via `VITE_ANTHROPIC_API_KEY`. Aceitável para portfólio com chave própria do autor; em produção, a chamada passaria por um backend proxy.
- **Dados estáticos:** não há reload automático quando o modelo financeiro da Fase 3 muda. Hoje, atualizar o dashboard exige regenerar a constante `DATA`.
- **Sem testes automatizados:** o foco da entrega foi UI e prompts. Em uma versão "produção", testes de prompt seriam essenciais (golden samples, verificação de schema, etc).
- **Visual sem responsividade extensiva:** layouts foram otimizados para desktop (1280px). Mobile funciona mas não está polido.

Esses pontos são deliberadamente honestos — um portfólio que finge ser produção perde mais credibilidade do que ganha.

---

*Documentação técnica — Fases 4 e 5, Finance Ops & Analytics*
