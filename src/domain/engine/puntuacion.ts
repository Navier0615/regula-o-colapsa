import { VARIABLES } from '../config/variables.ts'
import { INTERVALOS_ZONA } from '../config/zonas.ts'
import { BONIFICACION_REGULACION, PUNTAJE_VICTORIA_SOLITARIO, PUNTOS_POR_ZONA } from '../config/reglas.ts'
import type { Jugador, Puntuacion, Valores, Zona } from '../types.ts'

/** Zona de un valor ya limitado a 0–10. */
export function zonaDe(valor: number): Zona {
  const intervalo = INTERVALOS_ZONA.find((z) => valor >= z.min && valor <= z.max)
  if (!intervalo) {
    throw new Error(`Valor fuera de rango: ${valor}`)
  }
  return intervalo.zona
}

/** Paso 6: puntos del turno con los valores finales. */
export function calcularPuntuacion(valoresFinales: Valores, valoresTrasEstimulo: Valores): Puntuacion {
  let base = 0
  let bonificacion = 0
  let enRojo = 0

  for (const variable of VARIABLES) {
    const zonaFinal = zonaDe(valoresFinales[variable])
    base += PUNTOS_POR_ZONA[zonaFinal]
    if (zonaFinal === 'roja') {
      enRojo++
    }
    if (zonaFinal === 'verde' && zonaDe(valoresTrasEstimulo[variable]) !== 'verde') {
      bonificacion += BONIFICACION_REGULACION
    }
  }

  return { base, bonificacion, total: base + bonificacion, enRojo }
}

export interface PosicionRanking {
  readonly indice: number
  readonly jugador: Jugador
}

/**
 * Ordena a los jugadores: mayor puntaje; desempate por menor turnosEnRojo
 * y luego mayor energía final. Devuelve una copia; el primero es el ganador.
 */
export function clasificarJugadores(jugadores: readonly Jugador[]): PosicionRanking[] {
  return jugadores
    .map((jugador, indice) => ({ indice, jugador }))
    .sort(
      (a, b) =>
        b.jugador.puntaje - a.jugador.puntaje ||
        a.jugador.turnosEnRojo - b.jugador.turnosEnRojo ||
        b.jugador.valores.energia - a.jugador.valores.energia,
    )
}

/** Solitario: gana si no colapsó y alcanzó el puntaje mínimo. */
export function esVictoriaSolitario(jugador: Jugador): boolean {
  return !jugador.colapsado && jugador.puntaje >= PUNTAJE_VICTORIA_SOLITARIO
}
