import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { SidebarUserInfo } from './SidebarUserInfo'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar footer={<SidebarUserInfo />} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
