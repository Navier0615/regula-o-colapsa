import { describe, expect, it } from 'vitest'
import { VALORES_INICIALES } from '../../src/domain/config/variables.ts'
import { verificarColapso } from '../../src/domain/engine/colapso.ts'
import { aplicarEfectores, validarDecision } from '../../src/domain/engine/decision.ts'
import { aplicarEstimulo } from '../../src/domain/engine/estimulos.ts'
import {
  confirmarDecision,
  crearPartida,
  pasarADecision,
  revelarEstimulo,
} from '../../src/domain/engine/partida.ts'
import { calcularPuntuacion } from '../../src/domain/engine/puntuacion.ts'
import { aplicarRetroalimentacion, limitarRango } from '../../src/domain/engine/retroalimentacion.ts'
import type { Bucle, IdEstimulo, Partida } from '../../src/domain/types.ts'

const TRAS_EJERCICIO = { temperatura: 7, glucosa: 5, hidratacion: 4, energia: 3 }
const FINALES = { temperatura: 6, glucosa: 7, hidratacion: 3, energia: 4 }
const BUCLES_ESPERADOS: Bucle[] = [
  { tipo: 'positivo', causa: 'deshidratacion', variable: 'hidratacion' },
  { tipo: 'negativo', causa: 'regulacion', variable: 'temperatura' },
  { tipo: 'negativo', causa: 'regulacion', variable: 'energia' },
]

describe('Ejemplo del manual', () => {
  it('reproduce el turno paso a paso con las funciones del motor', () => {
    const trasEstimulo = aplicarEstimulo(VALORES_INICIALES, 'ejercicio')
    expect(trasEstimulo).toEqual(TRAS_EJERCICIO)

    expect(validarDecision(trasEstimulo, ['sudar', 'comer'])).toEqual({ valida: true })

    const trasEfectores = aplicarEfectores(trasEstimulo, ['sudar', 'comer'])
    const { valores, bucles } = aplicarRetroalimentacion(trasEfectores, trasEstimulo)
    const finales = limitarRango(valores)

    expect(finales).toEqual(FINALES)
    expect(bucles).toEqual(BUCLES_ESPERADOS)
    expect(verificarColapso(finales)).toBe(false)
    expect(calcularPuntuacion(finales, trasEstimulo)).toEqual({
      base: 4,
      bonificacion: 2,
      total: 6,
      enRojo: 0,
    })
  })

  it('reproduce el turno con la máquina de estados de la partida', () => {
    const base = crearPartida('TGS-1234', ['Ana'])
    const ana = base.jugadores[0]!
    const secuenciaEstimulos: IdEstimulo[] = ['ejercicio', ...ana.secuenciaEstimulos.slice(1)]
    let partida: Partida = { ...base, jugadores: [{ ...ana, secuenciaEstimulos }] }

    partida = revelarEstimulo(partida)
    expect(partida.turnoEnCurso?.valoresTrasEstimulo).toEqual(TRAS_EJERCICIO)

    partida = pasarADecision(partida)
    partida = confirmarDecision(partida, ['sudar', 'comer'])

    const jugador = partida.jugadores[0]!
    const registro = jugador.historial[0]!
    expect(partida.fase).toBe('RETROALIMENTACION')
    expect(registro.valoresFinales).toEqual(FINALES)
    expect(registro.bucles).toEqual(BUCLES_ESPERADOS)
    expect(registro.puntuacion.total).toBe(6)
    expect(jugador.puntaje).toBe(6)
    expect(jugador.turnosEnRojo).toBe(0)
    expect(jugador.colapsado).toBe(false)
  })
})
