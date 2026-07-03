import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const SRC = '/home/user/zairo-frontend/public';
const OUT = '/tmp/claude-0/-home-user/1fe07f5a-8901-52d2-a35a-518ec3cf3d25/scratchpad/optimizado';

const kb = (b) => (b / 1024).toFixed(0) + ' KB';
async function size(p){ try { return (await stat(p)).size; } catch { return 0; } }

await mkdir(path.join(OUT, 'secuencia'), { recursive: true });
await mkdir(path.join(OUT, 'assets'), { recursive: true });

let totalAntes = 0, totalJpg = 0, totalWebp = 0;

// ---- Frames de la secuencia ----
const frames = (await readdir(path.join(SRC, 'secuencia')))
  .filter(f => /\.jpe?g$/i.test(f)).sort();

for (const f of frames) {
  const inPath = path.join(SRC, 'secuencia', f);
  const base = f.replace(/\.jpe?g$/i, '');
  const antes = await size(inPath);
  totalAntes += antes;

  // JPG real optimizado (mismo nombre -> reemplazo directo, sin tocar codigo)
  await sharp(inPath)
    .jpeg({ quality: 78, mozjpeg: true, progressive: true })
    .toFile(path.join(OUT, 'secuencia', base + '.jpg'));
  const sj = await size(path.join(OUT, 'secuencia', base + '.jpg'));
  totalJpg += sj;

  // WebP (aun mas liviano, para la version con codigo actualizado)
  await sharp(inPath)
    .webp({ quality: 72, effort: 5 })
    .toFile(path.join(OUT, 'secuencia', base + '.webp'));
  const sw = await size(path.join(OUT, 'secuencia', base + '.webp'));
  totalWebp += sw;

  console.log(`${f.padEnd(18)} ${kb(antes).padStart(9)}  ->  jpg ${kb(sj).padStart(8)} | webp ${kb(sw).padStart(8)}`);
}

console.log('\n--- ASSETS (loader / plano) ---');
// ring y logo: RGBA, 1254px -> bajar a 640px (se muestran <= 230px)
for (const name of ['zairo-loader-ring', 'zairo-loader-logo']) {
  const inPath = path.join(SRC, 'assets', name + '.png');
  const antes = await size(inPath); totalAntes += antes;
  await sharp(inPath).resize({ width: 640, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(path.join(OUT, 'assets', name + '.png'));
  await sharp(inPath).resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 88, effort: 5 })
    .toFile(path.join(OUT, 'assets', name + '.webp'));
  const sp = await size(path.join(OUT, 'assets', name + '.png'));
  const sw = await size(path.join(OUT, 'assets', name + '.webp'));
  totalJpg += sp; totalWebp += sw;
  console.log(`${(name+'.png').padEnd(26)} ${kb(antes).padStart(9)}  ->  png ${kb(sp).padStart(8)} | webp ${kb(sw).padStart(8)}`);
}
// plano: mapa RGB 1085x1450 -> optimizar (mantener detalle)
{
  const inPath = path.join(SRC, 'assets', 'plano-lost-trip.png');
  const antes = await size(inPath); totalAntes += antes;
  await sharp(inPath).jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(path.join(OUT, 'assets', 'plano-lost-trip.jpg'));
  await sharp(inPath).webp({ quality: 80, effort: 5 })
    .toFile(path.join(OUT, 'assets', 'plano-lost-trip.webp'));
  const sj = await size(path.join(OUT, 'assets', 'plano-lost-trip.jpg'));
  const sw = await size(path.join(OUT, 'assets', 'plano-lost-trip.webp'));
  totalJpg += sj; totalWebp += sw;
  console.log(`${'plano-lost-trip.png'.padEnd(26)} ${kb(antes).padStart(9)}  ->  jpg ${kb(sj).padStart(8)} | webp ${kb(sw).padStart(8)}`);
}

console.log('\n=========================================');
console.log('TOTAL ANTES (png):        ', kb(totalAntes), `(${(totalAntes/1024/1024).toFixed(1)} MB)`);
console.log('TOTAL DESPUES (jpg/png):  ', kb(totalJpg), `(${(totalJpg/1024/1024).toFixed(1)} MB)`);
console.log('TOTAL DESPUES (webp):     ', kb(totalWebp), `(${(totalWebp/1024/1024).toFixed(1)} MB)`);
console.log('Reduccion webp:           ', (100 - totalWebp/totalAntes*100).toFixed(1) + '%');
