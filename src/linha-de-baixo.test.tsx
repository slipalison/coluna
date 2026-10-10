import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Text } from "./atoms/Text";
import { ListRow } from "./molecules/ListRow";
import { NavList } from "./molecules/NavList";
import "./styles.css";

/**
 * A linha de baixo da `ListRow` (`description`, ADR-015).
 *
 * O diário do Basalto punha o resumo da refeição como segundo filho da linha,
 * e num telefone de 393px ele quebrava em três ou quatro linhas: a lista mudava
 * de altura com o que a pessoa comeu. A `description` é a linha de baixo do
 * `NavList` trazida para a `ListRow`, e este arquivo prova quatro coisas, cada
 * uma com a isca que mostra que a prova morde:
 *
 * - SÓ COM A PROP. Sem `description`, a árvore é a da 1.9.0, letra por letra —
 *   a mesma string de HTML que a versão anterior produzia.
 * - UMA LINHA. O happy-dom não faz layout (`scrollWidth` é 0 em tudo), então
 *   a prova é a regra computada, como em `fontes.test.tsx`: a linha não quebra,
 *   corta com reticências, e mora num corpo que encolhe. O número em pixel, no
 *   navegador, está na medição do ADR-015.
 * - A TIPOGRAFIA DO NAVLIST. O mesmo tamanho, a mesma cor e o mesmo corte da
 *   descrição dele, nos dois temas.
 * - O NOME DO BOTÃO. O texto inteiro chega ao leitor de tela, cortado só no
 *   desenho, e entra no nome, na ordem da tela — e não na descrição, como no
 *   `NavList`: o nome tem de conter o que se lê no botão (WCAG 2.5.3, ADR-015).
 */

const RESUMO =
  "Arroz, tipo 1, cozido · Feijão, carioca, cozido · Frango, peito, sem pele, grelhado · Alface, crespa, crua · Azeite de oliva, extra virgem";

/** A largura útil de um telefone de 393px, menos a calha de 16px de cada lado. */
const TELEFONE = { width: "361px" } as const;

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  for (const isca of document.head.querySelectorAll("style[data-isca]")) isca.remove();
});

// ---------------------------------------------------------- só com a prop --

/**
 * O HTML que a 1.9.0 produzia para estas três linhas, copiado da versão de
 * antes da `description`: o botão com horário, kcal e seta; a linha que é
 * `checkbox`; e a de só leitura, pequena e alinhada pelo topo.
 */
const ANTES = {
  botao:
    '<button type="button" class="co-list-row" data-interactive="true" aria-expanded="false"><span class="co-list-row__leading">12:40</span><span class="co-list-row__body">Almoço</span><span class="co-list-row__trailing">612 kcal</span><span class="co-list-row__chevron"><svg class="co-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg></span></button>',
  marca:
    '<button type="button" class="co-list-row" data-selected="true" data-interactive="true" role="checkbox" aria-checked="true"><span class="co-list-row__mark" data-mark="multiple"><svg class="co-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L19 7"></path></svg></span><span class="co-list-row__body">Sem lactose</span></button>',
  leitura:
    '<div class="co-list-row" data-size="sm" data-align="start"><span class="co-list-row__leading">1</span><span class="co-list-row__body">Arroz</span><span class="co-list-row__trailing">128</span></div>',
} as const;

/** As mesmas três linhas, com ou sem a linha de baixo. */
function linhas(description?: string) {
  return {
    botao: (
      <ListRow
        onClick={vi.fn()}
        leading="12:40"
        trailing="612 kcal"
        expanded={false}
        description={description}
      >
        Almoço
      </ListRow>
    ),
    marca: (
      <ListRow mark="multiple" selected onClick={vi.fn()} description={description}>
        Sem lactose
      </ListRow>
    ),
    leitura: (
      <ListRow size="sm" align="start" leading="1" trailing="128" description={description}>
        Arroz
      </ListRow>
    ),
  };
}

describe("a linha de baixo só existe com a prop", () => {
  it.each(Object.keys(ANTES) as (keyof typeof ANTES)[])("sem description, o %s é o HTML da 1.9.0", (caso) => {
    const { container } = render(linhas()[caso]);
    expect(container.innerHTML).toBe(ANTES[caso]);
  });

  it.each(Object.keys(ANTES) as (keyof typeof ANTES)[])(
    "a isca: com description, o %s deixa de ser o HTML da 1.9.0",
    (caso) => {
      const { container } = render(linhas("Arroz · Feijão")[caso]);
      expect(container.innerHTML).not.toBe(ANTES[caso]);
    },
  );

  it("com a prop, a linha de baixo aparece uma vez, com o texto inteiro no DOM", () => {
    const { container } = render(
      <ListRow onClick={vi.fn()} description={RESUMO}>
        Almoço
      </ListRow>,
    );
    const debaixo = container.querySelectorAll(".co-list-row__description");
    expect(debaixo).toHaveLength(1);
    // Reticências são desenho: o texto que o leitor de tela lê é o inteiro.
    expect(debaixo[0]).toHaveTextContent(RESUMO, { normalizeWhitespace: false });
  });
});

