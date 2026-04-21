function AppBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_16px_34px_rgba(15,23,42,0.12)]">
        <span className="absolute inset-x-1.5 top-1.5 h-4 rounded-full bg-teal-100" />
        <span className="absolute bottom-1.5 left-1.5 h-5 w-5 rounded-xl bg-sky-100" />
        <span className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full bg-amber-200" />
        <span className="relative font-black leading-none text-teal-700 text-[1.45rem]">F</span>
      </div>
      <div className="min-w-0">
        <p className={`fono-title font-semibold text-teal-400 ${compact ? "text-lg" : "text-2xl"}`}>
          FonoWebApp
        </p>
        
      </div>
    </div>
  )
}

export default AppBrand

