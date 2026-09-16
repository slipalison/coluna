# ADR-003 — O que é átomo, e o que não entra

**Data:** 2026-09-16
**Status:** aceito

## Contexto

Design system morre de duas formas opostas. Ou vira uma coleção de `<div>` com
props de estilo — e aí cada tela inventa o próprio desenho com as peças da casa.
Ou vira um catálogo que tenta prever toda tela do produto — e aí a primeira tela
nova nasce fora dele.

Precisa de uma fronteira escrita, senão ela é decidida caso a caso, por quem
estiver com pressa.

## Decisão

Três camadas, e uma regra de entrada para cada.

**Átomo** — não compõe outro componente do sistema (fora `Icon`), não tem estado
de domínio, e aparece em pelo menos três telas. `Text` `Stack` `Grid` `Surface`
`Divider` `Button` `Icon` `Badge` `Slat` `VisuallyHidden`.

**Molécula** — compõe átomos, resolve um padrão de interação inteiro, e o que
ela sabe é de interface, nunca de nutrição. `SegmentedControl` `Stat` `MacroBar`
`Notice` `ListRow` `Stepper`.

**Fora** — tudo que sabe o que é uma refeição.

## A linha que não se atravessa

`MacroBar` recebe `name`, `value` e `target`. Ela **não** sabe que proteína tem
4 kcal por grama, não sabe qual é o alvo do dia, e não busca nada.

Um `<MealCard meal={...} />` no sistema pareceria economia e seria o começo do
fim: ele precisaria conhecer o formato de `meal`, e todo ajuste na API do
Basalto viraria uma versão nova do design system — que outros consumidores
receberiam sem ter pedido. Componente que conhece o domínio pertence ao
aplicativo.

O teste prático: **se a prop for um objeto do domínio, o componente está do lado
errado da linha.**

## As recusas que vale escrever

**Não existe `Button size="sm"`.** 44px é o alvo mínimo que um polegar acerta. A
ausência do tamanho é a regra — se ela fosse um aviso na documentação, o `sm`
apareceria em produção na primeira sexta-feira.

**`Notice` não tem variante de erro.** Aviso informa, nunca bloqueia. Erro de
verdade — entrada sem significado — não é um aviso: é uma mensagem junto do
campo que a produziu, e isso é do aplicativo.

**Só um vermelho, e ele tem dono.** `Button variant="danger"` existe porque
apagar a conta apaga os dados de verdade. Vermelho não decora erro de
digitação nem repreende quem comeu mais do que planejou.

**`Slat` não grampeia o excedente por baixo dos panos.** Passar do alvo é
informação. O desenho satura em 100%; o número ao lado continua contando a
verdade, e nada muda de cor.

## Consequências

**Aceitas:**

- Composição no aplicativo é mais verbosa. Uma linha de refeição no Basalto é
  `ListRow` + `Text` + `Badge` montados lá, e não um componente pronto.
- Um padrão que aparece em três telas fica repetido até entrar aqui. É o
  preço de exigir três usos antes de generalizar — e é menor que o preço de
  generalizar em cima de um.

**Recusadas:**

- Um pacote `@slipalison/coluna-basalto` com os componentes de domínio. Seria a
  mesma dependência com outro nome, e o acoplamento voltaria pela porta dos
  fundos.
