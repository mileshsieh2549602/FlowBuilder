import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(".");
const srcHtmlPath = resolve(projectRoot, "src/ui.html");
const distUiJsPath = resolve(projectRoot, "dist/ui.js");
const distUiHtmlPath = resolve(projectRoot, "dist/ui.html");

const [uiHtml, uiJs] = await Promise.all([
  readFile(srcHtmlPath, "utf8"),
  readFile(distUiJsPath, "utf8")
]);

const safeUiJs = uiJs.replace(/<\/script>/gi, "<\\/script>");
const scriptTag = `<script>\n${safeUiJs}\n</script>`;
const mergedHtml = uiHtml.replace(/<script\s+src="\.\/ui\.js"><\/script>/i, scriptTag);

await mkdir(dirname(distUiHtmlPath), { recursive: true });
await writeFile(distUiHtmlPath, mergedHtml, "utf8");
