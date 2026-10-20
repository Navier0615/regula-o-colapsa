import { describe, expect, it } from 'vitest'
import { IDS_ESTIMULOS } from '../../src/domain/config/estimulos.ts'
import { JUGADORES, TOTAL_TURNOS } from '../../src/domain/config/reglas.ts'
import { VALORES_INICIALES } from '../../src/domain/config/variables.ts'
import {
  aplicarEstimulo,
  generarSecuenciaJugador,
  generarSecuencias,
  seleccionarEstimulos,
  semillaOrden,
} from '../../src/domain/engine/estimulos.ts'
import { crearPartida } from '../../src/domain/engine/partida.ts'
import { barajar, crearRng } from '../../src/domain/engine/rng.ts'

const CODIGOS = ['TGS-0000', 'TGS-0001', 'TGS-1234', 'TGS-4321', 'TGS-5555', 'TGS-9999']
const INDICES = Array.from({ length: JUGADORES.max }, (_, i) => i)

const ordenado = (ids: readonly string[]) => [...ids].sort()
const todosLosCodigos = Array.from({ length: 10000 }, (_, n) => `TGS-${String(n).padStart(4, '0')}`)

describe('seleccionarEstimulos', () => {
  it('toma 8 estímulos distintos de los 10', () => {
    const seleccion = seleccionarEstimulos('TGS-1234')
    expect(seleccion).toHaveLength(TOTAL_TURNOS)
    expect(new Set(seleccion).size).toBe(TOTAL_TURNOS)
    for (const id of seleccion) {
      expect(IDS_ESTIMULOS).toContain(id)
    }
  })

  it('el mismo código selecciona los mismos estímulos', () => {
    expect(seleccionarEstimulos('TGS-4321')).toEqual(seleccionarEstimulos('TGS-4321'))
  })

  it('códigos distintos pueden dejar fuera estímulos distintos', () => {
    const conjuntos = new Set(CODIGOS.map((c) => ordenado(seleccionarEstimulos(c)).join(',')))
    expect(conjuntos.size).toBeGreaterThan(1)
  })
})

describe('semillaOrden', () => {
  it('el primer intento es `${codigo}-orden-${indiceJugador}`', () => {
    expect(semillaOrden('TGS-1234', 3)).toBe('TGS-1234-orden-3')
  })

  it('los reintentos agregan el número de intento', () => {
    expect(semillaOrden('TGS-1234', 3, 2)).toBe('TGS-1234-orden-3-2')
  })
})

describe('generarSecuencias', () => {
  it('usa la semilla base cuando el orden no se repite', () => {
    const [primera] = generarSecuencias('TGS-1234', 1)
    expect(primera).toEqual(barajar(seleccionarEstimulos('TGS-1234'), crearRng('TGS-1234-orden-0')))
  })

  it('vuelve a barajar si el orden coincide con el de un jugador anterior (TGS-6639)', () => {
    // Con la semilla base, los jugadores 1 y 2 de TGS-6639 obtienen el mismo orden.
    const seleccion = seleccionarEstimulos('TGS-6639')
    const base1 = barajar(seleccion, crearRng(semillaOrden('TGS-6639', 1)))
    const base2 = barajar(seleccion, crearRng(semillaOrden('TGS-6639', 2)))
    expect(base1).toEqual(base2)

    const secuencias = generarSecuencias('TGS-6639', 3)
    expect(secuencias[1]).toEqual(base1)
    expect(secuencias[2]).toEqual(barajar(seleccion, crearRng(semillaOrden('TGS-6639', 2, 1))))
    expect(secuencias[2]).not.toEqual(secuencias[1])
  })

  it('la secuencia del jugador i no depende del total de jugadores', () => {
    expect(generarSecuencias('TGS-6639', 4).slice(0, 2)).toEqual(generarSecuencias('TGS-6639', 2))
  })
})

describe('Caso 2: estímulos por jugador', () => {
  it('con el mismo código, todos los jugadores reciben el mismo CONJUNTO de 8 estímulos', () => {
    for (const codigo of CODIGOS) {
      const conjunto = ordenado(seleccionarEstimulos(codigo))
      for (const indice of INDICES) {
        const secuencia = generarSecuenciaJugador(codigo, indice)
        expect(secuencia).toHaveLength(TOTAL_TURNOS)
        expect(ordenado(secuencia)).toEqual(conjunto)
      }
    }
  })

  it('con 2 o más jugadores, las secuencias tienen distinto ORDEN', () => {
    for (const codigo of CODIGOS) {
      const secuencias = INDICES.map((indice) => generarSecuenciaJugador(codigo, indice))
      expect(secuencias[0]).not.toEqual(secuencias[1])
      const distintas = new Set(secuencias.map((s) => s.join(',')))
      expect(distintas.size).toBeGreaterThan(1)
    }
  })

  it('en todos los códigos válidos, los 4 jugadores reciben órdenes distintos entre sí', () => {
    const repetidos = todosLosCodigos.filter((codigo) => {
      const ordenes = INDICES.map((indice) => generarSecuenciaJugador(codigo, indice).join(','))
      return new Set(ordenes).size !== ordenes.length
    })
    expect(repetidos).toEqual([])
  })

  it('con el mismo código e índice de jugador, la secuencia es idéntica en ejecuciones repetidas', () => {
    for (const codigo of CODIGOS) {
      for (const indice of INDICES) {
        const primera = generarSecuenciaJugador(codigo, indice)
        for (let repeticion = 0; repeticion < 5; repeticion++) {
          expect(generarSecuenciaJugador(codigo, indice)).toEqual(primera)
        }
      }
    }
  })

  it('crearPartida guarda en cada jugador su propia secuencia', () => {
    const partida = crearPartida('TGS-1234', ['A', 'B', 'C'])
    partida.jugadores.forEach((jugador, indice) => {
      expect(jugador.secuenciaEstimulos).toEqual(generarSecuenciaJugador('TGS-1234', indice))
    })
  })
})

describe('aplicarEstimulo', () => {
  it('aplica el efecto a los valores reales', () => {
    expect(aplicarEstimulo(VALORES_INICIALES, 'ejercicio')).toEqual({
      temperatura: 7,
      glucosa: 5,
      hidratacion: 4,
      energia: 3,
    })
  })

  it('día tranquilo no cambia nada', () => {
    expect(aplicarEstimulo(VALORES_INICIALES, 'tranquilo')).toEqual(VALORES_INICIALES)
  })

  it('limita el resultado a 0–10', () => {
    const resultado = aplicarEstimulo({ ...VALORES_INICIALES, temperatura: 9, hidratacion: 1 }, 'calor')
    expect(resultado.temperatura).toBe(10)
    expect(resultado.hidratacion).toBe(0)
  })
})
