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
    help: "Asociado a otitis externa bacteriana, otitis media aguda, dermatitis del CAE e impactacion de cerumen."
  },
  {
    key: "prurito",
    label: "Prurito (picazon)",
    help: "Sintoma principal en otomicosis, dermatitis o eczema y etapas iniciales de otitis externa bacteriana."
  },
  {
    key: "hipoacusia",
    label: "Hipoacusia (baja audicion)",
    help: "Puede aparecer en tapon de cerumen, cuerpo extrano, otitis media con efusion, perforacion timpanica y OMA."
  },
  {
    key: "otorrea",
    label: "Otorrea (secrecion)",
    help: "Presente en otitis media cronica, OMA con perforacion, otitis externa bacteriana y otomicosis."
  },
  {
    key: "otorragia",
    label: "Otorragia (sangrado)",
    help: "Puede sugerir perforacion timpanica traumatica, heridas por cotonitos u otitis externa maligna."
  },
  {
    key: "plenitudOtica",
    label: "Plenitud otica (oido tapado)",
    help: "Relacionada con tapon de cerumen, disfuncion tubaria, otitis media con efusion y cuerpos extranos."
  },
  {
    key: "tinnitus",
    label: "Tinnitus (zumbidos)",
    help: "Se observa en tapon de cerumen, perforacion timpanica y cuadros de oido interno."
  },
  {
    key: "vertigoInestabilidad",
    label: "Vertigo / inestabilidad",
    help: "Puede asociarse a compromiso vestibular, perforacion timpanica o sensibilidad a irrigacion."
  },
  {
    key: "autofonia",
    label: "Autofonia (oir su voz)",
    help: "Frecuente en disfuncion tubaria y oido medio con efusion."
  }
] as const

