import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import type { Patient } from "../types/patient.types"
import type { Session, CreateSessionInput } from "../types/session.types"
import {
  getPatientsService,
  updatePatientService,
  configurePortalAccessService
} from "../services/patient.service"
import {
  getSessionsService,
  createSessionService,
  updateSessionService,
  deleteSessionService
} from "../services/session.service"
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
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editWhatWasDone, setEditWhatWasDone] = useState("")
  const [diagnosisText, setDiagnosisText] = useState("")
  const [editingPatientInfo, setEditingPatientInfo] = useState(false)
  const [patientName, setPatientName] = useState("")
  const [patientAge, setPatientAge] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [patientInfoSaving, setPatientInfoSaving] = useState(false)
  const [portalEmail, setPortalEmail] = useState("")
  const [portalPassword, setPortalPassword] = useState("")
  const [portalSaving, setPortalSaving] = useState(false)
  const [portalMessage, setPortalMessage] = useState("")

  useEffect(() => {
    if (id) fetchData(id)
  }, [id])

  const fetchData = async (patientId: string) => {
    try {
      const [allPatients, sessionData] = await Promise.all([
        getPatientsService(),
        getSessionsService(patientId)
      ])
      const found = allPatients.find((currentPatient) => currentPatient.id === patientId)
      if (!found) {
        navigate("/patients")
        return
      }
      setPatient(found)
      setPatientName(found.name)
      setPatientAge(found.age?.toString() || "")
      setPatientEmail(found.email || "")
      setPatientPhone(found.phone || "")
      setDiagnosisText(found.diagnosis || "")
      setPortalEmail(found.user?.email || found.email || "")
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

  const handleUpdateSession = async (sessionId: string) => {
    if (!editDate || !editWhatWasDone || !id) return
    try {
      const updated = await updateSessionService(id, sessionId, {
        date: editDate + "T12:00:00",
        whatWasDone: editWhatWasDone
      })
      setSessions(sessions.map((session) => session.id === sessionId ? updated : session))
      setEditingSessionId(null)
    } catch (err) {
      setError("Error al actualizar la sesión")
    }
  }

  const handleUpdatePatientInfo = async () => {
    if (!id || !patientName.trim()) return
    setPatientInfoSaving(true)
    setError("")

    try {
      const updated = await updatePatientService(id, {
        name: patientName.trim(),
        age: patientAge ? Number(patientAge) : undefined,
        email: patientEmail.trim() || undefined,
        phone: patientPhone.trim() || undefined,
        diagnosis: diagnosisText.trim() || undefined
      })
      setPatient(updated)
      setPortalEmail(updated.user?.email || updated.email || "")
      setEditingPatientInfo(false)
    } catch (err) {
      setError("Error al actualizar los datos del paciente")
    } finally {
      setPatientInfoSaving(false)
    }
  }

  const handleSavePortalAccess = async () => {
    if (!id || !portalEmail || !portalPassword || !patient) return
    setPortalSaving(true)
    setPortalMessage("")
    setError("")

    try {
      const response = await configurePortalAccessService(id, {
        email: portalEmail,
        password: portalPassword
      })
      const user = response.user
      setPatient({
        ...patient,
        user: {
          id: user.id,
          email: user.email
        }
      })
      setPortalPassword("")
      setPortalMessage(response.message)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al guardar el acceso al portal")
    } finally {
      setPortalSaving(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta sesión?")) return
    if (!id) return
    try {
      await deleteSessionService(id, sessionId)
      setSessions(sessions.filter((session) => session.id !== sessionId))
    } catch (err) {
      setError("Error al eliminar la sesión")
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
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/patients")}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Volver
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">{patient?.name}</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Datos del paciente</h3>
          {editingPatientInfo ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingPatientInfo(false)
                  setPatientName(patient?.name || "")
                  setPatientAge(patient?.age?.toString() || "")
                  setPatientEmail(patient?.email || "")
                  setPatientPhone(patient?.phone || "")
                  setDiagnosisText(patient?.diagnosis || "")
                }}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdatePatientInfo}
                disabled={patientInfoSaving || !patientName.trim()}
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {patientInfoSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingPatientInfo(true)}
              className="text-indigo-500 hover:text-indigo-700 text-sm font-medium transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        <div className="flex gap-8 items-start">
          <div>
            <p className="text-xs text-gray-400 mb-1">Edad</p>
            {editingPatientInfo ? (
              <input
                type="number"
                min="0"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-32"
                placeholder="Ej: 8"
              />
            ) : (
              <p className="text-sm text-gray-700">{patient?.age ?? "—"}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Email</p>
            {editingPatientInfo ? (
              <input
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-60"
                placeholder="correo@ejemplo.com"
              />
            ) : (
              <p className="text-sm text-gray-700">{patient?.email || "—"}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Teléfono</p>
            {editingPatientInfo ? (
              <input
                type="text"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-48"
                placeholder="+56 9 ..."
              />
            ) : (
              <p className="text-sm text-gray-700">{patient?.phone || "—"}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Nombre</p>
            {editingPatientInfo ? (
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-60"
                placeholder="Nombre del paciente"
              />
            ) : (
              <p className="text-sm text-gray-700">{patient?.name}</p>
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Diagnóstico</p>
            {editingPatientInfo ? (
              <textarea
                value={diagnosisText}
                onChange={(e) => setDiagnosisText(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none w-full"
                rows={3}
                placeholder="Ej: Dislalia funcional, retraso en el lenguaje..."
              />
            ) : (
              <p className="text-sm text-gray-700">
                {patient?.diagnosis || <span className="text-gray-400 italic">Sin diagnóstico</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-800">Acceso al portal</h3>
            <p className="text-sm text-gray-500">
              {patient?.user?.email
                ? `Acceso activo con ${patient.user.email}`
                : "Este paciente todavía no tiene credenciales para iniciar sesión en el portal."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email de acceso</label>
            <input
              type="email"
              value={portalEmail}
              onChange={(e) => setPortalEmail(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="paciente@correo.com"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {patient?.user ? "Nueva contraseña" : "Contraseña inicial"}
            </label>
            <input
              type="password"
              value={portalPassword}
              onChange={(e) => setPortalPassword(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Mínimo recomendable: 8 caracteres"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSavePortalAccess}
            disabled={portalSaving || !portalEmail || !portalPassword}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {portalSaving ? "Guardando..." : patient?.user ? "Actualizar acceso" : "Crear acceso"}
          </button>
          {portalMessage && (
            <p className="text-sm text-green-600">{portalMessage}</p>
          )}
        </div>
      </div>

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
          {sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-lg shadow-sm p-5">
              {editingSessionId === session.id ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                  />
                  <textarea
                    value={editWhatWasDone}
                    onChange={(e) => setEditWhatWasDone(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={4}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingSessionId(null)}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleUpdateSession(session.id)}
                      className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-gray-400 mb-2">{formatDate(session.date)}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditingSessionId(session.id)
                          setEditDate(session.date.split("T")[0])
                          setEditWhatWasDone(session.whatWasDone)
                        }}
                        className="text-indigo-500 hover:text-indigo-700 text-xs font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{session.whatWasDone}</p>
                </>
              )}
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
