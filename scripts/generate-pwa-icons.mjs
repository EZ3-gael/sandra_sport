import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const iconSvg = readFileSync(resolve(root, 'public/icons/icon.svg'));
const maskSvg = readFileSync(resolve(root, 'public/icons/icon-maskable.svg'));

const tasks = [
  { input: iconSvg, size: 192, out: 'public/icons/icon-192.png' },
  { input: iconSvg, size: 512, out: 'public/icons/icon-512.png' },
  { input: maskSvg, size: 512, out: 'public/icons/icon-maskable-512.png' },
];

for (const { input, size, out } of tasks) {
  await sharp(input, { density: 600 })
    .resize(size, size)
    .png()
    .toFile(resolve(root, out));
  console.log('✓', out, `(${size}x${size})`);
}
