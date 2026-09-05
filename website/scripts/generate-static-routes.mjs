import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pageMeta } from "../src/page-meta.mjs";

const distDirectory = resolve("dist");
const entryFile = resolve(distDirectory, "index.html");
const entry = await readFile(entryFile, "utf8");
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
await Promise.all(Object.entries(pageMeta).map(async ([route, [title, description]]) => {
  const directory = resolve(distDirectory, route.replace(/^\//, ""));
  await mkdir(directory, { recursive: true });
  const html = entry
    .replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${escape(description)}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${escape(title)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${escape(description)}`);
  await writeFile(resolve(directory, "index.html"), html);
}));
await copyFile(entryFile, resolve(distDirectory, "404.html"));
