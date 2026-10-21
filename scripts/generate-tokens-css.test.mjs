import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts/generate-tokens-css.mjs');
const run = (...args) => execFileSync('node', [script, ...args], { encoding: 'utf8' });

test('design-source/tokens.json generates the design-system/tokens.css of v2.17 byte for byte', () => {
  const expected = readFileSync(join(root, 'design-system/tokens.css'), 'utf8');
  assert.equal(run(join(root, 'design-source/tokens.json')), expected);
});

test('with no arguments it reads design-source/tokens.json', () => {
  assert.equal(run(), run(join(root, 'design-source/tokens.json')));
});
