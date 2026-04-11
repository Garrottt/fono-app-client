import { useState, useEffect } from "react"
import type { Task, CreateTaskInput } from "../types/task.types"
import {
  getTasksService,
  createTaskService,
  updateTaskService,
  deleteTaskService
} from "../services/task.service"

interface Props {
  patientId: string
}

function TasksSection({ patientId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Estados para editar
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editFile, setEditFile] = useState<File | null>(null)

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
      const newTask = await createTaskService(patientId, input, selectedFile ?? undefined)
      setTasks([newTask, ...tasks])
      setShowForm(false)
      setTitle("")
      setDescription("")
      setSelectedFile(null)
    } catch (err) {
      setError("Error al crear la tarea")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (taskId: string) => {
    if (!editTitle.trim()) return
    try {
      const updated = await updateTaskService(
        patientId,
        taskId,
        editTitle,
        editDescription,
        editFile ?? undefined
      )
      setTasks(tasks.map(t => t.id === taskId ? updated : t))
      setEditingTaskId(null)
      setEditFile(null)
    } catch (err) {
      setError("Error al actualizar la tarea")
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

  const getFileIcon = (filetype: string) => {
    if (filetype === "application/pdf") return "📄"
    if (filetype.includes("word")) return "📝"
    if (filetype.startsWith("image/")) return "🖼️"
    return "📎"
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Adjuntar archivo <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {selectedFile && (
              <p className="text-xs text-gray-400">Archivo: {selectedFile.name}</p>
            )}
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
              {editingTaskId === task.id ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Título</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Descripción</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Cambiar archivo <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
                      className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {editFile && (
                      <p className="text-xs text-gray-400">Nuevo archivo: {editFile.name}</p>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setEditingTaskId(null); setEditFile(null) }}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleUpdate(task.id)}
                      className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
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
                  <div className="flex gap-3 ml-4">
                    <button
                      onClick={() => {
                        setEditingTaskId(task.id)
                        setEditTitle(task.title)
                        setEditDescription(task.description || "")
                        setEditFile(null)
                      }}
                      className="text-indigo-500 hover:text-indigo-700 text-xs font-medium transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
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

export default TasksSection