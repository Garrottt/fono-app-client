import { useEffect, useMemo, useState } from "react"
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
  const [search, setSearch] = useState("")

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
    void fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [appointmentData, patientData] = await Promise.all([
        getAppointmentsService(),
        getPatientsService()
      ])
      setAppointments(appointmentData)
      setPatients(patientData)
    } catch {
      setError("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const sortedAppointments = useMemo(
    () => [...appointments].sort((left, right) => left.datetime.localeCompare(right.datetime)),
    [appointments]
  )

  const filteredAppointments = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return sortedAppointments

    return sortedAppointments.filter((appointment) =>
      appointment.patient?.name?.toLowerCase().includes(normalized) ||
      appointment.notes?.toLowerCase().includes(normalized) ||
      appointment.status.toLowerCase().includes(normalized)
    )
  }, [search, sortedAppointments])

  const upcomingCount = sortedAppointments.filter(
    (appointment) => new Date(appointment.datetime).getTime() >= Date.now() && appointment.status === "SCHEDULED"
  ).length
  const reminderCount = sortedAppointments.reduce(
    (total, appointment) => total + appointment.reminders.filter((reminder) => !reminder.sentAt).length,
    0
  )
  const todayCount = sortedAppointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.datetime)
    const today = new Date()
    return appointmentDate.toDateString() === today.toDateString()
  }).length

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

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
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
      setAppointments((current) => [...current, newAppointment])
      setShowForm(false)
      setPatientId("")
      setDatetime("")
      setNotes("")
      setReminderScheduledAts(createEmptyReminderList())
      setMessage("Cita guardada correctamente")
    } catch {
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
      setAppointments((current) => current.map((appointment) => appointment.id === id ? updated : appointment))
      setEditingId(null)
      setMessage("Cita actualizada correctamente")
    } catch {
      setError("Error al actualizar la cita")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta cita?")) return
    try {
      await deleteAppointmentService(id)
      setAppointments((current) => current.filter((appointment) => appointment.id !== id))
    } catch {
      setError("Error al eliminar la cita")
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SCHEDULED: "border-sky-200 bg-sky-50 text-sky-700",
      COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
      CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
      NO_SHOW: "border-slate-200 bg-slate-100 text-slate-600"
    }
    const labels: Record<string, string> = {
      SCHEDULED: "Programada",
      COMPLETED: "Completada",
      CANCELLED: "Cancelada",
      NO_SHOW: "No asistio"
    }
    return (
      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status] || styles.SCHEDULED}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-5">
        <div className="rounded-[1.8rem] border border-white/70 bg-white/78 px-5 py-14 text-center text-sm text-slate-400 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          Cargando agenda...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 p-3 sm:p-4 lg:p-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-700 px-5 py-6 text-white shadow-[0_28px_60px_rgba(15,23,42,0.2)] sm:px-6 lg:px-8 lg:py-8">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Módulo citas</p>
            <h2 className="fono-title mt-3 text-3xl font-semibold sm:text-4xl">
              Agenda, recordatorios y cambios de estado con menos pasos.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base">
              La nueva vista prioriza lo próximo, deja las acciones frecuentes cerca y mejora la lectura de cada cita tanto en celular como en escritorio.
            </p>
          </div>

          <button
            onClick={() => setShowForm((current) => !current)}
            className="inline-flex self-start rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_18px_32px_rgba(15,23,42,0.14)] transition hover:bg-slate-100"
          >
            {showForm ? "Cancelar" : "Nueva cita"}
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Programadas</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{upcomingCount}</p>
          <p className="mt-2 text-sm text-slate-500">próximas citas activas</p>
        </div>
        <div className="rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recordatorios</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{reminderCount}</p>
          <p className="mt-2 text-sm text-slate-500">pendientes de envío</p>
        </div>
        <div className="rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Hoy</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{todayCount}</p>
          <p className="mt-2 text-sm text-slate-500">citas en la jornada</p>
        </div>
      </section>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-[1.8rem] border border-white/70 bg-white/80 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Alta rápida</p>
              <h3 className="fono-title mt-2 text-2xl font-semibold text-slate-950">Nueva cita</h3>
            </div>
            {saving && <span className="text-sm font-semibold text-sky-700">Guardando cita...</span>}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Paciente</label>
              <select
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                disabled={saving}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                required
              >
                <option value="">Selecciona un paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>{patient.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Fecha y hora</label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(event) => setDatetime(event.target.value)}
                disabled={saving}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                required
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-semibold text-slate-700">Recordatorios</label>
              <button
                type="button"
                onClick={() => addReminderField(setReminderScheduledAts, reminderScheduledAts)}
                disabled={saving}
                className="text-left text-sm font-semibold text-sky-700 hover:text-sky-800 sm:text-right"
              >
                Agregar recordatorio
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_REMINDER_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => applyQuickReminder(datetime, option.minutesBefore, reminderScheduledAts, setReminderScheduledAts)}
                  disabled={!datetime || saving}
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
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
                  onChange={(event) => updateReminderAtIndex(reminderScheduledAts, index, event.target.value, setReminderScheduledAts)}
                  disabled={saving}
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
                <button
                  type="button"
                  onClick={() => removeReminderField(setReminderScheduledAts, reminderScheduledAts, index)}
                  disabled={saving}
                  className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Notas</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={saving}
              className="resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              rows={3}
              placeholder="Observaciones sobre la cita..."
            />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cita"}
            </button>
          </div>
        </form>
      )}

      <section className="rounded-[1.8rem] border border-white/70 bg-white/80 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Seguimiento de agenda</p>
            <h3 className="fono-title mt-2 text-2xl font-semibold text-slate-950">Lista de citas</h3>
          </div>

          <div className="relative w-full max-w-xl">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por paciente, estado o notas"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                <circle cx="11" cy="11" r="6.5" />
              </svg>
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-[1.3rem] border border-slate-200 bg-slate-50/75 px-4 py-3 text-sm text-slate-500">
          {filteredAppointments.length} cita(s) visibles{search ? ` para “${search}”` : ""}.
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-400">
            No hay citas registradas con ese filtro.
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_14px_28px_rgba(15,23,42,0.06)]">
                {editingId === appointment.id ? (
                  <div className="flex flex-col gap-4">
                    {updatingId === appointment.id && (
                      <p className="text-sm font-semibold text-sky-700">Guardando cambios...</p>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Fecha y hora</label>
                        <input
                          type="datetime-local"
                          value={editDatetime}
                          onChange={(event) => setEditDatetime(event.target.value)}
                          disabled={updatingId === appointment.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Estado</label>
                        <select
                          value={editStatus}
                          onChange={(event) => setEditStatus(event.target.value)}
                          disabled={updatingId === appointment.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <label className="text-sm font-semibold text-slate-700">Recordatorios</label>
                        <button
                          type="button"
                          onClick={() => addReminderField(setEditReminderScheduledAts, editReminderScheduledAts)}
                          disabled={updatingId === appointment.id}
                          className="text-left text-sm font-semibold text-sky-700 hover:text-sky-800 sm:text-right"
                        >
                          Agregar recordatorio
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {QUICK_REMINDER_OPTIONS.map((option) => (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => applyQuickReminder(editDatetime, option.minutesBefore, editReminderScheduledAts, setEditReminderScheduledAts)}
                            disabled={!editDatetime || updatingId === appointment.id}
                            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
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
                            onChange={(event) => updateReminderAtIndex(editReminderScheduledAts, index, event.target.value, setEditReminderScheduledAts)}
                            disabled={updatingId === appointment.id}
                            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                          />
                          <button
                            type="button"
                            onClick={() => removeReminderField(setEditReminderScheduledAts, editReminderScheduledAts, index)}
                            disabled={updatingId === appointment.id}
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">Notas</label>
                      <textarea
                        value={editNotes}
                        onChange={(event) => setEditNotes(event.target.value)}
                        disabled={updatingId === appointment.id}
                        className="resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={updatingId === appointment.id}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleUpdate(appointment.id)}
                        disabled={updatingId === appointment.id}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                      >
                        {updatingId === appointment.id ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-slate-950">{appointment.patient?.name || "Paciente"}</p>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{formatDatetime(appointment.datetime)}</p>
                      {appointment.notes && (
                        <p className="mt-3 text-sm leading-6 text-slate-600">{appointment.notes}</p>
                      )}
                      {appointment.reminders.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2">
                          {appointment.reminders.map((reminder) => (
                            <div
                              key={reminder.id}
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${reminder.sentAt ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}
                            >
                              {reminder.sentAt ? "Recordatorio enviado" : "Recordatorio programado"}: {formatDatetime(reminder.scheduledAt)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 lg:ml-4 lg:flex-col lg:items-end">
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
                        className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(appointment.id)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
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
      </section>
    </div>
  )
}

export default AppointmentsPage

