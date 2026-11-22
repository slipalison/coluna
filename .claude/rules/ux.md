---
paths:
  - "src/**"
  - "tokens/**"
  - "scripts/**"
  - ".storybook/**"
  - "docs/**"
---

# Regras de UX — Coluna (OBRIGATÓRIA; todo achado do piso é BLOCK)

O dono, em 2026-10-10, sobre toda tela que usa este design system:

> Não podemos violar esses princípios e boas práticas de forma alguma.

Os princípios são o piso de UX (WCAG 2.2 AA, equivalente à conformidade regular da ABNT NBR 17225:2025, as
convenções de plataforma e a lei) e as Leis de UX classificadas pela força da evidência, no kit `leis-de-ux` do dono.
O Basalto traz o kit inteiro e o liga ao app em `.claude/rules/ux.md` de lá. Esta regra diz **o que cabe à Coluna
garantir**: um limiar que mora num token ou num componente é garantido aqui, com teste, para que nenhuma tela de
nenhum app precise lembrar dele (ADR-016).

Não há nível de aviso para o piso, como na `security.md` do Basalto: se um teste, uma busca ou uma medida acha a
violação, o PR não entra.

## 1. Os tokens

| Propriedade | Limiar | Como se prova |
|---|---|---|
| Texto sobre superfície | ≥ 4,5:1; texto ≥ 24 px (ou ≥ 18,66 px em negrito) ≥ 3:1 | `src/tokens/contraste.test.ts`: cada tinta (`ink` 1 a 3, `ok`, `warn`, `bad`) sobre `bg`, `surface` e `surface-2`, nos dois temas; `surface-3` não é fundo de texto; os lavados com a cor do estado e a tinta; e a cor da hora (`hora-ink`, `on-hora`) a cada 15 minutos do dia, convertida de OKLCH pelos dois jeitos de voltar ao sRGB (ADR-022) |
| Limite de controle — campo, busca, chip, marca de radio e de checkbox, segmentado, stepper | ≥ 3:1 sobre a superfície onde o controle fica, nos dois temas | o mesmo teste, sobre `--co-control` (1,5 px, `--co-control-width`) e conferindo que cada controle o desenha (WCAG 1.4.11; o axe-core não mede contraste de não-texto) |
| Anel de foco | ≥ 3:1 sobre a superfície | o mesmo teste, com `surface-3` |
| Tamanho de letra | texto corrido, texto primário de lista e valor de campo ≥ 16 px; texto secundário e nota ≥ 14 px; legenda e rótulo em caixa-alta ≥ 12 px; rótulo da barra de abas ≥ 11 px (convenção do iOS), e só ele abaixo de 12 px; nenhuma variante de `Text` e nenhuma letra de componente abaixo do piso do seu papel (ADR-021). Acima do piso, a escala do "Relógio de Sol" (ADR-022): corpo, campo e botão 17 px, legenda e secundário 14 px, caixa alta 13 px, aba 11 px, título de tela 26 px no toque e 30 px com ponteiro fino | `src/escala-de-letra.test.tsx`: toda letra da folha tem papel e fica no piso dele, cada variante e cada texto das peças no estilo computado, nenhuma história com letra à mão abaixo de 12 px, e cada letra da tabela é a da identidade — cada prova com a sua isca |
| Espaço | uma escala em que o espaço entre grupos possa ser 1,5 a 2 vezes o de dentro (4, 8, 12, 16, 24, 32, 48, 64) | revisão dos tokens |
| Alvo | `--co-target-min` (44 px) em todo controle no toque, com a moldura inteira tocável; com ponteiro fino, o botão e o botão-ícone têm 40 px e o principal 46 px (plano s7, ADR-022), acima dos 24 px do WCAG 2.5.8 | teste de componente; `src/botao.test.tsx` mede o projeto de toque e o de ponteiro |
| Cor | nunca é o único sinal (ADR-005); os papéis do alimento têm a mesma luminosidade de propósito (a identidade), e se separam da tinta de ação e dos estados por croma e luminância (ADR-022); a cor da hora é cor de lugar, nunca de ação | `src/tokens/contraste.test.ts`, os papéis do alimento |
| Movimento | `prefers-reduced-motion` reduz o que não é essencial; os tempos e as curvas da identidade, o toque abaixo de 100 ms, só `transform` e `opacity` animados | `src/forma-e-movimento.test.ts` |
| Área segura | `--co-safe-*` (ADR-011) | já existe |

## 2. Os componentes

- **Todo elemento interativo herda a fonte** (`font: inherit`). O `<button>` e o `<input>` do navegador trazem
  13,33 px; um componente que só herda `font-family` mostra letra menor que a do vizinho.
- **Desligado se vê desligado**: `:disabled` e `[aria-disabled="true"]` têm a mesma aparência, sem hover, e o foco
  continua no `aria-disabled`. Um componente que desliga dá lugar ao motivo, junto dele.
- **Todo campo tem rótulo visível** pelo `Field`, a busca também; o texto de exemplo é só exemplo.
- **A moldura inteira de um campo foca o controle**, e a área tocável tem pelo menos `--co-target-min`.
- **Dentro de folha ou cartão, o limite do controle continua visível** (uma superfície igual à de fora não basta), e
  o corpo que rola não corta o anel de foco.
