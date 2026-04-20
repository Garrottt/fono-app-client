import { useEffect, useState } from "react"
import { updatePatientService } from "../services/patient.service"

interface Props {
  patientId: string
  contentHierarchy: string[]
  hierarchyCriteria: string
  focus: string
  modality: string
  strategies: string
  onSaved: (payload: {
    contentHierarchy: string[]
    hierarchyCriteria: string
    focus: string
    modality: string
    strategies: string
  }) => void
}

function InterventionHierarchySection({
  patientId,
  contentHierarchy,
  hierarchyCriteria,
  focus,
  modality,
  strategies,
  onSaved
}: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [hierarchyDraft, setHierarchyDraft] = useState<string[]>(contentHierarchy.length > 0 ? contentHierarchy : [""])
  const [criteriaDraft, setCriteriaDraft] = useState(hierarchyCriteria)
  const [focusDraft, setFocusDraft] = useState(focus)
  const [modalityDraft, setModalityDraft] = useState(modality)
  const [strategiesDraft, setStrategiesDraft] = useState(strategies)

  useEffect(() => {
    setHierarchyDraft(contentHierarchy.length > 0 ? contentHierarchy : [""])
    setCriteriaDraft(hierarchyCriteria)
    setFocusDraft(focus)
    setModalityDraft(modality)
    setStrategiesDraft(strategies)
  }, [contentHierarchy, hierarchyCriteria, focus, modality, strategies])

  const handleSave = async () => {
    setSaving(true)
    setError("")

    const normalizedHierarchy = hierarchyDraft.map((item) => item.trim()).filter(Boolean)

    try {
      await updatePatientService(patientId, {
        contentHierarchy: normalizedHierarchy,
        hierarchyCriteria: criteriaDraft.trim(),
        focus: focusDraft.trim(),
        modality: modalityDraft.trim(),
        strategies: strategiesDraft.trim()
      })

      onSaved({
        contentHierarchy: normalizedHierarchy,
        hierarchyCriteria: criteriaDraft.trim(),
        focus: focusDraft.trim(),
        modality: modalityDraft.trim(),
        strategies: strategiesDraft.trim()
      })
      setEditing(false)
    } catch {
      setError("Error al guardar la jerarquización de contenidos")
    } finally {
      setSaving(false)
    }
  }

  const hasHierarchy = contentHierarchy.some((item) => item.trim())

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-400">Plan terapéutico</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                Jerarquización de contenidos de intervención
              </h3>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                Este bloque define la jerarquización que luego usan las sesiones. Queda arriba de
                Objetivos y ya no se completa dentro de cada sesión.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing((current) => !current)}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {editing ? "Cancelar" : hasHierarchy ? "Editar jerarquización" : "Cargar jerarquización"}
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                      Contenidos priorizados
                    </h4>
                    <button
                      type="button"
                      onClick={() => setHierarchyDraft((current) => [...current, ""])}
                      className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      + Agregar contenido
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-slate-200">
                  {hierarchyDraft.map((item, index) => (
                    <div key={`patient-hierarchy-${index}`} className="grid grid-cols-[56px_minmax(0,1fr)]">
                      <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(event) => setHierarchyDraft((current) => current.map((currentItem, currentIndex) => (
                            currentIndex === index ? event.target.value : currentItem
                          )))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          placeholder={`Contenido priorizado ${index + 1}`}
                        />
                        {hierarchyDraft.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setHierarchyDraft((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                            className="shrink-0 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {[
                {
                  label: "Criterio(s) de jerarquización",
                  value: criteriaDraft,
                  setter: setCriteriaDraft,
                  multiline: false
                },
                { label: "Enfoque", value: focusDraft, setter: setFocusDraft, multiline: false },
                { label: "Modalidad", value: modalityDraft, setter: setModalityDraft, multiline: false },
                { label: "Estrategia/s", value: strategiesDraft, setter: setStrategiesDraft, multiline: true }
              ].map((field) => (
                <div key={field.label} className="grid grid-cols-1 gap-3 md:grid-cols-[240px_minmax(0,1fr)]">
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    {field.label}
                  </div>
                  {field.multiline ? (
                    <textarea
                      value={field.value}
                      onChange={(event) => field.setter(event.target.value)}
                      className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  ) : (
                    <input
                      type="text"
                      value={field.value}
                      onChange={(event) => field.setter(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  )}
                </div>
              ))}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setHierarchyDraft(contentHierarchy.length > 0 ? contentHierarchy : [""])
                    setCriteriaDraft(hierarchyCriteria)
                    setFocusDraft(focus)
                    setModalityDraft(modality)
                    setStrategiesDraft(strategies)
                  }}
                  className="px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar jerarquización"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!hasHierarchy ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                  <p className="text-sm text-slate-500">
                    Todavía no hay jerarquización cargada. Regístrala aquí para que las sesiones la hereden.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                        Contenidos priorizados
                      </h4>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {contentHierarchy.map((item, index) => (
                        <div key={`hierarchy-view-${index}`} className="grid grid-cols-[56px_minmax(0,1fr)]">
                          <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                            {index + 1}
                          </div>
                          <div className="px-4 py-3 text-sm text-slate-700">{item}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {[
                    ["Criterio(s) de jerarquización", hierarchyCriteria],
                    ["Enfoque", focus],
                    ["Modalidad", modality],
                    ["Estrategia/s", strategies]
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-1 gap-3 md:grid-cols-[240px_minmax(0,1fr)]">
                      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                        {label}
                      </div>
                      <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                        {value || "-"}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default InterventionHierarchySection
