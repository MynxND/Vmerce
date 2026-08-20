/**
 * PromptPay / EMVCo "Merchant Presented Mode" QR payload builder.
 *
 * Implements the Bank of Thailand's PromptPay profile of the EMVCo QR Code
 * Specification for Payment Systems: a flat list of tag-length-value triples,
 * terminated by a CRC-16 over everything that precedes it.
 *
 * Deliberately dependency-free and pure so it can be unit tested without a
 * database, a network, or a bank app — see `promptpay.test.ts`.
 *
 * Scope: this builds the *payload string*. Rendering it as an image, and
 * confirming that money actually arrived, are separate concerns — a PromptPay QR
 * is a bank transfer instruction, not a payment gateway, so nothing here can
 * tell you whether the transfer happened.
 */

/** EMVCo tag ids used by the PromptPay profile. */
const TAG = {
  PAYLOAD_FORMAT: '00',
  POINT_OF_INITIATION: '01',
  MERCHANT_PROMPTPAY: '29',
  CURRENCY: '53',
  AMOUNT: '54',
  COUNTRY: '58',
  MERCHANT_NAME: '59',
  MERCHANT_CITY: '60',
  ADDITIONAL_DATA: '62',
  CRC: '63',
} as const;

/** Sub-tags inside the PromptPay merchant account template (tag 29). */
const PROMPTPAY_SUBTAG = {
  AID: '00',
  MOBILE: '01',
  NATIONAL_ID: '02',
  EWALLET: '03',
  BANK_ACCOUNT: '04',
} as const;

const PROMPTPAY_AID = 'A000000677010111';
const CURRENCY_THB = '764';
const COUNTRY_TH = 'TH';

/** Reusable QR (buyer types the amount) vs one-off QR carrying an amount. */
const POINT_OF_INITIATION = { STATIC: '11', DYNAMIC: '12' } as const;

export type PromptPayProxyType = 'MOBILE' | 'NATIONAL_ID' | 'EWALLET' | 'BANK_ACCOUNT';

export interface PromptPayPayloadInput {
  proxyType: PromptPayProxyType;
  /** Raw value as the creator typed it; normalised here. */
  proxyValue: string;
  /** Minor units (satang). Omit for a reusable static QR. */
  amount?: number | null;
  /** Optional, max 25 chars — some banking apps display it. */
  merchantName?: string | null;
  /** Optional, max 15 chars. */
  merchantCity?: string | null;
  /** Optional free-text reference, surfaced in tag 62 sub-tag 01. */
  reference?: string | null;
}

