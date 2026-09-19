# ADR-007 — A marca de escolha diz quantas

Data: 2026-09-18
Situação: aceita

## Contexto

O [ADR-004](004-raio-conteiner-e-conteudo.md) decidiu que o raio depende do
papel do elemento: contêiner arredonda, conteúdo é reto. E listou, entre os
elementos de conteúdo, a **marca de escolha** — por isso o quadrado do
`ListRow` com `mark`.

A regra é boa e continua boa. Mas ela foi escrita sobre uma pergunta — "este
elemento segura outra coisa?" — e a marca de escolha responde a uma segunda
pergunta que o ADR-004 não fazia: **quantas a pessoa pode marcar.**

Toda pessoa que já usou um telefone traz essa resposta pronta, e ela não vem
de nenhum sistema de design: redondo é escolha uma, quadrado é marque quantas
quiser. iOS, Android, formulário de papel, prova de múltipla escolha. É uma
das poucas convenções visuais que atravessam plataforma.

O `ListRow` com `mark` emitia `role="radio"` — escolha uma — e desenhava um
quadrado. Para quem usa leitor de tela, a tela dizia "escolha uma". Para quem
enxerga, dizia "marque quantas quiser". As duas leituras discordavam, e a
discordância só aparecia quando alguém abria a tela e olhava: nenhum teste
pegava, porque a semântica estava certa.

O caso que forçou a decisão foi o onboarding do Basalto, onde a pergunta é
sobre o próprio corpo e tem exatamente duas respostas. Ler "marque quantas
quiser" ali não é imprecisão de estilo: é a pessoa não entender a pergunta.

## Decisão

A forma da marca de escolha **carrega a informação de cardinalidade**, e por
isso ela é a exceção — escrita, única e fechada — ao "conteúdo é reto":

- **Escolha uma** (`mark="single"`, ou o `mark` booleano): marca **redonda**,
  `--co-radius-pill`, e `role="radio"`.
- **Marque quantas quiser** (`mark="multiple"`): marca **quadrada**,
  `--co-radius-content`, e `role="checkbox"`.

A mesma decisão produz o `role` e o raio. Elas saem da mesma expressão no
componente de propósito: `radio` com marca quadrada é um estado que não deve
ser construível.

`mark={true}` continua querendo dizer escolha única — era o `role` que ele já
entregava. O que mudou foi a forma passar a concordar com o papel.

## Por que isto não abre a porta para outras exceções

O critério que sustenta esta é verificável, e quase nada passa nele: **a forma
é a única portadora de uma informação que a pessoa precisa ter antes de agir.**

Não é "fica melhor assim". O ponto de macro continua quadrado, a ripa continua
reta, o fio continua reto — a forma deles é textura, e textura é exatamente o
que o ADR-004 protege. Uma proposta futura de arredondar conteúdo tem de
mostrar que informação a curva carrega, e que ela se perde sem a curva.

É a mesma família do [ADR-005](005-cor-nunca-sozinha.md): lá, a cor não pode
ser o único portador de um significado; aqui, a forma não pode contradizer o
significado que o `role` já declara.

## Consequências

**O que ganha.** A tela passa a dizer a mesma coisa a quem enxerga e a quem
escuta. E o sistema ganha o `checkbox`, que ele não tinha: antes, marcar
várias coisas numa lista não tinha componente — quem precisasse ia inventar
um, fora do sistema.

**O que custa.** O ADR-004 deixa de ser lido de uma vez só: quem for decidir
um raio agora tem duas páginas para ler, não uma. O antídoto é o critério
acima, que é estreito de propósito.

**Para quem consome.** Não quebra API: `mark` booleano continua compilando e
continua sendo escolha única. Quebra APARÊNCIA — quem já usava `mark` vê a
marca virar redonda. Se a lista era de marcar várias (e estava com o `role`
errado junto), a correção é `mark="multiple"`, que devolve o quadrado e ainda
conserta o que o leitor de tela anunciava.
