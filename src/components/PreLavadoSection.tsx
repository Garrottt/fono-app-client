import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { getAnamnesisService } from "../services/anamnesis.service"
import {
  downloadPreLavadoPdfService,
  getPreLavadoService,
  savePreLavadoService
} from "../services/prelavado.service"
import type { Anamnesis } from "../types/anamnesis.types"
import type {
  CaeObservation,
  MembranaObservation,
  PabellonObservation,
  PreLavadoEvaluation,
  StructureStatus,
  SullivanScale,
  UpdatePreLavadoInput
} from "../types/prelavado.types"

interface Props {
  patientId: string
  patientName: string
  patientAge?: number
  patientDiagnosis?: string
}

const STATUS_OPTIONS: Array<{ value: StructureStatus; label: string }> = [
  { value: "indemne", label: "Indemne" },
  { value: "patologico", label: "Patologico" }
]

const PABELLON_OPTIONS: Array<{ value: PabellonObservation; label: string }> = [
  { value: "normal", label: "Normal" },
  { value: "inflamado", label: "Inflamado" },
  { value: "malformacion", label: "Malformación" }
]

const CAE_OPTIONS: Array<{ value: CaeObservation; label: string }> = [
  { value: "limpio", label: "Limpio" },
  { value: "eritematoso", label: "Eritematoso" },
  { value: "edematoso", label: "Edematoso" },
  { value: "presencia_hongos", label: "Presencia de hongos" }
]

const MEMBRANA_OPTIONS: Array<{ value: MembranaObservation; label: string }> = [
  { value: "integra", label: "Íntegra" },
  { value: "perforada", label: "Perforada" },
  { value: "abombada", label: "Abombada" },
  { value: "retraida", label: "Retraida" }
]

const SULLIVAN_OPTIONS: SullivanScale[] = ["0", "+1", "+2", "+3"]

const EMPTY_FORM: UpdatePreLavadoInput = {
  hasDiabetesOrImmunosuppression: false,
  hasPreviousEarSurgeries: false,
  hasKnownPerforation: false,
  otalgia: false,
  hipoacusia: false,
  plenitudOtica: false,
  otorrea: false,
  prurito: false,
  otorragia: false,
  usesHearingAid: false,
  hearingAidBadSmell: false,
  dolorAlTocarTrago: false,
  odPabellonEstado: "indemne",
  oiPabellonEstado: "indemne",
  odPabellonObservacion: "normal",
  oiPabellonObservacion: "normal",
  odCaeEstado: "indemne",
  oiCaeEstado: "indemne",
  odCaeObservacion: "limpio",
  oiCaeObservacion: "limpio",
  odMembranaEstado: "indemne",
  oiMembranaEstado: "indemne",
  odMembranaObservacion: "integra",
  oiMembranaObservacion: "integra",
  odSullivan: "0",
  oiSullivan: "0",
  odObservaciones: "",
  oiObservaciones: ""
}

const computeLiveResult = (form: UpdatePreLavadoInput) => {
  const criticalBlocks: string[] = []
  const precautionAlerts: string[] = []

  const hasMembranePerforation =
    form.odMembranaObservacion === "perforada" ||
    form.oiMembranaObservacion === "perforada"

  const hasFungi =
    form.odCaeObservacion === "presencia_hongos" ||
    form.oiCaeObservacion === "presencia_hongos"

  if (form.hasPreviousEarSurgeries) {
    criticalBlocks.push("Cirugías previas detectadas. No apto para lavado por riesgo clínico y legal.")
  }

  if (form.hasDiabetesOrImmunosuppression) {
    criticalBlocks.push("Diabetes o inmunosupresión detectada. No apto para lavado por riesgo de otitis externa maligna.")
  }

  if (form.hasKnownPerforation || hasMembranePerforation) {
    criticalBlocks.push("Perforacion timpanica conocida o sospechada. No apto para lavado.")
  }

  if (form.otorrea) {
    precautionAlerts.push("ALERTA: Presencia de secreción. Evaluar consistencia y olor. Sí es purulenta, evitar irrigación.")
  }

  if (form.prurito) {
    precautionAlerts.push("ALERTA: Picazon intensa detectada. Posible otomicosis. Sí se confirman hongos en otoscopía, derivar y no irrigar.")
  }

  if (form.otorragia) {
    precautionAlerts.push("ALERTA: Sangrado detectado. Evaluar si corresponde a trauma o lesion interna antes de proceder.")
  }

  if (form.usesHearingAid && form.hearingAidBadSmell) {
    precautionAlerts.push("ALERTA: Mal olor asociado al uso de audífonos. Evaluar posible proceso infeccioso antes del lavado.")
  }

  let diagnosticSummary = "Sín hipótesis automática concluyente"
  let suggestedConduct = "Continuar evaluación clínica y confirmar conducta profesional según hallazgos."

  if ((form.prurito && form.otorrea) || hasFungi) {
    diagnosticSummary = "Sospecha de Otomicosis"
    suggestedConduct = "Se recomienda DERIVAR. Evitar humedad en el conducto."
  } else if (form.otalgia && form.dolorAlTocarTrago) {
    diagnosticSummary = "Sígnos de Otitis Externa"
    suggestedConduct = "Evaluar tratamiento medico antes de limpieza."
  } else if (form.hipoacusia && form.plenitudOtica && !form.otalgia) {
    diagnosticSummary = "Compatible con Tapon de Cerumen"
    suggestedConduct = "Proceder a otoscopía para confirmar extracción."
  }

  return {
    aptoParaLavado: criticalBlocks.length === 0,
    criticalBlocks,
    precautionAlerts,
    diagnosticSummary,
    suggestedConduct
  }
}

