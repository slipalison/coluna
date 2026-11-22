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
