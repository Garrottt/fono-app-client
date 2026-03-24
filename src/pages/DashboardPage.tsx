import { useAuth } from "../context/authContext"
import { useNavigate } from "react-router-dom"

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hola, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="p-6">
        <p className="text-gray-500">Bienvenido al sistema de gestión fonoaudiológica.</p>
      </main>
    </div>
  )
}

export default DashboardPage