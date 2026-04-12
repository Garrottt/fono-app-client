import { useState, useEffect } from "react"
import { useAuth } from "../context/authContext"
import { useNavigate } from "react-router-dom"
import { getSessionsService } from "../services/session.service"
import { getGoalsService } from "../services/goal.service"
import { getTasksService } from "../services/task.service"
import { getAppointmentsByPatientService } from "../services/appointment.service"
import type { Session } from "../types/session.types"
import type { Goal } from "../types/goal.types"
import type { Task } from "../types/task.types"
import type { Appointment } from "../types/appointment.types"

const CHILE_TIMEZONE = "America/Santiago"

function PatientPortalPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState<Session[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"sessions" | "goals" | "tasks" | "appointments">("sessions")

  useEffect(() => {
    if (user?.id) fetchData(user.id)
  }, [user])

  const fetchData = async (patientId: string) => {
    try {
      const [sessionData, goalData, taskData, appointmentData] = await Promise.all([
        getSessionsService(patientId),
        getGoalsService(patientId),
        getTasksService(patientId),
        getAppointmentsByPatientService(patientId)
      ])
      setSessions(sessionData)
      setGoals(goalData)
      setTasks(taskData)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: CHILE_TIMEZONE
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-CL", {
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

  const getFileIcon = (filetype: string) => {
    if (filetype === "application/pdf") return "📄"
    if (filetype.includes("word")) return "📝"
    if (filetype.startsWith("image/")) return "🖼️"
    return "📎"
  }

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
      NO_SHOW: "No asistió"
    }

    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] || styles.SCHEDULED}`}>
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
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-indigo-600">Fono App</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hola, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1 mb-6">
          {[
            { key: "sessions", label: "Sesiones" },
            { key: "goals", label: "Objetivos" },
            { key: "tasks", label: "Tareas" },
            { key: "appointments", label: "Citas" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
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
          <p className="text-gray-400 text-sm text-center">Cargando...</p>
        ) : (
          <>
            {activeTab === "sessions" && (
              <div className="flex flex-col gap-3">
                {sessions.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-400">No hay sesiones registradas todavía.</p>
                  </div>
                ) : sessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-lg shadow-sm p-5">
                    <p className="text-xs text-gray-400 mb-2">{formatDate(session.date)}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{session.whatWasDone}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "goals" && (
              <div className="flex flex-col gap-4">
                {goals.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-400">No hay objetivos registrados todavía.</p>
                  </div>
                ) : goals.map((goal) => (
                  <div key={goal.id} className="bg-white rounded-lg shadow-sm p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 mb-1">{goal.description}</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(goal.startDate)} → {formatDate(goal.endDate)}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ml-4 ${
                        goal.completed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {goal.completed ? "Completado" : "En progreso"}
                      </span>
                    </div>
                    {goal.operationalGoals.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {goal.operationalGoals.map((op) => (
                          <div key={op.id} className="flex items-center gap-3 p-2 rounded-md bg-gray-50">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                              op.completed ? "bg-green-500" : "bg-gray-300"
                            }`} />
                            <span className={`text-sm flex-1 ${
                              op.completed ? "line-through text-gray-400" : "text-gray-700"
                            }`}>
                              {op.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="flex flex-col gap-3">
                {tasks.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-400">No hay tareas asignadas todavía.</p>
                  </div>
                ) : tasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-lg shadow-sm p-5">
                    <p className="text-sm font-medium text-gray-800 mb-1">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-500 leading-relaxed">{task.description}</p>
                    )}
                    {task.files && task.files.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1">
                        {task.files.map((file) => (
                          <a
                            key={file.id}
                            href={"http://localhost:3000" + file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            <span>{getFileIcon(file.filetype)}</span>
                            <span>{file.filename}</span>
                            <span className="text-gray-400">— Descargar</span>
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Asignada el {formatDate(task.assignedAt)}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "appointments" && (
              <div className="flex flex-col gap-3">
                <section className="flex flex-col gap-3">
                  <div className="px-1">
                    <h2 className="text-sm font-semibold text-gray-800">Próximas citas</h2>
                  </div>
                  {upcomingAppointments.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                      <p className="text-gray-400">No tienes próximas citas registradas.</p>
                    </div>
                  ) : upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="bg-white rounded-lg shadow-sm p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-sm font-medium text-gray-800">Próxima cita</p>
                        {getAppointmentStatusBadge(appointment.status)}
                      </div>
                      <p className="text-sm text-gray-700">{formatDateTime(appointment.datetime)}</p>
                      {appointment.notes && (
                        <p className="text-sm text-gray-500 mt-2">{appointment.notes}</p>
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

                <section className="flex flex-col gap-3 mt-4">
                  <div className="px-1">
                    <h2 className="text-sm font-semibold text-gray-800">Citas anteriores</h2>
                  </div>
                  {pastAppointments.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                      <p className="text-gray-400">No tienes citas anteriores registradas.</p>
                    </div>
                  ) : pastAppointments.map((appointment) => (
                    <div key={appointment.id} className="bg-white rounded-lg shadow-sm p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-sm font-medium text-gray-800">Cita anterior</p>
                        {getAppointmentStatusBadge(appointment.status)}
                      </div>
                      <p className="text-sm text-gray-700">{formatDateTime(appointment.datetime)}</p>
                      {appointment.notes && (
                        <p className="text-sm text-gray-500 mt-2">{appointment.notes}</p>
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
