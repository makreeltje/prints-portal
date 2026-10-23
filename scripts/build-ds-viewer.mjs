#!/usr/bin/env node
/*
 * Build the design-system viewer: a static site made from design-source/.
 *
 *   node scripts/build-ds-viewer.mjs [--strict] [outDir]
 *
 * outDir defaults to dist-ds-viewer/. Every component folder in
 * design-source/components/ gets a page with its preview.html in an iframe
 * (tokens.css and components/bundle.css loaded into it) next to its README.
 * The first line of each preview, <!-- @dsCard group= height= subtitle= -->,
 * decides the group and the iframe height. A preview without that line, or
 * without a group, is reported and listed under "Zonder groep"; a group is
 * never invented. With --strict (or DS_VIEWER_STRICT=1) the build fails instead.
 *
 * The viewer is an internal tool, not part of the app. Its own chrome is styled
 * with tokens.css only. No dependencies.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'design-source');

const args = process.argv.slice(2);
const strict = args.includes('--strict') || process.env.DS_VIEWER_STRICT === '1';
const outDir = resolve(root, args.find((a) => !a.startsWith('--')) ?? 'dist-ds-viewer');

const problems = [];
const warn = (msg) => {
  problems.push(msg);
  console.warn(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : `warning: ${msg}`);
};

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* ---------- markdown (the subset design-source uses) ---------- */

function inline(text) {
  const codes = [];
  let s = text.replace(
    /`([^`]+)`/g,
    (_, c) => `\u0000${codes.push(`<code>${esc(c)}</code>`) - 1}\u0000`,
  );
  s = esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) =>
      /^(https?:\/\/|#|\.{0,2}\/|[\w.-]+(\/|$))/i.test(u) && !/^javascript:/i.test(u)
        ? `<a href="${u}">${t}</a>`
        : m,
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[i]);
}

function markdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const isBlockStart = (l) => /^(#{1,6}\s|```|>|\s*([-*]|\d+\.)\s|\||(-{3,}|\*{3,})\s*$)/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
    } else if (line.startsWith('```')) {
      const buf = [];
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) buf.push(lines[i]);
      i++;
      out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
    } else if (/^#{1,6}\s/.test(line)) {
      const [, hashes, text] = line.match(/^(#+)\s+(.*)$/);
      out.push(`<h${hashes.length}>${inline(text)}</h${hashes.length}>`);
      i++;
    } else if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push('<hr>');
      i++;
    } else if (line.startsWith('|') && /^\|?\s*:?-+/.test(lines[i + 1] ?? '')) {
      const cells = (l) =>
        l
          .trim()
          .replace(/^\||\|$/g, '')
          .split(/(?<!\\)\|/)
          .map((c) => c.trim().replace(/\\\|/g, '|'));
      const head = cells(line);
      i += 2;
      const rows = [];
      for (; i < lines.length && lines[i].startsWith('|'); i++) rows.push(cells(lines[i]));
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`,
      );
    } else if (line.startsWith('>')) {
      const buf = [];
      for (; i < lines.length && lines[i].startsWith('>'); i++)
        buf.push(lines[i].replace(/^>\s?/, ''));
      out.push(`<blockquote>${markdown(buf.join('\n'))}</blockquote>`);
    } else if (/^\s*([-*]|\d+\.)\s/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s/.test(lines[i])) {
        let item = lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '');
        i++;
        while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i]))
          item += ` ${lines[i++].trim()}`;
        items.push(`<li>${inline(item)}</li>`);
      }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
    } else {
      const buf = [];
      for (
        ;
        i < lines.length && lines[i].trim() && (buf.length === 0 || !isBlockStart(lines[i]));
        i++
      ) {
        buf.push(lines[i].trim());
      }
      out.push(`<p>${inline(buf.join(' '))}</p>`);
    }
  }
  return out.join('\n');
}

/* ---------- reading design-source ---------- */

const tokens = JSON.parse(readFileSync(join(src, 'tokens.json'), 'utf8'));
const version = String(tokens.version);
const title = `${tokens.name ?? 'Design system'} v${version}`;

const attr = (card, name) => {
  const m = card.match(new RegExp(`(?:^|\\s)${name}=(?:"([^"]*)"|(\\S+))`));
  return m ? (m[1] ?? m[2]) : undefined;
};

