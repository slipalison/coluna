# ADR-014 — As fontes moram no pacote

**Data:** 2026-10-09
**Status:** aceito

## Contexto

Desde a 1.0 os tokens nomeiam duas famílias:

```css
--co-font-display: "Instrument Serif", "Iowan Old Style", Georgia, serif;
--co-font-body: Archivo, "Helvetica Neue", system-ui, sans-serif;
```

E o pacote não trazia nenhuma das duas: nenhum `@font-face`, nenhum arquivo de
fonte. Nome de família que a página não tem é CSS válido, então nada
reclamava; o navegador seguia a lista e parava na primeira que existisse no
aparelho. Medido no Basalto em 2026-10-09: o título e o numeral saíam em Iowan
Old Style (Apple) ou Georgia, e o resto em Helvetica ou Segoe UI. A cara das
pranchas — a serifa estreita dos títulos e a grotesca da Archivo — sumia do
aplicativo.

Só a referência (`docs/referencia.html`) mostrava as duas, porque o gabarito
dela trazia um `<link>` para o Google Fonts. No Basalto esse caminho nem
existe: a CSP dele é `font-src 'self'`, e fonte de outra origem é recusada.

O mesmo dia mediu um segundo defeito, que só aparece quando a serifa chega: o
`title-lg` sai em **negrito sintético**. O `ScreenHeader` e o `PageHeader`
montam o título num `<h1>` (ou `<h2>`), que a folha do navegador pinta em
`font-weight: bold`; a regra `.co-text[data-variant="title-lg"]` não escrevia
peso, e a Instrument Serif só tem o 400. Sem um 700 no arquivo, o navegador o
inventa, engrossando o traço — um desenho que nenhuma prancha tem.

## Decisão

### 1. Os arquivos vêm no pacote, e a folha os cita por caminho relativo

Os `.woff2` são versionados em `src/fonts/`, com a licença de cada família ao
lado, e o `scripts/construir-css.mjs` os copia para `dist/fonts/`, com o mesmo
caminho relativo. O `@font-face` mora em `src/styles.css`, logo depois do
`@import` dos tokens:

```css
@font-face {
  font-family: "Instrument Serif";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("./fonts/instrument-serif-latin-400-normal.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, …;
}
```

- **Relativa, e igual nos dois lugares.** `url("./fonts/…")` vale a partir de
  `src/styles.css` (que o Storybook e os testes leem) e de `dist/styles.css`
  (que o pacote publica). O bundler de quem consome resolve o caminho a partir
  do arquivo dentro de `node_modules` e emite a fonte como asset da própria
  origem — no Basalto, que usa Vite, `/assets/<nome>-<hash>.woff2`. É o único
  lugar que a CSP `font-src 'self'` aceita.
- **Nenhuma URL de fora.** Um CDN de fontes seria recusado pela CSP do
  consumidor, levaria o endereço de quem abre o aplicativo a um terceiro a cada
  visita, e deixaria a tela do PWA instalado dependendo de uma origem que o
  service worker dele não controla.
- **Nunca `data:`.** A CSP `font-src 'self'` recusa `data:` também. O Vite
  troca por `data:` todo asset menor que `build.assetsInlineLimit` (4096 bytes
  por padrão); o menor arquivo daqui tem 11.604 bytes, e o teste reprova
  qualquer um abaixo do limite.
- **Na folha de componentes, e não na de tokens.** `dist/tokens.css` continua
  só com os tokens: ele NOMEIA as famílias, e quem o usa sozinho (o
  `index.html` do PWA pintando a barra do sistema, uma página estática) não
  carrega 100 KB de fonte para pintar uma cor.
- **Copiadas à mão, como o `@import` é resolvido à mão.** O `src/index.ts` não
  importa a folha (ADR-001 e o comentário do script), então nada do CSS passa
  pelo Vite do pacote. O script falha alto se a folha citar uma fonte que não
  está em `src/fonts/`.

### 2. Quais arquivos, de onde, e em que versão

