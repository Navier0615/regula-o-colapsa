import type { Zona } from '../types.ts'

export interface IntervaloZona {
  readonly zona: Zona
  readonly min: number
  readonly max: number
}

/** Intervalos inclusivos que cubren todo el rango 0–10. */
export const INTERVALOS_ZONA: readonly IntervaloZona[] = [
  { zona: 'roja', min: 0, max: 1 },
  { zona: 'amarilla', min: 2, max: 3 },
  { zona: 'verde', min: 4, max: 6 },
  { zona: 'amarilla', min: 7, max: 8 },
  { zona: 'roja', min: 9, max: 10 },
]

/** Texto que acompaña al color de cada zona. */
export const ETIQUETAS_ZONA: Readonly<Record<Zona, string>> = {
  verde: 'verde',
  amarilla: 'alerta',
  roja: 'crisis',
}
