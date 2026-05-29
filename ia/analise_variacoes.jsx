import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Loader2,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
} from "lucide-react";

// ============================================================
// ARTIFACT 5.5 — ANÁLISE DE VARIAÇÕES ASSISTIDA (BÔNUS)
// Finance Ops & Analytics — Fase 5 de 7
//
// O que faz: dado dois períodos comparáveis (ex: Q4-2024 vs Q4-2023),
// a IA decompõe a variação total em drivers e gera perguntas-piloto
// para o controller investigar.
// ============================================================

// Dataset simplificado: receita líquida por canal x categoria, dois períodos
const PERIODOS = [
  {
    id: "Q4-2023",
    label: "Q4 / 2023",
    dados: {
      "E-commerce": { Skincare: 95200, Maquiagem: 78400, Perfumes: 42100, Haircare: 28300 },
      "Marketplace": { Skincare: 62100, Maquiagem: 71800, Perfumes: 28600, Haircare: 18900 },
      "Franquia": { Skincare: 38400, Maquiagem: 32100, Perfumes: 21500, Haircare: 14200 },
      "Loja Própria": { Skincare: 41200, Maquiagem: 28900, Perfumes: 24800, Haircare: 12400 },
    },
    volume_pedidos: 18450,
    ticket_medio: 32.6,
  },
  {
    id: "Q4-2024",
    label: "Q4 / 2024",
    dados: {
      "E-commerce": { Skincare: 118400, Maquiagem: 82100, Perfumes: 54300, Haircare: 27800 },
      "Marketplace": { Skincare: 71200, Maquiagem: 68900, Perfumes: 41200, Haircare: 18400 },
      "Franquia": { Skincare: 42800, Maquiagem: 33100, Perfumes: 28400, Haircare: 14800 },
      "Loja Própria": { Skincare: 45200, Maquiagem: 29400, Perfumes: 27200, Haircare: 13100 },
    },
    volume_pedidos: 21380,
    ticket_medio: 35.2,
  },
];

// ============================================================
// CÁLCULO DE VARIAÇÕES (determinístico — antes da IA)
// ============================================================

function calcularDrivers(base, comp) {
  const canais = Object.keys(base.dados);
  const categorias = Object.keys(base.dados[canais[0]]);

  const por_celula = [];
  let total_base = 0;
  let total_comp = 0;

  canais.forEach((canal) => {
    categorias.forEach((cat) => {
      const vBase = base.dados[canal][cat];
      const vComp = comp.dados[canal][cat];
      const delta = vComp - vBase;
      total_base += vBase;
      total_comp += vComp;
      por_celula.push({
        canal,
        categoria: cat,
        base: vBase,
        comp: vComp,
        delta,
        delta_pct: vBase ? delta / vBase : 0,
      });
    });
  });

  // Top movers absolutos
  por_celula.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const top_movers = por_celula.slice(0, 6);

  // Drivers por canal
  const por_canal = canais.map((canal) => {
    const base_c = categorias.reduce((s, cat) => s + base.dados[canal][cat], 0);
    const comp_c = categorias.reduce((s, cat) => s + comp.dados[canal][cat], 0);
    return {
      canal,
      base: base_c,
      comp: comp_c,
      delta: comp_c - base_c,
      delta_pct: (comp_c - base_c) / base_c,
    };
  });

  // Drivers por categoria
  const por_categoria = categorias.map((cat) => {
    const base_c = canais.reduce((s, canal) => s + base.dados[canal][cat], 0);
    const comp_c = canais.reduce((s, canal) => s + comp.dados[canal][cat], 0);
    return {
      categoria: cat,
      base: base_c,
      comp: comp_c,
      delta: comp_c - base_c,
      delta_pct: (comp_c - base_c) / base_c,
    };
  });

  // Decomposição volume x ticket (Σ q*p)
  const delta_total = total_comp - total_base;
  const efeito_volume = (comp.volume_pedidos - base.volume_pedidos) * base.ticket_medio;
  const efeito_ticket = comp.volume_pedidos * (comp.ticket_medio - base.ticket_medio);
  // resíduo de mix (diferença entre soma das células e Σ q*p) — simplificado
  const efeito_mix = delta_total - efeito_volume - efeito_ticket;

  return {
    total_base,
    total_comp,
    delta_total,
    delta_total_pct: delta_total / total_base,
    por_canal,
    por_categoria,
    top_movers,
    decomposicao: {
      volume: efeito_volume,
      ticket: efeito_ticket,
      mix: efeito_mix,
    },
  };
}

// ============================================================
// CHAMADA À API ANTHROPIC
// ============================================================

