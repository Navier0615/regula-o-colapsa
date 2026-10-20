import { describe, expect, it } from 'vitest'
import { VALORES_INICIALES } from '../../src/domain/config/variables.ts'
import {
  afinarSensor,
  confirmarDecision,
  continuar,
  crearPartida,
  esCodigoValido,
  estimuloDelTurno,
  franjaDeTurno,
  jugadorActual,
  pasarADecision,
  revelarEstimulo,
} from '../../src/domain/engine/partida.ts'
import type { IdEfector, IdEstimulo, Jugador, Partida } from '../../src/domain/types.ts'

const TRANQUILO: IdEstimulo[] = Array.from({ length: 8 }, () => 'tranquilo')

/** Partida con estímulos controlados: todos los jugadores reciben `secuencia`. */
function partidaDePrueba(nombres: string[], secuencia: IdEstimulo[] = TRANQUILO): Partida {
  const partida = crearPartida('TGS-1234', nombres)
  return {
    ...partida,
    jugadores: partida.jugadores.map((j) => ({ ...j, secuenciaEstimulos: secuencia })),
  }
}

function jugarTurno(partida: Partida, efectores: IdEfector[]): Partida {
  return confirmarDecision(pasarADecision(revelarEstimulo(partida)), efectores)
}

function conJugador(partida: Partida, indice: number, cambios: Partial<Jugador>): Partida {
  return {
    ...partida,
    jugadores: partida.jugadores.map((j, i) => (i === indice ? { ...j, ...cambios } : j)),
  }
}

describe('esCodigoValido', () => {
  it('acepta el formato TGS-XXXX', () => {
    expect(esCodigoValido('TGS-0427')).toBe(true)
  })

  it.each(['TGS-123', 'TGS-12345', 'tgs-1234', 'ABC-1234', 'TGS-12a4'])('rechaza %s', (codigo) => {
    expect(esCodigoValido(codigo)).toBe(false)
  })
})

describe('franjaDeTurno', () => {
  it('mañana 1–3, tarde 4–6, noche 7–8', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(franjaDeTurno)).toEqual([
      'manana',
      'manana',
      'manana',
      'tarde',
      'tarde',
      'tarde',
      'noche',
      'noche',
    ])
  })

  it('rechaza turnos fuera de la partida', () => {
    expect(() => franjaDeTurno(9)).toThrow()
  })
})

describe('crearPartida', () => {
  it('crea una partida en solitario en el turno 1, fase ESTIMULO', () => {
    const partida = crearPartida('TGS-1234', ['Ana'])
    expect(partida.modo).toBe('solitario')
    expect(partida.turno).toBe(1)
    expect(partida.indiceJugador).toBe(0)
    expect(partida.fase).toBe('ESTIMULO')
    expect(partida.jugadores[0]!.secuenciaEstimulos).toHaveLength(8)
    expect(partida.jugadores[0]!.valores).toEqual(VALORES_INICIALES)
  })

  it('con 2 a 4 jugadores es multijugador', () => {
    expect(crearPartida('TGS-1234', ['A', 'B']).modo).toBe('multijugador')
    expect(crearPartida('TGS-1234', ['A', 'B', 'C', 'D']).modo).toBe('multijugador')
  })

  it('rechaza 0 o más de 4 jugadores y códigos inválidos', () => {
    expect(() => crearPartida('TGS-1234', [])).toThrow()
    expect(() => crearPartida('TGS-1234', ['A', 'B', 'C', 'D', 'E'])).toThrow()
    expect(() => crearPartida('1234', ['A'])).toThrow()
  })

  it('el mismo código reproduce la misma partida', () => {
    expect(crearPartida('TGS-5555', ['A', 'B'])).toEqual(crearPartida('TGS-5555', ['A', 'B']))
  })

  it('el jugador i recibe la misma secuencia sin importar cuántos jugadores haya', () => {
    expect(crearPartida('TGS-5555', ['A']).jugadores[0]!.secuenciaEstimulos).toEqual(
      crearPartida('TGS-5555', ['B', 'C']).jugadores[0]!.secuenciaEstimulos,
    )
  })
})

