import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { assetCredentialEnvironment, credentialsFromEnvironment } from './asset-credentials.mjs';
export { credentialsFromEnvironment } from './asset-credentials.mjs';

const fail = message => { throw new Error(message); };
const isSafePath = value => typeof value === 'string' &&
  value.split('/').every(part => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(part) && part !== '..');

export function validateManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || !/^[a-zA-Z0-9._-]+$/.test(manifest.revision || '') ||
      /^(latest|current|main)$/i.test(manifest.revision) ||
      !/^[a-z0-9][a-z0-9-]*-\d+$/.test(manifest.bucket || '') ||
      !/^[a-z]+-[a-z0-9-]+$/.test(manifest.region || '') || !isSafePath(manifest.prefix) ||
      !manifest.prefix.endsWith('/' + manifest.revision) ||
      !Array.isArray(manifest.files) || !manifest.files.length) fail('Invalid asset manifest');
  const seen = new Set();
  for (const file of manifest.files) {
    if (!isSafePath(file.path) || seen.has(file.path) || !Number.isSafeInteger(file.bytes) ||
        file.bytes <= 0 || !/^[a-f0-9]{64}$/.test(file.sha256 || '')) fail('Invalid asset manifest entry');
    seen.add(file.path);
  }
  for (const name of seen) {
    if ([...seen].some(other => name !== other && name.startsWith(other + '/'))) fail('Overlapping asset paths');
  }
  return manifest;
}

export async function loadManifest(file) {
  return validateManifest(JSON.parse(await readFile(file, 'utf8')));
}

// Neither cache checks nor downloads may traverse a symlink outside public/.
async function assetPath(root, relative) {
  const absolute = path.resolve(root);
  let current = path.parse(absolute).root;
  const pieces = [...absolute.slice(current.length).split(path.sep).filter(Boolean), ...relative.split('/')];
  for (let index = 0; index < pieces.length; index++) {
    current = path.join(current, pieces[index]);
    try {
      const entry = await lstat(current);
      if (entry.isSymbolicLink() || (index < pieces.length - 1 && !entry.isDirectory())) {
        fail(`Unsafe asset path: ${relative}`);
      }
      if (index === pieces.length - 1 && !entry.isFile()) fail(`Unsafe asset path: ${relative}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return current;
}

async function matches(filePath, entry) {
  try {
    const stat = await lstat(filePath);
    if (!stat.isFile() || stat.size !== entry.bytes) return false;
    const digest = createHash('sha256');
    for await (const chunk of createReadStream(filePath)) digest.update(chunk);
    return digest.digest('hex') === entry.sha256;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

// Lazy initialization: a verified local cache never needs credentials or network.
export function cosDownloader(manifest, { env = process.env, fetchImpl = fetch } = {}) {
  let client;
  const host = `${manifest.bucket}.cos.${manifest.region}.myqcloud.com`;
  return async (file, signal) => {
    if (!client) {
      const credentials = credentialsFromEnvironment(assetCredentialEnvironment(env));
      const { default: COS } = await import('cos-nodejs-sdk-v5');
      client = new COS({ ...credentials, Protocol: 'https:' });
    }
    let signed;
    try {
      signed = await new Promise((resolve, reject) => client.getObjectUrl({
        Bucket: manifest.bucket, Region: manifest.region,
        Key: `${manifest.prefix}/${file.path}`, Sign: true, Expires: 300,
      }, (error, result) => error ? reject(error) : resolve(result.Url)));
    } catch { fail(`Unable to authorize asset download: ${file.path}`); }
    const url = new URL(signed);
    if (url.protocol !== 'https:' || url.hostname !== host || url.port || url.username || url.password) {
      fail('Unexpected asset download destination');
    }
    try { return await fetchImpl(signed, { signal, redirect: 'error' }); }
    catch { fail(`Asset network request failed: ${file.path}`); }
  };
}

export async function syncAssets({ manifest, root, download, checkOnly = false, refresh = false, log = () => {}, timeoutMs = 60000 }) {
  validateManifest(manifest);
  if (checkOnly && refresh) fail('Asset download refresh cannot be combined with check-only mode');
  const result = { cached: 0, downloaded: 0, totalBytes: 0 };
  for (const file of manifest.files) {
    const destination = await assetPath(root, file.path);
    if (!refresh && await matches(destination, file)) {
      result.cached++;
      result.totalBytes += file.bytes;
      log(`Verified local asset: ${file.path}`);
      continue;
    }
    if (checkOnly) fail(`Missing or corrupt asset: ${file.path}`);
    // Finish/authenticate the request before creating anything on disk.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let temporary, handle;
    try {
      const response = await download(file, controller.signal);
      if (response.status !== 200) {
        await response.body?.cancel();
        fail(`Asset download HTTP ${response.status}: ${file.path}`);
      }
      if (!response.body) fail(`Empty asset response: ${file.path}`);
      const length = response.headers.get('content-length');
      if (length !== null && Number(length) !== file.bytes) {
        await response.body.cancel();
        fail(`Asset size mismatch: ${file.path}`);
      }
      await mkdir(path.dirname(destination), { recursive: true });
      // Check again after mkdir and before creating the temporary file.
      await assetPath(root, file.path);
      temporary = `${destination}.${randomUUID()}.asset-part`;
      handle = await open(temporary, 'wx', 0o644);
      const digest = createHash('sha256');
      let bytes = 0;
      for await (const chunk of response.body) {
        if (controller.signal.aborted) fail(`Asset download timed out: ${file.path}`);
        bytes += chunk.length;
        if (bytes > file.bytes) fail(`Asset exceeds expected size: ${file.path}`);
        digest.update(chunk);
        await handle.writeFile(chunk);
      }
      if (bytes !== file.bytes || digest.digest('hex') !== file.sha256) {
        fail(`Asset integrity mismatch: ${file.path}`);
      }
      await handle.close(); handle = undefined;
      await assetPath(root, file.path);
      await rename(temporary, destination); temporary = undefined;
      result.downloaded++;
      result.totalBytes += bytes;
      log(`Downloaded and verified: ${file.path}`);
    } finally {
      clearTimeout(timer);
      await handle?.close();
      if (temporary) await unlink(temporary).catch(() => {});
    }
  }
  return result;
}
