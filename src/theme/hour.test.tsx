import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { vigiarCsp } from "../test/csp";
import { applyHour, hourStops, hourStyle, hourVars } from "./hour";

/**
 * A cor da hora (ADR-022, ADR-024): as cinco paradas, a interpolação entre
 * elas, a virada da meia-noite e o jeito de aplicar sem violar a CSP.
 */

describe("hourVars", () => {
  it.each([
    ["06:00", 350, 0.11],
    ["09:00", 75, 0.14],
    ["12:00", 215, 0.12],
    ["16:00", 40, 0.15],
    ["20:00", 285, 0.12],
  ])("na parada das %s dá exatamente o matiz %d e o croma %d", (hora, h, c) => {
    expect(hourVars(hora)).toEqual({ h, c });
  });

  it("as paradas exportadas são as cinco da identidade, em ordem", () => {
    expect(hourStops).toEqual([
      { time: "06:00", h: 350, c: 0.11 },
      { time: "09:00", h: 75, c: 0.14 },
      { time: "12:00", h: 215, c: 0.12 },
      { time: "16:00", h: 40, c: 0.15 },
      { time: "20:00", h: 285, c: 0.12 },
    ]);
  });

  it("entre duas paradas interpola o croma em linha reta e o matiz pelo arco menor", () => {
    // 12:30: um oitavo do caminho de 215 a 40, que pelo arco menor desce
    // 175 graus (e não sobe 185).
    expect(hourVars("12:30")).toEqual({ h: 193.1, c: 0.124 });
    // 14:00, a metade: 215 − 87,5.
    expect(hourVars("14:00")).toEqual({ h: 127.5, c: 0.135 });
    // 07:30, a metade da aurora até a manhã: 350 → 75 sobe 85 passando por 0.
    expect(hourVars("07:30")).toEqual({ h: 32.5, c: 0.125 });
    // 18:00, a metade do entardecer até a noite: 40 → 285 desce 115 passando
    // por 0, e não pelo verde.
    expect(hourVars("18:00")).toEqual({ h: 342.5, c: 0.135 });
  });

  it("atravessa a meia-noite sem salto: das 20h às 6h a noite anda do anil à aurora", () => {
    // Dez horas, de 285 a 350 (sobe 65), croma de 0,12 a 0,11.
    expect(hourVars("23:59")).toEqual(hourVars(23 * 60 + 59));
    expect(hourVars("01:00")).toEqual({ h: 317.5, c: 0.115 });
    expect(hourVars("00:00")).toEqual({ h: 311, c: 0.116 });
    // O minuto antes e o depois da virada ficam a menos de um décimo de grau.
    const antes = hourVars("23:59");
    const depois = hourVars("00:00");
    expect(Math.abs(depois.h - antes.h)).toBeLessThan(0.2);
    expect(Math.abs(depois.c - antes.c)).toBeLessThanOrEqual(0.001);
    // E antes das 6h ainda é noite, chegando à aurora.
    expect(hourVars("05:59").h).toBeGreaterThan(349);
    expect(hourVars("05:59").h).toBeLessThan(350);
  });

  it("o dia inteiro, minuto a minuto, fica no círculo e sem salto maior que um grau", () => {
    let anterior = hourVars(DIA_FINAL);
    for (let minuto = 0; minuto < 24 * 60; minuto += 1) {
      const atual = hourVars(minuto);
      expect(atual.h).toBeGreaterThanOrEqual(0);
      expect(atual.h).toBeLessThan(360);
      const salto = Math.min(Math.abs(atual.h - anterior.h), 360 - Math.abs(atual.h - anterior.h));
      expect(salto, `das ${minuto - 1} às ${minuto}`).toBeLessThanOrEqual(1);
      anterior = atual;
    }
  });

  it("aceita espaço em volta e recusa a hora que não existe, alto", () => {
    expect(hourVars(" 09:00 ")).toEqual({ h: 75, c: 0.14 });
    for (const errada of ["24:00", "9:00", "12:60", "meio-dia", ""]) {
      expect(() => hourVars(errada), errada).toThrow(RangeError);
    }
    for (const errado of [-1, 1440, 12.5, Number.NaN]) {
      expect(() => hourVars(errado), String(errado)).toThrow(RangeError);
    }
  });
});

const DIA_FINAL = 24 * 60 - 1;

describe("aplicar a hora sem violar a CSP", () => {
  it("hourStyle dá as duas propriedades para a prop style, e o React as escreve pelo CSSOM", () => {
    expect(hourStyle("12:00")).toEqual({ "--co-hora-h": "215", "--co-hora-c": "0.12" });

    const vigia = vigiarCsp();
    const { getByText } = render(<section style={hourStyle("20:00")}>Jantar</section>);
    const achados = vigia.parar();
    const secao = getByText("Jantar");
    expect(secao.style.getPropertyValue("--co-hora-h")).toBe("285");
    expect(secao.style.getPropertyValue("--co-hora-c")).toBe("0.12");
    expect(achados).toEqual([]);
  });

  it("applyHour escreve no elemento pelo setProperty, e nunca pelo atributo", () => {
    const elemento = document.createElement("div");
    const escrevePropriedade = vi.spyOn(elemento.style, "setProperty");
    const vigia = vigiarCsp();
    applyHour(elemento, "07:30");
    expect(vigia.parar()).toEqual([]);
    expect(escrevePropriedade.mock.calls).toEqual([
      ["--co-hora-h", "32.5"],
      ["--co-hora-c", "0.125"],
    ]);
    expect(elemento.style.getPropertyValue("--co-hora-h")).toBe("32.5");
  });

  it("a isca: escrever a hora pelo atributo é acusado pela vigia", () => {
    const elemento = document.createElement("div");
    const vigia = vigiarCsp();
    elemento.setAttribute("style", "--co-hora-h: 32.5");
    expect(vigia.parar()).toEqual([{ tipo: "setAttribute(style)", detalhe: "<div> --co-hora-h: 32.5" }]);
  });

  it("applyHour recusa a hora que não existe sem tocar no elemento", () => {
    const elemento = document.createElement("div");
    expect(() => applyHour(elemento, "25:00")).toThrow(RangeError);
    expect(elemento.style.getPropertyValue("--co-hora-h")).toBe("");
  });
});
