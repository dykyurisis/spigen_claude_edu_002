'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { UploadModal } from '@/components/upload/UploadModal'
import { DateRangePicker } from '@/components/ui/DateRangePicker'

const NAV = [
  { href: '/overview',    label: 'Overview' },
  { href: '/advertising', label: 'Advertising' },
  { href: '/product',     label: 'Products' },
  { href: '/inventory',   label: 'Inventory' },
  { href: '/attribution', label: 'Attribution' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [uploadOpen, setUploadOpen] = useState(false)
  return (
    <>
      <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col bg-zinc-900 border-r border-zinc-800">
        <div className="px-4 py-5 text-sm font-semibold text-zinc-300 border-b border-zinc-800">
          Spigen DE Analytics
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-pink-600/20 text-pink-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <DateRangePicker />
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => setUploadOpen(true)}
            className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Upload Data
          </button>
        </div>
      </aside>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  )
}
