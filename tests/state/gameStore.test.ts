import { beforeEach, describe, expect, it } from 'vitest'
import { ESTIMULOS } from '../../src/domain/config/estimulos.ts'
import { generarSecuenciaJugador } from '../../src/domain/engine/estimulos.ts'
import type { IdEstimulo } from '../../src/domain/types.ts'
import { CLAVE_PERSISTENCIA, useGameStore } from '../../src/state/gameStore.ts'
import { crearPartida } from '../../src/domain/engine/partida.ts'
import {
  selectCartasEfectores,
  selectEfectoresSeleccionados,
  selectError,
  selectErrorDe,
  selectSintomas,
  selectEstimuloActual,
  selectFase,
  selectLecturas,
  selectNombreJugadorActivo,
  selectPuedeAfinar,
  selectRanking,
  selectResumenTurno,
  selectTurno,
  selectUltimoRegistro,
  selectValidacionDecision,
  selectVariableAfinada,
  selectVictoriaSolitario,
} from '../../src/state/selectors.ts'

const estado = () => useGameStore.getState()
const acciones = () => useGameStore.getState()

/** Juega el turno del jugador activo con Descansar (siempre válido) y continúa. */
function jugarTurnoDescansando(): IdEstimulo {
  acciones().revelarEstimulo()
  const estimulo = selectEstimuloActual(estado())!.id
  acciones().seleccionarEfector('descansar')
  acciones().confirmarDecision()
  acciones().continuar()
  return estimulo
}

beforeEach(() => {
  localStorage.clear()
  acciones().reiniciarPartida()
})

describe('iniciarPartida', () => {
  it('sin partida la fase es CONFIGURACION', () => {
    expect(selectFase(estado())).toBe('CONFIGURACION')
    expect(estado().partida).toBeNull()
  })

  it('crea la partida en el turno 1, fase ESTIMULO, con el primer jugador', () => {
    acciones().iniciarPartida('TGS-1234', ['Ana', 'Beto'])
    expect(selectFase(estado())).toBe('ESTIMULO')
    expect(selectTurno(estado())).toBe(1)
    expect(selectNombreJugadorActivo(estado())).toBe('Ana')
  })

  it('con datos inválidos guarda el error y no crea la partida', () => {
    acciones().iniciarPartida('1234', ['Ana'])
    expect(estado().partida).toBeNull()
    expect(selectError(estado())).toMatch(/Código/)
  })
})

