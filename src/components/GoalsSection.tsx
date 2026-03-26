import { useState, useEffect } from "react"
import type { Goal, CreateGoalInput, CreateOperationalGoalInput, OperationalGoal } from "../types/goal.types"
import {
  getGoalsService,
  createGoalService,
  createOperationalGoalService,
  updateOperationalGoalService
} from "../services/goal.service"

interface Props {
  patientId: string
}

const STATUS_OPTIONS = [
  { value: "no_cumplido", label: "No cumplido", color: "text-gray-400" },
  { value: "cumplido", label: "Cumplido", color: "text-green-600" },
  { value: "cumplido_con_ayuda", label: "Cumplido con ayuda", color: "text-blue-600" },
  { value: "cumplido_con_dificultad", label: "Cumplido con dificultad", color: "text-yellow-600" },
]

function GoalsSection({ patientId }: Props) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null)
  const [opDescription, setOpDescription] = useState("")

  // Estado para el panel de notas de cada paso
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")

  useEffect(() => {
    fetchGoals()
  }, [patientId])

  const fetchGoals = async () => {
    try {
      const data = await getGoalsService(patientId)
      setGoals(data)
    } catch (err) {
      setError("Error al cargar los objetivos")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const input: CreateGoalInput = { description, startDate, endDate }
      const newGoal = await createGoalService(patientId, input)
      setGoals([...goals, newGoal])
      setShowGoalForm(false)
      setDescription("")
      setStartDate("")
      setEndDate("")
    } catch (err) {
      setError("Error al crear el objetivo")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateOperationalGoal = async (goalId: string) => {
    if (!opDescription.trim()) return
    try {
      const goalIndex = goals.findIndex(g => g.id === goalId)
      const order = goals[goalIndex].operationalGoals.length + 1
      const input: CreateOperationalGoalInput = { description: opDescription, order }
      const newOp = await createOperationalGoalService(patientId, goalId, input)
      setGoals(goals.map(g =>
        g.id === goalId
          ? { ...g, operationalGoals: [...g.operationalGoals, newOp as OperationalGoal] }
          : g
      ))
      setOpDescription("")
      setActiveGoalId(null)
    } catch (err) {
      setError("Error al crear el paso")
    }
  }

  const handleStatusChange = async (
    goalId: string,
    operationalId: string,
    newStatus: string
  ) => {
    try {
      const isCompleted = newStatus !== "no_cumplido"
      await updateOperationalGoalService(patientId, operationalId, isCompleted, newStatus)

      const updatedGoals = goals.map(g => {
        if (g.id !== goalId) return g
        const updatedOps = g.operationalGoals.map(op =>
          op.id === operationalId
            ? { ...op, status: newStatus, completed: isCompleted }
            : op
        )
        const allCompleted = updatedOps.length > 0 && updatedOps.every(op => op.completed)
        return { ...g, operationalGoals: updatedOps, completed: allCompleted }
      })

      setGoals(updatedGoals)
    } catch (err) {
      setError("Error al actualizar el paso")
    }
  }

  const handleSaveNote = async (goalId: string, operationalId: string, currentStatus: string) => {
    try {
      await updateOperationalGoalService(patientId, operationalId, currentStatus !== "no_cumplido", currentStatus, noteText)
      setGoals(goals.map(g =>
        g.id !== goalId ? g : {
          ...g,
          operationalGoals: g.operationalGoals.map(op =>
            op.id === operationalId ? { ...op, notes: noteText } : op
          )
        }
      ))
      setActiveNoteId(null)
      setNoteText("")
    } catch (err) {
      setError("Error al guardar la observación")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric", month: "long", day: "numeric"
    })
  }

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || "text-gray-400"
  }

  

  if (loading) return <p className="text-gray-400 text-sm">Cargando objetivos...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">Objetivos</h3>
        <button
          onClick={() => setShowGoalForm(!showGoalForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {showGoalForm ? "Cancelar" : "+ Nuevo objetivo"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {showGoalForm && (
        <form onSubmit={handleCreateGoal} className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col gap-4">
          <h4 className="text-base font-medium text-gray-700">Nuevo objetivo</h4>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descripción <span className="text-red-500">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              placeholder="Ej: La paciente producirá el fonema /r/ en oraciones de mediana complejidad"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Fecha inicio <span className="text-red-500">*</span></label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Fecha fin <span className="text-red-500">*</span></label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar objetivo"}
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-400">No hay objetivos registrados todavía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {goals.map(goal => (
            <div key={goal.id} className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 mb-1">{goal.description}</p>
                  <p className="text-xs text-gray-400">{formatDate(goal.startDate)} → {formatDate(goal.endDate)}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ml-4 ${goal.completed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {goal.completed ? "Completado" : "En progreso"}
                </span>
              </div>

              {goal.operationalGoals.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {goal.operationalGoals.map(op => (
                    <div key={op.id} className="border border-gray-100 rounded-md p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-sm flex-1 ${op.status !== "no_cumplido" ? "line-through text-gray-400" : "text-gray-700"}`}>
                          {op.description}
                        </span>
                        <select
                          value={op.status}
                          onChange={(e) => handleStatusChange(goal.id, op.id, e.target.value)}
                          className={`text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${getStatusColor(op.status)}`}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            setActiveNoteId(activeNoteId === op.id ? null : op.id)
                            setNoteText(op.notes || "")
                          }}
                          className="text-xs text-gray-400 hover:text-indigo-600 transition-colors whitespace-nowrap"
                        >
                          {op.notes ? "Ver nota" : "+ Nota"}
                        </button>
                      </div>

                      {op.notes && activeNoteId !== op.id && (
                        <p className="text-xs text-gray-500 mt-2 italic">"{op.notes}"</p>
                      )}

                      {activeNoteId === op.id && (
                        <div className="mt-2 flex gap-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            rows={2}
                            placeholder="Ej: Cumplió pero llegó con sueño..."
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleSaveNote(goal.id, op.id, op.status)}
                              className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-indigo-700 transition-colors"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => { setActiveNoteId(null); setNoteText("") }}
                              className="text-gray-400 hover:text-gray-600 text-xs px-3 py-1.5"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeGoalId === goal.id ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={opDescription}
                    onChange={(e) => setOpDescription(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Descripción del paso..."
                    onKeyDown={(e) => e.key === "Enter" && handleCreateOperationalGoal(goal.id)}
                  />
                  <button onClick={() => handleCreateOperationalGoal(goal.id)}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-indigo-700 transition-colors">
                    Agregar
                  </button>
                  <button onClick={() => { setActiveGoalId(null); setOpDescription("") }}
                    className="text-gray-400 hover:text-gray-600 text-sm px-2">
                    Cancelar
                  </button>
                </div>
              ) : (
                <button onClick={() => setActiveGoalId(goal.id)}
                  className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors mt-1">
                  + Agregar paso
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GoalsSection