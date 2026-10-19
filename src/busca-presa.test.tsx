/// <reference types="vite/client" />
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchField } from "./atoms/SearchField";
import { Stack } from "./atoms/Stack";
import { Text } from "./atoms/Text";
import { Group } from "./molecules/Group";
import { ListRow } from "./molecules/ListRow";
import { Sheet } from "./molecules/Sheet";
import "./styles.css";
import { avaliar, bloco, paddingQueVale, partes, REGRAS, SEM_AREA, type Regra } from "./test/folha";

/**
 * A busca presa no topo do corpo da folha (ADR-017).
 *
 * O defeito, medido no E2E do Basalto com a 1.11.0 (KE-TEST-24 de lá): na
 * folha com a busca no topo do corpo que rola, o Tab que leva o foco a uma
 * linha só em parte à vista faz o navegador rolar o corpo o mínimo — e com o
 * `scrollTop` entre 5 e 32 o rótulo "Buscar alimento" está fora do recorte e a
 * moldura inteira à vista: um campo sem rótulo visível. A guarda de UX do
 * Basalto achou 28 estados assim na varredura do corpo.
 *
 * O happy-dom não faz layout nem rola, então a prova é a do resto da folha
 * (`./test/folha.ts`): o TEXTO das regras, avaliado, rolado aqui píxel a píxel
 * num corpo do tamanho do da medição (549px, Galaxy S24). Sem a regra presa,
 * esta conta acha os mesmos 28 estados que o Chromium e o WebKit acharam na
 * história "Com busca presa" com o conserto anulado; com ela, nenhum. O número
 * medido na tela é do navegador.
 */

const CORPO = 549;
const ANEL = 4; // `.co-root :focus-visible`: 2px de traço + 2px de afastamento
const SELETOR = ".co-sheet__body .co-search-field";
const SELETOR_INLINE = '.co-sheet[data-mode="inline"] .co-sheet__body .co-search-field';
const RECUO = ".co-sheet__body:has(.co-search-field)";
const RECUO_LG = '.co-sheet__body:has(.co-search[data-size="lg"])';

type Tamanho = "md" | "lg";

/** O que o último bloco do nível de cima com este seletor declara (o último vence). */
function declarado(regras: readonly Regra[], seletor: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const regra of regras) {
    if (regra.profundidade !== 0 || !regra.seletores.includes(seletor)) continue;
    for (const [propriedade, valor] of regra.declaracoes) mapa.set(propriedade, valor);
  }
  return mapa;
}

const px = (valor: string | undefined) => (valor === undefined ? 0 : avaliar(valor, SEM_AREA));

/** `margin-block`/`padding-block`: o de cima e o de baixo. */
function blocoDe(mapa: Map<string, string>, propriedade: "margin" | "padding"): [number, number] {
  const valor = mapa.get(`${propriedade}-block`);
  if (valor === undefined) return [0, 0];
  const [cima = "0", baixo = cima] = partes(valor);
  return [px(cima), px(baixo)];
}

/** As medidas que não mudam com a isca: o corpo, o rótulo, o vão e a moldura. */
function medidas(tamanho: Tamanho) {
  const linha = Object.fromEntries(bloco(".co-text"))["line-height"];
  const letra = Object.fromEntries(bloco('.co-text[data-variant="body"]'))["font-size"];
  const moldura =
    tamanho === "md"
      ? Object.fromEntries(bloco(".co-search"))["min-height"]
      : Object.fromEntries(bloco('.co-search[data-size="lg"]'))["min-height"];
  return {
    respiroDoCorpo: paddingQueVale(bloco(".co-sheet__body"), SEM_AREA).topo,
    rotulo: avaliar(`calc(${letra} * ${linha})`, SEM_AREA),
    vao: px(Object.fromEntries(bloco(".co-search-field"))["gap"]),
    moldura: px(moldura),
  };
}

/** A faixa como as regras a desenham: presa ou não, onde, e com que respiro. */
function faixa(regras: readonly Regra[]) {
  const mapa = declarado(regras, SELETOR);
  const [margemCima, margemBaixo] = blocoDe(mapa, "margin");
  const [respiroCima, respiroBaixo] = blocoDe(mapa, "padding");
  return {
    mapa,
    presa: mapa.get("position") === "sticky",
    topo: px(mapa.get("top")),
    margemCima,
    margemBaixo,
    respiroCima,
    respiroBaixo,
  };
}

