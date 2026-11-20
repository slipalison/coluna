# ADR-023 — As fontes do "Relógio de Sol"

**Data:** 2026-11-19
**Status:** aceito. Substitui a tabela de arquivos do ADR-014 (§2) e a regra
"a serifa fica no 400" (§3). O resto do ADR-014 continua: os arquivos moram no
pacote, a folha os cita por caminho relativo, nenhuma URL de fora, nunca
`data:`, `font-display: swap`, dois subconjuntos por família.

## Contexto

A identidade "Relógio de Sol" (`basalto-reformulacao/design/identidade.md`,
plano s7) troca as duas famílias da 1.x por três, todas OFL e servidas da
própria origem do app:

- **Bricolage Grotesque** nos títulos de tela e de receita: peso 700, largura
  88% (`wdth`), entreletra −0,02em, `text-wrap: balance`;
- **Figtree** no texto: corpo de 17px, legenda de 14px, campo e botão de 17px;
- **Sofia Sans Extra Condensed** nos números (gramas, kcal, horários), altos e
  estreitos como colunas de basalto, sempre `tabular-nums`, o número em 900.

O protótipo carrega as três do Google Fonts; o produto não pode: a CSP do
Basalto é `font-src 'self'`, e o Google Fonts entregaria o endereço de quem abre
o app a um terceiro a cada visita (plano s7).

## Decisão

### 1. Os arquivos, de onde e em que versão

