import type { Cambio } from '../state/selectors.ts'
import type { Zona } from '../state/selectors.ts'

// Formato de presentación compartido por los componentes. Sin reglas del juego.

/** "+2" / "−2" (signo menos tipográfico) / "0". */
export function formatearDelta(delta: number): string {
  if (delta === 0) {
    return '0'
  }
  return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`
}

export function formatearCambio(cambio: Cambio): string {
  return `${cambio.nombre} ${formatearDelta(cambio.delta)}`
}

/** Clases por zona: el color siempre acompaña al texto de la zona. */
export const ESTILOS_ZONA: Readonly<Record<Zona, { punto: string; texto: string; fondo: string; borde: string }>> = {
  verde: {
    punto: 'bg-emerald-400',
    texto: 'text-emerald-300',
    fondo: 'bg-emerald-500/25',
    borde: 'border-emerald-500/40',
  },
  amarilla: {
    punto: 'bg-amber-400',
    texto: 'text-amber-300',
    fondo: 'bg-amber-500/25',
    borde: 'border-amber-500/40',
  },
  roja: {
    punto: 'bg-rose-500',
    texto: 'text-rose-300',
    fondo: 'bg-rose-500/25',
    borde: 'border-rose-500/40',
  },
}
