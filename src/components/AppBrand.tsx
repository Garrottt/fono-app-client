function AppBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        <span className="absolute left-[4px] top-[4px] h-5 w-5 rounded-[7px] bg-indigo-500/18" />
        <span className="absolute left-[8px] top-[2px] h-5 w-5 rounded-[7px] bg-indigo-500/10" />
        <span className="relative text-[22px] font-black leading-none text-indigo-600">F</span>
      </div>
      <div className="min-w-0">
        <p className={`${compact ? "text-lg" : "text-xl"} font-bold tracking-tight text-slate-900`}>
          FonoWebApp
        </p>
      </div>
    </div>
  )
}

export default AppBrand
