import { slugify } from '@cc/shared';

/**
 * Resolves a unique slug within a tenant by appending `-2`, `-3`, ... until the
 * `exists` probe returns false.
 */
export async function uniqueSlug(
  desired: string,
  exists: (candidate: string) => Promise<boolean>,
  fallback = 'item',
): Promise<string> {
  const base = slugify(desired) || fallback;
  let candidate = base;
  let suffix = 1;
  // Bounded so a pathological `exists` implementation cannot spin forever.
  while (suffix < 200) {
    if (!(await exists(candidate))) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return `${base}-${Date.now()}`;
}
