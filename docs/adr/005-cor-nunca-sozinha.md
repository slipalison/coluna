# ADR-005 — Cor nunca é o único sinal

Data: 2026-09-16
Situação: aceita

## Contexto

O Basalto mostra três macros o tempo todo: proteína, carboidrato, gordura. A
tentação — e o que o primeiro desenho fazia em alguns lugares — é resolver isso
com três cores e três números, sem nome. Fica limpo, cabe em pouca largura, e é
o que quase todo aplicativo de nutrição faz.

Cerca de 8% dos homens e 0,5% das mulheres não distinguem parte do espectro
vermelho-verde. A paleta deste sistema é ametista, jade e orquídea: ametista e
orquídea são vizinhas de matiz, e para uma pessoa com deuteranopia elas podem
sair praticamente idênticas. Uma tela com três números e três pontos coloridos
é, para ela, três números sem legenda.

O mesmo vale para a barra de abas: um ícone que só muda de cor quando está
ativo não diz qual aba está ativa.

Isto não é hipótese: é o critério 1.4.1 do WCAG, e o portão de acessibilidade
do catálogo (`a11y: { test: "error" }`) reprova por ele.

## Decisão

**Nenhum componente deste sistema entrega informação só pela cor.** Onde a cor
aparece, ela é atalho para quem lê de relance, e o texto carrega o fato.

Em código:

- `Dot` é sempre `aria-hidden`, e não é exportado como componente "de
  informação". Ele existe para acompanhar um nome e um número.
- `MacroBar` renderiza ponto, **nome** e **quantidade** — os três, sempre. O
  nome não é opcional na assinatura.
- `TabBar` marca a aba atual com cor, **peso** e `aria-current="page"`. Três
  sinais para a mesma informação.
- `ListRow` com `mark` vira `role="radio"` com `aria-checked`, em vez de um
  botão que só parece marcado.
- `Slat` sem `label` sai `aria-hidden`: uma barra que ninguém nomeia não é
  informação, é desenho — e o número ao lado dela já foi anunciado.

E uma decisão de token que vem junto: **`--co-text-subtle` é o piso de
contraste para texto.** Ele passa em 4,5:1 sobre `--co-surface`, que é o fundo
mais claro do tema escuro e portanto o caso difícil. Abaixo dele só existe
`--co-icon-muted`, que passa em 3:1 e serve para desenho — seta, moldura,
chevron —, nunca para texto.

Isso custou fidelidade ao desenho de origem em dois pontos, de propósito: a
letra miúda dele usava `#6f6780` (3,3:1 sobre a superfície) e a aba inativa
usava `#5a5270` (2,7:1). Os dois subiram. Um design system que publica os
valores do mockup sem conferir o contraste transporta o defeito para toda tela
que o consumir.

## Consequências

**O que ganha.** A tela funciona em daltonismo, em monocromático, no sol, e no
leitor de tela — e funciona pelo mesmo motivo nos quatro casos. O portão de
acessibilidade do catálogo passa a ser cumprível em vez de contornável.

**O que custa.** Mais largura. Ponto + nome + número ocupa mais que ponto +
número, e em 390px isso aperta. Em duas telas isso obrigou a passar o número
para a linha de baixo. Vale: a alternativa é uma tela mais curta que uma parte
das pessoas não lê.

**O que NÃO se decidiu.** Padrão de preenchimento (hachura, pontilhado) como
terceiro sinal em gráficos. Quando houver um gráfico de área com séries
sobrepostas, isso volta — em barra e em ponto, o texto ao lado já resolve.
