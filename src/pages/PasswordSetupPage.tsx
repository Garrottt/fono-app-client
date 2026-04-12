import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  completePasswordSetupService,
  validatePasswordSetupTokenService
} from "../services/auth.service"

function PasswordSetupPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token") || ""

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [patientName, setPatientName] = useState("")
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("El enlace no es válido")
        setLoading(false)
        return
      }

      try {
        const data = await validatePasswordSetupTokenService(token)
        setPatientName(data.user.name)
        setEmail(data.user.email)
      } catch (validationError: any) {
        setError(validationError?.response?.data?.message || "El enlace no es válido")
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setSubmitting(true)

    try {
      const response = await completePasswordSetupService({
        token,
        newPassword
      })
      setSuccess(response.message)
      setTimeout(() => navigate("/login"), 1800)
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message || "No se pudo actualizar la contraseña")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Configurar contraseña</h1>
        <p className="text-sm text-gray-500 mb-6">
          Cambia tu contraseña temporal para acceder al portal de forma segura.
        </p>

        {loading ? (
          <p className="text-sm text-gray-400">Validando enlace...</p>
        ) : error && !patientName ? (
          <div className="space-y-4">
            <p className="text-sm text-red-500">{error}</p>
            <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-700">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="rounded-md bg-indigo-50 p-4">
              <p className="text-sm font-medium text-indigo-900">{patientName}</p>
              <p className="text-sm text-indigo-700">{email}</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Repite la contraseña"
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <button
              type="submit"
              disabled={submitting || Boolean(success)}
              className="bg-indigo-600 text-white py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Guardando..." : "Guardar nueva contraseña"}
            </button>

            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 text-center">
              Volver al inicio de sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}

export default PasswordSetupPage