/**
 * Rola o corpo píxel a píxel e devolve cada `scrollTop` em que a moldura está
 * inteira à vista e o rótulo não — o estado que a guarda do Basalto reprova.
 * A busca é a primeira coisa do corpo, como nas folhas de busca do Basalto.
 */
export function estadosSemRotulo(regras: readonly Regra[], tamanho: Tamanho): number[] {
  const m = medidas(tamanho);
  const f = faixa(regras);
  const parada = m.respiroDoCorpo + f.margemCima;
  const estados: number[] = [];
  for (let rolado = 0; rolado <= 600; rolado++) {
    const caixa = f.presa ? Math.max(parada - rolado, f.topo) : parada - rolado;
    const rotulo = caixa + f.respiroCima;
    const moldura = rotulo + m.rotulo + m.vao;
    const molduraAVista = moldura >= 0 && moldura + m.moldura <= CORPO;
    if (molduraAVista && rotulo < 0) estados.push(rolado);
  }
  return estados;
}

/** Tudo o que deixa a busca da folha sem rótulo, por baixo da lista ou com o foco atrás dela. */
export function faltas(regras: readonly Regra[]): string[] {
  const achados: string[] = [];
  const f = faixa(regras);

  for (const tamanho of ["md", "lg"] as const) {
    const estados = estadosSemRotulo(regras, tamanho);
    if (estados.length > 0) {
      achados.push(
        `${tamanho}: ${estados.length} estados com a moldura à vista e o rótulo fora do recorte (scrollTop ${estados[0]} a ${estados.at(-1)})`,
      );
    }
  }

  // A camada: as linhas do `Group` são `position: relative` e vêm depois.
  const camada = Number.parseInt(f.mapa.get("z-index") ?? "auto", 10);
  if (!(camada > 0)) achados.push(`camada: z-index ${f.mapa.get("z-index") ?? "auto"} deixa a lista pintar por cima da busca`);

  // O fundo é o da folha, nos dois modos: a lista que passa não aparece por baixo.
  const fundoFolha = declarado(regras, ".co-sheet").get("background");
  const fundoInline = declarado(regras, '.co-sheet[data-mode="inline"]').get("background");
  if (f.mapa.get("background") !== fundoFolha) {
    achados.push(`fundo: ${f.mapa.get("background") ?? "nenhum"} e não o da folha (${fundoFolha})`);
  }
  const inline = declarado(regras, SELETOR_INLINE).get("background") ?? f.mapa.get("background");
  if (inline !== fundoInline) achados.push(`fundo inline: ${inline ?? "nenhum"} e não o da folha (${fundoInline})`);

  // Parada, a busca fica onde sempre esteve: o respiro da faixa volta pela margem.
  if (f.margemCima + f.respiroCima !== 0 || f.margemBaixo + f.respiroBaixo !== 0) {
    achados.push(
      `lugar: margem ${f.margemCima}/${f.margemBaixo} e respiro ${f.respiroCima}/${f.respiroBaixo} mudam a busca parada`,
    );
  }

  // O foco para abaixo da faixa, com o anel de quem o recebe.
  for (const tamanho of ["md", "lg"] as const) {
    const m = medidas(tamanho);
    const altura = f.respiroCima + m.rotulo + m.vao + m.moldura + f.respiroBaixo;
    const recuoLg = declarado(regras, RECUO_LG).get("scroll-padding-top");
    const recuo = (tamanho === "lg" ? recuoLg : undefined) ?? declarado(regras, RECUO).get("scroll-padding-top");
    if (px(recuo) < altura + ANEL) {
      achados.push(`${tamanho}: o foco para a ${px(recuo)}px, por baixo da faixa de ${altura}px mais o anel`);
    }
  }

  return achados;
}

/** A folha com uma das regras trocada: a isca. */
function trocar(seletor: string, troca: (declaracoes: Regra["declaracoes"]) => Regra["declaracoes"]): Regra[] {
  return REGRAS.map((r) =>
    r.profundidade === 0 && r.seletores.includes(seletor) ? { ...r, declaracoes: troca(r.declaracoes) } : r,
  );
}

