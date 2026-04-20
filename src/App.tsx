import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/authContext"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import DashboardHomePage from "./pages/DashboardHomePage"
import PatientsPage from "./pages/PatientsPage"
import PatientDetailPage from "./pages/PatientDetailPage"
import PatientPortalPage from "./pages/PatientPortalPage"
import AppointmentsPage from "./pages/AppointmentsPage"
import PasswordSetupPage from "./pages/PasswordSetupPage"
import AnamnesisPage from "./pages/AnamnesisPage"
import PreLavadoPage from "./pages/PreLavadoPage"

function PrivateRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode
  allowedRoles?: Array<"PROFESSIONAL" | "PATIENT">
}) {
  const { isAuthenticated, authLoading, user } = useAuth()
  if (authLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" />
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to={user?.role === "PATIENT" ? "/portal" : "/dashboard"} />
  }
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated, user, authLoading } = useAuth()

  const getHomeRoute = () => {
    if (!isAuthenticated) return "/login"
    if (user?.role === "PATIENT") return "/portal"
    return "/dashboard"
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-sm text-slate-500">
        Validando sesión...
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={getHomeRoute()} /> : <LoginPage />}
      />
      <Route
        path="/portal/login"
        element={isAuthenticated ? <Navigate to={getHomeRoute()} /> : <LoginPage mode="patient" />}
      />
      <Route path="/portal/set-password" element={<PasswordSetupPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute allowedRoles={["PROFESSIONAL"]}>
            <DashboardPage />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<DashboardHomePage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="anamnesis" element={<AnamnesisPage />} />
        <Route path="pre-lavado" element={<PreLavadoPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
      </Route>

      <Route
        path="/portal"
        element={
          <PrivateRoute allowedRoles={["PATIENT"]}>
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
