import { Outlet } from 'react-router'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function AppLayout() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--content-bg)' }}>
      <Sidebar />
      <Header />
      <main className="ml-60 pt-16 p-6">
        <Outlet />
      </main>
    </div>
  )
}
