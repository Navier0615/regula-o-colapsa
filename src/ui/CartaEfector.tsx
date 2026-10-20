import type { VistaEfector } from '../state/selectors.ts'
import { formatearCambio } from './formato.ts'

interface Props {
  efector: VistaEfector
  efectoresPorTurno: number
  onAlternar: () => void
}

export default function CartaEfector({ efector, efectoresPorTurno, onAlternar }: Props) {
  const { nombre, cambios, reducidoPorDeshidratacion, ocupaTurnoCompleto, seleccionado, habilitado } = efector
  return (
    <button
      type="button"
      onClick={onAlternar}
      disabled={!habilitado}
      aria-pressed={seleccionado}
      className={`flex min-h-11 w-full flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        seleccionado
          ? 'border-sky-400 bg-sky-950/60 ring-2 ring-sky-400'
          : 'border-slate-700 bg-slate-900 hover:border-slate-500'
      }`}
    >
      <span className="flex w-full items-center justify-between gap-2 font-semibold">
        {nombre}
        <span
          aria-hidden="true"
          className={`grid size-5 place-items-center rounded-md border text-xs ${
            seleccionado ? 'border-sky-400 bg-sky-400 text-slate-950' : 'border-slate-600'
          }`}
        >
          {seleccionado ? '✓' : ''}
        </span>
      </span>
      <span className="text-sm text-slate-300">
        {cambios.map((cambio, i) => (
          <span key={cambio.variable}>
            {i > 0 && ' · '}
            {formatearCambio(cambio)}
            {reducidoPorDeshidratacion && cambio.variable === 'temperatura' && (
              <span className="text-amber-300"> (deshidratado)</span>
            )}
          </span>
        ))}
      </span>
      {ocupaTurnoCompleto && (
        <span className="text-xs text-slate-400">Ocupa los {efectoresPorTurno} efectores del turno</span>
      )}
    </button>
  )
}
