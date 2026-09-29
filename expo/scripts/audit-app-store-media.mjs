#!/usr/bin/env node

import { readdirSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const acceptedPortraitSizes = new Set([
  '1260x2736',
  '1290x2796',
  '1320x2868',
]);
const allowedExtensions = new Set(['.png', '.jpg', '.jpeg']);
const inputDirectory = process.argv[2];

if (!inputDirectory) {
  console.error('Használat: pnpm run audit:app-store-media -- "/teljes/út/a/képmappához"');
  process.exit(2);
}

const directory = resolve(inputDirectory);

try {
  if (!statSync(directory).isDirectory()) {
    throw new Error('A megadott útvonal nem mappa.');
  }
} catch (error) {
  console.error(`HIBA: ${error.message}`);
  process.exit(2);
}

const files = readdirSync(directory)
  .filter((file) => allowedExtensions.has(extname(file).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, 'hu'));

if (files.length < 1 || files.length > 10) {
  console.error(`HIBA: 1–10 képfájl szükséges, ebben a mappában ${files.length} található.`);
  process.exit(1);
}

let failed = false;
let expectedSize;

for (const file of files) {
  const filePath = resolve(directory, file);
  const result = spawnSync(
    'sips',
    ['-g', 'pixelWidth', '-g', 'pixelHeight', '-g', 'hasAlpha', filePath],
    { encoding: 'utf8' },
  );

  if (result.error || result.status !== 0) {
    console.error(`HIBA: ${file} nem olvasható a macOS képellenőrzőjével.`);
    failed = true;
    continue;
  }

  const width = result.stdout.match(/pixelWidth:\s*(\d+)/)?.[1];
  const height = result.stdout.match(/pixelHeight:\s*(\d+)/)?.[1];
  const hasAlpha = result.stdout.match(/hasAlpha:\s*(\w+)/)?.[1]?.toLowerCase();
  const size = `${width}x${height}`;
  const problems = [];

  if (!acceptedPortraitSizes.has(size)) {
    problems.push(`nem elfogadott 6,9\" álló méret: ${size}`);
  }
  if (hasAlpha !== 'no') {
    problems.push('átlátszósági csatornát tartalmaz');
  }
  if (expectedSize && size !== expectedSize) {
    problems.push(`eltér a sorozat ${expectedSize} méretétől`);
  }
  expectedSize ??= size;

  if (problems.length > 0) {
    console.error(`HIBÁS  ${file}: ${problems.join('; ')}`);
    failed = true;
  } else {
    console.log(`RENDBEN ${file}: ${size}, nincs átlátszóság`);
  }
}

if (failed) {
  console.error('\nAz App Store-képcsomag technikai ellenőrzése sikertelen.');
  process.exit(1);
}

console.log(`\nSIKER: ${files.length} kép technikai ellenőrzése rendben (${expectedSize}).`);
