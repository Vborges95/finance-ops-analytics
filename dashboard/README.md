# Finance Ops & Analytics — Fase 5

Dashboard editorial de FP&A para operação beauty omnichannel
estendido com camada de IA aplicada (Claude Sonnet 4).

Esta é a versão evoluída da Fase 4: o dashboard original
permanece intacto e ganha cinco ferramentas de IA aplicada
integradas ao fluxo analítico — três conectadas aos dados reais
do dashboard (Comentários, Alertas, Análise de Variações) e
duas como demonstrações de capability (Classificador,
Reconciliação).

## Stack

- React 18 + Vite
- Tailwind CSS
- Recharts
- Lucide React
- Anthropic Claude Sonnet 4 (via fetch direto)

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# Copie .env.example para .env.local e cole sua chave de API
cp .env.example .env.local
# Edite .env.local e preencha VITE_ANTHROPIC_API_KEY

# 3. Rodar em desenvolvimento
npm run dev
```

A aplicação abre em `http://localhost:5173`.

## Estrutura

- `src/App.jsx` — dashboard principal + roteamento entre seções
- `src/artifacts/` — componentes de IA aplicada
- `.env.local` — chave de API (não versionado)

## Fases do projeto

- **Fase 4** — Dashboard editorial (entrega anterior, congelada)
- **Fase 5** — Esta entrega: dashboard + IA aplicada integrada
- **Fase 6** *(planejada)* — Chat assistant contextualizado
- **Fase 7** *(planejada)* — Consolidação final + camada transacional

---

Case de portfólio · dados simulados · Vinicius Borges