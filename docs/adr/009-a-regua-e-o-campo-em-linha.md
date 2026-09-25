# ADR-009 — A régua e o campo em linha

**Data:** 2026-09-25
**Status:** aceito

## Contexto

A [ADR-008](008-a-segunda-leitura-do-desktop.md) contou a régua de incerteza
das fórmulas em **uma** prancha, a D10, e a deixou fora pela régua da
[ADR-003](003-fronteira-do-sistema.md): três telas de uso. No mesmo dia, o
Basalto foi implementar a D10 e deu com a consequência dessa recusa: a régua
nasceria como componente dentro do aplicativo, com desenho, cor e
acessibilidade próprios, fora do catálogo, do teste de contraste e da revisão
que toda peça daqui recebe.

O dono dos dois repositórios decidiu, em 2026-09-25, que o Basalto **não cria
componente próprio**: o que falta vem para cá. A contagem de três telas
continua sendo a régua para decidir o que o sistema **oferece por conta
própria**. Ela deixa de ser motivo para recusar uma peça genérica que um
consumidor precisa agora, desde que a peça passe na outra metade da ADR-003:
nenhuma prop de domínio.

A mesma implementação achou uma segunda falta, e essa passa na contagem por si
só: a linha de medida dentro de um grupo. Nome e nota à esquerda, campo à
direita — em `Abertura`, `DesktopPorta` e na D10, três pranchas. Até aqui o
`Field` só sabia empilhar rótulo, campo e dica.

## Decisão

**`Ruler` entra, como molécula.** Recebe números (`marks`, `band`, `min`,
`max`) e rótulos já formatados (`ticks`). Não sabe o que é kcal, nem qual
fórmula é qual: o teste da ADR-003 — "se a prop for um objeto do domínio, o
componente está do lado errado da linha" — passa. As decisões de desenho
moram nela:

- **A marca usada muda de forma antes de mudar de cor**: altura inteira e
  traço de `--co-marker-width`, contra meia altura e 2px das outras
  ([ADR-005](005-cor-nunca-sozinha.md)).
- **HTML e CSS, não SVG.** É o motivo pelo qual a `Series` não tem eixo: texto
  dentro do desenho prende a cor no tema e escapa da moldura. As posições saem
  de `--co-ruler-at`, como o valor da `Slat`.
- **Sem extremos, 10% de folga de cada lado.** É a folga que deixa o rótulo da
  ponta, centrado na posição, caber na moldura.
- **Sem `label`, decorativa.** Ela acompanha uma lista que já diz cada número
  em texto. Com `label`, vira `role="img"` com nome.
- **Traço reto, sem raio** ([ADR-004](004-raio-conteiner-e-conteudo.md)).

**`Field` ganha `layout="row"`.** Mesma altura mínima (56px) e mesma calha da
`ListRow`, para as duas dividirem um `Group` com o fio no mesmo lugar. O
rótulo vira o nome da linha (corpo, e não versalete), a dica vira a nota
embaixo dele, e o erro desce para baixo da linha inteira. O controle mora numa
coluna de largura fixa (`--co-field-row-control`, 128px), para que peso e
altura, na mesma lista, tenham campos do mesmo tamanho. A amarração de rótulo,
dica e erro é a mesma do campo empilhado — o teste que prova uma prova a outra.

## Consequências

**Aceitas:**

- A contagem de telas da ADR-003 continua valendo para o que o sistema
  oferece sem ser pedido. Uma peça pedida por um consumidor entra com uma tela
  só, se for genérica. A régua é o primeiro caso, e esta ADR é o precedente
  para o próximo.
- Os −/+ das pranchas (`Stepper`) não são o controle da linha de medida
  enquanto o valor de partida não for conhecido: um campo vazio com passo de
  100 g até 84,5 kg é centenas de toques. A linha recebe qualquer controle —
  hoje um `Input`; amanhã, com um valor guardado, um `Stepper`.

**Conhecida e não resolvida:**

- O defeito do `Stepper` registrado na ADR-008 (o `disabled` na ponta, que
  derruba o foco) segue aberto.
