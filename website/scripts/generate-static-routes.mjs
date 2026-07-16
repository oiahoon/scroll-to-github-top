import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const distDirectory = resolve("dist");
const entryFile = resolve(distDirectory, "index.html");
const routes = ["features", "modes", "guide", "privacy", "support"];

await Promise.all(
  routes.map(async (route) => {
    const routeDirectory = resolve(distDirectory, route);
    await mkdir(routeDirectory, { recursive: true });
    await copyFile(entryFile, resolve(routeDirectory, "index.html"));
  }),
);

await copyFile(entryFile, resolve(distDirectory, "404.html"));
