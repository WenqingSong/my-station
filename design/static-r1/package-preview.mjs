// Produce a portable local preview from the separate Vite build.
// No hosting API, remote upload, credentials, or production files are used.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const built = resolve(root, 'dist-study');
let html = readFileSync(resolve(built, 'visual-study/index.html'), 'utf8');
const mime = { woff2: 'font/woff2', webp: 'image/webp', jpg: 'image/jpeg' };
const embedded = new Map();
function inlineAssets(text) {
  return text.replace(/\/(?:fonts\/[a-z-]+\.woff2|arthur-editorial-\d+\.(?:jpg|webp))/g, path => {
    if (!embedded.has(path)) {
      const type = mime[path.split('.').at(-1)];
      embedded.set(path, `data:${type};base64,${readFileSync(resolve(built, '.' + path)).toString('base64')}`);
    }
    return embedded.get(path);
  });
}
html = html.replace(/<link\b[^>]*rel="preload"[^>]*>/g, '');
html = html.replace(/<script\b[^>]*src="([^\"]+)"[^>]*><\/script>/g, (_, path) => {
  const js = inlineAssets(readFileSync(resolve(built, '.' + path), 'utf8'));
  return `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`;
});
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^\"]+)"[^>]*>/g, (_, path) => {
  return `<style>${inlineAssets(readFileSync(resolve(built, '.' + path), 'utf8'))}</style>`;
});
if (/(?:src|href)="\/(?:assets|fonts)\//.test(html)) throw new Error('Uninlined build resource');
const licenses = ['InstrumentSans-OFL.txt', 'Inter-OFL.txt', 'NotoSansSC-OFL.txt']
  .map(name => `${name}\n\n${readFileSync(resolve(root, 'public/fonts', name), 'utf8')}`)
  .join('\n\n');
html = html.replace('</body>', `<script type="text/plain" id="font-licenses">${licenses.replace(/<\/script/gi, '<\\/script')}</script></body>`);
html = html.replace(/[\t ]+$/gm, '');
const output = resolve(root, 'design/static-r1/Arthur-R1-preview.html');
writeFileSync(output, html);
console.log(`Portable preview: ${output}`);
console.log(`Bytes: ${Buffer.byteLength(html)}; embedded resource variants: ${embedded.size}`);
