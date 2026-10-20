import { describe, expect, it } from 'vitest'
import { barajar, crearRng, enteroUniforme, hashSemilla } from '../../src/domain/engine/rng.ts'

describe('hashSemilla', () => {
  it('es determinista y distingue semillas', () => {
    expect(hashSemilla('TGS-1234')).toBe(hashSemilla('TGS-1234'))
    expect(hashSemilla('TGS-1234')).not.toBe(hashSemilla('TGS-1235'))
  })
})

describe('crearRng', () => {
  it('la misma semilla produce la misma secuencia', () => {
    const a = crearRng('TGS-0001')
    const b = crearRng('TGS-0001')
    expect(Array.from({ length: 20 }, a)).toEqual(Array.from({ length: 20 }, b))
  })

  it('produce números en [0, 1)', () => {
    const rng = crearRng('semilla')
    for (let i = 0; i < 1000; i++) {
      const n = rng()
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    }
  })
})

describe('enteroUniforme', () => {
  it('genera enteros dentro de [min, max] y alcanza ambos extremos', () => {
    const rng = crearRng('ruido')
    const vistos = new Set<number>()
    for (let i = 0; i < 500; i++) {
      const n = enteroUniforme(rng, -2, 2)
      expect(Number.isInteger(n)).toBe(true)
      expect(n).toBeGreaterThanOrEqual(-2)
      expect(n).toBeLessThanOrEqual(2)
      vistos.add(n)
    }
    expect([...vistos].sort((a, b) => a - b)).toEqual([-2, -1, 0, 1, 2])
  })
})

describe('barajar', () => {
  const elementos = Object.freeze(['a', 'b', 'c', 'd', 'e', 'f'])

  it('devuelve una permutación sin modificar el original', () => {
    const barajado = barajar(elementos, crearRng('x'))
    expect([...barajado].sort()).toEqual([...elementos])
    expect(elementos).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
  })

  it('es reproducible con la misma semilla', () => {
    expect(barajar(elementos, crearRng('x'))).toEqual(barajar(elementos, crearRng('x')))
  })
})
