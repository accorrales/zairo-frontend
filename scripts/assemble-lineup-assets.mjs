import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(root, 'scripts', 'assets', 'deeikel-hq');
const outputDir = join(root, 'public', 'assets', 'lineup');
const webpOutputPath = join(outputDir, 'deeikel-zairo-lineup.webp');
const svgOutputPath = join(outputDir, 'deeikel-zairo-lineup.svg');

const parts = (await readdir(sourceDir))
  .filter((file) => /^part\d+\.b64$/.test(file))
  .sort();

if (!parts.length) {
  throw new Error('No Deeikel image parts found.');
}

const base64 = (
  await Promise.all(parts.map((file) => readFile(join(sourceDir, file), 'utf8')))
)
  .join('')
  .replace(/\s+/g, '');

const webp = Buffer.from(base64, 'base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254"><image width="1254" height="1254" href="data:image/webp;base64,${base64}"/></svg>`;

await mkdir(outputDir, { recursive: true });
await writeFile(webpOutputPath, webp);
await writeFile(svgOutputPath, svg, 'utf8');

console.log(`Generated ${webpOutputPath} and ${svgOutputPath}`);
