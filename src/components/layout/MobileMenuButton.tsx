'use client'
import { useDashboardStore } from '@/lib/store/dashboardStore'

export function MobileMenuButton() {
  const openMobileSidebar = useDashboardStore(s => s.openMobileSidebar)
  return (
    <button
      onClick={openMobileSidebar}
      aria-label="Open navigation menu"
      className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
    >
      {/* Hamburger icon */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="2" y1="4.5" x2="16" y2="4.5"/>
        <line x1="2" y1="9" x2="16" y2="9"/>
        <line x1="2" y1="13.5" x2="16" y2="13.5"/>
      </svg>
    </button>
  )
}
