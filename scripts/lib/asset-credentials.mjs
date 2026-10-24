import { spawnSync } from 'node:child_process';

export const keychainService = 'cool.cnb.framework-station.my-station.cos';
export const keychainAccount = 'my-station-assets';

function readKeychain() {
  const result = spawnSync('/usr/bin/security', [
    'find-generic-password', '-s', keychainService, '-a', keychainAccount, '-w',
  ], { encoding: 'utf8', timeout: 15000, maxBuffer: 16384, stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status === 44) return undefined; // Item not found: keep cache-only builds working.
  if (result.error || result.status !== 0) throw new Error('COS keychain access failed; unlock the login keychain and retry.');
  return result.stdout.trim();
}

export function credentialsFromEnvironment(env = process.env) {
  let value;
  if (env.COS_CREDENTIALS_JSON) {
    try { value = JSON.parse(env.COS_CREDENTIALS_JSON); }
    catch { throw new Error('COS_CREDENTIALS_JSON is not valid JSON'); }
  } else if (env.COS_SECRET_ID || env.COS_SECRET_KEY) {
    value = { SecretId: env.COS_SECRET_ID, SecretKey: env.COS_SECRET_KEY, SecurityToken: env.COS_SESSION_TOKEN };
  }
  if (!value || typeof value.SecretId !== 'string' || !value.SecretId ||
      typeof value.SecretKey !== 'string' || !value.SecretKey ||
      (value.SecurityToken !== undefined && typeof value.SecurityToken !== 'string')) {
    throw new Error('Assets are missing or corrupt. Supply COS read-only credentials via environment / BuildKit secrets, or the configured macOS keychain, and run npm run assets:sync.');
  }
  return { SecretId: value.SecretId, SecretKey: value.SecretKey, SecurityToken: value.SecurityToken };
}

// Explicit CI/BuildKit input always wins. Never read keychain entries on Linux,
// fall back from invalid explicit input, or persist credentials in process.env.
export function assetCredentialEnvironment(env = process.env, {
  platform = process.platform, lookup = readKeychain,
} = {}) {
  if (env.COS_CREDENTIALS_JSON || env.COS_SECRET_ID || env.COS_SECRET_KEY || env.COS_SESSION_TOKEN || platform !== 'darwin') return env;
  let stored;
  try { stored = lookup(); }
  catch { throw new Error('COS keychain access failed; unlock the login keychain and retry.'); }
  if (stored === undefined) return env;
  try {
    const credentials = credentialsFromEnvironment({ COS_CREDENTIALS_JSON: stored });
    return { ...env, COS_CREDENTIALS_JSON: JSON.stringify(credentials) };
  } catch { throw new Error('COS keychain entry is invalid; update the configured credential item.'); }
}
