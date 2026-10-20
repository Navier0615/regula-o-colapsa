import type { Franja, Zona } from '../types.ts'

export const TOTAL_TURNOS = 8

export interface TramoFranja {
  readonly franja: Franja
  readonly desde: number
  readonly hasta: number
}

export const FRANJAS: readonly TramoFranja[] = [
  { franja: 'manana', desde: 1, hasta: 3 },
  { franja: 'tarde', desde: 4, hasta: 6 },
  { franja: 'noche', desde: 7, hasta: 8 },
]

export const JUGADORES = { min: 1, max: 4 } as const

export const CODIGO_PARTIDA = { prefijo: 'TGS-', digitos: 4 } as const

/** Margen de ruido m según el turno: se usa el primer tramo con turno ≤ hastaTurno. */
export const RUIDO_SENSORES: readonly { readonly hastaTurno: number; readonly margen: number }[] = [
  { hastaTurno: 3, margen: 1 },
  { hastaTurno: 8, margen: 2 },
]

export const AFINAR_SENSOR = { costoEnergia: 1, maxPorTurno: 1 } as const

export const EFECTORES_POR_TURNO = 2

/** Agotamiento: si energia ≤ umbral, solo se permiten `efectoresPermitidos` efectores. */
export const AGOTAMIENTO = { umbral: 2, efectoresPermitidos: 1 } as const

/** Deshidratación: si hidratacion ≤ umbral, sudar cambia la temperatura solo en `efectoSudarTemperatura`. */
export const DESHIDRATACION = { umbral: 3, efectoSudarTemperatura: -1 } as const

/** Fiebre: si temperatura ≥ umbral tras los efectores, temperatura += incremento. */
export const FIEBRE = { umbral: 8, incremento: 1 } as const

/** Hipoglucemia: si glucosa ≤ umbral tras los efectores, energia += efectoEnergia. */
export const HIPOGLUCEMIA = { umbral: 2, efectoEnergia: -1 } as const

export const PUNTOS_POR_ZONA: Readonly<Record<Zona, number>> = { verde: 2, amarilla: 0, roja: -2 }

export const BONIFICACION_REGULACION = 1

/** Un jugador colapsa si alguna variable termina el turno en uno de estos valores. */
export const VALORES_COLAPSO: readonly number[] = [0, 10]

export const PUNTAJE_VICTORIA_SOLITARIO = 40
