import { VARIABLES } from '../config/variables.ts'
import { AFINAR_SENSOR, RUIDO_SENSORES } from '../config/reglas.ts'
import type { Lectura, Lecturas, Valores, Variable } from '../types.ts'
import { limitar, limitarRango, sumarEfecto } from './retroalimentacion.ts'
import { crearRng, enteroUniforme } from './rng.ts'

/** Margen de ruido m del turno. */
export function margenRuido(turno: number): number {
  const tramo = RUIDO_SENSORES.find((t) => turno <= t.hastaTurno)
  if (!tramo) {
    throw new Error(`Turno sin margen de ruido definido: ${turno}`)
  }
  return tramo.margen
}

export function semillaRuido(codigo: string, indiceJugador: number, turno: number): string {
  return `${codigo}-${indiceJugador}-${turno}`
}

/**
 * Lecturas de los sensores: real + ruido uniforme en [−m, +m], limitado a 0–10.
 * El ruido se genera en el orden fijo de VARIABLES, así que es reproducible.
 */
export function generarLecturas(
  valores: Valores,
  codigo: string,
  indiceJugador: number,
  turno: number,
): Lecturas {
  const rng = crearRng(semillaRuido(codigo, indiceJugador, turno))
  const margen = margenRuido(turno)
  const lecturas = {} as Record<Variable, Lectura>
  for (const variable of VARIABLES) {
    const ruido = enteroUniforme(rng, -margen, margen)
    lecturas[variable] = { valor: limitar(valores[variable] + ruido), afinada: false, margen }
  }
  return lecturas
}

export interface ResultadoAfinado {
  readonly valores: Valores
  readonly lecturas: Lecturas
}

/**
 * Afinar sensor: descuenta la energía real y revela el valor real de `variable`.
 * Las lecturas se regeneran con la misma semilla sobre los valores nuevos, de modo
 * que la lectura de energía refleja el costo sin cambiar el ruido.
 */
export function afinarLectura(
  valores: Valores,
  variable: Variable,
  codigo: string,
  indiceJugador: number,
  turno: number,
): ResultadoAfinado {
  const nuevosValores = limitarRango(sumarEfecto(valores, { energia: -AFINAR_SENSOR.costoEnergia }))
  const lecturas = generarLecturas(nuevosValores, codigo, indiceJugador, turno)
  return {
    valores: nuevosValores,
    lecturas: { ...lecturas, [variable]: { valor: nuevosValores[variable], afinada: true, margen: 0 } },
  }
}
