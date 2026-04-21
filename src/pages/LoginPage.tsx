import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import AppBrand from "../components/AppBrand"
import anaSolLoginImage from "../assets/ana-sol-login.webp"
import { useAuth } from "../context/authContext"
import { loginService } from "../services/auth.service"

const CERTIFICATIONS = [
  "Licenciada en Fonoaudiología · Universidad Andrés Bello",
  "Curso lavado de oidos · OTEC ACADEMY",
  "Curso IAAS · Perfecciona Capacitación en Salud",
  "Curso internacional en metodologías de investigación aplicadas a la Fonoaudiología · Universidad Europea de Madrid",
  "Curso internacional en gestión y emprendimiento en Fonoaudiología · Universidad Europea de Madrid"
]

const QUICK_POINTS = [
  "Seguimiento de pacientes y evolución clínica",
  "Objetivos terapéuticos y sesiones de intervención",
  "Agenda diaria y continuidad del proceso"
]

type LoginPageProps = {
  mode?: "professional" | "patient"
}

function LoginPage({ mode = "professional" }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const isPatientMode = mode === "patient"

  const pageCopy = isPatientMode
    ? {
        eyebrow: "Portal de pacientes",
        title: "Acceso a tu espacio personal",
        description:
          "Ingresa con tu correo y contraseña para revisar tus tareas, archivos y seguimiento indicado por tu fonoaudióloga.",
        profileTitle: "Acceso paciente",
        profileSubtitle: "Portal privado · Seguimiento terapéutico",
        buttonLabel: "Entrar al portal",
        emailPlaceholder: "tu correo registrado",
        alternateLabel: "¿Eres profesional?",
        alternateCta: "Ir al panel clínico",
        alternateHref: "/login",
        errorMessage: "No pudimos validar tu acceso como paciente"
      }
    : {
        eyebrow: "Inicio de sesión",
        title: "Acceso al panel clínico",
        description:
          "Ingresa con tu correo y contraseña para continuar tu jornada clínica y retomar el trabajo con cada paciente.",
        profileTitle: "Perfil activo",
        profileSubtitle: "Fonoaudióloga · Acceso privado",
        buttonLabel: "Entrar al panel",
        emailPlaceholder: "tu@centroclínico.com",
        alternateLabel: "¿Eres paciente?",
        alternateCta: "Ir a tu portal",
        alternateHref: "/portal/login",
        errorMessage: "Email o contraseña incorrectos"
      }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const data = await loginService({ email: normalizedEmail, password })
      login(data.token, data.user)
      navigate(data.user.role === "PATIENT" ? "/portal" : "/dashboard")
    } catch {
      setError(pageCopy.errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 top-12 h-52 w-52 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute right-[8%] top-[10%] h-72 w-72 rounded-full bg-sky-300/18 blur-3xl" />
        <div className="absolute bottom-[4%] left-[28%] h-64 w-64 rounded-full bg-cyan-200/12 blur-3xl" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-[1.18fr_0.82fr]">
        <section className="relative flex items-center px-5 py-8 sm:px-7 lg:px-10 lg:py-9 xl:px-12">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#020617_0%,#0f172a_42%,#134e4a_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_22%),radial-gradient(circle_at_80%_18%,rgba(45,212,191,0.18),transparent_24%),radial-gradient(circle_at_20%_80%,rgba(125,211,252,0.12),transparent_24%)]" />

          <div className="relative mx-auto grid w-full max-w-6xl gap-7 xl:grid-cols-[1fr_0.88fr] xl:items-center">
            <div className="max-w-2xl text-white">
              <div className="inline-flex items-center rounded-full border border-white/14 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
                Consulta fonoaudiologica
              </div>

              <div className="mt-5">
                <AppBrand />
              </div>

              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/85">
                Espacio profesional personalizado
              </p>
              <h1 className="fono-title mt-3 max-w-xl text-3xl font-semibold leading-tight text-white sm:text-4xl xl:text-5xl">
                Ana Sol Munizaga Saldaño
              </h1>
              <p className="mt-3 text-base font-medium text-teal-100/92 sm:text-lg">Estudiante de Fonoaudiología | Quinto Año</p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                Un acceso clínico pensado para revisar pacientes, ordenar objetivos terapéuticos,
                planificar sesiones y sostener una experiencia de atención más clara y profesional.
              </p>

              <div className="mt-7 grid gap-3">
                {QUICK_POINTS.map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/10 px-4 py-3.5 text-sm font-medium text-white/90 backdrop-blur-sm"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    {point}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm sm:p-5.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                      Formacion y certificaciones
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Presentación profesional
                    </h2>
                  </div>
                  
                </div>

                <div className="mt-6 grid gap-3">
                  {CERTIFICATIONS.map((credential, index) => (
                    <div
                      key={credential}
                      className="flex items-start gap-4 rounded-[1.3rem] border border-white/8 bg-slate-950/24 px-4 py-4"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-300/18 text-sm font-semibold text-teal-100">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-7 text-white/84 sm:text-[15px]">
                        {credential}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[620px]">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/10 p-4 shadow-[0_28px_64px_rgba(15,23,42,0.26)] backdrop-blur-md sm:p-5">
                <div className="absolute inset-x-10 top-6 h-24 rounded-full bg-white/10 blur-3xl" />
                <img
                  src={anaSolLoginImage}
                  alt="Retrato ilustrado de Ana Sol Munizaga Saldaño"
                  className="relative h-[360px] w-full rounded-[1.6rem] object-contain object-top sm:h-[500px] xl:h-[600px]"
                />
                <div className="relative mt-5 rounded-[1.4rem] border border-white/10 bg-slate-950/35 px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                    Perfil clínico
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/92 sm:text-base">
                    Atención terapéutica enfocada en continuidad, seguimiento y objetivos de intervención.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center px-5 py-8 sm:px-7 lg:px-9 xl:px-10">
          <div className="absolute inset-0 bg-white/88 backdrop-blur-xl" />

          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-[1.8rem] border border-white/80 bg-white px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.10)] sm:px-6 sm:py-7">
              <div className="lg:hidden">
                <AppBrand />
              </div>

              <div className="mt-6 lg:mt-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {pageCopy.eyebrow}
                </p>
                <h2 className="fono-title mt-3 text-[1.85rem] font-semibold text-slate-950">
                  {pageCopy.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">{pageCopy.description}</p>
              </div>

              <div className="mt-6 rounded-[1.4rem] border border-slate-200 bg-slate-50/85 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {pageCopy.profileTitle}
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  Ana Sol Munizaga Saldano
                </p>
                <p className="mt-1 text-sm text-slate-500">{pageCopy.profileSubtitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    placeholder={pageCopy.emailPlaceholder}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                    <span className="text-xs font-medium text-slate-400">Sesión segura</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Ingresando..." : pageCopy.buttonLabel}
                </button>
              </form>

              <div className="mt-6 rounded-[1.4rem] border border-teal-100 bg-teal-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                  {pageCopy.alternateLabel}
                </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                  Usa el acceso correspondiente, revisa tus objetivos y tareas asignadas
                </p>
                <Link
                  to={pageCopy.alternateHref}
                  className="mt-4 inline-flex items-center rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
                >
                  {pageCopy.alternateCta}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LoginPage
