import { describe, expect, it } from 'vitest';
import { buildSku, skuDeduper, skuSegment, skuToken } from './utils';

describe('skuToken', () => {
  it('truncates a single word, which is what order numbers rely on', () => {
    // checkout builds order numbers as `skuToken(handle, 5)`, so this must stay
    // a plain truncation — abbreviating it would renumber every order.
    expect(skuToken('neko', 5)).toBe('NEKO');
    expect(skuToken('nekostudio', 5)).toBe('NEKOS');
  });

  it('strips punctuation and uppercases', () => {
    expect(skuToken('mika-art')).toBe('MIKAAR');
  });

  it('never returns an empty token', () => {
    expect(skuToken('—')).toBe('X');
    expect(skuToken('')).toBe('X');
  });
});

describe('skuSegment', () => {
  it('keeps the digits that distinguish similar option values', () => {
    // The regression that motivated per-word abbreviation: truncating the whole
    // string collapsed every iPhone model onto "IPHONE".
    const tokens = ['iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max'].map((value) =>
      skuSegment(value),
    );
    expect(new Set(tokens).size).toBe(3);
    expect(tokens).toEqual(['IPH17', 'IPH17PRO', 'IPH17PROMAX']);
  });

  it('distinguishes Galaxy models', () => {
    expect(skuSegment('Galaxy S26')).not.toBe(skuSegment('Galaxy S26 Ultra'));
  });

  it('abbreviates plain words and keeps numeric ones', () => {
    expect(skuSegment('Pack of 10')).toBe('PACOF10');
    expect(skuSegment('MagSafe')).toBe('MAG');
  });

  it('respects the length cap', () => {
    expect(skuSegment('extraordinarily long option value here', 8).length).toBeLessThanOrEqual(8);
  });
});

describe('buildSku', () => {
  it('produces a distinct SKU for every phone-case combination', () => {
    const models = [
      'iPhone 17',
      'iPhone 17 Pro',
      'iPhone 17 Pro Max',
      'Galaxy S26',
      'Galaxy S26 Ultra',
    ];
    const colours = ['Black', 'White', 'Clear', 'Pink'];
    const types = ['Standard', 'MagSafe'];

    const skus = models.flatMap((model) =>
      colours.flatMap((colour) =>
        types.map((type) => buildSku('Cyber Neko MagSafe Case', [model, colour, type])),
      ),
    );

    expect(skus).toHaveLength(40);
    expect(new Set(skus).size).toBe(40);
    expect(skus[0]).toBe('CASE-IPH17-BLA-STA');
  });
});

describe('skuDeduper', () => {
  it('suffixes repeats and leaves the first one alone', () => {
    const dedupe = skuDeduper();
    expect(dedupe('CASE-PIN')).toBe('CASE-PIN');
    expect(dedupe('CASE-PIN')).toBe('CASE-PIN-2');
    expect(dedupe('CASE-PIN')).toBe('CASE-PIN-3');
    expect(dedupe('CASE-BLA')).toBe('CASE-BLA');
  });

  it('avoids SKUs already taken elsewhere', () => {
    const dedupe = skuDeduper(['CASE-PIN', 'CASE-PIN-2']);
    expect(dedupe('CASE-PIN')).toBe('CASE-PIN-3');
  });
});
