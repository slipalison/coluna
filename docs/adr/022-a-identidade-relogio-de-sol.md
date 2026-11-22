# ADR-022 — A identidade "Relógio de Sol" (Coluna 2.0)

**Data:** 2026-11-19
**Status:** aceito. Substitui os valores do ADR-004 (raios), o piso de token do
ADR-005 (`--co-text-subtle` e `--co-icon-muted`, e o 3:1 da paleta de macro), a
escala do ADR-021 (os pisos dele continuam) e, só para o botão com ponteiro
fino, o "44px é piso" do README.

## Contexto

Em 2026-11-17 o dono refundou o Basalto: o produto deixa de ser o cardápio e o
diário e vira o livro de receitas na medida da meta, e o rebrand é total — "a
Coluna 2.0 nasce com esta identidade, sem herdar o visual de hoje" (plano,
seção s7). A identidade é o "Relógio de Sol"
(`basalto-reformulacao/design/identidade.md`): uma pedra quieta que segura a
interface e uma cor que anda com a hora de cada refeição. O protótipo aprovado
pelo dono (`prototipo/src/css/00-tokens.css`) traz os tokens prontos, nos dois
temas, e a identidade traz o contraste medido.

O cartão C0 (slipalison/basalto#164) pede a 2.0 mínima: o que a F0 usa, já com a
identidade. O vidro da barra de abas, o prato de colunas, os números que rolam e
o cartão de receita ficam para as fases que os usam (s9).

A 1.13 tinha outra paleta (ametista, jade, orquídea sobre pedra lilás), outra
forma (raio 12/16) e outro tipo (ADR-023). Nada disso sobrevive.

## Decisão

### 1. A pedra: os tokens semânticos passam a ter os nomes da identidade

| papel | token | claro | escuro |
|---|---|---|---|
| fundo do app | `--co-bg` | `#E9EDEA` | `#101517` |
| painel (cartão, folha, grupo) | `--co-surface` | `#F6F8F6` | `#182023` |
| rebaixado (trilho, campo, faixa, linha escolhida, hover) — fundo de texto | `--co-surface-2` | `#DDE3DF` | `#0B0F10` |
| pressionado, trilho de barra — **não** é fundo de texto | `--co-surface-3` | `#CFD7D2` | `#222C2D` |
| texto principal, botão primário | `--co-ink` | `#142024` | `#E8EEEB` |
| texto secundário | `--co-ink-2` | `#3F4D4A` | `#B4C0BC` |
| legenda, unidade: o piso do texto | `--co-ink-3` | `#56635F` | `#8E9A96` |
| texto sobre a tinta sólida | `--co-on-ink` | `#F3F6F3` | `#101517` |
| fissura (nunca sozinha como limite de controle) | `--co-line` | `#C3CCC7` | `#2C3735` |
| limite de controle e desenho que acompanha texto | `--co-control` | `#6E7B77` | `#7D8A86` |
| anel de foco | `--co-focus` | `#1957C9` | `#8DB4FF` |
| estado, sempre com ícone e texto | `--co-ok` / `--co-warn` / `--co-bad` | `#1D6E44` / `#8A5A00` / `#B3261E` | `#6FD49B` / `#F2C14E` / `#FF8A80` |
| lavado do estado | `--co-ok-soft` / `--co-warn-soft` / `--co-bad-soft` | `#D5EBDD` / `#F5E6C4` / `#F6DAD6` | `#173327` / `#3A2E12` / `#3D1D1B` |
| véu da folha | `--co-scrim` | `rgba(10,16,18,.42)` | `rgba(0,0,0,.6)` |
| sombra do que flutua | `--co-shadow-float`, `--co-shadow-lift` | | |

As primitivas são `pomes-*` (o claro), `basalto-*` (o escuro), `anil-*` (o
foco), `musgo-*`, `ocre-*` e `brasa-*` (os estados). A separação primitiva ×
semântica do ADR-001 continua: componente nenhum lê primitiva.

**Por que os nomes mudam**, e não só os valores: os papéis mudaram. A 1.13 tinha
um acento cromático (`--co-accent`) que fazia de primário, de escolhido, de
foco e de marca ao mesmo tempo. Na identidade, o primário é a própria pedra
(`ink` sólido), o foco tem token próprio, e a cor cromática (a hora) é cor de
LUGAR, nunca de ação. Manter `--co-accent` apontando para a tinta seria um nome
que mente; dois nomes para o mesmo papel é o defeito que o ADR-001 existe para
evitar. A troca, nome por nome:

| 1.13 | 2.0 |
|---|---|
| `canvas` | `bg` |
| `surface-raised`, `surface-sunken` | `surface-2` |
| `track` | `surface-3` |
| `text`, `text-body` | `ink` |
| `text-secondary`, `text-muted` | `ink-2` |
| `text-subtle` | `ink-3` |
| `control-border`, `icon-muted` | `control` |
| `border`, `border-strong`, `overlay-line` | `line` |
| `accent` (primário, escolhido) | `ink` (e `on-ink` para o texto sobre ele) |
| `accent` (foco) | `focus` |
| `accent` (aba e trilho atuais, selo de lugar, tom `accent` do texto) | `hora`, `hora-ink`, `hora-soft` |
| `accent-hover` | `ink-2` |
| `accent-contrast` | `on-ink` |
| `accent-soft` | `hora-soft` (selo), `surface-3` (ligado do botão-ícone, faixa da régua, banda da série) |
| `status`, `status-border` | `ok`, `ok-soft` |
| `danger`, `danger-soft` | `bad`, `bad-soft` |
| `macro-protein`, `macro-carb`, `macro-fat` | `role-protein`, `role-carb`, `role-fat` |
| `overlay` (véu) | `scrim` |
| `overlay` (fundo das barras) | `surface` |
| `shadow-overlay` | `shadow-float` |

As props não mudam: `tone="accent"` e `tone="status"` continuam no `Text`, no
`Dot`, no `Badge`, no `Slat`, no `Legend` e no `Notice`, e passam a pintar a
hora e o `ok`.

### 2. A hora

A cor da hora é OKLCH. O relógio dá o matiz e o croma (`--co-hora-h`,
`--co-hora-c`, por `hourStyle`/`applyHour`, ADR-024); o tema dá a luminosidade
(`--co-hora-l` 0,76/0,72, `--co-hora-ink-l` 0,46/0,80, `--co-hora-soft-l`
0,93/0,27, `--co-hora-soft-c` 0,04/0,05); a folha compõe `--co-hora`
(preenchimento), `--co-hora-ink` (texto) e `--co-hora-soft` (lavado). Texto
sobre `--co-hora` é sempre `--co-on-hora`, a tinta escura fixa nos dois temas.

As três composições são declaradas de novo em cada elemento
(`:root, :root *, :root *::before, :root *::after`). Uma propriedade
personalizada herdada chega RESOLVIDA de onde foi declarada: declarada só no
`:root`, ela viria com o matiz do `:root`, e a hora que um bloco escreve em si
não tingiria nada. O protótipo faz o mesmo. O padrão, sem hora escrita, é o
meio-dia (215 / 0,12).

Quem usa a hora: a aba atual da `TabBar` (ícone e rótulo, com o peso e o
`aria-current`), a marca e o ícone do destino atual do `Rail` e do `NavList`, o
`Badge tone="accent"`, o `Dot tone="accent"` e o `Text tone="accent"`. Nenhum
botão.

### 3. Os papéis do alimento

`--co-role-protein` (h 25), `-carb` (h 80, L +0,06), `-veg` (h 150), `-fruit`
(h 350), `-dairy` (h 240, croma ×0,8) e `-fat` (h 300), com a mesma
luminosidade e o mesmo croma por tema: nenhum grita mais que o outro. O `Dot`,
o `Slat`, o `Legend` e a `MacroBar` os usam.

> **Emenda (ADR-025, adendo):** a "mesma luminosidade" caiu. Os seis papéis passaram a ter luminâncias distintas, com o
> matiz e o croma daqui (a regra de UX da Coluna manda, e o piso vence).

**O 3:1 da paleta de dado cai.** O teste da 1.13 exigia 3:1 da cor de macro
sobre todo fundo; no claro, a luminosidade da identidade (0,70) mede 1,5 a
2,7:1. A identidade vence (fonte 2, acima das ADRs): a cor do dado nunca é o
único sinal — a `MacroBar` sempre traz o nome e a quantidade, o `Dot` é
`aria-hidden` (ADR-005) —, e o WCAG 1.4.11 só exige 3:1 de um gráfico
"necessário para entender o conteúdo". O teste passa a provar o que a
identidade garante: os matizes, a mesma luminosidade, e a distância da tinta de
ação (croma de verdade e luminância longe da `ink`). A frase da regra de UX
"luminâncias distintas entre si" também cedia: a identidade pedia o contrário (ver a emenda acima).

### 4. A forma

Os raios continuam por papel (ADR-004), com os números da identidade: controle
14px, cartão (contêiner) 22px, folha 28px nos dois cantos de cima, diálogo
24px, chip e segmentado em pílula, conteúdo reto. O raio de dentro do trilho
(`--co-radius-inset`) é 10,5px: 14 por fora, menos 1,5 de limite, menos 2 de
respiro.

O limite de controle passa a 1,5px (`--co-control-width`) em `--co-control`:
campo, busca, chip, marca de escolha, segmentado, stepper, seta do carrossel,
fileira de abas, e os botões comum (`secondary`) e de perigo. A fissura que só
separa continua com 1px em `--co-line`.

A sombra fica só no que flutua: a folha (`--co-shadow-float`) e o degrau curto
do destino atual do trilho (`--co-shadow-lift`). Cartão comum não tem sombra, e
nada tem barra colorida na lateral — o `Notice` perde a dele e passa a ser o
fundo rebaixado com o ícone e o título (o `status`, o lavado `ok-soft`). O selo
do `EmptyState` é o hexágono, o sinal da marca, por `clip-path` no CSS.

### 5. O movimento

"A pedra assenta, o sol desliza." Os tempos e as curvas da identidade:
`--co-duration-press` 90ms, `-quick` 160ms, `-base` 260ms, `-slow` 420ms,
`-roll` 700ms; `--co-ease-settle`, `-spring`, `-move` e `-exit`. O botão
assenta em 0,97 no tempo do toque, abaixo dos 100ms do piso de resposta. As
animações só mexem em `transform` e `opacity` (e nas travas de toque do
ADR-013, que não movem nada). Com `prefers-reduced-motion` a transição vira
corte, o botão não escala, e as travas de toque continuam; a entrada que subia
(a folha por cima) não corta, esmaece em `--co-duration-reduced`, 120ms, só na
opacidade (`@keyframes co-esmaecer`), como a identidade pede ("deslocamento e
escala viram esmaecer de 120 ms"). Adendo do lote 1: a primeira redação desta
seção dizia "tudo vira corte", e o token de 120ms existia sem uso.

### 6. A escala de letra e o botão por ponteiro

A escala da identidade e do plano s7, acima dos pisos do ADR-021 (que
continuam): corpo, campo e botão 17px; legenda (`caption`), secundário
(`callout`) e nota (`footnote`) 14px; caixa alta (`label`, `micro`) 13px; aba
11px; `subhead`, `Chip` e `SegmentedControl` 13px (o dono os fixou no
ADR-021); `headline` 17px semibold; `numeral` 56px; e o título de tela
(`title-lg`) 26px no aparelho de toque e 30px com ponteiro fino.

O botão (s7): no toque, o comum tem 44px e o principal (`size="lg"`) 50px; com
ponteiro fino, 40 e 46px. O `IconButton` acompanha, para ficar da altura do
botão ao lado. Campo, busca, chip e segmentado ficam nos 44px do toque, que o
plano não muda.

**A pergunta é o ponteiro, e não a largura**: tudo isso mora num
`@media (pointer: fine)`. O telefone deitado continua de toque (s7, "Deitado, o
telefone mantém o layout de celular"), e um navegador que não responda à
consulta fica com o maior alvo. O "44px é piso" do README vale para o toque; com
ponteiro fino o piso é o do WCAG 2.5.8 (24px), e o botão de 40px fica acima
dele. É a mesma regra que a guarda de UX do Basalto aplica: 44px num projeto de
toque, 24px com ponteiro.

### 7. Sem o vidro

A barra de abas e a barra de ação perdem o desfoque e o fundo com alfa: ficam
opacas, na `--co-surface`, com a fissura em cima. O vidro é da F4 (s9), com o
rótulo que se adapta ao que passa por baixo; trazê-lo agora, sem isso, seria um
vidro que não passa no piso. A faixa sob o relógio (ADR-012) continua com o
desfoque em degradê, que a identidade quer.

## Medido

**No teste de unidade** (`src/tokens/contraste.test.ts`, sobre a fonte dos
tokens, nos dois temas; o pior caso de cada par):

| | claro | escuro |
|---|---|---|
| texto (`ink`, `ink-2`, `ink-3`, `ok`, `warn`, `bad`) sobre `bg`, `surface`, `surface-2` | 4,55:1 (`warn` sobre `surface-2`) | 5,68:1 (`ink-3` sobre `surface`) |
| limite de controle sobre os mesmos fundos | 3,39:1 (sobre `surface-2`) | 4,61:1 (sobre `surface`) |
| anel de foco, com `surface-3` | 4,40:1 (sobre `surface-3`) | 6,89:1 (sobre `surface-3`) |
| `hora-ink` a cada 15 minutos do dia, sobre os fundos de texto | 4,81:1 (12h45, `surface-2`) | 7,87:1 (16h30, `surface`) |
| `on-hora` sobre `hora`, o dia inteiro | 7,25:1 | 6,27:1 |
| contra a identidade (sobre `bg`) | ink 14,1 · ink-2 7,5 · ink-3 5,3 · control 3,7 · focus 5,5 | 15,6 · 9,8 · 6,3 · 5,1 · 8,9 |

A hora é medida pelos dois jeitos de trazer uma OKLCH fora do sRGB de volta (o
corte por canal e a redução de croma da CSS Color 4): o piso vale nos dois.

**No Chromium 1248 (Playwright 1.63)**, sobre o catálogo construído
(`npm run build-storybook`): o axe-core 4.14 com as etiquetas WCAG 2.0/2.1/2.2
A e AA, nas 156 histórias, nos dois temas (312 rodadas), sem nenhuma violação
de contraste; o pior caso de texto medido foi 4,82:1 no claro (legenda `ink-3`
sobre a linha escolhida, `surface-2`) e 5,27:1 no escuro (a contagem da busca
sobre a folha). A rodada achou a caixa que rola da história "Sobre o conteúdo"
da `TabBar` sem parada do Tab, e ela foi consertada na mesma versão. Sobra um
achado que não é da 2.0: o `label-content-name-mismatch` nos itens do `NavList`
com linha de baixo ou número à direita (5 histórias, nos dois temas). O nome do
item é o rótulo, e a linha de baixo é descrição, de propósito (o teste "o nome é
o rótulo" diz por quê); o WCAG 2.5.3 pede que o nome contenha o rótulo visível,
e contém — a regra do axe compara com o texto inteiro do botão. Fica com o
dono: trocar exige pôr a linha de baixo no nome. E num aplicativo Vite mínimo, com o `dist/` desta versão,
servido com a CSP do Basalto:

| | toque (Pixel 7, `pointer: coarse`) | ponteiro (1280px, `pointer: fine`) |
|---|---|---|
| `Button` comum / principal | 44 / 50px | 40 / 46px |
| `IconButton` / `lg` | 44 / 50px | 40 / 46px |
| `title-lg` | 26px, 700, 88%, Bricolage Grotesque | 30px, 700, 88%, Bricolage Grotesque |
| corpo | 17px | 17px |
| violações de CSP, `<style>` no documento, requisições para fora | 0, 0, 0 | 0, 0, 0 |

## Consequências

- **É quebra de compatibilidade**, e a versão é a 2.0.0: os tokens semânticos
  mudam de nome (a tabela acima), as primitivas de antes saem, a escala de
  letra, os raios, as alturas do botão e os tokens de movimento mudam, e o
  `semanticTokens`/`SemanticToken` seguem os nomes novos. Nenhum componente
  saiu, e nenhuma prop mudou de nome; o `Button` ganhou o `ref`.
- **A barra de ação continua com UMA fileira de 65px**, medida para o botão
  comum de 44px (ADR-013). Um `Button size="lg"` (50px) dentro dela passaria da
  fileira no toque; a camada da base do celular é redesenhada na F4.
- **Quem lia `--co-accent`, `--co-canvas` ou `--co-text-*` no CSS do app**
  precisa trocar pelo nome novo. O Basalto reconstrói a casca na F0-2, já na
  2.0.
- **A dívida #59 da regra de UX** perde a parte das cores de macro (agora são os
  papéis do alimento da identidade); fica a da escala de espaço.
- O que a 2.0 não traz e a identidade descreve — o prato de colunas, os números
  que rolam, o relógio do dia, o cartão de receita, a malha hexagonal de fundo,
  o vidro — entra com a fase que o usar, cada um com a sua ADR.
