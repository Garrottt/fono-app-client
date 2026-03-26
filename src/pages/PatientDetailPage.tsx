import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import type { Patient } from "../types/patient.types"
import type { Session, CreateSessionInput } from "../types/session.types"
import { getPatientsService } from "../services/patient.service"
import { getSessionsService, createSessionService } from "../services/session.service"
import GoalsSection from "../components/GoalsSection"
import TasksSection from "../components/TasksSection"

function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState("")
  const [whatWasDone, setWhatWasDone] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (id) fetchData(id)
  }, [id])

  const fetchData = async (patientId: string) => {
    try {
      const [allPatients, sessionData] = await Promise.all([
        getPatientsService(),
        getSessionsService(patientId)
      ])
      const found = allPatients.find(p => p.id === patientId)
      if (!found) {
        navigate("/patients")
        return
      }
      setPatient(found)
      setSessions(sessionData)
    } catch (err) {
      setError("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    setError("")

    try {
      const input: CreateSessionInput = { date, whatWasDone }
      const newSession = await createSessionService(id, input)
      setSessions([newSession, ...sessions])
      setShowForm(false)
      setDate("")
      setWhatWasDone("")
    } catch (err) {
      setError("Error al registrar la sesión")
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (loading) return <p className="p-6 text-gray-500 text-sm">Cargando...</p>

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/patients")}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Volver
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">{patient?.name}</h2>
      </div>

      {/* Info del paciente */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6 flex gap-8">
        <div>
          <p className="text-xs text-gray-400 mb-1">Email</p>
          <p className="text-sm text-gray-700">{patient?.email || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Teléfono</p>
          <p className="text-sm text-gray-700">{patient?.phone || "—"}</p>
        </div>
      </div>

      {/* Sesiones */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">Sesiones</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {showForm ? "Cancelar" : "+ Nueva sesión"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleCreateSession}
          className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col gap-4"
        >
          <h4 className="text-base font-medium text-gray-700">Nueva sesión</h4>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              ¿Qué se trabajó? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={whatWasDone}
              onChange={(e) => setWhatWasDone(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={4}
              placeholder="Describí lo que se trabajó en la sesión..."
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar sesión"}
            </button>
          </div>
        </form>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-400">No hay sesiones registradas todavía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map(session => (
            <div key={session.id} className="bg-white rounded-lg shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-2">{formatDate(session.date)}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{session.whatWasDone}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8">
        <GoalsSection patientId={id!} />
      </div>
      <div className="mt-8">
        <TasksSection patientId={id!} />
      </div>
    </div>
  )
}

export default PatientDetailPage