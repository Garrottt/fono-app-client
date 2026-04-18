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
  SCHEDULED: "border-sky-200 bg-sky-50 text-sky-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
  NO_SHOW: "border-slate-200 bg-slate-100 text-slate-600"
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

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      {direction === "left"
        ? <path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

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
      } catch {
        setError("Error al cargar el calendario")
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [])

  const todayKey = toDateInputValue(new Date())
  const selectedPatient = patients.find((patient) => patient.id === patientId)

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

  const selectedAppointments = useMemo(
    () => (appointmentsByDay[selectedDate] ?? []).slice().sort((left, right) => left.datetime.localeCompare(right.datetime)),
    [appointmentsByDay, selectedDate]
  )

  const upcomingAppointments = useMemo(() => {
    const now = new Date().getTime()
    return appointments
      .filter((appointment) => new Date(appointment.datetime).getTime() >= now)
      .sort((left, right) => left.datetime.localeCompare(right.datetime))
      .slice(0, 4)
  }, [appointments])

  const monthAppointmentsCount = useMemo(
    () =>
      appointments.filter((appointment) => {
        const date = new Date(appointment.datetime)
        return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear()
      }).length,
    [appointments, currentMonth]
  )

  const todayAppointmentsCount = (appointmentsByDay[todayKey] ?? []).length
  const completedCount = appointments.filter((appointment) => appointment.status === "COMPLETED").length
  const monthLabel = currentMonth.toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric"
  })
  const selectedDateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
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
    } catch {
      setError("No se pudo agendar la cita desde inicio")
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
    } catch {
      setError("No se pudo reagendar la cita desde el calendario")
    } finally {
      setMovingAppointmentId(null)
    }
  }

  return (
    <div className="space-y-5 p-3 sm:p-4 lg:p-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-800 px-5 py-6 text-white shadow-[0_28px_60px_rgba(15,23,42,0.22)] sm:px-6 lg:px-8 lg:py-8">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] xl:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Panel de inicio</p>
            <h2 className="fono-title mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
              Un vistazo clínico rápido para decidir qué atender primero.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
              Diseñé esta pantalla para que desde el móvil ya puedas ver agenda, pacientes activos y próximos pasos sin entrar a varias vistas.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Hoy</p>
              <p className="mt-2 text-3xl font-semibold text-white">{todayAppointmentsCount}</p>
              <p className="mt-2 text-sm text-white/65">citas programadas</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Pacientes</p>
              <p className="mt-2 text-3xl font-semibold text-white">{patients.length}</p>
              <p className="mt-2 text-sm text-white/65">registros activos</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Completadas</p>
              <p className="mt-2 text-3xl font-semibold text-white">{completedCount}</p>
              <p className="mt-2 text-sm text-white/65">citas cerradas</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-[1.8rem] border border-white/70 bg-white/75 px-5 py-14 text-center text-sm text-slate-400 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          Cargando calendario...
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)]">
          <div className="space-y-5">
            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mes actual</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{monthAppointmentsCount}</p>
                <p className="mt-2 text-sm text-slate-500">citas visibles en el calendario</p>
              </div>
              <div className="rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Próxima acción</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">
                  {upcomingAppointments[0]?.patient?.name || "Sin próximas citas"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {upcomingAppointments[0] ? formatDateTime(upcomingAppointments[0].datetime) : "Agenda libre por ahora"}
                </p>
              </div>
              <div className="rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Vista seleccionada</p>
                <p className="mt-3 text-lg font-semibold capitalize text-slate-950">{selectedDateLabel}</p>
                <p className="mt-2 text-sm text-slate-500">{selectedAppointments.length} citas en este día</p>
              </div>
            </section>

            <section className="rounded-[1.8rem] border border-white/70 bg-white/78 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5 lg:p-6">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Calendario inteligente</p>
                  <h3 className="fono-title mt-2 text-2xl font-semibold capitalize text-slate-950">{monthLabel}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Arrastra una cita a otro día para reagendar rápidamente sin salir de Inicio.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const today = new Date()
                      setCurrentMonth(getMonthStart(today))
                      setSelectedDate(toDateInputValue(today))
                    }}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    aria-label="Mes anterior"
                  >
                    <Chevron direction="left" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    aria-label="Mes siguiente"
                  >
                    <Chevron direction="right" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="min-w-[760px]">
                  <div className="mb-2 grid grid-cols-7 gap-2">
                    {WEEKDAY_LABELS.map((label) => (
                      <div key={label} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
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
                      const isToday = key === todayKey
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
                          className={`min-h-32 rounded-[1.35rem] border p-3 text-left transition-all ${
                            isSelected
                              ? "border-teal-200 bg-teal-50 shadow-[0_18px_30px_rgba(20,184,166,0.12)]"
                              : "border-slate-200 bg-slate-50/75 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                          } ${!isCurrentMonth ? "opacity-45" : ""} ${isDropTarget ? "cursor-copy" : ""}`}
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <span className={`text-sm font-semibold ${isToday ? "text-teal-700" : "text-slate-700"}`}>
                              {day.getDate()}
                            </span>
                            {dayAppointments.length > 0 && (
                              <span className="rounded-full border border-teal-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-700">
                                {dayAppointments.length}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            {dayAppointments.slice(0, 3).map((appointment) => (
                              <div
                                key={appointment.id}
                                draggable
                                onDragStart={(event) => {
                                  event.dataTransfer.setData("text/plain", appointment.id)
                                  setMovingAppointmentId(appointment.id)
                                }}
                                onDragEnd={() => setMovingAppointmentId(null)}
                                className={`cursor-grab rounded-xl border px-2.5 py-2 text-[11px] shadow-sm active:cursor-grabbing ${getStatusStyle(appointment.status)}`}
                              >
                                <div className="font-semibold">{formatTime(appointment.datetime)}</div>
                                <div className="mt-1 truncate">{appointment.patient?.name || "Paciente"}</div>
                              </div>
                            ))}
                            {dayAppointments.length > 3 && (
                              <div className="pl-1 text-[11px] font-semibold text-teal-700">
                                + {dayAppointments.length - 3} más
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
          </div>

          <section className="space-y-5">
            <div className="rounded-[1.8rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Detalle del día</p>
              <h3 className="fono-title mt-2 text-2xl font-semibold capitalize text-slate-950">{selectedDateLabel}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Vista rápida de pacientes, estado y observaciones para este bloque.
              </p>

              <div className="mt-5 space-y-3">
                {selectedAppointments.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                    No hay citas agendadas para este día.
                  </div>
                ) : (
                  selectedAppointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-[1.35rem] border border-slate-200 bg-slate-50/75 p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{appointment.patient?.name || "Paciente"}</p>
                            <p className="mt-1 text-xs text-slate-500">{formatDateTime(appointment.datetime)}</p>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>
                        {appointment.notes && <p className="text-sm leading-6 text-slate-600">{appointment.notes}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Próximas citas</p>
              <h3 className="fono-title mt-2 text-2xl font-semibold text-slate-950">Lo que viene</h3>
              <div className="mt-5 space-y-3">
                {upcomingAppointments.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                    No hay próximas citas programadas.
                  </div>
                ) : (
                  upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-[1.3rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{appointment.patient?.name || "Paciente"}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDateTime(appointment.datetime)}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Acción rápida</p>
              <h3 className="fono-title mt-2 text-2xl font-semibold text-slate-950">Agendar desde inicio</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Pensado para móvil: fecha preseleccionada, menos campos visibles y foco en completar rápido.
              </p>

              <form onSubmit={handleCreateAppointment} className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Paciente</label>
                  <select
                    value={patientId}
                    onChange={(event) => setPatientId(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    required
                  >
                    <option value="">Selecciona un paciente</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>{patient.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Fecha</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Hora</label>
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(event) => setAppointmentTime(event.target.value)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Notas</label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    className="resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    placeholder={selectedPatient ? `Observaciones para ${selectedPatient.name}...` : "Observaciones de la cita..."}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || !patientId}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:opacity-50"
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

