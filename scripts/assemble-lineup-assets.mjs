import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function readBase64Parts(sourceDir, label) {
  const parts = (await readdir(sourceDir))
    .filter((file) => /^part\d+\.b64$/.test(file))
    .sort();

  if (!parts.length) {
    throw new Error(`No ${label} image parts found.`);
  }

  return (
    await Promise.all(parts.map((file) => readFile(join(sourceDir, file), 'utf8')))
  )
    .join('')
    .replace(/\s+/g, '');
}

function decodeWebp(base64, label) {
  const webp = Buffer.from(base64, 'base64');
  const riff = webp.subarray(0, 4).toString('ascii');
  const webpSignature = webp.subarray(8, 12).toString('ascii');

  if (riff !== 'RIFF' || webpSignature !== 'WEBP') {
    throw new Error(`${label} did not decode into a valid WebP file.`);
  }

  return webp;
}

async function assembleDeeikelLineup() {
  const sourceDir = join(root, 'scripts', 'assets', 'deeikel-hq');
  const outputDir = join(root, 'public', 'assets', 'lineup');
  const webpOutputPath = join(outputDir, 'deeikel-zairo-lineup.webp');
  const svgOutputPath = join(outputDir, 'deeikel-zairo-lineup.svg');

  const base64 = await readBase64Parts(sourceDir, 'Deeikel');
  const webp = decodeWebp(base64, 'Deeikel');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254"><image width="1254" height="1254" href="data:image/webp;base64,${base64}"/></svg>`;

  await mkdir(outputDir, { recursive: true });
  await writeFile(webpOutputPath, webp);
  await writeFile(svgOutputPath, svg, 'utf8');

  console.log(`Generated ${webpOutputPath} and ${svgOutputPath}`);
}

async function assembleInfamousFlyer() {
  const sourceDir = join(root, 'scripts', 'assets', 'infamous', 'final-flyer');
  const outputDir = join(root, 'public', 'assets', 'infamous');
  const outputPath = join(outputDir, 'infamous-flyer.webp');

  const base64 = await readBase64Parts(sourceDir, 'Infamous flyer');
  const webp = decodeWebp(base64, 'Infamous flyer');

  if (webp.length !== 48638) {
    throw new Error(
      `Infamous flyer size mismatch. Expected 48638 bytes and got ${webp.length}.`
    );
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, webp);

  console.log(`Generated ${outputPath}`);
}

await assembleDeeikelLineup();
await assembleInfamousFlyer();
