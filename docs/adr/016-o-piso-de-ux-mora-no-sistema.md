# ADR-016 — O piso de UX mora no sistema

**Data:** 2026-10-10
**Status:** aceito

## Contexto

Em 2026-10-10 o Basalto foi revisado contra o kit `leis-de-ux` do dono: o piso de UX (WCAG 2.2 AA, a NBR 17225, as
convenções de plataforma e a lei) e as Leis de UX classificadas pela evidência. O axe-core não achou nada nas 11 telas,
e mesmo assim a revisão mediu defeitos graves que nasciam aqui:

- a borda de campo e de chip (`--co-border`) com 2,09:1 sobre o cartão no claro e 1,47:1 no escuro, abaixo dos 3:1 que
  o WCAG 1.4.11 pede e que o axe-core não mede;
- a busca dentro da folha sem limite nenhum, com a lupa que não leva o foco ao campo;
- o `aria-disabled` sem aparência de desligado;
- a `ListRow` que é botão com a letra de 13,33 px do navegador;
- uma escala de texto com sete degraus de 1 px entre 10 e 16 px, e corpo de 15 px.

O dono decidiu, na mesma data: "Não podemos violar esses princípios e boas práticas de forma alguma."

## Decisão

**Todo limiar do piso que depende de um token ou de um componente é garantido na Coluna, com teste.**

- Os limiares estão em `.claude/rules/ux.md`: contraste de texto, de limite de controle e de foco nos dois temas,
  tamanho mínimo de letra, escala de espaço, alvo de 44 px com a moldura inteira, cor que nunca é o único sinal, e o
  comportamento que todo componente interativo deve ter.
- Um achado do piso é BLOCK, sem nível de aviso.
- Os defeitos já medidos ficam na dívida da regra, cada um com o cartão do Basalto que o paga (#58 a #64), e a linha
  sai quando o cartão entrega.

## Consequências

- O app não corrige o design system por fora: um CSS do Basalto por cima de uma classe da Coluna resolveria uma tela e
  deixaria o defeito para o próximo app.
- Mudar um token passa a exigir o teste de contraste nos dois temas, e não só a história do Storybook.
- O kit `leis-de-ux` é privado e não é copiado para cá, porque este repositório é público. A regra daqui diz o que cabe
  ao design system; o kit completo (as 30 leis, as skills de criar e de revisar tela) mora no Basalto.
