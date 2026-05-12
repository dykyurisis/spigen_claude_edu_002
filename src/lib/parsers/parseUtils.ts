export function toNum(raw: unknown): number {
  if (raw == null || raw === '' || raw === '-') return 0
  const n = Number(String(raw).replace(/,/g, '').replace(/%$/, '').trim())
  return Number.isFinite(n) ? n : 0
}
export function toBool(raw: unknown): boolean {
  return String(raw).toLowerCase().trim() === 'true'
}