const componentsDir = join(src, 'components');
const components = readdirSync(componentsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort((a, b) => a.localeCompare(b))
  .flatMap((name) => {
    const previewPath = join(componentsDir, name, 'preview.html');
    const readmePath = join(componentsDir, name, 'README.md');
    if (!existsSync(previewPath)) {
      warn(`${name}: no preview.html`);
      return [];
    }
    const html = readFileSync(previewPath, 'utf8');
    const card = html.match(/^\s*<!--\s*@dsCard\b([\s\S]*?)-->/)?.[1];
    if (card === undefined) warn(`${name}/preview.html: no <!-- @dsCard ... --> line at the top`);
    const group = card === undefined ? undefined : attr(card, 'group');
    if (card !== undefined && !group) warn(`${name}/preview.html: @dsCard has no group=`);
    const height = Number.parseInt(attr(card ?? '', 'height') ?? '', 10);
    if (card !== undefined && !(height > 0))
      warn(`${name}/preview.html: @dsCard has no usable height=`);
    let readme = '';
    if (existsSync(readmePath)) readme = readFileSync(readmePath, 'utf8');
    else warn(`${name}: no README.md`);
    return [
      {
        name,
        html,
        group: group || undefined,
        height: height > 0 ? height : undefined,
        width: Number.parseInt(attr(card ?? '', 'width') ?? '', 10) || undefined,
        subtitle: attr(card ?? '', 'subtitle') ?? '',
        readme,
      },
    ];
  });

if (strict && problems.length) {
  console.error(`\n${problems.length} problem(s) in design-source/ (--strict).`);
  process.exit(1);
}

const NO_GROUP = 'Zonder groep';
const groupOrder = ['Base', 'Domain', 'Screens'];
const groupNames = [...new Set(components.map((c) => c.group ?? NO_GROUP))].sort((a, b) => {
  const rank = (g) =>
    g === NO_GROUP ? 1e6 : groupOrder.indexOf(g) === -1 ? 1e3 : groupOrder.indexOf(g);
  return rank(a) - rank(b) || a.localeCompare(b);
});

const pages = [
  { file: 'changelog.md', slug: 'changelog', label: `Changelog ${version}` },
  { file: 'copy-deck.md', slug: 'copy-deck', label: 'Copy-deck' },
  { file: 'contrast.md', slug: 'contrast', label: 'Contrast' },
];

/* ---------- output ---------- */

const PHONE_WIDTH = 390; // px, the phone width this viewer shows (PRI-32)

const css = `
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 400 var(--text-base)/var(--leading-base) var(--font-sans); }
a { color: var(--primary); }
a:hover { color: var(--primary-hover); }
:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
code, pre { font-family: var(--font-mono); font-size: var(--text-sm); }
code { background: var(--surface-2); padding: 0 var(--space-1); border-radius: var(--radius-sm); }
pre { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-3); overflow: auto; }
pre code { background: none; padding: 0; }

.topbar { position: sticky; top: 0; z-index: var(--z-sticky); display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3) var(--space-5); padding: var(--space-3) var(--space-5); background: var(--surface); border-bottom: 1px solid var(--border); }
.topbar .brand { color: var(--text-strong); font-weight: 700; font-size: var(--text-md); text-decoration: none; }
.topbar .version { color: var(--muted); font-size: var(--text-sm); }
.topbar .spacer { flex: 1; }
.toggles { display: flex; flex-wrap: wrap; gap: var(--space-3); }
.seg { display: inline-flex; border: 1px solid var(--border-strong); border-radius: var(--radius-md); overflow: hidden; }
.seg button { font: inherit; font-size: var(--text-sm); color: var(--text); background: var(--surface); border: 0; padding: var(--space-1) var(--space-3); cursor: pointer; transition: background var(--motion-fast) var(--motion-ease); }
.seg button + button { border-left: 1px solid var(--border-strong); }
.seg button:hover { background: var(--surface-2); }
.seg button[aria-pressed="true"] { background: var(--primary); color: var(--on-primary); }

.layout { display: flex; align-items: flex-start; }
nav.side { flex: none; width: calc(var(--space-9) * 6); position: sticky; top: calc(var(--space-9) + var(--space-3)); max-height: calc(100vh - var(--space-9) - var(--space-3)); overflow: auto; padding: var(--space-4); border-right: 1px solid var(--border); }
nav.side h2 { margin: var(--space-4) 0 var(--space-1); font-size: var(--text-xs); text-transform: uppercase; color: var(--muted); letter-spacing: 0.04em; }
nav.side ul { list-style: none; margin: 0; padding: 0; }
nav.side a { display: block; padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); color: var(--text); text-decoration: none; font-size: var(--text-sm); }
nav.side a:hover { background: var(--surface-2); }
nav.side a[aria-current="page"] { background: var(--primary-tint); color: var(--text-strong); }
main { flex: 1; min-width: 0; padding: var(--space-5) var(--space-6) var(--space-9); }
main h1 { margin: 0 0 var(--space-1); color: var(--text-strong); font-size: var(--text-2xl); line-height: var(--leading-2xl); }
main .subtitle { margin: 0 0 var(--space-4); color: var(--muted); }
.stage { overflow: auto; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface-2); padding: var(--space-3); }
.stage iframe { display: block; margin: 0 auto; border: 0; width: 100%; background: var(--bg); }
.stage[data-viewport="phone"] iframe { width: ${PHONE_WIDTH}px; max-width: 100%; }
.readme, .doc { max-width: calc(var(--space-9) * 18); margin-top: var(--space-6); }
.doc { max-width: none; margin-top: 0; }
.readme h2, .doc h2 { color: var(--text-strong); font-size: var(--text-xl); line-height: var(--leading-xl); margin-top: var(--space-6); }
.doc h1 { font-size: var(--text-2xl); }
.doc h3 { color: var(--text-strong); font-size: var(--text-lg); }
blockquote { margin: var(--space-3) 0; padding: var(--space-1) var(--space-4); border-left: 3px solid var(--border-strong); color: var(--muted); }
.table-wrap { overflow: auto; margin: var(--space-3) 0; }
table { border-collapse: collapse; font-size: var(--text-sm); }
th, td { text-align: left; vertical-align: top; padding: var(--space-1) var(--space-3); border: 1px solid var(--border); }
th { background: var(--surface); color: var(--text-strong); }
hr { border: 0; border-top: 1px solid var(--border); margin: var(--space-5) 0; }
.warn { margin: 0 0 var(--space-4); padding: var(--space-3); border: 1px solid var(--warning); background: var(--warning-tint); border-radius: var(--radius-md); }
.cards { list-style: none; margin: var(--space-4) 0 var(--space-6); padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(calc(var(--space-9) * 5), 1fr)); gap: var(--space-3); }
.cards a { display: block; height: 100%; padding: var(--space-3); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); text-decoration: none; color: var(--text); }
.cards a:hover { background: var(--surface-2); }
.cards strong { display: block; color: var(--text-strong); }
.cards span { color: var(--muted); font-size: var(--text-sm); }
@media (max-width: 800px) {
  .layout { flex-direction: column; }
  nav.side { position: static; width: 100%; max-height: none; border-right: 0; border-bottom: 1px solid var(--border); }
}
`;

// Runs before paint: pick the stored theme so the chrome does not flash.
const headScript = `try{var t=localStorage.getItem('ds-viewer-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

const bodyScript = `
(function () {
  var root = document.documentElement;
  var get = function (k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  var set = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var theme = root.dataset.theme === 'light' ? 'light' : 'dark';
  var viewport = get('ds-viewer-viewport', 'desktop') === 'phone' ? 'phone' : 'desktop';
  var frame = document.querySelector('.stage iframe');
  var stage = document.querySelector('.stage');
  function applyFrame() {
    if (!frame) return;
    try { frame.contentDocument.documentElement.dataset.theme = theme; } catch (e) {}
    try { frame.contentWindow.postMessage({ dsTheme: theme }, '*'); } catch (e) {}
  }
  function paint() {
    root.dataset.theme = theme;
    if (stage) stage.dataset.viewport = viewport;
    document.querySelectorAll('[data-toggle]').forEach(function (b) {
      var cur = b.dataset.toggle === 'theme' ? theme : viewport;
      b.setAttribute('aria-pressed', String(b.dataset.value === cur));
    });
    applyFrame();
  }
  document.querySelectorAll('[data-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.toggle === 'theme') { theme = b.dataset.value; set('ds-viewer-theme', theme); }
      else { viewport = b.dataset.value; set('ds-viewer-viewport', viewport); }
      paint();
    });
  });
  if (frame) frame.addEventListener('load', applyFrame);
  paint();
})();
`;

const toggles = `
<div class="toggles" role="group" aria-label="Weergave">
  <div class="seg" role="group" aria-label="Thema">
    <button type="button" data-toggle="theme" data-value="light">Licht</button>
    <button type="button" data-toggle="theme" data-value="dark">Donker</button>
  </div>
  <div class="seg" role="group" aria-label="Breedte">
    <button type="button" data-toggle="viewport" data-value="phone">Telefoon (${PHONE_WIDTH}px)</button>
    <button type="button" data-toggle="viewport" data-value="desktop">Desktop</button>
  </div>
