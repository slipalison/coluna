# Coluna

Design system do [Basalto](https://github.com/slipalison/basalto): tokens, tema
claro e escuro, e componentes atômicos em React.

> Coluna basáltica é o prisma que a lava deixa ao esfriar devagar. É de onde
> vem o grid, as ripas das barras e a recusa a cantos arredondados.

```bash
npm install @slipalison/coluna
```

```tsx
import { ThemeProvider, Stat, MacroBar, Button } from "@slipalison/coluna";
import "@slipalison/coluna/styles.css";

export function App() {
  return (
    <ThemeProvider>
      <Stat label="Restante hoje" value="995" unit="kcal" caption="de 1.917 kcal · a meta de hoje" size="hero" />
      <MacroBar name="Proteína" value={68} target={135} />
      <Button icon="plus" size="lg" full>Registrar</Button>
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

### Cantos retos

O raio máximo é 4px, e a maior parte dos componentes usa 0. Basalto lasca em
coluna hexagonal, não em pílula.

---

## O que tem dentro

**Átomos** — `Text` `Stack` `Grid` `Surface` `Divider` `Button` `Icon` `Badge`
`Slat` `VisuallyHidden`

**Moléculas** — `SegmentedControl` `Stat` `MacroBar` `Notice` `ListRow`
`Stepper`

**Tema** — `ThemeProvider` `useTheme` `readToken` `semanticTokens`

Alguns que merecem nota:

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
npm install
npm test          # 67 testes, piso de 80% em linha, ramo, função e comando
npm run build     # dist/coluna.js + dist/index.d.ts + os dois CSS
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
