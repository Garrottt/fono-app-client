import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import {
  createSessionService,
  deleteSessionTaskFileService,
  deleteSessionService,
  uploadSessionTaskFileService,
  updateSessionService
} from "../services/session.service"
import { API_URL } from "../services/api"
import { getGoalsService } from "../services/goal.service"
import type { Goal } from "../types/goal.types"
import type {
  CreateSessionInput,
  Session,
  SessionTask
} from "../types/session.types"

interface SessionsSectionProps {
  patientId: string
  generalObjective: string
  contentHierarchy: string[]
  hierarchyCriteria: string
  focus: string
  modality: string
  strategies: string
  goalsRefreshToken?: number
  sessions: Session[]
  onSessionsChange: (sessions: Session[]) => void
  onError: (message: string) => void
}

interface SessionFormState extends CreateSessionInput {}

type SessionFormUpdater = (updater: (current: SessionFormState) => SessionFormState) => void

interface SpecificObjectiveLibraryItem {
  id: string
  description: string
  operationalObjectives: Array<{
    id: string
    description: string
  }>
}

const getRequestErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: { data?: unknown } }).response !== null
  ) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response
    if (typeof response?.data?.message === "string" && response.data.message.trim()) {
      return response.data.message
    }
  }

  return fallbackMessage
}

const createOperationalObjective = (description = "") => ({
  description,
  activities: [],
  order: 1
})

const createSpecificObjective = (description = "", operationalDescriptions: string[] = [""]) => ({
  description,
  order: 1,
  operationalObjectives: operationalDescriptions.map((item, index) => ({
    ...createOperationalObjective(item),
    order: index + 1
  }))
})

const createTask = (title = "", description = "") => ({
  title,
  description,
  order: 1
})

const createEmptySessionForm = (): SessionFormState => ({
  date: "",
  whatWasDone: "",
  contentHierarchy: [""],
  hierarchyCriteria: "",
  focus: "",
  modality: "",
  strategies: "",
  generalObjective: "",
  specificObjectives: [],
  sessionTasks: []
})

const hasRequiredPlanningData = ({
  generalObjective,
  contentHierarchy,
  hierarchyCriteria,
  focus,
  modality
}: Pick<
  SessionsSectionProps,
  "generalObjective" | "contentHierarchy" | "hierarchyCriteria" | "focus" | "modality" | "strategies"
>) => (
  Boolean(generalObjective.trim()) &&
  contentHierarchy.some((item) => item.trim()) &&
  Boolean(hierarchyCriteria.trim()) &&
  Boolean(focus.trim()) &&
  Boolean(modality.trim())
)

const mapSessionToForm = (session: Session): SessionFormState => ({
  date: session.date.split("T")[0],
  whatWasDone: session.whatWasDone,
  contentHierarchy: session.contentHierarchy.length > 0 ? [...session.contentHierarchy] : [""],
  hierarchyCriteria: session.hierarchyCriteria,
  focus: session.focus,
  modality: session.modality,
  strategies: session.strategies,
  generalObjective: session.generalObjective,
  specificObjectives: session.specificObjectives.length > 0
        ? session.specificObjectives.map((specificObjective, specificIndex) => ({
          id: specificObjective.id,
          description: specificObjective.description,
          order: specificIndex + 1,
          operationalObjectives: specificObjective.operationalObjectives.length > 0
            ? specificObjective.operationalObjectives.map((operationalObjective, operationalIndex) => ({
              id: operationalObjective.id,
              description: operationalObjective.description,
              activities: operationalObjective.activities ?? [],
              order: operationalIndex + 1
            }))
            : [createOperationalObjective()]
        }))
    : [],
  sessionTasks: session.sessionTasks.length > 0
    ? session.sessionTasks.map((sessionTask, taskIndex) => ({
      id: sessionTask.id,
      title: sessionTask.title,
      description: sessionTask.description || "",
      order: taskIndex + 1
    }))
    : []
})

const normalizeSessionForm = (form: SessionFormState): CreateSessionInput => ({
  date: form.date,
  whatWasDone: form.whatWasDone.trim(),
  contentHierarchy: form.contentHierarchy.map((item) => item.trim()),
  hierarchyCriteria: form.hierarchyCriteria.trim(),
  focus: form.focus.trim(),
  modality: form.modality.trim(),
  strategies: form.strategies.trim(),
  generalObjective: form.generalObjective.trim(),
  specificObjectives: form.specificObjectives.map((specificObjective, specificIndex) => ({
    ...specificObjective,
    description: specificObjective.description.trim(),
    order: specificIndex + 1,
    operationalObjectives: specificObjective.operationalObjectives.map((operationalObjective, operationalIndex) => ({
      ...operationalObjective,
      description: operationalObjective.description.trim(),
      activities: (operationalObjective.activities ?? []).map((activity) => activity.trim()),
      order: operationalIndex + 1
    }))
  })),
  sessionTasks: form.sessionTasks.map((sessionTask, taskIndex) => ({
    ...sessionTask,
    title: sessionTask.title.trim(),
    description: sessionTask.description?.trim(),
    order: taskIndex + 1
  }))
})

