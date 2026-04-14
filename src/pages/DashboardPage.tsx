import { useState } from "react"
import type { ReactNode } from "react"
import { useAuth } from "../context/authContext"
import { useNavigate, NavLink, Outlet } from "react-router-dom"
import AppBrand from "../components/AppBrand"

function MenuIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-gray-400">
      {children}
    </span>
  )
}

function HomeIcon() {
  return (
    <MenuIcon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M3 10.5L12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 9.5V20h13V9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </MenuIcon>
  )
}

function PatientsIcon() {
  return (
    <MenuIcon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.5 19a4.5 4.5 0 0 1 9 0" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 18.5a3.8 3.8 0 0 1 6.5-2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </MenuIcon>
  )
}

function ClipboardIcon() {
  return (
    <MenuIcon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M9 4.5h6" strokeLinecap="round" />
        <path d="M9 3h6a2 2 0 0 1 2 2v1H7V5a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 6H5.5A1.5 1.5 0 0 0 4 7.5v12A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 18.5 6H17" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </MenuIcon>
  )
}

function CheckNoteIcon() {
  return (
    <MenuIcon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M7 3.5h10A1.5 1.5 0 0 1 18.5 5v14a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </MenuIcon>
  )
}

function CalendarIcon() {
  return (
    <MenuIcon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M7 3.5v3M17 3.5v3" strokeLinecap="round" />
        <path d="M5.5 6h13A1.5 1.5 0 0 1 20 7.5v11A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 10h16" strokeLinecap="round" />
      </svg>
    </MenuIcon>
  )
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Inicio", icon: <HomeIcon /> },
  { to: "/patients", label: "Pacientes", icon: <PatientsIcon /> },
  { to: "/anamnesis", label: "Anamnesis", icon: <ClipboardIcon /> },
  { to: "/pre-lavado", label: "Pre-Lavado", icon: <CheckNoteIcon /> },
  { to: "/appointments", label: "Citas", icon: <CalendarIcon /> }
]

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-base transition-colors ${
      isActive
        ? "bg-indigo-100 text-indigo-700 font-semibold"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`

  const navItems = (
    <>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={navClass}
          onClick={() => setMobileMenuOpen(false)}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </>
  )

  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-gray-900/30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Cerrar menu"
        />
      )}

      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-gray-100 px-6 py-5">
          <AppBrand compact />
          <p className="mt-1 text-xs text-gray-400">Panel profesional</p>
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-3">
          {navItems}
        </nav>
      </aside>

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-gray-200 bg-white shadow-xl transition-transform duration-200 lg:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <AppBrand compact />
            <p className="mt-1 text-xs text-gray-400">Panel profesional</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600"
          >
            Cerrar
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-2 p-3">
          {navItems}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 lg:hidden"
            >
              Menu
            </button>
            <div>
              <p className="text-xs text-gray-400">Sesion activa</p>
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 sm:px-4"
          >
            Cerrar sesion
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
