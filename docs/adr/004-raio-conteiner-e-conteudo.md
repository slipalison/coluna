# ADR-004 — O contêiner arredonda, o conteúdo é reto

Data: 2026-09-16
Situação: aceita

## Contexto

O Coluna nasceu do primeiro desenho do Basalto, a direção "rocha viva": raio
zero em tudo. A justificativa era boa e continua boa — basalto lasca em coluna,
a aresta viva é a marca, e um sistema inteiro em `border-radius: 12px` não se
distingue de nenhum outro.

A segunda direção, escrita a partir das *Human Interface Guidelines*, chegou
com o oposto: curva generosa em tudo, grupos arredondados, pílulas. Também com
uma justificativa boa — o canto arredondado é o que faz um grupo de linhas ler
como um objeto só em vez de uma pilha de caixas, e é o que permite tirar borda
da tela.

A terceira versão do desenho junta as duas. Os dois argumentos são verdadeiros
ao mesmo tempo, e não sobre a mesma coisa.

## Decisão

O raio depende do PAPEL do elemento, não do gosto de quem desenha a tela:

- **Contêiner arredonda.** Ele é vitrine: cartão, grupo, aviso, botão, trilho
  de controle, selo. `--co-radius-container` (16px) para a vitrine que segura
  conteúdo; `--co-radius-control` (12px) para o objeto que se toca;
  `--co-radius-inset` (9px) para o que mora dentro de um trilho de 12 com 3 de
  folga; `--co-radius-pill` (999px) para o selo.
- **Conteúdo é reto.** Ele é pedra: ponto de macro, ripa, barra de progresso,
  marcador, marca de escolha, fio. `--co-radius-content`, que é zero.

`--co-radius-inset` não é um número solto. Raio interno = raio externo − folga:
com 12 por fora e 3 de folga, o de dentro é 9. Qualquer outro valor faz o canto
de dentro correr paralelo ao de fora com espessura variável — o olho vê sem
saber nomear.

## Consequências

**O que ganha.** A tela fica calma sem ficar sem graça, que era exatamente a
queixa contra a segunda direção. A curva organiza os blocos; a aresta viva
continua aparecendo onde o desenho tem textura — na ripa, no ponto, no fio —, e
é ali que a identidade mora. E a regra é decidível: dado um elemento, "ele
segura outra coisa?" responde qual token usar, sem reunião.

**O que custa.** Um `Surface` já não tem um raio só, tem cinco. Isso é API a
mais e é escolha a mais na hora de montar a tela. O antídoto é que o padrão é o
certo na maioria dos casos (`container`), e o desvio precisa ser escrito.

**O que isso derruba.** A regra anterior — "raio zero em tudo, e
`--co-radius-2`/`--co-radius-4` para quando não der" — some. Os dois tokens
eram justamente a válvula de escape que tornava a regra antiga não-verificável:
qualquer coisa podia usá-los, e ninguém sabia dizer quando.

**Para quem consome.** Isto é quebra: `--co-radius-0`, `--co-radius-2` e
`--co-radius-4` não existem mais, e os componentes mudaram de forma sem mudar
de nome. Quem estava em `0.1.x` precisa reler as telas, não só trocar a versão.
