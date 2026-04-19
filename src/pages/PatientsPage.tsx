import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { Patient, CreatePatientInput } from "../types/patient.types"
import {
  getPatientsService,
  createPatientService,
  deactivatePatientService
} from "../services/patient.service"

function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const data = await getPatientsService()
      setPatients(data)
    } catch {
      setError("Error al cargar los pacientes")
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return patients

    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(normalized) ||
      patient.email?.toLowerCase().includes(normalized) ||
      patient.phone?.toLowerCase().includes(normalized) ||
      patient.diagnosis?.toLowerCase().includes(normalized)
    )
  }, [patients, search])

  const patientsWithPortal = patients.filter((patient) => Boolean(patient.user)).length
  const patientsWithClinicalProgress = patients.filter(
    (patient) => Boolean(patient.anamnesis || patient.preLavadoEvaluation)
  ).length

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      const input: CreatePatientInput = {
        name,
        age: age ? Number(age) : undefined,
        email,
        phone
      }
      const newPatient = await createPatientService(input)
      setPatients((current) => [newPatient, ...current])
      setShowForm(false)
      setName("")
      setAge("")
      setEmail("")
      setPhone("")
    } catch {
      setError("Error al crear el paciente")
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm("¿Seguro que quieres desactivar este paciente?")) return

    try {
      await deactivatePatientService(id)
      setPatients((current) => current.filter((patient) => patient.id !== id))
    } catch {
      setError("Error al desactivar el paciente")
    }
  }

  return (
    <div className="space-y-5 p-3 sm:p-4 lg:p-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-slate-50 to-teal-50 px-5 py-6 shadow-[0_24px_50px_rgba(15,23,42,0.1)] sm:px-6 lg:px-8 lg:py-8">
        <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-teal-100 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-sky-100 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Módulo pacientes</p>
            <h2 className="fono-title mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Fichas claras, acceso rápido y menos fricción para el equipo.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              Organicé esta vista con foco en búsqueda, creación rápida y acceso directo al historial clínico para que el módulo sea útil desde móvil antes que desde escritorio.
            </p>
          </div>

          <button
            onClick={() => setShowForm((current) => !current)}
            className="inline-flex self-start rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.16)] transition hover:bg-slate-800"
          >
            {showForm ? "Cancelar" : "Nuevo paciente"}
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow-sm">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{patients.length}</p>
          <p className="mt-2 text-sm text-slate-500">pacientes activos en la base</p>
        </div>
        <div className="rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Portal</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{patientsWithPortal}</p>
          <p className="mt-2 text-sm text-slate-500">con acceso habilitado</p>
        </div>
        <div className="rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Avance clínico</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{patientsWithClinicalProgress}</p>
          <p className="mt-2 text-sm text-slate-500">con anamnesis o pre-lavado</p>
        </div>
      </section>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-[1.8rem] border border-white/70 bg-white/80 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Alta rápida</p>
              <h3 className="fono-title mt-2 text-2xl font-semibold text-slate-950">Nuevo paciente</h3>
            </div>
            {saving && <span className="text-sm font-semibold text-teal-700">Guardando ficha...</span>}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                placeholder="Nombre completo"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Edad</label>
              <input
                type="number"
                min="0"
                value={age}
                onChange={(event) => setAge(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                placeholder="Ej: 8"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                placeholder="email@ejemplo.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(20,184,166,0.18)] transition hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar paciente"}
            </button>
          </div>
        </form>
      )}

      <section className="rounded-[1.8rem] border border-white/70 bg-white/80 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Búsqueda y seguimiento</p>
            <h3 className="fono-title mt-2 text-2xl font-semibold text-slate-950">Pacientes registrados</h3>
          </div>

          <div className="relative w-full max-w-xl">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, contacto o diagnóstico"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                <circle cx="11" cy="11" r="6.5" />
              </svg>
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-[1.3rem] border border-slate-200 bg-slate-50/75 px-4 py-3 text-sm text-slate-500">
          {filteredPatients.length} resultado(s) visibles{search ? ` para “${search}”` : ""}.
        </div>

        {loading ? (
          <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-400">
            Cargando pacientes...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-400">
            No hay pacientes que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_14px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(15,23,42,0.1)]"
              >
                <div className="flex flex-col gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="text-lg font-semibold text-slate-950 transition hover:text-teal-700"
                      >
                        {patient.name}
                      </Link>
                      {patient.user && (
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                          Portal
                        </span>
                      )}
                      {patient.anamnesis && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          Anamnesis
                        </span>
                      )}
                      {patient.preLavadoEvaluation && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          Pre-lavado
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-500 sm:grid-cols-2">
                      <p className="min-w-0">
                        <span className="font-semibold text-slate-700">Edad:</span> {patient.age ?? "-"}
                      </p>
                      <p className="min-w-0 break-all">
                        <span className="font-semibold text-slate-700">Email:</span> {patient.email || "-"}
                      </p>
                      <p className="min-w-0 break-all">
                        <span className="font-semibold text-slate-700">Teléfono:</span> {patient.phone || "-"}
                      </p>
                      <p className="min-w-0">
                        <span className="font-semibold text-slate-700">Estado:</span> {patient.active ? "Activo" : "Inactivo"}
                      </p>
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                      {patient.diagnosis || "Sin diagnóstico registrado en la ficha base."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                    <Link
                      to={`/patients/${patient.id}`}
                      className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      Ver ficha
                    </Link>
                    <button
                      onClick={() => handleDeactivate(patient.id)}
                      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      Desactivar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default PatientsPage

