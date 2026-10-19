# ADR-017 — A busca da folha fica presa no topo

**Data:** 2026-10-19
**Status:** aceito

## Contexto

O E2E do Basalto mediu, com a 1.11.0, uma busca sem rótulo visível na folha
"Adicionar alimento" (cartão #69, `KE-TEST-24` de lá). A folha tem a
`SearchField` no topo do corpo que rola (`.co-sheet__body`) e a lista de
resultados embaixo. O Tab que leva o foco a uma linha só em parte à vista faz o
navegador rolar o corpo o mínimo para mostrá-la. No telefone da medição (Galaxy
S24, corpo de 549px) o `scrollTop` parou em 29: o rótulo "Buscar alimento" ficou
entre -25 e -2px do recorte, e a moldura da busca entre 4 e 50px. Ficou um campo
inteiro à vista sem o rótulo, contra o piso (WCAG 2.2, 3.3.2; `ux.md` §2). A
varredura do corpo achou 28 estados assim (`scrollTop` de 5 a 32 na conta da
coluna, de 24 a 78 com a lista do Basalto), e o reprodutor sem Auth0 reprovou 20
de 20.

O defeito é da peça, e não da tela: toda folha com busca e lista que rola o tem.
Afrouxar a guarda do Basalto para o caso "campo à vista com rótulo recortado"
é justamente o que a isca dela proíbe.

## Decisão

**Toda `SearchField` no corpo de uma `Sheet` fica presa no topo do corpo que
rola, com o rótulo junto, e o corpo recua a rolagem a altura dela.** Sem prop.

- `position: sticky; top: 0` em `.co-sheet__body .co-search-field`. O seletor é
  de descendente, e não de filho: o Basalto monta a busca dentro de um `Stack`,
  às vezes com um aviso antes dela. Sem nada acima, ela já nasce presa; com um
  texto acima, sobe com ele e para no topo.
- **A faixa tem 4px de respiro em cima e 8px embaixo, devolvidos ao fluxo por
  margens negativas.** Parada, a busca fica onde sempre esteve; presa, o rótulo
  nunca encosta na borda do recorte, e a moldura e o anel de foco dela ficam
  sempre sobre a superfície, e não sobre a lista que passa (a borda continua
  medida contra `--co-surface`, 3:1 nos dois temas).
- **O fundo é o da folha** (`--co-surface`; na `inline`, `--co-surface-sunken`):
  a lista passa por baixo e não aparece.
- **`z-index: 1`.** As linhas de um `Group` são `position: relative` e vêm depois
  no documento; com `auto`, elas pintariam por cima da busca (medido: 145
  estados com a lista sobre a faixa).
- **`scroll-padding-top` no corpo com busca**: o respiro de cima, uma linha do
  rótulo (15px × 1,5), o vão, a moldura (44px, ou 52px no `lg`), o respiro de
  baixo e os 4px do anel de quem recebe o foco. É o recuo da janela do adendo
  1.7.1 do ADR-012 aplicado ao contêiner que rola. O Tab, a âncora e o
  `scrollIntoView` param abaixo da faixa (WCAG 2.2, 2.4.11).

### Por que sem prop

Uma prop (`stickySearch`, uma variante da `Sheet`) faria cada tela lembrar do
piso, e o ADR-016 decidiu o contrário: o limiar que depende de um componente é
garantido no componente. Também não há caso em que a busca de uma folha deva
rolar para fora com a lista que ela filtra. A regra não custa nada onde não se
aplica:

- na `inline`, o corpo não tem altura máxima e não rola: a faixa nunca se
  prende;
- fora de uma `Sheet`, a busca não muda (o teste prova);
- sem busca no corpo, o `scroll-padding-top` não vale (`:has()`).

## Consequências

- A faixa ocupa uns 85px do corpo (93px no `lg`). Com o texto a 200%, ocupa o
  dobro: é o preço de o rótulo ficar à vista, e o corpo continua rolando
  embaixo.
- O recuo conta o rótulo em **uma** linha. Um rótulo que quebra em duas faz o
  foco parar até uma linha por baixo da faixa. Os rótulos de busca são curtos
  ("Buscar alimento"). Se um dia não forem, o recuo passa a ser medido.
- Duas buscas no mesmo corpo se prenderiam no mesmo lugar, uma sobre a outra.
  Uma folha tem uma busca.
- A prova é a do resto da folha (`src/test/folha.ts`): o texto da regra,
  avaliado e rolado píxel a píxel num corpo de 549px
  (`src/busca-presa.test.tsx`). Sem a regra, a conta acha os mesmos 28 estados
  que o Chromium e o WebKit acharam na história "Com busca presa" com o
  conserto anulado; com ela, nenhum.