const getCompletionState = (session: Session) => {
  const hasPlanning =
    session.contentHierarchy.some((item) => item.trim()) &&
    session.hierarchyCriteria.trim() &&
    session.focus.trim() &&
    session.modality.trim() &&
    session.generalObjective.trim() &&
    session.specificObjectives.length > 0

  if (!hasPlanning) {
    return {
      label: "Incompleta",
      styles: "bg-amber-100 text-amber-700"
    }
  }

  return {
    label: "Planificada",
    styles: "bg-emerald-100 text-emerald-700"
  }
}

const getFileIcon = (filetype: string) => {
  if (filetype === "application/pdf") return "PDF"
  if (filetype.includes("word")) return "WORD"
  if (filetype.startsWith("image/")) return "IMG"
  return "ARCH"
}

interface TaskFilesListProps {
  files: SessionTask["files"]
  getFileIcon: (filetype: string) => string
  getFileUrl: (url: string) => string
  deletingKeyPrefix: string
  uploadingTaskKey: string | null
  onDelete: (fileId: string) => void
}

function TaskFilesList({
  files,
  getFileIcon,
  getFileUrl,
  deletingKeyPrefix,
  uploadingTaskKey,
  onDelete
}: TaskFilesListProps) {
  if (files.length === 0) {
    return <p className="mt-3 text-sm text-slate-500">Todavía no hay archivos para esta indicación.</p>
  }

  return (
    <div className="mt-3 space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <a
            href={getFileUrl(file.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-3 text-sm text-slate-700 hover:text-indigo-600"
          >
            <span className="rounded-md bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
              {getFileIcon(file.filetype)}
            </span>
            <span className="truncate">{file.filename}</span>
          </a>
          <button
            type="button"
            onClick={() => onDelete(file.id)}
            disabled={uploadingTaskKey === `${deletingKeyPrefix}:${file.id}`}
            className="text-xs font-medium text-rose-500 hover:text-rose-700 disabled:opacity-50"
          >
            {uploadingTaskKey === `${deletingKeyPrefix}:${file.id}` ? "Eliminando..." : "Eliminar archivo"}
          </button>
        </div>
      ))}
    </div>
  )
}

