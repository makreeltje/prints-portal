import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts/generate-tokens-css.mjs');
const run = (...args) => execFileSync('node', [script, ...args], { encoding: 'utf8' });

/** Fail with the diff and the command that repairs the file when the two differ. */
function assertGenerated(dir) {
  const tokensJson = `${dir}/tokens.json`;
  const tokensCss = `${dir}/tokens.css`;
  const actual = readFileSync(join(root, tokensCss), 'utf8');
  const generated = run(join(root, tokensJson));
  if (actual === generated) return;
  const tmp = mkdtempSync(join(tmpdir(), 'tokens-css-'));
  const generatedPath = join(tmp, 'generated.css');
  writeFileSync(generatedPath, generated);
  const diff = spawnSync('diff', ['-u', join(root, tokensCss), generatedPath], {
    encoding: 'utf8',
  });
  rmSync(tmp, { recursive: true });
  assert.fail(
    `${tokensCss} is not what the generator makes of ${tokensJson}.\n\n${diff.stdout}\n` +
      `Fix it with:\n  node scripts/generate-tokens-css.mjs ${tokensJson} ${tokensCss}\n`,
  );
}

for (const dir of ['design-source', 'design-system']) {
  test(`${dir}/tokens.css is what the generator makes of ${dir}/tokens.json, byte for byte`, () => {
    assertGenerated(dir);
  });
}

test('with no arguments it reads design-source/tokens.json', () => {
  assert.equal(run(), run(join(root, 'design-source/tokens.json')));
});
