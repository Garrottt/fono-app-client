import { useEffect, useMemo, useState } from "react"
import { getAnamnesisService, saveAnamnesisService } from "../services/anamnesis.service"
import type { Anamnesis, UpdateAnamnesisInput } from "../types/anamnesis.types"

interface Props {
  patientId: string
  patientName: string
  patientAge?: number
  patientDiagnosis?: string
}

const EMPTY_FORM: UpdateAnamnesisInput = {
  consultationReason: "",
  previousAudiologicalDiagnosis: "",
  lastAuditoryReview: "",
  hasDiabetesOrImmunosuppression: false,
  hasPreviousEarSurgeries: false,
  timpanoplastia: false,
  mastoidectomia: false,
  miringoplastia: false,
  osiculoplastia: false,
  estapedectomiaEstapedotomia: false,
  usesCambuchos: false,
  usesHearingAid: false,
  hearingAidFeelsLooserOrAnnoying: false,
  hearingAidSoundsLowerOrWhistles: false,
  hearingAidSuppurationOrBadSmell: false,
  hearingAidHoursPerDay: "",
  cleansWithCottonSwabsOrObjects: false,
  cleaningObjects: "",
  otalgia: false,
  prurito: false,
  hipoacusia: false,
  otorrea: false,
  otorragia: false,
  plenitudOtica: false,
  tinnitus: false,
  vertigoInestabilidad: false,
  autofonia: false
}

const SYMPTOM_GUIDANCE = [
  {
    key: "otalgia",
    label: "Otalgia (dolor)",
    help: "Otitis externa bacteriana, otitis medía aguda, dermatitis del CAE e impactación de cerumen."
  },
  {
    key: "prurito",
    label: "Prurito (picazón)",
    help: "Otomicosis, dermatitis o eczema y etapas iniciales de otitis externa bacteriana."
  },
  {
    key: "hipoacusia",
    label: "Hipoacusia (baja audición)",
    help: "Tapon de cerumen, cuerpo extraño, otitis medía con efusión, perforación timpanica y OMA."
  },
  {
    key: "otorrea",
    label: "Otorrea (secreción)",
    help: "Otitis medía crónica, OMA con perforación, otitis externa bacteriana y otomicosis."
  },
  {
    key: "otorragia",
    label: "Otorragia (sangrado)",
    help: "Perforación timpánica traumática, heridas por cotonitos u otitis externa maligna."
  },
  {
    key: "plenitudOtica",
    label: "Plenitud ótica (oído tapado)",
    help: "Tapon de cerumen, disfunción tubaria, otitis medía con efusión y cuerpos extraños."
  },
  {
    key: "tinnitus",
    label: "Tinnitus (zumbidos)",
    help: "Tapon de cerumen, perforación timpanica y cuadros de oído interno."
  },
  {
    key: "vertigoInestabilidad",
    label: "Vértigo / inestabilidad",
    help: "Compromiso vestibular, perforación timpanica o sensibilidad a irrigacion."
  },
  {
    key: "autofonia",
    label: "Autofonia (oír su voz)",
    help: "Disfuncion tubaria y oído medio con efusión."
  }
] as const

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
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          {help && <p className="mt-1 text-xs leading-relaxed text-slate-500">{help}</p>}
        </div>
        <div className="flex w-fit rounded-full border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`min-w-[58px] rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${value ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
          >
            Si
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

