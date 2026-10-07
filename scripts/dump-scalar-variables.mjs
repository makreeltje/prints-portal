#!/usr/bin/env node
/**
 * Writes docs/design-feedback/scalar-variables.md from the installed Scalar
 * stylesheet: every `--scalar-*` variable it declares, its light and dark
 * defaults, and which of them the app maps onto our tokens.
 *
 * The design system needs the exact names of the version we ship, not
 * remembered ones, so this reads the package rather than any documentation.
 * Run it after upgrading @scalar/api-reference-react.
 */
import { readFileSync, writeFileSync } from 'node:fs';

// Read the package directly: its `exports` map hides package.json and the
// stylesheet path, and we want the files as installed.
const root = new URL('../node_modules/@scalar/api-reference-react/', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const css = readFileSync(new URL('dist/style.css', root), 'utf8');
const app = readFileSync(new URL('../frontend/src/styles/app.css', import.meta.url), 'utf8');

/** Declarations per variable, split by the light and dark blocks they sit in. */
const declared = new Map();
for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const tail = selector.trim().slice(-160);
  const mode = tail.includes('dark-mode') ? 'dark' : tail.includes('light-mode') ? 'light' : 'base';
  for (const [, name, value] of body.matchAll(/(--scalar-[a-z0-9-]+)\s*:\s*([^;]+)/g)) {
    const entry = declared.get(name) ?? {};
    entry[mode] ??= value.trim();
    declared.set(name, entry);
  }
}

const mapped = new Map(
  [...app.matchAll(/(--scalar-[a-z0-9-]+):\s*var\((--[a-z0-9-]+)\)/g)].map((m) => [m[1], m[2]]),
);

const families = [
  'color',
  'background',
  'sidebar',
  'border',
  'radius',
  'font',
  'shadow',
  'button',
  'link',
  'header',
];
const familyOf = (name) => {
  const rest = name.slice('--scalar-'.length);
  return families.find((family) => rest.startsWith(family)) ?? 'other';
};
const cell = (value) =>
  value === undefined || value === ''
    ? '—'
    : `\`${value.length > 46 ? `${value.slice(0, 46)}…` : value}\``;

const lines = [
  '# Scalar CSS variables, as shipped in the version we use',
  '',
  `Generated from \`@scalar/api-reference-react\` **${pkg.version}** by`,
  '`scripts/dump-scalar-variables.mjs`, so these are the names and defaults that exist in the',
  'version we ship rather than remembered ones. Regenerate it after a Scalar upgrade.',
  '',
  `${declared.size} variables are declared. The app maps ${mapped.size} of them onto our tokens`,
  '(`frontend/src/styles/app.css`, `.app-api`, marked `ds-gap: GAP-056`); the rest keep their own value.',
  '',
  '`theme: "none"` is set, so Scalar applies no theme of its own: every value below is either our',
  'token or a Scalar default that nothing has overridden yet.',
  '',
];
for (const family of [...families, 'other']) {
  const names = [...declared.keys()].filter((name) => familyOf(name) === family).sort();
  if (names.length === 0) continue;
  lines.push(
    `## ${family}`,
    '',
    '| Variable | Mapped to our token | Scalar default (light) | Scalar default (dark) |',
    '|---|---|---|---|',
  );
  for (const name of names) {
    const entry = declared.get(name);
    const token = mapped.get(name);
    lines.push(
      `| \`${name}\` | ${token === undefined ? '—' : `\`var(${token})\``} | ` +
        `${cell(entry.light ?? entry.base)} | ${cell(entry.dark ?? entry.base)} |`,
    );
  }
  lines.push('');
}

// A variable whose default is a literal, not a reference to another variable, is one
// Scalar styles with a value of its own; those are the ones a decision has to cover.
const raw = [...declared.entries()]
  .filter(([name]) => !mapped.has(name))
  .filter(([, entry]) => {
    const value = entry.light ?? entry.base ?? entry.dark ?? '';
    return (
      value !== '' && !value.startsWith('var(') && !/^(currentColor|inherit|none|0)$/.test(value)
    );
  })
  .filter(([name]) => /color|background|border|shadow|radius|font/.test(name));
if (raw.length > 0) {
  lines.push(
    '## Still on a value of their own',
    '',
    'These are not mapped and do not inherit from a mapped variable, so they keep a literal',
    "value of Scalar's: the list a decision has to cover.",
    '',
    '| Variable | Scalar default (light) | Scalar default (dark) |',
    '|---|---|---|',
  );
  for (const [name, entry] of raw.sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(
      `| \`${name}\` | ${cell(entry.light ?? entry.base)} | ${cell(entry.dark ?? entry.base)} |`,
    );
  }
  lines.push('');
}

const out = new URL('../docs/design-feedback/scalar-variables.md', import.meta.url);
writeFileSync(out, `${lines.join('\n')}`);
console.log(
  `wrote ${out.pathname}: ${String(declared.size)} variables, ${String(mapped.size)} mapped`,
);
