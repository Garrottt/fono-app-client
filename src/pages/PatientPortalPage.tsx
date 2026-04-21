import { useState, useEffect } from "react"
import { useAuth } from "../context/authContext"
import { useNavigate } from "react-router-dom"
import { getSessionsService } from "../services/session.service"
import { getGoalsService } from "../services/goal.service"
import { getAppointmentsByPatientService } from "../services/appointment.service"
import { API_URL } from "../services/api"
import type { Session } from "../types/session.types"
import type { Goal } from "../types/goal.types"
import type { Appointment } from "../types/appointment.types"
import AppBrand from "../components/AppBrand"

const CHILE_TIMEZONE = "America/Santiago"

const getGoalProgressState = (completedOperationalGoals: number, totalOperationalGoals: number) => {
  if (totalOperationalGoals === 0 || completedOperationalGoals === 0) {
    return {
      label: "No cumplido",
      styles: "bg-gray-100 text-gray-700"
    }
  }

  if (completedOperationalGoals === totalOperationalGoals) {
    return {
      label: "Completado",
      styles: "bg-green-100 text-green-700"
    }
  }

  return {
    label: "En progreso",
    styles: "bg-yellow-100 text-yellow-700"
  }
}

function PatientPortalPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState<Session[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"sessions" | "goals" | "appointments">("sessions")

  useEffect(() => {
    if (user?.id) fetchData(user.id)
  }, [user])

  const fetchData = async (patientId: string) => {
    try {
      const [sessionData, goalData, appointmentData] = await Promise.all([
        getSessionsService(patientId),
        getGoalsService(patientId),
        getAppointmentsByPatientService(patientId)
      ])
      setSessions(sessionData)
      setGoals(goalData)
      setAppointments(appointmentData)
    } catch (err) {
      console.error("Error al cargar datos:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const formatDate = (dateString: string) => (
    new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: CHILE_TIMEZONE
    })
  )

  const formatDateTime = (dateString: string) => (
    new Date(dateString).toLocaleString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: CHILE_TIMEZONE
    })
  )

  const getFileIcon = (filetype: string) => {
    if (filetype === "application/pdf") return "PDF"
    if (filetype.includes("word")) return "WORD"
    if (filetype.startsWith("image/")) return "IMG"
    return "ARCH"
  }

  const getFileUrl = (url: string) => new URL(url, API_URL).toString()

  const getAppointmentStatusBadge = (status: string) => {
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

  const upcomingAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.datetime)
    return appointmentDate >= new Date() && appointment.status !== "CANCELLED"
  })

  const pastAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.datetime)
    return appointmentDate < new Date() || appointment.status === "CANCELLED"
  })

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
        <AppBrand compact />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hola, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex gap-1 rounded-lg bg-white p-1 shadow-sm">
          {[
            { key: "sessions", label: "Sesiones" },
            { key: "goals", label: "Objetivos" },
            { key: "appointments", label: "Citas" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-400">Cargando...</p>
        ) : (
          <>
            {activeTab === "sessions" && (
              <div className="flex flex-col gap-3">
                {sessions.length === 0 ? (
                  <div className="rounded-lg bg-white p-8 text-center shadow-sm">
                    <p className="text-gray-400">No hay sesiones registradas todavía.</p>
                  </div>
                ) : sessions.map((session) => (
                  <div key={session.id} className="rounded-lg bg-white p-5 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-400">{formatDate(session.date)}</p>
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                        Sesión {session.sessionNumber}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700">{session.whatWasDone}</p>

                    {session.sessionTasks.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs uppercase tracking-wide text-gray-400">Indicaciones y material</p>
                        {session.sessionTasks.map((sessionTask, index) => (
                          <div key={sessionTask.id} className="rounded-lg border border-gray-200 p-4">
                            <p className="text-sm font-medium text-gray-800">
                              {index + 1}. {sessionTask.title}
                            </p>
                            {sessionTask.description && (
                              <p className="mt-1 text-sm leading-relaxed text-gray-500">{sessionTask.description}</p>
                            )}
                            {sessionTask.files.length > 0 && (
                              <div className="mt-3 flex flex-col gap-1">
                                {sessionTask.files.map((file) => (
                                  <a
                                    key={file.id}
                                    href={getFileUrl(file.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 transition-colors hover:text-indigo-800"
                                  >
                                    <span>{getFileIcon(file.filetype)}</span>
                                    <span>{file.filename}</span>
                                    <span className="text-gray-400">- Descargar</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "goals" && (
              <div className="flex flex-col gap-4">
                {goals.length === 0 ? (
                  <div className="rounded-lg bg-white p-8 text-center shadow-sm">
                    <p className="text-gray-400">No hay objetivos registrados todavía.</p>
                  </div>
                ) : goals.map((goal) => {
                  const completedOperationalGoals = goal.operationalGoals.filter((operationalGoal) => operationalGoal.completed).length
                  const goalProgressState = getGoalProgressState(completedOperationalGoals, goal.operationalGoals.length)

                  return (
                  <div key={goal.id} className="rounded-lg bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <p className="mb-1 text-sm font-medium text-gray-800">{goal.description}</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
                        </p>
                      </div>
                      <span className={`ml-4 rounded-full px-2 py-1 text-xs font-medium ${goalProgressState.styles}`}>
                        {goalProgressState.label}
                      </span>
                    </div>
                    {goal.operationalGoals.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {goal.operationalGoals.map((operationalGoal) => (
                          <div key={operationalGoal.id} className="flex items-center gap-3 rounded-md bg-gray-50 p-2">
                            <div className={`h-2 w-2 shrink-0 rounded-full ${
                              operationalGoal.completed ? "bg-green-500" : "bg-gray-300"
                            }`} />
                            <span className={`flex-1 text-sm ${
                              operationalGoal.completed ? "text-gray-400 line-through" : "text-gray-700"
                            }`}>
                              {operationalGoal.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )})}
              </div>
            )}

            {activeTab === "appointments" && (
              <div className="flex flex-col gap-3">
                <section className="flex flex-col gap-3">
                  <div className="px-1">
            <h2 className="text-sm font-semibold text-gray-800">Próximas citas</h2>
                  </div>
                  {upcomingAppointments.length === 0 ? (
                    <div className="rounded-lg bg-white p-8 text-center shadow-sm">
              <p className="text-gray-400">No tienes próximas citas registradas.</p>
                    </div>
                  ) : upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-lg bg-white p-5 shadow-sm">
                      <div className="mb-2 flex items-center gap-3">
                        <p className="text-sm font-medium text-gray-800">Proxima cita</p>
                        {getAppointmentStatusBadge(appointment.status)}
                      </div>
                      <p className="text-sm text-gray-700">{formatDateTime(appointment.datetime)}</p>
                      {appointment.notes && (
                        <p className="mt-2 text-sm text-gray-500">{appointment.notes}</p>
                      )}
                      {appointment.reminders.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1">
                          {appointment.reminders.map((reminder) => (
                            <p
                              key={reminder.id}
                              className={`text-xs ${reminder.sentAt ? "text-green-500" : "text-indigo-500"}`}
                            >
                              {reminder.sentAt ? "Recordatorio enviado" : "Recordatorio programado"}: {formatDateTime(reminder.scheduledAt)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </section>

                <section className="mt-4 flex flex-col gap-3">
                  <div className="px-1">
                    <h2 className="text-sm font-semibold text-gray-800">Citas anteriores</h2>
                  </div>
                  {pastAppointments.length === 0 ? (
                    <div className="rounded-lg bg-white p-8 text-center shadow-sm">
                      <p className="text-gray-400">No tienes citas anteriores registradas.</p>
                    </div>
                  ) : pastAppointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-lg bg-white p-5 shadow-sm">
                      <div className="mb-2 flex items-center gap-3">
                        <p className="text-sm font-medium text-gray-800">Cita anterior</p>
                        {getAppointmentStatusBadge(appointment.status)}
                      </div>
                      <p className="text-sm text-gray-700">{formatDateTime(appointment.datetime)}</p>
                      {appointment.notes && (
                        <p className="mt-2 text-sm text-gray-500">{appointment.notes}</p>
                      )}
                      {appointment.reminders.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1">
                          {appointment.reminders.map((reminder) => (
                            <p
                              key={reminder.id}
                              className={`text-xs ${reminder.sentAt ? "text-green-500" : "text-indigo-500"}`}
                            >
                              {reminder.sentAt ? "Recordatorio enviado" : "Recordatorio programado"}: {formatDateTime(reminder.scheduledAt)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default PatientPortalPage
