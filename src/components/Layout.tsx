import { Outlet } from 'react-router-dom'
import AppHeader from './AppHeader'

export default function Layout() {
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      {/* Extra top padding so content clears the fixed header (including mobile nav) */}
      {/* Extra bottom padding on mobile so content isn't hidden behind bottom nav */}
      <main className="pt-40 sm:pt-40 md:pt-24 lg:pt-20  min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}

