import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import type { Goal, CreateGoalInput, CreateOperationalGoalInput, OperationalGoal } from "../types/goal.types"
import { updatePatientService } from "../services/patient.service"
import {
  getGoalsService,
  createGoalService,
  createOperationalGoalService,
  updateOperationalGoalService,
  updateGoalDescriptionService,
  deleteOperationalGoalService,
  deleteGoalService
} from "../services/goal.service"

interface Props {
  patientId: string
  currentGeneralObjective?: string
  onGeneralObjectiveSaved: (generalObjective: string) => void
  onGoalsUpdated?: () => void
}

const STATUS_OPTIONS = [
  { value: "no_cumplido", label: "No cumplido", color: "text-slate-400" },
  { value: "cumplido", label: "Cumplido", color: "text-emerald-600" },
  { value: "cumplido_con_ayuda", label: "Con ayuda", color: "text-sky-600" },
  { value: "cumplido_con_dificultad", label: "Con dificultad", color: "text-amber-600" }
]

const getGoalProgressState = (completedOperationalGoals: number, totalOperationalGoals: number) => {
  if (totalOperationalGoals === 0 || completedOperationalGoals === 0) {
    return {
      label: "No cumplido",
      styles: "bg-slate-100 text-slate-600"
    }
  }

  if (completedOperationalGoals === totalOperationalGoals) {
    return {
      label: "Cumplido",
      styles: "bg-emerald-100 text-emerald-700"
    }
  }

  return {
    label: "En progreso",
    styles: "bg-amber-100 text-amber-700"
  }
}