Os arquivos são os do [Fontsource](https://fontsource.org), sem conversão:
`npm pack` dos dois pacotes num diretório temporário, fora do repositório, e
cópia dos `.woff2`. **Os pacotes não são dependência** — nem de
desenvolvimento: a cópia é o artefato, e o `package.json` não muda.

| pacote de origem | versão | `shasum` do tarball | fonte do Google Fonts |
|---|---|---|---|
| `@fontsource/instrument-serif` | 5.3.0 | `57d45e62debe978653a14b7152299c6d76762fe2` | Instrument Serif v5, 2025-09-05 |
| `@fontsource-variable/archivo` | 5.3.0 | `23048b3182b66023f52a36761795f79e13c6e284` | Archivo v25, 2025-09-08 |

| arquivo | família | subconjunto | peso | bytes | sha256 |
|---|---|---|---|---|---|
| `instrument-serif-latin-400-normal.woff2` | Instrument Serif | `latin` | 400 | 21.032 | `5eb09b5ac0e28b67c2f041c8ba6d244604ca0c0980d65912ab2d47fed84ddc31` |
| `instrument-serif-latin-ext-400-normal.woff2` | Instrument Serif | `latin-ext` | 400 | 11.604 | `290e6267dd833bf5f899eba4c29ad0a9b09dbe53f6075b18af38057159e1ff20` |
| `archivo-latin-wght-normal.woff2` | Archivo | `latin` | 100–900 (variável) | 34.928 | `8f704806dbedeaaeca334b11ec348bc3ac3a439d6431544b3afb54f534ee4967` |
| `archivo-latin-ext-wght-normal.woff2` | Archivo | `latin-ext` | 100–900 (variável) | 32.608 | `ff4f17d21930e36d6d93baba663e624cb767afc3feebf7adaebd82242638de05` |

Os nomes são os do Fontsource, de propósito: com eles, quem atualizar a fonte
acha o arquivo correspondente no pacote de origem sem tabela de tradução. A
licença vai junto, em `OFL-instrument-serif.txt` e `OFL-archivo.txt`, copiadas
do `LICENSE` de cada pacote.

- **Dois subconjuntos por família, cada um com o seu `unicode-range`**, o
  mesmo texto do CSS do Fontsource. O `latin` cobre o português inteiro (os
  acentos, o `ç`, o `ª`/`º`, o travessão, as aspas curvas, o `€`, o `−`); o
  `latin-ext` cobre nome próprio de outras línguas latinas (`Łódź`, `Ő`) e
  símbolos de moeda. O navegador só baixa o `latin-ext` quando a página tem um
  caractere dele — numa página só em português, a serifa custa 21 KB e a
  Archivo, 35 KB.
- **A Archivo é variável no eixo `wght`, declarada com o intervalo do arquivo**
  (`font-weight: 100 900`). Um arquivo por subconjunto serve o 400, o 500 e o
  600 dos tokens e o 700 que o navegador põe no `<strong>`, todos desenhados.
  Os pesos fixos custariam um arquivo por peso e por subconjunto.
- **`format("woff2")`, sem `tech(variations)` e sem `woff2-variations`.** O
  navegador que não entende `tech()` descarta a entrada inteira do `src`, e
  `woff2-variations` é a grafia antiga que a especificação mantém só por
  compatibilidade. O formato diz o contêiner; a variação é do arquivo, e todo
  navegador que lê `woff2` hoje a aplica.
- **`font-display: swap`.** O texto aparece na hora, na fonte de reserva da
  lista do token, e troca de desenho quando a fonte chega. Texto invisível
  esperando rede é pior que texto que muda de desenho.

### 3. A serifa fica no 400

Toda regra que lê `--co-font-display` escreve `font-weight: 400`: hoje, o
`title-lg` e o `numeral`. O 400 é escrito, e não herdado, porque o elemento é
de quem consome — um `<h1>` do `ScreenHeader`, um `<strong>`, um numeral dentro
de uma célula `<th>` —, e a folha do navegador (ou um ancestral em negrito)
pediria um peso que o arquivo não tem. É o `400` literal, e não
`var(--co-weight-regular)`: é uma propriedade do arquivo, o mesmo número do
`font-weight` do `@font-face` da serifa, e não uma escolha da rampa que um
token pudesse mudar.

O teste de unidade prova os dois lados. A leitura da folha exige o 400 em toda
regra com `--co-font-display` (e acha as duas); e, como o happy-dom não tem a
folha do navegador, o teste a escreve — `h1, h2, strong, b, th { font-weight:
bold }`, num contêiner em 700 — e confere o peso computado do título do
`ScreenHeader`, do `PageHeader`, do `title-lg` num `<h1>`, do `numeral` num
`<strong>` e do número do `Stat`. A isca é uma classe com a serifa e sem o
400, no mesmo `<h1>`: ela sai em negrito.

### 4. A referência embute as fontes

O gabarito de `docs/referencia.html` perde o `<link>` do Google Fonts. O
`scripts/gerar-referencia.mjs` troca cada `url("./fonts/X")` da folha
publicada pelo arquivo `dist/fonts/X` em `data:` — a única diferença entre a
folha da página e a do pacote. A página abre do disco ou publicada como
fragmento, sem `dist/` ao lado e sem buscar nada fora, e mostra as fontes que o
pacote leva; se a folha citar uma fonte que o build não copiou, o gerador
falha. A frase da capa, um `<h1>` na serifa, ganha o 400 pelo mesmo motivo do
`title-lg`.

### Medido

Um aplicativo Vite 6 mínimo, com o `index.html` importando
`@slipalison/coluna/styles.css` do tarball desta versão, servido com a CSP do
Basalto (`font-src 'self'`), no Chromium 153 e no WebKit do Playwright 1.63:

| | Chromium | WebKit |
|---|---|---|
| fontes emitidas pelo Vite | 4 arquivos em `/assets/`, nenhuma em `data:` | igual |
| violações de CSP no console | 0 | 0 |
| baixadas numa página com `Łódź` no corpo | serifa `latin`, Archivo `latin` e `latin-ext` | igual |
| serifa `latin-ext` sem caractere dela na serifa | não baixada | não baixada |
| peso computado do `title-lg` num `<h1>` e do `numeral` | 400 e 400 | 400 e 400 |
| largura de "Proteína carboidrato" em 40px, Archivo 400 → 700 | 363 → 392 px | 360,1 → 390,8 px |
| largura de "Hoje 1.917" em 40px, Instrument Serif × Georgia | 126 × 177,8 px | 125,4 × 198,2 px |

A Archivo mais larga no 700 é a variação funcionando: um negrito sintético não
muda o avanço dos caracteres desse jeito. A referência gerada, aberta do disco
no Chromium, carrega as duas famílias e não faz nenhuma requisição de rede.

## O que fica de fora

- **Itálico, nas duas.** Nenhuma tela do Basalto usa, e cada família custaria
  mais dois arquivos. Um `<em>` dentro do sistema sai num itálico sintético
  (inclinado pelo navegador); entra o arquivo no dia em que uma prancha pedir.
- **Outros subconjuntos.** A Archivo tem `vietnamese`; a Instrument Serif só
  tem os dois. Um caractere fora do `latin` e do `latin-ext` cai na fonte de
  reserva do token.
- **O eixo `wdth` da Archivo.** O arquivo `wght` tem só a largura normal;
  nenhum token pede outra.
- **`woff` e `local()`.** Todo navegador atual lê `woff2`; e
  `local()` usaria a versão que estivesse instalada no aparelho, que pode ser
  outra, além de servir para identificar o aparelho.
- **Pré-carregamento e métricas da reserva.** Um `<link rel="preload">` é do
  `index.html` do consumidor, que sabe qual fonte aparece acima da dobra. O
  ajuste da fonte de reserva (`size-adjust`, `ascent-override`) contra o
  salto do `swap` fica para quando o salto for medido como problema.
- **Peso na serifa por `Text weight`.** `.co-text[data-weight="medium"]` e
  `[data-weight="semibold"]` têm a mesma especificidade do `title-lg` e do
  `numeral` e vêm depois na folha, então vencem o 400 — e pedem de novo o
  negrito sintético. A prop é para a linha de total de uma conta; com as
  variantes de serifa, não se usa.

## Consequências

- **Não é quebra de compatibilidade.** Nenhum nome, token ou prop muda; é
  capacidade nova (as fontes), e por isso a versão é minor. O consumidor não
  faz nada além do `import "@slipalison/coluna/styles.css"` de sempre, e a CSP
  dele precisa só de `font-src 'self'`.
- **O pacote cresce 98 KB de fonte e 9 KB de licença**; o tarball passa a ter
  14 arquivos (eram 8) e 227 KB. A tela baixa só os subconjuntos que usa.
- **A fonte offline é do consumidor.** O service worker do PWA decide o que
  guarda; o padrão do `vite-plugin-pwa` (`**/*.{js,css,html}`) não inclui
  `woff2`, e sem rede a tela cai na fonte de reserva até a fonte ser
  guardada.
- **Quem já trazia as fontes por conta própria** (um `<link>` do Google Fonts)
  passa a ter duas definições com os mesmos nomes de família, e a última
  declarada vence. Pode remover a dele.
- **Atualizar a fonte é repetir o procedimento**: `npm pack` da versão nova do
  Fontsource fora do repositório, copiar os quatro `.woff2` e as duas licenças,
  atualizar as tabelas acima e rodar o teste, que confere nomes, pesos,
  subconjuntos e tamanhos.
