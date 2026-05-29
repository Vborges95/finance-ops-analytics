import React, { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  Loader2,
  Activity,
  ChevronRight,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

// ============================================================
// ARTIFACT 5.3 — MONITOR DE ALERTAS OPERACIONAIS
// Finance Ops & Analytics — Fase 5 de 7
// ============================================================

// Snapshot de KPIs operacionais do mês de referência vs baselines
// (extraído do modelo da Fase 3 — dez/24 vs média trimestre anterior)
const KPI_SNAPSHOT = {
  mes_referencia: "dez/24",
  indicadores: [
    {
      nome: "Margem de Contribuição — Marketplace",
      valor_atual: 0.362,
      baseline_3m: 0.378,
      unidade: "pct",
      direcao_boa: "up",
      contexto: "Comissões do marketplace subiram 0,8 p.p. no trimestre; devolução também acelerou.",
    },
    {
      nome: "% Devolução — Marketplace",
      valor_atual: 0.058,
      baseline_3m: 0.041,
      unidade: "pct",
      direcao_boa: "down",
      contexto: "Categoria perfumes lidera reclamações por avaria no transporte.",
    },
    {
      nome: "Margem de Contribuição — E-commerce",
      valor_atual: 0.459,
      baseline_3m: 0.464,
      unidade: "pct",
      direcao_boa: "up",
      contexto: "Pequena queda; CAC subiu 12% no período pós-Black Friday.",
    },
    {
      nome: "PMR consolidado",
      valor_atual: 43,
      baseline_3m: 39,
      unidade: "dias",
      direcao_boa: "down",
      contexto: "Aumento concentrado em franquia — relaxamento de prazo no Q4.",
    },
    {
      nome: "Estoque — dias de cobertura",
      valor_atual: 58,
      baseline_3m: 60,
      unidade: "dias",
      direcao_boa: "down",
      contexto: "Recuou levemente; categoria skincare ainda em risco de ruptura para jan/25.",
    },
    {
      nome: "Aging crítico (>90d) — % estoque",
      valor_atual: 0.087,
      baseline_3m: 0.062,
      unidade: "pct",
      direcao_boa: "down",
      contexto: "Linha de maquiagem natal acumulou em CD Guarulhos.",
    },
    {
      nome: "Receita Líquida consolidada",
      valor_atual: 194275,
      baseline_3m: 184786,
      unidade: "brl",
      direcao_boa: "up",
      contexto: "Acima da média trimestral, mas abaixo do recorde de nov/24 (R$ 248k).",
    },
    {
      nome: "EBITDA consolidado",
      valor_atual: 10133,
      baseline_3m: 7245,
      unidade: "brl",
      direcao_boa: "up",
      contexto: "Recuperando após resultados negativos em set/out por sazonalidade.",
    },
    {
      nome: "NCG em dias de receita",
      valor_atual: 54,
      baseline_3m: 48,
      unidade: "dias",
      direcao_boa: "down",
      contexto: "Subiu 6 dias em 3 meses — combinação de PMR mais longo e estoque sazonal.",
    },
  ],
};

// ============================================================
// CHAMADA À API ANTHROPIC
// ============================================================

const SYSTEM_PROMPT = `Você é um analista sênior de FP&A monitorando os KPIs operacionais e financeiros de uma operação beauty omnichannel brasileira.

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
}`;

async function escanearKPIs(snapshot) {
  const userPrompt = `Mês de referência: ${snapshot.mes_referencia}
Baseline de comparação: média móvel dos últimos 3 meses

Indicadores monitorados:
${JSON.stringify(snapshot.indicadores, null, 2)}

Para cada indicador onde "direcao_boa = up", valor menor que baseline é piora.
Para cada indicador onde "direcao_boa = down", valor maior que baseline é piora.

Gere os alertas priorizados.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await response.json();
  const text = data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("");
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return parsed.alertas;
}

// ============================================================
// UTILITÁRIOS
// ============================================================

const fmtVal = (v, unidade) => {
  if (unidade === "pct") return `${(v * 100).toFixed(1)}%`;
  if (unidade === "dias") return `${v} dias`;
  if (unidade === "brl") {
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
    return `R$ ${v}`;
  }
  return v;
};

const calcVarPct = (atual, base, unidade) => {
  if (unidade === "pct") return `${((atual - base) * 100).toFixed(1)} p.p.`;
  if (unidade === "dias") return `${atual - base > 0 ? "+" : ""}${atual - base}d`;
  return `${((atual / base - 1) * 100).toFixed(1)}%`;
};

const SEVERIDADE_STYLE = {
  critico: {
    color: "#FF6F91",
    bg: "#3A1730",
    border: "#FF6F91",
    label: "Crítico",
    icon: AlertTriangle,
  },
  atencao: {
    color: "#D6B06A",
    bg: "#3A2E1E",
    border: "#D6B06A",
    label: "Atenção",
    icon: AlertCircle,
  },
  observacao: {
    color: "#39D39F",
    bg: "#163C31",
    border: "#39D39F",
    label: "Observação",
    icon: Info,
  },
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function MonitorAlertas() {
  const [alertas, setAlertas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [escaneou, setEscaneou] = useState(false);

  const handleEscanear = async () => {
    setCarregando(true);
    setErro(null);
    setAlertas([]);
    try {
      const resultado = await escanearKPIs(KPI_SNAPSHOT);
      setAlertas(resultado);
      setEscaneou(true);
    } catch (e) {
      setErro("Falha no escaneamento. Tente novamente.");
      console.error(e);
    }
    setCarregando(false);
  };

  // Contagem por severidade
  const counts = alertas.reduce(
    (acc, a) => {
      acc[a.severidade] = (acc[a.severidade] || 0) + 1;
      return acc;
    },
    { critico: 0, atencao: 0, observacao: 0 }
  );

  return (
    <div
      className="min-h-screen text-[#F7FBF8]"
      style={{
        background: "#07130F",
        backgroundImage: `
          radial-gradient(ellipse 800px 400px at 0% 0%, rgba(10,93,58,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 600px 300px at 100% 100%, rgba(196,48,124,0.04) 0%, transparent 60%)
        `,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; }
        .font-mono, [class*="font-mono"] { font-family: 'JetBrains Mono', monospace !important; }
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-5 py-10 md:px-10">
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D6B06A] bg-[#D6B06A]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#07130F]" />
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#D6B06A]">
              IA Aplicada · Artifact 5.3
            </div>
          </div>
          <h1
            className="font-serif text-[44px] font-light leading-[0.95] text-[#F7FBF8] md:text-[52px]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <span className="block">Monitor de</span>
            <span className="block italic text-[#D6B06A]">alertas operacionais.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-[#B5C9C0]">
            Em vez de monitorar nove indicadores ao mesmo tempo, a IA escaneia o snapshot mensal e
            destaca apenas o que merece ação — com diagnóstico provável e próxima ação concreta.
          </p>
        </header>

        {/* PAINEL DE KPIs MONITORADOS */}
        <div className="mb-8 rounded-sm border border-[#29483F] bg-[#10221C] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8AA79B]">
                KPIs sendo monitorados
              </div>
              <div
                className="mt-1 font-serif text-[20px] text-[#F7FBF8]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Mês de referência — {KPI_SNAPSHOT.mes_referencia}
              </div>
            </div>
            <button
              onClick={handleEscanear}
              disabled={carregando}
              className="flex items-center gap-2 rounded-sm border border-[#D6B06A] bg-[#D6B06A] px-5 py-2.5 text-xs font-semibold text-[#07130F] transition hover:bg-[#F0C978] hover:shadow-[0_0_24px_rgba(214,176,106,0.35)] disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Escaneando…
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" strokeWidth={2} />
                  {escaneou ? "Re-escanear" : "Escanear indicadores"}
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {KPI_SNAPSHOT.indicadores.map((kpi, i) => {
              const piorou =
                (kpi.direcao_boa === "up" && kpi.valor_atual < kpi.baseline_3m) ||
                (kpi.direcao_boa === "down" && kpi.valor_atual > kpi.baseline_3m);
              return (
                <div
                  key={i}
                  className="rounded-sm border border-[#1C372F] bg-[#0D1B16] p-3"
                >
                  <div className="text-[10px] leading-tight text-[#B5C9C0]">{kpi.nome}</div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-[14px] text-[#F7FBF8]">
                      {fmtVal(kpi.valor_atual, kpi.unidade)}
                    </span>
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: piorou ? "#FF6F91" : "#39D39F" }}
                    >
                      {piorou ? "△" : "▽"} {calcVarPct(kpi.valor_atual, kpi.baseline_3m, kpi.unidade)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {erro && (
          <div className="mb-6 flex items-start gap-3 rounded-sm border border-[#FF6F91]/40 bg-[#3A1730]/40 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF6F91]" strokeWidth={1.75} />
            <div className="text-xs text-[#FFC2D6]">{erro}</div>
          </div>
        )}

        {/* RESUMO DOS ALERTAS */}
        {alertas.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            {["critico", "atencao", "observacao"].map((sev) => {
              const style = SEVERIDADE_STYLE[sev];
              const Icon = style.icon;
              return (
                <div
                  key={sev}
                  className="rounded-sm border p-4"
                  style={{ borderColor: style.border, background: `${style.bg}40` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: style.color }} strokeWidth={1.75} />
                      <span
                        className="text-[10px] font-medium uppercase tracking-[0.22em]"
                        style={{ color: style.color }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <div
                      className="font-serif text-[24px] font-light tabular-nums"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: style.color }}
                    >
                      {counts[sev]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LISTA DE ALERTAS */}
        {!escaneou && !carregando && (
          <div className="rounded-sm border border-dashed border-[#29483F] bg-[#10221C]/40 p-12 text-center">
            <Sparkles className="mx-auto mb-4 h-10 w-10 text-[#467166]" strokeWidth={1} />
            <div
              className="font-serif text-[20px] italic text-[#B5C9C0]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Pronto para escanear.
            </div>
            <div className="mt-2 text-[12px] text-[#8AA79B]">
              A IA vai ler os 9 indicadores acima e gerar alertas priorizados.
            </div>
          </div>
        )}

        {carregando && (
          <div className="rounded-sm border border-[#29483F] bg-[#10221C] p-12 text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#D6B06A]" strokeWidth={1.5} />
            <div className="text-[14px] text-[#D8E5DF]">
              Comparando contra baselines, identificando padrões…
            </div>
          </div>
        )}

        {alertas.length > 0 && (
          <div className="space-y-3">
            {alertas.map((a, i) => {
              const style = SEVERIDADE_STYLE[a.severidade];
              const Icon = style.icon;
              return (
                <div
                  key={i}
                  className="overflow-hidden rounded-sm border bg-[#10221C] transition hover:shadow-[0_20px_60px_-28px_rgba(0,0,0,0.5)]"
                  style={{ borderColor: `${style.border}40` }}
                >
                  <div className="flex">
                    <div
                      className="flex w-1 flex-shrink-0"
                      style={{ background: style.color }}
                    />
                    <div className="flex-1 p-5">
                      <div className="mb-3 flex items-center gap-3">
                        <Icon className="h-4 w-4" style={{ color: style.color }} strokeWidth={1.75} />
                        <span
                          className="rounded-sm px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.22em]"
                          style={{ background: style.bg, color: style.color }}
                        >
                          {style.label}
                        </span>
                        <span className="font-mono text-[10px] text-[#8AA79B]">#{i + 1}</span>
                      </div>

                      <h3
                        className="font-serif text-[20px] font-light leading-tight text-[#F7FBF8]"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        {a.titulo}
                      </h3>

                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div>
                          <div className="mb-1 text-[9px] font-medium uppercase tracking-[0.22em] text-[#8AA79B]">
                            Evidência
                          </div>
                          <div className="text-[12px] leading-relaxed text-[#D8E5DF]">{a.evidencia}</div>
                        </div>
                        <div>
                          <div className="mb-1 text-[9px] font-medium uppercase tracking-[0.22em] text-[#8AA79B]">
                            Diagnóstico provável
                          </div>
                          <div className="text-[12px] leading-relaxed text-[#D8E5DF]">{a.diagnostico}</div>
                        </div>
                        <div>
                          <div
                            className="mb-1 flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.22em]"
                            style={{ color: style.color }}
                          >
                            <ChevronRight className="h-3 w-3" strokeWidth={2} />
                            Próxima ação
                          </div>
                          <div className="text-[12px] font-medium leading-relaxed text-[#F7FBF8]">
                            {a.acao}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 border-t border-[#29483F] pt-6 text-[11px] text-[#8AA79B]">
          <div
            className="font-serif text-[14px] italic text-[#D8E5DF]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Finance Ops & Analytics — Artifact 5.3 / 5
          </div>
          <div className="mt-1">
            Alertas priorizados via Claude Sonnet 4 · baseline = média móvel 3 meses · case de portfólio
          </div>
        </div>
      </div>
    </div>
  );
}