function BooleanField({
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
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {help && <p className="mt-1 text-xs text-gray-500 leading-relaxed">{help}</p>}
        </div>
        <div className="flex rounded-md border border-gray-200 overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`px-3 py-1.5 text-sm transition-colors ${value ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            Si
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`px-3 py-1.5 text-sm transition-colors ${!value ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            No
          </button>
        </div>
      </div>
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
      } catch (fetchError) {
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
      alerts.push("Riesgo clinico a revisar antes de intervenir: antecedentes de diabetes mellitus o inmunosupresion.")
    }

    if (form.hasPreviousEarSurgeries) {
      alerts.push("Precaucion: antecedente asociado a no realizar procedimiento sin reevaluacion clinica.")
    }

    if (form.otorrea) {
      alerts.push("Precaucion: la presencia de otorrea se asocia a no realizar procedimiento hasta evaluar causa clinica.")
    }

    if (form.otorragia) {
      alerts.push("Precaucion: la presencia de otorragia requiere revision clinica previa y se asocia a no realizar procedimiento.")
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
        : "border-gray-200 bg-gray-100 text-gray-600"

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
    return <p className="text-gray-400 text-sm">Cargando anamnesis...</p>
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-[73px] z-20 bg-gray-100/95 backdrop-blur pb-2">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-medium text-gray-800">Anamnesis</h3>
              <p className="text-sm text-gray-500">
                {anamnesis ? "Registro editable de antecedentes clinicos." : "Todavia no hay anamnesis cargada para este paciente."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>
                {statusLabel}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${hasUnsavedChanges ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-100 text-gray-500"}`}>
                {hasUnsavedChanges ? "Cambios sin guardar" : "Guardado"}
              </span>
            </div>
            <div className="grid gap-1 text-xs text-gray-500">
              <p>Paciente: <span className="font-medium text-gray-700">{patientName}</span></p>
              <p>Edad: <span className="font-medium text-gray-700">{patientAge ?? "No registrada"}</span></p>
              <p>Diagnostico: <span className="font-medium text-gray-700">{patientDiagnosis || "Sin diagnostico"}</span></p>
              <p>Ultima actualizacion: <span className="font-medium text-gray-700">{formatUpdatedAt(anamnesis?.updatedAt)}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar anamnesis"}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}

      {clinicalAlerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {clinicalAlerts.map((alert) => (
            <div key={alert} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {alert}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col gap-8">
        <section className="space-y-4">
          <div>
            <h4 className="text-base font-medium text-gray-800">I. Antecedentes generales</h4>
            <p className="text-sm text-gray-500 mt-1">Datos base del paciente y motivo de consulta.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-400 mb-1">Nombre</p>
              <p className="text-sm text-gray-800">{patientName}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-400 mb-1">Edad</p>
              <p className="text-sm text-gray-800">{patientAge ?? "No registrada en la ficha actual"}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Motivo de consulta</label>
              <textarea
                value={form.consultationReason || ""}
                onChange={(event) => updateField("consultationReason", event.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Diagnostico audiologico previo</label>
              <textarea
                value={form.previousAudiologicalDiagnosis || ""}
                onChange={(event) => updateField("previousAudiologicalDiagnosis", event.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Ultima revision auditiva ORL o FONO</label>
              <textarea
                value={form.lastAuditoryReview || ""}
                onChange={(event) => updateField("lastAuditoryReview", event.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={2}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h4 className="text-base font-medium text-gray-800">II. Antecedentes personales</h4>
            <p className="text-sm text-gray-500 mt-1">Factores de riesgo, antecedentes de oido y habitos relevantes.</p>
          </div>

          <div className="grid gap-4">
            <BooleanField
              label="¿Diabetes Mellitus o inmunosupresion?"
              value={form.hasDiabetesOrImmunosuppression}
              onChange={(value) => updateField("hasDiabetesOrImmunosuppression", value)}
              help="Riesgo de otitis externa maligna."
            />

            <BooleanField
              label="¿Cirugias de oido previas?"
              value={form.hasPreviousEarSurgeries}
              onChange={(value) => updateField("hasPreviousEarSurgeries", value)}
              help="En caso positivo, requiere precaucion clinica antes de realizar procedimiento."
            />

            {form.hasPreviousEarSurgeries && (
              <div className="grid md:grid-cols-2 gap-3">
                <BooleanField label="Timpanoplastia" value={form.timpanoplastia} onChange={(value) => updateField("timpanoplastia", value)} />
                <BooleanField label="Mastoidectomia" value={form.mastoidectomia} onChange={(value) => updateField("mastoidectomia", value)} />
                <BooleanField label="Miringoplastia" value={form.miringoplastia} onChange={(value) => updateField("miringoplastia", value)} />
                <BooleanField label="Osiculoplastia" value={form.osiculoplastia} onChange={(value) => updateField("osiculoplastia", value)} />
                <BooleanField label="Estapedectomia / estapedotomia" value={form.estapedectomiaEstapedotomia} onChange={(value) => updateField("estapedectomiaEstapedotomia", value)} />
              </div>
            )}

            <BooleanField
              label="¿Le realizaban cambuchos o se realiza cambucho?"
              value={form.usesCambuchos}
              onChange={(value) => updateField("usesCambuchos", value)}
            />

            <BooleanField
              label="¿Uso de audifonos?"
              value={form.usesHearingAid}
              onChange={(value) => updateField("usesHearingAid", value)}
            />

            {form.usesHearingAid && (
              <div className="grid gap-3">
                <BooleanField
                  label="¿Siente que el audifono le ajusta menos o le molesta mas ultimamente?"
                  value={form.hearingAidFeelsLooserOrAnnoying}
                  onChange={(value) => updateField("hearingAidFeelsLooserOrAnnoying", value)}
                  help="Puede indicar inflamacion del CAE."
                />
                <BooleanField
                  label="¿Ha notado que el audifono suena mas bajo o tiene un pitido constante?"
                  value={form.hearingAidSoundsLowerOrWhistles}
                  onChange={(value) => updateField("hearingAidSoundsLowerOrWhistles", value)}
                  help="Puede sugerir tapon de cerumen."
                />
                <BooleanField
                  label="¿Presenta supuracion o mal olor al quitarse el aparato?"
                  value={form.hearingAidSuppurationOrBadSmell}
                  onChange={(value) => updateField("hearingAidSuppurationOrBadSmell", value)}
                  help="Puede asociarse a otitis media cronica o externa."
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">¿Cuantas horas al dia lo utiliza?</label>
                  <input
                    type="text"
                    value={form.hearingAidHoursPerDay || ""}
                    onChange={(event) => updateField("hearingAidHoursPerDay", event.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: 8 horas"
                  />
                </div>
              </div>
            )}

            <BooleanField
              label="¿Se limpia con cotonitos u objetos?"
              value={form.cleansWithCottonSwabsOrObjects}
              onChange={(value) => updateField("cleansWithCottonSwabsOrObjects", value)}
              help="Factor causal de tapon de cerumen impactado o traumatismo."
            />

            {form.cleansWithCottonSwabsOrObjects && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">¿Cuales?</label>
                <input
                  type="text"
                  value={form.cleaningObjects || ""}
                  onChange={(event) => updateField("cleaningObjects", event.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: cotonitos, llaves, pinzas..."
                />
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h4 className="text-base font-medium text-gray-800">III. Identificacion de sintomas y asociacion clinica</h4>
            <p className="text-sm text-gray-500 mt-1">Registro binario de sintomas presentes con apoyo clinico orientativo.</p>
          </div>

          <div className="grid gap-3">
            {SYMPTOM_GUIDANCE.map((symptom) => (
              <BooleanField
                key={symptom.key}
                label={symptom.label}
                value={Boolean(form[symptom.key])}
                onChange={(value) => updateField(symptom.key, value)}
                help={symptom.help}
              />
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

export default AnamnesisSection
