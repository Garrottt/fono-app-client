import { useState, useEffect } from "react"
import type { Task, CreateTaskInput } from "../types/task.types"
import { getTasksService, createTaskService, deleteTaskService } from "../services/task.service"

interface Props {
  patientId: string
}

function TasksSection({ patientId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchTasks()
  }, [patientId])

  const fetchTasks = async () => {
    try {
      const data = await getTasksService(patientId)
      setTasks(data)
    } catch (err) {
      setError("Error al cargar las tareas")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const input: CreateTaskInput = { title, description }
      const newTask = await createTaskService(patientId, input)
      setTasks([newTask, ...tasks])
      setShowForm(false)
      setTitle("")
      setDescription("")
    } catch (err) {
      setError("Error al crear la tarea")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return

    try {
      await deleteTaskService(patientId, taskId)
      setTasks(tasks.filter(t => t.id !== taskId))
    } catch (err) {
      setError("Error al eliminar la tarea")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (loading) return <p className="text-gray-400 text-sm">Cargando tareas...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">Tareas</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {showForm ? "Cancelar" : "+ Nueva tarea"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col gap-4"
        >
          <h4 className="text-base font-medium text-gray-700">Nueva tarea</h4>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Practicar el fonema /r/ 10 minutos diarios"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              placeholder="Instrucciones detalladas para la familia..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar tarea"}
            </button>
          </div>
        </form>
      )}

      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-400">No hay tareas asignadas todavía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 mb-1">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-gray-500 leading-relaxed">{task.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Asignada el {formatDate(task.assignedAt)}</p>
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors ml-4"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TasksSection