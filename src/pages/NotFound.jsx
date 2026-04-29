export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50">
        Error 404
      </p>
      <h1 className="font-display text-5xl font-light italic text-ink md:text-7xl">
        Página no encontrada
      </h1>
    </div>
  )
}
