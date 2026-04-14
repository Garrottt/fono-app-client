import { useState, useEffect } from "react"
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
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const data = await getPatientsService()
      setPatients(data)
    } catch (err) {
      setError("Error al cargar los pacientes")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
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
      setPatients([newPatient, ...patients])
      setShowForm(false)
      setName("")
      setAge("")
      setEmail("")
      setPhone("")
    } catch (err) {
      setError("Error al crear el paciente")
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm("Estas seguro de desactivar este paciente?")) return

    try {
      await deactivatePatientService(id)
      setPatients(patients.filter((patient) => patient.id !== id))
    } catch (err) {
      setError("Error al desactivar el paciente")
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Pacientes</h2>
          <p className="mt-1 text-sm text-gray-500">Gestiona la ficha base de cada paciente desde cualquier pantalla.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 md:w-auto"
        >
          {showForm ? "Cancelar" : "+ Nuevo paciente"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm sm:p-6"
        >
          <h3 className="text-lg font-medium text-gray-700">Nuevo paciente</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nombre completo"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Edad</label>
              <input
                type="number"
                min="0"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: 8"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="email@ejemplo.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Telefono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
            >
              {saving ? "Guardando..." : "Guardar paciente"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando pacientes...</p>
      ) : patients.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-gray-400">No hay pacientes registrados todavia.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm xl:block">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Nombre</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Edad</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Email</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Telefono</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((patient) => (
                  <tr key={patient.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="font-medium text-indigo-600 transition-colors hover:text-indigo-800"
                      >
                        {patient.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{patient.age ?? "-"}</td>
                    <td className="px-6 py-4 text-gray-500">{patient.email || "-"}</td>
                    <td className="px-6 py-4 text-gray-500">{patient.phone || "-"}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeactivate(patient.id)}
                        className="text-xs font-medium text-red-500 transition-colors hover:text-red-700"
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 xl:hidden">
            {patients.map((patient) => (
              <div key={patient.id} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      to={`/patients/${patient.id}`}
                      className="text-base font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
                    >
                      {patient.name}
                    </Link>
                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2">
                      <p><span className="text-gray-400">Edad:</span> {patient.age ?? "-"}</p>
                      <p><span className="text-gray-400">Email:</span> {patient.email || "-"}</p>
                      <p><span className="text-gray-400">Telefono:</span> {patient.phone || "-"}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeactivate(patient.id)}
                    className="text-left text-xs font-medium text-red-500 transition-colors hover:text-red-700 sm:text-right"
                  >
                    Desactivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default PatientsPage