// ------------------------------------------------------------- uma linha --

/**
 * O que impede o elemento de ser uma linha só que encolhe com a largura, um
 * item por defeito. Vazio é uma linha.
 *
 * - não quebra (`white-space: nowrap`), corta (`overflow: hidden`) e mostra
 *   que cortou (`text-overflow: ellipsis`);
 * - é item de um corpo em coluna — o `flex` faz do `<span>` um bloco, e o
 *   bloco é o que o `text-overflow` precisa — que encolhe (`min-width: 0`).
 *   Sem o encolher, o corpo cresce até o texto inteiro e empurra o `trailing`.
 */
function porQueNaoEUmaLinha(elemento: Element): string[] {
  const proprio = getComputedStyle(elemento);
  const corpo = elemento.parentElement ? getComputedStyle(elemento.parentElement) : undefined;
  const defeitos: string[] = [];
  if (proprio.whiteSpace !== "nowrap") defeitos.push(`quebra (white-space: ${proprio.whiteSpace})`);
  if (proprio.overflow !== "hidden") defeitos.push(`não corta (overflow: ${proprio.overflow})`);
  if (proprio.textOverflow !== "ellipsis") defeitos.push(`sem reticências (text-overflow: ${proprio.textOverflow})`);
  if (corpo?.display !== "flex" || corpo.flexDirection !== "column") {
    defeitos.push(`o corpo não é coluna (display: ${corpo?.display}, flex-direction: ${corpo?.flexDirection})`);
  }
  if (!["0", "0px"].includes(corpo?.minWidth ?? "")) defeitos.push(`o corpo não encolhe (min-width: ${corpo?.minWidth})`);
  return defeitos;
}

/** A refeição do diário no telefone: horário, nome, kcal, seta e o resumo. */
function Refeicao({ resumoComoFilho = false }: Readonly<{ resumoComoFilho?: boolean }>) {
  return (
    <div style={TELEFONE}>
      <ListRow
        onClick={vi.fn()}
        expanded={false}
        leading="12:40"
        trailing="612 kcal"
        description={resumoComoFilho ? undefined : RESUMO}
      >
        <Text as="span" variant="headline">
          Almoço
        </Text>
        {resumoComoFilho ? (
          <Text as="span" variant="footnote" tone="muted" data-testid="resumo-filho">
            {RESUMO}
          </Text>
        ) : null}
      </ListRow>
    </div>
  );
}

describe("a linha de baixo é uma linha", () => {
  it("não quebra, corta com reticências, e mora num corpo que encolhe", () => {
    const { container } = render(<Refeicao />);
    const debaixo = container.querySelector(".co-list-row__description");
    expect(debaixo).not.toBeNull();
    expect(porQueNaoEUmaLinha(debaixo as Element)).toEqual([]);
  });

  it("é o último item do corpo, depois do que o children trouxe", () => {
    const { container } = render(<Refeicao />);
    const corpo = container.querySelector(".co-list-row__body") as Element;
    expect(corpo.lastElementChild).toHaveClass("co-list-row__description");
    expect(corpo.firstElementChild).toHaveTextContent("Almoço");
  });

  it("a isca: o resumo como segundo filho — o jeito de antes no diário — quebra", () => {
    render(<Refeicao resumoComoFilho />);
    // Só o nome do defeito: o happy-dom não escreve o valor inicial de uma
    // propriedade que nenhuma regra declarou (devolve "", e não `normal`).
    const defeitos = porQueNaoEUmaLinha(screen.getByTestId("resumo-filho")).map((d) => d.split(" (")[0]);
    expect(defeitos).toEqual(["quebra", "não corta", "sem reticências"]);
  });

  it("a isca: sem o min-width: 0 do corpo, a linha não encolhe", () => {
    const isca = document.createElement("style");
    isca.dataset["isca"] = "";
    isca.textContent = ".isca-corpo .co-list-row__body { min-width: auto; }";
    document.head.append(isca);
    const { container } = render(
      <div className="isca-corpo">
        <Refeicao />
      </div>,
    );
    expect(porQueNaoEUmaLinha(container.querySelector(".co-list-row__description") as Element)).toEqual([
      "o corpo não encolhe (min-width: auto)",
    ]);
  });
});