const SYSTEM_PROMPT = `Você é um Head de FP&A analisando variações de receita de uma operação beauty omnichannel brasileira.

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
}`;

async function analisarComIA(drivers, base, comp) {
  const userPrompt = `Comparando: ${base.label} (base) vs ${comp.label} (atual)

VOLUMES E TICKET
- ${base.label}: ${base.volume_pedidos.toLocaleString("pt-BR")} pedidos × R$ ${base.ticket_medio.toFixed(2)} = R$ ${(base.volume_pedidos * base.ticket_medio).toLocaleString("pt-BR")}
- ${comp.label}: ${comp.volume_pedidos.toLocaleString("pt-BR")} pedidos × R$ ${comp.ticket_medio.toFixed(2)} = R$ ${(comp.volume_pedidos * comp.ticket_medio).toLocaleString("pt-BR")}

VARIAÇÃO TOTAL DE RECEITA
- De R$ ${drivers.total_base.toLocaleString("pt-BR")} para R$ ${drivers.total_comp.toLocaleString("pt-BR")}
- Delta absoluto: R$ ${drivers.delta_total.toLocaleString("pt-BR")} (${(drivers.delta_total_pct * 100).toFixed(1)}%)

DECOMPOSIÇÃO VOLUME × TICKET × MIX
- Efeito Volume: R$ ${drivers.decomposicao.volume.toLocaleString("pt-BR")}
- Efeito Ticket: R$ ${drivers.decomposicao.ticket.toLocaleString("pt-BR")}
- Efeito Mix (resíduo): R$ ${drivers.decomposicao.mix.toLocaleString("pt-BR")}

DRIVERS POR CANAL
${drivers.por_canal.map((c) => `- ${c.canal}: R$ ${c.base.toLocaleString("pt-BR")} → R$ ${c.comp.toLocaleString("pt-BR")} (Δ ${(c.delta_pct * 100).toFixed(1)}%)`).join("\n")}

DRIVERS POR CATEGORIA
${drivers.por_categoria.map((c) => `- ${c.categoria}: R$ ${c.base.toLocaleString("pt-BR")} → R$ ${c.comp.toLocaleString("pt-BR")} (Δ ${(c.delta_pct * 100).toFixed(1)}%)`).join("\n")}

TOP 6 CÉLULAS QUE MAIS MOVERAM (canal × categoria)
${drivers.top_movers.map((m) => `- ${m.canal} / ${m.categoria}: Δ R$ ${m.delta.toLocaleString("pt-BR")} (${(m.delta_pct * 100).toFixed(1)}%)`).join("\n")}

Gere narrativa, perguntas de investigação e riscos.`;

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
  return JSON.parse(cleaned);
}

// ============================================================
// UTILITÁRIOS
// ============================================================

const fmtBRLk = (v) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
};

const CANAL_COLORS = {
  "E-commerce": "#00B884",
  Marketplace: "#FF5EAD",
  Franquia: "#D6B06A",
  "Loja Própria": "#39D39F",
};

