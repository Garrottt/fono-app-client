import { useEffect, useMemo, useState } from "react"
import {
  createAppointmentService,
  getAppointmentsService,
  updateAppointmentService
} from "../services/appointment.service"
import { getPatientsService } from "../services/patient.service"
import type { Appointment, CreateAppointmentInput } from "../types/appointment.types"
import type { Patient } from "../types/patient.types"

const CHILE_TIMEZONE = "America/Santiago"
const WEEKDAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  NO_SHOW: "bg-gray-100 text-gray-700 border-gray-200"
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistio"
}

const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

const getCalendarStart = (date: Date) => {
  const monthStart = getMonthStart(date)
  const dayOfWeek = (monthStart.getDay() + 6) % 7
  const start = new Date(monthStart)
  start.setDate(monthStart.getDate() - dayOfWeek)
  return start
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: CHILE_TIMEZONE
  })

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: CHILE_TIMEZONE
  })

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
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

const getStatusStyle = (status: string) => STATUS_STYLES[status] || STATUS_STYLES.SCHEDULED
const getStatusLabel = (status: string) => STATUS_LABELS[status] || status

function DashboardHomePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [movingAppointmentId, setMovingAppointmentId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [currentMonth, setCurrentMonth] = useState(() => getMonthStart(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()))
  const [patientId, setPatientId] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("09:00")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentsData, patientsData] = await Promise.all([
          getAppointmentsService(),
          getPatientsService()
        ])
        setAppointments(appointmentsData)
        setPatients(patientsData)
      } catch (fetchError) {
        setError("Error al cargar el calendario")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const calendarDays = useMemo(() => {
    const start = getCalendarStart(currentMonth)
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start)
      day.setDate(start.getDate() + index)
      return day
    })
  }, [currentMonth])

  const appointmentsByDay = useMemo(() => {
    return appointments.reduce<Record<string, Appointment[]>>((accumulator, appointment) => {
      const key = formatDateKey(new Date(appointment.datetime))
      accumulator[key] ??= []
      accumulator[key].push(appointment)
      accumulator[key].sort((left, right) => left.datetime.localeCompare(right.datetime))
      return accumulator
    }, {})
  }, [appointments])

  const selectedAppointments = useMemo(() => {
    return (appointmentsByDay[selectedDate] ?? []).slice().sort((left, right) => left.datetime.localeCompare(right.datetime))
  }, [appointmentsByDay, selectedDate])

  const selectedPatient = patients.find((patient) => patient.id === patientId)
  const monthLabel = currentMonth.toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric"
  })

  const handleCreateAppointment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!patientId || !selectedDate || !appointmentTime) return

    setSaving(true)
    setError("")

    try {
      const input: CreateAppointmentInput = {
        patientId,
        datetime: `${selectedDate}T${appointmentTime}`,
        notes: notes || undefined
      }

      const created = await createAppointmentService(input)
      setAppointments((currentAppointments) =>
        [...currentAppointments, created].sort((left, right) => left.datetime.localeCompare(right.datetime))
      )
      setNotes("")
    } catch (createError) {
      setError("No se pudo agendar la cita desde el calendario")
    } finally {
      setSaving(false)
    }
  }

  const handleMoveAppointment = async (appointmentId: string, targetDate: string) => {
    const appointment = appointments.find((currentAppointment) => currentAppointment.id === appointmentId)
    if (!appointment) return

    const currentDateTime = toDateTimeLocalValue(appointment.datetime)
    const timePart = currentDateTime.split("T")[1]
    if (!timePart) return

    setMovingAppointmentId(appointmentId)
    setError("")

    try {
      const updated = await updateAppointmentService(appointmentId, {
        datetime: `${targetDate}T${timePart}`
      })

      setAppointments((currentAppointments) =>
        currentAppointments
          .map((currentAppointment) => currentAppointment.id === appointmentId ? updated : currentAppointment)
          .sort((left, right) => left.datetime.localeCompare(right.datetime))
      )
      setSelectedDate(targetDate)
    } catch (moveError) {
      setError("No se pudo reagendar la cita desde el calendario")
    } finally {
      setMovingAppointmentId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Inicio</h2>
          <p className="text-sm text-gray-500">Calendario del mes conectado con tus citas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const today = new Date()
              setCurrentMonth(getMonthStart(today))
              setSelectedDate(toDateInputValue(today))
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-white"
          >
            Hoy
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-white"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-white"
          >
            →
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {loading ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-400 shadow-sm">
          Cargando calendario...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-medium capitalize text-gray-800">{monthLabel}</h3>
                <p className="mt-1 text-xs text-gray-400">Arrastra una cita a otro dia para reagendarla.</p>
              </div>
              <p className="text-sm text-gray-400">{appointments.length} citas registradas</p>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="min-w-[720px]">
                <div className="mb-2 grid grid-cols-7 gap-2">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {label}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const key = formatDateKey(day)
                    const dayAppointments = appointmentsByDay[key] ?? []
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                    const isSelected = key === selectedDate
                    const isToday = key === toDateInputValue(new Date())
                    const isDropTarget = movingAppointmentId !== null

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDate(key)}
                        onDragOver={(event) => {
                          if (movingAppointmentId) event.preventDefault()
                        }}
                        onDrop={(event) => {
                          event.preventDefault()
                          const appointmentId = event.dataTransfer.getData("text/plain")
                          if (appointmentId) {
                            void handleMoveAppointment(appointmentId, key)
                          }
                        }}
                        className={`min-h-28 rounded-xl border p-2 text-left transition-colors ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"
                        } ${!isCurrentMonth ? "opacity-45" : ""} ${isDropTarget ? "cursor-copy" : ""}`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className={`text-sm font-medium ${isToday ? "text-indigo-600" : "text-gray-700"}`}>
                            {day.getDate()}
                          </span>
                          {dayAppointments.length > 0 && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                              {dayAppointments.length}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 3).map((appointment) => (
                            <div
                              key={appointment.id}
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.setData("text/plain", appointment.id)
                                setMovingAppointmentId(appointment.id)
                              }}
                              onDragEnd={() => setMovingAppointmentId(null)}
                              className={`cursor-grab rounded-md border px-2 py-1 text-[11px] shadow-sm active:cursor-grabbing ${getStatusStyle(appointment.status)}`}
                            >
                              <div className="font-medium">{formatTime(appointment.datetime)}</div>
                              <div className="truncate">{appointment.patient?.name || "Paciente"}</div>
                            </div>
                          ))}
                          {dayAppointments.length > 3 && (
                            <div className="text-[11px] font-medium text-indigo-600">
                              + {dayAppointments.length - 3} mas
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-1 text-lg font-medium text-gray-800">Detalle del dia</h3>
              <p className="mb-4 text-sm text-gray-500">
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-CL", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>

              {selectedAppointments.length === 0 ? (
                <p className="text-sm text-gray-400">No hay citas agendadas para este dia.</p>
              ) : (
                <div className="space-y-3">
                  {selectedAppointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{appointment.patient?.name}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(appointment.datetime)}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${getStatusStyle(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>
                      {appointment.notes && (
                        <p className="mt-2 text-sm text-gray-600">{appointment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-1 text-lg font-medium text-gray-800">Agendar desde inicio</h3>
              <p className="mb-4 text-sm text-gray-500">
                Crea una cita rapida para organizar el dia sin salir del calendario.
              </p>

              <form onSubmit={handleCreateAppointment} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Paciente</label>
                  <select
                    value={patientId}
                    onChange={(event) => setPatientId(event.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Selecciona un paciente</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>{patient.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Fecha</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Hora</label>
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(event) => setAppointmentTime(event.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Notas</label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    className="resize-none border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={selectedPatient ? `Observaciones para ${selectedPatient.name}...` : "Observaciones de la cita..."}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || !patientId}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Agendando..." : "Agendar cita"}
                </button>
              </form>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default DashboardHomePage
