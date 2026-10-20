import { describe, expect, it } from 'vitest'
import { VALORES_INICIALES } from '../../src/domain/config/variables.ts'
import { variablesEnColapso, verificarColapso } from '../../src/domain/engine/colapso.ts'

describe('verificarColapso', () => {
  it('no colapsa con valores entre 1 y 9', () => {
    expect(verificarColapso(VALORES_INICIALES)).toBe(false)
    expect(verificarColapso({ temperatura: 1, glucosa: 9, hidratacion: 1, energia: 9 })).toBe(false)
  })

  it('colapsa si alguna variable está en 10', () => {
    expect(verificarColapso({ ...VALORES_INICIALES, temperatura: 10 })).toBe(true)
  })

  it('colapsa si alguna variable está en 0', () => {
    expect(verificarColapso({ ...VALORES_INICIALES, energia: 0 })).toBe(true)
  })
})

describe('variablesEnColapso', () => {
  it('lista las variables en 0 o 10', () => {
    expect(variablesEnColapso({ temperatura: 10, glucosa: 5, hidratacion: 0, energia: 9 })).toEqual([
      'temperatura',
      'hidratacion',
    ])
  })
})
