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
          ? 'border-acento bg-acento-suave ring-2 ring-acento'
          : 'border-borde bg-superficie hover:border-borde-fuerte'
      }`}
    >
      <span className="flex w-full items-center justify-between gap-2 font-semibold">
        {nombre}
        <span
          aria-hidden="true"
          className={`grid size-5 place-items-center rounded-md border text-xs ${
            seleccionado ? 'border-acento bg-acento text-sobre-acento' : 'border-borde-fuerte'
          }`}
        >
          {seleccionado ? '✓' : ''}
        </span>
      </span>
      <span className="text-sm text-texto-suave">
        {cambios.map((cambio, i) => (
          <span key={cambio.variable}>
            {i > 0 && ' · '}
            {formatearCambio(cambio)}
            {reducidoPorDeshidratacion && cambio.variable === 'temperatura' && (
              <span className="font-medium text-zona-amarilla-texto"> (deshidratado)</span>
            )}
          </span>
        ))}
      </span>
      {ocupaTurnoCompleto && (
        <span className="text-xs text-texto-tenue">Ocupa los {efectoresPorTurno} efectores del turno</span>
      )}
    </button>
  )
}
