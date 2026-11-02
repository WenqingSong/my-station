import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { isWorkflowDocsReturn } from '../src/project-return.ts';

// Exercise the parser-time check and the React entry policy with the same URLs:
// only the reader's exact return destination may skip the initial film sequence.
test('document returns skip the opening only at the intended project destination', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const earlyScript = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  for (const [search, hash, expected] of [
    ['?from=workflow-docs', '#work-backend', true],
    ['?from=workflow-docs&extra=1', '#work-backend', true],
    ['', '#work-backend', false],
    ['?from=workflow-docs', '#contact', false],
    ['?from=workflow-docs', '', false],
    ['?entry=offer', '#work-backend', false],
    ['?from=elsewhere', '#work-backend', false],
  ]) {
    let removed = false;
    const element = { dataset: {}, classList: { remove: name => { assert.equal(name, 'brand-loading'); removed = true; } } };
    vm.runInNewContext(earlyScript, { URLSearchParams, location: { search, hash }, document: { documentElement: element } });
    assert.equal(isWorkflowDocsReturn({ search, hash }), expected);
    assert.equal(removed, expected);
    assert.equal(element.dataset.projectReturn === 'workflow', expected);
  }
});
