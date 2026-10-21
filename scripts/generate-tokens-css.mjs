#!/usr/bin/env node
/*
 * Generate tokens.css from tokens.json.
 *
 *   node scripts/generate-tokens-css.mjs [tokens.json] [tokens.css]
 *
 * With no arguments it reads design-source/tokens.json and writes to stdout.
 * With a second argument it writes that file instead. Dark is the default
 * theme; light follows as [data-theme="light"] and as the
 * prefers-color-scheme fallback for a page with no stored theme.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Render the whole stylesheet for a parsed tokens.json. */
export function generateTokensCss(tokens) {
  const themed = (group, theme) => group.tokens.map((t) => [t.name, t.value[theme]]);
  const plain = (group) => group.tokens.map((t) => [t.name, t.value]);
  const lines = (pairs, indent) => pairs.map(([n, v]) => `${indent}--${n}: ${v};`);

  const theme = (id) => [...themed(tokens.color, id), ...themed(tokens.shadow, id)];
  const fonts = [
    ['font-sans', tokens.type.families.sans],
    ['font-mono', tokens.type.families.mono],
  ];
  const shared = [
    ...plain(tokens.spacing),
    ...plain(tokens.zIndex),
    ...plain(tokens.opacity),
    ...plain(tokens.radius),
    ...plain(tokens.fontSize),
    ...plain(tokens.duration),
    ...fonts,
  ];
  const motion = tokens.duration.tokens
    .filter((t) => /^\d+ms$/.test(t.value))
    .map((t) => `--${t.name}: 0ms;`);

  return (
    [
      '/* 3D Prints Portal tokens. Default theme: dark. */',
      ':root,',
      '[data-theme="dark"] {',
      ...lines(theme('dark'), '  '),
      '}',
      '[data-theme="light"] {',
      ...lines(theme('light'), '  '),
      '}',
      '/* No stored theme: follow the system */',
      '@media (prefers-color-scheme: light) {',
      '  :root:not([data-theme]) {',
      ...lines(theme('light'), '    '),
      '  }',
      '}',
      ':root {',
      ...lines(shared, '  '),
      '}',
      '@media (prefers-reduced-motion: reduce) {',
      `  :root { ${motion.join(' ')} }`,
      '}',
    ].join('\n') + '\n'
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [input = join(root, 'design-source/tokens.json'), output] = process.argv.slice(2);
  const css = generateTokensCss(JSON.parse(readFileSync(input, 'utf8')));
  if (output) writeFileSync(output, css);
  else process.stdout.write(css);
}
