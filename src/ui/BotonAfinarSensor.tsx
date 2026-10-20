interface Props {
  nombreVariable: string
  afinada: boolean
  puedeAfinar: boolean
  costo: number
  onAfinar: () => void
}

export default function BotonAfinarSensor({ nombreVariable, afinada, puedeAfinar, costo, onAfinar }: Props) {
  if (afinada) {
    return <p className="flex min-h-11 items-center text-sm font-medium text-sky-300">Sensor afinado</p>
  }
  return (
    <button
      type="button"
      onClick={onAfinar}
      disabled={!puedeAfinar}
      aria-label={`Afinar sensor de ${nombreVariable} (cuesta ${costo} de energía)`}
      className="min-h-11 rounded-lg px-3 text-sm font-medium text-sky-300 ring-1 ring-slate-700 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      Afinar (−{costo} energía)
    </button>
  )
}
