import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import type { Patient } from "../types/patient.types"
import type { Session } from "../types/session.types"
import {
  getPatientsService,
  updatePatientService,
  configurePortalAccessService
} from "../services/patient.service"
import { getSessionsService } from "../services/session.service"
import InterventionHierarchySection from "../components/InterventionHierarchySection"
import GoalsSection from "../components/GoalsSection"
import SessionsSection from "../components/SessionsSection"

function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
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
  const [goalsRefreshToken, setGoalsRefreshToken] = useState(0)

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
    } catch {
      setError("Error al cargar los datos")
    } finally {
      setLoading(false)
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
    } catch {
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

  if (loading) return <p className="p-4 text-sm text-gray-500 sm:p-6">Cargando...</p>

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={() => navigate("/patients")}
          className="text-left text-gray-400 transition-colors hover:text-gray-600"
        >
          ← Volver
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">{patient?.name}</h2>
      </div>

      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium text-gray-800">Datos del paciente</h3>
          {editingPatientInfo ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => {
                  setEditingPatientInfo(false)
                  setPatientName(patient?.name || "")
                  setPatientAge(patient?.age?.toString() || "")
                  setPatientEmail(patient?.email || "")
                  setPatientPhone(patient?.phone || "")
                  setDiagnosisText(patient?.diagnosis || "")
                }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdatePatientInfo}
                disabled={patientInfoSaving || !patientName.trim()}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {patientInfoSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingPatientInfo(true)}
              className="text-sm font-medium text-indigo-500 transition-colors hover:text-indigo-700"
            >
              Editar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Edad</p>
            {editingPatientInfo ? (
              <input
                type="number"
                min="0"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: 8"
              />
            ) : (
              <p className="text-sm text-gray-700">{patient?.age ?? "-"}</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Email</p>
            {editingPatientInfo ? (
              <input
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="correo@ejemplo.com"
              />
            ) : (
              <p className="break-words text-sm text-gray-700">{patient?.email || "-"}</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Teléfono</p>
            {editingPatientInfo ? (
              <input
                type="text"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+56 9 ..."
              />
            ) : (
              <p className="text-sm text-gray-700">{patient?.phone || "-"}</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Nombre</p>
            {editingPatientInfo ? (
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nombre del paciente"
              />
            ) : (
              <p className="text-sm text-gray-700">{patient?.name}</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4 xl:col-span-1 md:col-span-2">
            <p className="mb-2 text-sm font-semibold text-slate-700">Diagnóstico</p>
            {editingPatientInfo ? (
              <textarea
                value={diagnosisText}
                onChange={(e) => setDiagnosisText(e.target.value)}
                className="w-full resize-none rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Ej: Dislalia funcional, retraso en el lenguaje..."
              />
            ) : (
              <p className="text-sm text-gray-700">
                {patient?.diagnosis || <span className="italic text-gray-400">Sin diagnóstico</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800">Acceso al portal</h3>
          <p className="mt-1 text-sm text-gray-500">
            {patient?.user?.email
              ? `Acceso activo con ${patient.user.email}`
              : "Este paciente todavía no tiene credenciales para iniciar sesión en el portal."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email de acceso</label>
            <input
              type="email"
              value={portalEmail}
              onChange={(e) => setPortalEmail(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Mínimo recomendable: 8 caracteres"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <button
            onClick={handleSavePortalAccess}
            disabled={portalSaving || !portalEmail || !portalPassword}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {portalSaving ? "Guardando..." : patient?.user ? "Actualizar acceso" : "Crear acceso"}
          </button>
          {portalMessage && (
            <p className="text-sm text-green-600">{portalMessage}</p>
          )}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {id && (
        <InterventionHierarchySection
          patientId={id}
          contentHierarchy={patient?.contentHierarchy || []}
          hierarchyCriteria={patient?.hierarchyCriteria || ""}
          focus={patient?.focus || ""}
          modality={patient?.modality || ""}
          strategies={patient?.strategies || ""}
          onSaved={(payload) => setPatient((current) => (
            current ? { ...current, ...payload } : current
          ))}
        />
      )}
      {id && <div className="h-6" />}
      {id && (
        <GoalsSection
          patientId={id}
          currentGeneralObjective={patient?.generalObjective || ""}
          onGeneralObjectiveSaved={(generalObjective) => setPatient((current) => (
            current ? { ...current, generalObjective } : current
          ))}
          onGoalsUpdated={() => setGoalsRefreshToken((current) => current + 1)}
        />
      )}
      {id && <div className="h-6" />}
      {id && (
        <SessionsSection
          patientId={id}
          generalObjective={patient?.generalObjective || ""}
          contentHierarchy={patient?.contentHierarchy || []}
          hierarchyCriteria={patient?.hierarchyCriteria || ""}
          focus={patient?.focus || ""}
          modality={patient?.modality || ""}
          strategies={patient?.strategies || ""}
          goalsRefreshToken={goalsRefreshToken}
          sessions={sessions}
          onSessionsChange={setSessions}
          onError={setError}
        />
      )}
    </div>
  )
}

export default PatientDetailPage
