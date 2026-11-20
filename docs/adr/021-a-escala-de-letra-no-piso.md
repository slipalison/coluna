# ADR-021 — A escala de letra cumpre o piso

**Data:** 2026-11-18
**Status:** aceito; os pisos continuam, e a escala acima deles é a do [ADR-022](022-a-identidade-relogio-de-sol.md) (corpo 17, legenda 14, caixa alta 13, título 26/30).

## Contexto

O piso de letra está escrito desde o ADR-016 (`.claude/rules/ux.md` §1): texto
corrido, texto primário de lista e valor de campo com 16px ou mais; texto
secundário e nota com 14px ou mais; legenda e rótulo em caixa-alta com 12px ou
mais; o rótulo da barra de abas com 11px ou mais, a convenção do iOS. A escala
de texto ficou na dívida da regra (§3), e a correção nunca chegou.

Uma revisão de UX do Basalto mediu a 1.13.0 no estilo computado, no telefone e
no desktop, nos dois temas, e achou a letra abaixo do piso em todas as telas
revisadas:

| onde | papel | 1.13.0 | piso |
|---|---|---|---|
| `Text` `body` | texto corrido | 15px | 16px |
| corpo do `Notice` (`footnote`) | o texto que diz o que aconteceu | 12px | 14px |
| texto do `EmptyState` (`footnote`) | idem | 12px | 14px |
| `Text` `caption` | legenda | 11px | 12px |
| `Text` `label` (rótulo de seção) | versalete | 11px | 12px |
| `Text` `micro` (rótulo de grupo do `Rail` e do `NavList`) | versalete | 10px | 12px |
| `.co-tabbar__item` | rótulo da barra de abas | 10px | 11px |

Lida a folha inteira com o mesmo piso, apareceram mais sete usos abaixo dele:
o erro do `Field` e do `Group` (12px, o texto que diz o que corrigir), a linha
de baixo da `ListRow` e do `NavList` (`caption`, 11px, o texto secundário da
linha), a nota do `Group` e a da `Reckoning` (`caption`, 11px), o rótulo do
`NavList` (14px, texto primário de lista), o `Badge` (11px) e a tecla desenhada
da `SearchField` (11px).

## Decisão

**Cada variante do `Text` e cada letra que um componente declara têm um papel,
e o tamanho fica no piso do papel. O conserto mora na camada semântica — a
variante e a regra do componente —, e não nos tokens primitivos.**

Os tokens de letra (`--co-text-10` a `--co-text-68`) têm o valor no nome. Subir
o `--co-text-11` para 12px faria o nome mentir e mudaria, sem aviso, toda regra
e todo consumidor que o lê. A variante é o lugar em que o papel e o tamanho se
encontram, e é ela que muda.

### O que muda

| | antes | depois |
|---|---|---|
| `Text` `body` | 15px | **16px** |
| `Text` `footnote` | 12px | **14px** |
| `Text` `caption` | 11px | **12px** |
| `Text` `label` | 11px | **12px** |
| `Text` `micro` | 10px | **12px** |
| `.co-tabbar__item` | 10px | **11px** |
| `.co-field__error`, `.co-group__error` | 12px | **14px** |
| `.co-nav-list__item` (o rótulo do `NavList`) | 14px | **16px** |
| `.co-badge` | 11px | **12px** |
| `.co-search__key` | 11px | **12px** |
| linha de baixo da `ListRow` e do `NavList` | `caption`, 11px | **`callout`, 14px** |
| nota do `Group` e da `Reckoning` | `caption`, 11px | **`footnote`, 14px** |

Ficam como estavam, e o teste os classifica: `headline` 16, `callout` 14,
`subhead` 13 (legenda, horário, valor ao lado do nome), o botão 14 e o botão
grande 15, as `Tabs` e o `Rail` 14 (rótulo de navegação), o `Diff` 15, o valor
do campo, da busca e do `Stepper` 16, a unidade do campo 13, a contagem da busca
12, e o `Chip` e o `SegmentedControl` 13.

### Por que subir o `footnote`, e não trocar a variante do `Notice` e do `EmptyState`

O `footnote` é "a nota que explica o bloco", e a regra já dizia nota ≥ 14px.
Todo uso dele no sistema é uma nota: o corpo do `Notice`, o texto do
`EmptyState`, a dica do `Field`, a legenda do `Stat`, o `Disclosure`, o nome do
macro na `MacroBar` compacta. Trocar a variante de seis componentes deixaria uma
variante cujo único tamanho é abaixo do piso do próprio papel; subir uma linha
conserta os seis e o consumidor que escreve `footnote` para uma nota. O corpo do
`Notice` fica em 14px, e não em 16px, para não passar do título dele (`callout`
semibold, 14px); o do `EmptyState` fica abaixo do título (`headline`, 16px).