</div>`;

function nav(current) {
  const link = (href, label, key) =>
    `<li><a href="${href}"${key === current ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`;
  const docs = pages.map((p) => link(`${p.slug}.html`, p.label, p.slug)).join('');
  const groups = groupNames
    .map((g) => {
      const items = components
        .filter((c) => (c.group ?? NO_GROUP) === g)
        .map((c) => link(`c/${c.name}.html`, c.name, c.name))
        .join('');
      return `<h2>${esc(g)}</h2><ul>${items}</ul>`;
    })
    .join('');
  return `<nav class="side" aria-label="Componenten"><ul>${link('index.html', 'Overzicht', 'index')}</ul><h2>Documenten</h2><ul>${docs}</ul>${groups}</nav>`;
}

/** Wrap content in the viewer chrome. `base` is the path back to the site root. */
function page({ base, key, heading, content, withToggles = true }) {
  const rel = (h) => h.replace(/href="(?!https?:|#)/g, `href="${base}`);
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(heading)} · ${esc(title)}</title>
<link rel="stylesheet" href="${base}tokens.css">
<link rel="stylesheet" href="${base}viewer.css">
<script>${headScript}</script>
</head>
<body>
<header class="topbar">
  <a class="brand" href="${base}index.html">Design system viewer</a>
  <span class="version">${esc(tokens.name ?? '')} · versie ${esc(version)}</span>
  <span class="spacer"></span>
  ${withToggles ? toggles : ''}
