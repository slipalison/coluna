# ADR-002 — Tema por atributo, e `system` sendo ausência de atributo

**Data:** 2026-09-16
**Status:** aceito

## Contexto

Três estados, e só dois temas: claro, escuro, e "o que o sistema mandar". A
implementação ingênua trata os três como valores iguais e escreve
`data-theme="light"` quando o sistema está no claro.

Isso quebra de um jeito que só aparece depois: se a pessoa está em `system` e
muda a preferência do sistema operacional com o aplicativo aberto, o atributo
continua com o valor antigo até alguém remontar o componente.

## Decisão

- `light` e `dark` escrevem `data-theme` no elemento.
- **`system` REMOVE o atributo.**

E o CSS é escrito para isso:

```css
:root, [data-theme="light"]      { /* claro */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* escuro por preferência do sistema */ }
}

[data-theme="dark"]              { /* escuro por escolha, em qualquer subárvore */ }
```

O `:not([data-theme="light"])` é o que faz a escolha da pessoa vencer o sistema.
Sem ele, quem escolheu claro num aparelho em modo escuro recebe escuro assim
mesmo — e vai achar que o seletor está quebrado.

## Por quê

**Ausência é o estado certo para "não escolhi".** Com o atributo fora, a media
query volta a mandar, e a tela acompanha o sistema em tempo real sem código
nenhum de sincronização.

**O claro é o padrão do CSS.** Um consumidor que esqueça de montar o
`ThemeProvider` recebe uma tela legível, e não texto branco em fundo branco.

**O atributo funciona em qualquer nó, não só na raiz.** Isso é o que permite uma
pré-visualização de tema ao lado do resto da tela — `attachTo="element"` — sem
nenhum mecanismo a mais.

**`color-scheme` acompanha o atributo.** É o que faz barra de rolagem, seletor
de data e campo de formulário — coisas que o navegador desenha sozinho —
seguirem o tema. Por isso o padrão é marcar o `<html>`, e não um `<div>`.

## Consequências

**Aceitas:**

- `resolvedTheme` precisa de `matchMedia`, e no servidor ele não existe. A
  leitura no servidor devolve `light`, que é o mesmo padrão do CSS — a página
  chega clara e corrige na hidratação, sem piscar para quem está em claro. Quem
  está em escuro e em `system` vê um quadro claro; o antídoto é um script
  inline na `<head>` do aplicativo, que é decisão do aplicativo e não da
  biblioteca.
- `useTheme` **estoura** fora do provedor, em vez de devolver um padrão. Um
  palpite silencioso aqui pinta a série de um gráfico com a cor do tema errado,
  e ninguém descobre.

**Recusadas:**

- Guardar o tema resolvido em vez da preferência. Guardar `dark` quando a pessoa
  escolheu `system` congela a escolha do dia em que ela foi feita.
- Ler `localStorage` de forma síncrona antes da primeira pintura dentro da
  biblioteca. Isso exige um script inline no HTML do consumidor, e um pacote
  npm não tem como colocá-lo lá — documentar é o que cabe.