describe('flujo de fases', () => {
  beforeEach(() => {
    acciones().iniciarPartida('TGS-1234', ['Ana', 'Beto'])
  })

  it('en ESTIMULO no se exponen estímulo ni lecturas', () => {
    expect(selectEstimuloActual(estado())).toBeNull()
    expect(selectLecturas(estado())).toBeNull()
  })

  it('revelarEstimulo pasa a LECTURA con el estímulo de la secuencia propia del jugador', () => {
    acciones().revelarEstimulo()
    const esperado = generarSecuenciaJugador('TGS-1234', 0)[0]!
    expect(selectFase(estado())).toBe('LECTURA')
    expect(selectEstimuloActual(estado())).toEqual(ESTIMULOS[esperado])
    expect(selectLecturas(estado())).not.toBeNull()
  })

  it('afinarSensor revela una variable una sola vez por turno', () => {
    acciones().revelarEstimulo()
    expect(selectPuedeAfinar(estado())).toBe(true)
    acciones().afinarSensor('glucosa')
    expect(selectVariableAfinada(estado())).toBe('glucosa')
    expect(selectLecturas(estado())!.glucosa.afinada).toBe(true)
    expect(selectPuedeAfinar(estado())).toBe(false)

    acciones().afinarSensor('temperatura')
    expect(selectError(estado())).toMatch(/Ya afinaste/)
    expect(selectVariableAfinada(estado())).toBe('glucosa')
  })

  it('seleccionarEfector pasa a DECISION y marca/desmarca efectores', () => {
    acciones().revelarEstimulo()
    acciones().seleccionarEfector('beber')
    expect(selectFase(estado())).toBe('DECISION')
    acciones().seleccionarEfector('comer')
    expect(selectEfectoresSeleccionados(estado())).toEqual(['beber', 'comer'])
    acciones().seleccionarEfector('beber')
    expect(selectEfectoresSeleccionados(estado())).toEqual(['comer'])
  })

  it('selectValidacionDecision usa las reglas del dominio', () => {
    acciones().revelarEstimulo()
    acciones().seleccionarEfector('beber')
    expect(selectValidacionDecision(estado())?.valida).toBe(false)
    acciones().seleccionarEfector('comer')
    expect(selectValidacionDecision(estado())).toEqual({ valida: true })
  })

  it('no permite elegir efectores antes de revelar el estímulo', () => {
    acciones().seleccionarEfector('beber')
    expect(selectFase(estado())).toBe('ESTIMULO')
    expect(selectEfectoresSeleccionados(estado())).toEqual([])
    expect(selectError(estado())).not.toBeNull()
  })

  it('una decisión inválida no cambia la fase y deja el motivo en error', () => {
    acciones().revelarEstimulo()
    acciones().seleccionarEfector('beber')
    acciones().confirmarDecision()
    expect(selectFase(estado())).toBe('DECISION')
    expect(selectError(estado())).toMatch(/2 efectores/)
    expect(selectEfectoresSeleccionados(estado())).toEqual(['beber'])
  })

  it('confirmarDecision pasa a RETROALIMENTACION con el registro del turno', () => {
    acciones().revelarEstimulo()
    acciones().seleccionarEfector('beber')
    acciones().seleccionarEfector('comer')
    acciones().confirmarDecision()
    expect(selectFase(estado())).toBe('RETROALIMENTACION')
    expect(selectError(estado())).toBeNull()
    expect(selectEfectoresSeleccionados(estado())).toEqual([])
    const registro = selectUltimoRegistro(estado())!
    expect(registro.turno).toBe(1)
    expect(registro.efectores).toEqual(['beber', 'comer'])
    const resumen = selectResumenTurno(estado())!
    expect(resumen.zonasFinales.map((z) => z.variable)).toEqual(['temperatura', 'glucosa', 'hidratacion', 'energia'])
    resumen.zonasFinales.forEach((z) => {
      expect(Object.keys(z).sort()).toEqual(['etiquetaZona', 'nombre', 'variable', 'zona'])
      expect(['verde', 'alerta', 'crisis']).toContain(z.etiquetaZona)
    })
    expect(selectLecturas(estado())).toBeNull()
  })

  it('al pasar al siguiente jugador vuelve a ESTIMULO sin exponer nada del anterior', () => {
    acciones().revelarEstimulo()
    acciones().afinarSensor('energia')
    acciones().seleccionarEfector('beber')
    acciones().seleccionarEfector('comer')
    acciones().confirmarDecision()
    acciones().continuar()

    const s = estado()
    expect(selectFase(s)).toBe('ESTIMULO')
    expect(selectNombreJugadorActivo(s)).toBe('Beto')
    expect(selectTurno(s)).toBe(1)
    expect(selectEstimuloActual(s)).toBeNull()
    expect(selectLecturas(s)).toBeNull()
    expect(selectVariableAfinada(s)).toBeNull()
    expect(selectUltimoRegistro(s)).toBeNull()
    expect(selectEfectoresSeleccionados(s)).toEqual([])
    expect(s.partida!.turnoEnCurso).toBeNull()
  })

  it('tras el último jugador del turno pasa al turno siguiente con el primero', () => {
    jugarTurnoDescansando()
    jugarTurnoDescansando()
    expect(selectTurno(estado())).toBe(2)
    expect(selectNombreJugadorActivo(estado())).toBe('Ana')
    expect(selectFase(estado())).toBe('ESTIMULO')
  })

  it('acciones fuera de fase no cambian el estado', () => {
    const antes = estado().partida
    acciones().continuar()
    acciones().confirmarDecision()
    expect(estado().partida).toBe(antes)
    expect(selectError(estado())).not.toBeNull()
  })
})

describe('síntomas y revalidación', () => {
  /** Partida de un jugador con energía 3 y estímulos sin efecto. */
  function iniciarConEnergia(energia: number) {
    const base = crearPartida('TGS-1234', ['Ana'])
    const jugador = base.jugadores[0]!
    useGameStore.setState({
      partida: {
        ...base,
        jugadores: [
          {
            ...jugador,
            valores: { ...jugador.valores, energia },
            secuenciaEstimulos: jugador.secuenciaEstimulos.map(() => 'tranquilo'),
          },
        ],
      },
    })
  }

  it('si afinar provoca agotamiento con 2 efectores elegidos, la selección queda inválida', () => {
    iniciarConEnergia(3)
    acciones().revelarEstimulo()
    acciones().seleccionarEfector('beber')
    acciones().seleccionarEfector('comer')
    expect(selectValidacionDecision(estado())).toEqual({ valida: true })
    expect(selectSintomas(estado())?.agotamiento).toBe(false)

    acciones().afinarSensor('temperatura')

    expect(selectFase(estado())).toBe('DECISION')
    expect(selectEfectoresSeleccionados(estado())).toEqual(['beber', 'comer'])
    const validacion = selectValidacionDecision(estado())
    expect(validacion?.valida).toBe(false)
    expect(validacion?.valida === false && validacion.motivo).toMatch(/agotado/)
    expect(selectSintomas(estado())?.agotamiento).toBe(true)

    acciones().confirmarDecision()
    expect(selectFase(estado())).toBe('DECISION')
    expect(selectErrorDe('decision')(estado())).toMatch(/agotado/)
  })

  it('con agotamiento solo deja marcar 1 efector y deshabilita los demás', () => {
    iniciarConEnergia(2)
    acciones().revelarEstimulo()
    acciones().seleccionarEfector('beber')
    acciones().seleccionarEfector('comer')
    expect(selectEfectoresSeleccionados(estado())).toEqual(['beber'])
    expect(selectErrorDe('efectores')(estado())).not.toBeNull()
    const cartas = selectCartasEfectores(estado())!
    expect(cartas.find((c) => c.id === 'comer')?.habilitado).toBe(false)
    expect(cartas.find((c) => c.id === 'beber')?.habilitado).toBe(true)
  })

  it('con deshidratación la carta Sudar muestra temperatura −1', () => {
    iniciarConEnergia(5)
    const partida = estado().partida!
    const jugador = partida.jugadores[0]!
    useGameStore.setState({
      partida: { ...partida, jugadores: [{ ...jugador, valores: { ...jugador.valores, hidratacion: 3 } }] },
    })
    acciones().revelarEstimulo()
    expect(selectSintomas(estado())?.deshidratacion).toBe(true)
    const sudar = selectCartasEfectores(estado())!.find((c) => c.id === 'sudar')!
    expect(sudar.reducidoPorDeshidratacion).toBe(true)
    expect(sudar.cambios.find((c) => c.variable === 'temperatura')?.delta).toBe(-1)
  })

  it('los errores se asocian al control que los produjo y se limpian al acertar', () => {
    acciones().iniciarPartida('TGS-1234', ['Ana'])
    acciones().continuar()
    expect(selectErrorDe('continuar')(estado())).not.toBeNull()
    expect(selectErrorDe('decision')(estado())).toBeNull()
    acciones().revelarEstimulo()
    expect(selectError(estado())).toBeNull()
  })
})

