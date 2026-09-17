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
`Icon` `Badge` `Slat` `VisuallyHidden`

**Moléculas** — `Group` `ListRow` `Reckoning` `MacroBar` `Stat` `Notice`
`SegmentedControl` `Stepper` `ScreenHeader` `TabBar`

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
npm test          # 76 testes, piso de 80% em linha, ramo, função e comando
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
