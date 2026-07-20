# Dashboard Streamlit — Finance Ops & Analytics

Versão em **Python/Streamlit** do dashboard do case beauty omnichannel,
**equivalente ao dashboard React** do repositório (`../dashboard/`).

Ambos consomem os **mesmos números consolidados** do modelo financeiro
(Fase 3), então os valores são idênticos: DRE gerencial de 22 linhas,
margem de contribuição, EBITDA, capital de giro (NCG, ciclo financeiro,
PMR por canal), aging de estoque, Top 10 SKUs e **ROI da transformação
operacional** (payback e economia antes/depois).

Serve como demonstração pública de **Python aplicado à visualização
financeira**, complementando a versão React.

## Estrutura

- `app.py` — aplicação Streamlit (5 abas: DRE, Receita & Margem, Capital de Giro, Estoque & SKUs, ROI).
- `dados_consolidados.json` — números consolidados do modelo (o mesmo objeto de dados que alimenta o dashboard React).
- `requirements.txt` — dependências.

## Rodar localmente

```bash
cd streamlit_app
pip install -r requirements.txt
streamlit run app.py
```

Abre em `http://localhost:8501`.

## Publicar no Streamlit Community Cloud (grátis)

1. Faça commit desta pasta no repositório do GitHub.
2. Acesse [share.streamlit.io](https://share.streamlit.io), login com GitHub.
3. **Create app** → repositório `Vborges95/finance-ops-analytics`, branch `main`.
4. **Main file path:** `streamlit_app/app.py`
5. **Deploy**. Em ~2 min o app fica público numa URL `.streamlit.app`.

Nenhum segredo/variável de ambiente é necessário.

## Nota metodológica

Os números vêm do modelo financeiro (Fase 3), incluindo CMV e margem
bruta — por isso o EBITDA aparece **negativo (−12,6%)**, refletindo o
achado central do case: a operação cresce em receita mas queima caixa
por causa do ciclo de capital de giro (NCG de 489 dias de receita), não
por margem. Os filtros de canal e período recalculam os agregados e
percentuais sobre as séries mensais da DRE.
