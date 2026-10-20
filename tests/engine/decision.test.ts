import { describe, expect, it } from 'vitest'
import {
  aplicarEfectores,
  detectarSintomas,
  efectoDeEfector,
  efectoresPermitidos,
  puedeSeleccionarEfector,
  validarDecision,
} from '../../src/domain/engine/decision.ts'
import type { Valores } from '../../src/domain/types.ts'

const valores = (parciales: Partial<Valores> = {}): Valores => ({
  temperatura: 5,
  glucosa: 5,
  hidratacion: 5,
  energia: 5,
  ...parciales,
})

describe('efectoresPermitidos', () => {
  it('permite 2 efectores con energía mayor que 2', () => {
    expect(efectoresPermitidos(valores({ energia: 3 }))).toBe(2)
  })

  it('permite 1 efector con agotamiento (energía ≤ 2)', () => {
    expect(efectoresPermitidos(valores({ energia: 2 }))).toBe(1)
    expect(efectoresPermitidos(valores({ energia: 0 }))).toBe(1)
  })
})

describe('validarDecision', () => {
  it('acepta 2 efectores distintos', () => {
    expect(validarDecision(valores(), ['sudar', 'comer'])).toEqual({ valida: true })
  })

  it('rechaza una decisión vacía', () => {
    expect(validarDecision(valores(), []).valida).toBe(false)
  })

  it('rechaza repetir un efector', () => {
    expect(validarDecision(valores(), ['beber', 'beber']).valida).toBe(false)
  })

  it('exige exactamente 2 efectores sin agotamiento', () => {
    expect(validarDecision(valores(), ['beber']).valida).toBe(false)
  })

  it('acepta descansar solo, que cuenta como los 2 efectores', () => {
    expect(validarDecision(valores(), ['descansar'])).toEqual({ valida: true })
  })

  it('rechaza descansar combinado con otro efector', () => {
    expect(validarDecision(valores(), ['descansar', 'beber']).valida).toBe(false)
  })

  it('con agotamiento exige exactamente 1 efector', () => {
    const agotado = valores({ energia: 2 })
    expect(validarDecision(agotado, ['beber'])).toEqual({ valida: true })
    const resultado = validarDecision(agotado, ['beber', 'comer'])
    expect(resultado.valida).toBe(false)
    expect(resultado.valida === false && resultado.motivo).toContain('Agotamiento')
  })

  it('con agotamiento permite descansar', () => {
    expect(validarDecision(valores({ energia: 1 }), ['descansar'])).toEqual({ valida: true })
  })
})

describe('detectarSintomas', () => {
  it('sin síntomas con energía > 2 e hidratación > 3', () => {
    expect(detectarSintomas(valores({ energia: 3, hidratacion: 4 }))).toEqual({
      agotamiento: false,
      deshidratacion: false,
    })
  })

  it('agotamiento con energía ≤ 2 y deshidratación con hidratación ≤ 3', () => {
    expect(detectarSintomas(valores({ energia: 2, hidratacion: 3 }))).toEqual({
      agotamiento: true,
      deshidratacion: true,
    })
  })
})

describe('puedeSeleccionarEfector', () => {
  it('permite marcar hasta 2 efectores sin agotamiento', () => {
    expect(puedeSeleccionarEfector(valores(), [], 'beber')).toBe(true)
    expect(puedeSeleccionarEfector(valores(), ['beber'], 'comer')).toBe(true)
    expect(puedeSeleccionarEfector(valores(), ['beber', 'comer'], 'sudar')).toBe(false)
  })

  it('con agotamiento limita la selección a 1', () => {
    const agotado = valores({ energia: 2 })
    expect(puedeSeleccionarEfector(agotado, [], 'beber')).toBe(true)
    expect(puedeSeleccionarEfector(agotado, ['beber'], 'comer')).toBe(false)
  })

  it('siempre permite desmarcar un efector ya elegido', () => {
    expect(puedeSeleccionarEfector(valores({ energia: 1 }), ['beber', 'comer'], 'comer')).toBe(true)
  })

  it('Descansar solo con la selección vacía, y bloquea a los demás', () => {
    expect(puedeSeleccionarEfector(valores(), [], 'descansar')).toBe(true)
    expect(puedeSeleccionarEfector(valores(), ['beber'], 'descansar')).toBe(false)
    expect(puedeSeleccionarEfector(valores(), ['descansar'], 'beber')).toBe(false)
    expect(puedeSeleccionarEfector(valores({ energia: 1 }), [], 'descansar')).toBe(true)
  })
})

describe('efectoDeEfector', () => {
  it('sudar baja la temperatura 2 con hidratación mayor que 3', () => {
    expect(efectoDeEfector('sudar', valores({ hidratacion: 4 }))).toEqual({ temperatura: -2, hidratacion: -1 })
  })

  it('con deshidratación (hidratación ≤ 3) sudar baja la temperatura solo 1', () => {
    expect(efectoDeEfector('sudar', valores({ hidratacion: 3 }))).toEqual({ temperatura: -1, hidratacion: -1 })
  })

  it('los demás efectores no cambian con deshidratación', () => {
    expect(efectoDeEfector('beber', valores({ hidratacion: 1 }))).toEqual({ hidratacion: 2 })
  })
})

describe('aplicarEfectores', () => {
  it('suma los efectos de cada efector', () => {
    expect(aplicarEfectores(valores(), ['tiritar', 'glucagon'])).toEqual({
      temperatura: 7,
      glucosa: 7,
      hidratacion: 5,
      energia: 3,
    })
  })

  it('descansar sube la energía 2', () => {
    expect(aplicarEfectores(valores({ energia: 1 }), ['descansar']).energia).toBe(3)
  })

  it('evalúa la deshidratación con los valores al decidir, no con los intermedios', () => {
    // beber sube la hidratación a 5 antes de sudar, pero al decidir era 3.
    const resultado = aplicarEfectores(valores({ temperatura: 7, hidratacion: 3 }), ['beber', 'sudar'])
    expect(resultado.temperatura).toBe(6)
    expect(resultado.hidratacion).toBe(4)
  })

  it('no limita el rango (eso ocurre en limitarRango)', () => {
    expect(aplicarEfectores(valores({ glucosa: 9 }), ['comer']).glucosa).toBe(11)
  })

  it('no modifica los valores de entrada', () => {
    const entrada = Object.freeze(valores())
    aplicarEfectores(entrada, ['sudar', 'comer'])
    expect(entrada).toEqual(valores())
  })
})
