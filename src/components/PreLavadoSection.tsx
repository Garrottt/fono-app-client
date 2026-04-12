import { useEffect, useMemo, useState } from "react"
import {
  downloadPreLavadoPdfService,
  getPreLavadoService,
  savePreLavadoService
} from "../services/prelavado.service"
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
  { value: "malformacion", label: "Malformacion" }
]

const CAE_OPTIONS: Array<{ value: CaeObservation; label: string }> = [
  { value: "limpio", label: "Limpio" },
  { value: "eritematoso", label: "Eritematoso" },
  { value: "edematoso", label: "Edematoso" },
  { value: "presencia_hongos", label: "Presencia de hongos" }
]

const MEMBRANA_OPTIONS: Array<{ value: MembranaObservation; label: string }> = [
  { value: "integra", label: "Integra" },
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
    criticalBlocks.push("Cirugias previas detectadas. No apto para lavado por riesgo clinico y legal.")
  }

  if (form.hasDiabetesOrImmunosuppression) {
    criticalBlocks.push("Diabetes o inmunosupresion detectada. No apto para lavado por riesgo de otitis externa maligna.")
  }

  if (form.hasKnownPerforation || hasMembranePerforation) {
    criticalBlocks.push("Perforacion timpanica conocida o sospechada. No apto para lavado.")
  }

  if (form.otorrea) {
    precautionAlerts.push("ALERTA: Presencia de secrecion. Evaluar consistencia y olor. Si es purulenta, evitar irrigacion.")
  }

  if (form.prurito) {
    precautionAlerts.push("ALERTA: Picazon intensa detectada. Posible otomicosis. Si se confirman hongos en otoscopia, derivar y no irrigar.")
  }

  if (form.otorragia) {
    precautionAlerts.push("ALERTA: Sangrado detectado. Evaluar si corresponde a trauma o lesion interna antes de proceder.")
  }

  if (form.usesHearingAid && form.hearingAidBadSmell) {
    precautionAlerts.push("ALERTA: Mal olor asociado al uso de audifonos. Evaluar posible proceso infeccioso antes del lavado.")
  }

  let diagnosticSummary = "Sin hipotesis automatica concluyente"
  let suggestedConduct = "Continuar evaluacion clinica y confirmar conducta profesional segun hallazgos."

  if ((form.prurito && form.otorrea) || hasFungi) {
    diagnosticSummary = "Sospecha de Otomicosis"
    suggestedConduct = "Se recomienda DERIVAR. Evitar humedad en el conducto."
  } else if (form.otalgia && form.dolorAlTocarTrago) {
    diagnosticSummary = "Signos de Otitis Externa"
    suggestedConduct = "Evaluar tratamiento medico antes de limpieza."
  } else if (form.hipoacusia && form.plenitudOtica && !form.otalgia) {
    diagnosticSummary = "Compatible con Tapon de Cerumen"
    suggestedConduct = "Proceder a otoscopia para confirmar extraccion."
  }

  return {
    aptoParaLavado: criticalBlocks.length === 0,
    criticalBlocks,
    precautionAlerts,
    diagnosticSummary,
    suggestedConduct
  }
}

