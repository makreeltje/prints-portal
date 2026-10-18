import { describe, expect, it } from 'vitest';
import { isHttpUrl, readUrlShortcut, sourceLabel } from '../../src/core/url-file.js';

describe('a Windows .url shortcut', () => {
  // The exact shape of all 16 in the real library, CRLF and all.
  const real = [
    '[{000214A0-0000-0000-C000-000000000046}]',
    'Prop3=19,11',
    '[InternetShortcut]',
    'IDList=',
    'URL=https://www.printables.com/model/417260-laptop-tablet-foldable-stand',
  ].join('\r\n');

  it('reads the link and ignores everything else', () => {
    expect(readUrlShortcut(real)).toBe(
      'https://www.printables.com/model/417260-laptop-tablet-foldable-stand',
    );
  });

  it.each([
    ['no URL line', '[InternetShortcut]\r\nIDList=\r\n'],
    ['an empty one', 'URL=\r\n'],
    ['a file: shortcut, which means nothing here', 'URL=file:///C:/models/cube.stl\r\n'],
    ['something that is not a URL', 'URL=zomaar wat tekst\r\n'],
  ])('gives null for %s', (_name, contents) => {
    expect(readUrlShortcut(contents)).toBeNull();
  });

  it('takes the first usable line and is not confused by case or spacing', () => {
    expect(
      readUrlShortcut('url =  https://makerworld.com/en/models/38999  \nURL=https://b.test/'),
    ).toBe('https://makerworld.com/en/models/38999');
  });
});

describe('what a bron shows', () => {
  it.each([
    [
      'https://www.printables.com/model/431042-remix/files',
      'printables.com/model/431042-remix/files',
    ],
    [
      'https://makerworld.com/en/models/245992#profileId-289597',
      'makerworld.com/en/models/245992#profileId-289597',
    ],
    ['https://www.thingiverse.com/thing:4671823/files', 'thingiverse.com/thing:4671823/files'],
    // A bare host keeps no trailing slash: it would be the only visible noise.
    ['https://printables.com/', 'printables.com'],
  ])('%s reads as %s', (url, label) => {
    expect(sourceLabel(url)).toBe(label);
  });

  it('gives back whatever it was handed when that is not a URL', () => {
    expect(sourceLabel('niet eens een link')).toBe('niet eens een link');
  });
});

describe('what may be a bron', () => {
  it.each(['https://a.test/x', 'http://a.test'])('accepts %s', (url) => {
    expect(isHttpUrl(url)).toBe(true);
  });
  it.each(['', 'a.test/x', 'ftp://a.test', 'file:///x', 'javascript:alert(1)'])(
    'refuses %s',
    (url) => {
      expect(isHttpUrl(url)).toBe(false);
    },
  );
});