function GoalsSection({ patientId, currentGeneralObjective, onGeneralObjectiveSaved, onGoalsUpdated }: Props) {
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
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState("")
  const [editStartDate, setEditStartDate] = useState("")
  const [editEndDate, setEditEndDate] = useState("")
  const [editingOpId, setEditingOpId] = useState<string | null>(null)
  const [editOpDescription, setEditOpDescription] = useState("")
  const [generalObjectiveDraft, setGeneralObjectiveDraft] = useState(currentGeneralObjective || "")
  const [editingGeneralObjective, setEditingGeneralObjective] = useState(false)
  const [savingGeneralObjective, setSavingGeneralObjective] = useState(false)

  useEffect(() => {
    fetchGoals()
  }, [patientId])

  useEffect(() => {
    setGeneralObjectiveDraft(currentGeneralObjective || "")
  }, [currentGeneralObjective])

  const orderedGoals = useMemo(
    () => [...goals].sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime()),
    [goals]
  )

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

  const resetGoalForm = () => {
    setDescription("")
    setStartDate("")
    setEndDate("")
    setShowGoalForm(false)
  }

  const handleCreateGoal = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      const input: CreateGoalInput = { description, startDate, endDate }
      const newGoal = await createGoalService(patientId, input)
      setGoals((current) => [...current, newGoal])
      onGoalsUpdated?.()
      resetGoalForm()
    } catch (err) {
      setError("Error al crear el objetivo específico")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveGeneralObjective = async () => {
    setSavingGeneralObjective(true)
    setError("")

    try {
      const updatedPatient = await updatePatientService(patientId, {
        generalObjective: generalObjectiveDraft.trim()
      })
      onGeneralObjectiveSaved(updatedPatient.generalObjective || "")
      setEditingGeneralObjective(false)
    } catch (err) {
      setError("Error al guardar el objetivo general")
    } finally {
      setSavingGeneralObjective(false)
    }
  }

  const handleUpdateGoal = async (goalId: string) => {
    try {
      const updated = await updateGoalDescriptionService(patientId, goalId, {
        description: editDescription,
        startDate: editStartDate,
        endDate: editEndDate
      })
      setGoals((current) => current.map((goal) => (
        goal.id === goalId
          ? { ...goal, ...updated }
          : goal
      )))
      onGoalsUpdated?.()
      setEditingGoalId(null)
    } catch (err) {
      setError("Error al actualizar el objetivo específico")
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm("Esta accion eliminara el objetivo específico y todos sus objetivos operacionales. Continuar?")) {
      return
    }

    try {
      await deleteGoalService(patientId, goalId)
      setGoals((current) => current.filter((goal) => goal.id !== goalId))
      onGoalsUpdated?.()
    } catch (err) {
      setError("Error al eliminar el objetivo específico")
    }
  }

  const handleCreateOperationalGoal = async (goalId: string) => {
    if (!opDescription.trim()) return

    try {
      const goalIndex = goals.findIndex((goal) => goal.id === goalId)
      const order = goals[goalIndex].operationalGoals.length + 1
      const input: CreateOperationalGoalInput = { description: opDescription, order }
      const newOperationalGoal = await createOperationalGoalService(patientId, goalId, input)

      setGoals((current) => current.map((goal) => (
        goal.id === goalId
          ? {
            ...goal,
            operationalGoals: [...goal.operationalGoals, newOperationalGoal as OperationalGoal]
          }
          : goal
      )))
      onGoalsUpdated?.()
      setOpDescription("")
      setActiveGoalId(null)
    } catch (err) {
      setError("Error al crear el objetivo operacional")
    }
  }

  const handleUpdateOpDescription = async (goalId: string, operationalId: string) => {
    if (!editOpDescription.trim()) return

    try {
      const currentOperationalGoal = goals
        .find((goal) => goal.id === goalId)
        ?.operationalGoals.find((operationalGoal) => operationalGoal.id === operationalId)

      const updated = await updateOperationalGoalService(patientId, operationalId, {
        description: editOpDescription.trim(),
        completed: currentOperationalGoal?.completed,
        status: currentOperationalGoal?.status,
        notes: currentOperationalGoal?.notes
      })
      setGoals((current) => current.map((goal) => (
        goal.id !== goalId
          ? goal
          : {
            ...goal,
            operationalGoals: goal.operationalGoals.map((operationalGoal) => (
              operationalGoal.id === operationalId
                ? {
                  ...operationalGoal,
                  ...updated,
                  description: editOpDescription
                }
                : operationalGoal
            ))
          }
      )))
      onGoalsUpdated?.()
      setEditingOpId(null)
    } catch (err) {
      setError("Error al actualizar el objetivo operacional")
    }
  }

  const handleDeleteOperationalGoal = async (goalId: string, operationalId: string) => {
    if (!window.confirm("Esta accion eliminara el objetivo operacional. Continuar?")) return

    try {
      await deleteOperationalGoalService(patientId, operationalId)
      setGoals((current) => current.map((goal) => (
        goal.id !== goalId
          ? goal
          : {
            ...goal,
            operationalGoals: goal.operationalGoals.filter((operationalGoal) => operationalGoal.id !== operationalId)
          }
      )))
      onGoalsUpdated?.()
    } catch (err) {
      setError("Error al eliminar el objetivo operacional")
    }
  }

  const handleStatusChange = async (goalId: string, operationalId: string, newStatus: string) => {
    try {
      const isCompleted = newStatus !== "no_cumplido"
      await updateOperationalGoalService(patientId, operationalId, {
        completed: isCompleted,
        status: newStatus
      })

      setGoals((current) => current.map((goal) => {
        if (goal.id !== goalId) return goal

        const updatedOperationalGoals = goal.operationalGoals.map((operationalGoal) => (
          operationalGoal.id === operationalId
            ? { ...operationalGoal, status: newStatus, completed: isCompleted }
            : operationalGoal
        ))

        return {
          ...goal,
          completed: updatedOperationalGoals.length > 0 && updatedOperationalGoals.every((operationalGoal) => operationalGoal.completed),
          operationalGoals: updatedOperationalGoals
        }
      }))
    } catch (err) {
      setError("Error al actualizar el estado del objetivo operacional")
    }
  }

  const handleSaveNote = async (goalId: string, operationalId: string, currentStatus: string) => {
    try {
      await updateOperationalGoalService(
        patientId,
        operationalId,
        {
          completed: currentStatus !== "no_cumplido",
          status: currentStatus,
          notes: noteText
        }
      )

      setGoals((current) => current.map((goal) => (
        goal.id !== goalId
          ? goal
          : {
            ...goal,
            operationalGoals: goal.operationalGoals.map((operationalGoal) => (
              operationalGoal.id === operationalId
                ? { ...operationalGoal, notes: noteText }
                : operationalGoal
            ))
          }
      )))
      setActiveNoteId(null)
      setNoteText("")
    } catch (err) {
      setError("Error al guardar la nota del objetivo operacional")
    }
  }

  const formatDate = (dateString: string) => (
    new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  )

  const getStatusColor = (status: string) => (
    STATUS_OPTIONS.find((option) => option.value === status)?.color || "text-slate-400"
  )

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando objetivos...</p>
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-400">Plan terapéutico</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">Objetivos</h3>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                Este bloque queda debajo del acceso al portal y organiza el objetivo general vigente con sus
                objetivos específicos y operacionales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGoalForm((current) => !current)}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {showGoalForm ? "Cancelar" : "+ Nuevo O.E."}
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200">
            <div className="grid grid-cols-1 gap-0 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 md:border-b-0 md:border-r">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Objetivo general</p>
              </div>
              <div className="px-4 py-4">
                {editingGeneralObjective ? (
                  <div className="space-y-3">
                    <textarea
                      value={generalObjectiveDraft}
                      onChange={(event) => setGeneralObjectiveDraft(event.target.value)}
                      className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="Describe el objetivo general del proceso terapéutico."
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleSaveGeneralObjective}
                        disabled={savingGeneralObjective}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {savingGeneralObjective ? "Guardando..." : "Guardar objetivo general"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGeneralObjective(false)
                          setGeneralObjectiveDraft(currentGeneralObjective || "")
                        }}
                        className="px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <p className="text-sm leading-relaxed text-slate-700">
                      {currentGeneralObjective?.trim() || "Aún no hay objetivo general registrado. Comienza cargándolo aquí."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingGeneralObjective(true)}
                      className="shrink-0 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                    >
                      {currentGeneralObjective?.trim() ? "Editar O.G." : "Cargar O.G."}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showGoalForm && (
            <form onSubmit={handleCreateGoal} className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">Nuevo objetivo específico</p>
                <h4 className="mt-1 text-base font-semibold text-slate-800">Agregar O.E. con sus fechas</h4>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-indigo-100 bg-white px-3 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Describe el objetivo específico."
                  required
                />
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-fit rounded-xl border border-indigo-100 bg-white px-3 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  required
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-fit rounded-xl border border-indigo-100 bg-white px-3 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  required
                />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetGoalForm}
                  className="px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar O.E."}
                </button>
              </div>
            </form>
          )}

          {orderedGoals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm text-slate-500">Todavía no hay objetivos específicos registrados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orderedGoals.map((goal, goalIndex) => {
                const completedOperationalGoals = goal.operationalGoals.filter((operationalGoal) => operationalGoal.completed).length
                const goalProgressState = getGoalProgressState(completedOperationalGoals, goal.operationalGoals.length)

                return (
                <article key={goal.id} className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
                      {editingGoalId === goal.id ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              O.E.{goalIndex + 1}
                            </p>
                          </div>
                          <textarea
                            value={editDescription}
                            onChange={(event) => setEditDescription(event.target.value)}
                            className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          />
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <input
                              type="date"
                              value={editStartDate}
                              onChange={(event) => setEditStartDate(event.target.value)}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                            <input
                              type="date"
                              value={editEndDate}
                              onChange={(event) => setEditEndDate(event.target.value)}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => setEditingGoalId(null)}
                              className="px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateGoal(goal.id)}
                              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                            >
                              Guardar O.E.
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                O.E.{goalIndex + 1}
                              </p>
                              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-800">
                                {goal.description}
                              </p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${goalProgressState.styles}`}>
                              {goalProgressState.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Vigencia: {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGoalId(goal.id)
                                setEditDescription(goal.description)
                                setEditStartDate(goal.startDate.split("T")[0])
                                setEditEndDate(goal.endDate.split("T")[0])
                              }}
                              className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                            >
                              Editar O.E.
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="text-xs font-semibold text-rose-500 transition hover:text-rose-700"
                            >
                              Eliminar O.E.
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Objetivos operacionales</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Cada O.O. queda disponible para usarlo luego en la planificación de sesiones.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveGoalId(goal.id)
                            setEditingOpId(null)
                          }}
                          className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                        >
                          + Agregar O.O.
                        </button>
                      </div>

                      {activeGoalId === goal.id && (
                        <div className="mb-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row">
                            <input
                              type="text"
                              value={opDescription}
                              onChange={(event) => setOpDescription(event.target.value)}
                              className="w-full rounded-xl border border-indigo-100 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                              placeholder="Describe el objetivo operacional."
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault()
                                  handleCreateOperationalGoal(goal.id)
                                }
                              }}
                            />
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                type="button"
                                onClick={() => handleCreateOperationalGoal(goal.id)}
                                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                              >
                                Guardar O.O.
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveGoalId(null)
                                  setOpDescription("")
                                }}
                                className="px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {goal.operationalGoals.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                          <p className="text-sm text-slate-500">Este objetivo específico aún no tiene O.O. asociados.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {goal.operationalGoals.map((operationalGoal, operationalIndex) => (
                            <div key={operationalGoal.id} className="rounded-2xl border border-slate-200">
                              <div className="grid grid-cols-1 gap-0 md:grid-cols-[140px_minmax(0,1fr)]">
                                <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 md:border-b-0 md:border-r">
                                  <p className="text-sm font-semibold text-slate-700">
                                    O.O.{goalIndex + 1}.{operationalIndex + 1}
                                  </p>
                                </div>
                                <div className="space-y-3 px-4 py-4">
                                  {editingOpId === operationalGoal.id ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={editOpDescription}
                                        onChange={(event) => setEditOpDescription(event.target.value)}
                                        rows={4}
                                        className="min-h-28 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-relaxed focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                      />
                                      <div className="flex flex-col gap-2 sm:flex-row">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateOpDescription(goal.id, operationalGoal.id)}
                                          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                        >
                                          Guardar O.O.
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingOpId(null)}
                                          className="px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                      <div className="min-w-0 flex-1">
                                        <p className={`text-sm leading-relaxed ${
                                          operationalGoal.status !== "no_cumplido"
                                            ? "text-slate-400 line-through"
                                            : "text-slate-700"
                                        }`}>
                                          {operationalGoal.description}
                                        </p>
                                        {operationalGoal.notes && activeNoteId !== operationalGoal.id && (
                                          <p className="mt-2 text-xs italic text-slate-500">
                                            "{operationalGoal.notes}"
                                          </p>
                                        )}
                                      </div>

                                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
                                        <select
                                          value={operationalGoal.status}
                                          onChange={(event) => handleStatusChange(goal.id, operationalGoal.id, event.target.value)}
                                          className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${getStatusColor(operationalGoal.status)}`}
                                        >
                                          {STATUS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveNoteId(activeNoteId === operationalGoal.id ? null : operationalGoal.id)
                                            setNoteText(operationalGoal.notes || "")
                                          }}
                                          className="text-xs font-semibold text-slate-500 transition hover:text-indigo-600"
                                        >
                                          {operationalGoal.notes ? "Ver nota" : "+ Nota"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingOpId(operationalGoal.id)
                                            setEditOpDescription(operationalGoal.description)
                                          }}
                                          className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                                        >
                                          Editar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteOperationalGoal(goal.id, operationalGoal.id)}
                                          className="text-xs font-semibold text-rose-500 transition hover:text-rose-700"
                                        >
                                          Eliminar
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {activeNoteId === operationalGoal.id && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                      <textarea
                                        value={noteText}
                                        onChange={(event) => setNoteText(event.target.value)}
                                        className="min-h-20 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="Observación clínica o contexto del avance."
                                      />
                                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                        <button
                                          type="button"
                                          onClick={() => handleSaveNote(goal.id, operationalGoal.id, operationalGoal.status)}
                                          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                        >
                                          Guardar nota
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveNoteId(null)
                                            setNoteText("")
                                          }}
                                          className="px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )})}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default GoalsSection
