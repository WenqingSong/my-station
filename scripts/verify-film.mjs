import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Fail CI rather than ship a working page with a silently missing video.
export function verifyFilm(root = new URL('../public/media/', import.meta.url)) {
  const film = readFileSync(new URL('think-different.mp4', root));
  const digest = createHash('sha256').update(film).digest('hex');
  if (digest !== 'd86d1e28f4195f0c037870642ec6e449db87b29a2fff36227c89c321d45a0f09') {
    throw new Error('Film does not match the approved original with its audio track.');
  }
  const poster = readFileSync(new URL('think-different-poster.jpg', root));
  if (poster.length < 1024 || poster[0] !== 0xff || poster[1] !== 0xd8) throw new Error('Film poster is missing or invalid.');
  return { filmBytes: film.length, posterBytes: poster.length, sha256: digest };
}

verifyFilm();
