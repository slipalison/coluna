# ADR-025 — O prato, o cartão de receita, o aviso com "Desfazer" e o esqueleto

**Data:** 2026-11-22
**Status:** aceito
**Cartão:** [slipalison/basalto#182](https://github.com/slipalison/basalto/issues/182) (livro de receitas, F3)

## Contexto

O livro de receitas do Basalto precisa de quatro peças que a Coluna não tinha: o prato de colunas (a imagem de
toda receita, `design/identidade.md`), o cartão de receita, o aviso passageiro com uma ação ("Desfazer") e o
esqueleto de carregamento. Peça de UI que falta nasce aqui, nunca no app (`.claude/rules/ux.md` §2). O `Slat` é a
barra ripada, e não o mosaico; o `Notice` é estático, e informa sem prazo.

A CSP do app (`style-src 'self'`) continua a fronteira (ADR-024): movimento só por classe, `@keyframes`,
`@property` e `element.animate()`, com `prefers-reduced-motion`.

## Decisão

### 1. `Plate`: o prato recebe a composição pronta e não calcula nada

- 37 colunas hexagonais de topo chato, em 4 anéis (1 + 6 + 12 + 18), desenhadas num SVG `aria-hidden`.
- A entrada é `slices: { group, fraction, label }[]`: o grupo do prato (os seis papéis do alimento, os tokens
  `--co-role-*`), a fração do alvo já calculada por quem consome, e o rótulo com os gramas. A conta de nutrição é do
  app; o prato só converte frações em células, pelo maior resto. A soma das frações é a parte cheia (grampeada em 1,
  então o prato "se completa" quando fecha o alvo); a fatia maior que zero pinta ao menos uma célula, para nenhum
  grupo da legenda sumir do desenho.
- As células se enchem pelo ângulo em volta do meio, do topo, no sentido do relógio: cada grupo vira um setor, e a
  parte vazia fica junta no fim.
- **A legenda em texto vem sempre** (ADR-005): o `Plate` não tem modo sem legenda. A amostra da `Legend` ganhou a
  forma `hex` e os tons `veg`, `fruit` e `dairy`. O desenho sem legenda (`PlateArt`) é interno, usado só pelo cartão
  e pelo esqueleto, que levam o texto deles.
- `over`: o aro tracejado na cor de atenção quando a receita passa do alvo. O número que diz quanto passou é do app,
  em texto.
- `size="sm"` (64 px: cartão, painel do editor) e `size="lg"` (224 px, nunca mais largo que o contêiner: a receita
  aberta). O desenho e a legenda dividem uma fileira que quebra: a 320 px, a legenda desce.

**A onda.** Cada célula é um `<polygon>` com a chave da posição e do grupo: quando a composição muda, só as células
que trocam de grupo nascem de novo, e a entrada delas (`transform` e `opacity`, com a mola) é atrasada pelo anel por
uma regra da folha (`[data-ring="n"]`, `calc(var(--co-duration-wave) * n)`). Nenhum atributo `style`. O token novo
`--co-duration-wave` (12 ms) é o atraso por anel que a identidade escreve. Com `prefers-reduced-motion`, as células
trocam todas de uma vez com o esmaecer de 120 ms.

### 2. `RecipeCard`: o cartão inteiro é o alvo, e o nome do link é o título

Prato mini, título (na Bricolage, 700 e 88%), kcal da proporção base, tempo total, origem e a legenda do prato. O
link (`href`) ou o botão (`onSelect`) mora no título, e o `::after` dele cobre o cartão — o "link esticado". O
cartão mede pelo menos `--co-target-min`; o leitor de tela ouve o título como nome do link, e não o cartão inteiro
lido de uma vez; o resto continua texto que se percorre. O anel de foco é da camada, por fora do cartão. Raio de
cartão (22 px), fissura, sem sombra.

### 3. `Toast`: região viva, foco devolvido, tempo de quem usa, pausa e teto

- **Região viva que existe antes da mensagem.** O aviso fica montado aberto ou fechado; fechado, a região
  (`role="status"`, `aria-live="polite"`, `aria-atomic`) está vazia e sem caixa. Região que nasce junto com o texto
  pode não ser lida.
- **Não rouba o foco.** Ele é a próxima parada do Tab; Esc o dispensa.
- **Devolve o foco.** Fechou com o foco dentro (ação, ×, Esc, teto, ou `open` posto em `false` por fora), o foco
  volta para `returnFocus` ou para onde estava antes de entrar — nunca cai no `<body>` com o botão que sumiu.
- **O tempo é de quem usa, e pausa** (WCAG 2.2.1). `duration` conta só enquanto o aviso não tem foco nem ponteiro, e
  volta de onde parou. `maxDuration` é o teto, contado desde que abriu, com ou sem pausa; os dois são obrigatórios,
  porque o tempo certo depende do que o aviso oferece.
- Flutua embaixo, dentro da área segura e acima das abas e da barra de ação, pelo mesmo termo `max(...)` delas
  (ADR-012, ADR-013); `position="static"` o deixa no fluxo. É a terceira peça com `--co-shadow-float`: flutua.
- `tone="warn"` leva o ícone de atenção junto do texto, nunca só a cor.

### 4. `Skeleton`: um estado pronto, com o prato, e o pulso que acaba

`<Skeleton label="Carregando receitas" shape="recipe-card" count={3} />`: o contêiner é `role="status"` com o rótulo
escrito, anunciado uma vez, e as peças saem `aria-hidden`. As formas são o cartão de receita com o prato mini vazio,
o prato grande e a linha de texto. O pulso é só de opacidade e **acaba**: seis meias-voltas de 700 ms, 4,2 s —
abaixo dos 5 s em que o WCAG 2.2.2 pede um jeito de pausar o que se mexe sozinho, e "nada infinito, salvo o
esqueleto (que acaba)". Com `prefers-reduced-motion`, `animation-name: none`: sem isso, o corte geral de 0,01 ms
faria as meias-voltas piscarem.

## Como se prova

- `src/livro-de-receitas.test.tsx`: as células e a legenda do prato, a onda, o aro; o alvo e o nome do cartão; o
  aviso pelo teclado e pela região viva, com a pausa por foco e por ponteiro, o teto e o foco devolvido; o esqueleto
  anunciado e o pulso finito; o axe nos dois temas para as quatro peças.
- `src/csp.test.tsx`: as quatro montadas sob a vigia (a lista de montagens é a dos exportados).
- `src/forma-e-movimento.test.ts`: o raio de cartão, a sombra do aviso, as animações só de `transform` e `opacity`
  e com tempos dos tokens; `src/area-segura.test.tsx`: o aviso na lista de quem lê a área segura.
- As histórias no catálogo, nos dois temas, com o axe do addon.

## Consequências

- `.claude/rules/ux.md` §3 perde a linha do aviso com "Desfazer" (#61) e o `Skeleton` da linha do #64; o campo de
  data continua dívida do #64.
- O número que rola e o vidro do menu continuam fora (F4).

## Adendo (2026-11-22) — a revisão de UX do PR da Coluna (slipalison/coluna#22)

A revisão independente mediu defeitos de piso em duas rodadas, todos BLOCK, e o PR os conserta (cada um com o teste
que reprova o código de antes).

1. **`Toast`: quem está com o aviso não perde o "Desfazer" por demorar** (WCAG 2.2.1).
   - O teto (`maxDuration`) é o prazo do servidor (no Basalto, 2 min), e não o pulso do aviso. Passou dele, o aviso
     fecha, menos enquanto alguém está com ele: o foco dentro, o ponteiro em cima ou o dedo que tocou nele (a caixa é
     focável por script, `tabIndex={-1}`, fora do Tab). Quando a pessoa solta o aviso, ele fecha com `timeout` se o
     teto já tinha passado, e senão volta a contar o tempo que faltava. O toque não tem "em cima" depois que o dedo
     levanta, e por isso o toque na caixa a segura até um toque fora dela.
   - **Nenhum atalho global.** A primeira rodada pôs Alt+N para levar o foco ao aviso, e a segunda mediu o defeito:
     no macOS, Option+N é a tecla morta do "ã" (`key: "Dead"`, `code: "KeyN"`), o foco saltava do campo para o
     "Desfazer", e o espaço seguinte o acionava. O atalho saiu. No lugar vem `focusOnOpen`, para o aviso que nasce de
     uma ação da pessoa: o foco vai ao "Desfazer" ao abrir e volta ao elemento de origem ao fechar. É opt-in porque o
     aviso pode nascer de um efeito ou de um prazo, e roubar o foco de quem digita é pior que perder o atalho; quem
     consome decide quando usar. O anúncio diz a mensagem e que há uma ação, sem citar tecla.
   - `maxDuration` menor ou igual a `duration` anula a pausa. A primeira rodada o recusava com `RangeError` no render, e
     a segunda mediu que isso derrubava a tela inteira de quem consome. Agora o componente avisa no console e usa
     `10 × duration`.
2. **`Toast` fixo não cobre o foco (WCAG 2.4.11).**
   - O aviso aberto soma ao `scroll-padding-bottom` do `:root` o `bottom` dele em cada caso (sem barras, com as abas,
     com a barra de ação, com as duas) mais `--co-toast-reserve` (a borda, o respiro e três linhas de corpo) e um
     respiro: quatro regras `:root:has(A):has(aviso)`, que pesam mais que as das barras sozinhas, para somar em vez de
     trocar.
   - O `scroll-padding` só vale para quem ainda tem para onde rolar, e a última linha da página já está no fim (92% de
     cobertura a 390 px). Enquanto o aviso está aberto, a janela ganha também `padding-bottom`: a reserva da tela (o
     recuo das barras, ADR-013) mais esse espaço passa de onde o aviso termina.
3. **`Plate` e `RecipeCard`: quanto falta para o alvo em texto.** `summary` é obrigatório ("Fecha 90% do alvo do
   almoço", "Falta 10% para o alvo", "Passou 40 kcal do alvo"): escrito por quem consome, visível junto da legenda e
   lido pelo leitor de tela. O prato continua sem calcular nada. A célula vazia ganha o contorno de `--co-control`
   (3:1 sobre `bg`, `surface` e `surface-2`), com `vector-effect: non-scaling-stroke`; o esqueleto do prato não o leva,
   para não se confundir com um prato vazio de verdade. O esqueleto do cartão ganhou um osso para o resumo e a altura
   do cartão real (10 rem), para a lista não pular.
4. **Os seis grupos do prato se distinguem por PADRÃO e por separador de setor, e a luminosidade é a da identidade
   (ADR-022).**
   - **O que a revisão mediu.** Com a cor sozinha (a mesma luminosidade nos seis), o contraste entre os grupos ficava
     entre 1,00 e 1,31:1: em cinza, ou para quem não distingue o vermelho do verde, proteína, fruta e gordura viravam
     uma mancha só, e a amostra da legenda não ligava o nome ao setor.
   - **O piso que vale.** Não é a luminância dos papéis: a cor nunca é o único sinal (WCAG 1.4.1, ADR-005), e as partes
     do gráfico têm 3:1 contra o que está ao lado (1.4.11). Isso se cumpre sem mexer na identidade, e as tentativas de
     mexer nela foram desfeitas: baixar a distância da tinta de ação de 0,2 para 0,1 e escalonar a luminância dos seis
     grupos não separam seis grupos (entre o fundo e a tinta não cabem seis degraus largos) e contradiziam a linha "Cor"
     da regra de UX. Os papéis voltam à luminosidade, ao matiz e ao croma de antes, com a distância da tinta em 0,2.
   - **A decisão.** Cada grupo tem um **padrão** próprio, uma textura de SVG (`<pattern>`, marcação, e não estilo
     injetado, por causa da CSP): traço inclinado nos dois sentidos, horizontal, vertical, grade e pontos, na tinta
     escura `--co-role-mark` (≥ 3:1 sobre a cor de todo grupo, nos dois temas). A amostra da `Legend` desenha o mesmo
     padrão, por `gradient()` de arquivo, e assim liga o nome ao setor. Onde o grupo muda entre duas células vizinhas há
     um **separador de setor** (um traço escuro na aresta compartilhada), em toda ordem dos seis grupos e com grupo
     faltando, a célula do meio inclusive. O teste gera as 720 ordens, com e sem grupo faltando, acha a vizinhança pelas
     coordenadas das células e exige um separador entre toda vizinha de grupos diferentes e nenhum entre as do mesmo
     grupo. A legenda em texto e o `summary` continuam, e nenhum texto mora sobre a cor de um grupo.
