# ADR-010 — O grupo de escolha amarra rótulo, nota e erro

**Data:** 2026-09-25
**Status:** aceito

## Contexto

O Basalto tem três grupos de escolha única montados com `Group` e `ListRow
mark="single"`: o sexo no primeiro acesso, o nível de atividade e o método da
medida de gordura na calculadora. Os três repetem a mesma amarração, linha por
linha: três `useId`, o rótulo com `id` e o `aria-labelledby` apontando para ele,
a nota no `aria-describedby`, o erro somado a ela, o `aria-invalid` e o texto
do erro embaixo da caixa. O SonarCloud do Basalto reprovou o código novo por
isso (3,3% de linhas duplicadas, sobre um limite de 3%). O dono já tinha
decidido que o que falta é da coluna, e não do aplicativo (ADR-009).

O `Field` resolveu exatamente isso para o campo: rótulo, dica e erro chegam ao
controle sem que a tela escreva um `id`. O grupo de escolha não tinha o
equivalente.

## Decisão

**O `Group` ganha `error` e, quando recebe `role`, amarra o que desenha.**

- `label` vira o nome da caixa (`aria-labelledby`), a menos que venha
  `aria-label` ou `aria-labelledby` de fora — o de fora vence.
- `note` e `error` viram a descrição (`aria-describedby`), somadas a um
  `aria-describedby` que venha de fora, nunca no lugar dele (a mesma regra do
  `Input` com a unidade).
- `error` liga `aria-invalid` e sai embaixo da nota, fora da caixa, vermelho **e**
  com ícone, com `aria-live="polite"` — a mesma regra CSS do erro do `Field`.
  Continua havendo dois donos do vermelho, e o segundo é o mesmo de antes: a
  recusa junto do que a produziu (ADR-003).
- **Sem `role`, nada é amarrado.** A caixa é só contêiner, e `aria-labelledby`
  num `div` sem papel é proibido pelo ARIA. Nenhum grupo que já existe muda de
  árvore de acessibilidade.

Três telas (sexo, atividade, método) — passa na contagem da ADR-003, e a prop é
de interface, não de domínio.

## Consequências

- As telas deixam de escrever `id` para o grupo de escolha; quem passava os
  `aria-*` à mão continua funcionando (o de fora vence ou é somado).
- O erro do grupo passa a ser vermelho com ícone. No Basalto ele era um texto
  no tom `status`: uma recusa de escolha é a mesma coisa que a recusa de um
  campo, e agora as duas se parecem.
