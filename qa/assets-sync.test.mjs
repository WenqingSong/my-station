import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, readdir, realpath, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadManifest, validateManifest, credentialsFromEnvironment, cosDownloader, syncAssets } from '../scripts/lib/assets.mjs';
import { buildArguments } from '../scripts/docker-build.mjs';
import { assetCredentialEnvironment } from '../scripts/lib/asset-credentials.mjs';

const payload = Buffer.from('verified media bytes');
const entry = { path: 'media/test.mp4', bytes: payload.length, sha256: createHash('sha256').update(payload).digest('hex') };
const manifest = {
  schemaVersion: 1, revision: 'v1', bucket: 'test-12345678', region: 'ap-guangzhou', prefix: 'site-assets/v1', files: [entry],
};
const response = () => new Response(payload, { headers: { 'content-length': String(payload.length) } });
async function fixture(t) {
  const root = await mkdtemp(path.join(await realpath(tmpdir()), 'cos-assets-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
async function cached(root, bytes = payload) {
  await mkdir(path.join(root, 'media'), { recursive: true });
  await writeFile(path.join(root, entry.path), bytes);
}

test('real manifest pins all 10 existing media files, independent of frontend URLs', async () => {
  const actual = await loadManifest(new URL('../assets/manifest.json', import.meta.url));
  assert.equal(actual.files.length, 10);
  assert.equal(actual.files.reduce((sum, file) => sum + file.bytes, 0), 5184290);
  assert.equal(actual.prefix, 'site-assets/27de69c');
  const verified = await syncAssets({ manifest: actual, root: new URL('../public/', import.meta.url).pathname, checkOnly: true });
  assert.equal(verified.cached, 10);
});

test('manifest rejects traversal, injection, duplicate paths, invalid hashes and non-fixed versions', () => {
  for (const name of ['../escape', '/absolute', 'a/../../b', 'a\\b', 'a?query=x', 'a#fragment', 'a//b']) {
    assert.throws(() => validateManifest({ ...manifest, files: [{ ...entry, path: name }] }));
  }
  assert.throws(() => validateManifest({ ...manifest, files: [entry, entry] }));
  assert.throws(() => validateManifest({ ...manifest, files: [entry, { ...entry, path: entry.path + '/child' }] }));
  assert.throws(() => validateManifest({ ...manifest, files: [{ ...entry, sha256: 'fake' }] }));
  assert.throws(() => validateManifest({ ...manifest, files: [{ ...entry, bytes: -1 }] }));
  assert.throws(() => validateManifest({ ...manifest, prefix: 'site-assets/latest' }));
  assert.throws(() => validateManifest({ ...manifest, revision: 'latest', prefix: 'site-assets/latest' }));
  assert.throws(() => validateManifest({ ...manifest, bucket: 'example.com/path' }));
});

test('a cold cache downloads once and a warm cache needs neither network nor credentials', async t => {
  const root = await fixture(t);
  let calls = 0;
  const download = async () => { calls++; return response(); };
  assert.deepEqual(await syncAssets({ manifest, root, download }), { cached: 0, downloaded: 1, totalBytes: payload.length });
  assert.deepEqual(await readFile(path.join(root, entry.path)), payload);
  const warm = await syncAssets({ manifest, root, download: cosDownloader(manifest, { env: {} }) });
  assert.equal(warm.cached, 1);
  assert.equal(calls, 1);
});

test('check-only mode never repairs or downloads a missing asset', async t => {
  const root = await fixture(t);
  await assert.rejects(syncAssets({ manifest, root, checkOnly: true, download: async () => { throw new Error('must not download'); } }), /Missing or corrupt asset/);
  assert.deepEqual(await readdir(root), []);
});

test('same-size corruption is detected and repaired, not mistaken for cache', async t => {
  const root = await fixture(t);
  await cached(root, Buffer.alloc(payload.length));
  const result = await syncAssets({ manifest, root, download: async () => response() });
  assert.equal(result.downloaded, 1);
  assert.deepEqual(await readFile(path.join(root, entry.path)), payload);
});

test('multiple response chunks are written in order', async t => {
  const root = await fixture(t);
  const stream = new ReadableStream({ start(controller) {
    controller.enqueue(payload.subarray(0, 3));
    controller.enqueue(payload.subarray(3, 7));
    controller.enqueue(payload.subarray(7));
    controller.close();
  } });
  await syncAssets({ manifest, root, download: async () => new Response(stream) });
  assert.deepEqual(await readFile(path.join(root, entry.path)), payload);
});

test('failed hash validation preserves the prior file and removes temporary bytes', async t => {
  const root = await fixture(t);
  const old = Buffer.from('prior file');
  await cached(root, old);
  await assert.rejects(syncAssets({ manifest, root, download: async () => new Response(Buffer.alloc(payload.length)) }), /integrity mismatch/);
  assert.deepEqual(await readFile(path.join(root, entry.path)), old);
  assert.deepEqual(await readdir(path.join(root, 'media')), ['test.mp4']);
});

test('404, 403 and redirects fail without creating placeholder files', async t => {
  const root = await fixture(t);
  for (const status of [403, 404, 302]) {
    await assert.rejects(syncAssets({ manifest, root, download: async () => new Response('<Error/>', { status }) }), new RegExp(`HTTP ${status}`));
  }
  assert.deepEqual(await readdir(root), []);
});

test('truncated and oversized downloads are refused even without Content-Length', async t => {
  const root = await fixture(t);
  for (const size of [payload.length - 1, payload.length + 1]) {
    await assert.rejects(syncAssets({ manifest, root, download: async () => new Response(Buffer.alloc(size)) }), /integrity mismatch|exceeds expected size/);
  }
  assert.deepEqual(await readdir(path.join(root, 'media')), []);
});

test('an incorrect Content-Length is rejected before a file is created', async t => {
  const root = await fixture(t);
  await assert.rejects(syncAssets({ manifest, root, download: async () => new Response(payload, { headers: { 'content-length': '1' } }) }), /size mismatch/);
  assert.deepEqual(await readdir(root), []);
});

test('mid-stream network interruption leaves no partial file installed', async t => {
  const root = await fixture(t);
  const stream = new ReadableStream({ pull(controller) { controller.error(new Error('connection lost')); } });
  await assert.rejects(syncAssets({ manifest, root, download: async () => new Response(stream) }), /connection lost/);
  assert.deepEqual(await readdir(path.join(root, 'media')), []);
});

test('download timeout aborts and cleans up partial files', async t => {
  const root = await fixture(t);
  await assert.rejects(syncAssets({
    manifest, root, timeoutMs: 30,
    download: async (_file, signal) => new Response(new ReadableStream({
      start(controller) {
        signal.addEventListener('abort', () => controller.error(new Error('aborted')), { once: true });
      },
    })),
  }), /aborted/);
  assert.deepEqual(await readdir(path.join(root, 'media')), []);
});

test('symlinked asset directories and destination files are refused', async t => {
  const root = await fixture(t);
  const outside = await fixture(t);
  await symlink(outside, path.join(root, 'media'));
  await assert.rejects(syncAssets({ manifest, root, download: async () => response() }), /Unsafe asset path/);
  assert.deepEqual(await readdir(outside), []);
  const secondRoot = await fixture(t);
  await mkdir(path.join(secondRoot, 'media'));
  await symlink(path.join(outside, 'missing.mp4'), path.join(secondRoot, entry.path));
  await assert.rejects(syncAssets({ manifest, root: secondRoot, download: async () => response() }), /Unsafe asset path/);
});

test('credential input supports short-lived tokens and never includes values in errors', () => {
  const fake = { SecretId: 'test-only-id', SecretKey: 'test-only-secret', SecurityToken: 'test-only-token' };
  assert.deepEqual(credentialsFromEnvironment({ COS_CREDENTIALS_JSON: JSON.stringify(fake) }), fake);
  assert.deepEqual(credentialsFromEnvironment({ COS_SECRET_ID: fake.SecretId, COS_SECRET_KEY: fake.SecretKey, COS_SESSION_TOKEN: fake.SecurityToken }), fake);
  for (const env of [{}, { COS_CREDENTIALS_JSON: 'secret-value-not-json' }, { COS_SECRET_ID: 'private-id' }]) {
    assert.throws(() => credentialsFromEnvironment(env), error => {
      assert.doesNotMatch(error.message, /secret-value-not-json|private-id/);
      return true;
    });
  }
});

test('official SDK signs a GET to the fixed bucket; redirects and raw request errors are not exposed', async () => {
  let captured;
  const download = cosDownloader(manifest, {
    env: { COS_SECRET_ID: 'test-only-id', COS_SECRET_KEY: 'test-only-secret' },
    fetchImpl: async (url, options) => { captured = { url: new URL(url), options }; return response(); },
  });
  await download(entry, new AbortController().signal);
  assert.equal(captured.url.host, 'test-12345678.cos.ap-guangzhou.myqcloud.com');
  assert.equal(captured.url.pathname, '/site-assets/v1/media/test.mp4');
  assert.ok(captured.url.searchParams.has('q-signature'));
  assert.equal(captured.options.redirect, 'error');
  const failing = cosDownloader(manifest, {
    env: { COS_SECRET_ID: 'test-only-id', COS_SECRET_KEY: 'test-only-secret' },
    fetchImpl: async () => { throw new Error('private signed URL and credentials'); },
  });
  await assert.rejects(failing(entry, new AbortController().signal), /^Error: Asset network request failed: media\/test.mp4$/);
});

test('Docker receives secret variable names, never secret values or build args', () => {
  const values = { COS_CREDENTIALS_JSON: 'private-json', COS_SECRET_ID: 'private-id', COS_SECRET_KEY: 'private-key', COS_SESSION_TOKEN: 'private-token' };
  const args = buildArguments(['-t', 'test-image', '.'], values);
  assert.equal(args[0], 'build');
  assert.equal(args.filter(arg => arg === '--secret').length, 4);
  assert.doesNotMatch(args.join(' '), /private-|--build-arg/);
  assert.deepEqual(buildArguments([], {}), ['build', '.']);
});

test('refresh performs a real download even when the local file is valid', async t => {
  const root = await fixture(t);
  await cached(root);
  let calls = 0;
  const result = await syncAssets({ manifest, root, refresh: true, download: async () => { calls++; return response(); } });
  assert.equal(calls, 1);
  assert.deepEqual(result, { cached: 0, downloaded: 1, totalBytes: payload.length });
  assert.deepEqual(await readFile(path.join(root, entry.path)), payload);
});

test('a failed forced refresh preserves an already valid local asset', async t => {
  const root = await fixture(t);
  await cached(root);
  await assert.rejects(syncAssets({ manifest, root, refresh: true, download: async () => new Response('denied', { status: 403 }) }), /HTTP 403/);
  assert.deepEqual(await readFile(path.join(root, entry.path)), payload);
  await assert.rejects(syncAssets({ manifest, root, checkOnly: true, refresh: true }), /cannot be combined/);
});

test('macOS keychain provides credentials without mutating the caller environment', () => {
  const env = { PATH: '/test' };
  const raw = JSON.stringify({ SecretId: 'test-id', SecretKey: 'test-key', SecurityToken: 'temporary-token' });
  const resolved = assetCredentialEnvironment(env, { platform: 'darwin', lookup: () => raw });
  assert.equal(resolved.COS_CREDENTIALS_JSON, raw);
  assert.deepEqual(env, { PATH: '/test' });
  assert.doesNotMatch(buildArguments([], resolved).join(' '), /test-id|test-key|temporary-token/);
});

test('explicit authorization is not replaced by local keychain fallback', () => {
  for (const env of [
    { COS_CREDENTIALS_JSON: 'invalid-json' },
    { COS_SECRET_ID: 'explicit-only-id' },
    { COS_SECRET_KEY: 'explicit-only-key' },
    { COS_SESSION_TOKEN: 'explicit-only-token' },
  ]) {
    const actual = assetCredentialEnvironment(env, { platform: 'darwin', lookup: () => { throw new Error('must not read keychain'); } });
    assert.strictEqual(actual, env);
    assert.throws(() => credentialsFromEnvironment(actual));
  }
});

test('Linux and a missing keychain entry preserve cache-only operation', () => {
  const env = {};
  assert.strictEqual(assetCredentialEnvironment(env, { platform: 'linux', lookup: () => { throw new Error('must not read keychain'); } }), env);
  assert.strictEqual(assetCredentialEnvironment(env, { platform: 'darwin', lookup: () => undefined }), env);
});

test('keychain errors never expose raw output or malformed credentials', () => {
  for (const lookup of [
    () => { throw new Error('private credential output'); },
    () => 'private invalid-json',
    () => JSON.stringify({ SecretId: 'private-id' }),
  ]) {
    assert.throws(() => assetCredentialEnvironment({}, { platform: 'darwin', lookup }), error => {
      assert.match(error.message, /^COS keychain /);
      assert.doesNotMatch(error.message, /private/);
      return true;
    });
  }
});
