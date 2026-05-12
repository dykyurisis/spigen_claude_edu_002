export function normalizeDate(raw: string | null | undefined): string {
  if (raw == null || raw === '') return ''
  const s = raw.trim()
  if (s.length >= 10 && s[4] === '-' && s[7] === '-') return s.slice(0, 10)
  if (/^\d{8}$/.test(s)) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`
  throw new RangeError(`normalizeDate: unrecognized format "${s}"`)
}
