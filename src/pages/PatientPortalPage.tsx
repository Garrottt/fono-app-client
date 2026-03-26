import { useState, useEffect } from "react"
import { useAuth } from "../context/authContext"
import { useNavigate } from "react-router-dom"
import { getSessionsService } from "../services/session.service"
import { getGoalsService } from "../services/goal.service"
import { getTasksService } from "../services/task.service"
import type { Session } from "../types/session.types"
import type { Goal } from "../types/goal.types"
import type { Task } from "../types/task.types"

function PatientPortalPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState<Session[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"sessions" | "goals" | "tasks">("sessions")

  useEffect(() => {
    if (user?.id) fetchData(user.id)
  }, [user])

  const fetchData = async (patientId: string) => {
    try {
      const [sessionData, goalData, taskData] = await Promise.all([
        getSessionsService(patientId),
        getGoalsService(patientId),
        getTasksService(patientId)
      ])
      setSessions(sessionData)
      setGoals(goalData)
      setTasks(taskData)
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
      day: "numeric"
    })
  }

  const getFileIcon = (filetype: string) => {
    if (filetype === "application/pdf") return "📄"
    if (filetype.includes("word")) return "📝"
    if (filetype.startsWith("image/")) return "🖼️"
    return "📎"
  }

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

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1 mb-6">
          {[
            { key: "sessions", label: "Sesiones" },
            { key: "goals", label: "Objetivos" },
            { key: "tasks", label: "Tareas" }
          ].map(tab => (
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
            {/* Sesiones */}
            {activeTab === "sessions" && (
              <div className="flex flex-col gap-3">
                {sessions.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-400">No hay sesiones registradas todavía.</p>
                  </div>
                ) : sessions.map(session => (
                  <div key={session.id} className="bg-white rounded-lg shadow-sm p-5">
                    <p className="text-xs text-gray-400 mb-2">{formatDate(session.date)}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{session.whatWasDone}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Objetivos */}
            {activeTab === "goals" && (
              <div className="flex flex-col gap-4">
                {goals.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-400">No hay objetivos registrados todavía.</p>
                  </div>
                ) : goals.map(goal => (
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
                        {goal.operationalGoals.map(op => (
                          <div key={op.id} className="flex items-center gap-3 p-2 rounded-md bg-gray-50">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                              op.status === "cumplido" ? "bg-green-500" :
                              op.status === "cumplido_con_ayuda" ? "bg-blue-500" :
                              op.status === "cumplido_con_dificultad" ? "bg-yellow-500" :
                              "bg-gray-300"
                            }`} />
                            <span className={`text-sm flex-1 ${
                              op.status !== "no_cumplido" ? "line-through text-gray-400" : "text-gray-700"
                            }`}>
                              {op.description}
                            </span>
                            {op.notes && (
                              <span className="text-xs text-gray-400 italic">"{op.notes}"</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tareas */}
            {activeTab === "tasks" && (
              <div className="flex flex-col gap-3">
                {tasks.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-400">No hay tareas asignadas todavía.</p>
                  </div>
                ) : tasks.map(task => (
                  <div key={task.id} className="bg-white rounded-lg shadow-sm p-5">
                    <p className="text-sm font-medium text-gray-800 mb-1">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-500 leading-relaxed">{task.description}</p>
                    )}
                    {task.files && task.files.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1">
                        {task.files.map(file => (
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
          </>
        )}
      </main>
    </div>
  )
}

export default PatientPortalPage