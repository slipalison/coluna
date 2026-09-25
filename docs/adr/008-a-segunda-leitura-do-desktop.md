# ADR-008 — A segunda leitura do desktop

**Data:** 2026-09-25
**Status:** aceito

## Contexto

A [ADR-006](006-o-que-entrou-com-o-desktop.md) contou peças em 30 pranchas e
pôs oito no sistema. Desde então o desenho definitivo ganhou uma prancha — a
D10, "a conta aberta, do repouso até o prato" — e as nove de desktop que já
existiam passaram a usar um vocabulário que o sistema ainda não tinha: o
cabeçalho com ações, o paginador ao lado do título, a busca com atalho, a
legenda do gráfico, a coluna de seções, a barra de macro em linha.

A ADR-006 contou peças que o telefone e o desktop dividiam. Esta conta o que
só o desktop pede — e o que ele pede de diferente nas peças que já existiam.
A régua é a mesma da [ADR-003](003-fronteira-do-sistema.md): **três telas de
uso, e prop de domínio é recusa**.

## A contagem

Medida nas 31 pranchas (21 de telefone, 10 de desktop), por busca no fonte de
cada prancha:

| peça | telas | onde | entra? |
| --- | --- | --- | --- |
| marca no topo do `Rail` | 9 | D2–D10 | sim, como `header` |
| `PageHeader` | 8 | D2, D4–D10 | sim |
| `MacroBar` em linha | 6 | D1, D3, D4, D5, D8, D10 | sim, como `layout="inline"` |
| `SearchField` | 5 | Registro, Receitas, D2, D3, D7 | sim |
| `Legend` | 5 | Histórico, Peso, Gasto, D4, D5 | sim |
| `NavList` | 4 | D3, D7, D8, D9 | sim |
| `Pager` | 3 | Histórico, D2, D4 | sim |
| `IconButton` | 3 | Registro, Receitas, D3 | sim |
| interruptor liga/desliga | **2** | Avisos, D9 | não |
| calendário de 7 colunas | **2** | Histórico, D4 | não |
| grade de fatos (rótulo e número) | **2** | D4, D9 | não |
| confirmar escrevendo "APAGAR" | **2** | Dados, D9 | não |
| trilha de navegação ("Gasto › A conta") | **1** | D10 | não |
| contagem ao lado do destino no trilho | **1** | D2 | não |
| avatar com iniciais | **1** | D2 | não |
| régua de incerteza das fórmulas | **1** | D10 | não |

O interruptor e o calendário continuam onde a ADR-006 os deixou: a prancha
nova não os usa. A grade de fatos é a mesma informação que o telefone mostra
com `Reckoning` e `Group` — no desktop ela vira colunas em duas telas, e duas
não são três.

## Decisão

Entram seis peças e três mudanças em peças que já existiam. Cada decisão de
desenho mora na peça, e não numa frase:

**`PageHeader` é outra peça, e não o `ScreenHeader` esticado.** A diferença
entre telefone e desktop é de quantidade, não de tamanho — a mesma do `Rail`
com a `TabBar`. No telefone cabe uma ação, e ela é um ícone; no desktop cabem
a busca, o botão principal e o seletor de período na linha do título. O
`ScreenHeader` já dizia de si mesmo que "duas ações já são uma barra de
ferramentas, e isso é outro componente". O título continua na serifa de 36px:
o desenho pedia 38, e dois degraus quase iguais na rampa são dois degraus que
ninguém sabe qual usar.

**`Pager` apaga a ponta sem soltar o foco.** Hoje é a ponta da direita do
diário, e o começo do registro é a da esquerda. Ali o botão fica
`aria-disabled`, e não `disabled`: quem avança até hoje apertando Enter tem o
botão desligado debaixo do próprio foco no último toque, e `disabled` jogaria
esse foco no começo da página. O `current` anuncia o período novo — sem ele,
quem ouve aperta "Próximo mês" e não sabe onde chegou.

**`SearchField` não rouba a tecla de quem escreve.** O atalho `/` traz o foco
de qualquer ponto da página, menos de dentro de outro campo: "1/2 xícara"
numa observação tem de continuar sendo uma barra. A contagem de resultados é
anunciada quando muda, porque é a única resposta da busca e ela mora num lugar
que o foco não visita. Ele é átomo: só compõe `Icon`.

**`IconButton` tem nome obrigatório no tipo.** Um `Button` com ícone e sem
texto compila, aparece certo e sai mudo. E o alvo continua em 44px, embora o
desenho pedisse 38 e 40 em vários lugares — o piso da ADR-003 não encolhe
porque a caixa ficou bonita menor.

**`NavList` não é o `Rail`.** O trilho é a navegação do aplicativo, lida de
relance; a lista é a de dentro de uma seção, lida com calma, e a linha de
baixo dela muda com o que a pessoa guardou. `opens` decide o elemento e o
anúncio juntos: `page` sai `<nav>` com `aria-current="page"`; `detail` — a
lista e detalhe das receitas — sai grupo com `aria-current="true"`, porque ali
a página não muda, muda o painel. O nome do botão é só o rótulo; o resto é
descrição, para quem pula de item em item saber onde está antes de ouvir a
conta.

**`Legend`: a amostra copia a marca.** Quadrado de categoria, ponto de medida,
traço cheio, tracejado, faixa. O ponto redondo não é uma exceção nova à
[ADR-004](004-raio-conteiner-e-conteudo.md): passa no critério estreito da
[ADR-007](007-a-marca-de-escolha-diz-quantas.md) — a forma é a informação, e
um quadrado na legenda de um gráfico de círculos ensinaria a procurar um
quadrado que não está lá.

**`MacroBar layout="inline"`.** Na coluna larga, a barra empilhada vira um fio
de 500px com o número perdido na outra ponta. Em linha, as barras de um grupo
começam e terminam nos mesmos pontos. Duas props vieram junto, porque nas seis
telas o número à direita nem sempre é "valor de alvo": `valueText` troca o que
se lê sem trocar o que a barra mede (os gramas ao lado da fatia da energia), e
`expression` é a conta embaixo dele — o mesmo nome e o mesmo papel da
`expression` do `Reckoning`. As colunas se alinham por
`--co-macro-name-width` e `--co-macro-figure-width`, escritas uma vez no
`Group` e herdadas pelas linhas.

**`Rail header`.** A marca abre o trilho nas nove pranchas que têm trilho, e
fica fora da lista de destinos: é o nome do lugar, não um lugar para ir.

## Consequências

**Aceitas:**

- Um ícone novo, `bookmark`, com uso nomeado: "Salvar nos favoritos", no
  registro do telefone e no do desktop.
- O teste de contraste passou a conferir `accent` sobre `accent-soft` no piso
  de desenho: é o `IconButton` ligado.
- Três telas do desktop entraram no catálogo em `Padrões/Desktop` — diário,
  ajustes e receitas — montadas só com peças do sistema. Um catálogo de peças
  isoladas não prova que elas convivem em três colunas de 1440px.

**Conhecida e não resolvida:**

- O `Stepper` desliga o botão da ponta com `disabled`, e tem o defeito que o
  `Pager` evita: quem chega ao mínimo pelo teclado perde o foco no último
  toque. Consertar muda o comportamento de uma peça publicada e merece o
  próprio PR — fica registrado aqui para não ser esquecido.
