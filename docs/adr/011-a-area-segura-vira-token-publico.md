# ADR-011 — A área segura vira token público

**Data:** 2026-10-01
**Status:** aceito

## Contexto

O Basalto instalado num iPhone com ilha dinâmica abre em tela cheia
(`viewport-fit=cover` e a barra de status translúcida): o conteúdo desenha por
baixo do relógio, e cabe à moldura recuar. A 1.5.0 não recuava. O cartão
[basalto#44](https://github.com/slipalison/basalto/issues/44) traz a captura do
dono, na tela da Calculadora:

- **em cima**, o título ficava embaixo do relógio e da ilha — o `.co-screen`
  tinha 28px de respiro e nenhum `env(safe-area-inset-top)`;
- **embaixo**, a barra de abas sobrava: o rodapé dela era
  `calc(var(--co-space-10) + env(safe-area-inset-bottom, 0px))`, os 10px de
  respiro SOMADOS aos 34px que o sistema já reserva para o indicador de início;
- a reserva da tela com barra era o literal `104px`. A barra mede 73px sem área
  segura, e a última linha fica 31px acima do vidro; no iPhone, com a soma, ela
  media 107px e cobria 3px da última linha.

As laterais tinham o mesmo defeito em paisagem (nenhum inset), e o cabeçalho do
trilho também: um iPad em paisagem, instalado, tem relógio em cima, e é ali que
a marca mora.

O conserto é da coluna, e não do aplicativo: a área segura é geometria de tela,
do mesmo tipo que a `.co-sheet` já resolvia com `env()`, e peça que falta no
Basalto vem para cá (ADR-009). Mas o aplicativo tem um caso que a coluna não
vê: o aviso de atualização, que ele monta ACIMA da tela, colado na borda de
cima. Com o aviso de pé, quem tem de recuar do relógio é o aviso, e a tela
debaixo dele não pode somar a área de novo.

## Decisão

**A coluna expõe a área segura como quatro custom properties públicas, e toda
regra interna lê as propriedades — nunca o `env()` direto.**

```css
:root {
  --co-safe-top: env(safe-area-inset-top, 0px);
  --co-safe-right: env(safe-area-inset-right, 0px);
  --co-safe-bottom: env(safe-area-inset-bottom, 0px);
  --co-safe-left: env(safe-area-inset-left, 0px);
}
```

- **Por que público.** Só uma custom property se zera de fora. Um `env()`
  escrito dentro da regra do `.co-screen` não tem como ser desligado por quem
  consome, a não ser reescrevendo a regra inteira — que é exatamente o que um
  aplicativo não deve fazer com o CSS de um design system. Com a propriedade,
  o Basalto recua o aviso com `calc(var(--co-space-16) + var(--co-safe-top))` e
  zera `--co-safe-top` no que vem depois dele (`.app-notices ~ .co-screen,
  .app-notices ~ .app-shell { --co-safe-top: 0px; }`), e a tela e o trilho
  deixam de recuar, sem tocar em regra nenhuma daqui.
- **Declaradas só no `:root`.** Uma segunda declaração num componente faria
  sombra à do consumidor: a tela debaixo do aviso voltaria a somar a área de
  cima, e o defeito só apareceria com o aviso de pé — um caminho que o teste de
  ponta a ponta quase nunca percorre.
- **`--co-safe-*`, e não `--co-inset-*`.** `inset` já nomeia outra coisa aqui:
  o recuo interno de texto (`--co-inset-text`) e o raio de dentro do trilho
  (`--co-radius-inset`). "Safe" é o nome que o navegador dá à mesma área
  (`safe-area-inset-*`), e é por ele que alguém procura.
- **O `, 0px` é explícito**, como a barra de abas já escrevia: sem área segura
  — o navegador comum, o desktop —, as quatro valem zero, e toda conta abaixo
  fecha igual à 1.5.0.

Quatro regras passam a lê-las:

1. **`.co-screen` soma em cima e embaixo, e usa o maior nas laterais.**
   `padding-block: calc(var(--co-space-28) + var(--co-safe-top))
   var(--co-screen-bottom, calc(var(--co-space-40) + var(--co-safe-bottom)))`
   e `padding-inline: max(var(--co-space-16), var(--co-safe-left))
   max(var(--co-space-16), var(--co-safe-right))`. Os 28px são o respiro entre
   o conteúdo e o fim da área do sistema, e não um número que o relógio possa
   comer; já nas laterais o entalhe em paisagem traz a própria folga, e somar
   16px a ela abriria uma calha que nenhuma prancha desenha.
2. **`.co-tabbar` usa o MAIOR, e não a soma.**
   `padding-bottom: max(var(--co-space-10), var(--co-safe-bottom))`, declarado
   DEPOIS do `padding` de sempre (antes, o atalho o zeraria). O sistema já
   reserva a faixa do indicador; os 10px por cima dela eram a sobra embaixo dos
   rótulos que o cartão aponta.
3. **A reserva da tela com barra é a de antes, mais o que a barra cresce
   embaixo:**
   `--co-screen-bottom: calc(104px - var(--co-space-10) + max(var(--co-space-10), var(--co-safe-bottom)))`.
   O termo `max(...)` é o mesmo texto do rodapé da barra. Sem área segura a
   reserva continua 104px, igual à 1.5.0; com o indicador de 34px, 128px; com
   48px, 142px. Em todos os casos a última linha fica 31px acima da barra, como
   ficava na 1.5.0 sem área segura. Duas alternativas foram medidas e
   recusadas: o `104px` inteiro não acompanha a barra (com a soma antiga ela
   media 107px no iPhone e cobria 3px da última linha; com o `max`, ela mede
   97px e a folga cai de 31 para 7px); e a reserva só com a altura da barra —
   `calc(var(--co-space-10) + 52px + var(--co-border-width) + max(...))` — dá
   73px sem área segura, a última linha encosta no vidro (folga 0), e o "sem
   área segura, nada muda de lugar" quebraria pelo próprio conserto.
4. **`.co-rail__header` recua da área de cima**, aberto e recolhido:
   `padding-block-start: var(--co-safe-top)` DEPOIS do `padding: 0
   var(--co-space-12)` (antes, o atalho o zeraria), e o recolhido troca o
   `padding: 0` por `padding-inline: 0` — um `padding: 0` ali, mais específico,
   apagaria o recuo justamente na largura em que o trilho mais aparece no iPad.

A `.co-sheet` continua lendo `env(safe-area-inset-bottom, 0px)` direto: ela
sobe do rodapé por cima de tudo, e nenhum consumidor tem o que pôr embaixo
dela. Passa a ler `--co-safe-bottom` no dia em que alguém precisar zerá-la.

Medido no Chromium, com a área segura emulada pelo protocolo do navegador
(`Emulation.setSafeAreaInsetsOverride`), a folha publicada montada com as
classes da `Screen`, da `TabBar` e do `Rail`:

| aparelho | conteúdo em cima | barra embaixo | reserva | barra | última linha → barra |
|---|---|---|---|---|---|
| sem área segura | 28 | 10 | 104 | 73 | 31 |
| iPhone (59 em cima, 34 embaixo) | 87 | 34 | 128 | 97 | 31 |
| indicador de 48 | 28 | 48 | 142 | 111 | 31 |
| paisagem (47 nas laterais, 21 embaixo) | 28, calha 47/47 | 21 | 115 | 84 | 31 |
| 1.5.0 no iPhone | 28 | 44 | 104 | 107 | −3 |

No desktop com 59px em cima, a marca do trilho desce de 29 para 79 (o trilho
começa a 20px, e o cabeçalho recua 59). Com o aviso
do Basalto de pé e a área zerada depois dele, o aviso recua 75px (16 + 59) e a
tela fica nos 28px de sempre.

## Consequências

- **Não é quebra de compatibilidade.** Sem área segura nenhuma, cada número é
  o da 1.5.0 — 28px em cima, 16px nas laterais, 40px embaixo da tela sem barra,
  104px de reserva, 10px embaixo da barra, 0 em cima do trilho. É capacidade
  nova (as quatro propriedades), e por isso a versão é minor.
- **Quem consome passa a ter um jeito, e só um, de mexer na área segura:**
  sobrescrever uma `--co-safe-*` num contêiner. Zerar é o caso de uso
  (alguma coisa encosta na borda antes da tela); um valor diferente de zero
  serve para simular o aparelho — é o que as histórias "No iPhone" e "Com área
  segura" fazem, porque o `env()` de verdade só existe no aparelho.
- **O teste de unidade prova a amarração, não o pixel.** O happy-dom troca o
  `var()` pelo valor do ancestral, mas não faz conta e descarta o `max()` do
  rodapé da barra. `src/area-segura.test.tsx` lê o valor resolvido onde ele
  existe e, onde não existe, o texto da regra, avaliado na ordem em que as
  declarações vêm; o número em pixel é do navegador — no Basalto, o teste de
  ponta a ponta mede.
- **Um trilho sem `header` não recua.** A área de cima entra pela marca, que é
  onde o trilho começa nas nove pranchas de desktop. Um consumidor que monte o
  trilho sem marca num aparelho com área segura em cima verá os destinos
  começarem embaixo do relógio; o recuo dos destinos fica para quando esse
  consumidor existir.
