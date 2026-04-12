import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/authContext"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import PatientsPage from "./pages/PatientsPage"
import PatientDetailPage from "./pages/PatientDetailPage"
import PatientPortalPage from "./pages/PatientPortalPage"
import AppointmentsPage from "./pages/AppointmentsPage"

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth()

  // Si está autenticado y es paciente, redirigir al portal del paciente
  const getHomeRoute = () => {
    if (!isAuthenticated) return "/login"
    if (user?.role === "PATIENT") return "/portal"
    return "/dashboard"
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={getHomeRoute()} /> : <LoginPage />}
      />

      {/* Rutas del profesional */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<p className="p-6 text-gray-500">Seleccioná una opción del menú.</p>} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
      </Route>

      

      {/* Portal del paciente */}
      <Route
        path="/portal"
        element={
          <PrivateRoute>
            <PatientPortalPage />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to={getHomeRoute()} />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}


export default App