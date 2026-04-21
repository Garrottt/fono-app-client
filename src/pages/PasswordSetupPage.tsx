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
        setError("El enlace no es valido")
        setLoading(false)
        return
      }

      try {
        const data = await validatePasswordSetupTokenService(token)
        setPatientName(data.user.name)
        setEmail(data.user.email)
      } catch (validationError: any) {
        setError(validationError?.response?.data?.message || "El enlace no es valido")
      } finally {
        setLoading(false)
      }
    }

    void validateToken()
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
      setTimeout(() => navigate("/portal/login"), 1800)
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message || "No se pudo actualizar la contraseña")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Configurar contraseña</h1>
        <p className="mb-6 text-sm text-gray-500">
          Cambia tu contraseña temporal para acceder al portal de forma segura.
        </p>

        {loading ? (
          <p className="text-sm text-gray-400">Validando enlace...</p>
        ) : error && !patientName ? (
          <div className="space-y-4">
            <p className="text-sm text-red-500">{error}</p>
            <Link to="/portal/login" className="text-sm text-indigo-600 hover:text-indigo-700">
              Ir al login de pacientes
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
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Minimo 8 caracteres"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Repite la contraseña"
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <button
              type="submit"
              disabled={submitting || Boolean(success)}
              className="rounded-md bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
            {submitting ? "Guardando..." : "Guardar nueva contraseña"}
            </button>

            <Link to="/portal/login" className="text-center text-sm text-gray-500 hover:text-gray-700">
              Ir al login de pacientes
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}

export default PasswordSetupPage
