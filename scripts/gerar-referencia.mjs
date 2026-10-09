/**
 * Gera a referência visual a partir do que o pacote realmente publica.
 *
 * A página NÃO tem cópia de nada. Ela recebe:
 *
 *   - `dist/styles.css` inteiro, o mesmo arquivo que vai no pacote. Se um
 *     token quebrar, a referência quebra junto — que é o ponto. A única
 *     troca é a `url("./fonts/...")` de cada fonte, que vira o arquivo de
 *     `dist/fonts/` em `data:`: a página abre sem o `dist/` ao lado (do
 *     disco, ou publicada como fragmento), e mostra as fontes que o pacote
 *     leva, sem buscar nada fora (ADR-014);
 *   - o mapa de ícones lido de `src/atoms/Icon.tsx`, para um ícone novo
 *     aparecer aqui sem ninguém lembrar de copiar;
 *   - a versão do `package.json`.
 *
 * Duas saídas, mesma fonte:
 *
 *   node scripts/gerar-referencia.mjs              -> docs/referencia.html (abre no navegador)
 *   node scripts/gerar-referencia.mjs --fragmento X -> X, sem <html>/<head>, para publicar
 */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, "..");

/**
 * Extrai o `CAMINHOS` do Icon.tsx.
 *
 * Um `import` do módulo exigiria compilar TypeScript só para ler um objeto de
 * strings constantes. A leitura por texto é frágil se alguém mudar a forma da
 * declaração — por isso ela FALHA ALTO em vez de devolver um mapa vazio, que
 * renderizaria uma seção de ícones em branco sem ninguém notar.
 */
async function lerIcones() {
  const fonte = await readFile(resolve(raiz, "src/atoms/Icon.tsx"), "utf8");
  const bloco = fonte.match(/const CAMINHOS: Record<IconName, string> = \{([\s\S]*?)\n\};/);
  if (!bloco) {
    throw new Error("não achei o mapa CAMINHOS em src/atoms/Icon.tsx — a declaração mudou de forma?");
  }

  const icones = {};
  const regra = /^\s*"?([a-z-]+)"?:\s*\n?\s*"((?:[^"\\]|\\.)*)"/gm;
  let achado;
  while ((achado = regra.exec(bloco[1])) !== null) {
    icones[achado[1]] = achado[2];
  }
  if (Object.keys(icones).length === 0) {
    throw new Error("o mapa CAMINHOS foi encontrado mas saiu vazio");
  }
  return icones;
}

/**
 * A versao vem da TAG, e nao do `package.json`.
 *
 * O `package.json` deste repositorio fica em 0.0.0 para sempre: quem grava o
 * numero e o `npm version` dentro do runner, num checkout descartavel, e ele
 * nunca volta para ca. A tag que o `lancar` criou e a unica marca local do que
 * foi publicado de verdade.
 */
function versaoPublicada(reserva) {
  try {
    return execFileSync("git", ["describe", "--tags", "--abbrev=0"], {
      cwd: raiz,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .replace(/^v/, "");
  } catch {
    // Sem tag ainda, ou fora de um clone: o numero do package.json e o que ha.
    return reserva;
  }
}

const [css, gabarito, pacote, icones] = await Promise.all([
  readFile(resolve(raiz, "dist/styles.css"), "utf8"),
  readFile(resolve(raiz, "docs/referencia.template.html"), "utf8"),
  readFile(resolve(raiz, "package.json"), "utf8").then(JSON.parse),
  lerIcones(),
]);

/**
 * Troca cada `url("./fonts/X")` pelo arquivo `dist/fonts/X` em `data:`.
 *
 * Falha alto se a folha citar uma fonte que o build não pôs em `dist/fonts/`:
 * é o mesmo defeito que o bundler de quem consome acusaria, e a referência
 * mostraria a fonte de reserva sem ninguém notar.
 */
async function embutirFontes(folha) {
  const citadas = [...new Set([...folha.matchAll(/url\("\.\/fonts\/([^"]+\.woff2)"\)/g)].map((achado) => achado[1]))];
  if (citadas.length === 0) throw new Error("dist/styles.css não cita nenhuma fonte de ./fonts/ — o @font-face sumiu?");
  let embutida = folha;
  for (const nome of citadas) {
    const bytes = await readFile(resolve(raiz, "dist/fonts", nome));
    embutida = embutida.replaceAll(`url("./fonts/${nome}")`, `url("data:font/woff2;base64,${bytes.toString("base64")}")`);
  }
  return embutida;
}

const MARCA_CSS = "/* ===================== COLUNA_CSS ===================== */";
const MARCA_ICONES = "/* COLUNA_ICONES */ {}";
const MARCA_VERSAO = "<!-- COLUNA_VERSAO -->";

for (const marca of [MARCA_CSS, MARCA_ICONES, MARCA_VERSAO]) {
  if (!gabarito.includes(marca)) throw new Error(`o gabarito não tem a marca ${marca}`);
}

const cssDaPagina = await embutirFontes(css.trim());

const corpo = gabarito
  .replace(MARCA_CSS, () => cssDaPagina)
  .replace(MARCA_ICONES, JSON.stringify(icones, null, 2))
  .replace(MARCA_VERSAO, versaoPublicada(pacote.version));

const indiceFragmento = process.argv.indexOf("--fragmento");
if (indiceFragmento !== -1) {
  const destino = process.argv[indiceFragmento + 1];
  if (!destino) throw new Error("--fragmento precisa do caminho de saída");
  await mkdir(dirname(resolve(destino)), { recursive: true });
  await writeFile(resolve(destino), corpo, "utf8");
  console.log(`fragmento -> ${destino} (${Math.round(corpo.length / 1024)} KB)`);
} else {
  // A versão que abre direto no navegador precisa do envelope que o fragmento
  // não tem — quem publica o fragmento fornece o dele.
  const pagina = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${corpo.split("\n")[0]}
</head>
<body>
${corpo.split("\n").slice(1).join("\n")}
</body>
</html>
`;
  const destino = resolve(raiz, "docs/referencia.html");
  await writeFile(destino, pagina, "utf8");
  console.log(`docs/referencia.html (${Math.round(pagina.length / 1024)} KB)`);
}