A linha de baixo da `ListRow` e do `NavList` troca de variante, porque ali o
papel é outro: é o texto secundário da linha, que é o que o `callout` é. A nota
do `Group` e a da `Reckoning` passam ao `footnote`, a mesma variante da dica do
`Field`, que cumpre no `Field` o papel que a nota cumpre no grupo (ADR-010).

### Dois pares agora têm a mesma letra

`footnote` e `callout` medem 14px; `label` e `micro`, 12px. Nenhum nome saiu:
quem usa o pacote escreve o nome, e um nome que some quebra o build de quem o
usa. O que separa cada par é o papel e, nos versaletes, o espaçamento entre as
letras (0,14em no rótulo de seção, 0,1em no de grupo).

### Os tokens abaixo do piso

O `--co-text-10` deixa de ser usado por qualquer componente. Ele **fica**: é uma
propriedade pública do CSS, e um consumidor pode lê-la. O CSS gerado o marca
como abaixo do piso, para quem o achar não o usar em texto. O `--co-text-11`
fica só para o rótulo da barra de abas, e diz isso no CSS gerado.

### O que o dono pode trocar

O `Chip` e o `SegmentedControl` ficam em 13px, a letra do controle segmentado
do iOS, com o piso da legenda (12px). O `subhead` fica em 13px pelo papel de
legenda; o subtítulo do `ScreenHeader` e do `PageHeader` e as linhas da
`Reckoning` o usam. Se o dono os ler como texto secundário, cada um sobe para
14px com uma linha da folha e uma linha da tabela do teste.

## A prova

`src/escala-de-letra.test.tsx`, em três lugares, cada um com a sua isca:

- **Na folha.** Toda declaração de `font-size` da folha, inclusive dentro de
  `@media`, tem um papel numa tabela do teste, e o valor, avaliado pelos tokens
  gerados, fica no piso do papel. Uma regra nova com letra e sem papel reprova
  ("letra sem papel"), e o atalho `font` também; uma entrada da tabela que não
  casa nenhuma regra reprova. Só o `.co-tabbar__item` fica abaixo de 12px. As
  iscas põem de volta cada letra da 1.13.0 e reprovam pela mensagem.
- **Nas variantes.** A lista de variantes é lida do tipo `TextVariant` em
  `Text.tsx`, e tem de ser a da tabela; cada variante, renderizada, tem a letra
  computada no piso do papel. A isca põe o corpo a 15px e a mede.
- **Nas peças.** Uma tela com o `Notice`, o `EmptyState`, a `ListRow`, o
  `NavList`, o `Group`, o `Field`, a `Reckoning`, o `Stat`, o `Disclosure`, o
  `Badge`, o `Rail` e a `TabBar`: cada texto nomeado fica no piso do que ele é, e
  nenhum nó com texto fica abaixo de 12px fora da barra de abas. Passa no axe
  nos dois temas. As iscas voltam as letras e as variantes da 1.13.0 e reprovam
  cada texto pelo nome.

E as histórias do catálogo não escrevem à mão um `fontSize` abaixo de 12px (as
amostras de token e de ícone escreviam 10 e 11px). A história
"Átomos/Text › Piso de letra" mostra cada variante com a letra que o navegador
computou e o piso dela, nos dois temas.

## Consequências

- **A aparência muda**, sem mudar contrato de API: nenhum nome, prop ou tipo
  saiu ou mudou. Mudam de tamanho o texto corrido, as notas, as legendas, os
  versaletes, os erros de campo, os selos, a barra de abas, o rótulo do
  `NavList` e as linhas de baixo. É um `fix`: a 1.13.0 estava abaixo de um piso
  que o próprio sistema escreve.
- **As linhas crescem.** Pela conta, não medida no navegador: a linha de baixo
  da `ListRow` passa de 16px de altura (11 × 1,45) a 21px (14 × 1,5), e a linha
  com descrição do ADR-015 passa de 62,7px a cerca de 68px; o item do `NavList`
  com descrição cresce na mesma medida, mais os 2px do rótulo. A faixa da busca presa na folha
  (ADR-017) passa de 84,5px a 86px, e o recuo do foco acompanha, porque o
  rótulo dela é uma linha da letra de corpo (o teste dela foi corrigido para os
  números novos: a isca sem a regra presa acha 30 estados, e não 28).
- **A escala ainda tem degraus de 1px** entre 11 e 16 (aba 11, `subhead` 13,
  botão grande 15): isso é a outra metade da linha da dívida, a da escala
  limpa, e fica nela. Esta mudança paga só o piso.