describe('jugadorActual y estimuloDelTurno', () => {
  it('devuelven el jugador y el estímulo del turno actual', () => {
    const partida = partidaDePrueba(['A', 'B'], ['calor', ...TRANQUILO.slice(1)])
    expect(jugadorActual(partida).nombre).toBe('A')
    expect(estimuloDelTurno(partida)).toBe('calor')
  })

  it('cada jugador recibe el estímulo de su propia secuencia', () => {
    const base = crearPartida('TGS-1234', ['A', 'B'])
    const partida: Partida = {
      ...base,
      jugadores: [
        { ...base.jugadores[0]!, secuenciaEstimulos: ['frio', ...TRANQUILO.slice(1)] },
        { ...base.jugadores[1]!, secuenciaEstimulos: ['azucar', ...TRANQUILO.slice(1)] },
      ],
    }
    expect(estimuloDelTurno(partida)).toBe('frio')
    expect(estimuloDelTurno({ ...partida, indiceJugador: 1 })).toBe('azucar')
  })
})

describe('revelarEstimulo', () => {
  it('aplica el estímulo, genera las lecturas y pasa a LECTURA', () => {
    const partida = revelarEstimulo(partidaDePrueba(['A'], ['frio', ...TRANQUILO.slice(1)]))
    expect(partida.fase).toBe('LECTURA')
    expect(partida.turnoEnCurso?.valoresTrasEstimulo.temperatura).toBe(2)
    expect(partida.turnoEnCurso?.lecturas.temperatura.afinada).toBe(false)
    expect(partida.turnoEnCurso?.afinado).toBeNull()
  })

  it('solo se permite en la fase ESTIMULO', () => {
    const partida = revelarEstimulo(partidaDePrueba(['A']))
    expect(() => revelarEstimulo(partida)).toThrow()
  })
})

describe('afinarSensor', () => {
  it('revela el valor real y descuenta 1 de energía', () => {
    const partida = afinarSensor(revelarEstimulo(partidaDePrueba(['A'])), 'glucosa')
    expect(partida.turnoEnCurso?.afinado).toBe('glucosa')
    expect(partida.turnoEnCurso?.lecturas.glucosa).toEqual({ valor: 5, afinada: true, margen: 0 })
    expect(partida.turnoEnCurso?.valoresActuales.energia).toBe(4)
  })

  it('solo se puede afinar una vez por turno', () => {
    const partida = afinarSensor(revelarEstimulo(partidaDePrueba(['A'])), 'glucosa')
    expect(() => afinarSensor(partida, 'temperatura')).toThrow()
  })

  it('no se puede afinar antes de revelar el estímulo', () => {
    expect(() => afinarSensor(partidaDePrueba(['A']), 'glucosa')).toThrow()
  })

  it('las restricciones de la decisión se evalúan después de afinar', () => {
    // Energía 3 tras el estímulo; al afinar baja a 2 y aplica el agotamiento.
    let partida = conJugador(partidaDePrueba(['A']), 0, { valores: { ...VALORES_INICIALES, energia: 3 } })
    partida = pasarADecision(afinarSensor(revelarEstimulo(partida), 'temperatura'))
    expect(() => confirmarDecision(partida, ['beber', 'comer'])).toThrow(/agotado/)
    expect(confirmarDecision(partida, ['beber']).fase).toBe('RETROALIMENTACION')
  })
})

describe('pasarADecision', () => {
  it('pasa de LECTURA a DECISION', () => {
    expect(pasarADecision(revelarEstimulo(partidaDePrueba(['A']))).fase).toBe('DECISION')
  })

  it('falla fuera de LECTURA', () => {
    expect(() => pasarADecision(partidaDePrueba(['A']))).toThrow()
  })
})

