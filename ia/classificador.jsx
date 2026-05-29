import React, { useState } from "react";
import {
  Sparkles,
  Check,
  X,
  Edit3,
  ChevronDown,
  ChevronUp,
  Loader2,
  Tag,
  Building2,
  AlertCircle,
} from "lucide-react";

// ============================================================
// ARTIFACT 5.1 — CLASSIFICADOR INTELIGENTE DE LANÇAMENTOS
// Finance Ops & Analytics — Fase 5 de 7
// ============================================================

const CATEGORIAS = [
  "Marketing Digital",
  "Marketing Tradicional",
  "Logística e Frete",
  "Pessoal CLT",
  "Pessoal PJ / Terceiros",
  "Aluguel e Ocupação",
  "Tecnologia e Software",
  "Comissões de Canal",
  "Embalagens",
  "Matéria-Prima",
  "Serviços Profissionais",
  "Tributos e Taxas",
  "Outras Despesas Operacionais",
];

const CENTROS_CUSTO = [
  "Comercial — E-commerce",
  "Comercial — Marketplace",
  "Comercial — Franquia",
  "Comercial — Loja Própria",
  "Marketing",
  "Logística & Supply",
  "Administrativo",
  "Tecnologia",
  "Operações",
];

// Mock de lançamentos com descrição livre — típico do extrato ERP/contas a pagar
const MOCK_LANCAMENTOS = [
  {
    id: 1,
    data: "2024-11-03",
    descricao: "PGTO META PLATFORMS - CAMPANHA BLACK FRIDAY E-COM",
    valor: -18450.0,
    fornecedor: "Meta Platforms Ireland",
  },
  {
    id: 2,
    data: "2024-11-05",
    descricao: "JADLOG - COLETAS NOV/24 SP+RJ CONSOLIDADO",
    valor: -12340.55,
    fornecedor: "Jadlog Logística",
  },
  {
    id: 3,
    data: "2024-11-07",
    descricao: "FOLHA NOV/24 - 18 COLABORADORES CLT",
    valor: -89720.4,
    fornecedor: "Folha de Pagamento",
  },
  {
    id: 4,
    data: "2024-11-10",
    descricao: "ALUGUEL CD GUARULHOS - REF 11/2024 + IPTU",
    valor: -24800.0,
    fornecedor: "Imobiliária Vector",
  },
  {
    id: 5,
    data: "2024-11-12",
    descricao: "NF 4521 - VIDROS E TAMPAS LINHA SKINCARE 5K UND",
    valor: -34210.8,
    fornecedor: "Embalagens Premium SA",
  },
  {
    id: 6,
    data: "2024-11-14",
    descricao: "MERCADO LIVRE - COMISSÃO + FRETE OUT/24",
    valor: -22106.33,
    fornecedor: "Mercado Livre",
  },
  {
    id: 7,
    data: "2024-11-18",
    descricao: "AWS - INFRAESTRUTURA E-COM + DATA WAREHOUSE",
    valor: -7820.5,
    fornecedor: "Amazon Web Services",
  },
  {
    id: 8,
    data: "2024-11-20",
    descricao: "HONORÁRIOS CONTÁBEIS NOV/24 + DEFESA AUTO INFR.",
    valor: -8900.0,
    fornecedor: "Contabilis Assessoria",
  },
  {
    id: 9,
    data: "2024-11-22",
    descricao: "PGTO INFLUENCER @luciacosta - CAMP. PERFUMES",
    valor: -6500.0,
    fornecedor: "Lucia Costa MEI",
  },
  {
    id: 10,
    data: "2024-11-25",
    descricao: "DARF IRPJ + CSLL APUR. OUT/24",
    valor: -14320.0,
    fornecedor: "Receita Federal",
  },
];

// ============================================================
// CHAMADA À API ANTHROPIC
// ============================================================

const SYSTEM_PROMPT = `Você é um assistente especialista em classificação contábil-gerencial de lançamentos financeiros para uma operação de beauty omnichannel brasileira.

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
}`;

async function classificarComIA(lancamentos) {
  const userPrompt = `Categorias disponíveis: ${JSON.stringify(CATEGORIAS)}

Centros de custo disponíveis: ${JSON.stringify(CENTROS_CUSTO)}

Lançamentos a classificar:
${JSON.stringify(lancamentos.map((l) => ({ id: l.id, descricao: l.descricao, valor: l.valor, fornecedor: l.fornecedor })), null, 2)}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
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
  return parsed.resultados;
}

// ============================================================
// UTILITÁRIOS
// ============================================================

const fmtBRL = (v) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

const fmtDate = (d) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y.slice(2)}`;
};

