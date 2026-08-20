/**
 * Thai bank reference data.
 *
 * Codes are the Bank of Thailand three-digit institution codes. They are used
 * for display and for grouping only — the PromptPay payload keys off the phone /
 * ID / e-wallet proxy, never off the bank code, so a stale entry here cannot
 * produce a QR that sends money to the wrong place.
 */
export interface ThaiBank {
  code: string;
  name: string;
  shortName: string;
}

export const THAI_BANKS: ThaiBank[] = [
  { code: '002', name: 'Bangkok Bank', shortName: 'BBL' },
  { code: '004', name: 'Kasikornbank', shortName: 'KBank' },
  { code: '006', name: 'Krungthai Bank', shortName: 'KTB' },
  { code: '011', name: 'TMBThanachart Bank', shortName: 'ttb' },
  { code: '014', name: 'Siam Commercial Bank', shortName: 'SCB' },
  { code: '022', name: 'CIMB Thai Bank', shortName: 'CIMBT' },
  { code: '024', name: 'UOB Thailand', shortName: 'UOBT' },
  { code: '025', name: 'Bank of Ayudhya (Krungsri)', shortName: 'BAY' },
  { code: '030', name: 'Government Savings Bank', shortName: 'GSB' },
  { code: '033', name: 'Government Housing Bank', shortName: 'GHB' },
  { code: '034', name: 'Bank for Agriculture and Agricultural Cooperatives', shortName: 'BAAC' },
  { code: '067', name: 'TISCO Bank', shortName: 'TISCO' },
  { code: '069', name: 'Kiatnakin Phatra Bank', shortName: 'KKP' },
  { code: '070', name: 'ICBC (Thai)', shortName: 'ICBCT' },
  { code: '073', name: 'Land and Houses Bank', shortName: 'LH Bank' },
  { code: '098', name: 'SME Development Bank', shortName: 'SME' },
];

export function findBank(code: string | null | undefined): ThaiBank | undefined {
  if (!code) return undefined;
  return THAI_BANKS.find((bank) => bank.code === code);
}

export function bankName(code: string | null | undefined): string | null {
  return findBank(code)?.name ?? null;
}

/**
 * Masks an account identifier for display before the buyer commits to a channel,
 * e.g. `0812345678` → `081-xxx-5678`, `1234567890` → `••••••7890`.
 */
export function maskIdentifier(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '••••';

  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)}-xxx-${digits.slice(-4)}`;
  }
  return `${'•'.repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
}
