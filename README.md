# Coluna

Design system do [Basalto](https://github.com/slipalison/basalto): tokens, tema
claro e escuro, e componentes atômicos em React.

> Coluna basáltica é o prisma que a lava deixa ao esfriar devagar. É de onde
> vêm o grid, as ripas das barras e a aresta viva do conteúdo.

Desde a 2.0, na identidade **"Relógio de Sol"**: uma pedra quieta que segura a
interface e uma cor que anda com a hora de cada refeição
([ADR-022](docs/adr/022-a-identidade-relogio-de-sol.md)).

```bash
npm install @slipalison/coluna
```

```tsx
import { Button, Stat, ThemeProvider, hourStyle } from "@slipalison/coluna";
import "@slipalison/coluna/styles.css";

export function App() {
  return (
    <ThemeProvider>
      <Stat label="Meta do dia" value="1.950" unit="kcal" caption="Na medida da sua meta." />

      {/* A cor da hora é cor de lugar: o bloco do almoço leva a hora dele. */}
      <section style={hourStyle("12:30")}>…</section>

      {/* O primário é a pedra: a tinta sólida, nunca a cor da hora. */}
      <Button size="lg">Comer esta hoje</Button>
    </ThemeProvider>
  );
}
```

---

## Instalar

O pacote vive no registro do GitHub, e **ele exige token mesmo sendo público** —
ao contrário do `ghcr.io`, que serve imagem pública sem autenticação. A
documentação do GitHub é explícita: *"You need an access token to publish,
install, and delete private, internal, and public packages."*

Na máquina, uma vez:

```bash
# PAT clássico com o escopo read:packages
export NODE_AUTH_TOKEN=ghp_...
```

E no repositório que consome, um `.npmrc` versionado **sem o token**:

```ini
@slipalison:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

No GitHub Actions, o `GITHUB_TOKEN` do próprio run basta — não há segredo novo
para rotacionar:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    registry-url: https://npm.pkg.github.com
    scope: "@slipalison"
- run: npm ci
  env:
    NODE_AUTH_TOKEN: ${{ github.token }}
```

---

## As decisões que moldam tudo

### Token semântico, não valor

Duas camadas, e a separação entre elas é o que faz o tema funcionar:

| camada | exemplo | muda com o tema? |
|---|---|---|
| primitiva | `--co-pomes-100: #e9edea` | não |
| semântica | `--co-bg: var(--co-pomes-100)` | **sim** |

Componente nenhum lê primitiva, e nenhum escreve cor literal. Um `#e9edea`
escrito à mão sobrevive ao tema claro sem reclamar — e o defeito só aparece na
tela de quem ligou o claro.

A fonte é `tokens/*.json`, no formato
[W3C Design Tokens](https://tr.designtokens.org/format/); o **Style Dictionary**
gera `src/tokens/tokens.css` e a lista tipada em `src/tokens/gerado.ts`. Os dois
são **gerados e não versionados** — `npm run tokens` os escreve, e `build`,
`test` e `prepare` chamam isso. Arquivo gerado dentro do repositório convida a
editar o gerado em vez da fonte, e a próxima geração apaga a edição sem avisar.

### Tema é atributo no DOM, não estado de React

Trocar de tema não re-renderiza a árvore por causa de cor: muda um
`data-theme`, e o CSS faz o resto. O contexto existe para quem precisa
**saber** o tema — um gráfico em canvas escolhendo a cor da série, o
`theme-color` do manifest — e não para pintar.

`system` **remove** o atributo em vez de escrever o valor resolvido. É isso que
deixa a media query decidir, e o que faz a tela acompanhar se o sistema mudar
com o aplicativo aberto.

```tsx
<ThemeProvider defaultTheme="system">      {/* segue o sistema */}
<ThemeProvider theme={temaDoServidor}>     {/* controlado de fora */}
<ThemeProvider attachTo="element">         {/* tema só nesta subárvore */}
```

### A pedra e a hora

A paleta tem dois papéis, e eles não se misturam
([ADR-022](docs/adr/022-a-identidade-relogio-de-sol.md)):

- **a pedra** — `--co-bg`, `--co-surface`, `--co-surface-2` (o rebaixado, fundo
  de texto), `--co-surface-3` (o pressionado, nunca fundo de texto), as tintas
  `--co-ink`, `--co-ink-2`, `--co-ink-3`, a fissura `--co-line`, o limite de
  controle `--co-control`, o foco `--co-focus` e os estados `--co-ok`,
  `--co-warn`, `--co-bad` com os lavados `-soft`. O botão principal é a própria
  pedra: `--co-ink` sólido.
- **a hora** — `--co-hora` (preenchimento), `--co-hora-ink` (texto) e
  `--co-hora-soft` (lavado), em OKLCH. O tema dá a luminosidade; o relógio dá o
  matiz e o croma, por elemento, sem violar a CSP
  ([ADR-024](docs/adr/024-a-hora-pelo-cssom-e-a-guarda-da-csp.md)):

  ```tsx
  import { applyHour, hourStyle, hourVars } from "@slipalison/coluna";

  hourVars("12:30");                              // { h: 193.1, c: 0.124 }
  <section style={hourStyle("12:30")}>…</section> // pelo CSSOM, nunca pelo atributo
  applyHour(elemento, "20:00");                   // o mesmo, fora do React
  ```

  As paradas são as da identidade — aurora 06h, manhã 09h, meio-dia 12h,
  entardecer 16h, noite 20h —, com interpolação entre elas e pela meia-noite.
  A hora é cor de **lugar** (a aba atual, o selo da refeição), nunca de ação.

### 44px é piso no toque

Não existe `size="sm"` no `Button`. A ausência é a decisão: um alvo de 32px
passa no desenho, some no uso, e volta como "o app é difícil de clicar no
celular". Quem precisa de algo menor não precisa de um botão — precisa de um
link dentro de um texto.

No aparelho de toque o botão comum tem 44px e o principal 50px; com ponteiro
fino (o desktop), 40 e 46px, acima dos 24px que o WCAG 2.5.8 pede com
ponteiro. A pergunta é o ponteiro (`@media (pointer: fine)`), e não a largura:
o telefone deitado continua de toque.

### O piso de UX não se negocia

Contraste de texto e de limite de controle, tamanho de letra, alvo de 44px e o
comportamento de cada componente interativo têm limiar escrito em
[`.claude/rules/ux.md`](.claude/rules/ux.md), e o limiar que depende de um
token ou de um componente é provado aqui, com teste, nos dois temas
([ADR-016](docs/adr/016-o-piso-de-ux-mora-no-sistema.md)). Achado do piso não
vira aviso: o PR não entra.

Desde a 1.13.1 a letra cumpre o piso em toda a folha, e um teste reprova a
letra que fica abaixo do piso do papel dela
([ADR-021](docs/adr/021-a-escala-de-letra-no-piso.md)). Desde a 2.0 a escala é
a do "Relógio de Sol", acima do piso: corpo, campo e botão de 17px, legenda e
texto secundário de 14px, caixa alta de 13px, rótulo de aba de 11px, e o título
de tela de 26px no toque e de 30px com ponteiro fino.

### Aviso informa, nunca bloqueia

O `Notice` não tem variante de erro, não tem fundo vermelho e não exige ser
fechado. Isso é decisão de produto, não lacuna: quando um número sai do que a
literatura sustenta, o app **diz** o que mudou e por quê, e depois registra a
escolha da pessoa do mesmo jeito
([ADR-006 do Basalto](https://github.com/slipalison/basalto/blob/main/docs/adr/006-limites-de-escopo.md)).

O único vermelho de ação do sistema é o `Button variant="danger"`, e ele existe
por uma razão concreta: apagar a conta apaga os dados de verdade. O outro dono
do `--co-bad` é o erro de campo, sempre com ícone e texto.

### O contêiner arredonda, o conteúdo é reto

O raio depende do **papel** do elemento, e não do gosto de quem monta a tela
(os números são os da identidade, [ADR-022](docs/adr/022-a-identidade-relogio-de-sol.md)):

| papel | token | onde |
|---|---|---|
| vitrine que segura conteúdo | `--co-radius-container` (22px) | cartão, grupo, aviso |
| objeto que se toca | `--co-radius-control` (14px) | botão, campo, trilho do stepper |
| o que mora dentro do trilho | `--co-radius-inset` (10,5px) | botão do stepper e do paginador, aba |
| a folha que sobe do rodapé | `--co-radius-sheet` (28px, em cima) | `Sheet` |
| diálogo | `--co-radius-dialog` (24px) | |
| selo, chip, segmentado | `--co-radius-pill` | `Badge`, `Chip`, `SegmentedControl` |
| **pedra** | `--co-radius-content` (0) | ponto, ripa, barra, marca, fio |

`inset` não é número solto: raio interno = raio externo − folga. Com 14 por fora,
1,5 de limite e 2 de respiro, o de dentro é 10,5 — qualquer outro valor faz o
canto de dentro correr paralelo ao de fora com espessura variável.

O limite de controle tem 1,5px (`--co-control-width`) em `--co-control`; a
fissura que só separa tem 1px em `--co-line`. A sombra fica só no que flutua.

A curva organiza os blocos; a aresta viva continua onde o desenho tem textura, e
é ali que a identidade mora ([ADR-004](docs/adr/004-raio-conteiner-e-conteudo.md)).

### Cor nunca é o único sinal

`Dot` é sempre `aria-hidden`. `MacroBar` renderiza ponto, **nome** e
**quantidade** — os três, sempre. `TabBar` marca a aba atual com a cor da hora,
**peso** e `aria-current`. `ListRow` com `mark` vira `role="radio"`, e não um
botão que só parece marcado.

Junto vem um piso de token: **`--co-ink-3` é o texto menos contrastado que o
sistema admite**, e ele passa em 4,5:1 sobre todo fundo de texto, nos dois
temas. Abaixo dele só existe `--co-control`, que passa em 3:1 e serve para
**desenho** e para o limite de controle, nunca para texto
([ADR-005](docs/adr/005-cor-nunca-sozinha.md), [ADR-022](docs/adr/022-a-identidade-relogio-de-sol.md)).
Os papéis do alimento (`--co-role-*`) têm a mesma luminosidade de propósito:
nenhum grita mais que o outro, e o nome e a quantidade vão sempre ao lado.

---

## O que tem dentro

**Átomos** — `Text` `Stack` `Grid` `Surface` `Screen` `Divider` `Dot` `Button`
`IconButton` `Icon` `Badge` `Slat` `Chip` `Input` `SearchField` `Series`
`VisuallyHidden`

**Moléculas** — `Group` `ListRow` `Reckoning` `MacroBar` `Stat` `Notice`
`SegmentedControl` `Stepper` `ScreenHeader` `PageHeader` `TabBar` `Rail`
`NavList` `Pager` `Field` `Sheet` `Legend` `Ruler` `Disclosure` `EmptyState`
`Diff` `Deck` `Tabs`

**Padrões** — no catálogo, `Padrões/Casca` monta a casca vazia do Basalto
(Hoje, Livro e Você) no celular, com e sem a área segura emulada pelos tokens, e
no desktop, só com peças do sistema.

**Tema** — `ThemeProvider` `useTheme` `readToken` `semanticTokens`

**Hora** — `hourVars` `hourStyle` `applyHour` `hourStops`

Alguns que merecem nota:

- **`Group`** é a estrutura central: um contêiner arredondado que junta linhas
  irmãs e as separa por um fio **recuado**. Ele existe para tirar borda da tela
  — a continuidade é o fundo do grupo, o corte é um fio de 1px, e a hierarquia
  volta a ser feita de peso e cor. O fio sai de `::before` no filho, então a
  lista pode vir de `.map()` sem intercalar separador e não sobra fio na última
  linha. Coisas que devem ficar grudadas — uma linha e o painel que abre embaixo
  dela — vão num `<div>` só, como um filho. Com `role` (um `radiogroup`), o
  grupo amarra sozinho o rótulo, a nota e o `error` ao controle, como o `Field`
  faz com o campo.
- **`Reckoning`** é a conta aberta, e ela carrega a premissa do produto — a
  pessoa informa, o app calcula — como desenho, não como frase. Quando o número
  mostrado é arredondado, a expressão mostra a casa decimal: `1.433 + 937 =
  2.371` não fecha para quem confere; `1.433,4 + 937,5 = 2.370,9 → 2.371` fecha.
- **`Slat`** é a barra do sistema, desenhada como colunata vista de cima. Sai de
  `repeating-linear-gradient`, e não de um nó por ripa: 24 ripas × 3 barras
  seriam 72 elementos para pintar o que duas regras de CSS pintam. Sem `label`
  ela sai `aria-hidden` — quase toda barra aqui acompanha o número que ilustra,
  e anunciar "52 por cento" logo depois de "68 de 135 g" é repetir.
- **`SegmentedControl`** é um `radiogroup` com navegação por **seta** e tabindex
  itinerante. Um grupo de seis opções que exige seis Tabs para atravessar é um
  grupo que ninguém atravessa.
- **`ListRow`** vira `<button>` quando recebe `onClick`, e `<div>` quando não
  recebe. Nunca um `<div>` com `onClick`: não pega foco, não responde a Enter,
  não aparece como acionável para o leitor de tela. A `description` é a linha
  de baixo — o resumo da refeição sob o nome —, numa linha só, como a do
  `NavList`: o que passa vira reticências, e a linha não muda de altura. O
  texto inteiro continua no DOM e no nome do botão
  ([ADR-015](docs/adr/015-a-linha-de-baixo-da-lista.md)).
- **`Stack`** é como **todo** grupo de irmãos deve ser espaçado. Espaço feito de
  `margin` no filho some quando alguém reordena, remove ou duplica um item;
  `gap` é do contêiner e sobrevive. Com `scroll`, é uma fileira que não quebra
  e rola de lado — os filhos não encolhem, e o anel de foco cabe na caixa que
  rola. O `ref` chega ao elemento (o hospedeiro de um portal, o foco ao montar)
  sem `forwardRef`.
- **`Field`** amarra rótulo, controle, dica e erro. O controle chega por
  **função**, e não como filho que o `Field` clona: clonar é mágica que some no
  primeiro dia em que alguém envolve o campo num `<div>` para posicioná-lo — o
  clone acerta o `<div>`, os atributos não chegam ao controle, e isso não
  aparece na tela, só no leitor de tela de quem não está aqui para reclamar.
- **`Sheet`** é o mesmo painel nas duas larguras: `overlay` sobe do rodapé no
  telefone, `inline` abre dentro do cartão que o chamou no desktop. A prop é a
  regra **"largura nunca vira modal"** escrita como código — trocar a porção de
  uma refeição não pode escurecer a tela e esconder a conta do dia, que é
  justamente o número que faz a pessoa escolher a porção. Em `overlay` o foco
  entra, dá a volta no Tab, sai no Esc e **volta para quem abriu**; e ela passa
  os primeiros 400ms sem receber ponteiro, contra o toque duplo (adendo 1.8.2
  do [ADR-013](docs/adr/013-barra-de-acao.md)). `initialFocus` diz onde o foco
  pousa ao abrir: `"first-field"` (o primeiro campo do corpo — a folha de
  buscar, em que se abre e já se escreve) ou um `ref`. É o único jeito de focar
  dentro da folha ao abrir: a folha grava quem abriu **antes** de mover o foco,
  e quem foca sozinho (`autoFocus`, um `ref` que chama `focus()`) roda antes
  dela e vira "quem abriu" — o foco cai no começo da página ao fechar. O corpo
  que rola tem 4px de respiro em cima, para o anel de foco do campo encostado
  no topo não ser cortado. Desde a 1.11.1, a `SearchField` no corpo fica presa
  no topo dele, com o rótulo junto e o fundo da folha, e o corpo recua a
  rolagem a altura dela: o Tab que rola a lista não deixa mais a moldura à
  vista sem o rótulo, e a linha que recebe o foco para abaixo da busca. Vale
  para toda folha, sem prop
  ([ADR-017](docs/adr/017-a-busca-da-folha-fica-presa.md)). Desde a 1.11.2,
  em `overlay` o corpo é uma parada do Tab (`tabIndex={0}`) e uma região com o
  nome do título, com o anel por dentro: numa folha só de texto, quem usa
  teclado foca o corpo e rola com as setas e o Page Down. Na `inline`, que não
  rola, nada muda ([ADR-018](docs/adr/018-o-corpo-da-folha-se-rola-pelo-teclado.md)).
  Desde a 1.13.0, `size="full"` faz da `overlay` o card flutuante em tela
  cheia: o painel (`data-size="full"`) tem a altura da janela menos uma faixa
  de 24px do véu abaixo do relógio, e essa altura não muda com o conteúdo —
  trocar de aba ou de card não faz o painel pular. O cabeçalho e o `footer`
  ficam fixos, e o corpo ocupa o resto e rola inteiro quando o conteúdo não
  cabe (320px, letra a 200%). A largura é a de sempre (520px de teto). O padrão
  é `size="auto"`, a folha de antes; em `inline`, `size` não muda nada. A
  composição de referência é a história "Receita em tela cheia"
  ([ADR-020](docs/adr/020-a-folha-de-altura-cheia.md)).
- **`Deck`** é o carrossel de cards: um card de cada vez, que se troca
  arrastando para os lados, com um giro leve. O gesto nunca é o único caminho:
  embaixo ficam as duas setas (44px, com o limite de controle) e, com o foco no
  card ou numa seta, as setas do teclado, Home e End. Em toda troca o foco vai
  para o card novo, um grupo com `aria-roledescription="card"` e o nome de
  `cardLabel` ("Almoço, 2 de 4"). O indicador marca a vaga cheia com um traço
  largo e as vazias com um anel — forma, e não só cor. Com
  `prefers-reduced-motion` o card não anda com o dedo e nada anima
  ([ADR-019](docs/adr/019-o-carrossel-de-cards-e-as-abas-no-card.md)). Direto
  no corpo de uma `Sheet` com `size="full"`, ele cresce até o rodapé e as setas
  ficam embaixo, no mesmo lugar; e, desde a 1.13.0, o dedo que anda de lado
  sobre o conteúdo de uma aba também arrasta o card
  ([ADR-020](docs/adr/020-a-folha-de-altura-cheia.md)).
- **`Tabs`** são as abas dentro de um card: `tablist`, `tab` e `tabpanel`, com
  setas que dão a volta, Home e End, e a aba focada abre. O painel rola por
  dentro quando o conteúdo não cabe (letra grande, 320px) e é uma parada do
  Tab, para rolar pelo teclado — por isso é um alvo, e nunca mede menos que
  `--co-target-min`; a fileira de nomes compridos rola de lado dentro de si. A página nunca rola de lado
  ([ADR-019](docs/adr/019-o-carrossel-de-cards-e-as-abas-no-card.md)).
- **`Rail`** é a contraparte da `TabBar`, e as duas existem porque a diferença
  entre telefone e desktop não é de tamanho, é de quantidade: embaixo cabem
  quatro destinos e o resto vira gaveta; na lateral cabem os sete. Os grupos são
  por **frequência** — "Todo dia" e "De vez em quando" põem as quatro coisas de
  sempre onde a mão já vai.
- **A área segura** do aparelho — o relógio e a ilha em cima, o indicador de
  início embaixo, o entalhe nas laterais em paisagem — é token **público**:
  `--co-safe-top`, `--co-safe-right`, `--co-safe-bottom` e `--co-safe-left`,
  declaradas uma vez no `:root`, cada uma com `env(safe-area-inset-*, 0px)`.
  Quem as lê: a `Screen` (soma a de cima e a de baixo ao respiro, e usa o
  maior entre 16px e o inset nas laterais), a `TabBar` (os destinos entram
  `--co-space-14` na área de baixo, com o piso de 10px: 20px de rodapé com o
  indicador de 34px — nunca a soma), a reserva da `Screen` com `tabBar` (104px
  sem área segura, e cresce o que a barra cresce embaixo, com a última linha
  sempre 31px acima dela) e a marca do `Rail` (recua a de cima, aberto e
  recolhido). Sem área segura as quatro valem zero e nada muda de lugar. Quem
  põe alguma coisa colada na borda de cima — um aviso acima da tela — recua
  essa coisa e zera a de cima no que vem depois dela, sem reescrever regra do
  sistema
  ([ADR-011](docs/adr/011-a-area-segura-vira-token-publico.md)):

  ```css
  .app-notices {
    padding-block-start: calc(var(--co-space-16) + var(--co-safe-top));
  }
  .app-notices ~ .co-screen,
  .app-notices ~ .app-shell {
    --co-safe-top: 0px;
  }
  ```
- **`--co-statusbar-height`** é a altura do que o sistema desenha em cima — o
  relógio e a ilha —, declarada no `:root` como `var(--co-safe-top)`. A faixa
  sob o relógio a lê: a `Screen` monta sempre, como primeiro filho, um
  `.co-screen__statusbar` `aria-hidden`, fixo no topo, com a área de cima mais
  um terço, opaco em `--co-bg` até 75% e esmaecendo no resto, com o
  desfoque na mesma máscara. Com a tela rolada, o conteúdo passa por trás dele,
  e não por trás do relógio; sem área segura ele tem 0px. Por ser resolvida no
  `:root`, ela sobrevive ao zero que o consumidor escreve em `--co-safe-top`
  debaixo de um aviso — o relógio não sai do lugar com o aviso de pé. Fora do
  aparelho, quem simula a área escreve as duas
  ([ADR-012](docs/adr/012-faixa-sob-o-relogio-e-respiro-da-barra.md)). A
  mesma conta é o recuo da rolagem da janela: o `:root` declara
  `scroll-padding-top` com o texto da altura da faixa, e o foco do teclado, a
  âncora e o `scrollIntoView` param abaixo dela, e não atrás (WCAG 2.2, 2.4.11).
  Sem área segura o recuo vale 0. Quem rola dentro de um contêiner próprio põe
  o mesmo recuo nele (adendo 1.7.1 do ADR-012).
- **A barra de ação** é a `Screen` com `actionBar`: o nó vai numa barra fixa
  acima da barra de abas (ou na área segura de baixo, sem abas), com o fundo
  opaco dela, à mão do polegar em qualquer rolagem. A barra tem a altura de UMA
  fileira de botão — `--co-actionbar-height`, 65px, declarada no `:root` —, e
  um botão ou dois dão a mesma barra, dividindo a largura; a reserva da tela
  cresce essa fileira, e a última linha continua 31px acima da barra, com e sem
  área segura. Com a `TabBar` como nó em `tabBar`, a ordem do documento — a do
  Tab e a do leitor de tela — é a da tela: conteúdo, barra de ação, abas.
  Vazia (nenhum descendente com conteúdo, atravessando o hospedeiro de um
  portal), ela não pinta e não reserva. E o `:root` recua a rolagem de baixo
  pelo mesmo termo da reserva, 0 sem barras: o Tab para o controle acima das
  barras, e não atrás delas (WCAG 2.2, 2.4.11) — inclusive só com as abas, que
  na 1.7.1 escondiam o foco
  ([ADR-013](docs/adr/013-barra-de-acao.md)). Desde a 1.8.1, o controle que
  acabou de chegar à barra ignora o ponteiro por 400ms (o teclado, não), para
  o segundo toque de um toque duplo não cair na ação da tela seguinte — também
  com movimento reduzido; a janela é da entrada no documento, então ações de
  telas diferentes no mesmo lugar vão em elementos diferentes (`key`). Desde a
  1.8.2, uma `Sheet` `overlay` passa os primeiros 400ms sem receber ponteiro
  (o painel, o que está nele e o véu; o que entra depois disso é tocável na
  hora), e as abas e a barra de ação se rearmam quando ela fecha: o toque
  duplo no botão que abre a folha não cai no que subiu embaixo do dedo, e o
  toque duplo no rodapé dela não troca de aba (a `inline` não arma nada). A
  casca monta a barra assim:

  ```tsx
  <Screen
    tabBar={<TabBar label="Navegação" items={destinos} value={atual} onChange={ir} />}
    actionBar={<Stack direction="row" ref={definirHospedeiro} role="group" aria-label="Ações desta tela" />}
  >
    {tela}
  </Screen>
  ```
- **`Disclosure`** guarda a explicação até alguém pedir, e é `<details>` do
  navegador em vez de um acordeão escrito à mão: estado, teclado, anúncio, busca
  da página achando o texto fechado e impressão abrindo tudo vêm de graça. A
  régua que ele serve é **uma explicação por tela, não por cartão**.
- **`Series`** desenha a linha e nada mais: nenhum eixo, nenhum rótulo, nenhum
  número. Texto dentro do SVG é onde o tema quebra — a cor fica presa no
  desenho — e onde o rótulo escapa da moldura. O número mora no `Stat` ao lado,
  em HTML.
- **`Field layout="row"`** é a medida dentro de um `Group`: nome e nota à
  esquerda, campo à direita, erro embaixo da linha inteira — com a mesma altura
  e a mesma calha da `ListRow`, para as duas dividirem o grupo.
- **`Ruler`** põe várias estimativas do mesmo número numa escala só, com a
  faixa entre elas pintada: a incerteza desenhada, e não descrita. A marca
  usada muda de forma, não só de cor, e os rótulos são HTML, fora do desenho.
- **`Diff`** mostra o que muda se a pessoa confirmar, e **não some** quando os
  dois valores voltam a ser iguais: sumir faria a tela pular por baixo do dedo
  no meio do ajuste.
- **`PageHeader`** é o cabeçalho do desktop: título e linha de baixo à
  esquerda, as ações da página à direita, tudo na mesma base. Não é o
  `ScreenHeader` esticado — no telefone cabe uma ação; no desktop cabem a
  busca, o botão principal e o seletor de período na linha do título.
- **`Pager`** é o anterior/próximo colado ao título que ele troca. Na ponta o
  botão fica `aria-disabled`, e não `disabled`, para o foco não cair no começo
  da página no último toque; e o `current` anuncia o período que chegou.
- **`SearchField`** é `<input type="search">` num marco `search`, com a
  contagem de resultados anunciada quando muda. O `label` aparece **escrito**,
  em cima da moldura, num `<label>` amarrado ao campo — todo campo tem rótulo
  visível, a busca também ([ADR-016](docs/adr/016-o-piso-de-ux-mora-no-sistema.md));
  o `placeholder` é só exemplo. A moldura tem o contorno de controle parado,
  e não só com o foco, para não sumir dentro de uma folha da mesma superfície;
  o campo ocupa a moldura inteira, e a lupa, a contagem e a tecla ficam por
  cima dele sem receber o toque — qualquer ponto da moldura é o campo, pelo
  navegador, sem tratador de clique. Com texto, aparece o ×
  de limpar da coluna (44px, nome em `clearLabel`, "Limpar a busca" por
  padrão), que esvazia pelo `onChange` de quem usa e devolve o foco ao campo;
  o × do navegador fica escondido. O atalho (`/`) traz o foco de qualquer
  ponto da página — menos de dentro de outro campo, onde a barra continua
  sendo barra. O `className` continua na moldura (`.co-search`); o rótulo e a
  moldura moram juntos em `.co-search-field`, que leva o marco e o `full`.
- **`NavList`** é a coluna que escolhe o que a coluna do lado mostra: as
  seções dos Ajustes, a lista das receitas. Não é o `Rail`: o trilho é a
  navegação do aplicativo; esta é a de dentro de uma seção. `opens="page"`
  sai `<nav>`; `opens="detail"` sai grupo, porque ali muda o painel e não a
  página.
- **`Legend`** mora fora da `Series` pelo mesmo motivo de a série não ter
  eixo, e a amostra copia a marca que explica — quadrado, ponto, traço,
  tracejado, faixa.
- **`MacroBar layout="inline"`** põe ponto, nome, barra e número numa linha só,
  para a coluna larga. As colunas se alinham por `--co-macro-name-width` e
  `--co-macro-figure-width`, escritas uma vez no `Group`.
- **`MacroBar layout="compact"`** empilha ponto e nome, o número e a barra
  curta numa coluna de uns 104px — a faixa de três macros do telefone —, sem a
  altura mínima nem o respiro da linha de lista. O texto comprido quebra
  dentro da coluna em vez de vazar para a do vizinho.

---

## Os dois CSS

```ts
import "@slipalison/coluna/styles.css";  // tokens + componentes
import "@slipalison/coluna/tokens.css";  // só a paleta e as escalas
```

O segundo existe para quem precisa dos tokens sem montar um componente React —
o `index.html` do PWA pintando a barra do sistema, uma página estática, um
e-mail.

`src/index.ts` **não** importa o CSS de propósito: um `import "./styles.css"`
ali entraria em qualquer bundle que tocasse em qualquer componente, e quem só
quer um tipo carregaria a folha inteira, inclusive em teste e em Node.

### As fontes vêm junto

A **Bricolage Grotesque** (títulos), a **Figtree** (texto) e a **Sofia Sans
Extra Condensed** (números) moram no pacote, em `dist/fonts/`, e o
`styles.css` as declara com `@font-face` e `url()` relativa. Quem consome **não faz nada** além do
`import "@slipalison/coluna/styles.css"`: o bundler (o Vite, no Basalto)
resolve o caminho e serve cada `.woff2` da própria origem, então a CSP precisa
só de `font-src 'self'` — nenhum CDN de fontes, nenhum `<link>` para o Google
Fonts.

- Dois subconjuntos por família, `latin` e `latin-ext`, com o
  `unicode-range` de cada um: numa página só em português o navegador baixa
  os três `latin`, 139 KB.
- As três são variáveis, e cada `@font-face` declara o intervalo do arquivo:
  todo peso pedido sai desenhado. A Bricolage traz também a largura, e o
  `title-lg` escreve 700 e 88%; o `numeral` escreve 900, na Sofia. Não combine
  `weight` com essas duas variantes.
- `font-display: swap`: o texto aparece na fonte de reserva do token e troca
  quando a fonte chega.
- O `tokens.css` sozinho **não** traz as fontes: ele só as nomeia.
- Para valer offline, o service worker do aplicativo precisa guardar `woff2`
  (o padrão do `vite-plugin-pwa` guarda só `js`, `css` e `html`).

As três são SIL Open Font License 1.1, e a licença de cada uma vai ao lado dos
arquivos (`dist/fonts/OFL-*.txt`). Origem, versão e o que ficou de fora
(o tamanho óptico, itálico, outros subconjuntos) estão no
[ADR-023](docs/adr/023-as-fontes-do-relogio-de-sol.md); o porquê de morarem no
pacote, no [ADR-014](docs/adr/014-as-fontes-moram-no-pacote.md).

### Nada que a CSP recuse

Nenhum componente injeta `<style>` nem escreve o atributo `style`: a CSP de quem
consome (`style-src 'self'`) recusaria. Movimento e cor por elemento vão pelo
CSS de arquivo e pelo CSSOM. Um teste monta todo componente exportado sob uma
vigia, uma varredura lê `src/` e o `npm run build` lê o `dist/`
([ADR-024](docs/adr/024-a-hora-pelo-cssom-e-a-guarda-da-csp.md)).

---

## Desenvolver

```bash
npm install       # o `prepare` já gera os tokens
npm run tokens    # tokens/*.json -> src/tokens/{tokens.css,gerado.ts}
npm test          # 457 testes, piso de 80% em linha, ramo, função e comando
npm run build     # dist/coluna.js + dist/index.d.ts + os dois CSS + dist/fonts/, e a varredura da CSP
npm run referencia # docs/referencia.html, pintada pelo CSS que o pacote publica
```

A esteira é a [compartilhada](https://github.com/slipalison/github-workflows):
versão semântica pelos commits, qualidade com piso de cobertura, sete varreduras
de segurança, e a publicação no npm no mesmo run — porque release criada com o
`GITHUB_TOKEN` não dispara outro workflow.

Commits seguem [Conventional Commits](https://www.conventionalcommits.org/);
a esteira reprova o que estiver fora.

## Decisões registradas

- [ADR-001 — tokens em CSS custom properties](docs/adr/001-tokens-em-css-custom-properties.md)
- [ADR-002 — tema por atributo, com `system` sendo ausência](docs/adr/002-tema-por-atributo.md)
- [ADR-003 — o que é átomo e o que não entra](docs/adr/003-fronteira-do-sistema.md)
- [ADR-004 — o contêiner arredonda, o conteúdo é reto](docs/adr/004-raio-conteiner-e-conteudo.md)
- [ADR-005 — cor nunca é o único sinal](docs/adr/005-cor-nunca-sozinha.md)
- [ADR-006 — o que entrou com o desktop, e o que ficou de fora](docs/adr/006-o-que-entrou-com-o-desktop.md)
- [ADR-007 — a marca de escolha diz quantas](docs/adr/007-a-marca-de-escolha-diz-quantas.md)
- [ADR-008 — a segunda leitura do desktop](docs/adr/008-a-segunda-leitura-do-desktop.md)
- [ADR-009 — a régua e o campo em linha](docs/adr/009-a-regua-e-o-campo-em-linha.md)
- [ADR-010 — o grupo de escolha amarra rótulo, nota e erro](docs/adr/010-o-grupo-amarra-rotulo-nota-e-erro.md)
- [ADR-011 — a área segura vira token público](docs/adr/011-a-area-segura-vira-token-publico.md)
- [ADR-012 — a faixa sob o relógio e o respiro da barra](docs/adr/012-faixa-sob-o-relogio-e-respiro-da-barra.md)
- [ADR-013 — a barra de ação](docs/adr/013-barra-de-acao.md)
- [ADR-014 — as fontes moram no pacote](docs/adr/014-as-fontes-moram-no-pacote.md)
- [ADR-015 — a linha de baixo da `ListRow`](docs/adr/015-a-linha-de-baixo-da-lista.md)
- [ADR-016 — o piso de UX mora no sistema](docs/adr/016-o-piso-de-ux-mora-no-sistema.md)
- [ADR-017 — a busca da folha fica presa no topo](docs/adr/017-a-busca-da-folha-fica-presa.md)
- [ADR-018 — o corpo da folha se rola pelo teclado](docs/adr/018-o-corpo-da-folha-se-rola-pelo-teclado.md)
- [ADR-019 — o carrossel de cards e as abas dentro do card](docs/adr/019-o-carrossel-de-cards-e-as-abas-no-card.md)
- [ADR-020 — a folha de altura cheia](docs/adr/020-a-folha-de-altura-cheia.md)
- [ADR-021 — a escala de letra cumpre o piso](docs/adr/021-a-escala-de-letra-no-piso.md)
- [ADR-022 — a identidade "Relógio de Sol" (Coluna 2.0)](docs/adr/022-a-identidade-relogio-de-sol.md)
- [ADR-023 — as fontes do "Relógio de Sol"](docs/adr/023-as-fontes-do-relogio-de-sol.md)
- [ADR-024 — a hora pelo CSSOM, e a guarda da CSP](docs/adr/024-a-hora-pelo-cssom-e-a-guarda-da-csp.md)