function SymptomField({
  label,
  value,
  onChange,
  help,
  expanded,
  onToggleHelp
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  help: string
  expanded: boolean
  onToggleHelp: () => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold leading-7 text-slate-800">{label}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Síntoma clínico
            </p>
          </div>
          <div className="flex shrink-0 rounded-full border border-slate-200 bg-slate-100 p-1 self-start">
            <button
              type="button"
              onClick={() => onChange(true)}
              className={`min-w-[64px] rounded-full px-4 py-2 text-sm font-medium transition-colors ${value ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => onChange(false)}
              className={`min-w-[64px] rounded-full px-4 py-2 text-sm font-medium transition-colors ${!value ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
            >
              No
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <button
            type="button"
            onClick={onToggleHelp}
            className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800"
          >
            {expanded ? "Ocultar orientación" : "Ver orientación"}
          </button>
          {expanded && (
            <p className="mt-3 text-sm leading-7 text-slate-600">{help}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function TextCard({
  label,
  value,
  onChange,
  rows = 3,
  placeholder
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <label className="text-sm font-semibold text-slate-800">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-3 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
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

function AnamnesisSection({ patientId, patientName, patientAge, patientDiagnosis }: Props) {
  const [anamnesis, setAnamnesis] = useState<Anamnesis | null>(null)
  const [form, setForm] = useState<UpdateAnamnesisInput>(EMPTY_FORM)
  const [savedForm, setSavedForm] = useState<UpdateAnamnesisInput>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [expandedSymptomGuidance, setExpandedSymptomGuidance] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnamnesis = async () => {
      try {
        const data = await getAnamnesisService(patientId)
        if (data) {
          const nextForm = {
            consultationReason: data.consultationReason || "",
            previousAudiologicalDiagnosis: data.previousAudiologicalDiagnosis || "",
            lastAuditoryReview: data.lastAuditoryReview || "",
            hasDiabetesOrImmunosuppression: data.hasDiabetesOrImmunosuppression,
            hasPreviousEarSurgeries: data.hasPreviousEarSurgeries,
            timpanoplastia: data.timpanoplastia,
            mastoidectomia: data.mastoidectomia,
            miringoplastia: data.miringoplastia,
            osiculoplastia: data.osiculoplastia,
            estapedectomiaEstapedotomia: data.estapedectomiaEstapedotomia,
            usesCambuchos: data.usesCambuchos,
            usesHearingAid: data.usesHearingAid,
            hearingAidFeelsLooserOrAnnoying: data.hearingAidFeelsLooserOrAnnoying,
            hearingAidSoundsLowerOrWhistles: data.hearingAidSoundsLowerOrWhistles,
            hearingAidSuppurationOrBadSmell: data.hearingAidSuppurationOrBadSmell,
            hearingAidHoursPerDay: data.hearingAidHoursPerDay || "",
            cleansWithCottonSwabsOrObjects: data.cleansWithCottonSwabsOrObjects,
            cleaningObjects: data.cleaningObjects || "",
            otalgia: data.otalgia,
            prurito: data.prurito,
            hipoacusia: data.hipoacusia,
            otorrea: data.otorrea,
            otorragia: data.otorragia,
            plenitudOtica: data.plenitudOtica,
            tinnitus: data.tinnitus,
            vertigoInestabilidad: data.vertigoInestabilidad,
            autofonia: data.autofonia
          }

          setAnamnesis(data)
          setForm(nextForm)
          setSavedForm(nextForm)
        } else {
          setAnamnesis(null)
          setForm(EMPTY_FORM)
          setSavedForm(EMPTY_FORM)
        }
      } catch {
        setError("Error al cargar la anamnesis")
      } finally {
        setLoading(false)
      }
    }

    fetchAnamnesis()
  }, [patientId])

  const clinicalAlerts = useMemo(() => {
    const alerts: string[] = []

    if (form.hasDiabetesOrImmunosuppression) {
      alerts.push("Riesgo clínico a revisar antes de intervenir: antecedentes de díabetes mellitus o inmunosupresión.")
    }

    if (form.hasPreviousEarSurgeries) {
      alerts.push("Precaución: antecedente asociado a no realizar procedimiento sin reevaluación clínica.")
    }

    if (form.otorrea) {
      alerts.push("Precaución: la presencia de otorrea se asocia a no realizar procedimiento hasta evaluar causa clínica.")
    }

    if (form.otorragia) {
      alerts.push("Precaución: la presencia de otorragia requiere revisión clínica previa y se asocia a no realizar procedimiento.")
    }

    return alerts
  }, [form])

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm]
  )

  const statusTone = clinicalAlerts.length > 0 ? "amber" : anamnesis ? "green" : "gray"
  const statusLabel = clinicalAlerts.length > 0 ? "Con alertas" : anamnesis ? "Actualizado" : "Sin registro"
  const statusClass =
    statusTone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : statusTone === "green"
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-slate-200 bg-slate-100 text-slate-600"

  const updateField = <K extends keyof UpdateAnamnesisInput>(key: K, value: UpdateAnamnesisInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setMessage("")

    try {
      const response = await saveAnamnesisService(patientId, form)
      setAnamnesis(response.anamnesis)
      setSavedForm(form)
      setMessage(response.message)
    } catch (saveError: any) {
      setError(saveError?.response?.data?.message || "Error al guardar la anamnesis")
    } finally {
      setSaving(false)
    }
  }

  const formatUpdatedAt = (value?: string) => {
    if (!value) return "Sin registros previos"

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
    return <p className="text-sm text-slate-400">Cargando anamnesis...</p>
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-[73px] z-20 bg-gray-100/95 pb-3 backdrop-blur">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400">Anamnesis</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{patientName}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {anamnesis ? "Módulo clínico editable del paciente." : "Todavía no hay anamnesis cargada para este paciente."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>
                  {statusLabel}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${hasUnsavedChanges ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}>
                  {hasUnsavedChanges ? "Cambios sin guardar" : "Guardado"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar anamnesis"}
            </button>
          </div>

          <div className="grid gap-3 px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
            <ReadOnlyCard label="Paciente" value={patientName} />
            <ReadOnlyCard label="Edad" value={patientAge?.toString() || "No registrada"} />
            <ReadOnlyCard label="Diagnóstico" value={patientDiagnosis || "Sin díagnóstico"} />
            <ReadOnlyCard label="Última actualizacion" value={formatUpdatedAt(anamnesis?.updatedAt)} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}

      {clinicalAlerts.length > 0 && (
        <div className="space-y-2">
          {clinicalAlerts.map((alert) => (
            <div key={alert} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
              {alert}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-6">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">I. Antecedentes generales</h4>
            <p className="mt-1 text-sm text-slate-500">Datos base del paciente y motivo de consulta.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyCard label="Nombre" value={patientName} />
            <ReadOnlyCard label="Edad" value={patientAge?.toString() || "No registrada en la ficha actual"} />
          </div>

          <div className="space-y-4">
            <TextCard
              label="Motivo de consulta"
              value={form.consultationReason || ""}
              onChange={(value) => updateField("consultationReason", value)}
              rows={4}
            />
            <TextCard
              label="Diagnóstico audiologico previo"
              value={form.previousAudiologicalDiagnosis || ""}
              onChange={(value) => updateField("previousAudiologicalDiagnosis", value)}
              rows={3}
            />
            <TextCard
              label="Última revision auditiva ORL o FONO"
              value={form.lastAuditoryReview || ""}
              onChange={(value) => updateField("lastAuditoryReview", value)}
              rows={3}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">II. Antecedentes personales</h4>
            <p className="mt-1 text-sm text-slate-500">Factores de riesgo, antecedentes de oído y hábitos relevantes.</p>
          </div>

          <div className="space-y-4">
            <BinaryField
              label="Diabetes Mellitus o inmunosupresión?"
              value={form.hasDiabetesOrImmunosuppression}
              onChange={(value) => updateField("hasDiabetesOrImmunosuppression", value)}
              help="Riesgo de otitis externa maligna."
            />

            <BinaryField
              label="Cirugías de oído previas?"
              value={form.hasPreviousEarSurgeries}
              onChange={(value) => updateField("hasPreviousEarSurgeries", value)}
              help="En caso positivo, requiere precaución clínica antes de realizar procedimiento."
            />

            {form.hasPreviousEarSurgeries && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 2xl:grid-cols-2">
                  <BinaryField label="Timpanoplastia" value={form.timpanoplastia} onChange={(value) => updateField("timpanoplastia", value)} />
                  <BinaryField label="Mastoidectomia" value={form.mastoidectomia} onChange={(value) => updateField("mastoidectomia", value)} />
                  <BinaryField label="Miringoplastia" value={form.miringoplastia} onChange={(value) => updateField("miringoplastia", value)} />
                  <BinaryField label="Osiculoplastia" value={form.osiculoplastia} onChange={(value) => updateField("osiculoplastia", value)} />
                  <BinaryField label="Estapedectomia / estapedotomia" value={form.estapedectomiaEstapedotomia} onChange={(value) => updateField("estapedectomiaEstapedotomia", value)} />
                </div>
              </div>
            )}

            <BinaryField
              label="Le realizaban cambuchos o se realiza cambucho?"
              value={form.usesCambuchos}
              onChange={(value) => updateField("usesCambuchos", value)}
            />

            <BinaryField
              label="Uso de audífonos?"
              value={form.usesHearingAid}
              onChange={(value) => updateField("usesHearingAid", value)}
            />

            {form.usesHearingAid && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <BinaryField
                  label="Siente que el audífono le ajusta menos o le molesta más últimamente?"
                  value={form.hearingAidFeelsLooserOrAnnoying}
                  onChange={(value) => updateField("hearingAidFeelsLooserOrAnnoying", value)}
                  help="Puede indicar inflamación del CAE."
                />
                <BinaryField
                  label="Ha notado que el audífono suena más bajo o tiene un pitido constante?"
                  value={form.hearingAidSoundsLowerOrWhistles}
                  onChange={(value) => updateField("hearingAidSoundsLowerOrWhistles", value)}
                  help="Puede sugerir tapón de cerumen."
                />
                <BinaryField
                  label="Presenta supuración o mal olor al quitarse el aparato?"
                  value={form.hearingAidSuppurationOrBadSmell}
                  onChange={(value) => updateField("hearingAidSuppurationOrBadSmell", value)}
                  help="Puede asociarse a otitis medía crónica o externa."
                />
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <label className="text-sm font-semibold text-slate-800">Cuántas horas al día lo utiliza?</label>
                  <input
                    type="text"
                    value={form.hearingAidHoursPerDay || ""}
                    onChange={(event) => updateField("hearingAidHoursPerDay", event.target.value)}
                    className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: 8 horas"
                  />
                </div>
              </div>
            )}

            <BinaryField
              label="Se limpia con cotonitos u objetos?"
              value={form.cleansWithCottonSwabsOrObjects}
              onChange={(value) => updateField("cleansWithCottonSwabsOrObjects", value)}
              help="Factor causal de tapón de cerumen impactado o traumatismo."
            />

            {form.cleansWithCottonSwabsOrObjects && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="text-sm font-semibold text-slate-800">Cuáles?</label>
                <input
                  type="text"
                  value={form.cleaningObjects || ""}
                  onChange={(event) => updateField("cleaningObjects", event.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: cotonitos, llaves, pinzas..."
                />
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
              <h4 className="text-lg font-semibold text-slate-900">III. Identificación de síntomas y asociación clínica</h4>
          <p className="mt-1 text-sm text-slate-500">Registro binario de sintomás presentes con apoyo clínico orientativo.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {SYMPTOM_GUIDANCE.map((symptom) => (
            <SymptomField
              key={symptom.key}
              label={symptom.label}
              value={Boolean(form[symptom.key])}
              onChange={(value) => updateField(symptom.key, value)}
              help={symptom.help}
              expanded={expandedSymptomGuidance === symptom.key}
              onToggleHelp={() =>
                setExpandedSymptomGuidance((current) => current === symptom.key ? null : symptom.key)
              }
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default AnamnesisSection
