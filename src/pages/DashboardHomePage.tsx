import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  getAppointmentsService,
  updateAppointmentService
} from "../services/appointment.service"
import { getPatientsService } from "../services/patient.service"
import type { Appointment } from "../types/appointment.types"
import type { Patient } from "../types/patient.types"

const CHILE_TIMEZONE = "America/Santiago"
const WEEKDAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "border-sky-200 bg-sky-50 text-sky-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
  NO_SHOW: "border-slate-200 bg-slate-100 text-slate-600"
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
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [movingAppointmentId, setMovingAppointmentId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [currentMonth, setCurrentMonth] = useState(() => getMonthStart(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()))

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
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">Mes activo</p>
                <p className="mt-2 text-base font-semibold text-white">{monthLabel}</p>
                <p className="mt-1 text-xs text-white/60">{monthAppointmentsCount} citas visibles</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">Día seleccionado</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "short"
                  })}
                </p>
                <p className="mt-1 text-xs text-white/60">{selectedAppointments.length} cita(s) agendadas</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">Siguiente paciente</p>
                <p className="mt-2 line-clamp-1 text-base font-semibold text-white">
                  {upcomingAppointments[0]?.patient?.name || "Sin próximas citas"}
                </p>
                <p className="mt-1 text-xs text-white/60">
                  {upcomingAppointments[0] ? formatTime(upcomingAppointments[0].datetime) : "Agenda despejada"}
                </p>
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Panel de inicio</p>
            <h2 className="fono-title mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
              Un vistazo clínico rápido para decidir qué atender primero.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
              Diseñé esta pantalla para que desde el móvil ya puedas ver agenda, pacientes activos y próximos pasos sin entrar a varias vistas.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/75">
                {selectedAppointments.length > 0 ? `${selectedAppointments.length} pendientes hoy` : "Sin pendientes hoy"}
              </span>
              <span className="rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                {patients.length} pacientes activos
              </span>
              <span className="rounded-full border border-sky-300/18 bg-sky-300/10 px-3 py-1.5 text-xs font-medium text-sky-100">
                {upcomingAppointments.length} próximas citas visibles
              </span>
            </div>
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
        <div className="space-y-5">
          <div className="space-y-5">
            <section className="grid gap-4 sm:grid-cols-3">
              <div className="flex h-full flex-col rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Acceso rápido</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">Agendar desde Inicio</p>
                <p className="mt-1 text-sm text-slate-500">
                  Salta directo al formulario de cita usando la fecha que ya tienes seleccionada.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/appointments")}
                  className="mt-auto inline-flex w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Ir a agendar
                </button>
              </div>
              <div className="flex h-full flex-col rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Próxima acción</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">Ver pacientes</p>
                <p className="mt-1 text-sm text-slate-500">
                  Entra rápido al listado para revisar fichas, objetivos y acceso al portal.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/patients")}
                  className="mt-auto inline-flex w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Abrir pacientes
                </button>
              </div>
              <div className="flex h-full flex-col rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Vista seleccionada</p>
                <p className="mt-1 text-lg font-semibold capitalize text-slate-950">{selectedDateLabel}</p>
                <p className="mt-2 text-sm text-slate-500">{selectedAppointments.length} citas en este día</p>
                <button
                  type="button"
                  onClick={() => {
                    const calendarSection = document.getElementById("calendar-panel")
                    calendarSection?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="mt-auto inline-flex w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Ver calendario
                </button>
              </div>
            </section>

            <section id="calendar-panel" className="rounded-[1.8rem] border border-white/70 bg-white/78 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5 lg:p-6">
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

              <div className="pb-2">
                <div>
                  <div className="mb-2 grid grid-cols-7 gap-2 lg:gap-3">
                    {WEEKDAY_LABELS.map((label) => (
                      <div key={label} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:px-3 sm:text-xs">
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2 lg:gap-3">
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
                          className={`min-h-[7.25rem] rounded-[1.1rem] border p-2 text-left transition-all sm:min-h-[8.5rem] sm:p-3 lg:min-h-[9rem] ${
                            isSelected
                              ? "border-teal-200 bg-teal-50 shadow-[0_18px_30px_rgba(20,184,166,0.12)]"
                              : "border-slate-200 bg-slate-50/75 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                          } ${!isCurrentMonth ? "opacity-45" : ""} ${isDropTarget ? "cursor-copy" : ""}`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-1 sm:mb-3 sm:gap-2">
                            <span className={`text-xs font-semibold sm:text-sm ${isToday ? "text-teal-700" : "text-slate-700"}`}>
                              {day.getDate()}
                            </span>
                            {dayAppointments.length > 0 && (
                              <span className="rounded-full border border-teal-100 bg-white px-2 py-0.5 text-[10px] font-semibold text-teal-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
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
                                className={`cursor-grab rounded-lg border px-2 py-1.5 text-[10px] shadow-sm active:cursor-grabbing sm:rounded-xl sm:px-2.5 sm:py-2 sm:text-[11px] ${getStatusStyle(appointment.status)}`}
                              >
                                <div className="font-semibold">{formatTime(appointment.datetime)}</div>
                                <div className="mt-1 truncate">{appointment.patient?.name || "Paciente"}</div>
                              </div>
                            ))}
                            {dayAppointments.length > 3 && (
                              <div className="pl-1 text-[10px] font-semibold text-teal-700 sm:text-[11px]">
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

        </div>
      )}
    </div>
  )
}

export default DashboardHomePage

