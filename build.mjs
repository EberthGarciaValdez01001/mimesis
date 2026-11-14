import { readFileSync, writeFileSync } from 'node:fs';
import { minify } from 'terser';

const LIMIT = 32768;
const source = readFileSync('src/game.js', 'utf8');
const result = await minify(source, {
  compress: { passes: 3, drop_console: true },
  mangle: { properties: { builtins: false } },
  format: { comments: false, ascii_only: false }
});

if (!result.code) {
  console.error('Terser no devolvió código.');
  process.exit(1);
}

writeFileSync('game.min.js', result.code);

const html = readFileSync('index.html', 'utf8');
const jsBytes = Buffer.byteLength(result.code);
const htmlBytes = Buffer.byteLength(html);
const total = jsBytes + htmlBytes;

console.log('game.min.js : ' + (jsBytes / 1024).toFixed(2) + ' KB');
console.log('index.html  : ' + (htmlBytes / 1024).toFixed(2) + ' KB');
console.log('TOTAL       : ' + total + ' bytes (' + (total / 1024).toFixed(2) + ' KB) de ' + LIMIT + ' — ' + (total / LIMIT * 100).toFixed(1) + '%');

if (total > LIMIT) {
  console.error('¡Te pasaste del límite de 32 KB!');
  process.exit(1);
}