const CONFIANCA_STYLE = {
  alta: { color: "#00B884", label: "Alta confiança", bg: "#163C31" },
  media: { color: "#D6B06A", label: "Confiança média", bg: "#3A2E1E" },
  baixa: { color: "#FF6F91", label: "Baixa confiança", bg: "#3A1730" },
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function ClassificadorInteligente() {
  const [lancamentos] = useState(MOCK_LANCAMENTOS);
  const [sugestoes, setSugestoes] = useState({});
  const [statusLinha, setStatusLinha] = useState({}); // { id: 'aceito' | 'rejeitado' | 'editado' }
  const [edicoes, setEdicoes] = useState({}); // { id: { categoria, centro_custo } }
  const [linhaExpandida, setLinhaExpandida] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleClassificar = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resultados = await classificarComIA(lancamentos);
      const mapeado = {};
      resultados.forEach((r) => {
        mapeado[r.id] = r;
      });
      setSugestoes(mapeado);
    } catch (e) {
      setErro("Não foi possível classificar. Tente novamente em alguns segundos.");
      console.error(e);
    }
    setCarregando(false);
  };

  const handleAceitar = (id) => {
    setStatusLinha({ ...statusLinha, [id]: "aceito" });
  };
  const handleRejeitar = (id) => {
    setStatusLinha({ ...statusLinha, [id]: "rejeitado" });
  };
  const handleEditar = (id, campo, valor) => {
    setEdicoes({ ...edicoes, [id]: { ...edicoes[id], [campo]: valor } });
    setStatusLinha({ ...statusLinha, [id]: "editado" });
  };

  const totalClassificados = Object.values(statusLinha).filter(
    (s) => s === "aceito" || s === "editado"
  ).length;
  const totalSugeridos = Object.keys(sugestoes).length;

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
        {/* HEADER */}
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#00B884] bg-[#00B884]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#D6B06A]" />
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#00B884]">
              IA Aplicada · Artifact 5.1
            </div>
          </div>
          <h1
            className="font-serif text-[44px] font-light leading-[0.95] text-[#F7FBF8] md:text-[52px]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <span className="block">Classificador</span>
            <span className="block italic text-[#FF5EAD]">inteligente de lançamentos.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-[#B5C9C0]">
            Lançamentos chegam ao ERP em formato livre. A IA sugere categoria contábil e centro de custo,
            explica o raciocínio e deixa o controller decidir — manter, ajustar ou descartar.
          </p>
        </header>

        {/* BARRA DE AÇÃO */}
        <div className="sticky top-0 z-10 -mx-5 mb-8 border-y border-[#467166]/60 bg-[#07130F]/95 px-5 py-4 backdrop-blur-md md:-mx-10 md:px-10">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">Lançamentos</div>
                <div className="mt-1 font-mono text-base text-[#F7FBF8]">{lancamentos.length}</div>
              </div>
              <div className="h-8 w-px bg-[#467166]" />
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">Classificados pela IA</div>
                <div className="mt-1 font-mono text-base text-[#00B884]">{totalSugeridos}</div>
              </div>
              <div className="h-8 w-px bg-[#467166]" />
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">Confirmados pelo controller</div>
                <div className="mt-1 font-mono text-base text-[#FF5EAD]">{totalClassificados}</div>
              </div>
            </div>

            <button
              onClick={handleClassificar}
              disabled={carregando}
              className="group flex items-center gap-2 rounded-sm border border-[#00B884] bg-[#00B884] px-5 py-2.5 text-xs font-semibold text-[#07130F] transition-all hover:bg-[#39D39F] hover:shadow-[0_0_24px_rgba(0,184,132,0.35)] disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  <span>Analisando lançamentos…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" strokeWidth={2} />
                  <span>Classificar com IA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {erro && (
          <div className="mb-6 flex items-start gap-3 rounded-sm border border-[#FF6F91]/40 bg-[#3A1730]/40 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF6F91]" strokeWidth={1.75} />
            <div className="text-xs text-[#FFC2D6]">{erro}</div>
          </div>
        )}

        {/* TABELA EDITORIAL */}
        <div className="overflow-hidden rounded-sm border border-[#29483F] bg-[#10221C]">
          <div className="border-b border-[#29483F] bg-[#132B23] px-5 py-3">
            <div className="grid grid-cols-12 gap-4 text-[10px] font-medium uppercase tracking-[0.22em] text-[#8AA79B]">
              <div className="col-span-1">Data</div>
              <div className="col-span-5">Descrição</div>
              <div className="col-span-2 text-right">Valor</div>
              <div className="col-span-3">Sugestão IA</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>
          </div>

          {lancamentos.map((lanc) => {
            const sug = sugestoes[lanc.id];
            const status = statusLinha[lanc.id];
            const edit = edicoes[lanc.id] || {};
            const categoriaAtual = edit.categoria ?? sug?.categoria;
            const ccAtual = edit.centro_custo ?? sug?.centro_custo;
            const conf = sug ? CONFIANCA_STYLE[sug.confianca] : null;
            const expandida = linhaExpandida === lanc.id;
            const isRejeitada = status === "rejeitado";

            return (
              <div
                key={lanc.id}
                className={`border-b border-[#1C372F] transition-colors ${
                  isRejeitada ? "opacity-40" : "hover:bg-[#132B23]/40"
                }`}
              >
                <div className="grid grid-cols-12 items-center gap-4 px-5 py-4">
                  <div className="col-span-1 font-mono text-[11px] text-[#8AA79B]">{fmtDate(lanc.data)}</div>

                  <div className="col-span-5">
                    <div className="text-[13px] text-[#F7FBF8]">{lanc.descricao}</div>
                    <div className="mt-0.5 text-[11px] text-[#8AA79B]">{lanc.fornecedor}</div>
                  </div>

                  <div className="col-span-2 text-right">
                    <div className="font-mono text-[13px] tabular-nums text-[#FF6F91]">
                      {fmtBRL(lanc.valor)}
                    </div>
                  </div>

                  <div className="col-span-3">
                    {sug ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 text-[#00B884]" strokeWidth={1.75} />
                          <span className="text-[11px] text-[#D8E5DF]">{categoriaAtual}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-[#D6B06A]" strokeWidth={1.75} />
                          <span className="text-[10px] text-[#B5C9C0]">{ccAtual}</span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: conf.color }}
                          />
                          <span className="text-[9px] uppercase tracking-[0.18em]" style={{ color: conf.color }}>
                            {conf.label}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] italic text-[#8AA79B]">Aguardando IA…</div>
                    )}
                  </div>

                  <div className="col-span-1 flex items-center justify-end gap-1">
                    {sug && !isRejeitada && (
                      <>
                        <button
                          onClick={() => handleAceitar(lanc.id)}
                          className={`rounded-sm p-1.5 transition ${
                            status === "aceito"
                              ? "bg-[#00B884] text-[#07130F]"
                              : "border border-[#29483F] text-[#8AA79B] hover:border-[#00B884] hover:text-[#00B884]"
                          }`}
                          title="Aceitar sugestão"
                        >
                          <Check className="h-3 w-3" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => setLinhaExpandida(expandida ? null : lanc.id)}
                          className={`rounded-sm border p-1.5 transition ${
                            expandida
                              ? "border-[#FF5EAD] text-[#FF5EAD]"
                              : "border-[#29483F] text-[#8AA79B] hover:border-[#FF5EAD] hover:text-[#FF5EAD]"
                          }`}
                          title="Editar / ver justificativa"
                        >
                          <Edit3 className="h-3 w-3" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleRejeitar(lanc.id)}
                          className="rounded-sm border border-[#29483F] p-1.5 text-[#8AA79B] transition hover:border-[#FF6F91] hover:text-[#FF6F91]"
                          title="Rejeitar"
                        >
                          <X className="h-3 w-3" strokeWidth={2} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* LINHA EXPANDIDA — JUSTIFICATIVA + EDIÇÃO */}
                {expandida && sug && (
                  <div className="border-t border-[#1C372F] bg-[#0D1B16]/60 px-5 py-4">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#D6B06A]">
                          Raciocínio da IA
                        </div>
                        <p className="text-[12px] italic leading-relaxed text-[#D8E5DF]">
                          "{sug.justificativa}"
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.22em] text-[#8AA79B]">
                            Categoria
                          </label>
                          <select
                            value={categoriaAtual}
                            onChange={(e) => handleEditar(lanc.id, "categoria", e.target.value)}
                            className="w-full rounded-sm border border-[#29483F] bg-[#10221C] px-2.5 py-1.5 font-mono text-[11px] text-[#F7FBF8] outline-none focus:border-[#00B884]"
                          >
                            {CATEGORIAS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.22em] text-[#8AA79B]">
                            Centro de custo
                          </label>
                          <select
                            value={ccAtual}
                            onChange={(e) => handleEditar(lanc.id, "centro_custo", e.target.value)}
                            className="w-full rounded-sm border border-[#29483F] bg-[#10221C] px-2.5 py-1.5 font-mono text-[11px] text-[#F7FBF8] outline-none focus:border-[#FF5EAD]"
                          >
                            {CENTROS_CUSTO.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RODAPÉ EDITORIAL */}
        <div className="mt-10 border-t border-[#29483F] pt-6 text-[11px] text-[#8AA79B]">
          <div className="font-serif text-[14px] italic text-[#D8E5DF]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Finance Ops & Analytics — Artifact 5.1 / 5
          </div>
          <div className="mt-1">
            Classificação assistida via Claude Sonnet 4 · dados simulados · case de portfólio
          </div>
        </div>
      </div>
    </div>
  );
}
