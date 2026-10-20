import { describe, expect, it } from 'vitest'
import { VALORES_INICIALES } from '../../src/domain/config/variables.ts'
import {
  calcularPuntuacion,
  clasificarJugadores,
  esVictoriaSolitario,
  zonaDe,
} from '../../src/domain/engine/puntuacion.ts'
import type { Jugador, Valores } from '../../src/domain/types.ts'

const jugador = (parciales: Partial<Jugador> = {}): Jugador => ({
  nombre: 'J',
  secuenciaEstimulos: [],
  valores: VALORES_INICIALES,
  puntaje: 0,
  turnosEnRojo: 0,
  colapsado: false,
  historial: [],
  ...parciales,
})

describe('zonaDe', () => {
  it.each([
    [0, 'roja'],
    [1, 'roja'],
    [2, 'amarilla'],
    [3, 'amarilla'],
    [4, 'verde'],
    [5, 'verde'],
    [6, 'verde'],
    [7, 'amarilla'],
    [8, 'amarilla'],
    [9, 'roja'],
    [10, 'roja'],
  ])('%i está en zona %s', (valor, zona) => {
    expect(zonaDe(valor)).toBe(zona)
  })

  it('rechaza valores fuera de 0–10', () => {
    expect(() => zonaDe(11)).toThrow()
  })
})

describe('calcularPuntuacion', () => {
  it('todas en verde: 4 × 2 = 8 puntos', () => {
    expect(calcularPuntuacion(VALORES_INICIALES, VALORES_INICIALES)).toEqual({
      base: 8,
      bonificacion: 0,
      total: 8,
      enRojo: 0,
    })
  })

  it('verde +2, amarilla 0, roja −2 y cuenta las variables en rojo', () => {
    const finales: Valores = { temperatura: 10, glucosa: 1, hidratacion: 7, energia: 5 }
    expect(calcularPuntuacion(finales, finales)).toEqual({ base: -2, bonificacion: 0, total: -2, enRojo: 2 })
  })

  it('bonifica +1 por cada variable que salió de verde tras el estímulo y termina en verde', () => {
    const trasEstimulo: Valores = { temperatura: 3, glucosa: 9, hidratacion: 5, energia: 7 }
    const finales: Valores = { temperatura: 4, glucosa: 6, hidratacion: 5, energia: 5 }
    expect(calcularPuntuacion(finales, trasEstimulo)).toEqual({ base: 8, bonificacion: 3, total: 11, enRojo: 0 })
  })
})

describe('clasificarJugadores', () => {
  it('ordena por mayor puntaje', () => {
    const ranking = clasificarJugadores([jugador({ puntaje: 10 }), jugador({ puntaje: 20 })])
    expect(ranking.map((p) => p.indice)).toEqual([1, 0])
  })

  it('desempata por menor turnosEnRojo', () => {
    const ranking = clasificarJugadores([
      jugador({ puntaje: 20, turnosEnRojo: 3 }),
      jugador({ puntaje: 20, turnosEnRojo: 1 }),
    ])
    expect(ranking.map((p) => p.indice)).toEqual([1, 0])
  })

  it('luego desempata por mayor energía final', () => {
    const ranking = clasificarJugadores([
      jugador({ puntaje: 20, valores: { ...VALORES_INICIALES, energia: 4 } }),
      jugador({ puntaje: 20, valores: { ...VALORES_INICIALES, energia: 6 } }),
    ])
    expect(ranking.map((p) => p.indice)).toEqual([1, 0])
  })

  it('no modifica el arreglo original', () => {
    const jugadores = Object.freeze([jugador({ puntaje: 1 }), jugador({ puntaje: 2 })])
    clasificarJugadores(jugadores)
    expect(jugadores[0]!.puntaje).toBe(1)
  })
})

describe('esVictoriaSolitario', () => {
  it('gana con 40 puntos o más sin colapsar', () => {
    expect(esVictoriaSolitario(jugador({ puntaje: 40 }))).toBe(true)
  })

  it('pierde con menos de 40 puntos', () => {
    expect(esVictoriaSolitario(jugador({ puntaje: 39 }))).toBe(false)
  })

  it('pierde si colapsó, aunque tenga 40 puntos o más', () => {
    expect(esVictoriaSolitario(jugador({ puntaje: 45, colapsado: true }))).toBe(false)
  })
})
