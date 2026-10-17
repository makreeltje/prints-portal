#!/usr/bin/env node
/*
 * Check a design-system export against its own changelog.
 *
 * Every round the changelog claims things: these classes are new, those copy
 * keys exist, the tokens did not change, this gap is resolved. Implementing
 * against a claim that is not in the export wastes a round, and so does
 * deciding a gap is blocked when the export does cover it. Both have happened.
 *
 *   node scripts/check-design-export.mjs
 *
 * It reads only design-system/ and prints what it could not confirm. It makes
 * no judgement about whether a decision is good, only whether the export says
 * what the changelog says it says.
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ds = join(root, 'design-system');
const read = (name) => readFileSync(join(ds, name), 'utf8');

const problems = [];
const notes = [];
const problem = (text) => problems.push(text);
const note = (text) => notes.push(text);

const version = read('VERSION').trim();
const changelog = read('changelog.md');
const bundle = read('components/bundle.css');
const copyDeck = read('copy-deck.md');

/** The newest section only: "# Changelog 1.9" up to the next "# Changelog". */
const latest = (() => {
  const start = changelog.indexOf(`# Changelog ${version}`);
  if (start === -1) return null;
  const next = changelog.indexOf('\n# Changelog ', start + 1);
  return next === -1 ? changelog.slice(start) : changelog.slice(start, next);
})();

if (latest === null) {
  problem(`changelog.md has no section "# Changelog ${version}" for VERSION ${version}`);
}

const section = latest ?? '';

// --- Claimed classes exist in bundle.css ------------------------------------
// Both `pp-foo` and `.pp-foo` appear in the prose; a suffix group such as
// "pp-ogrp (with -bar, -more)" is checked through its base name.
const claimedClasses = new Set();
for (const line of section.split('\n')) {
  if (!/^- \*\*(New classes|Changed classes|New utility|Helpers)/i.test(line)) continue;
  for (const [, name] of line.matchAll(/`\.?(pp-[a-z0-9-]+)[^`]*`/g)) claimedClasses.add(name);
}
for (const name of [...claimedClasses].sort()) {
  if (!bundle.includes(`.${name}`)) {
    problem(`class ".${name}" is claimed in the changelog but is not in components/bundle.css`);
  }
}

// --- Claimed copy keys exist in copy-deck.md --------------------------------
const claimedKeys = new Set();
for (const line of section.split('\n')) {
  if (!/^- \*\*Copy/i.test(line)) continue;
  for (const [, key] of line.matchAll(/`([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)`/g))
    claimedKeys.add(key);
}
for (const key of [...claimedKeys].sort()) {
  if (!copyDeck.includes(`| ${key} |`)) {
    problem(`copy key "${key}" is claimed in the changelog but is not in copy-deck.md`);
  }
}

// The deck collects a round's new keys under its own heading; when the
// changelog says there are some, the deck has to show them. A round that says
// "Copy: none" is claiming the opposite, so it must not trip this: the first
// version of this rule matched the word Copy alone and failed 2.6, which added
// no key at all.
const copyLine = /^- \*\*Copy[^\n]*/im.exec(section)?.[0] ?? '';
const claimsNewCopy = copyLine !== '' && !/\bnone\b/i.test(copyLine);
if (claimsNewCopy && !new RegExp(`Added in ${version.replace('.', '\\.')}`, 'i').test(copyDeck)) {
  problem(`the changelog lists new copy, but copy-deck.md has no "Added in ${version}" section`);
}

// --- "No token changes" is true ---------------------------------------------
if (/\*\*Tokens:\*\*\s*none/i.test(section)) {
  try {
    const previous = execFileSync('git', ['show', 'HEAD:design-system/tokens.json'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const names = (text) =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(JSON.parse(text))
            .filter(([, value]) => value && typeof value === 'object')
            .map(([group, value]) => [
              group,
              (value.tokens ?? []).map((token) => `${token.name}=${JSON.stringify(token.value)}`),
            ]),
        ),
      );
    if (names(previous) !== names(read('tokens.json'))) {
      problem('the changelog says no token changed, but tokens.json differs from HEAD');
    }
  } catch {
    note('could not compare tokens.json with HEAD (new file or no git history)');
  }
}

// --- Gap table: what is settled, and what still waits on us -----------------
// The table's width has changed over the rounds: early ones are "GAP | About |
// Decision", later ones "GAP | About | Decision | Status". The status is always
// the LAST cell either way, so the row is split rather than matched by a fixed
// number of columns. A three-group regex read the Decision cell of a
// four-column table, which is why 2.11 passed while saying nothing about
// GAP-153 and GAP-154 — both published as "needs your measurement", which is
// precisely what this block exists to surface.
const rows = [];
for (const line of section.split('\n')) {
  if (!/^\|\s*GAP-\d{3}\s*\|/.test(line)) continue;
  const cells = line
    .replace(/^\|/, '')
    .replace(/\|\s*$/, '')
    .split('|');
  const id = /GAP-\d{3}/.exec(cells[0] ?? '')?.[0];
  if (id === undefined) continue;
  rows.push({ id, result: (cells.at(-1) ?? '').trim() });
}
const gapsFile = existsSync(join(ds, 'DESIGN_GAPS.md')) ? read('DESIGN_GAPS.md') : '';
const waiting = [];
for (const { id, result } of rows) {
  if (!gapsFile.includes(`## ${id} `)) {
    problem(`${id} is in the changelog's table but has no entry in DESIGN_GAPS.md`);
  }
  // A gap the design system has not actually closed: it needs something back.
  // The status is the FIRST thing in the cell, so only that decides. Scanning
  // the whole cell flagged two rows that were resolved and merely mentioned the
  // word "proposed" while explaining what they decided against.
  const status = result.replace(/[*_`]/g, '').trim().toLowerCase();
  const settled = /^(resolved|confirmed as built|merged into|rejected|accepted)\b/.test(status);
  const pending = /^(proposed|needs your|awaiting|to be measured|needs confirmation)\b/.test(
    status,
  );
  if (!settled && pending) {
    waiting.push(`${id}: ${result.replace(/\s+/g, ' ').slice(0, 96)}`);
  }
}
if (rows.length === 0) problem('the changelog section has no gap table');

// --- Report -----------------------------------------------------------------
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
console.log(
  `design system ${version}: ${plural(rows.length, 'gap', 'gaps')} in the changelog, ` +
    `${plural(claimedClasses.size, 'class', 'classes')} and ` +
    `${plural(claimedKeys.size, 'copy key', 'copy keys')} claimed`,
);

if (waiting.length > 0) {
  console.log(`\nNot settled by this export; do not treat as delivered:`);
  for (const line of waiting) console.log(`  - ${line}`);
}
for (const line of notes) console.log(`\nnote: ${line}`);

if (problems.length === 0) {
  console.log('\nEverything the changelog claims is present in the export.');
  process.exit(0);
}
console.log(`\n${plural(problems.length, 'problem', 'problems')}:`);
for (const line of problems) console.log(`  - ${line}`);
console.log('\nTake these back to the design system before implementing against them.');
process.exit(1);