function BooleanToggle({
  label,
  value,
  onChange
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`px-3 py-1.5 text-sm ${value ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            Si
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`px-3 py-1.5 text-sm ${!value ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            No
          </button>
        </div>
      </div>
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
      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function PreLavadoSection({ patientId, patientName, patientAge, patientDiagnosis }: Props) {
  const [evaluation, setEvaluation] = useState<PreLavadoEvaluation | null>(null)
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
      } catch (fetchError) {
        setError("Error al cargar la evaluacion pre-lavado")
      } finally {
        setLoading(false)
      }
    }

    fetchEvaluation()
  }, [patientId])

  const derived = useMemo(() => computeLiveResult(form), [form])
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm]
  )

  const updateField = <K extends keyof UpdatePreLavadoInput>(key: K, value: UpdatePreLavadoInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setMessage("")

    try {
      const response = await savePreLavadoService(patientId, form)
      setEvaluation(response.evaluation)
      setSavedForm(form)
      setMessage(response.message)
    } catch (saveError: any) {
      setError(saveError?.response?.data?.message || "Error al guardar la evaluacion pre-lavado")
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
    return <p className="text-sm text-gray-400">Cargando evaluacion pre-lavado...</p>
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-[73px] z-20 bg-gray-100/95 backdrop-blur pb-2">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-medium text-gray-800">Evaluacion Pre-Lavado</h3>
              <p className="text-sm text-gray-500 mt-1">
                Registro tecnico para soporte clinico durante la consulta.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${derived.aptoParaLavado ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                {derived.aptoParaLavado ? "Apto para lavado" : "No apto para lavado"}
              </span>
              {derived.precautionAlerts.length > 0 && (
                <span className="rounded-full border border-amber-200 bg-amber-50 text-amber-900 px-3 py-1 text-xs font-medium">
                  Con alertas
                </span>
              )}
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${hasUnsavedChanges ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-100 text-gray-500"}`}>
                {hasUnsavedChanges ? "Cambios sin guardar" : "Guardado"}
              </span>
            </div>

            <div className="grid gap-1 text-xs text-gray-500">
              <p>Paciente: <span className="font-medium text-gray-700">{patientName}</span></p>
              <p>Edad: <span className="font-medium text-gray-700">{patientAge ?? "No registrada"}</span></p>
              <p>Diagnostico: <span className="font-medium text-gray-700">{patientDiagnosis || "Sin diagnostico"}</span></p>
              <p>Ultima actualizacion: <span className="font-medium text-gray-700">{formatUpdatedAt(evaluation?.updatedAt)}</span></p>
              <p>Hipotesis: <span className="font-medium text-gray-700">{derived.diagnosticSummary}</span></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading || !evaluation}
              className="border border-indigo-200 text-indigo-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              {downloading ? "Generando PDF..." : "Generar Ficha de Evaluacion"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar evaluacion"}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
        <section className="space-y-4">
          <div>
            <h4 className="text-base font-medium text-gray-800">Antecedentes y sintomas clave</h4>
            <p className="text-sm text-gray-500 mt-1">Estos datos activan alertas, bloqueos y la hipotesis automatica.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <BooleanToggle label="Diabetes o inmunosupresion" value={form.hasDiabetesOrImmunosuppression} onChange={(value) => updateField("hasDiabetesOrImmunosuppression", value)} />
            <BooleanToggle label="Cirugias previas" value={form.hasPreviousEarSurgeries} onChange={(value) => updateField("hasPreviousEarSurgeries", value)} />
            <BooleanToggle label="Perforacion timpanica conocida" value={form.hasKnownPerforation} onChange={(value) => updateField("hasKnownPerforation", value)} />
            <BooleanToggle label="Otalgia" value={form.otalgia} onChange={(value) => updateField("otalgia", value)} />
            <BooleanToggle label="Hipoacusia" value={form.hipoacusia} onChange={(value) => updateField("hipoacusia", value)} />
            <BooleanToggle label="Plenitud otica" value={form.plenitudOtica} onChange={(value) => updateField("plenitudOtica", value)} />
            <BooleanToggle label="Otorrea" value={form.otorrea} onChange={(value) => updateField("otorrea", value)} />
            <BooleanToggle label="Prurito" value={form.prurito} onChange={(value) => updateField("prurito", value)} />
            <BooleanToggle label="Otorragia" value={form.otorragia} onChange={(value) => updateField("otorragia", value)} />
            <BooleanToggle label="Dolor al tocar trago" value={form.dolorAlTocarTrago} onChange={(value) => updateField("dolorAlTocarTrago", value)} />
            <BooleanToggle label="Uso de audifonos" value={form.usesHearingAid} onChange={(value) => updateField("usesHearingAid", value)} />
            {form.usesHearingAid ? (
              <BooleanToggle label="Mal olor con audifonos" value={form.hearingAidBadSmell} onChange={(value) => updateField("hearingAidBadSmell", value)} />
            ) : (
              <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-400">
                Al marcar uso de audifonos se habilitan subpreguntas relacionadas.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h4 className="text-base font-medium text-gray-800">IV. Evaluacion otoscopica pre-lavado</h4>
            <p className="text-sm text-gray-500 mt-1">Registro comparativo por oido derecho y oido izquierdo.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4 font-medium">Estructura</th>
                  <th className="py-2 pr-4 font-medium">OD</th>
                  <th className="py-2 pr-4 font-medium">OI</th>
                  <th className="py-2 pr-4 font-medium">Observacion OD</th>
                  <th className="py-2 font-medium">Observacion OI</th>
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-700">Pabellon auricular</td>
                  <td className="py-3 pr-4"><SelectField value={form.odPabellonEstado} options={STATUS_OPTIONS} onChange={(value) => updateField("odPabellonEstado", value)} /></td>
                  <td className="py-3 pr-4"><SelectField value={form.oiPabellonEstado} options={STATUS_OPTIONS} onChange={(value) => updateField("oiPabellonEstado", value)} /></td>
                  <td className="py-3 pr-4"><SelectField value={form.odPabellonObservacion} options={PABELLON_OPTIONS} onChange={(value) => updateField("odPabellonObservacion", value)} /></td>
                  <td className="py-3"><SelectField value={form.oiPabellonObservacion} options={PABELLON_OPTIONS} onChange={(value) => updateField("oiPabellonObservacion", value)} /></td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-700">CAE</td>
                  <td className="py-3 pr-4"><SelectField value={form.odCaeEstado} options={STATUS_OPTIONS} onChange={(value) => updateField("odCaeEstado", value)} /></td>
                  <td className="py-3 pr-4"><SelectField value={form.oiCaeEstado} options={STATUS_OPTIONS} onChange={(value) => updateField("oiCaeEstado", value)} /></td>
                  <td className="py-3 pr-4"><SelectField value={form.odCaeObservacion} options={CAE_OPTIONS} onChange={(value) => updateField("odCaeObservacion", value)} /></td>
                  <td className="py-3"><SelectField value={form.oiCaeObservacion} options={CAE_OPTIONS} onChange={(value) => updateField("oiCaeObservacion", value)} /></td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-700">Membrana</td>
                  <td className="py-3 pr-4"><SelectField value={form.odMembranaEstado} options={STATUS_OPTIONS} onChange={(value) => updateField("odMembranaEstado", value)} /></td>
                  <td className="py-3 pr-4"><SelectField value={form.oiMembranaEstado} options={STATUS_OPTIONS} onChange={(value) => updateField("oiMembranaEstado", value)} /></td>
                  <td className="py-3 pr-4"><SelectField value={form.odMembranaObservacion} options={MEMBRANA_OPTIONS} onChange={(value) => updateField("odMembranaObservacion", value)} /></td>
                  <td className="py-3"><SelectField value={form.oiMembranaObservacion} options={MEMBRANA_OPTIONS} onChange={(value) => updateField("oiMembranaObservacion", value)} /></td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-700">Escala de Sullivan</td>
                  <td className="py-3 pr-4">
                    <select value={form.odSullivan} onChange={(event) => updateField("odSullivan", event.target.value as SullivanScale)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full">
                      {SULLIVAN_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </td>
                  <td className="py-3 pr-4">
                    <select value={form.oiSullivan} onChange={(event) => updateField("oiSullivan", event.target.value as SullivanScale)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full">
                      {SULLIVAN_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">-</td>
                  <td className="py-3 text-gray-400">-</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-gray-700">Observaciones libres</td>
                  <td colSpan={2} className="py-3 pr-4">
                    <textarea
                      value={form.odObservaciones || ""}
                      onChange={(event) => updateField("odObservaciones", event.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none w-full"
                      rows={3}
                      placeholder="Observaciones OD"
                    />
                  </td>
                  <td colSpan={2} className="py-3">
                    <textarea
                      value={form.oiObservaciones || ""}
                      onChange={(event) => updateField("oiObservaciones", event.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none w-full"
                      rows={3}
                      placeholder="Observaciones OI"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h4 className="text-base font-medium text-gray-800">Cierre clinico</h4>
            <p className="text-sm text-gray-500 mt-1">Resumen automatico segun los datos cargados.</p>
          </div>

          <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${derived.aptoParaLavado ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {derived.aptoParaLavado ? "Apto para lavado" : "No apto para lavado"}
          </div>

          {derived.criticalBlocks.length > 0 && (
            <div className="space-y-2">
              {derived.criticalBlocks.map((block) => (
                <div key={block} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {block}
                </div>
              ))}
            </div>
          )}

          {derived.precautionAlerts.length > 0 && (
            <div className="space-y-2">
              {derived.precautionAlerts.map((alert) => (
                <div key={alert} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {alert}
                </div>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-400 mb-1">Hipotesis diagnostica sugerida</p>
              <p className="text-sm text-gray-800">{derived.diagnosticSummary}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-400 mb-1">Conducta sugerida</p>
              <p className="text-sm text-gray-800">{derived.suggestedConduct}</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

export default PreLavadoSection
