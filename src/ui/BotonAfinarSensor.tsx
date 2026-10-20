interface Props {
  nombreVariable: string
  afinada: boolean
  puedeAfinar: boolean
  costo: number
  onAfinar: () => void
}

export default function BotonAfinarSensor({ nombreVariable, afinada, puedeAfinar, costo, onAfinar }: Props) {
  if (afinada) {
    return <p className="flex min-h-11 items-center text-sm font-medium text-enlace">Sensor afinado</p>
  }
  return (
    <button
      type="button"
      onClick={onAfinar}
      disabled={!puedeAfinar}
      aria-label={`Afinar sensor de ${nombreVariable} (cuesta ${costo} de energía)`}
      className="min-h-11 rounded-lg px-3 text-sm font-medium text-enlace ring-1 ring-borde transition-colors hover:bg-elevado disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      Afinar (−{costo} energía)
    </button>
  )
}
