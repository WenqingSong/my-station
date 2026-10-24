import { fileURLToPath } from 'node:url';
import { loadManifest, syncAssets, cosDownloader } from './lib/assets.mjs';

const flags = process.argv.slice(2);
try {
  if (flags.some(flag => !['--check', '--dist', '--refresh'].includes(flag))) throw new Error('Usage: node scripts/sync-assets.mjs [--check [--dist] | --refresh]');
  if (flags.includes('--dist') && !flags.includes('--check')) throw new Error('--dist requires --check; sync only writes public/');
  const manifest = await loadManifest(new URL('../assets/manifest.json', import.meta.url));
  const root = fileURLToPath(new URL(flags.includes('--dist') ? '../dist/' : '../public/', import.meta.url));
  const result = await syncAssets({
    manifest, root, checkOnly: flags.includes('--check'), refresh: flags.includes('--refresh'),
    download: cosDownloader(manifest), log: console.log,
  });
  console.log(`Assets ${manifest.revision}: ${result.cached} cached, ${result.downloaded} downloaded, ${result.totalBytes} bytes verified.`);
} catch (error) {
  // Do not dump SDK errors, HTTP requests, signed URLs, or environment values.
  const message = error instanceof Error ? error.message : '';
  const safe = /^(Invalid asset|Overlapping asset|Unsafe asset|Assets are missing|COS_CREDENTIALS_JSON is not valid|COS keychain (access failed|entry is invalid)|Unable to authorize asset|Unexpected asset|Asset (network|download|size|exceeds|integrity)|Empty asset|Missing or corrupt asset|Usage:|--dist requires)/.test(message);
  console.error(safe ? message : 'Asset synchronization failed; no unverified file was installed.');
  process.exitCode = 1;
}
