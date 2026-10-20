import { describe, expect, it } from 'vitest'
import {
  aplicarRetroalimentacion,
  limitar,
  limitarRango,
  sumarEfecto,
} from '../../src/domain/engine/retroalimentacion.ts'
import type { Valores } from '../../src/domain/types.ts'

const valores = (parciales: Partial<Valores> = {}): Valores => ({
  temperatura: 5,
  glucosa: 5,
  hidratacion: 5,
  energia: 5,
  ...parciales,
})

describe('limitar y limitarRango', () => {
  it('limita cada valor a 0–10', () => {
    expect(limitar(-2)).toBe(0)
    expect(limitar(12)).toBe(10)
    expect(limitar(7)).toBe(7)
  })

  it('limita todas las variables', () => {
    expect(limitarRango({ temperatura: 11, glucosa: -1, hidratacion: 0, energia: 10 })).toEqual({
      temperatura: 10,
      glucosa: 0,
      hidratacion: 0,
      energia: 10,
    })
  })
})

describe('sumarEfecto', () => {
  it('suma solo las variables del efecto', () => {
    expect(sumarEfecto(valores(), { temperatura: 2, energia: -1 })).toEqual(
      valores({ temperatura: 7, energia: 4 }),
    )
  })
})

describe('aplicarRetroalimentacion', () => {
  it('sin condiciones especiales no cambia nada ni registra bucles', () => {
    const resultado = aplicarRetroalimentacion(valores(), valores())
    expect(resultado.valores).toEqual(valores())
    expect(resultado.bucles).toEqual([])
  })

  it('fiebre: temperatura ≥ 8 sube 1 más (bucle positivo)', () => {
    const resultado = aplicarRetroalimentacion(valores({ temperatura: 8 }), valores({ temperatura: 8 }))
    expect(resultado.valores.temperatura).toBe(9)
    expect(resultado.bucles).toContainEqual({ tipo: 'positivo', causa: 'fiebre', variable: 'temperatura' })
  })

  it('sin fiebre con temperatura 7', () => {
    const resultado = aplicarRetroalimentacion(valores({ temperatura: 7 }), valores({ temperatura: 7 }))
    expect(resultado.valores.temperatura).toBe(7)
    expect(resultado.bucles).toEqual([])
  })

  it('la fiebre puede superar 10 antes del clamp', () => {
    const resultado = aplicarRetroalimentacion(valores({ temperatura: 10 }), valores({ temperatura: 10 }))
    expect(resultado.valores.temperatura).toBe(11)
    expect(limitarRango(resultado.valores).temperatura).toBe(10)
  })

  it('hipoglucemia: glucosa ≤ 2 baja la energía 1 (bucle positivo)', () => {
    const resultado = aplicarRetroalimentacion(valores({ glucosa: 2 }), valores({ glucosa: 2 }))
    expect(resultado.valores.energia).toBe(4)
    expect(resultado.bucles).toContainEqual({ tipo: 'positivo', causa: 'hipoglucemia', variable: 'glucosa' })
  })

  it('sin hipoglucemia con glucosa 3', () => {
    const resultado = aplicarRetroalimentacion(valores({ glucosa: 3 }), valores({ glucosa: 3 }))
    expect(resultado.valores.energia).toBe(5)
  })

  it('avisa deshidratación si la hidratación termina ≤ 3', () => {
    const resultado = aplicarRetroalimentacion(valores({ hidratacion: 3 }), valores({ hidratacion: 3 }))
    expect(resultado.bucles).toEqual([{ tipo: 'positivo', causa: 'deshidratacion', variable: 'hidratacion' }])
  })

  it('avisa agotamiento si la energía termina ≤ 2, incluso por la hipoglucemia', () => {
    const resultado = aplicarRetroalimentacion(
      valores({ glucosa: 1, energia: 3 }),
      valores({ glucosa: 1, energia: 3 }),
    )
    expect(resultado.valores.energia).toBe(2)
    expect(resultado.bucles).toContainEqual({ tipo: 'positivo', causa: 'agotamiento', variable: 'energia' })
  })

  it('registra bucle negativo si la variable salió de verde tras el estímulo y vuelve a verde', () => {
    const resultado = aplicarRetroalimentacion(valores({ temperatura: 6 }), valores({ temperatura: 9 }))
    expect(resultado.bucles).toEqual([{ tipo: 'negativo', causa: 'regulacion', variable: 'temperatura' }])
  })

  it('no registra bucle negativo si la variable no vuelve a verde', () => {
    const resultado = aplicarRetroalimentacion(valores({ glucosa: 7 }), valores({ glucosa: 9 }))
    expect(resultado.bucles).toEqual([])
  })

  it('no registra bucle negativo si la variable ya estaba en verde', () => {
    const resultado = aplicarRetroalimentacion(valores({ glucosa: 4 }), valores({ glucosa: 6 }))
    expect(resultado.bucles).toEqual([])
  })

  it('la fiebre impide el bucle negativo si deja la temperatura fuera de verde', () => {
    const resultado = aplicarRetroalimentacion(valores({ temperatura: 8 }), valores({ temperatura: 9 }))
    expect(resultado.valores.temperatura).toBe(9)
    expect(resultado.bucles).toEqual([{ tipo: 'positivo', causa: 'fiebre', variable: 'temperatura' }])
  })
})
