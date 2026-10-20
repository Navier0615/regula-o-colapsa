interface Props {
  turno: number
  totalTurnos: number
  franja: string
  nombre: string
  puntaje: number
}

export default function EncabezadoTurno({ turno, totalTurnos, franja, nombre, puntaje }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm text-slate-400">
          Turno {turno} de {totalTurnos} · {franja}
        </p>
        <h2 className="text-2xl font-bold">{nombre}</h2>
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className="text-sm text-slate-300">
          <span className="text-lg font-semibold text-slate-100">{puntaje}</span> puntos
        </p>
        <ol className="flex gap-1" aria-label={`Progreso: turno ${turno} de ${totalTurnos}`}>
          {Array.from({ length: totalTurnos }, (_, i) => (
            <li
              key={i}
              className={`h-1.5 w-4 rounded-full ${i < turno - 1 ? 'bg-sky-400' : i === turno - 1 ? 'bg-sky-200' : 'bg-slate-700'}`}
            />
          ))}
        </ol>
      </div>
    </header>
  )
}
