import { describe, expect, it } from 'vitest';
import {
  buildPromptPayPayload,
  crc16ccitt,
  normalizeProxyValue,
  parseTlv,
  verifyPromptPayPayload,
} from './promptpay';

describe('crc16ccitt', () => {
  it('matches the standard CRC-16/CCITT-FALSE check value', () => {
    // The published check value for this CRC variant is 0x29B1 over "123456789".
    expect(crc16ccitt('123456789')).toBe('29B1');
  });

  it('always returns four hex digits', () => {
    for (const input of ['', 'a', 'PromptPay', '0'.repeat(200)]) {
      expect(crc16ccitt(input)).toMatch(/^[0-9A-F]{4}$/);
    }
  });
});

describe('normalizeProxyValue', () => {
  it('converts a Thai mobile number to the 13-character proxy form', () => {
    expect(normalizeProxyValue('MOBILE', '0812345678')).toBe('0066812345678');
    expect(normalizeProxyValue('MOBILE', '081-234-5678')).toBe('0066812345678');
    expect(normalizeProxyValue('MOBILE', '+66 81 234 5678')).toBe('0066812345678');
    expect(normalizeProxyValue('MOBILE', '66812345678')).toBe('0066812345678');
  });

  it('rejects a mobile number of the wrong length', () => {
    expect(() => normalizeProxyValue('MOBILE', '08123456')).toThrow();
    expect(() => normalizeProxyValue('MOBILE', '08123456789')).toThrow();
  });

  it('passes through a 13-digit national or tax ID', () => {
    expect(normalizeProxyValue('NATIONAL_ID', '1-2345-67890-12-3')).toBe('1234567890123');
    expect(() => normalizeProxyValue('NATIONAL_ID', '12345')).toThrow();
  });

  it('requires 15 digits for an e-wallet id', () => {
    expect(normalizeProxyValue('EWALLET', '004999012345678')).toBe('004999012345678');
    expect(() => normalizeProxyValue('EWALLET', '00499901234567')).toThrow();
  });

  it('accepts bank account numbers of plausible length', () => {
    expect(normalizeProxyValue('BANK_ACCOUNT', '123-4-56789-0')).toBe('1234567890');
    expect(() => normalizeProxyValue('BANK_ACCOUNT', '123')).toThrow();
  });
});

describe('buildPromptPayPayload', () => {
  const mobileInput = { proxyType: 'MOBILE' as const, proxyValue: '0812345678' };

  it('produces a self-consistent payload', () => {
    const payload = buildPromptPayPayload(mobileInput);
    expect(verifyPromptPayPayload(payload)).toBe(true);
  });

  it('emits the mandatory EMVCo fields', () => {
    const entries = parseTlv(buildPromptPayPayload(mobileInput));
    const byTag = new Map(entries.map((entry) => [entry.tag, entry.value]));

    expect(byTag.get('00')).toBe('01'); // payload format indicator
    expect(byTag.get('53')).toBe('764'); // THB
    expect(byTag.get('58')).toBe('TH');
    expect(byTag.has('29')).toBe(true); // PromptPay merchant account template
    expect(byTag.has('63')).toBe(true); // CRC
  });

  it('nests the PromptPay AID and proxy inside tag 29', () => {
    const entries = parseTlv(buildPromptPayPayload(mobileInput));
    const merchant = entries.find((entry) => entry.tag === '29');
    expect(merchant).toBeDefined();

    const nested = new Map(parseTlv(merchant!.value).map((entry) => [entry.tag, entry.value]));
    expect(nested.get('00')).toBe('A000000677010111');
    expect(nested.get('01')).toBe('0066812345678');
  });

  it('marks a QR without an amount as static and one with an amount as dynamic', () => {
    const staticEntries = parseTlv(buildPromptPayPayload(mobileInput));
    expect(staticEntries.find((entry) => entry.tag === '01')?.value).toBe('11');
    expect(staticEntries.some((entry) => entry.tag === '54')).toBe(false);

    const dynamicEntries = parseTlv(buildPromptPayPayload({ ...mobileInput, amount: 89000 }));
    expect(dynamicEntries.find((entry) => entry.tag === '01')?.value).toBe('12');
    expect(dynamicEntries.find((entry) => entry.tag === '54')?.value).toBe('890.00');
  });

  it('formats minor units as a two-decimal amount', () => {
    const amountFor = (minor: number) =>
      parseTlv(buildPromptPayPayload({ ...mobileInput, amount: minor })).find(
        (entry) => entry.tag === '54',
      )?.value;

    expect(amountFor(1)).toBe('0.01');
    expect(amountFor(100)).toBe('1.00');
    expect(amountFor(123456)).toBe('1234.56');
  });

  it('uses the right sub-tag for each proxy type', () => {
    const subTagFor = (payload: string) => {
      const merchant = parseTlv(payload).find((entry) => entry.tag === '29')!;
      return parseTlv(merchant.value).find((entry) => entry.tag !== '00')!.tag;
    };

    expect(subTagFor(buildPromptPayPayload(mobileInput))).toBe('01');
    expect(
      subTagFor(buildPromptPayPayload({ proxyType: 'NATIONAL_ID', proxyValue: '1234567890123' })),
    ).toBe('02');
    expect(
      subTagFor(buildPromptPayPayload({ proxyType: 'EWALLET', proxyValue: '004999012345678' })),
    ).toBe('03');
  });

  it('includes an optional merchant name, city and reference', () => {
    const payload = buildPromptPayPayload({
      ...mobileInput,
      amount: 50000,
      merchantName: 'Neko Studio',
      merchantCity: 'Bangkok',
      reference: 'NEKO-1042',
    });
    const byTag = new Map(parseTlv(payload).map((entry) => [entry.tag, entry.value]));

    expect(byTag.get('59')).toBe('Neko Studio');
    expect(byTag.get('60')).toBe('Bangkok');
    expect(parseTlv(byTag.get('62')!)[0]).toEqual({ tag: '01', value: 'NEKO-1042' });
    expect(verifyPromptPayPayload(payload)).toBe(true);
  });

  it('drops characters that would corrupt the payload and truncates long text', () => {
    const payload = buildPromptPayPayload({
      ...mobileInput,
      merchantName: 'ร้าน Neko ✨ Studio with a very long trailing name',
    });
    const name = parseTlv(payload).find((entry) => entry.tag === '59')!.value;

    expect(name.length).toBeLessThanOrEqual(25);
    expect(name).toMatch(/^[\x20-\x7E]*$/);
    expect(verifyPromptPayPayload(payload)).toBe(true);
  });

  it('rejects a non-integer or negative amount', () => {
    expect(() => buildPromptPayPayload({ ...mobileInput, amount: 12.5 })).toThrow();
    expect(() => buildPromptPayPayload({ ...mobileInput, amount: -100 })).toThrow();
  });

  it('detects a tampered payload', () => {
    const payload = buildPromptPayPayload({ ...mobileInput, amount: 89000 });
    const tampered = payload.replace('890.00', '190.00');
    expect(tampered).not.toBe(payload);
    expect(verifyPromptPayPayload(tampered)).toBe(false);
  });
});
