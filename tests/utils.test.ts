import { describe, expect, it } from "@jest/globals";
import { slugify } from "../src/lib/utils";

describe("slugify", () => {
  it("converte texto com acentos para slug", () => {
    expect(slugify("Como a IA está integrada")).toBe(
      "como-a-ia-esta-integrada",
    );
  });

  it("remove caracteres especiais", () => {
    expect(slugify("Privacidade de dados & LGPD!")).toBe(
      "privacidade-de-dados-lgpd",
    );
  });

  it("normaliza espaços e hífens duplicados", () => {
    expect(slugify("Ecossistema   Koinosystems -- cinco")).toBe(
      "ecossistema-koinosystems-cinco",
    );
  });

  it("retorna string vazia para entrada vazia", () => {
    expect(slugify("   ")).toBe("");
  });
});
