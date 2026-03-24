import { useAuth } from "../context/authContext"
import { useNavigate, Link, Outlet } from "react-router-dom"

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <aside className="w-56 bg-white shadow-sm flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-indigo-600">Fono App</h1>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          <Link
            to="/dashboard"
            className="px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Inicio
          </Link>
          <Link
            to="/patients"
            className="px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Pacientes
          </Link>
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="px-3 py-2 text-xs text-gray-400">{user?.name}</div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

    </div>
  )
}

export default DashboardPage