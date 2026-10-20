import type { Cambio, Zona } from '../state/selectors.ts'

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

/** Clases por zona (tokens de tema): el color siempre acompaña al texto de la zona. */
export const ESTILOS_ZONA: Readonly<
  Record<Zona, { punto: string; texto: string; escala: string; borde: string; suave: string }>
> = {
  verde: {
    punto: 'bg-zona-verde',
    texto: 'text-zona-verde-texto',
    escala: 'bg-zona-verde/40',
    borde: 'border-zona-verde/50',
    suave: 'bg-zona-verde-suave',
  },
  amarilla: {
    punto: 'bg-zona-amarilla',
    texto: 'text-zona-amarilla-texto',
    escala: 'bg-zona-amarilla/40',
    borde: 'border-zona-amarilla/50',
    suave: 'bg-zona-amarilla-suave',
  },
  roja: {
    punto: 'bg-zona-roja',
    texto: 'text-zona-roja-texto',
    escala: 'bg-zona-roja/40',
    borde: 'border-zona-roja/50',
    suave: 'bg-zona-roja-suave',
  },
}

/** Etiqueta de zona con punto de color y texto (verde / alerta / crisis). */
export const CLASES_ETIQUETA_ZONA = 'inline-flex items-center gap-1.5 text-sm font-medium'
