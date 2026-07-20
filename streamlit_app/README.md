# Dashboard Streamlit — Finance Ops & Analytics

Versão em **Python/Streamlit** do dashboard do case beauty omnichannel.
Lê os datasets em `../data/raw/` e reconstrói, em Python puro, os painéis
de DRE gerencial simplificada, evolução de receita, capital de giro e KPIs.

Complementa o dashboard React (`../dashboard/`), servindo como
demonstração pública de **Python aplicado à visualização financeira**.

## Rodar localmente

```bash
cd streamlit_app
pip install -r requirements.txt
streamlit run app.py
```

Abre em `http://localhost:8501`.

## Publicar no Streamlit Community Cloud (grátis)

1. Garanta que este diretório está commitado no repositório do GitHub.
2. Acesse [share.streamlit.io](https://share.streamlit.io) e faça login com o GitHub.
3. Clique em **New app** e selecione o repositório `Vborges95/finance-ops-analytics`.
4. Em **Main file path**, informe: `streamlit_app/app.py`
5. Clique em **Deploy**. Em ~2 min o app fica público em uma URL
   do tipo `https://<nome>.streamlit.app`.

Não há segredos/variáveis de ambiente necessários — o app lê apenas
os CSVs versionados no repositório.

## Nota metodológica

`vendas.csv` não traz CMV por transação, então a margem bruta detalhada
vive no modelo Excel (Fase 3). Aqui o ponto de partida é a **Receita
Líquida** (já deduzidas comissões e devoluções), e o resultado
operacional é derivado subtraindo as despesas por competência.
KPIs que dependem do modelo Excel estão sinalizados na interface.
