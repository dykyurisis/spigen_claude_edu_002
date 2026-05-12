const VARIANTS = {
  danger:  'bg-red-900/40 text-red-400 border border-red-700',
  warning: 'bg-amber-900/40 text-amber-400 border border-amber-700',
  success: 'bg-green-900/40 text-green-400 border border-green-700',
  neutral: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
}

export function Badge({ variant, label }: { variant: keyof typeof VARIANTS; label: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${VARIANTS[variant]}`}>
      {label}
    </span>
  )
}
