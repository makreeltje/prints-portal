import { describe, expect, it } from 'vitest';
import { refuseSvg } from '../src/finance/svg-logo.js';

const svg = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40">${inner}</svg>`;

describe('refuseSvg', () => {
  it('accepts a logo drawn only from geometry', () => {
    expect(refuseSvg(svg('<rect width="40" height="40"/><path d="M0 0 L10 10"/>'))).toBeNull();
  });

  it('refuses text, because the container has no fonts to draw it with', () => {
    expect(refuseSvg(svg('<text x="0" y="20">meels</text>'))).toBe('svg_text');
    expect(refuseSvg(svg('<tspan>meels</tspan>'))).toBe('svg_text');
    expect(refuseSvg(svg('<textPath href="#p">meels</textPath>'))).toBe('svg_text');
  });

  it('sees text whatever its spelling', () => {
    expect(refuseSvg(svg('<TEXT x="0" y="20">meels</TEXT>'))).toBe('svg_text');
    expect(refuseSvg(svg('<svg:text x="0" y="20">meels</svg:text>'))).toBe('svg_text');
    expect(refuseSvg(svg('<text\n  x="0">meels</text>'))).toBe('svg_text');
  });

  it('is not fooled by a word that merely starts with "text"', () => {
    expect(refuseSvg(svg('<rect id="textured"/>'))).toBeNull();
    expect(refuseSvg(svg('<g class="text-ish"><rect/></g>'))).toBeNull();
  });

  it('refuses anything the file cannot carry on its own', () => {
    expect(refuseSvg(svg('<image href="https://example.test/a.png"/>'))).toBe('svg_external');
    expect(refuseSvg(svg('<use xlink:href="other.svg#mark"/>'))).toBe('svg_external');
    expect(refuseSvg(svg('<style>@import url(x.css);</style>'))).toBe('svg_external');
  });

  it('allows references that point inside the file or carry their own bytes', () => {
    expect(refuseSvg(svg('<use href="#mark"/><path d="M0 0"/>'))).toBeNull();
    expect(refuseSvg(svg('<image href="data:image/png;base64,AAAA"/>'))).toBeNull();
  });

  it('looks past comments and CDATA, which could hide either', () => {
    expect(refuseSvg(svg('<!-- <text>hidden</text> --><rect/>'))).toBeNull();
    expect(refuseSvg(svg('<style><![CDATA[/* @import */]]></style><rect/>'))).toBeNull();
  });

  it('reads a Buffer as well as a string, which is what the route hands it', () => {
    expect(refuseSvg(Buffer.from(svg('<text>meels</text>'), 'utf8'))).toBe('svg_text');
  });
});
