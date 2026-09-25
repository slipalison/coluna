# Coluna

Design system do [Basalto](https://github.com/slipalison/basalto): tokens, tema
claro e escuro, e componentes atômicos em React.

> Coluna basáltica é o prisma que a lava deixa ao esfriar devagar. É de onde
> vêm o grid, as ripas das barras e a aresta viva do conteúdo.

```bash
npm install @slipalison/coluna
```

```tsx
import { ThemeProvider, Stat, Reckoning, Group, MacroBar } from "@slipalison/coluna";
import "@slipalison/coluna/styles.css";

export function App() {
  return (
    <ThemeProvider>
      <Stat label="Restante" value="995" unit="kcal" size="hero" />

      {/* A conta que produziu o número fica aberta embaixo dele. */}
      <Reckoning
        lines={[
          { label: "Meta do dia", value: "1.917" },
          { label: "Alimentos registrados", value: "− 922" },
          { label: "Restante", value: "995", total: true },
        ]}
      />

      <Group label="Macros" inset="dot">
        <MacroBar name="Proteína" value={68} target={135} kind="protein" />
        <MacroBar name="Carboidrato" value={95} target={225} kind="carb" />
        <MacroBar name="Gordura" value={30} target={53} kind="fat" />
      </Group>
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
| primitiva | `--co-amethyst-500: #a882f5` | não |
| semântica | `--co-accent: var(--co-amethyst-500)` | **sim** |

Componente nenhum lê primitiva, e nenhum escreve cor literal. Um `#a882f5`
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

### 44px é piso, não sugestão

Não existe `size="sm"` no `Button`. A ausência é a decisão: um alvo de 32px
passa no desenho, some no uso, e volta como "o app é difícil de clicar no
celular". Quem precisa de algo menor não precisa de um botão — precisa de um
link dentro de um texto.

### Aviso informa, nunca bloqueia

O `Notice` não tem variante de erro, não tem fundo vermelho e não exige ser
fechado. Isso é decisão de produto, não lacuna: quando um número sai do que a
literatura sustenta, o app **diz** o que mudou e por quê, e depois registra a
escolha da pessoa do mesmo jeito
([ADR-006 do Basalto](https://github.com/slipalison/basalto/blob/main/docs/adr/006-limites-de-escopo.md)).

O único vermelho do sistema é o `Button variant="danger"`, e ele existe por uma
razão concreta: apagar a conta apaga os dados de verdade.

### O contêiner arredonda, o conteúdo é reto

O raio depende do **papel** do elemento, e não do gosto de quem monta a tela:

| papel | token | onde |
|---|---|---|
| vitrine que segura conteúdo | `--co-radius-container` (16px) | cartão, grupo, aviso |
| objeto que se toca | `--co-radius-control` (12px) | botão, trilho do segmentado |
| o que mora dentro do trilho | `--co-radius-inset` (9px) | opção do segmentado |
| selo | `--co-radius-pill` | `Badge` |
| **pedra** | `--co-radius-content` (0) | ponto, ripa, barra, marca, fio |

`inset` não é número solto: raio interno = raio externo − folga. Com 12 por fora
e 3 de folga, o de dentro é 9 — qualquer outro valor faz o canto de dentro
correr paralelo ao de fora com espessura variável.

A curva organiza os blocos; a aresta viva continua onde o desenho tem textura, e
é ali que a identidade mora ([ADR-004](docs/adr/004-raio-conteiner-e-conteudo.md)).

### Cor nunca é o único sinal

`Dot` é sempre `aria-hidden`. `MacroBar` renderiza ponto, **nome** e
**quantidade** — os três, sempre. `TabBar` marca a aba atual com cor, **peso** e
`aria-current`. `ListRow` com `mark` vira `role="radio"`, e não um botão que só
parece marcado.

Junto vem um piso de token: **`--co-text-subtle` é o texto menos contrastado que
o sistema admite**, e ele passa em 4,5:1 sobre `--co-surface`. Abaixo dele só
existe `--co-icon-muted`, que passa em 3:1 e serve para **desenho**, nunca para
texto ([ADR-005](docs/adr/005-cor-nunca-sozinha.md)).

---

## O que tem dentro

**Átomos** — `Text` `Stack` `Grid` `Surface` `Screen` `Divider` `Dot` `Button`
`IconButton` `Icon` `Badge` `Slat` `Chip` `Input` `SearchField` `Series`
`VisuallyHidden`

**Moléculas** — `Group` `ListRow` `Reckoning` `MacroBar` `Stat` `Notice`
`SegmentedControl` `Stepper` `ScreenHeader` `PageHeader` `TabBar` `Rail`
`NavList` `Pager` `Field` `Sheet` `Legend` `Ruler` `Disclosure` `EmptyState`
`Diff`

**Padrões** — no catálogo, `Padrões/Tela do diário` monta a tela do telefone e
`Padrões/Desktop` monta três do desktop (diário, ajustes, receitas), só com
peças do sistema.

**Tema** — `ThemeProvider` `useTheme` `readToken` `semanticTokens`

Alguns que merecem nota:

- **`Group`** é a estrutura central: um contêiner arredondado que junta linhas
  irmãs e as separa por um fio **recuado**. Ele existe para tirar borda da tela
  — a continuidade é o fundo do grupo, o corte é um fio de 1px, e a hierarquia
  volta a ser feita de peso e cor. O fio sai de `::before` no filho, então a
  lista pode vir de `.map()` sem intercalar separador e não sobra fio na última
  linha. Coisas que devem ficar grudadas — uma linha e o painel que abre embaixo
  dela — vão num `<div>` só, como um filho.
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
  não aparece como acionável para o leitor de tela.
- **`Stack`** é como **todo** grupo de irmãos deve ser espaçado. Espaço feito de
  `margin` no filho some quando alguém reordena, remove ou duplica um item;
  `gap` é do contêiner e sobrevive.
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
  entra, dá a volta no Tab, sai no Esc e **volta para quem abriu**.
- **`Rail`** é a contraparte da `TabBar`, e as duas existem porque a diferença
  entre telefone e desktop não é de tamanho, é de quantidade: embaixo cabem
  quatro destinos e o resto vira gaveta; na lateral cabem os sete. Os grupos são
  por **frequência** — "Todo dia" e "De vez em quando" põem as quatro coisas de
  sempre onde a mão já vai.
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
  contagem de resultados anunciada quando muda. O atalho (`/`) traz o foco de
  qualquer ponto da página — menos de dentro de outro campo, onde a barra
  continua sendo barra.
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

---

## Desenvolver

```bash
npm install       # o `prepare` já gera os tokens
npm run tokens    # tokens/*.json -> src/tokens/{tokens.css,gerado.ts}
npm test          # 189 testes, piso de 80% em linha, ramo, função e comando
npm run build     # dist/coluna.js + dist/index.d.ts + os dois CSS
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
