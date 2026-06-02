// IMPORTANT: This component must remain a Server Component (no 'use client').
// SidebarUserInfo is an async Server Component passed as a prop to the Sidebar Client Component.
// Adding 'use client' here would break the async Server Component pattern.
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { SidebarUserInfo } from './SidebarUserInfo'
import { ChatWidget } from '@/components/chat/ChatWidget'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar footer={<SidebarUserInfo />} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <ChatWidget />
    </div>
  )
}
