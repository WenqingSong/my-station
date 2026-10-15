import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { workEvidence } from '../src/components/work-evidence.ts';
import { CONTACT_EMAIL, copyEmail } from '../src/components/copy-contact.ts';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('each case has a problem, decision, evidence, boundary and public source entry', () => {
  assert.deepEqual(Object.keys(workEvidence), ['delivery', 'backend', 'matching']);
  for (const item of Object.values(workEvidence)) {
    for (const key of ['problem', 'decision', 'evidence', 'boundary']) assert.ok(item[key].length > 20);
    assert.match(item.repo, /^https:\/\/cnb\.cool\/framework-station\//);
    assert.equal(item.links.length, 2);
    for (const link of item.links) {
      assert.ok(link.url.startsWith(item.repo + '/-/blob/'));
      assert.match(link.url, /\/-\/blob\/[a-f0-9]{40}\//);
    }
  }
});

test('copy uses the exact email and reports success only after completion', async () => {
  let complete;
  let written;
  const result = copyEmail({writeText: value => {written = value; return new Promise(resolve => complete = resolve);}});
  assert.equal(written, CONTACT_EMAIL);
  complete();
  assert.equal(await result, 'copied');
});

test('unavailable or rejected clipboard gives a manual fallback', async () => {
  assert.equal(await copyEmail(), 'manual');
  assert.equal(await copyEmail({writeText: async () => {throw new Error('denied');}}), 'manual');
});

test('critical lower-page content never relies on entrance reveals', () => {
  const work = source('src/components/SelectedWork.tsx');
  const about = source('src/components/AboutEditorial.tsx');
  const contact = source('src/components/Contact.tsx');
  for (const file of [work, about, contact]) assert.doesNotMatch(file, /data-reveal|autoAlpha|opacity:\s*0|yPercent:\s*110/);
  assert.doesNotMatch(work, /探索结构|setExpanded|toggleActions/);
  assert.doesNotMatch(about, /Still becoming|about-certification/);
  assert.match(contact, /role="status"/);
  assert.match(contact, /input\.current\?\.select\(\)/);
  assert.match(contact, /clearTimeout\(resetTimer\.current\)/);
  assert.match(contact, /if \(!alive\.current\) return/);
});

test('removed sections retain old anchor destinations; chapters match the page', () => {
  assert.match(source('src/components/SelectedWork.tsx'), /id="intro"/);
  assert.match(source('src/components/AboutEditorial.tsx'), /id="skills"/);
  const app = source('src/App.tsx');
  assert.doesNotMatch(app, /className="intro section-shell"|className="capabilities/);
  const details = source('src/components/SiteDetails.tsx');
  assert.doesNotMatch(details, /\['intro'|\['skills'/);
  assert.match(details, /chapters\[chapters.length - 1\]/);
});