describe('estímulos por jugador', () => {
  it('dos jugadores con el mismo código reciben los estímulos en distinto orden', () => {
    acciones().iniciarPartida('TGS-1234', ['Ana', 'Beto'])
    const recibidos: Record<string, IdEstimulo[]> = { Ana: [], Beto: [] }

    for (let turno = 1; turno <= 2; turno++) {
      for (const nombre of ['Ana', 'Beto']) {
        expect(selectNombreJugadorActivo(estado())).toBe(nombre)
        recibidos[nombre]!.push(jugarTurnoDescansando())
      }
    }

    expect(recibidos.Ana).toEqual(generarSecuenciaJugador('TGS-1234', 0).slice(0, 2))
    expect(recibidos.Beto).toEqual(generarSecuenciaJugador('TGS-1234', 1).slice(0, 2))
    expect(recibidos.Ana).not.toEqual(recibidos.Beto)

    const [ana, beto] = estado().partida!.jugadores
    expect([...ana!.secuenciaEstimulos].sort()).toEqual([...beto!.secuenciaEstimulos].sort())
    expect(ana!.secuenciaEstimulos).not.toEqual(beto!.secuenciaEstimulos)
  })
})

describe('fin de la partida', () => {
  it('llega a FIN_DEL_DIA y expone el ranking', () => {
    acciones().iniciarPartida('TGS-2024', ['Ana', 'Beto'])
    for (let pasos = 0; selectFase(estado()) !== 'FIN_DEL_DIA' && pasos < 100; pasos++) {
      jugarTurnoDescansando()
    }
    expect(selectFase(estado())).toBe('FIN_DEL_DIA')
    expect(selectNombreJugadorActivo(estado())).toBeNull()
    const ranking = selectRanking(estado())!
    expect(ranking).toHaveLength(2)
    expect(selectRanking(estado())).toBe(ranking)
    expect(selectVictoriaSolitario(estado())).toBeNull()
  })

  it('en solitario indica si ganó o perdió', () => {
    acciones().iniciarPartida('TGS-2024', ['Ana'])
    for (let pasos = 0; selectFase(estado()) !== 'FIN_DEL_DIA' && pasos < 100; pasos++) {
      jugarTurnoDescansando()
    }
    expect(typeof selectVictoriaSolitario(estado())).toBe('boolean')
  })

  it('el ranking no está disponible antes del final', () => {
    acciones().iniciarPartida('TGS-2024', ['Ana', 'Beto'])
    expect(selectRanking(estado())).toBeNull()
  })
})

describe('reiniciarPartida y persistencia', () => {
  it('reiniciarPartida vuelve a CONFIGURACION', () => {
    acciones().iniciarPartida('TGS-1234', ['Ana'])
    acciones().reiniciarPartida()
    expect(selectFase(estado())).toBe('CONFIGURACION')
    expect(estado().partida).toBeNull()
  })

  it('guarda la partida en localStorage y la recupera al rehidratar', async () => {
    acciones().iniciarPartida('TGS-1234', ['Ana'])
    acciones().revelarEstimulo()
    acciones().seleccionarEfector('beber')
    const guardado = localStorage.getItem(CLAVE_PERSISTENCIA)!
    const partida = estado().partida

    expect(JSON.parse(guardado).state.partida.codigo).toBe('TGS-1234')
    expect(JSON.parse(guardado).state.error).toBeUndefined()

    acciones().reiniciarPartida()
    localStorage.setItem(CLAVE_PERSISTENCIA, guardado)
    await useGameStore.persist.rehydrate()

    expect(estado().partida).toEqual(partida)
    expect(selectFase(estado())).toBe('DECISION')
    expect(selectEfectoresSeleccionados(estado())).toEqual(['beber'])
  })
})