// --------------------------------------------------- a tipografia do NavList --

/** O que faz duas linhas de baixo parecerem a mesma: letra, cor e corte. */
const TIPOGRAFIA = [
  "font-family",
  "font-size",
  "line-height",
  "font-weight",
  "letter-spacing",
  "color",
  "white-space",
  "overflow",
  "text-overflow",
] as const;

const tipografia = (elemento: Element) => {
  const computado = getComputedStyle(elemento);
  return Object.fromEntries(TIPOGRAFIA.map((propriedade) => [propriedade, computado.getPropertyValue(propriedade)]));
};

describe.each(["light", "dark"])("a tipografia é a da descrição do NavList, no tema %s", (tema) => {
  function asDuas(comoFilho = false) {
    document.documentElement.dataset["theme"] = tema;
    const { container } = render(
      <>
        <NavList
          label="Receitas"
          opens="detail"
          value="frango"
          onChange={vi.fn()}
          items={[{ value: "frango", label: "Frango com batata-doce", description: "4 porções · 30 min" }]}
        />
        {comoFilho ? <Refeicao resumoComoFilho /> : <Refeicao />}
      </>,
    );
    const daLista = container.querySelector(".co-nav-list__description") as Element;
    const daLinha = comoFilho
      ? screen.getByTestId("resumo-filho")
      : (container.querySelector(".co-list-row__description") as Element);
    return { daLista, daLinha };
  }

  it("mesma letra, mesma cor, mesmo corte — e o mesmo degrau da rampa", () => {
    const { daLista, daLinha } = asDuas();
    expect(tipografia(daLinha)).toEqual(tipografia(daLista));
    expect(daLinha).toHaveAttribute("data-variant", daLista.getAttribute("data-variant"));
    expect(daLinha).toHaveAttribute("data-tone", daLista.getAttribute("data-tone"));
  });

  it("a isca: o resumo de antes (footnote, muted) não passa por ela", () => {
    const { daLista, daLinha } = asDuas(true);
    expect(tipografia(daLinha)).not.toEqual(tipografia(daLista));
  });
});

// ------------------------------------------------------- o nome do botão --

describe("o leitor de tela lê tudo, e o nome contém o que se lê", () => {
  it("o nome é a linha inteira, na ordem da tela: horário, refeição, resumo inteiro e kcal", () => {
    render(<Refeicao />);
    const linha = screen.getByRole("button", { name: `12:40 Almoço ${RESUMO} 612 kcal` });
    expect(linha).toHaveAttribute("aria-expanded", "false");
    // Nada é tirado do nome para virar descrição: a linha não ganha `aria-*`.
    expect(linha).not.toHaveAttribute("aria-labelledby");
    expect(linha).not.toHaveAttribute("aria-describedby");
  });

  it("com marca de escolha, o radio tem a opção e a conta no nome", () => {
    render(
      <ListRow mark selected onClick={vi.fn()} description="370 + 21,6 × 65,91 = 1.793,7">
        Katch-McArdle
      </ListRow>,
    );
    expect(screen.getByRole("radio", { name: "Katch-McArdle 370 + 21,6 × 65,91 = 1.793,7" })).toBeChecked();
  });

  it("a isca: a linha de baixo escondida do leitor de tela some do nome", () => {
    render(
      <ListRow
        onClick={vi.fn()}
        leading="12:40"
        trailing="612 kcal"
        description={<span aria-hidden="true">{RESUMO}</span>}
      >
        Almoço
      </ListRow>,
    );
    expect(screen.queryByRole("button", { name: `12:40 Almoço ${RESUMO} 612 kcal` })).toBeNull();
    expect(screen.getByRole("button", { name: "12:40 Almoço 612 kcal" })).toBeInTheDocument();
  });

  it("sem onClick não há controle: o texto inteiro está no DOM, na mesma ordem", () => {
    const { container } = render(
      <ListRow leading="12:40" trailing="612 kcal" description={RESUMO}>
        Almoço
      </ListRow>,
    );
    const linha = container.firstElementChild as Element;
    expect(linha.tagName).toBe("DIV");
    expect(linha).toHaveTextContent(`12:40Almoço${RESUMO}612 kcal`, { normalizeWhitespace: false });
  });
});
