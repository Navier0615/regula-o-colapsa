import { ESTIMULOS, IDS_ESTIMULOS } from '../config/estimulos.ts'
import { TOTAL_TURNOS } from '../config/reglas.ts'
import type { IdEstimulo, Valores } from '../types.ts'
import { limitarRango, sumarEfecto } from './retroalimentacion.ts'
import { barajar, crearRng } from './rng.ts'

/** Los 8 estímulos de la partida: baraja los 10 con el código y toma uno por turno. */
export function seleccionarEstimulos(codigo: string): IdEstimulo[] {
  return barajar(IDS_ESTIMULOS, crearRng(codigo)).slice(0, TOTAL_TURNOS)
}

/** Semilla del orden; el intento 0 es la semilla base `${codigo}-orden-${indiceJugador}`. */
export function semillaOrden(codigo: string, indiceJugador: number, intento = 0): string {
  const base = `${codigo}-orden-${indiceJugador}`
  return intento === 0 ? base : `${base}-${intento}`
}

/**
 * Secuencias de los primeros `cantidad` jugadores: los mismos 8 estímulos en un orden
 * distinto para cada uno. Si un orden coincide con el de un jugador anterior, se vuelve
 * a barajar con la semilla del siguiente intento. La secuencia del jugador i solo
 * depende de los jugadores 0..i−1, no del total de jugadores.
 */
export function generarSecuencias(codigo: string, cantidad: number): IdEstimulo[][] {
  const seleccion = seleccionarEstimulos(codigo)
  const secuencias: IdEstimulo[][] = []
  const usados = new Set<string>()
  for (let indice = 0; indice < cantidad; indice++) {
    let intento = 0
    let secuencia = barajar(seleccion, crearRng(semillaOrden(codigo, indice, intento)))
    while (usados.has(secuencia.join(','))) {
      intento++
      secuencia = barajar(seleccion, crearRng(semillaOrden(codigo, indice, intento)))
    }
    usados.add(secuencia.join(','))
    secuencias.push(secuencia)
  }
  return secuencias
}

/** Secuencia propia del jugador `indiceJugador`. */
export function generarSecuenciaJugador(codigo: string, indiceJugador: number): IdEstimulo[] {
  return generarSecuencias(codigo, indiceJugador + 1)[indiceJugador]!
}

/** Aplica el estímulo a los valores reales y limita el rango 0–10. */
export function aplicarEstimulo(valores: Valores, estimulo: IdEstimulo): Valores {
  return limitarRango(sumarEfecto(valores, ESTIMULOS[estimulo].efecto))
}
