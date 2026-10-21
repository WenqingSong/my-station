import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function buildArguments(args, env) {
  const secrets = [];
  for (const [id, name] of [
    ['cos_credentials', 'COS_CREDENTIALS_JSON'],
    ['cos_secret_id', 'COS_SECRET_ID'],
    ['cos_secret_key', 'COS_SECRET_KEY'],
    ['cos_session_token', 'COS_SESSION_TOKEN'],
  ]) {
    if (env[name]) secrets.push('--secret', `id=${id},env=${name}`);
  }
  return ['build', ...secrets, ...(args.length ? args : ['.'])];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const child = spawn('docker', buildArguments(process.argv.slice(2), process.env), { stdio: 'inherit' });
  child.on('error', () => { console.error('Unable to start Docker. Start Docker Desktop before building.'); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
