'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { UploadModal } from '@/components/upload/UploadModal'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { useDashboardStore } from '@/lib/store/dashboardStore'

const NAV = [
  { href: '/overview',    label: 'Overview' },
  { href: '/advertising', label: 'Advertising' },
  { href: '/product',     label: 'Products' },
  { href: '/inventory',   label: 'Inventory' },
  { href: '/attribution', label: 'Attribution' },
]

export function Sidebar({ footer }: { footer?: React.ReactNode }) {
  const pathname = usePathname()
  const [uploadOpen, setUploadOpen] = useState(false)
  const mobileOpen = useDashboardStore(s => s.mobileSidebarOpen)
  const closeMobileSidebar = useDashboardStore(s => s.closeMobileSidebar)

  return (
    <>
      {/* Backdrop overlay — mobile only */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileSidebar}
        aria-hidden="true"
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-zinc-900 border-r border-zinc-800
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:w-56 md:shrink-0 md:z-auto md:h-full
        `}
      >
        {/* Header row with title + close button (mobile) */}
        <div className="px-4 py-5 flex items-center justify-between border-b border-zinc-800">
          <span className="text-sm font-semibold text-zinc-300">Spigen DE Analytics</span>
          <button
            onClick={closeMobileSidebar}
            aria-label="Close navigation menu"
            className="md:hidden flex items-center justify-center w-7 h-7 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13"/>
              <line x1="13" y1="1" x2="1" y2="13"/>
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMobileSidebar}
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

        <div className="shrink-0">
          <DateRangePicker />
          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={() => setUploadOpen(true)}
              className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              Upload Data
            </button>
          </div>
          {footer}
        </div>
      </aside>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  )
}
