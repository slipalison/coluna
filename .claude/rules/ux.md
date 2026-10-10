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
| Texto sobre superfície | ≥ 4,5:1; texto ≥ 24 px (ou ≥ 18,66 px em negrito) ≥ 3:1 | teste que calcula o contraste de cada par de texto sobre `canvas`, `surface`, `surface-raised` e `surface-sunken`, nos dois temas |
| Limite de controle — campo, busca, chip, marca de radio e de checkbox, segmentado, stepper | ≥ 3:1 sobre a superfície onde o controle fica, nos dois temas | o mesmo teste, sobre o token de borda de controle (WCAG 1.4.11; o axe-core não mede contraste de não-texto) |
| Anel de foco | ≥ 3:1 sobre a superfície | o mesmo teste |
| Tamanho de letra | corpo ≥ 16 px; nota ≥ 14 px; legenda e rótulo em caixa-alta ≥ 12 px; rótulo da barra de abas ≥ 11 px (convenção do iOS); nenhuma variante de `Text` abaixo disso | teste sobre os tokens de texto e as variantes |
| Espaço | uma escala em que o espaço entre grupos possa ser 1,5 a 2 vezes o de dentro (4, 8, 12, 16, 24, 32, 48, 64) | revisão dos tokens |
| Alvo | `--co-target-min` (44 px) em todo controle, com a moldura inteira tocável | teste de componente |
| Cor | nunca é o único sinal (ADR-005); a paleta de dados (macros) fica separada da de ação, seleção e status, com luminâncias distintas entre si | teste sobre os tokens de dado |
| Movimento | `prefers-reduced-motion` reduz o que não é essencial | já existe |
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
- **Ícone de ação tem nome acessível**; o × é fechar ou limpar, nunca apagar.
- **Toda peça funciona a 320 px** sem rolagem lateral e com o texto a 200%.
- **Os estados vêm prontos**: carregando, vazio, erro, desligado com motivo.

Peça que um app precisa e não existe nasce aqui, não no app.

## 3. A dívida medida em 2026-10-10

A revisão do Basalto contra o kit mediu estes defeitos na 1.10.0. Instância nova de qualquer um é BLOCK hoje; a que já
existe bloqueia só o cartão dono dela, que apaga a linha ao ser entregue.

| Defeito | Cartão (`slipalison/basalto`) |
|---|---|
| `--co-border` com 2,09:1 no claro e 1,47:1 no escuro em campo e chip; marca do radio com 1,92:1 no escuro; `SearchField` sem limite dentro de folha, lupa que não foca, anel cortado; `aria-disabled` sem aparência; `ListRow` em 13,33 px; os 14 px laterais da moldura do campo que não focam | #58 |
| Escala de texto com sete degraus de 1 px entre 10 e 16 px e corpo de 15 px; escala de espaço com 13 degraus de 2 px até 40; `--co-macro-protein` igual a `--co-accent` e `--co-macro-carb` igual a `--co-status`; rótulo de campo com a cara do rótulo de seção | #59 |
| Sem ação no fim da `ListRow`; `Stepper` que não aceita digitação nem repete ao segurar | #60 |
| Sem aviso temporário com "Desfazer" | #61 |
| Sem campo de data em dia, mês e ano; sem `Skeleton` | #64 |

## Checklist do PR (o revisor bloqueia em qualquer ❌)

- [ ] Todo par de token que o PR cria ou muda passa no limiar da §1, nos dois temas, com o teste que o calcula.
- [ ] Todo componente que o PR cria ou muda segue a §2.
- [ ] O PR não cria instância nova da dívida da §3 e apaga as linhas do cartão que entrega.
- [ ] A história do Storybook mostra o estado novo nos dois temas, e o teste de acessibilidade dela passa.
