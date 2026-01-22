import { Outlet } from 'react-router-dom'
import AppHeader from './AppHeader'

export default function Layout() {
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      <main className="pt-20 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}