describe('confirmarDecision', () => {
  it('rechaza una decisión inválida', () => {
    const partida = pasarADecision(revelarEstimulo(partidaDePrueba(['A'])))
    expect(() => confirmarDecision(partida, ['beber'])).toThrow()
  })

  it('actualiza al jugador, registra el historial y pasa a RETROALIMENTACION', () => {
    const partida = jugarTurno(partidaDePrueba(['A']), ['beber', 'insulina'])
    const jugador = partida.jugadores[0]!
    expect(partida.fase).toBe('RETROALIMENTACION')
    expect(jugador.valores).toEqual({ temperatura: 5, glucosa: 3, hidratacion: 7, energia: 5 })
    expect(jugador.puntaje).toBe(4)
    expect(jugador.historial).toHaveLength(1)
    expect(jugador.historial[0]!.efectores).toEqual(['beber', 'insulina'])
  })

  it('marca el colapso si una variable termina en 0 o 10', () => {
    // Temperatura 9 + Día caluroso → 10 (clamp); comer → 11; fiebre → 12; clamp → 10.
    let partida = partidaDePrueba(['A'], ['calor', ...TRANQUILO.slice(1)])
    partida = conJugador(partida, 0, { valores: { ...VALORES_INICIALES, temperatura: 9 } })
    partida = jugarTurno(partida, ['comer', 'beber'])
    const jugador = partida.jugadores[0]!
    expect(jugador.valores.temperatura).toBe(10)
    expect(jugador.colapsado).toBe(true)
    expect(jugador.turnosEnRojo).toBe(1)
  })

  it('no modifica la partida de entrada', () => {
    const entrada = pasarADecision(revelarEstimulo(partidaDePrueba(['A'])))
    const copia = structuredClone(entrada)
    confirmarDecision(entrada, ['beber', 'insulina'])
    expect(entrada).toEqual(copia)
  })
})

describe('continuar', () => {
  it('todos juegan el turno N antes de pasar al turno N+1', () => {
    let partida = partidaDePrueba(['A', 'B', 'C'])
    const orden: [number, number][] = []
    for (let i = 0; i < 6; i++) {
      orden.push([partida.turno, partida.indiceJugador])
      partida = continuar(jugarTurno(partida, ['insulina', 'glucagon']))
    }
    expect(orden).toEqual([
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2],
    ])
  })

  it('omite a los jugadores colapsados', () => {
    let partida = conJugador(partidaDePrueba(['A', 'B', 'C']), 1, { colapsado: true })
    partida = continuar(jugarTurno(partida, ['insulina', 'glucagon']))
    expect(partida.indiceJugador).toBe(2)
    partida = continuar(jugarTurno(partida, ['insulina', 'glucagon']))
    expect([partida.turno, partida.indiceJugador]).toEqual([2, 0])
  })

  it('en solitario el colapso termina la partida', () => {
    let partida = partidaDePrueba(['A'], ['calor', ...TRANQUILO.slice(1)])
    partida = conJugador(partida, 0, { valores: { ...VALORES_INICIALES, temperatura: 9 } })
    partida = continuar(jugarTurno(partida, ['comer', 'beber']))
    expect(partida.fase).toBe('FIN_DEL_DIA')
  })

  it('en multijugador la partida termina cuando todos colapsan', () => {
    let partida = partidaDePrueba(['A', 'B'], ['calor', ...TRANQUILO.slice(1)])
    partida = conJugador(partida, 0, { colapsado: true })
    partida = { ...partida, indiceJugador: 1 }
    partida = conJugador(partida, 1, { valores: { ...VALORES_INICIALES, temperatura: 9 } })
    partida = continuar(jugarTurno(partida, ['comer', 'beber']))
    expect(partida.fase).toBe('FIN_DEL_DIA')
  })

  it('termina tras completar el turno 8', () => {
    let partida = partidaDePrueba(['A'])
    // Energía 5 → 4 → 3 → (descansar) 5 → …: nunca colapsa ni se agota.
    for (let turno = 1; turno <= 8; turno++) {
      expect(partida.fase).toBe('ESTIMULO')
      const efectores: IdEfector[] = turno % 3 === 0 ? ['descansar'] : ['insulina', 'glucagon']
      partida = continuar(jugarTurno(partida, efectores))
    }
    expect(partida.fase).toBe('FIN_DEL_DIA')
    expect(partida.jugadores[0]!.historial).toHaveLength(8)
  })

  it('solo se permite en RETROALIMENTACION', () => {
    expect(() => continuar(partidaDePrueba(['A']))).toThrow()
  })

  it('una partida real con la secuencia del código siempre llega a FIN_DEL_DIA', () => {
    let partida = crearPartida('TGS-2024', ['A', 'B'])
    let pasos = 0
    while (partida.fase !== 'FIN_DEL_DIA' && pasos < 100) {
      partida = continuar(jugarTurno(partida, ['descansar']))
      pasos++
    }
    expect(partida.fase).toBe('FIN_DEL_DIA')
    for (const jugador of partida.jugadores) {
      expect(jugador.colapsado || jugador.historial.length === 8).toBe(true)
    }
  })
})