Os `woff2` do [Fontsource](https://fontsource.org), sem conversão: `npm pack`
dos três pacotes num diretório de rascunho, fora do repositório, e cópia dos
`woff2` `latin` e `latin-ext` e do `LICENSE` de cada um. Os pacotes **não** são
dependência, nem de desenvolvimento: a cópia é o artefato, como no ADR-014.

| pacote de origem | versão | `shasum` do tarball | fonte do Google Fonts |
|---|---|---|---|
| `@fontsource-variable/bricolage-grotesque` | 5.3.0 | `9734016f851d1790bf49c095f59a5e8447814d00` | Bricolage Grotesque v9, 2025-09-11 |
| `@fontsource-variable/figtree` | 5.3.0 | `df8e3e467d3cceb1eb982ae2ed04a4accb284f65` | Figtree v9, 2025-09-11 |
| `@fontsource-variable/sofia-sans-extra-condensed` | 5.3.0 | `1c062cc2bb402d91430209a29a44bce4bb4ba6f4` | Sofia Sans Extra Condensed v6, 2025-09-11 |

| arquivo | família | subconjunto | eixos | bytes | sha256 |
|---|---|---|---|---|---|
| `bricolage-grotesque-latin-wdth-normal.woff2` | Bricolage Grotesque | `latin` | peso 200–800, largura 75–100% | 78.156 | `c7e1602806bbd726cc99bb1320625f3ae315c1c5831b152cc1510c1e14e7396b` |
| `bricolage-grotesque-latin-ext-wdth-normal.woff2` | Bricolage Grotesque | `latin-ext` | peso 200–800, largura 75–100% | 31.868 | `9a4a3157c0bff1b9f99e90486a2e01a5cdb0817a9eb5d7c0c9097b3779380918` |
| `figtree-latin-wght-normal.woff2` | Figtree | `latin` | peso 300–900 | 20.156 | `4ba7d3d096695818fe0686be4f1e82c6b05134e18a22260336130335027462dd` |
| `figtree-latin-ext-wght-normal.woff2` | Figtree | `latin-ext` | peso 300–900 | 10.280 | `bf7828e2c258cffcfa50a048ee388a36b95bc16b452e8d36fa797635dbe15965` |
| `sofia-sans-extra-condensed-latin-wght-normal.woff2` | Sofia Sans Extra Condensed | `latin` | peso 1–1000 | 40.520 | `4c0443d7e9bc0849364b498e8a0acbbafbfd21e69c504b145540df43c3828596` |
| `sofia-sans-extra-condensed-latin-ext-wght-normal.woff2` | Sofia Sans Extra Condensed | `latin-ext` | peso 1–1000 | 18.128 | `214427a97a15fe8ea93e242cc66596e645b58742ebbefc3ffeb381b2550f26b2` |

As licenças vão ao lado, em `OFL-bricolage-grotesque.txt`, `OFL-figtree.txt` e
`OFL-sofia-sans-extra-condensed.txt`. Os nomes dos arquivos são os do
Fontsource, como no ADR-014: quem atualizar acha o arquivo correspondente no
pacote de origem sem tabela de tradução.

- **A Bricolage vem no arquivo `wdth`**, que traz os eixos de peso e de largura:
  o título usa 700 e 88%. O arquivo `standard` traria também o eixo de tamanho
  óptico (`opsz` 12–96) e custaria 131 KB em vez de 78 KB no `latin`; o arquivo
  `wght` (41 KB) não tem a largura, e o título sairia na largura cheia.
- **Cada `@font-face` declara o intervalo do arquivo** (`font-weight: 200 800`,
  `font-stretch: 75% 100%` na Bricolage; `300 900` na Figtree; `1 1000` na
  Sofia), com `format("woff2")`, como o ADR-014 decidiu: todo peso pedido dentro
  do intervalo sai desenhado.
- **Os nomes de família são os simples** ("Bricolage Grotesque", "Figtree",
  "Sofia Sans Extra Condensed"), e não os do CSS do Fontsource ("… Variable"):
  são os que os tokens nomeiam, e os que o protótipo já usava.

### 2. Os tokens

```css
--co-font-display: "Bricolage Grotesque", "Avenir Next Condensed", "Arial Narrow", system-ui, sans-serif;
--co-font-body:    Figtree, "Segoe UI", system-ui, -apple-system, sans-serif;
--co-font-num:     "Sofia Sans Extra Condensed", "Roboto Condensed", "Arial Narrow", sans-serif;
```

`--co-font-num` é novo. As reservas são as do protótipo.

### 3. O título e o número têm o peso escrito

Substitui "a serifa fica no 400" (ADR-014 §3): toda regra que lê
`--co-font-display` escreve `font-weight: 700` e `font-stretch: 88%`, e toda
regra que lê `--co-font-num` escreve um peso do arquivo (o `numeral`, 900) e
`tabular-nums`. O motivo é o mesmo de antes, ao contrário: o título sai num
`<h1>` de quem consome, ou dentro de um ancestral com outro peso, e a cara da
identidade não pode depender do que está em volta. O teste prova o peso
computado num ancestral leve (300) e num pesado (700), com a isca que herda o
peso de fora.

## Medido

Um aplicativo Vite 6 mínimo, com o `dist/` desta versão (o mesmo `styles.css`
que o pacote publica), servido com a CSP do Basalto (`font-src 'self'`), no
Chromium 1248 do Playwright 1.63, no toque e com ponteiro, nos dois temas:

| | resultado |
|---|---|
| fontes emitidas pelo Vite | os 6 arquivos em `/assets/`, nenhum em `data:` |
| violações de CSP, requisições para fora da origem | 0, 0 |
| `document.fonts.check` | `700 26px "Bricolage Grotesque"`, `400 17px "Figtree"` e `900 56px "Sofia Sans Extra Condensed"` verdadeiros |
| título computado | Bricolage Grotesque, 700, 88% |

A referência (`docs/referencia.html`), aberta do disco no mesmo Chromium,
carrega as três famílias embutidas e não faz nenhuma requisição de rede.

## O que fica de fora

- **O tamanho óptico da Bricolage** (`opsz`), pelo custo acima. O título sai no
  `opsz` padrão do arquivo `wdth`; entra o arquivo `standard` quando uma prancha
  medir a diferença.
- **Itálico, nas três.** Nenhuma tela usa; um `<em>` sai inclinado pelo
  navegador.
- **Outros subconjuntos** (`vietnamese`, `cyrillic`, `greek`): caem na reserva
  do token.
- **`woff`, `local()`, pré-carregamento**, pelos motivos do ADR-014.

## Consequências

- **É quebra**: os nomes "Instrument Serif" e "Archivo" e os quatro arquivos
  deles saem do pacote, e o `title-lg` e o `numeral` mudam de família, de peso e
  de tamanho (ADR-022). Quem trazia as fontes de antes por conta própria pode
  remover.
- **O pacote passa de 98 KB a 199 KB de fonte** (seis arquivos); a tela baixa
  só os subconjuntos que usa — numa página só em português, os três `latin`:
  78 + 20 + 41 = 139 KB.
- **Atualizar a fonte é repetir o procedimento**: `npm pack` da versão nova do
  Fontsource fora do repositório, copiar os seis `woff2` e as três licenças,
  atualizar as tabelas acima e rodar `src/fontes.test.tsx`, que confere nomes,
  pesos, larguras, subconjuntos, tamanhos e a ausência de URL de fora.
