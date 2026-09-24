import sharp from 'sharp';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

// Keep the original photographs untouched. Ship responsive, auto-oriented WebP copies.
const source = path.resolve('public/birthday');
const output = path.join(source, 'editorial');
await mkdir(output, { recursive: true });
const files = (await readdir(source)).filter((file) => /^IMG_.*\.jpe?g$/i.test(file));
for (const file of files) {
  const name = path.parse(file).name.replaceAll(' ', '-').toLowerCase();
  for (const width of [640, 1280]) {
    await sharp(path.join(source, file)).rotate().resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 }).toFile(path.join(output, `${name}-${width}.webp`));
  }
}
const bytes = await Promise.all((await readdir(output)).map(async (file) => (await stat(path.join(output, file))).size));
console.log(`${files.length} photographs prepared in two sizes (${(bytes.reduce((a, b) => a + b, 0) / 1024 / 1024).toFixed(1)} MB total).`);
