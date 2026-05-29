import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  FileText,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Info,
} from "lucide-react";

// ============================================================
// IA · COMENTÁRIOS — INTEGRADO AO DASHBOARD
// Marco 2 da Fase 5 · Finance Ops & Analytics
//
// Lê DATA.dre_por_canal (estrutura já completa por canal,
// incluindo EBITDA e MC pré-calculados).
// ============================================================

// ------------------------------------------------------------
// Configurações
// ------------------------------------------------------------

const ESTILOS = [
  {
    id: "executivo",
    label: "Executivo",
    descricao: "Para CEO/CFO. Direto, orientado a ação.",
    accent: "#FF5EAD",
  },
  {
    id: "tecnico",
    label: "Técnico",
    descricao: "Para Controladoria. Detalhamento numérico e causas.",
    accent: "#00B884",
  },
  {
    id: "board",
    label: "Board",
    descricao: "Para Conselho. Visão estratégica e contexto.",
    accent: "#D6B06A",
  },
];

const FOCOS = [
  { id: "consolidado", label: "Consolidado" },
  { id: "canais", label: "Foco em canais" },
  { id: "rentabilidade", label: "Foco em rentabilidade" },
];

// Caractere unicode MINUS SIGN (U+2212) — não é hífen comum
const M = "\u2212";

// ------------------------------------------------------------
// Agregação a partir de DATA.dre_por_canal
// ------------------------------------------------------------

function aggregateLine(DATA, linha, canais, indices) {
  if (!indices || indices.length === 0 || !canais || canais.length === 0) return 0;
  return indices.reduce((sumI, i) => {
    const valorMes = canais.reduce((sumC, canal) => {
      const serie = DATA.dre_por_canal?.[canal]?.[linha];
      return sumC + (Array.isArray(serie) ? serie[i] || 0 : 0);
    }, 0);
    return sumI + valorMes;
  }, 0);
}

function calcularMetricas(DATA, canais, indices) {
  const receitaBruta = aggregateLine(DATA, "Receita Bruta", canais, indices);
  const devolucoes = aggregateLine(DATA, `(${M}) Devoluções`, canais, indices);
  const comissoes = aggregateLine(DATA, `(${M}) Comissões de canal`, canais, indices);
  const receitaLiq = aggregateLine(DATA, "Receita Líquida", canais, indices);
  const cmv = aggregateLine(DATA, `(${M}) CMV`, canais, indices);
  const mc = aggregateLine(DATA, "Margem de Contribuição", canais, indices);
  const mcPct = receitaLiq ? mc / receitaLiq : 0;

  const pessoal = aggregateLine(DATA, `(${M}) Pessoal`, canais, indices);
  const marketing = aggregateLine(DATA, `(${M}) Marketing`, canais, indices);
  const logistica = aggregateLine(DATA, `(${M}) Logística`, canais, indices);
  const administrativo = aggregateLine(DATA, `(${M}) Administrativo`, canais, indices);
  const aluguel = aggregateLine(DATA, `(${M}) Aluguel`, canais, indices);
  const tecnologia = aggregateLine(DATA, `(${M}) Tecnologia`, canais, indices);
  const outros = aggregateLine(DATA, `(${M}) Outros`, canais, indices);
  const despesasOpTotal =
    pessoal + marketing + logistica + administrativo + aluguel + tecnologia + outros;

  const ebitda = aggregateLine(DATA, "EBITDA", canais, indices);

  return {
    receitaBruta,
    devolucoes,
    comissoes,
    receitaLiq,
    cmv,
    mc,
    mcPct,
    pessoal,
    marketing,
    logistica,
    administrativo,
    aluguel,
    tecnologia,
    outros,
    despesasOpTotal,
    ebitda,
  };
}

function calcularIndicesComparativo(periodIndices) {
  if (!periodIndices || periodIndices.length === 0) return null;
  const len = periodIndices.length;
  const startAtual = periodIndices[0];
  const startComp = startAtual - len;
  if (startComp < 0) return null;
  return Array.from({ length: len }, (_, i) => startComp + i);
}

