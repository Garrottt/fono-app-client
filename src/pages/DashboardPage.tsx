import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/authContext"
import AppBrand from "../components/AppBrand"

function MenuIcon({ children }: { children: ReactNode }) {
  return <span className="flex h-5 w-5 shrink-0 items-center justify-center">{children}</span>
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
  { to: "/dashboard", label: "Inicio", icon: <HomeIcon />, hint: "Resumen de agenda y actividad" },
  { to: "/patients", label: "Pacientes", icon: <PatientsIcon />, hint: "Ficha base y acceso rápido" },
  { to: "/anamnesis", label: "Anamnesis", icon: <ClipboardIcon />, hint: "Antecedentes y alertas" },
  { to: "/pre-lavado", label: "Pre-Lavado", icon: <CheckNoteIcon />, hint: "Evaluación y aptitud" },
  { to: "/appointments", label: "Citas", icon: <CalendarIcon />, hint: "Calendario y recordatorios" }
]

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const currentSection = useMemo(
    () => NAV_ITEMS.find((item) => location.pathname.startsWith(item.to)) ?? NAV_ITEMS[0],
    [location.pathname]
  )

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-start gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200 ${
      isActive
        ? "bg-slate-950 text-white shadow-[0_18px_32px_rgba(15,23,42,0.18)]"
        : "text-slate-600 hover:bg-white/85 hover:text-slate-950"
    }`

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all ${
      isActive
        ? "bg-teal-50 text-teal-700"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`

  return (
    <div className="min-h-screen px-3 pb-24 pt-3 sm:px-4 sm:pb-28 lg:px-4 lg:pb-4 lg:pt-4">
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1440px] gap-4 lg:min-h-[calc(100vh-2rem)]">
        <aside className="fono-card hidden w-[284px] shrink-0 flex-col rounded-[1.8rem] p-4 lg:flex">
          <div className="rounded-[1.6rem] border border-white/60 bg-white/85 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
            <AppBrand />
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Flujo clínico claro para seguimiento, anamnesis, pre-lavado y coordinación de citas.
            </p>
          </div>

          <div className="mt-4 rounded-[1.4rem] border border-white/60 bg-white/72 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Sesión activa</p>
            <p className="mt-3 text-lg font-semibold text-slate-950">{user?.name || "Profesional"}</p>
              <p className="mt-1 text-sm text-slate-500">Profesional de atención</p>
          </div>

          <nav className="mt-5 flex flex-1 flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={sidebarLinkClass}>
                <span className="mt-0.5">{item.icon}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-current/70">{item.hint}</span>
                </span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[min(88vw,20rem)] flex-col bg-white/96 p-4 shadow-[0_32px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-transform duration-200 lg:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <AppBrand compact />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
              >
                Cerrar
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-500">Acceso rápido a módulos clínicos y administrativos.</p>
          </div>

          <nav className="mt-5 flex flex-1 flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={sidebarLinkClass}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mt-0.5">{item.icon}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-current/70">{item.hint}</span>
                </span>
              </NavLink>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Cerrar sesión
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="fono-card flex min-h-full flex-col rounded-[1.8rem]">
            <header className="sticky top-3 z-30 border-b border-white/70 bg-white/70 px-4 py-4 backdrop-blur-xl sm:px-5 lg:top-4 lg:px-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
                    aria-label="Abrir menú"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                    </svg>
                  </button>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Módulo activo</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <h1 className="fono-title text-[1.7rem] font-semibold text-slate-950 sm:text-[1.9rem]">
                        {currentSection.label}
                      </h1>
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                        {currentSection.hint}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                  <div className="hidden rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-right shadow-sm sm:block">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Hoy</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {new Date().toLocaleDateString("es-CL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long"
                      })}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-gradient-to-r from-slate-950 to-teal-800 px-4 py-3 text-white shadow-[0_18px_34px_rgba(15,23,42,0.16)]">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">Usuario</p>
                    <p className="mt-1 text-sm font-semibold">{user?.name || "Profesional"}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto px-2 pb-4 pt-2 sm:px-3 lg:px-3">
              <div key={location.pathname} className="fono-page-transition">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 rounded-[1.8rem] border border-white/70 bg-white/88 p-2 shadow-[0_24px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={mobileLinkClass}>
              {item.icon}
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default DashboardPage
