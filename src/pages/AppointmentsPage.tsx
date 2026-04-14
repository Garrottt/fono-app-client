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
  { value: "NO_SHOW", label: "No asistio" }
]

const CHILE_TIMEZONE = "America/Santiago"
const QUICK_REMINDER_OPTIONS = [
  { label: "15 min antes", minutesBefore: 15 },
  { label: "1 hora antes", minutesBefore: 60 },
  { label: "3 horas antes", minutesBefore: 180 },
  { label: "1 dia antes", minutesBefore: 1440 },
  { label: "1 semana antes", minutesBefore: 10080 }
]

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

const createEmptyReminderList = () => [""]

const toIsoDateTimeLocal = (date: Date) => {
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

const getQuickReminderValue = (appointmentDateTime: string, minutesBefore: number) => {
  if (!appointmentDateTime) return ""

  const [datePart, timePart] = appointmentDateTime.split("T")
  if (!datePart || !timePart) return ""

  const [year, month, day] = datePart.split("-").map(Number)
  const [hour, minute] = timePart.split(":").map(Number)
  const appointmentDate = new Date(year, month - 1, day, hour, minute)
  appointmentDate.setMinutes(appointmentDate.getMinutes() - minutesBefore)

  return toIsoDateTimeLocal(appointmentDate)
}

function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [patientId, setPatientId] = useState("")
  const [datetime, setDatetime] = useState("")
  const [notes, setNotes] = useState("")
  const [reminderScheduledAts, setReminderScheduledAts] = useState<string[]>(createEmptyReminderList())

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDatetime, setEditDatetime] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editReminderScheduledAts, setEditReminderScheduledAts] = useState<string[]>(createEmptyReminderList())

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

  const updateReminderAtIndex = (
    reminders: string[],
    index: number,
    value: string,
    setter: (value: string[]) => void
  ) => {
    setter(reminders.map((reminder, reminderIndex) => reminderIndex === index ? value : reminder))
  }

  const addReminderField = (setter: (value: string[]) => void, reminders: string[]) => {
    setter([...reminders, ""])
  }

  const normalizeReminderPayload = (reminders: string[]) =>
    reminders.map((reminder) => reminder.trim()).filter(Boolean)

  const applyQuickReminder = (
    appointmentDateTime: string,
    minutesBefore: number,
    reminders: string[],
    setter: (value: string[]) => void
  ) => {
    const quickValue = getQuickReminderValue(appointmentDateTime, minutesBefore)
    if (!quickValue) return

    const normalizedExisting = normalizeReminderPayload(reminders)
    if (normalizedExisting.includes(quickValue)) return

    setter([...normalizedExisting, quickValue])
  }

  const removeReminderField = (setter: (value: string[]) => void, reminders: string[], index: number) => {
    const next = reminders.filter((_, reminderIndex) => reminderIndex !== index)
    setter(next.length > 0 ? next : createEmptyReminderList())
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")

    try {
      const input: CreateAppointmentInput = {
        patientId,
        datetime,
        notes: notes || undefined,
        reminderScheduledAts: normalizeReminderPayload(reminderScheduledAts)
      }
      const newAppointment = await createAppointmentService(input)
      setAppointments([...appointments, newAppointment])
      setShowForm(false)
      setPatientId("")
      setDatetime("")
      setNotes("")
      setReminderScheduledAts(createEmptyReminderList())
      setMessage("Cita guardada correctamente")
    } catch (err) {
      setError("Error al crear la cita")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: string) => {
    setUpdatingId(id)
    setError("")
    setMessage("")

    try {
      const updated = await updateAppointmentService(id, {
        datetime: editDatetime || undefined,
        notes: editNotes || undefined,
        status: editStatus || undefined,
        reminderScheduledAts: normalizeReminderPayload(editReminderScheduledAts)
      })
      setAppointments(appointments.map((appointment) => appointment.id === id ? updated : appointment))
      setEditingId(null)
      setMessage("Cita actualizada correctamente")
    } catch (err) {
      setError("Error al actualizar la cita")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Estas seguro de eliminar esta cita?")) return
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
      NO_SHOW: "No asistio"
    }
    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.SCHEDULED}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) return <p className="p-4 text-sm text-gray-500 sm:p-6">Cargando...</p>

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Citas</h2>
          <p className="mt-1 text-sm text-gray-500">Organiza el calendario y sus recordatorios desde tablet o escritorio.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 md:w-auto"
        >
          {showForm ? "Cancelar" : "+ Nueva cita"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-medium text-gray-700">Nueva cita</h3>
            {saving && (
              <span className="text-sm font-medium text-indigo-600">Guardando cita...</span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Paciente <span className="text-red-500">*</span>
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={saving}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Selecciona un paciente</option>
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
                disabled={saving}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-medium text-gray-700">Recordatorios</label>
              <button
                type="button"
                onClick={() => addReminderField(setReminderScheduledAts, reminderScheduledAts)}
                disabled={saving}
                className="text-left text-sm text-indigo-600 hover:text-indigo-700 sm:text-right"
              >
                + Agregar recordatorio
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_REMINDER_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => applyQuickReminder(datetime, option.minutesBefore, reminderScheduledAts, setReminderScheduledAts)}
                  disabled={!datetime || saving}
                  className="rounded-full border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                >
                  {option.label}
                </button>
              ))}
            </div>

            {reminderScheduledAts.map((reminder, index) => (
              <div key={`create-reminder-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="datetime-local"
                  value={reminder}
                  onChange={(e) => updateReminderAtIndex(reminderScheduledAts, index, e.target.value, setReminderScheduledAts)}
                  disabled={saving}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => removeReminderField(setReminderScheduledAts, reminderScheduledAts, index)}
                  disabled={saving}
                  className="px-2 py-2 text-left text-sm text-red-500 hover:text-red-600 disabled:text-gray-300"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              className="resize-none border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Observaciones sobre la cita..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {saving ? "Guardando..." : "Guardar cita"}
            </button>
          </div>
        </form>
      )}

      {appointments.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-gray-400">No hay citas registradas todavia.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="rounded-xl bg-white p-5 shadow-sm">
              {editingId === appointment.id ? (
                <div className="flex flex-col gap-4">
                  {updatingId === appointment.id && (
                    <p className="text-sm font-medium text-indigo-600">Guardando cambios de la cita...</p>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Fecha y hora</label>
                      <input
                        type="datetime-local"
                        value={editDatetime}
                        onChange={(e) => setEditDatetime(e.target.value)}
                        disabled={updatingId === appointment.id}
                        className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Estado</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        disabled={updatingId === appointment.id}
                        className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="text-sm font-medium text-gray-700">Recordatorios</label>
                      <button
                        type="button"
                        onClick={() => addReminderField(setEditReminderScheduledAts, editReminderScheduledAts)}
                        disabled={updatingId === appointment.id}
                        className="text-left text-sm text-indigo-600 hover:text-indigo-700 sm:text-right"
                      >
                        + Agregar recordatorio
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {QUICK_REMINDER_OPTIONS.map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => applyQuickReminder(editDatetime, option.minutesBefore, editReminderScheduledAts, setEditReminderScheduledAts)}
                          disabled={!editDatetime || updatingId === appointment.id}
                          className="rounded-full border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {editReminderScheduledAts.map((reminder, index) => (
                      <div key={`edit-reminder-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="datetime-local"
                          value={reminder}
                          onChange={(e) => updateReminderAtIndex(editReminderScheduledAts, index, e.target.value, setEditReminderScheduledAts)}
                          disabled={updatingId === appointment.id}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeReminderField(setEditReminderScheduledAts, editReminderScheduledAts, index)}
                          disabled={updatingId === appointment.id}
                          className="px-2 py-2 text-left text-sm text-red-500 hover:text-red-600 disabled:text-gray-300"
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Notas</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      disabled={updatingId === appointment.id}
                      className="resize-none border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={updatingId === appointment.id}
                      className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleUpdate(appointment.id)}
                      disabled={updatingId === appointment.id}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === appointment.id ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <p className="text-sm font-medium text-gray-800">
                        {appointment.patient?.name}
                      </p>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <p className="text-sm text-gray-500">{formatDatetime(appointment.datetime)}</p>
                    {appointment.notes && (
                      <p className="mt-1 text-xs text-gray-400">{appointment.notes}</p>
                    )}
                    {appointment.reminders.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        {appointment.reminders.map((reminder) => (
                          <p key={reminder.id} className={`text-xs ${reminder.sentAt ? "text-green-500" : "text-indigo-400"}`}>
                            {reminder.sentAt ? "Recordatorio enviado" : "Recordatorio programado"}: {formatDatetime(reminder.scheduledAt)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 lg:ml-4">
                    <button
                      onClick={() => {
                        setEditingId(appointment.id)
                        setEditDatetime(toDateTimeLocalValue(appointment.datetime))
                        setEditNotes(appointment.notes || "")
                        setEditStatus(appointment.status)
                        setEditReminderScheduledAts(
                          appointment.reminders.length > 0
                            ? appointment.reminders.map((reminder) => toDateTimeLocalValue(reminder.scheduledAt))
                            : createEmptyReminderList()
                        )
                      }}
                      className="text-xs font-medium text-indigo-500 transition-colors hover:text-indigo-700"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(appointment.id)}
                      className="text-xs font-medium text-red-400 transition-colors hover:text-red-600"
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