</header>
<div class="layout">
${rel(nav(key))}
<main>
${content}
</main>
</div>
<script>${bodyScript}</script>
</body>
</html>
`;
}

/** The preview with tokens.css and bundle.css loaded into it. */
function previewDoc(html) {
  // The listener is for when the page is opened from file:// and the parent cannot reach the document.
  const links =
    '<link rel="stylesheet" href="../tokens.css"><link rel="stylesheet" href="../components/bundle.css">' +
    "<script>addEventListener('message',function(e){if(e.data&&e.data.dsTheme)document.documentElement.dataset.theme=e.data.dsTheme})</script>";
  const withHead = /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, (m) => `${m}${links}`)
    : html.replace(/<!doctype[^>]*>/i, (m) => `${m}<head>${links}</head>`);
  return withHead;
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, 'c'), { recursive: true });
mkdirSync(join(outDir, 'preview'), { recursive: true });
mkdirSync(join(outDir, 'components'), { recursive: true });
cpSync(join(src, 'tokens.css'), join(outDir, 'tokens.css'));
cpSync(join(componentsDir, 'bundle.css'), join(outDir, 'components', 'bundle.css'));
writeFileSync(join(outDir, 'viewer.css'), css);
writeFileSync(join(outDir, '.nojekyll'), '');

for (const c of components) {
  writeFileSync(join(outDir, 'preview', `${c.name}.html`), previewDoc(c.html));
  const note = c.group
    ? ''
    : `<p class="warn" role="note">Deze preview heeft geen <code>group=</code> in de <code>@dsCard</code>-regel; er is geen groep verzonnen.</p>`;
  const frameHeight = c.height ?? 400;
  const content = `
<h1>${esc(c.name)}</h1>
<p class="subtitle">${esc(c.group ?? NO_GROUP)}${c.subtitle ? ` · ${esc(c.subtitle)}` : ''}</p>
${note}
<div class="stage" data-viewport="desktop">
  <iframe src="../preview/${esc(c.name)}.html" title="${esc(c.name)}" height="${frameHeight}" loading="lazy"></iframe>
</div>
<section class="readme">${c.readme ? markdown(c.readme) : '<p>Geen README.</p>'}</section>`;
  writeFileSync(
    join(outDir, 'c', `${c.name}.html`),
    page({ base: '../', key: c.name, heading: c.name, content }),
  );
}

for (const p of pages) {
  const md = readFileSync(join(src, p.file), 'utf8');
  const content = `<p class="subtitle">Versie ${esc(version)}</p>\n<div class="doc">${markdown(md)}</div>`;
  writeFileSync(
    join(outDir, `${p.slug}.html`),
    page({ base: '', key: p.slug, heading: p.label, content }),
  );
}

const overview = groupNames
  .map((g) => {
    const items = components
      .filter((c) => (c.group ?? NO_GROUP) === g)
      .map(
        (c) =>
          `<li><a href="c/${esc(c.name)}.html"><strong>${esc(c.name)}</strong><span>${esc(c.subtitle)}</span></a></li>`,
      )
      .join('');
    return `<h2>${esc(g)}</h2><ul class="cards">${items}</ul>`;
  })
  .join('');
writeFileSync(
  join(outDir, 'index.html'),
  page({
    base: '',
    key: 'index',
    heading: 'Overzicht',
    content: `<h1>${esc(tokens.name ?? 'Design system')} v${esc(version)}</h1>
<p class="subtitle">${components.length} componenten. Kies er een in het menu; per component zijn licht/donker en telefoon/desktop te wisselen.</p>
${overview}`,
  }),
);

console.log(
  `Built ${title}: ${components.length} components, ${pages.length} pages -> ${outDir}` +
    (problems.length ? ` (${problems.length} warning(s))` : ''),
);