const CAT_COLORS = {
  Skincare: "#00B884",
  Maquiagem: "#FF5EAD",
  Perfumes: "#D6B06A",
  Haircare: "#F0C978",
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function AnaliseVariacoes() {
  const [analise, setAnalise] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const drivers = useMemo(() => calcularDrivers(PERIODOS[0], PERIODOS[1]), []);

  const handleAnalisar = async () => {
    setCarregando(true);
    setErro(null);
    setAnalise(null);
    try {
      const r = await analisarComIA(drivers, PERIODOS[0], PERIODOS[1]);
      setAnalise(r);
    } catch (e) {
      setErro("Falha na análise. Tente novamente.");
      console.error(e);
    }
    setCarregando(false);
  };

  // Maior valor absoluto na decomposição para escala visual
  const maxDecomp = Math.max(
    Math.abs(drivers.decomposicao.volume),
    Math.abs(drivers.decomposicao.ticket),
    Math.abs(drivers.decomposicao.mix)
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
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#00B884] bg-[#00B884]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#FF5EAD]" />
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#00B884]">
              IA Aplicada · Artifact 5.5 · Bônus
            </div>
          </div>
          <h1
            className="font-serif text-[44px] font-light leading-[0.95] text-[#F7FBF8] md:text-[52px]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <span className="block">Variar é fácil.</span>
            <span className="block italic text-[#FF5EAD]">Explicar a variação, não.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-[#B5C9C0]">
            A matemática decompõe a variação em volume, ticket e mix. A IA agrega o que falta — a história
            por trás dos números e as perguntas que o controller precisa fazer aos times.
          </p>
        </header>

        {/* CABEÇALHO DA COMPARAÇÃO */}
        <div className="mb-8 flex items-center justify-between gap-6 rounded-sm border border-[#29483F] bg-[#10221C] p-6">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">Período base</div>
              <div
                className="mt-1 font-serif text-[26px] font-light text-[#F7FBF8]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {PERIODOS[0].label}
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#B5C9C0]">
                {fmtBRLk(drivers.total_base)}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#D6B06A]" strokeWidth={1.5} />
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">Período comparado</div>
              <div
                className="mt-1 font-serif text-[26px] font-light text-[#F7FBF8]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {PERIODOS[1].label}
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#B5C9C0]">
                {fmtBRLk(drivers.total_comp)}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">Variação total</div>
            <div
              className="mt-1 font-serif text-[32px] font-light"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                color: drivers.delta_total >= 0 ? "#00B884" : "#FF6F91",
              }}
            >
              {drivers.delta_total >= 0 ? "+" : ""}
              {fmtBRLk(drivers.delta_total)}
            </div>
            <div
              className="mt-1 font-mono text-[12px]"
              style={{ color: drivers.delta_total >= 0 ? "#00B884" : "#FF6F91" }}
            >
              {(drivers.delta_total_pct * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* DECOMPOSIÇÃO — WATERFALL CONCEITUAL */}
        <div className="mb-8 rounded-sm border border-[#29483F] bg-[#10221C] p-6">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-[#D6B06A]">
            Decomposição da variação
          </div>
          <h2
            className="mb-6 font-serif text-[24px] font-light text-[#F7FBF8]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Volume × Ticket × Mix
          </h2>

          <div className="space-y-4">
            {[
              { label: "Efeito Volume", valor: drivers.decomposicao.volume, color: "#00B884", desc: "Δ volume × ticket base" },
              { label: "Efeito Ticket", valor: drivers.decomposicao.ticket, color: "#FF5EAD", desc: "Volume atual × Δ ticket" },
              { label: "Efeito Mix", valor: drivers.decomposicao.mix, color: "#D6B06A", desc: "Resíduo de composição canal × categoria" },
            ].map((d) => {
              const pct = Math.abs(d.valor) / maxDecomp;
              const isPositive = d.valor >= 0;
              return (
                <div key={d.label} className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-3">
                    <div className="text-[13px] font-medium text-[#F7FBF8]">{d.label}</div>
                    <div className="mt-0.5 text-[10px] text-[#8AA79B]">{d.desc}</div>
                  </div>
                  <div className="col-span-7 flex items-center">
                    <div className="relative h-7 w-full overflow-hidden rounded-sm bg-[#0D1B16]">
                      <div
                        className="absolute h-full transition-all"
                        style={{
                          background: d.color,
                          width: `${pct * 100}%`,
                          left: isPositive ? "50%" : `${50 - pct * 50}%`,
                        }}
                      />
                      <div className="absolute left-1/2 top-0 h-full w-px bg-[#467166]" />
                    </div>
                  </div>
                  <div
                    className="col-span-2 text-right font-mono text-[14px] tabular-nums"
                    style={{ color: d.color }}
                  >
                    {isPositive ? "+" : ""}
                    {fmtBRLk(d.valor)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DRIVERS POR CANAL E POR CATEGORIA */}
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-sm border border-[#29483F] bg-[#10221C] p-6">
            <div className="mb-4">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8AA79B]">
                Por canal
              </div>
              <h3
                className="mt-1 font-serif text-[18px] text-[#F7FBF8]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Variação absoluta
              </h3>
            </div>
            <div className="space-y-3">
              {drivers.por_canal
                .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                .map((c) => (
                  <div key={c.canal} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: CANAL_COLORS[c.canal] }} />
                      <span className="text-[12px] text-[#D8E5DF]">{c.canal}</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span
                        className="font-mono text-[13px] tabular-nums"
                        style={{ color: c.delta >= 0 ? "#00B884" : "#FF6F91" }}
                      >
                        {c.delta >= 0 ? "+" : ""}
                        {fmtBRLk(c.delta)}
                      </span>
                      <span
                        className="font-mono text-[10px] tabular-nums"
                        style={{ color: c.delta >= 0 ? "#00B884" : "#FF6F91" }}
                      >
                        ({(c.delta_pct * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-sm border border-[#29483F] bg-[#10221C] p-6">
            <div className="mb-4">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8AA79B]">
                Por categoria
              </div>
              <h3
                className="mt-1 font-serif text-[18px] text-[#F7FBF8]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Variação absoluta
              </h3>
            </div>
            <div className="space-y-3">
              {drivers.por_categoria
                .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                .map((c) => (
                  <div key={c.categoria} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ background: CAT_COLORS[c.categoria] }}
                      />
                      <span className="text-[12px] text-[#D8E5DF]">{c.categoria}</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span
                        className="font-mono text-[13px] tabular-nums"
                        style={{ color: c.delta >= 0 ? "#00B884" : "#FF6F91" }}
                      >
                        {c.delta >= 0 ? "+" : ""}
                        {fmtBRLk(c.delta)}
                      </span>
                      <span
                        className="font-mono text-[10px] tabular-nums"
                        style={{ color: c.delta >= 0 ? "#00B884" : "#FF6F91" }}
                      >
                        ({(c.delta_pct * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* BOTÃO DE ANÁLISE */}
        {!analise && (
          <div className="mb-8 flex justify-center">
            <button
              onClick={handleAnalisar}
              disabled={carregando}
              className="flex items-center gap-2 rounded-sm border border-[#FF5EAD] bg-[#FF5EAD] px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#07130F] transition hover:bg-[#FF7BC0] hover:shadow-[0_0_28px_rgba(255,94,173,0.35)] disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Interpretando os drivers…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" strokeWidth={2} />
                  Pedir interpretação à IA
                </>
              )}
            </button>
          </div>
        )}

        {erro && (
          <div className="mb-6 flex items-start gap-3 rounded-sm border border-[#FF6F91]/40 bg-[#3A1730]/40 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF6F91]" strokeWidth={1.75} />
            <div className="text-xs text-[#FFC2D6]">{erro}</div>
          </div>
        )}

        {/* SAÍDA DA IA */}
        {analise && (
          <div className="space-y-6">
            {/* NARRATIVA */}
            <div className="rounded-sm border border-[#FF5EAD]/30 bg-gradient-to-br from-[#3A1730]/30 via-[#10221C] to-[#10221C] p-7">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px w-12 bg-[#FF5EAD]" />
                <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#FF5EAD]">
                  Narrativa
                </div>
              </div>
              <div
                className="space-y-4 font-serif text-[17px] leading-[1.7] text-[#E8F0EC]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {analise.narrativa.split(/\n\n+/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            {/* PERGUNTAS DE INVESTIGAÇÃO */}
            <div className="rounded-sm border border-[#29483F] bg-[#10221C] p-6">
              <div className="mb-5 flex items-center gap-3">
                <HelpCircle className="h-4 w-4 text-[#D6B06A]" strokeWidth={1.75} />
                <h3
                  className="font-serif text-[22px] font-light text-[#F7FBF8]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Perguntas para investigar
                </h3>
              </div>

              <div className="space-y-3">
                {analise.perguntas_investigacao.map((q, i) => (
                  <div
                    key={i}
                    className="rounded-sm border-l-2 border-[#D6B06A] bg-[#132B23]/40 p-4 pl-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="font-mono text-[10px] text-[#8AA79B]">0{i + 1}</div>
                      <div className="flex-1">
                        <div className="text-[14px] font-medium leading-snug text-[#F7FBF8]">
                          {q.pergunta}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
                          <span className="rounded-sm bg-[#3A2E1E] px-2 py-0.5 text-[#D6B06A]">
                            → {q.para_quem}
                          </span>
                          <span className="text-[#B5C9C0]">
                            <span className="text-[#8AA79B]">hipótese: </span>
                            <em>{q.hipotese_a_validar}</em>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RISCOS */}
            <div className="rounded-sm border border-[#FF6F91]/30 bg-[#10221C] p-6">
              <div className="mb-5 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-[#FF6F91]" strokeWidth={1.75} />
                <h3
                  className="font-serif text-[22px] font-light text-[#F7FBF8]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Sinais a monitorar
                </h3>
              </div>
              <div className="space-y-2">
                {analise.riscos.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-sm bg-[#3A1730]/20 p-3"
                  >
                    <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[#FF6F91]" />
                    <div className="text-[12px] leading-relaxed text-[#D8E5DF]">{r}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 border-t border-[#29483F] pt-6 text-[11px] text-[#8AA79B]">
          <div
            className="font-serif text-[14px] italic text-[#D8E5DF]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Finance Ops & Analytics — Artifact 5.5 / 5 (bônus)
          </div>
          <div className="mt-1">
            Decomposição quantitativa + interpretação via Claude Sonnet 4 · case de portfólio
          </div>
        </div>
      </div>
    </div>
  );
}