/** `tag` + zero-padded 2-digit length + value. */
function tlv(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  if (value.length > 99) {
    throw new Error(`Value for tag ${tag} is too long (${value.length} chars, max 99)`);
  }
  return `${tag}${length}${value}`;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * CRC-16/CCITT-FALSE: polynomial 0x1021, initial value 0xFFFF, no input or
 * output reflection, no final XOR. Returned as four uppercase hex digits.
 */
export function crc16ccitt(input: string): string {
  let crc = 0xffff;

  for (let index = 0; index < input.length; index += 1) {
    crc ^= input.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Normalises a proxy value into the exact field width the standard expects.
 *
 * - Mobile: 13 chars — country code 66 with the national leading zero dropped,
 *   left-padded with zeros, e.g. `0812345678` → `0066812345678`.
 * - National ID / tax ID: 13 digits, unchanged.
 * - e-Wallet (TrueMoney and friends): 15 digits, unchanged.
 * - Bank account: digits, variable length.
 */
export function normalizeProxyValue(type: PromptPayProxyType, raw: string): string {
  const digits = digitsOnly(raw);

  switch (type) {
    case 'MOBILE': {
      const national = digits.replace(/^66/, '').replace(/^0+/, '');
      if (national.length !== 9) {
        throw new Error('A Thai mobile number must have 9 digits after the leading zero');
      }
      return `0066${national}`;
    }

    case 'NATIONAL_ID': {
      if (digits.length !== 13) throw new Error('A national ID or tax ID must be 13 digits');
      return digits;
    }

    case 'EWALLET': {
      if (digits.length !== 15) throw new Error('An e-Wallet ID must be 15 digits');
      return digits;
    }

    case 'BANK_ACCOUNT': {
      if (digits.length < 8 || digits.length > 20) {
        throw new Error('A bank account number must be between 8 and 20 digits');
      }
      return digits;
    }

    default: {
      const exhaustive: never = type;
      throw new Error(`Unsupported proxy type: ${String(exhaustive)}`);
    }
  }
}

const SUBTAG_FOR_PROXY: Record<PromptPayProxyType, string> = {
  MOBILE: PROMPTPAY_SUBTAG.MOBILE,
  NATIONAL_ID: PROMPTPAY_SUBTAG.NATIONAL_ID,
  EWALLET: PROMPTPAY_SUBTAG.EWALLET,
  BANK_ACCOUNT: PROMPTPAY_SUBTAG.BANK_ACCOUNT,
};

/** Minor units → the decimal string the standard wants, e.g. 89000 → "890.00". */
function formatAmount(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2);
}

/** Strips characters that would break the payload, then truncates. */
function sanitizeText(value: string, maxLength: number): string {
  return value
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function buildPromptPayPayload(input: PromptPayPayloadInput): string {
  const proxyValue = normalizeProxyValue(input.proxyType, input.proxyValue);

  // Validate as soon as an amount is present, so a bad value cannot silently
  // degrade a dynamic QR into a reusable static one the buyer would have to
  // fill in themselves.
  if (typeof input.amount === 'number') {
    if (!Number.isInteger(input.amount) || input.amount < 0) {
      throw new Error('Amount must be a non-negative integer in the smallest currency unit');
    }
  }

  const isDynamic = typeof input.amount === 'number' && input.amount > 0;

  const merchantAccount =
    tlv(PROMPTPAY_SUBTAG.AID, PROMPTPAY_AID) + tlv(SUBTAG_FOR_PROXY[input.proxyType], proxyValue);

  let payload =
    tlv(TAG.PAYLOAD_FORMAT, '01') +
    tlv(
      TAG.POINT_OF_INITIATION,
      isDynamic ? POINT_OF_INITIATION.DYNAMIC : POINT_OF_INITIATION.STATIC,
    ) +
    tlv(TAG.MERCHANT_PROMPTPAY, merchantAccount) +
    tlv(TAG.CURRENCY, CURRENCY_THB);

  if (isDynamic) payload += tlv(TAG.AMOUNT, formatAmount(input.amount!));

  payload += tlv(TAG.COUNTRY, COUNTRY_TH);

  const name = input.merchantName ? sanitizeText(input.merchantName, 25) : '';
  if (name) payload += tlv(TAG.MERCHANT_NAME, name);

  const city = input.merchantCity ? sanitizeText(input.merchantCity, 15) : '';
  if (city) payload += tlv(TAG.MERCHANT_CITY, city);

  const reference = input.reference ? sanitizeText(input.reference, 25) : '';
  if (reference) payload += tlv(TAG.ADDITIONAL_DATA, tlv('01', reference));

  // The CRC covers the tag and length of the CRC field itself, so append them
  // before computing it.
  const withCrcHeader = `${payload}${TAG.CRC}04`;
  return `${withCrcHeader}${crc16ccitt(withCrcHeader)}`;
}

export interface ParsedTlv {
  tag: string;
  value: string;
}

/** Minimal TLV reader — used by the tests and handy for debugging a payload. */
export function parseTlv(payload: string): ParsedTlv[] {
  const entries: ParsedTlv[] = [];
  let cursor = 0;

  while (cursor + 4 <= payload.length) {
    const tag = payload.slice(cursor, cursor + 2);
    const length = Number.parseInt(payload.slice(cursor + 2, cursor + 4), 10);
    if (!Number.isFinite(length)) break;
    const value = payload.slice(cursor + 4, cursor + 4 + length);
    entries.push({ tag, value });
    cursor += 4 + length;
  }

  return entries;
}

/** Verifies the trailing CRC of a payload produced by any conforming encoder. */
export function verifyPromptPayPayload(payload: string): boolean {
  if (payload.length < 8) return false;
  const body = payload.slice(0, -4);
  const provided = payload.slice(-4).toUpperCase();
  return body.endsWith(`${TAG.CRC}04`) && crc16ccitt(body) === provided;
}