function BinaryField({
  label,
  value,
  onChange,
  help
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  help?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          {help && <p className="mt-1 text-xs leading-relaxed text-slate-500">{help}</p>}
        </div>
        <div className="flex shrink-0 rounded-full border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`min-w-[58px] rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${value ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`min-w-[58px] rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${!value ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
          >
            No
          </button>
        </div>
      </div>
    </div>
  )
}

function ReadOnlyCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}

function SelectField<T extends string>({
  value,
  options,
  onChange
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function EarField({
  title,
  estado,
  observacion,
  statusOptions,
  observationOptions,
  onEstadoChange,
  onObservacionChange
}: {
  title: string
  estado: StructureStatus
  observacion: string
  statusOptions: Array<{ value: StructureStatus; label: string }>
  observationOptions: Array<{ value: string; label: string }>
  onEstadoChange: (value: StructureStatus) => void
  onObservacionChange: (value: string) => void
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Estado</label>
        <SelectField value={estado} options={statusOptions} onChange={onEstadoChange} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Observacion</label>
        <SelectField value={observacion} options={observationOptions} onChange={onObservacionChange} />
      </div>
    </div>
  )
}

function OtoscopicComparisonCard({
  label,
  odContent,
  oiContent
}: {
  label: string
  odContent: ReactNode
  oiContent: ReactNode
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">OD</p>
          {odContent}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">OI</p>
          {oiContent}
        </div>
      </div>
    </div>
  )
}

function PreLavadoSection({ patientId, patientName, patientAge, patientDiagnosis }: Props) {
  const [evaluation, setEvaluation] = useState<PreLavadoEvaluation | null>(null)
  const [anamnesis, setAnamnesis] = useState<Anamnesis | null>(null)
  const [form, setForm] = useState<UpdatePreLavadoInput>(EMPTY_FORM)
  const [savedForm, setSavedForm] = useState<UpdatePreLavadoInput>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const anamnesisData = await getAnamnesisService(patientId)
        setAnamnesis(anamnesisData)

        const data = await getPreLavadoService(patientId)
        if (data) {
          const nextForm = {
            hasDiabetesOrImmunosuppression: data.hasDiabetesOrImmunosuppression,
            hasPreviousEarSurgeries: data.hasPreviousEarSurgeries,
            hasKnownPerforation: data.hasKnownPerforation,
            otalgia: data.otalgia,
            hipoacusia: data.hipoacusia,
            plenitudOtica: data.plenitudOtica,
            otorrea: data.otorrea,
            prurito: data.prurito,
            otorragia: data.otorragia,
            usesHearingAid: data.usesHearingAid,
            hearingAidBadSmell: data.hearingAidBadSmell,
            dolorAlTocarTrago: data.dolorAlTocarTrago,
            odPabellonEstado: data.odPabellonEstado,
            oiPabellonEstado: data.oiPabellonEstado,
            odPabellonObservacion: data.odPabellonObservacion,
            oiPabellonObservacion: data.oiPabellonObservacion,
            odCaeEstado: data.odCaeEstado,
            oiCaeEstado: data.oiCaeEstado,
            odCaeObservacion: data.odCaeObservacion,
            oiCaeObservacion: data.oiCaeObservacion,
            odMembranaEstado: data.odMembranaEstado,
            oiMembranaEstado: data.oiMembranaEstado,
            odMembranaObservacion: data.odMembranaObservacion,
            oiMembranaObservacion: data.oiMembranaObservacion,
            odSullivan: data.odSullivan,
            oiSullivan: data.oiSullivan,
            odObservaciones: data.odObservaciones || "",
            oiObservaciones: data.oiObservaciones || ""
          }

          setEvaluation(data)
          setForm(nextForm)
          setSavedForm(nextForm)
        } else {
          setEvaluation(null)
          setForm(EMPTY_FORM)
          setSavedForm(EMPTY_FORM)
        }
      } catch {
        setError("Error al cargar la evaluación pre-lavado")
      } finally {
        setLoading(false)
      }
    }

    fetchEvaluation()
  }, [patientId])

  const inheritedContext = useMemo(() => ({
    hasDiabetesOrImmunosuppression: Boolean(anamnesis?.hasDiabetesOrImmunosuppression),
    hasPreviousEarSurgeries: Boolean(anamnesis?.hasPreviousEarSurgeries),
    otalgia: Boolean(anamnesis?.otalgia),
    hipoacusia: Boolean(anamnesis?.hipoacusia),
    plenitudOtica: Boolean(anamnesis?.plenitudOtica),
    otorrea: Boolean(anamnesis?.otorrea),
    prurito: Boolean(anamnesis?.prurito),
    otorragia: Boolean(anamnesis?.otorragia),
    usesHearingAid: Boolean(anamnesis?.usesHearingAid),
    hearingAidBadSmell: Boolean(anamnesis?.hearingAidSuppurationOrBadSmell)
  }), [anamnesis])
  const mergedForm = useMemo(
    () => ({
      ...form,
      ...inheritedContext
    }),
    [form, inheritedContext]
  )
  const derived = useMemo(() => computeLiveResult(mergedForm), [mergedForm])
  const anamnesisAlerts = useMemo(() => {
    if (!anamnesis) return []

    const alerts: string[] = []

    if (anamnesis.hasPreviousEarSurgeries) {
      const surgeries = [
        anamnesis.timpanoplastia ? "timpanoplastia" : null,
        anamnesis.mastoidectomia ? "mastoidectomia" : null,
        anamnesis.miringoplastia ? "miringoplastia" : null,
        anamnesis.osiculoplastia ? "osiculoplastia" : null,
        anamnesis.estapedectomiaEstapedotomia ? "estapedectomia / estapedotomia" : null
      ].filter(Boolean)

      alerts.push(
        surgeries.length > 0
          ? `Advertencia desde anamnesis: cirugías de oído previas registradas (${surgeries.join(", ")}).`
          : "Advertencia desde anamnesis: se registraron cirugías de oído previas."
      )
    }

    if (anamnesis.hasDiabetesOrImmunosuppression) {
      alerts.push("Advertencia desde anamnesis: antecedente de diabetes o inmunosupresión.")
    }

    if (anamnesis.otorrea) {
      alerts.push("Advertencia desde anamnesis: se registro otorrea en la anamnesis.")
    }

    if (anamnesis.otorragia) {
      alerts.push("Advertencia desde anamnesis: se registro otorragia en la anamnesis.")
    }

    return alerts
  }, [anamnesis])
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm]
  )

  const statusClass = derived.aptoParaLavado
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-red-200 bg-red-50 text-red-700"

  const updateField = <K extends keyof UpdatePreLavadoInput>(key: K, value: UpdatePreLavadoInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setMessage("")

    try {
      const response = await savePreLavadoService(patientId, mergedForm)
      setEvaluation(response.evaluation)
      setSavedForm(form)
      setMessage(response.message)
    } catch (saveError: any) {
      setError(saveError?.response?.data?.message || "Error al guardar la evaluación pre-lavado")
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPdf = async () => {
    setDownloading(true)
    setError("")

    try {
      const blob = await downloadPreLavadoPdfService(patientId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `pre-lavado-${patientName.toLowerCase().replace(/\s+/g, "-")}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (downloadError: any) {
      setError(downloadError?.response?.data?.message || "Error al generar la ficha PDF")
    } finally {
      setDownloading(false)
    }
  }

  const formatUpdatedAt = (value?: string) => {
    if (!value) return "Sín registros previos"

    return new Date(value).toLocaleString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Cargando evaluación pre-lavado...</p>
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-[73px] z-20 bg-gray-100/95 pb-3 backdrop-blur">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400">Pre-Lavado</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{patientName}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Evaluación otoscópica pre-lavado para soporte clínico durante la consulta.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>
                  {derived.aptoParaLavado ? "Apto para lavado" : "No apto para lavado"}
                </span>
                {derived.precautionAlerts.length > 0 && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
                    Con alertas
                  </span>
                )}
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${hasUnsavedChanges ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}>
                  {hasUnsavedChanges ? "Cambios sin guardar" : "Guardado"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading || !evaluation}
                className="rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-50"
              >
                {downloading ? "Generando PDF..." : "Generar ficha PDF"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar evaluación"}
              </button>
            </div>
          </div>

          <div className="grid gap-3 px-5 py-4 md:grid-cols-2 xl:grid-cols-5">
            <ReadOnlyCard label="Paciente" value={patientName} />
            <ReadOnlyCard label="Edad" value={patientAge?.toString() || "No registrada"} />
            <ReadOnlyCard label="Diagnóstico" value={patientDiagnosis || "Sín diagnóstico"} />
            <ReadOnlyCard label="Última actualización" value={formatUpdatedAt(evaluation?.updatedAt)} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}

      {anamnesisAlerts.length > 0 && (
        <div className="space-y-2">
          {anamnesisAlerts.map((alert) => (
            <div key={alert} className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 shadow-sm">
              {alert}
            </div>
          ))}
        </div>
      )}

      {derived.criticalBlocks.length > 0 && (
        <div className="space-y-2">
          {derived.criticalBlocks.map((block) => (
            <div key={block} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
              {block}
            </div>
          ))}
        </div>
      )}

      {derived.precautionAlerts.length > 0 && (
        <div className="space-y-2">
          {derived.precautionAlerts.map((alert) => (
            <div key={alert} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
              {alert}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-6">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">Contexto heredado desde anamnesis</h4>
            <p className="mt-1 text-sm text-slate-500">Estos antecedentes ya vienen desde la anamnesis y se consideran dentro de la evaluación pre-lavado.</p>
          </div>

          {!anamnesis && (
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Este paciente aún no tiene anamnesis registrada. El pre-lavado seguirá funcionando, pero sin antecedentes clínicos heredados.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ReadOnlyCard label="Diabetes / inmunosupresión" value={inheritedContext.hasDiabetesOrImmunosuppression ? "Sí" : "No"} />
            <ReadOnlyCard label="Cirugías previas" value={inheritedContext.hasPreviousEarSurgeries ? "Sí" : "No"} />
            <ReadOnlyCard label="Uso de audífonos" value={inheritedContext.usesHearingAid ? "Sí" : "No"} />
            <ReadOnlyCard label="Otalgia" value={inheritedContext.otalgia ? "Sí" : "No"} />
            <ReadOnlyCard label="Hipoacusia" value={inheritedContext.hipoacusia ? "Sí" : "No"} />
            <ReadOnlyCard label="Plenitud ótica" value={inheritedContext.plenitudOtica ? "Sí" : "No"} />
            <ReadOnlyCard label="Otorrea" value={inheritedContext.otorrea ? "Sí" : "No"} />
            <ReadOnlyCard label="Prurito" value={inheritedContext.prurito ? "Sí" : "No"} />
            <ReadOnlyCard label="Otorragia" value={inheritedContext.otorragia ? "Sí" : "No"} />
            <ReadOnlyCard label="Mal olor con audífonos" value={inheritedContext.hearingAidBadSmell ? "Sí" : "No"} />
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">Variables propias del pre-lavado</h4>
            <p className="mt-1 text-sm text-slate-500">Aquí solo se registran hallazgos exclusivos de esta evaluación.</p>
          </div>

          <div className="grid gap-4">
            <BinaryField
              label="Perforacion timpanica conocida"
              value={form.hasKnownPerforation}
              onChange={(value) => updateField("hasKnownPerforation", value)}
            />
            <BinaryField
              label="Dolor al tocar trago"
              value={form.dolorAlTocarTrago}
              onChange={(value) => updateField("dolorAlTocarTrago", value)}
            />
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h4 className="text-lg font-semibold text-slate-900">IV. Evaluación otoscópica pre-lavado</h4>
          <p className="mt-1 text-sm text-slate-500">Comparacion estructurada entre oído derecho y oído izquierdo.</p>
        </div>

        <div className="space-y-4">
          <OtoscopicComparisonCard
            label="Pabellon auricular"
            odContent={
              <EarField
                title="OD"
                estado={form.odPabellonEstado}
                observacion={form.odPabellonObservacion}
                statusOptions={STATUS_OPTIONS}
                observationOptions={PABELLON_OPTIONS}
                onEstadoChange={(value) => updateField("odPabellonEstado", value)}
                onObservacionChange={(value) => updateField("odPabellonObservacion", value as PabellonObservation)}
              />
            }
            oiContent={
              <EarField
                title="OI"
                estado={form.oiPabellonEstado}
                observacion={form.oiPabellonObservacion}
                statusOptions={STATUS_OPTIONS}
                observationOptions={PABELLON_OPTIONS}
                onEstadoChange={(value) => updateField("oiPabellonEstado", value)}
                onObservacionChange={(value) => updateField("oiPabellonObservacion", value as PabellonObservation)}
              />
            }
          />

          <OtoscopicComparisonCard
            label="CAE"
            odContent={
              <EarField
                title="OD"
                estado={form.odCaeEstado}
                observacion={form.odCaeObservacion}
                statusOptions={STATUS_OPTIONS}
                observationOptions={CAE_OPTIONS}
                onEstadoChange={(value) => updateField("odCaeEstado", value)}
                onObservacionChange={(value) => updateField("odCaeObservacion", value as CaeObservation)}
              />
            }
            oiContent={
              <EarField
                title="OI"
                estado={form.oiCaeEstado}
                observacion={form.oiCaeObservacion}
                statusOptions={STATUS_OPTIONS}
                observationOptions={CAE_OPTIONS}
                onEstadoChange={(value) => updateField("oiCaeEstado", value)}
                onObservacionChange={(value) => updateField("oiCaeObservacion", value as CaeObservation)}
              />
            }
          />

          <OtoscopicComparisonCard
            label="Membrana"
            odContent={
              <EarField
                title="OD"
                estado={form.odMembranaEstado}
                observacion={form.odMembranaObservacion}
                statusOptions={STATUS_OPTIONS}
                observationOptions={MEMBRANA_OPTIONS}
                onEstadoChange={(value) => updateField("odMembranaEstado", value)}
                onObservacionChange={(value) => updateField("odMembranaObservacion", value as MembranaObservation)}
              />
            }
            oiContent={
              <EarField
                title="OI"
                estado={form.oiMembranaEstado}
                observacion={form.oiMembranaObservacion}
                statusOptions={STATUS_OPTIONS}
                observationOptions={MEMBRANA_OPTIONS}
                onEstadoChange={(value) => updateField("oiMembranaEstado", value)}
                onObservacionChange={(value) => updateField("oiMembranaObservacion", value as MembranaObservation)}
              />
            }
          />

          <OtoscopicComparisonCard
            label="Escala de Sullivan"
            odContent={
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <select
                  value={form.odSullivan}
                  onChange={(event) => updateField("odSullivan", event.target.value as SullivanScale)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SULLIVAN_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            }
            oiContent={
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <select
                  value={form.oiSullivan}
                  onChange={(event) => updateField("oiSullivan", event.target.value as SullivanScale)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SULLIVAN_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            }
          />

          <OtoscopicComparisonCard
            label="Observaciones libres"
            odContent={
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <textarea
                  value={form.odObservaciones || ""}
                  onChange={(event) => updateField("odObservaciones", event.target.value)}
                  rows={4}
                  placeholder="Observaciones OD"
                  className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            }
            oiContent={
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <textarea
                  value={form.oiObservaciones || ""}
                  onChange={(event) => updateField("oiObservaciones", event.target.value)}
                  rows={4}
                  placeholder="Observaciones OI"
                  className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            }
          />
        </div>
      </section>
    </div>
  )
}

export default PreLavadoSection