function periodoToLabel(p) {
  if (!p) return "";
  const [y, m] = p.split("-");
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${meses[parseInt(m, 10) - 1]}/${y.slice(2)}`;
}

function indicesToLabel(DATA, indices) {
  if (!indices || indices.length === 0) return "—";
  if (indices.length === 1) return periodoToLabel(DATA.periods[indices[0]]);
  const inicio = periodoToLabel(DATA.periods[indices[0]]);
  const fim = periodoToLabel(DATA.periods[indices[indices.length - 1]]);
  return `${inicio} → ${fim}`;
}

// ------------------------------------------------------------
// Chamada à API
// ------------------------------------------------------------

const buildSystemPrompt = (estilo) => {
  const blocos = {
    executivo: `Você é um Head de FP&A escrevendo o comentário executivo de fechamento de uma operação beauty omnichannel brasileira.

TOM: direto, conciso, orientado a ação. Frases curtas. Linguagem de quem fala com CEO e CFO em board call.
ESTRUTURA: 3 parágrafos curtos. Primeiro lidera com a mensagem principal (margem, EBITDA, geração de caixa). Segundo aprofunda o driver mais relevante. Terceiro aponta o que muda na execução do próximo período.`,
    tecnico: `Você é um Controller sênior produzindo o release de fechamento do período para a Controladoria.

TOM: técnico, com decomposição numérica e variação em p.p. de margem.
ESTRUTURA: relatório com microcabeçalhos (Receita, Margem, Despesas). Cada bloco com 2-3 frases citando valores e variações. Termine com "Pontos de atenção:" listando 2-3 itens em prosa corrida (sem bullets).`,
    board: `Você é um CFO redigindo o destaque financeiro do período para o material do Conselho de Administração.

TOM: institucional, contextualizado no setor, com leitura estratégica.
ESTRUTURA: 1 parágrafo de abertura forte (4-5 frases) + 1 parágrafo de leitura estratégica. Não use bullets.`,
  };

  return `${blocos[estilo]}

REGRAS DURAS:
- Você analisa dados reais. NUNCA invente números — use apenas o que está no input.
- Compare sempre o período de referência contra o período comparativo. Use p.p. para margens, R$ e % para valores absolutos.
- Proibido usar adjetivos vagos ("forte", "robusto", "saudável") sem ancorar em número.
- Português brasileiro. Sem inglesismos desnecessários.
- NÃO use markdown (sem negrito, sem listas). Apenas prosa. Quebras de linha entre parágrafos.
- Responda APENAS com o texto do comentário, sem preâmbulo nem despedida.`;
};

const buildUserPrompt = (ctx) => {
  const { labelAtual, labelComp, canais, metricasAtual, metricasComp, foco } = ctx;
  const fmt = (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  const dPct = (a, b) => (b ? ((a - b) / b) * 100 : 0).toFixed(1);

  let body = `Período de referência: ${labelAtual}
Período comparativo: ${labelComp}
Canais incluídos: ${canais.join(", ")}

RECEITA E DEDUÇÕES
- Receita Bruta: R$ ${fmt(metricasAtual.receitaBruta)} (comp R$ ${fmt(metricasComp.receitaBruta)}, var ${dPct(metricasAtual.receitaBruta, metricasComp.receitaBruta)}%)
- Devoluções: R$ ${fmt(metricasAtual.devolucoes)} (comp R$ ${fmt(metricasComp.devolucoes)})
- Comissões de canal: R$ ${fmt(metricasAtual.comissoes)} (comp R$ ${fmt(metricasComp.comissoes)})
- Receita Líquida: R$ ${fmt(metricasAtual.receitaLiq)} (comp R$ ${fmt(metricasComp.receitaLiq)}, var ${dPct(metricasAtual.receitaLiq, metricasComp.receitaLiq)}%)

MARGEM
- CMV: R$ ${fmt(metricasAtual.cmv)} (comp R$ ${fmt(metricasComp.cmv)})
- Margem de Contribuição: R$ ${fmt(metricasAtual.mc)} (${(metricasAtual.mcPct * 100).toFixed(1)}%); comparativo R$ ${fmt(metricasComp.mc)} (${(metricasComp.mcPct * 100).toFixed(1)}%) — var ${((metricasAtual.mcPct - metricasComp.mcPct) * 100).toFixed(1)} p.p.

DESPESAS OPERACIONAIS
- Pessoal: R$ ${fmt(metricasAtual.pessoal)} (comp R$ ${fmt(metricasComp.pessoal)})
- Marketing: R$ ${fmt(metricasAtual.marketing)} (comp R$ ${fmt(metricasComp.marketing)})
- Logística: R$ ${fmt(metricasAtual.logistica)} (comp R$ ${fmt(metricasComp.logistica)})
- Administrativo + Aluguel + Tecnologia + Outros: R$ ${fmt(metricasAtual.administrativo + metricasAtual.aluguel + metricasAtual.tecnologia + metricasAtual.outros)} (comp R$ ${fmt(metricasComp.administrativo + metricasComp.aluguel + metricasComp.tecnologia + metricasComp.outros)})

EBITDA
- EBITDA: R$ ${fmt(metricasAtual.ebitda)} (comp R$ ${fmt(metricasComp.ebitda)})
`;

  if (foco === "canais") {
    body += `\nFOCO ESPECIAL: aprofunde a leitura do(s) canal(is) — ${canais.join(", ")}. Discuta papel no mix, crescimento e eficiência operacional.`;
  } else if (foco === "rentabilidade") {
    body += `\nFOCO ESPECIAL: rentabilidade. Decomposição da margem de contribuição, peso das comissões e devoluções, alavancagem das despesas estruturais, conversão em EBITDA.`;
  } else {
    body += `\nFoco: leitura consolidada equilibrada.`;
  }

  return body;
};

async function gerarComentario(ctx) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Chave da API não encontrada. Verifique o arquivo .env.local na raiz.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: buildSystemPrompt(ctx.estilo),
      messages: [{ role: "user", content: buildUserPrompt(ctx) }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro HTTP ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("")
    .trim();
}

// ------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------

export default function Comentarios({ DATA, selectedCanais, periodIndices }) {
  const [estilo, setEstilo] = useState("executivo");
  const [foco, setFoco] = useState("consolidado");
  const [comentario, setComentario] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const indicesComp = useMemo(
    () => calcularIndicesComparativo(periodIndices),
    [periodIndices]
  );

  const metricasAtual = useMemo(
    () => calcularMetricas(DATA, selectedCanais, periodIndices),
    [DATA, selectedCanais, periodIndices]
  );
  const metricasComp = useMemo(
    () => (indicesComp ? calcularMetricas(DATA, selectedCanais, indicesComp) : null),
    [DATA, selectedCanais, indicesComp]
  );

  const labelAtual = indicesToLabel(DATA, periodIndices);
  const labelComp = indicesComp ? indicesToLabel(DATA, indicesComp) : null;

  const podeGerar = !!indicesComp && !carregando;

  const handleGerar = async () => {
    setCarregando(true);
    setErro(null);
    setComentario("");
    try {
      const texto = await gerarComentario({
        labelAtual,
        labelComp,
        canais: selectedCanais,
        metricasAtual,
        metricasComp,
        estilo,
        foco,
      });
      setComentario(texto);
    } catch (e) {
      setErro(e.message || "Falha ao gerar comentário.");
      console.error(e);
    }
    setCarregando(false);
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(comentario);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const estiloAtual = ESTILOS.find((e) => e.id === estilo);

  const fmtBRLk = (v) => {
    if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2)}M`;
    if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
    return `R$ ${v.toFixed(0)}`;
  };
  const variacaoPct = metricasComp
    ? (metricasAtual.receitaLiq / metricasComp.receitaLiq - 1) * 100
    : null;
  const variacaoMC = metricasComp
    ? (metricasAtual.mcPct - metricasComp.mcPct) * 100
    : null;

  return (
    <div>
      {/* Header */}
      <header className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#FF5EAD] bg-[#FF5EAD]">
            <div className="h-1 w-1 rounded-full bg-[#D6B06A]" />
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#FF5EAD]">
            IA Aplicada · Comentário do recorte
          </div>
        </div>
        <h2
          className="font-serif text-[36px] font-light leading-[0.95] text-[#F7FBF8] md:text-[44px]"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          <span className="block">Os números falam.</span>
          <span className="block italic text-[#00B884]">A IA os interpreta.</span>
        </h2>
        <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-[#B5C9C0]">
          Gera comentário executivo a partir do <strong>recorte selecionado no dashboard</strong> —
          período, canais e métricas reais do DRE. Compara contra a janela equivalente
          imediatamente anterior.
        </p>
      </header>

      {/* Contexto */}
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-sm border border-[#29483F] bg-[#10221C] p-5 md:grid-cols-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">
            Período em análise
          </div>
          <div className="mt-1 font-mono text-[13px] text-[#F7FBF8]">{labelAtual}</div>
          <div className="mt-0.5 text-[10px] text-[#8AA79B]">
            {periodIndices?.length || 0} {periodIndices?.length === 1 ? "mês" : "meses"}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">
            Comparando contra
          </div>
          <div
            className="mt-1 font-mono text-[13px]"
            style={{ color: labelComp ? "#F7FBF8" : "#8AA79B" }}
          >
            {labelComp || "— (janela anterior indisponível)"}
          </div>
          {labelComp && (
            <div className="mt-0.5 text-[10px] text-[#8AA79B]">janela anterior equivalente</div>
          )}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">
            Canais incluídos
          </div>
          <div className="mt-1 font-mono text-[12px] text-[#F7FBF8]">
            {selectedCanais.join(" · ")}
          </div>
        </div>
      </div>

      {/* Aviso sem comparativo */}
      {!indicesComp && (
        <div className="mb-6 flex items-start gap-3 rounded-sm border border-[#D6B06A]/40 bg-[#3A2E1E]/40 p-4">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#D6B06A]" strokeWidth={1.75} />
          <div className="text-xs text-[#D8E5DF]">
            O recorte selecionado não tem janela anterior equivalente. Escolha um recorte
            mais específico no dashboard (Q4-2024, 2024, set/24, etc.) para gerar o comentário.
          </div>
        </div>
      )}

      {/* KPIs */}
      {indicesComp && (
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-sm border border-[#29483F] bg-[#10221C] p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">
              Receita Líquida
            </div>
            <div
              className="mt-1.5 font-serif text-[24px] font-light text-[#F7FBF8]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {fmtBRLk(metricasAtual.receitaLiq)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px]">
              {variacaoPct >= 0 ? (
                <TrendingUp className="h-2.5 w-2.5 text-[#00B884]" strokeWidth={2} />
              ) : (
                <TrendingDown className="h-2.5 w-2.5 text-[#FF6F91]" strokeWidth={2} />
              )}
              <span style={{ color: variacaoPct >= 0 ? "#00B884" : "#FF6F91" }}>
                {variacaoPct.toFixed(1)}% vs anterior
              </span>
            </div>
          </div>

          <div className="rounded-sm border border-[#29483F] bg-[#10221C] p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">
              % Margem de Contribuição
            </div>
            <div
              className="mt-1.5 font-serif text-[24px] font-light text-[#F7FBF8]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {(metricasAtual.mcPct * 100).toFixed(1)}%
            </div>
            <div
              className="mt-1 text-[10px]"
              style={{ color: variacaoMC >= 0 ? "#00B884" : "#FF6F91" }}
            >
              {variacaoMC >= 0 ? "+" : ""}
              {variacaoMC.toFixed(2)} p.p.
            </div>
          </div>

          <div className="rounded-sm border border-[#29483F] bg-[#10221C] p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">EBITDA</div>
            <div
              className="mt-1.5 font-serif text-[24px] font-light"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                color: metricasAtual.ebitda >= 0 ? "#00B884" : "#FF6F91",
              }}
            >
              {fmtBRLk(metricasAtual.ebitda)}
            </div>
            <div className="mt-1 text-[10px] text-[#B5C9C0]">
              ant. {fmtBRLk(metricasComp.ebitda)}
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
        <div className="rounded-sm border border-[#29483F] bg-[#10221C] p-4">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#8AA79B]">
            Estilo
          </div>
          <div className="space-y-1">
            {ESTILOS.map((e) => (
              <button
                key={e.id}
                onClick={() => setEstilo(e.id)}
                className={`flex w-full items-center gap-2 rounded-sm border px-3 py-2 text-left text-[12px] transition ${
                  estilo === e.id
                    ? "border-transparent"
                    : "border-[#29483F] hover:border-[#467166]"
                }`}
                style={{
                  background: estilo === e.id ? `${e.accent}15` : "transparent",
                  borderColor: estilo === e.id ? e.accent : undefined,
                }}
              >
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: e.accent }} />
                <span className="text-[#F7FBF8]">{e.label}</span>
                <span className="ml-auto text-[10px] text-[#8AA79B]">
                  {e.descricao.split(".")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-[#29483F] bg-[#10221C] p-4">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#8AA79B]">
            Foco analítico
          </div>
          <div className="space-y-1">
            {FOCOS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFoco(f.id)}
                className={`w-full rounded-sm px-3 py-2 text-left text-[12px] transition ${
                  foco === f.id
                    ? "bg-[#132B23] text-[#F7FBF8]"
                    : "text-[#B5C9C0] hover:bg-[#132B23]/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGerar}
          disabled={!podeGerar}
          className="flex items-center justify-center gap-2 self-stretch rounded-sm border border-[#FF5EAD] bg-[#FF5EAD] px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#07130F] transition hover:bg-[#FF7BC0] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {carregando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              Gerando…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" strokeWidth={2} />
              Gerar comentário
            </>
          )}
        </button>
      </div>

      {/* Erro */}
      {erro && (
        <div className="mb-6 flex items-start gap-3 rounded-sm border border-[#FF6F91]/40 bg-[#3A1730]/40 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF6F91]" strokeWidth={1.75} />
          <div className="text-xs text-[#FFC2D6]">{erro}</div>
        </div>
      )}

      {/* Comentário */}
      <div className="rounded-sm border border-[#29483F] bg-[#10221C]">
        <div className="flex items-center justify-between border-b border-[#29483F] px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText
              className="h-4 w-4"
              style={{ color: estiloAtual.accent }}
              strokeWidth={1.75}
            />
            <div
              className="font-serif text-[15px] text-[#F7FBF8]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Comentário {estiloAtual.label.toLowerCase()} — {labelAtual}
            </div>
          </div>
          {comentario && (
            <button
              onClick={handleCopiar}
              className="flex items-center gap-1.5 rounded-sm border border-[#29483F] px-3 py-1.5 text-[11px] text-[#B5C9C0] transition hover:border-[#467166] hover:text-[#F7FBF8]"
            >
              {copiado ? (
                <>
                  <Check className="h-3 w-3 text-[#00B884]" strokeWidth={2} />
                  <span className="text-[#00B884]">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" strokeWidth={1.75} />
                  Copiar
                </>
              )}
            </button>
          )}
        </div>

        <div className="min-h-[280px] px-8 py-6">
          {!comentario && !carregando && !erro && (
            <div className="flex h-[240px] flex-col items-center justify-center text-center">
              <Sparkles className="mb-3 h-8 w-8 text-[#467166]" strokeWidth={1.25} />
              <div
                className="font-serif text-[18px] italic text-[#B5C9C0]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {indicesComp
                  ? "Selecione estilo e foco — depois clique em gerar."
                  : "Selecione um período mais específico no dashboard."}
              </div>
              {indicesComp && (
                <div className="mt-2 max-w-md text-[12px] text-[#8AA79B]">
                  A IA lê os números do recorte atual ({labelAtual}, canais{" "}
                  {selectedCanais.length === 4
                    ? "consolidados"
                    : selectedCanais.join(", ")}
                  ) e gera o comentário comparando com {labelComp}.
                </div>
              )}
            </div>
          )}

          {carregando && (
            <div className="flex h-[240px] flex-col items-center justify-center text-center">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#FF5EAD]" strokeWidth={1.5} />
              <div className="text-[13px] text-[#D8E5DF]">
                Analisando variações e redigindo…
              </div>
            </div>
          )}

          {comentario && (
            <div
              className="space-y-4 font-serif text-[16px] leading-[1.7] text-[#E8F0EC]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {comentario.split(/\n\n+/).map((p, i) => (
                <p key={i} className="first-letter:font-medium first-letter:text-[#FF5EAD]">
                  {p}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}