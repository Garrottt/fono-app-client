import { useState, useEffect } from "react"
import type { Appointment, CreateAppointmentInput } from "../types/appointment.types"
import type { Patient } from "../types/patient.types"
import {
  getAppointmentsService,
  createAppointmentService,
  updateAppointmentService,
  deleteAppointmentService
} from "../services/appointment.service"
import { getPatientsService } from "../services/patient.service"

const STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Programada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "NO_SHOW", label: "No asisti\u00f3" },
]

const CHILE_TIMEZONE = "America/Santiago"

const formatDatetime = (dateString: string) => {
  const date = new Date(dateString)

  return date.toLocaleString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: CHILE_TIMEZONE
  })
}

const toDateTimeLocalValue = (dateString: string) => {
  const date = new Date(dateString)
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: CHILE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })

  return formatter.format(date).replace(" ", "T")
}

function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const [patientId, setPatientId] = useState("")
  const [datetime, setDatetime] = useState("")
  const [notes, setNotes] = useState("")
  const [reminderScheduledAt, setReminderScheduledAt] = useState("")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDatetime, setEditDatetime] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editReminderScheduledAt, setEditReminderScheduledAt] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [appointmentData, patientData] = await Promise.all([
        getAppointmentsService(),
        getPatientsService()
      ])
      setAppointments(appointmentData)
      setPatients(patientData)
    } catch (err) {
      setError("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const input: CreateAppointmentInput = {
        patientId,
        datetime,
        notes: notes || undefined,
        reminderScheduledAt: reminderScheduledAt || undefined
      }
      const newAppointment = await createAppointmentService(input)
      setAppointments([...appointments, newAppointment])
      setShowForm(false)
      setPatientId("")
      setDatetime("")
      setNotes("")
      setReminderScheduledAt("")
    } catch (err) {
      setError("Error al crear la cita")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      const updated = await updateAppointmentService(id, {
        datetime: editDatetime || undefined,
        notes: editNotes || undefined,
        status: editStatus || undefined,
        reminderScheduledAt: editReminderScheduledAt || undefined
      })
      setAppointments(appointments.map((appointment) => appointment.id === id ? updated : appointment))
      setEditingId(null)
    } catch (err) {
      setError("Error al actualizar la cita")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("\u00bfEst\u00e1s seguro de eliminar esta cita?")) return
    try {
      await deleteAppointmentService(id)
      setAppointments(appointments.filter((appointment) => appointment.id !== id))
    } catch (err) {
      setError("Error al eliminar la cita")
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SCHEDULED: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
      NO_SHOW: "bg-gray-100 text-gray-700"
    }
    const labels: Record<string, string> = {
      SCHEDULED: "Programada",
      COMPLETED: "Completada",
      CANCELLED: "Cancelada",
      NO_SHOW: "No asisti\u00f3"
    }
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] || styles.SCHEDULED}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) return <p className="p-6 text-gray-500 text-sm">Cargando...</p>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Citas</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {showForm ? "Cancelar" : "+ Nueva cita"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col gap-4"
        >
          <h3 className="text-base font-medium text-gray-700">Nueva cita</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Paciente <span className="text-red-500">*</span>
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Seleccioná un paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>{patient.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Fecha y hora <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Recordatorio programado <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="datetime-local"
              value={reminderScheduledAt}
              onChange={(e) => setReminderScheduledAt(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400">Ej: la tarde anterior a la cita</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={2}
              placeholder="Observaciones sobre la cita..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cita"}
            </button>
          </div>
        </form>
      )}

      {appointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-400">No hay citas registradas todav\u00eda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-lg shadow-sm p-5">
              {editingId === appointment.id ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Fecha y hora</label>
                      <input
                        type="datetime-local"
                        value={editDatetime}
                        onChange={(e) => setEditDatetime(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Estado</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Recordatorio programado</label>
                    <input
                      type="datetime-local"
                      value={editReminderScheduledAt}
                      onChange={(e) => setEditReminderScheduledAt(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Notas</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleUpdate(appointment.id)}
                      className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-medium text-gray-800">
                        {appointment.patient?.name}
                      </p>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <p className="text-sm text-gray-500">{formatDatetime(appointment.datetime)}</p>
                    {appointment.notes && (
                      <p className="text-xs text-gray-400 mt-1">{appointment.notes}</p>
                    )}
                    {appointment.reminderScheduledAt && !appointment.reminderSent && (
                      <p className="text-xs text-indigo-400 mt-1">
                        Recordatorio programado: {formatDatetime(appointment.reminderScheduledAt)}
                      </p>
                    )}
                    {appointment.reminderSent && (
                      <p className="text-xs text-green-500 mt-1">✓ Recordatorio enviado</p>
                    )}
                  </div>
                  <div className="flex gap-3 ml-4">
                    <button
                      onClick={() => {
                        setEditingId(appointment.id)
                        setEditDatetime(toDateTimeLocalValue(appointment.datetime))
                        setEditNotes(appointment.notes || "")
                        setEditStatus(appointment.status)
                        setEditReminderScheduledAt(
                          appointment.reminderScheduledAt
                            ? toDateTimeLocalValue(appointment.reminderScheduledAt)
                            : ""
                        )
                      }}
                      className="text-indigo-500 hover:text-indigo-700 text-xs font-medium transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(appointment.id)}
                      className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage
