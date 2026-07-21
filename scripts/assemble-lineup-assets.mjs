import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(root, 'scripts', 'assets', 'deeikel-hq');
const outputPath = join(root, 'public', 'assets', 'lineup', 'deeikel-zairo-lineup.avif');

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

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, Buffer.from(base64, 'base64'));

console.log(`Generated ${outputPath}`);
