# ADR-006 — O que entrou com o desktop, e o que ficou de fora

**Data:** 2026-09-17
**Status:** aceito

## Contexto

O Coluna 1.0.0 nasceu da terceira versão do desenho do Basalto, e cobria bem o
que existia: as telas de telefone. Depois vieram três coisas que o sistema não
tinha peça para expressar — nove telas de desktop, os momentos de prazer, e os
estados vazios — e as telas começaram a montar sozinhas o que faltava.

Isso tem prazo de validade conhecido: o que cada tela monta sozinha diverge na
terceira tela, e a versão que diverge é sempre a que menos gente olha.

A ADR-003 já tinha a régua de entrada — **três telas de uso, e prop de domínio é
recusa**. Faltava aplicá-la com número, e não de memória.

## A contagem

Medida nas 30 pranchas do desenho definitivo (21 de telefone, 9 de desktop), por
busca no fonte de cada prancha, não por lembrança:

| peça | telas | entra? |
| --- | --- | --- |
| `Rail` | 9 | sim |
| `Input` + `Field` | 5 | sim |
| `EmptyState` | 4 | sim |
| `Diff` | 4 | sim |
| `Sheet` | 4 | sim |
| `Disclosure` | 3 | sim |
| `Series` | 3 | sim |
| `Chip` | 3 | sim |
| interruptor liga/desliga | **2** | não |
| calendário de 7 colunas | **2** | não |
| barra de etapas do 14º dia | **1** | não |

## Decisão

Entram as oito primeiras. As três últimas ficam no aplicativo até aparecerem uma
terceira vez — inclusive o interruptor, que é o mais tentador dos três porque
`role="switch"` mal feito sai caro. A régua vale principalmente quando incomoda:
generalizar em cima de dois usos é escolher a forma antes de conhecer o
problema.

Três decisões de desenho entraram junto, e cada uma mora numa peça em vez de
numa frase de documentação:

**`Sheet mode="inline"` — largura nunca vira modal.** No desktop, trocar a porção
de uma refeição não pode escurecer a tela e esconder a conta do dia, que é
justamente o número que faz a pessoa escolher a porção. Um `Sheet` só, com dois
modos, em vez de `Sheet` e `Panel`: duas peças divergiriam no primeiro ajuste
feito com pressa.

**`Disclosure` — uma explicação por tela, não por cartão.** O defeito medido no
desenho: quase todo cartão terminava se explicando em letra miúda. Cada frase,
isolada, era boa; juntas viravam um professor que não para de falar. Fica
visível a frase que justifica uma decisão de produto com a qual a pessoa pode
discordar; o resto vai para trás do "por quê?". E se a frase explica algo que a
tela já mostra, ela não precisa existir nem aberta nem fechada.

**`Rail` — agrupar por frequência, não por assunto.** "Todo dia" e "De vez em
quando" põem as quatro coisas de sempre onde a mão já vai. "Comida / Corpo /
Conta" fica bonito na documentação e obriga a pensar toda vez.

## O que continua fora

`MealRow`, `RecipeCard`, o momento de celebração e o leitor de código de barras.
Os três primeiros por conhecerem o domínio (ADR-003); o último por ser hardware,
não interface. O momento é o caso que mais parece exceção e não é: ele sabe o
que é uma meta batida, e o aplicativo monta o mesmo efeito com `Surface`, `Slat`
e os tokens de movimento.

## Consequências

**Aceitas:**

- `--co-duration-slow` (220ms) entrou na escala de movimento. Os 140ms da tabela
  do desenho **não** entraram: quatro durações é uma escala que ninguém obedece,
  e 140 arredonda para `fast` sem que ninguém perceba a diferença.
- Seis ícones novos — `arrow-right` `barcode` `clock` `download` `star` `trash`
  —, todos com uso nomeado no desenho.
- `--co-jade-700` escureceu de `#0f766e` para `#0e6b64`. O teste de contraste
  passou a conferir também o fundo `surface-sunken`, porque `Rail` e `Sheet`
  inline puseram texto ali, e o verde-água do tema claro dava 4,09:1 — abaixo do
  piso de 4,5. Nos outros fundos ele melhorou junto.

**Conhecida e não resolvida:**

- O selo de estado (`Badge tone="status"`) põe `--co-status` sobre
  `--co-status-border`, e esse par dá 4,24:1 no tema claro. Passa no piso de
  desenho, não no de texto. Não está no teste, e resolver mexe na cor do selo —
  fica registrado para a próxima vez que alguém abrir a paleta.
