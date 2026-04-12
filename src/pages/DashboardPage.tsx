import { useAuth } from "../context/authContext"
import { useNavigate, NavLink, Outlet } from "react-router-dom"

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm transition-colors ${
      isActive
        ? "bg-indigo-50 text-indigo-700 font-medium"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-indigo-600">Fono App</h1>
          <p className="text-xs text-gray-400 mt-1">Panel profesional</p>
        </div>

        <nav className="flex flex-col gap-1 p-3 flex-1">
          <NavLink to="/dashboard" className={navClass}>
            Inicio
          </NavLink>
          <NavLink to="/patients" className={navClass}>
            Pacientes
          </NavLink>
          <NavLink to="/anamnesis" className={navClass}>
            Anamnesis
          </NavLink>
          <NavLink to="/pre-lavado" className={navClass}>
            Pre-Lavado
          </NavLink>
          <NavLink to="/appointments" className={navClass}>
            Citas
          </NavLink>
        </nav>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Sesion activa</p>
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="border border-gray-200 bg-white px-4 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
