/** Independently implemented small, deterministic arithmetic helpers. */
export const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function geometricCost(base, ratio, owned, count = 1) {
  if (count <= 0) return 0;
  if (Math.abs(ratio - 1) < 1e-12) return base * count;
  return base * Math.pow(ratio, owned) * Math.expm1(count * Math.log(ratio)) / Math.expm1(Math.log(ratio));
}
export function nextRandom(state) {
  let n = state.rng >>> 0;
  n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
  state.rng = n >>> 0 || 0x6d2b79f5;
  return state.rng / 4294967296;
}
export function triangularInverse(value) { return (Math.sqrt(8 * Math.max(0, value) + 1) - 1) / 2; }
export function limitedDR(value, limit = 1) {
  if (value < 0) return -limitedDR(-value, limit);
  if (value === 0) return 0;
  const threshold = .75 * limit;
  if (value <= threshold) return value;
  return threshold + (limit - threshold) * (1 - 1 / ((value - threshold) / (limit - threshold) + 1));
}
export function clone(value) { return JSON.parse(JSON.stringify(value)); }
