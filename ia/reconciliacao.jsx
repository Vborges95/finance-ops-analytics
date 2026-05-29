import React, { useState } from "react";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  Copy,
  Calendar,
  Tag,
  Hash,
  FileWarning,
} from "lucide-react";

// ============================================================
// ARTIFACT 5.4 — RECONCILIAÇÃO ASSISTIDA (GATEWAY vs ERP)
// Finance Ops & Analytics — Fase 5 de 7
// ============================================================

// Mock de extratos: gateway (Stone) vs ERP — mesma janela, mesmas transações
// com divergências plantadas para o exercício
const EXTRATO_GATEWAY = [
  { id: "GW001", data: "2024-12-02", pedido: "PED-89421", valor_bruto: 289.9, taxa: 8.7, valor_liquido: 281.2 },
  { id: "GW002", data: "2024-12-02", pedido: "PED-89422", valor_bruto: 154.5, taxa: 4.64, valor_liquido: 149.86 },
  { id: "GW003", data: "2024-12-03", pedido: "PED-89423", valor_bruto: 432.0, taxa: 12.96, valor_liquido: 419.04 },
  { id: "GW004", data: "2024-12-03", pedido: "PED-89424", valor_bruto: 215.8, taxa: 6.47, valor_liquido: 209.33 },
  { id: "GW005", data: "2024-12-04", pedido: "PED-89425", valor_bruto: 678.4, taxa: 27.14, valor_liquido: 651.26 }, // taxa errada (deveria ser 3%)
  { id: "GW006", data: "2024-12-04", pedido: "PED-89426", valor_bruto: 198.0, taxa: 5.94, valor_liquido: 192.06 },
  { id: "GW007", data: "2024-12-05", pedido: "PED-89427", valor_bruto: 510.3, taxa: 15.31, valor_liquido: 494.99 },
  { id: "GW008", data: "2024-12-05", pedido: "PED-89428", valor_bruto: 92.0, taxa: 2.76, valor_liquido: 89.24 },
  { id: "GW009", data: "2024-12-06", pedido: "PED-89429", valor_bruto: 345.7, taxa: 10.37, valor_liquido: 335.33 },
  { id: "GW010", data: "2024-12-06", pedido: "PED-89430", valor_bruto: 276.5, taxa: 8.3, valor_liquido: 268.2 },
  { id: "GW011", data: "2024-12-06", pedido: "PED-89430", valor_bruto: 276.5, taxa: 8.3, valor_liquido: 268.2 }, // duplicidade no gateway
  { id: "GW012", data: "2024-12-07", pedido: "PED-89432", valor_bruto: 421.0, taxa: 12.63, valor_liquido: 408.37 },
];

const EXTRATO_ERP = [
  { id: "ERP001", data: "2024-12-02", pedido: "PED-89421", valor_bruto: 289.9, taxa_esperada: 8.7, valor_liquido: 281.2 },
  { id: "ERP002", data: "2024-12-02", pedido: "PED-89422", valor_bruto: 154.5, taxa_esperada: 4.64, valor_liquido: 149.86 },
  { id: "ERP003", data: "2024-12-03", pedido: "PED-89423", valor_bruto: 432.0, taxa_esperada: 12.96, valor_liquido: 419.04 },
  { id: "ERP004", data: "2024-12-02", pedido: "PED-89424", valor_bruto: 215.8, taxa_esperada: 6.47, valor_liquido: 209.33 }, // data divergente (ERP=02, GW=03)
  { id: "ERP005", data: "2024-12-04", pedido: "PED-89425", valor_bruto: 678.4, taxa_esperada: 20.35, valor_liquido: 658.05 }, // taxa esperada de 3%, gateway cobrou 4%
  { id: "ERP006", data: "2024-12-04", pedido: "PED-89426", valor_bruto: 198.0, taxa_esperada: 5.94, valor_liquido: 192.06 },
  { id: "ERP007", data: "2024-12-05", pedido: "PED-89427", valor_bruto: 510.3, taxa_esperada: 15.31, valor_liquido: 494.99 },
  { id: "ERP008", data: "2024-12-05", pedido: "PED-89428", valor_bruto: 92.0, taxa_esperada: 2.76, valor_liquido: 89.24 },
  // PED-89429 falta no ERP (não foi registrado)
  { id: "ERP010", data: "2024-12-06", pedido: "PED-89430", valor_bruto: 276.5, taxa_esperada: 8.3, valor_liquido: 268.2 },
  { id: "ERP011", data: "2024-12-06", pedido: "PED-89431", valor_bruto: 189.9, taxa_esperada: 5.7, valor_liquido: 184.2 }, // existe só no ERP
  { id: "ERP012", data: "2024-12-07", pedido: "PED-89432", valor_bruto: 421.0, taxa_esperada: 12.63, valor_liquido: 408.37 },
];