describe("a busca presa no topo da folha", () => {
  it("rolada píxel a píxel, a moldura nunca fica à vista sem o rótulo, e o foco para abaixo dela", () => {
    // Antes de tudo, que a conta mediu alguma coisa: a faixa e as medidas que
    // ela lê existem, e dão a faixa que o Chromium mediu (84,5px no md).
    const m = medidas("md");
    expect(m).toEqual({ respiroDoCorpo: 4, rotulo: 22.5, vao: 6, moldura: 44 });
    expect(faixa(REGRAS).presa).toBe(true);
    expect(faltas(REGRAS)).toEqual([]);
  });

  it("a isca: sem a regra presa, a conta acha os 28 estados que o Basalto mediu", () => {
    const isca = REGRAS.filter((r) => !r.seletores.includes(SELETOR) && !r.seletores.includes(SELETOR_INLINE));
    expect(estadosSemRotulo(isca, "md")).toEqual(Array.from({ length: 28 }, (_, k) => k + 5));
    expect(faltas(isca)).toEqual([
      "md: 28 estados com a moldura à vista e o rótulo fora do recorte (scrollTop 5 a 32)",
      "lg: 28 estados com a moldura à vista e o rótulo fora do recorte (scrollTop 5 a 32)",
      "camada: z-index auto deixa a lista pintar por cima da busca",
      "fundo: nenhum e não o da folha (var(--co-surface))",
      "fundo inline: nenhum e não o da folha (var(--co-surface-sunken))",
    ]);
  });

  it("a isca: cada parte do conserto desfeita reprova pelo seu motivo", () => {
    const semCamada = trocar(SELETOR, (d) => d.filter(([p]) => p !== "z-index"));
    expect(faltas(semCamada)).toEqual(["camada: z-index auto deixa a lista pintar por cima da busca"]);

    const semFundo = trocar(SELETOR, (d) => d.map(([p, v]) => [p, p === "background" ? "transparent" : v] as const));
    expect(faltas(semFundo)).toEqual(["fundo: transparent e não o da folha (var(--co-surface))"]);

    const inlineSemFundo = REGRAS.filter((r) => !r.seletores.includes(SELETOR_INLINE));
    expect(faltas(inlineSemFundo)).toEqual([
      "fundo inline: var(--co-surface) e não o da folha (var(--co-surface-sunken))",
    ]);

    const semMargem = trocar(SELETOR, (d) => d.filter(([p]) => p !== "margin-block"));
    expect(faltas(semMargem)).toEqual(["lugar: margem 0/0 e respiro 4/8 mudam a busca parada"]);

    // Solta (`static`), com o respiro e a margem que se anulam, volta o defeito
    // inteiro: o que segura o rótulo é a faixa presa, e não o respiro.
    const solta = trocar(SELETOR, (d) => d.map(([p, v]) => [p, p === "position" ? "static" : v] as const));
    expect(faltas(solta)).toEqual([
      "md: 28 estados com a moldura à vista e o rótulo fora do recorte (scrollTop 5 a 32)",
      "lg: 28 estados com a moldura à vista e o rótulo fora do recorte (scrollTop 5 a 32)",
    ]);

    const recuoCurto = trocar(RECUO, (d) => d.map(([p, v]) => [p, p === "scroll-padding-top" ? "80px" : v] as const));
    expect(faltas(recuoCurto)).toEqual(["md: o foco para a 80px, por baixo da faixa de 84.5px mais o anel"]);

    const semRecuoLg = REGRAS.filter((r) => !r.seletores.includes(RECUO_LG));
    expect(faltas(semRecuoLg)).toEqual(["lg: o foco para a 88.5px, por baixo da faixa de 92.5px mais o anel"]);
  });

  it.each(["overlay", "inline"] as const)(
    "a regra alcança a busca da folha %s mesmo dentro de um Stack, depois de um texto",
    (mode) => {
      // É como o Basalto monta as folhas: a busca num `Stack`, às vezes com um
      // aviso antes dela. O seletor não pode exigir filho direto do corpo.
      const { container } = render(
        <Sheet open mode={mode} title="Trocar o alimento" onClose={() => undefined}>
          <Stack gap={16}>
            <Text variant="callout">A troca vale só para hoje.</Text>
            <SearchField label="Buscar alimento" full />
            <Group label="Resultados">
              <ListRow onClick={() => undefined}>Arroz, branco, cozido</ListRow>
            </Group>
          </Stack>
        </Sheet>,
      );
      const busca = container.ownerDocument.querySelector(SELETOR);
      expect(busca).not.toBeNull();
      expect(busca?.querySelector('label .co-text[data-variant="body"]')).toHaveTextContent("Buscar alimento");
      expect(getComputedStyle(busca as Element).position).toBe("sticky");
    },
  );

  it("fora da folha, a busca não fica presa", () => {
    const { container } = render(<SearchField label="Buscar receita" />);
    const busca = container.querySelector(".co-search-field");
    expect(getComputedStyle(busca as Element).position).not.toBe("sticky");
  });
});