function SessionsSection({
  patientId,
  generalObjective,
  contentHierarchy,
  hierarchyCriteria,
  focus,
  modality,
  strategies,
  goalsRefreshToken = 0,
  sessions,
  onSessionsChange,
  onError
}: SessionsSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(sessions[0]?.id || null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingTaskKey, setUploadingTaskKey] = useState<string | null>(null)
  const [sessionMessage, setSessionMessage] = useState("")
  const [createForm, setCreateForm] = useState<SessionFormState>(createEmptySessionForm())
  const [editForm, setEditForm] = useState<SessionFormState | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [specificObjectiveSearch, setSpecificObjectiveSearch] = useState<Record<string, string>>({})

  useEffect(() => {
    let ignore = false

    const fetchGoals = async () => {
      try {
        const goalData = await getGoalsService(patientId)
        if (!ignore) {
          setGoals(goalData)
        }
      } catch (error) {
        if (!ignore) {
          setGoals([])
        }
      }
    }

    fetchGoals()

    return () => {
      ignore = true
    }
  }, [patientId, goalsRefreshToken])

  const orderedSessions = useMemo(
    () => [...sessions].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
    [sessions]
  )

  const specificObjectiveLibrary = useMemo<SpecificObjectiveLibraryItem[]>(
    () =>
      goals.map((goal) => ({
        id: goal.id,
        description: goal.description,
        operationalObjectives: goal.operationalGoals.map((operationalGoal) => ({
          id: operationalGoal.id,
          description: operationalGoal.description
        }))
      })),
    [goals]
  )

  const updateCreateForm: SessionFormUpdater = (updater) => {
    setCreateForm((current) => updater(current))
  }

  const updateEditForm: SessionFormUpdater = (updater) => {
    setEditForm((current) => current ? updater(current) : current)
  }

  const updateSpecificObjectiveSearch = (key: string, value: string) => {
    setSpecificObjectiveSearch((current) => ({
      ...current,
      [key]: value
    }))
  }

  const getSpecificObjectiveMatches = (query: string) => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return specificObjectiveLibrary

    const filteredLibrary = specificObjectiveLibrary.filter((item) => {
      return (
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.operationalObjectives.some((operationalObjective) =>
          operationalObjective.description.toLowerCase().includes(normalizedQuery)
        )
      )
    })

    return filteredLibrary
  }

  const toggleOperationalObjectiveFromLibrary = (
    setForm: SessionFormUpdater,
    libraryItem: SpecificObjectiveLibraryItem,
    operationalObjective: SpecificObjectiveLibraryItem["operationalObjectives"][number]
  ) => {
    setForm((current) => ({
      ...current,
      specificObjectives: (() => {
        const existingSpecificObjectiveIndex = current.specificObjectives.findIndex(
          (specificObjective) =>
            specificObjective.description.trim().toLowerCase() === libraryItem.description.trim().toLowerCase()
        )

        if (existingSpecificObjectiveIndex === -1) {
          return [
            ...current.specificObjectives.filter((specificObjective) =>
              specificObjective.description.trim() || specificObjective.operationalObjectives.some((item) => item.description.trim())
            ),
            {
              ...createSpecificObjective(libraryItem.description, [operationalObjective.description]),
              operationalObjectives: [{
                ...createOperationalObjective(operationalObjective.description),
                activities: [""],
                order: 1
              }]
            }
          ]
        }

        return current.specificObjectives.flatMap((specificObjective, specificIndex) => {
          if (specificIndex !== existingSpecificObjectiveIndex) return [specificObjective]

          const alreadySelected = specificObjective.operationalObjectives.some(
            (item) => item.description.trim().toLowerCase() === operationalObjective.description.trim().toLowerCase()
          )

          if (alreadySelected) {
            const remainingOperationalObjectives = specificObjective.operationalObjectives
              .filter(
                (item) => item.description.trim().toLowerCase() !== operationalObjective.description.trim().toLowerCase()
              )
              .map((item, index) => ({
                ...item,
                order: index + 1
              }))

            return remainingOperationalObjectives.length > 0
              ? [{
                ...specificObjective,
                operationalObjectives: remainingOperationalObjectives
              }]
              : []
          }

          return [{
            ...specificObjective,
            operationalObjectives: [
              ...specificObjective.operationalObjectives,
              {
                ...createOperationalObjective(operationalObjective.description),
                activities: [""],
                order: specificObjective.operationalObjectives.length + 1
              }
            ]
          }]
        })
      })()
    }))
  }

  const isOperationalObjectiveSelected = (
    form: SessionFormState,
    specificObjectiveDescription: string,
    operationalObjectiveDescription: string
  ) => (
    form.specificObjectives.some((specificObjective) =>
      specificObjective.description.trim().toLowerCase() === specificObjectiveDescription.trim().toLowerCase() &&
      specificObjective.operationalObjectives.some(
        (operationalObjective) =>
          operationalObjective.description.trim().toLowerCase() === operationalObjectiveDescription.trim().toLowerCase()
      )
    )
  )

  const resetCreateForm = () => {
    setCreateForm({
      ...createEmptySessionForm(),
      generalObjective: generalObjective.trim(),
      contentHierarchy: contentHierarchy.map((item) => item.trim()).filter(Boolean),
      hierarchyCriteria: hierarchyCriteria.trim(),
      focus: focus.trim(),
      modality: modality.trim(),
      strategies: strategies.trim()
    })
    setShowCreateForm(false)
    setSpecificObjectiveSearch({})
  }

  const handleCreateSession = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setSessionMessage("")
    onError("")

    try {
      const payload = normalizeSessionForm({
        ...createForm,
        generalObjective: generalObjective.trim(),
        contentHierarchy: contentHierarchy.map((item) => item.trim()).filter(Boolean),
        hierarchyCriteria: hierarchyCriteria.trim(),
        focus: focus.trim(),
        modality: modality.trim(),
        strategies: strategies.trim()
      })
      const createdSession = await createSessionService(patientId, payload)
      const nextSessions = [createdSession, ...sessions].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
      )

      onSessionsChange(nextSessions)
      setExpandedSessionId(createdSession.id)
      resetCreateForm()
      setSessionMessage("Sesión guardada correctamente.")
    } catch (error) {
      onError(getRequestErrorMessage(error, "Error al guardar la sesión. Revisa que la ficha clínica esté completa."))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSession = async (sessionId: string) => {
    if (!editForm) return

    setSaving(true)
    setSessionMessage("")
    onError("")

    try {
      const updatedSession = await updateSessionService(
        patientId,
        sessionId,
        normalizeSessionForm({
          ...editForm,
          generalObjective: generalObjective.trim(),
          contentHierarchy: contentHierarchy.map((item) => item.trim()).filter(Boolean),
          hierarchyCriteria: hierarchyCriteria.trim(),
          focus: focus.trim(),
          modality: modality.trim(),
          strategies: strategies.trim()
        })
      )
      onSessionsChange(
        sessions
          .map((session) => session.id === sessionId ? updatedSession : session)
          .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      )
      setEditingSessionId(null)
      setEditForm(null)
      setSessionMessage(`Sesión ${updatedSession.sessionNumber} actualizada.`)
    } catch (error) {
      onError(getRequestErrorMessage(error, "Error al actualizar la sesión."))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm("Esta accion eliminara la sesión y toda su planificación. Continuar?")) return

    setSaving(true)
    setSessionMessage("")
    onError("")

    try {
      await deleteSessionService(patientId, sessionId)
      const nextSessions = sessions.filter((session) => session.id !== sessionId)
      onSessionsChange(nextSessions)

      if (expandedSessionId === sessionId) {
        setExpandedSessionId(nextSessions[0]?.id || null)
      }

      if (editingSessionId === sessionId) {
        setEditingSessionId(null)
        setEditForm(null)
      }

      setSessionMessage("Sesión eliminada correctamente.")
    } catch (error) {
      onError("Error al eliminar la sesión.")
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => (
    new Date(dateString).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })
  )

  const getFileUrl = (url: string) => new URL(url, API_URL).toString()

  const handleUploadTaskFile = async (sessionId: string, taskId: string, file: File) => {
    const taskKey = `${sessionId}:${taskId}`
    setUploadingTaskKey(taskKey)
    setSessionMessage("")
    onError("")

    try {
      const createdFile = await uploadSessionTaskFileService(patientId, sessionId, taskId, file)
      onSessionsChange(
        sessions.map((session) =>
          session.id === sessionId
            ? {
              ...session,
              sessionTasks: session.sessionTasks.map((sessionTask) =>
                sessionTask.id === taskId
                  ? { ...sessionTask, files: [createdFile, ...(sessionTask.files ?? [])] }
                  : sessionTask
              )
            }
            : session
        )
      )
      setSessionMessage("Archivo adjuntado a la sesión.")
    } catch (error) {
      onError("Error al subir el archivo de la sesión.")
    } finally {
      setUploadingTaskKey(null)
    }
  }

  const handleDeleteTaskFile = async (sessionId: string, taskId: string, fileId: string) => {
    const taskKey = `${sessionId}:${taskId}:${fileId}`
    setUploadingTaskKey(taskKey)
    setSessionMessage("")
    onError("")

    try {
      await deleteSessionTaskFileService(patientId, sessionId, taskId, fileId)
      onSessionsChange(
        sessions.map((session) =>
          session.id === sessionId
            ? {
              ...session,
              sessionTasks: session.sessionTasks.map((sessionTask) =>
                sessionTask.id === taskId
                  ? {
                    ...sessionTask,
                    files: sessionTask.files.filter((file) => file.id !== fileId)
                  }
                  : sessionTask
              )
            }
            : session
        )
      )
      setSessionMessage("Archivo eliminado de la sesión.")
    } catch (error) {
      onError("Error al eliminar el archivo de la sesión.")
    } finally {
      setUploadingTaskKey(null)
    }
  }

const renderSessionForm = (
  form: SessionFormState,
  setForm: SessionFormUpdater,
  actionLabel: string,
  submitDisabled: boolean,
  submitMode: "submit" | "button",
  formKey: string,
  actionHandler?: () => void
) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Fecha de la sesión</label>
          <input
            type="date"
            value={form.date}
            onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            required
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Objetivo general vigente
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)]">
          <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            O.G.1
          </div>
          <div className="px-3 py-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-sm leading-relaxed text-slate-700">
                {generalObjective.trim() || "Debes registrar primero el objetivo general en el bloque de Objetivos."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Objetivos específicos y operacionales
          </h4>
        </div>
        <div className="space-y-4 p-4">
          {(() => {
            const searchKey = `${formKey}-global-specific-search`
            const searchQuery = specificObjectiveSearch[searchKey] || ""
            const specificObjectiveMatches = getSpecificObjectiveMatches(searchQuery)

            return (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/70 p-4">
                <div className="flex flex-col gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">
                      Buscar objetivo específico
                    </p>
                    <p className="text-sm text-slate-600">
                      Busca un O.E. existente y trae automáticamente sus objetivos operacionales asociados.
                    </p>
                  </div>
                  <div className="w-full xl:max-w-3xl">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => updateSpecificObjectiveSearch(searchKey, event.target.value)}
                      disabled={specificObjectiveLibrary.length === 0}
                      className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder="Buscar por texto del O.E. o de sus O.O."
                    />
                  </div>
                </div>

                {specificObjectiveLibrary.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Primero carga objetivos específicos y operacionales en el bloque de Objetivos.
                  </p>
                ) : false ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Escribe un objetivo específico o una palabra clave para comenzar la búsqueda.
                  </p>
                ) : specificObjectiveMatches.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    No encontramos coincidencias con esa búsqueda.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2">
                    {specificObjectiveMatches.map((libraryItem) => (
                      <div
                        key={`${searchKey}-${libraryItem.id}`}
                        className="rounded-xl border border-white bg-white px-3 py-3 shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700">{libraryItem.description}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {libraryItem.operationalObjectives.length} objetivo(s) operacional(es) disponibles
                          </p>
                        </div>
                        <div className="mt-3 grid gap-2">
                          {libraryItem.operationalObjectives.length === 0 ? (
                            <p className="text-xs text-slate-400">
                              Este O.E. aún no tiene O.O. cargados.
                            </p>
                          ) : libraryItem.operationalObjectives.map((operationalObjective, operationalIndex) => {
                            const selected = isOperationalObjectiveSelected(
                              form,
                              libraryItem.description,
                              operationalObjective.description
                            )

                            return (
                              <button
                                key={`${libraryItem.id}-${operationalObjective.id}`}
                                type="button"
                                onClick={() => toggleOperationalObjectiveFromLibrary(
                                  setForm,
                                  libraryItem,
                                  operationalObjective
                                )}
                                className={`flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${
                                  selected
                                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-200 hover:bg-white"
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-current/70">
                                    O.O.{operationalIndex + 1}
                                  </p>
                                  <p className="mt-1 leading-relaxed">{operationalObjective.description}</p>
                                </div>
                                <span className="shrink-0 rounded-full border border-current/15 px-2 py-1 text-[11px] font-semibold">
                                  {selected ? "Seleccionado" : "Seleccionar"}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {form.specificObjectives.map((specificObjective, specificIndex) => {
            return (
              <div key={`specific-${specificIndex}`} className="rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700">O.E.{specificIndex + 1}</p>
                      {form.specificObjectives.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setForm((current) => ({
                            ...current,
                            specificObjectives: current.specificObjectives.filter((_, index) => index !== specificIndex)
                          }))}
                          className="text-xs font-medium text-rose-500 hover:text-rose-700"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                      <p className="text-sm leading-relaxed text-slate-700">
                        {specificObjective.description || "Selecciona un objetivo específico desde el buscador."}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 p-4">
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-700">Objetivos operacionales seleccionados</p>
                        <span className="text-xs text-slate-500">Puedes quitar los que no usarás</span>
                      </div>
                      <div className="space-y-3">
                        {specificObjective.operationalObjectives.map((operationalObjective, operationalIndex) => (
                          <div key={`operational-${specificIndex}-${operationalIndex}`} className="rounded-xl border border-slate-200 p-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-700">O.O.{operationalIndex + 1}</p>
                              <button
                                type="button"
                                onClick={() => setForm((current) => ({
                                  ...current,
                                  specificObjectives: current.specificObjectives.flatMap((currentSpecificObjective, currentSpecificIndex) => {
                                    if (currentSpecificIndex !== specificIndex) return [currentSpecificObjective]

                                    const remainingOperationalObjectives = currentSpecificObjective.operationalObjectives
                                      .filter((_, currentOperationalIndex) => currentOperationalIndex !== operationalIndex)
                                      .map((item, index) => ({
                                        ...item,
                                        order: index + 1
                                      }))

                                    return remainingOperationalObjectives.length > 0
                                      ? [{
                                        ...currentSpecificObjective,
                                        operationalObjectives: remainingOperationalObjectives
                                      }]
                                      : []
                                  })
                                }))}
                                className="text-xs font-medium text-rose-500 transition hover:text-rose-700"
                              >
                                Quitar
                              </button>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                              {operationalObjective.description}
                            </div>
                            <div className="mt-3 space-y-3">
                              {(operationalObjective.activities ?? []).map((activity, activityIndex) => (
                                <div key={`activity-${specificIndex}-${operationalIndex}-${activityIndex}`} className="space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                      Actividad {activityIndex + 1}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setForm((current) => ({
                                        ...current,
                                        specificObjectives: current.specificObjectives.map((currentSpecificObjective, currentSpecificIndex) => (
                                          currentSpecificIndex !== specificIndex
                                            ? currentSpecificObjective
                                            : {
                                              ...currentSpecificObjective,
                                              operationalObjectives: currentSpecificObjective.operationalObjectives.map((currentOperationalObjective, currentOperationalIndex) => (
                                                currentOperationalIndex !== operationalIndex
                                                  ? currentOperationalObjective
                                                  : {
                                                    ...currentOperationalObjective,
                                                    activities: (currentOperationalObjective.activities ?? []).filter((_, currentActivityIndex) => currentActivityIndex !== activityIndex)
                                                  }
                                              ))
                                            }
                                        ))
                                      }))}
                                      className="text-xs font-medium text-rose-500 transition hover:text-rose-700"
                                    >
                                      Quitar actividad
                                    </button>
                                  </div>
                                  <textarea
                                    value={activity}
                                    onChange={(event) => setForm((current) => ({
                                      ...current,
                                      specificObjectives: current.specificObjectives.map((currentSpecificObjective, currentSpecificIndex) => (
                                        currentSpecificIndex !== specificIndex
                                          ? currentSpecificObjective
                                          : {
                                            ...currentSpecificObjective,
                                            operationalObjectives: currentSpecificObjective.operationalObjectives.map((currentOperationalObjective, currentOperationalIndex) => (
                                              currentOperationalIndex !== operationalIndex
                                                ? currentOperationalObjective
                                                : {
                                                  ...currentOperationalObjective,
                                                  activities: (currentOperationalObjective.activities ?? []).map((currentActivity, currentActivityIndex) => (
                                                    currentActivityIndex === activityIndex ? event.target.value : currentActivity
                                                  ))
                                                }
                                            ))
                                          }
                                      ))
                                    }))}
                                    rows={3}
                                    className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-relaxed focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    placeholder="Describe la actividad que se realizará en torno a este objetivo operacional."
                                  />
                                </div>
                              ))}

                              {(operationalObjective.activities?.length ?? 0) < 3 && (
                                <button
                                  type="button"
                                  onClick={() => setForm((current) => ({
                                    ...current,
                                    specificObjectives: current.specificObjectives.map((currentSpecificObjective, currentSpecificIndex) => (
                                      currentSpecificIndex !== specificIndex
                                        ? currentSpecificObjective
                                        : {
                                          ...currentSpecificObjective,
                                          operationalObjectives: currentSpecificObjective.operationalObjectives.map((currentOperationalObjective, currentOperationalIndex) => (
                                            currentOperationalIndex !== operationalIndex
                                              ? currentOperationalObjective
                                              : {
                                                ...currentOperationalObjective,
                                                activities: [...(currentOperationalObjective.activities ?? []), ""]
                                              }
                                          ))
                                        }
                                    ))
                                  }))}
                                  className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                                >
                                  + Agregar actividad
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      {form.specificObjectives.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
          <p className="text-sm text-slate-500">
            Todavía no has asociado objetivos específicos a esta sesión.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Puedes guardar la sesión igual y vincular los O.E. más tarde desde este mismo bloque.
          </p>
        </div>
      )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Tareas e indicaciones de la sesión
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Opcional. Agrega indicaciones solo cuando corresponda.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm((current) => ({
                ...current,
                sessionTasks: [...current.sessionTasks, createTask()]
              }))}
              className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              + Agregar indicación
            </button>
          </div>
        </div>
        <div className="space-y-3 p-4">
          {form.sessionTasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-center">
              <p className="text-sm text-slate-500">
                No hay tareas ni indicaciones cargadas en esta sesión.
              </p>
            </div>
          )}
          {form.sessionTasks.map((sessionTask, taskIndex) => (
            <div key={`task-${taskIndex}`} className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Indicacion {taskIndex + 1}</p>
                {form.sessionTasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({
                      ...current,
                      sessionTasks: current.sessionTasks.filter((_, index) => index !== taskIndex)
                    }))}
                    className="text-xs font-medium text-rose-500 hover:text-rose-700"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
                <input
                  type="text"
                  value={sessionTask.title}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    sessionTasks: current.sessionTasks.map((currentTask, currentIndex) =>
                      currentIndex === taskIndex
                        ? { ...currentTask, title: event.target.value }
                        : currentTask
                    )
                  }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Titulo o nombre de la indicación"
                />
                <textarea
                  value={sessionTask.description || ""}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    sessionTasks: current.sessionTasks.map((currentTask, currentIndex) =>
                      currentIndex === taskIndex
                        ? { ...currentTask, description: event.target.value }
                        : currentTask
                    )
                  }))}
                  className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Detalles, practica para casa, materiales o acuerdos con la familia."
                />
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Archivo para la indicación</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {sessionTask.id
                        ? "Puedes adjuntar PDF, Word o imágenes directamente a esta indicación."
                        : "Guarda la sesión primero para poder adjuntar PDF, Word o imágenes a esta indicación."}
                    </p>
                  </div>
                  {sessionTask.id && editingSessionId ? (
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        disabled={Boolean(uploadingTaskKey)}
                        onChange={async (event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          await handleUploadTaskFile(editingSessionId, sessionTask.id!, file)
                          event.target.value = ""
                        }}
                      />
                      {uploadingTaskKey === `${editingSessionId}:${sessionTask.id}` ? "Subiendo..." : "Adjuntar archivo"}
                    </label>
                  ) : null}
                </div>

                {sessionTask.id ? (
                  <TaskFilesList
                    files={sessionTask.files ?? []}
                    getFileIcon={getFileIcon}
                    getFileUrl={getFileUrl}
                    deletingKeyPrefix={editingSessionId ? `${editingSessionId}:${sessionTask.id}` : ""}
                    uploadingTaskKey={uploadingTaskKey}
                    onDelete={(fileId) => editingSessionId && handleDeleteTaskFile(editingSessionId, sessionTask.id!, fileId)}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Resumen de lo trabajado</label>
          <p className="mt-1 text-xs text-slate-500">
            Opcional. Puedes guardarlo despues si en este momento solo quieres planificar la sesión.
          </p>
        </div>
        <textarea
          value={form.whatWasDone}
          onChange={(event) => setForm((current) => ({ ...current, whatWasDone: event.target.value }))}
          className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Describe lo trabajado, avances, dificultades o acuerdos de la sesión."
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type={submitMode}
          onClick={submitMode === "button" ? actionHandler : undefined}
          disabled={submitDisabled}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : actionLabel}
        </button>
      </div>
    </div>
  )

  return (
    <section className="space-y-4">
      {!hasRequiredPlanningData({
        generalObjective,
        contentHierarchy,
        hierarchyCriteria,
        focus,
        modality,
        strategies
      }) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Para guardar una sesión primero debes completar la planificación clínica del paciente:
          objetivo general, jerarquización, criterio, foco y modalidad.
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl bg-slate-900 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Seguimiento clínico</p>
          <h3 className="mt-2 text-xl font-semibold">Sesiones de intervención</h3>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            Cada sesión integra jerarquización, objetivo general, objetivos específicos, objetivos operacionales
            e indicaciones en una sola ficha.
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm((current) => !current)
            setEditingSessionId(null)
            setEditForm(null)
            setSessionMessage("")
          }}
          className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          {showCreateForm ? "Cancelar nueva sesión" : "+ Nueva sesión"}
        </button>
      </div>

      {sessionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {sessionMessage}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateSession} className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">Nueva sesión</p>
            <h4 className="mt-1 text-lg font-semibold text-slate-800">Planificacion de sesión</h4>
          </div>
          {renderSessionForm(
            { ...createForm, generalObjective: generalObjective.trim() },
            updateCreateForm,
            "Guardar sesión",
            saving ||
              !generalObjective.trim() ||
              !contentHierarchy.some((item) => item.trim()) ||
              !hierarchyCriteria.trim() ||
              !focus.trim() ||
              !modality.trim() ||
              !strategies.trim(),
            "submit",
            "create"
          )}
        </form>
      )}

      {orderedSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">Aún no hay sesiones registradas para este paciente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orderedSessions.map((session) => {
            const completionState = getCompletionState(session)
            const isExpanded = expandedSessionId === session.id
            const isEditing = editingSessionId === session.id

            return (
              <article key={session.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                          Sesión {session.sessionNumber}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${completionState.styles}`}>
                          {completionState.label}
                        </span>
                        <span className="text-sm text-slate-500">{formatDate(session.date)}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">Resumen</p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-700">{session.whatWasDone}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">Objetivos específicos</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">{session.specificObjectives.length}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">Indicaciones</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">{session.sessionTasks.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedSessionId((current) => current === session.id ? null : session.id)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
                      >
                        {isExpanded ? "Ocultar detalle" : "Ver ficha"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedSessionId(session.id)
                          setEditingSessionId(session.id)
                          setShowCreateForm(false)
                          setEditForm(mapSessionToForm(session))
                          setSessionMessage("")
                        }}
                        className="rounded-xl border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(session.id)}
                        className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 sm:p-6">
                    {isEditing && editForm ? (
                      <div className="space-y-4">
                        {renderSessionForm(
                          editForm,
                          updateEditForm,
                          "Guardar cambios",
                          saving ||
                            !generalObjective.trim() ||
                            !contentHierarchy.some((item) => item.trim()) ||
                            !hierarchyCriteria.trim() ||
                            !focus.trim() ||
                            !modality.trim() ||
                            !strategies.trim(),
                          "button",
                          `edit-${session.id}`,
                          () => handleUpdateSession(session.id)
                        )}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSessionId(null)
                              setEditForm(null)
                            }}
                            className="text-sm font-medium text-slate-500 hover:text-slate-700"
                          >
                            Cancelar edicion
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">

                        <section className="rounded-2xl border border-slate-200">
                          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                              Objetivo general / meta
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)]">
                            <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                              O.G.1
                            </div>
                            <div className="px-4 py-3 text-sm text-slate-700">{session.generalObjective}</div>
                          </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-slate-200">
                          <div className="overflow-x-auto">
                            <div className="min-w-[720px]">
                              <div className="grid grid-cols-[260px_minmax(0,1fr)] border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                                <div className="border-r border-slate-200 px-4 py-3">Objetivos específicos (O.E.)</div>
                                <div className="px-4 py-3">Objetivos operacionales (O.O.)</div>
                              </div>
                              <div className="divide-y divide-slate-200">
                                {session.specificObjectives.map((specificObjective, specificIndex) => (
                                  <div key={specificObjective.id} className="grid grid-cols-[260px_minmax(0,1fr)]">
                                    <div className="border-r border-slate-200 bg-slate-50 px-4 py-4">
                                      <p className="text-sm font-semibold text-slate-700">O.E.{specificIndex + 1}</p>
                                      <p className="mt-2 text-sm text-slate-700">{specificObjective.description}</p>
                                    </div>
                                    <div className="px-4 py-4">
                                      <div className="space-y-3">
                                        {specificObjective.operationalObjectives.map((operationalObjective, operationalIndex) => (
                                          <div key={operationalObjective.id} className="rounded-xl border border-slate-200 px-4 py-3">
                                            <p className="text-sm font-semibold text-slate-700">O.O.{operationalIndex + 1}</p>
                                            <p className="mt-1 text-sm text-slate-700">{operationalObjective.description}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200">
                          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                              Tareas e indicaciones
                            </h4>
                          </div>
                          <div className="space-y-3 p-4">
                            {session.sessionTasks.length === 0 ? (
                              <p className="text-sm text-slate-500">No hay indicaciones registradas para esta sesión.</p>
                            ) : session.sessionTasks.map((sessionTask, taskIndex) => (
                              <div key={sessionTask.id} className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-sm font-semibold text-slate-800">
                                  {taskIndex + 1}. {sessionTask.title}
                                </p>
                                {sessionTask.description && (
                                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{sessionTask.description}</p>
                                )}
                                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-700">Material adjunto</p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        Sube PDF, Word o imágenes relacionadas con esta indicación.
                                      </p>
                                    </div>
                                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
                                      <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        className="hidden"
                                        disabled={Boolean(uploadingTaskKey)}
                                        onChange={async (event) => {
                                          const file = event.target.files?.[0]
                                          if (!file) return
                                          await handleUploadTaskFile(session.id, sessionTask.id, file)
                                          event.target.value = ""
                                        }}
                                      />
                                      {uploadingTaskKey === `${session.id}:${sessionTask.id}` ? "Subiendo..." : "Adjuntar archivo"}
                                    </label>
                                  </div>

                                  {sessionTask.files.length === 0 ? (
                                    <p className="mt-3 text-sm text-slate-500">Todavía no hay archivos para esta indicación.</p>
                                  ) : (
                                    <div className="mt-3 space-y-2">
                                      {sessionTask.files.map((file) => (
                                        <div
                                          key={file.id}
                                          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                          <a
                                            href={getFileUrl(file.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex min-w-0 items-center gap-3 text-sm text-slate-700 hover:text-indigo-600"
                                          >
                                            <span className="rounded-md bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
                                              {getFileIcon(file.filetype)}
                                            </span>
                                            <span className="truncate">{file.filename}</span>
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteTaskFile(session.id, sessionTask.id, file.id)}
                                            disabled={uploadingTaskKey === `${session.id}:${sessionTask.id}:${file.id}`}
                                            className="text-xs font-medium text-rose-500 hover:text-rose-700 disabled:opacity-50"
                                          >
                                            {uploadingTaskKey === `${session.id}:${sessionTask.id}:${file.id}` ? "Eliminando..." : "Eliminar archivo"}
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default SessionsSection