- **A busca da folha fica presa no topo do corpo que rola, com o rótulo**, e o foco para abaixo dela: rolar a lista
  nunca deixa a moldura à vista sem o rótulo (ADR-017).
- **O corpo da folha que rola se rola pelo teclado**: em `overlay` ele é uma parada do Tab e uma região com o nome do
  título, com o anel por dentro, para a folha só de texto não prender quem usa teclado (WCAG 2.1.1; ADR-018).
- **O gesto sempre tem alternativa**: o arrasto do carrossel (`Deck`) tem as setas de 44px, com o limite de controle, e
  as setas do teclado; o foco vai para o card novo, e o indicador de posição não depende só da cor. Com
  `prefers-reduced-motion`, nada anda com o dedo (WCAG 2.5.1, 2.5.7; ADR-019).
- **O painel que rola por dentro é uma parada do Tab**, como o das `Tabs`, com o anel por dentro, e a fileira de abas
  rola de lado dentro de si: a página nunca rola de lado (ADR-019). Parada do Tab é alvo: o painel nunca mede menos
  que `--co-target-min`, por menor que seja o conteúdo (adendo do ADR-019).
- **A folha de altura cheia não pula e rola inteira**: com `size="full"`, a altura da `Sheet` não muda com o
  conteúdo, o cabeçalho e o rodapé ficam fixos, e quem rola é o corpo — nada direto nele encolhe para rolar por
  dentro com uma linha de altura. Dentro de um card do `Deck`, o dedo de lado é do carrossel também sobre o painel
  de uma aba (ADR-020).
- **O prato de colunas nunca vem sem a legenda em texto**, com o nome e os gramas de cada fatia, e sem o `summary`
  (obrigatório) que diz quanto do alvo ele fecha ou quanto falta; o desenho sai `aria-hidden`, e o prato recebe a
  composição pronta, sem calcular nada. **Os seis grupos se distinguem por PADRÃO** (uma textura de SVG por grupo, a
  mesma na amostra da legenda) **e por separador de setor** (um traço escuro, com contorno claro no tema escuro, onde
  o grupo muda entre duas células vizinhas, em toda ordem dos grupos), mantendo a luminosidade da identidade (ADR-022); a célula vazia tem
  contorno de controle (≥ 3:1) (ADR-025).
- **O cartão inteiro é o alvo** do `RecipeCard`, com pelo menos `--co-target-min`, e o nome do link é o título
  (ADR-025).
- **O aviso passageiro (`Toast`) anuncia por região viva que existe antes da mensagem**, não rouba o foco (salvo
  `focusOnOpen`, para o aviso que nasce de uma ação da pessoa, e então o foco vai à mensagem, e não ao "Desfazer", para o Enter repetido não desfazer; nenhum atalho global, que sequestraria a digitação),
  devolve o foco ao fechar com ele dentro, e some no tempo dado por quem usa, pausando com foco, ponteiro ou toque até
  o teto, que é o prazo do servidor e que também espera quem está com o aviso. O aviso fixo aberto entra no recuo de
  baixo da rolagem e reserva espaço embaixo do conteúdo, para a última linha não ficar sob ele (WCAG 2.2.1, 2.4.11,
  4.1.3; ADR-025).
- **O esqueleto anuncia o rótulo uma vez e o pulso acaba** antes de 5 s, parado com `prefers-reduced-motion`
  (WCAG 2.2.2; ADR-025).
- **Ícone de ação tem nome acessível**; o × é fechar ou limpar, nunca apagar.
- **Toda peça funciona a 320 px** sem rolagem lateral e com o texto a 200%.
- **Os estados vêm prontos**: carregando, vazio, erro, desligado com motivo.

Peça que um app precisa e não existe nasce aqui, não no app.

## 3. A dívida medida em 2026-10-10

A revisão do Basalto contra o kit mediu estes defeitos na 1.10.0. Instância nova de qualquer um é BLOCK hoje; a que já
existe bloqueia só o cartão dono dela, que apaga a linha ao ser entregue.

| Defeito | Cartão (`slipalison/basalto`) |
|---|---|
| Escala de espaço com 13 degraus de 2 px até 40; rótulo de campo com a cara do rótulo de seção (o piso de letra foi pago no ADR-021, a escala de letra e as cores de macro saíram com a identidade do ADR-022) | #59 |
| Sem ação no fim da `ListRow`; `Stepper` que não aceita digitação nem repete ao segurar | #60 |
| Sem campo de data em dia, mês e ano | #64 |

## Checklist do PR (o revisor bloqueia em qualquer ❌)

- [ ] Todo par de token que o PR cria ou muda passa no limiar da §1, nos dois temas, com o teste que o calcula.
- [ ] Todo componente que o PR cria ou muda segue a §2.
- [ ] O PR não cria instância nova da dívida da §3 e apaga as linhas do cartão que entrega.
- [ ] A história do Storybook mostra o estado novo nos dois temas, e o teste de acessibilidade dela passa.
