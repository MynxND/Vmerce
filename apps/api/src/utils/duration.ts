const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Parses `15m`, `30d`, `900s`, `1h` into milliseconds. */
export function parseDuration(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) throw new Error(`Invalid duration: "${value}"`);
  const amount = Number(match[1]);
  const unit = UNIT_MS[match[2]!];
  if (unit === undefined) throw new Error(`Invalid duration unit in "${value}"`);
  return amount * unit;
}

export function fromNow(value: string): Date {
  return new Date(Date.now() + parseDuration(value));
}
