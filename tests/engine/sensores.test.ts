import { describe, expect, it } from 'vitest'
import { VARIABLES, VALORES_INICIALES } from '../../src/domain/config/variables.ts'
import {
  afinarLectura,
  generarLecturas,
  margenRuido,
  semillaRuido,
} from '../../src/domain/engine/sensores.ts'

describe('margenRuido', () => {
  it('m = 1 en los turnos 1–3 y m = 2 en los turnos 4–8', () => {
    expect([1, 2, 3].map(margenRuido)).toEqual([1, 1, 1])
    expect([4, 5, 6, 7, 8].map(margenRuido)).toEqual([2, 2, 2, 2, 2])
  })
})

describe('semillaRuido', () => {
  it('combina código, jugador y turno', () => {
    expect(semillaRuido('TGS-1234', 2, 5)).toBe('TGS-1234-2-5')
  })
})

describe('generarLecturas', () => {
  it('cada lectura difiere del valor real como máximo en m', () => {
    for (let turno = 1; turno <= 8; turno++) {
      const lecturas = generarLecturas(VALORES_INICIALES, 'TGS-1234', 0, turno)
      for (const variable of VARIABLES) {
        const lectura = lecturas[variable]
        expect(lectura.afinada).toBe(false)
        expect(lectura.margen).toBe(margenRuido(turno))
        expect(Math.abs(lectura.valor - VALORES_INICIALES[variable])).toBeLessThanOrEqual(margenRuido(turno))
      }
    }
  })

  it('es reproducible con la misma semilla', () => {
    expect(generarLecturas(VALORES_INICIALES, 'TGS-1234', 1, 4)).toEqual(
      generarLecturas(VALORES_INICIALES, 'TGS-1234', 1, 4),
    )
  })

  it('el ruido es distinto por jugador', () => {
    const turnos = [1, 2, 3, 4, 5, 6, 7, 8]
    const jugador0 = turnos.map((t) => generarLecturas(VALORES_INICIALES, 'TGS-1234', 0, t))
    const jugador1 = turnos.map((t) => generarLecturas(VALORES_INICIALES, 'TGS-1234', 1, t))
    expect(jugador0).not.toEqual(jugador1)
  })

  it('limita las lecturas a 0–10', () => {
    const extremos = { temperatura: 0, glucosa: 10, hidratacion: 0, energia: 10 }
    for (let turno = 1; turno <= 8; turno++) {
      const lecturas = generarLecturas(extremos, 'TGS-9999', 0, turno)
      for (const variable of VARIABLES) {
        expect(lecturas[variable].valor).toBeGreaterThanOrEqual(0)
        expect(lecturas[variable].valor).toBeLessThanOrEqual(10)
      }
    }
  })
})

describe('afinarLectura', () => {
  it('cuesta 1 de energía real y revela el valor real de la variable', () => {
    const valores = { temperatura: 7, glucosa: 5, hidratacion: 4, energia: 3 }
    const resultado = afinarLectura(valores, 'temperatura', 'TGS-1234', 0, 5)
    expect(resultado.valores).toEqual({ ...valores, energia: 2 })
    expect(resultado.lecturas.temperatura).toEqual({ valor: 7, afinada: true, margen: 0 })
  })

  it('al afinar la energía revela el valor ya descontado', () => {
    const resultado = afinarLectura(VALORES_INICIALES, 'energia', 'TGS-1234', 0, 1)
    expect(resultado.lecturas.energia).toEqual({ valor: 4, afinada: true, margen: 0 })
  })

  it('las demás lecturas conservan el mismo ruido', () => {
    const antes = generarLecturas(VALORES_INICIALES, 'TGS-1234', 0, 2)
    const despues = afinarLectura(VALORES_INICIALES, 'glucosa', 'TGS-1234', 0, 2).lecturas
    expect(despues.temperatura).toEqual(antes.temperatura)
    expect(despues.hidratacion).toEqual(antes.hidratacion)
  })

  it('la energía no baja de 0', () => {
    const resultado = afinarLectura({ ...VALORES_INICIALES, energia: 0 }, 'glucosa', 'TGS-1234', 0, 1)
    expect(resultado.valores.energia).toBe(0)
  })
})