// ============================================================
// CHAMADA À API ANTHROPIC
// ============================================================

const SYSTEM_PROMPT = `Você é um assistente especialista em reconciliação contábil de meios de pagamento para uma operação e-commerce brasileira.

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
  "divergencias": [
    {"tipo": "...", "pedido": "...", "evidencia": "...", "impacto_financeiro": 0, "causa_provavel": "...", "acao_recomendada": "..."}
  ],
  "resumo": {"total_divergencias": 0, "impacto_total_brl": 0}
}`;

async function reconciliar() {
  const userPrompt = `EXTRATO_GATEWAY:
${JSON.stringify(EXTRATO_GATEWAY, null, 2)}

EXTRATO_ERP:
${JSON.stringify(EXTRATO_ERP, null, 2)}

Identifique todas as divergências.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
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

const fmtBRL = (v) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

const fmtDate = (d) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}`;
};

const TIPO_STYLE = {
  taxa_incorreta: { label: "Taxa incorreta", color: "#FF6F91", icon: AlertTriangle },
  duplicidade_gateway: { label: "Duplicidade — Gateway", color: "#D6B06A", icon: Copy },
  duplicidade_erp: { label: "Duplicidade — ERP", color: "#D6B06A", icon: Copy },
  divergencia_data: { label: "Divergência de data", color: "#FF5EAD", icon: Calendar },
  transacao_so_gateway: { label: "Só no Gateway", color: "#FF6F91", icon: FileWarning },
  transacao_so_erp: { label: "Só no ERP", color: "#FF6F91", icon: FileWarning },
  divergencia_valor: { label: "Divergência de valor", color: "#FF6F91", icon: Hash },
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function ReconciliacaoAssistida() {
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleReconciliar = async () => {
    setCarregando(true);
    setErro(null);
    setResultado(null);
    try {
      const r = await reconciliar();
      setResultado(r);
    } catch (e) {
      setErro("Falha na reconciliação. Tente novamente.");
      console.error(e);
    }
    setCarregando(false);
  };

  // Identifica pedidos com divergência para destacar nas tabelas
  const pedidosComDivergencia = new Set(
    (resultado?.divergencias || []).map((d) => d.pedido)
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

      <div className="relative mx-auto max-w-[1280px] px-5 py-10 md:px-10">
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#39D39F] bg-[#39D39F]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#07130F]" />
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#39D39F]">
              IA Aplicada · Artifact 5.4
            </div>
          </div>
          <h1
            className="font-serif text-[44px] font-light leading-[0.95] text-[#F7FBF8] md:text-[52px]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            <span className="block">Duas verdades, </span>
            <span className="block italic text-[#39D39F]">um único livro contábil.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-[#B5C9C0]">
            Reconciliação assistida entre gateway de pagamento e ERP. A IA cruza os extratos, encontra
            divergências, classifica por tipo e sugere ação para cada caso — em segundos, não em horas.
          </p>
        </header>

        {/* BARRA DE AÇÃO */}
        <div className="mb-8 flex flex-col items-start justify-between gap-3 rounded-sm border border-[#29483F] bg-[#10221C] p-5 md:flex-row md:items-center">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">Período</div>
              <div className="mt-1 font-mono text-[13px] text-[#F7FBF8]">02/12 — 07/12 · 2024</div>
            </div>
            <div className="h-10 w-px bg-[#467166]" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">Gateway</div>
              <div className="mt-1 font-mono text-[13px] text-[#F7FBF8]">{EXTRATO_GATEWAY.length} registros</div>
            </div>
            <div className="h-10 w-px bg-[#467166]" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">ERP</div>
              <div className="mt-1 font-mono text-[13px] text-[#F7FBF8]">{EXTRATO_ERP.length} registros</div>
            </div>
          </div>

          <button
            onClick={handleReconciliar}
            disabled={carregando}
            className="flex items-center gap-2 rounded-sm border border-[#39D39F] bg-[#39D39F] px-5 py-2.5 text-xs font-semibold text-[#07130F] transition hover:bg-[#6BE6B6] hover:shadow-[0_0_24px_rgba(57,211,159,0.35)] disabled:opacity-50"
          >
            {carregando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Reconciliando…
              </>
            ) : (
              <>
                <GitCompare className="h-4 w-4" strokeWidth={2} />
                Reconciliar com IA
              </>
            )}
          </button>
        </div>

        {erro && (
          <div className="mb-6 flex items-start gap-3 rounded-sm border border-[#FF6F91]/40 bg-[#3A1730]/40 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF6F91]" strokeWidth={1.75} />
            <div className="text-xs text-[#FFC2D6]">{erro}</div>
          </div>
        )}

        {/* RESUMO PÓS-RECONCILIAÇÃO */}
        {resultado && (
          <div className="mb-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-sm border border-[#FF6F91]/40 bg-[#3A1730]/40 p-5">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#FF6F91]">
                Divergências identificadas
              </div>
              <div
                className="mt-2 font-serif text-[36px] font-light text-[#FF6F91]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {resultado.resumo.total_divergencias}
              </div>
            </div>
            <div className="rounded-sm border border-[#D6B06A]/40 bg-[#3A2E1E]/40 p-5">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#D6B06A]">
                Impacto financeiro total
              </div>
              <div
                className="mt-2 font-serif text-[28px] font-light text-[#D6B06A]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {fmtBRL(Math.abs(resultado.resumo.impacto_total_brl))}
              </div>
              <div className="text-[10px] text-[#B5C9C0]">
                {resultado.resumo.impacto_total_brl >= 0 ? "a favor da operação" : "a recuperar"}
              </div>
            </div>
            <div className="rounded-sm border border-[#00B884]/40 bg-[#163C31]/40 p-5">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#00B884]">
                Reconciliação concluída
              </div>
              <div
                className="mt-2 flex items-center gap-2 font-serif text-[20px] text-[#00B884]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
                Pronta para revisão
              </div>
            </div>
          </div>
        )}

        {/* TABELAS LADO A LADO */}
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          {/* GATEWAY */}
          <div className="overflow-hidden rounded-sm border border-[#29483F] bg-[#10221C]">
            <div className="border-b border-[#29483F] bg-[#132B23] px-4 py-3">
              <div className="flex items-center justify-between">
                <div
                  className="font-serif text-[16px] text-[#F7FBF8]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Extrato — Gateway
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">Stone</div>
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-[#10221C]">
                  <tr className="border-b border-[#29483F] text-left text-[9px] uppercase tracking-[0.18em] text-[#8AA79B]">
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Pedido</th>
                    <th className="px-3 py-2 text-right">Bruto</th>
                    <th className="px-3 py-2 text-right">Taxa</th>
                    <th className="px-3 py-2 text-right">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {EXTRATO_GATEWAY.map((r, i) => {
                    const flag = pedidosComDivergencia.has(r.pedido);
                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-[#1C372F] transition ${
                          flag ? "bg-[#3A1730]/20" : "hover:bg-[#132B23]/40"
                        }`}
                      >
                        <td className="px-3 py-2 font-mono text-[#B5C9C0]">{fmtDate(r.data)}</td>
                        <td className="px-3 py-2 font-mono">
                          {flag && <span className="mr-1 text-[#FF6F91]">●</span>}
                          {r.pedido}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-[#F7FBF8]">
                          {fmtBRL(r.valor_bruto)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-[#B5C9C0]">
                          {fmtBRL(r.taxa)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-[#00B884]">
                          {fmtBRL(r.valor_liquido)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ERP */}
          <div className="overflow-hidden rounded-sm border border-[#29483F] bg-[#10221C]">
            <div className="border-b border-[#29483F] bg-[#132B23] px-4 py-3">
              <div className="flex items-center justify-between">
                <div
                  className="font-serif text-[16px] text-[#F7FBF8]"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Extrato — ERP
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#8AA79B]">Contas a receber</div>
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-[#10221C]">
                  <tr className="border-b border-[#29483F] text-left text-[9px] uppercase tracking-[0.18em] text-[#8AA79B]">
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Pedido</th>
                    <th className="px-3 py-2 text-right">Bruto</th>
                    <th className="px-3 py-2 text-right">Taxa esp.</th>
                    <th className="px-3 py-2 text-right">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {EXTRATO_ERP.map((r) => {
                    const flag = pedidosComDivergencia.has(r.pedido);
                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-[#1C372F] transition ${
                          flag ? "bg-[#3A1730]/20" : "hover:bg-[#132B23]/40"
                        }`}
                      >
                        <td className="px-3 py-2 font-mono text-[#B5C9C0]">{fmtDate(r.data)}</td>
                        <td className="px-3 py-2 font-mono">
                          {flag && <span className="mr-1 text-[#FF6F91]">●</span>}
                          {r.pedido}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-[#F7FBF8]">
                          {fmtBRL(r.valor_bruto)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-[#B5C9C0]">
                          {fmtBRL(r.taxa_esperada)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-[#00B884]">
                          {fmtBRL(r.valor_liquido)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RELATÓRIO DE DIVERGÊNCIAS */}
        {!resultado && !carregando && (
          <div className="rounded-sm border border-dashed border-[#29483F] bg-[#10221C]/40 p-10 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-[#467166]" strokeWidth={1} />
            <div
              className="font-serif text-[18px] italic text-[#B5C9C0]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Pronto para reconciliar.
            </div>
            <div className="mt-2 text-[12px] text-[#8AA79B]">
              A IA vai cruzar os 12 registros do gateway com os 11 do ERP e classificar as divergências.
            </div>
          </div>
        )}

        {carregando && (
          <div className="rounded-sm border border-[#29483F] bg-[#10221C] p-10 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#39D39F]" strokeWidth={1.5} />
            <div className="text-[13px] text-[#D8E5DF]">
              Cruzando extratos, identificando padrões, classificando divergências…
            </div>
          </div>
        )}

        {resultado && resultado.divergencias.length > 0 && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-12 bg-[#D6B06A]" />
              <h2
                className="font-serif text-[24px] text-[#F7FBF8]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Relatório de divergências
              </h2>
            </div>

            <div className="space-y-3">
              {resultado.divergencias.map((d, i) => {
                const style = TIPO_STYLE[d.tipo] || { label: d.tipo, color: "#B5C9C0", icon: AlertTriangle };
                const Icon = style.icon;
                return (
                  <div
                    key={i}
                    className="overflow-hidden rounded-sm border border-[#29483F] bg-[#10221C]"
                  >
                    <div className="flex">
                      <div className="flex w-1 flex-shrink-0" style={{ background: style.color }} />
                      <div className="flex-1 p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4" style={{ color: style.color }} strokeWidth={1.75} />
                            <span
                              className="rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em]"
                              style={{ background: `${style.color}20`, color: style.color }}
                            >
                              {style.label}
                            </span>
                            <span className="font-mono text-[11px] text-[#D8E5DF]">{d.pedido}</span>
                          </div>
                          <div
                            className="font-mono text-[13px] tabular-nums"
                            style={{ color: d.impacto_financeiro >= 0 ? "#00B884" : "#FF6F91" }}
                          >
                            {d.impacto_financeiro >= 0 ? "+" : ""}
                            {fmtBRL(d.impacto_financeiro)}
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <div>
                            <div className="mb-1 text-[9px] font-medium uppercase tracking-[0.22em] text-[#8AA79B]">
                              Evidência
                            </div>
                            <div className="text-[12px] leading-relaxed text-[#D8E5DF]">{d.evidencia}</div>
                          </div>
                          <div>
                            <div className="mb-1 text-[9px] font-medium uppercase tracking-[0.22em] text-[#8AA79B]">
                              Causa provável
                            </div>
                            <div className="text-[12px] leading-relaxed text-[#D8E5DF]">
                              {d.causa_provavel}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-[9px] font-medium uppercase tracking-[0.22em] text-[#39D39F]">
                              Ação recomendada
                            </div>
                            <div className="text-[12px] font-medium leading-relaxed text-[#F7FBF8]">
                              {d.acao_recomendada}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-10 border-t border-[#29483F] pt-6 text-[11px] text-[#8AA79B]">
          <div
            className="font-serif text-[14px] italic text-[#D8E5DF]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Finance Ops & Analytics — Artifact 5.4 / 5
          </div>
          <div className="mt-1">
            Reconciliação assistida via Claude Sonnet 4 · divergências plantadas para fins didáticos · case
            de portfólio
          </div>
        </div>
      </div>
    </div>
  );
}
