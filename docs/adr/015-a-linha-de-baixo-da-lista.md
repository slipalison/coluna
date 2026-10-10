# ADR-015 — A linha de baixo da `ListRow`

**Data:** 2026-10-09
**Status:** aceito

## Contexto

A linha da refeição no diário do Basalto tem o nome em cima e o resumo dos
alimentos embaixo ("Arroz, tipo 1, cozido · Feijão, carioca, cozido · Frango…").
O aplicativo montava o resumo como segundo filho da `ListRow`, e ele quebrava:
num telefone de 393px, com cinco alimentos no almoço, a linha ia de 63px para
119px no WebKit e 137px no Chromium (quatro e cinco linhas de resumo). A lista
mudava de altura com o que a pessoa comeu.

O `NavList` já resolve isso com a linha de baixo dele: uma linha só, e o que
passa vira reticências (`.co-nav-list__description`). Faltava a mesma linha na
`ListRow`.

## Decisão

**A `ListRow` ganha `description?: ReactNode`, a linha de baixo do `NavList`.**

- **O último item do corpo**, depois do `children`. O corpo já é coluna e já
  encolhe (`min-width: 0`); ser item dele é o que faz da linha um bloco, que o
  `text-overflow` exige.
- **A tipografia da descrição do `NavList`**: `Text` `caption`, tom `subtle`.
  O corte mora na **mesma regra** que o do `NavList`
  (`.co-nav-list__description, .co-list-row__description`): nenhum número novo,
  e as duas linhas não têm como divergir.
- **Sem `description`, a árvore é a de antes**, nó por nó — o teste compara o
  HTML com o da 1.9.0. Ausente é só `undefined`, como no `leading` e no
  `trailing`.
- **O nome do botão inclui a linha de baixo**, e aqui a `ListRow` difere do
  `NavList`. Com `onClick`, o nome sai do conteúdo, na ordem da tela: "12:40
  Almoço Arroz, tipo 1, cozido · … 612 kcal". O `NavList` aponta o nome só para
  o rótulo (`aria-labelledby`) e manda a linha de baixo e a direita para a
  descrição; a mesma divisão, aplicada aqui, faz o nome deixar de conter o que
  se lê no botão — é o critério 2.5.3 do WCAG (A), na regra ACT `2ee8b8`. O axe
  4.14 tirou essa regra do experimental e a liga por padrão: na história nova,
  com a divisão, ele acusou as duas linhas com resumo; sem a divisão, nada. Quem
  pula de linha em linha ouve "12:40 Almoço" primeiro, porque é o que vem
  primeiro na tela.

A prop é um `ReactNode`, e não um objeto do domínio (ADR-003).

## A medição

Chromium e WebKit do Playwright 1.63, janela de 393×852, a história
"Moléculas/ListRow › Com descrição comprida, no telefone" (moldura de 361px, um
telefone de 393px menos a calha de 16px de cada lado), nos temas claro e escuro,
com as fontes do pacote:

| | Chromium | WebKit |
|---|---|---|
| altura da linha, resumo curto (café) | 62,7px | 62,7px |
| altura da linha, resumo de cinco alimentos (almoço) | 62,7px | 62,7px |
| linhas de resumo, almoço | 1 (`scrollWidth` 619 > `clientWidth` 190) | 1 (631 > 189) |
| o mesmo resumo como segundo filho, `footnote` `muted` (antes) | 136,8px, 5 linhas | 118,8px, 4 linhas |
| linha sem resumo (lanche) | 56px, a de antes | 56px |
| transborda a linha ou o documento | não | não |

O axe nos dois temas, em "Com descrição comprida, no telefone", nas outras
quatro histórias da `ListRow`, em "Moléculas/NavList › Lista e detalhe" e em
"Padrões/Tela do diário › Diário": 0 violações com o axe 4.13 do
`@storybook/addon-a11y`, padrão; 0 com o 4.13 nas tags do e2e do Basalto
(`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`); e, com o 4.14 padrão, 0 em todas
menos a do `NavList`, que já tinha `label-content-name-mismatch` em 5 nós antes
desta mudança.

### O que fica de fora

- **A divisão do `NavList`.** O nome dele continua só o rótulo, e o axe 4.14
  acusa isso. Mudar é decisão sobre o `NavList`, e fica para outra mudança.
- **Duas linhas.** A linha de baixo é uma; um resumo que precise de duas é
  outra peça.
- **O texto inteiro num `title`.** Não aparece no toque, e o leitor de tela já
  lê tudo pelo nome; quem quer ver os alimentos abre a refeição.

## Consequências

- **Minor, e não quebra.** A prop é nova e opcional, e sem ela nada muda. A
  única regra da folha que mudou é a do `NavList`, que ganhou um seletor.
- **No Basalto, o resumo troca de lugar e o nome fica o mesmo.** O resumo sai
  do `children` e vai para `description`; o texto do botão, e com ele o nome
  acessível, é o mesmo de hoje, na mesma ordem. Muda a letra do resumo, de
  `footnote` `muted` para a do `NavList`.
