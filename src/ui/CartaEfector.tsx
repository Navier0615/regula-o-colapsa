import { REGLAS_VISIBLES, type MotivoBloqueo, type Variable, type VistaEfector } from '../state/selectors.ts'
import IconoEfector from './IconoEfector.tsx'
import { formatearDelta } from './formato.ts'

const { agotamiento, efectoresPorTurno } = REGLAS_VISIBLES

/** Color de la carta según la variable que regula su efecto principal. */
const CATEGORIA: Readonly<Record<Variable, { cabecera: string; texto: string; borde: string }>> = {
  temperatura: { cabecera: 'bg-cat-temperatura', texto: 'text-cat-temperatura', borde: 'border-cat-temperatura/50' },
  glucosa: { cabecera: 'bg-cat-glucosa', texto: 'text-cat-glucosa', borde: 'border-cat-glucosa/50' },
  hidratacion: { cabecera: 'bg-cat-hidratacion', texto: 'text-cat-hidratacion', borde: 'border-cat-hidratacion/50' },
  energia: { cabecera: 'bg-cat-energia', texto: 'text-cat-energia', borde: 'border-cat-energia/50' },
}

function textoMotivo(motivo: MotivoBloqueo): string {
  switch (motivo) {
    // Forma corta del síntoma; el mensaje completo ya está sobre las cartas y junto a Confirmar.
    case 'agotamiento':
      return `Agotado: solo ${agotamiento.efectoresPermitidos} efector`
    case 'limite':
      return `Ya elegiste ${efectoresPorTurno} efectores`
    case 'turno-completo':
      return 'Descansar ocupa todo el turno'
    case 'requiere-turno-libre':
      return `Carta doble: necesita los ${efectoresPorTurno} efectores libres`
  }
}

interface Props {
  efector: VistaEfector
  onAlternar: () => void
}

export default function CartaEfector({ efector, onAlternar }: Props) {
  const { id, nombre, regula, principal, secundarios, reducidoPorDeshidratacion, ocupaTurnoCompleto, seleccionado } =
    efector
  const { motivoBloqueo } = efector
  const categoria = CATEGORIA[regula]
  const bloqueada = motivoBloqueo !== null

  const estado = seleccionado
    ? 'border-acento shadow-carta-elevada ring-2 ring-acento motion-safe:-translate-y-2'
    : bloqueada
      ? 'cursor-not-allowed border-borde'
      : `${categoria.borde} hover:shadow-carta-elevada motion-safe:hover:-translate-y-1`

  return (
    <button
      type="button"
      aria-pressed={seleccionado}
      aria-disabled={bloqueada || undefined}
      onClick={bloqueada ? undefined : onAlternar}
      className={`flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border-2 bg-superficie text-left shadow-carta transition duration-200 ease-out motion-reduce:transition-none ${
        ocupaTurnoCompleto ? 'col-span-2 aspect-[4/3]' : 'aspect-[2/3]'
      } ${estado}`}
    >
      <span className={`flex flex-1 flex-col ${bloqueada ? 'opacity-45' : ''}`}>
        <span className={`flex items-start justify-between gap-2 px-3 py-2 text-sobre-cat ${categoria.cabecera}`}>
          <span className="text-sm leading-tight font-bold">{nombre}</span>
          {ocupaTurnoCompleto && (
            <span className="shrink-0 rounded-full border border-sobre-cat/70 px-2 py-0.5 text-[0.65rem] font-bold tracking-wide uppercase">
              Carta doble
            </span>
          )}
        </span>

        <span className={`grid flex-1 place-items-center py-2 ${categoria.texto}`}>
          <IconoEfector efector={id} className="size-12 sm:size-20 lg:size-16" />
        </span>

        <span className="flex flex-col gap-1 px-2 pb-2">
          {principal && (
            <span
              className={`rounded-lg border bg-superficie px-2 py-1 text-sm leading-snug font-bold ${categoria.borde} ${categoria.texto}`}
            >
              {principal.delta > 0 ? '▲' : '▼'} {principal.nombre} {formatearDelta(principal.delta)}
              {reducidoPorDeshidratacion && principal.variable === 'temperatura' && (
                <span className="font-semibold"> (deshidratado)</span>
              )}
            </span>
          )}
          {secundarios.map((cambio) => (
            <span key={cambio.variable} className="rounded-lg bg-elevado/60 px-2 py-0.5 text-xs leading-snug text-texto-tenue">
              {cambio.nombre} {formatearDelta(cambio.delta)}
              <span className="block text-[0.65rem] tracking-wide uppercase">efecto secundario</span>
            </span>
          ))}
          {ocupaTurnoCompleto && (
            <span className="text-xs text-texto-tenue">Ocupa los {efectoresPorTurno} efectores del turno</span>
          )}
        </span>
      </span>

      {seleccionado && (
        <span className="mx-2 mb-2 rounded-lg bg-acento px-2 py-1 text-center text-xs font-bold text-sobre-acento">
          ✓ Elegida
        </span>
      )}
      {motivoBloqueo && (
        <span className="mx-2 mb-2 text-xs leading-snug font-medium text-texto-suave">{textoMotivo(motivoBloqueo)}</span>
      )}
    </button>
  )
}
