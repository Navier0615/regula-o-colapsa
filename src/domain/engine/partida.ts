import { VALORES_INICIALES } from '../config/variables.ts'
import { AFINAR_SENSOR, CODIGO_PARTIDA, FRANJAS, JUGADORES, TOTAL_TURNOS } from '../config/reglas.ts'
import type {
  Fase,
  Franja,
  IdEfector,
  IdEstimulo,
  Jugador,
  Partida,
  RegistroTurno,
  TurnoEnCurso,
  Variable,
} from '../types.ts'
import { verificarColapso } from './colapso.ts'
import { aplicarEfectores, validarDecision } from './decision.ts'
import { aplicarEstimulo, generarSecuencias } from './estimulos.ts'
import { calcularPuntuacion } from './puntuacion.ts'
import { aplicarRetroalimentacion, limitarRango } from './retroalimentacion.ts'
import { afinarLectura, generarLecturas } from './sensores.ts'

const PATRON_CODIGO = new RegExp(`^${CODIGO_PARTIDA.prefijo}\\d{${CODIGO_PARTIDA.digitos}}$`)

/** Valida el formato TGS-XXXX. */
export function esCodigoValido(codigo: string): boolean {
  return PATRON_CODIGO.test(codigo)
}

export function franjaDeTurno(turno: number): Franja {
  const tramo = FRANJAS.find((f) => turno >= f.desde && turno <= f.hasta)
  if (!tramo) {
    throw new Error(`Turno fuera de la partida: ${turno}`)
  }
  return tramo.franja
}

function crearJugador(nombre: string, secuenciaEstimulos: readonly IdEstimulo[]): Jugador {
  return {
    nombre,
    secuenciaEstimulos,
    valores: VALORES_INICIALES,
    puntaje: 0,
    turnosEnRojo: 0,
    colapsado: false,
    historial: [],
  }
}

/** Crea la partida en el turno 1, fase ESTIMULO, con el primer jugador. */
export function crearPartida(codigo: string, nombres: readonly string[]): Partida {
  if (!esCodigoValido(codigo)) {
    throw new Error(`Código de partida inválido: ${codigo}`)
  }
  if (nombres.length < JUGADORES.min || nombres.length > JUGADORES.max) {
    throw new Error(`La partida admite de ${JUGADORES.min} a ${JUGADORES.max} jugadores.`)
  }
  const secuencias = generarSecuencias(codigo, nombres.length)
  return {
    codigo,
    modo: nombres.length === JUGADORES.min ? 'solitario' : 'multijugador',
    jugadores: nombres.map((nombre, indice) => crearJugador(nombre, secuencias[indice]!)),
    turno: 1,
    indiceJugador: 0,
    fase: 'ESTIMULO',
    turnoEnCurso: null,
  }
}

function exigirFase(partida: Partida, ...fases: Fase[]): void {
  if (!fases.includes(partida.fase)) {
    throw new Error(`Acción no permitida en la fase ${partida.fase}.`)
  }
}

function exigirTurnoEnCurso(partida: Partida): TurnoEnCurso {
  if (!partida.turnoEnCurso) {
    throw new Error('No hay un turno en curso.')
  }
  return partida.turnoEnCurso
}

export function jugadorActual(partida: Partida): Jugador {
  const jugador = partida.jugadores[partida.indiceJugador]
  if (!jugador) {
    throw new Error(`Jugador inexistente: ${partida.indiceJugador}`)
  }
  return jugador
}

/** Estímulo del jugador actual en el turno actual, según su propia secuencia. */
export function estimuloDelTurno(partida: Partida): IdEstimulo {
  const estimulo = jugadorActual(partida).secuenciaEstimulos[partida.turno - 1]
  if (!estimulo) {
    throw new Error(`Turno sin estímulo: ${partida.turno}`)
  }
  return estimulo
}

/** ESTIMULO → LECTURA: aplica el estímulo al jugador actual y genera sus lecturas. */
export function revelarEstimulo(partida: Partida): Partida {
  exigirFase(partida, 'ESTIMULO')
  const valoresInicio = jugadorActual(partida).valores
  const valoresTrasEstimulo = aplicarEstimulo(valoresInicio, estimuloDelTurno(partida))
  return {
    ...partida,
    fase: 'LECTURA',
    turnoEnCurso: {
      valoresInicio,
      valoresTrasEstimulo,
      valoresActuales: valoresTrasEstimulo,
      lecturas: generarLecturas(valoresTrasEstimulo, partida.codigo, partida.indiceJugador, partida.turno),
      afinado: null,
    },
  }
}

/** Afina un sensor (máximo una vez por turno). Permitido en LECTURA y DECISION. */
export function afinarSensor(partida: Partida, variable: Variable): Partida {
  exigirFase(partida, 'LECTURA', 'DECISION')
  const turno = exigirTurnoEnCurso(partida)
  const afinadosEnTurno = turno.afinado ? 1 : 0
  if (afinadosEnTurno >= AFINAR_SENSOR.maxPorTurno) {
    throw new Error('Ya afinaste un sensor en este turno.')
  }
  const { valores, lecturas } = afinarLectura(
    turno.valoresActuales,
    variable,
    partida.codigo,
    partida.indiceJugador,
    partida.turno,
  )
  return {
    ...partida,
    turnoEnCurso: { ...turno, valoresActuales: valores, lecturas, afinado: variable },
  }
}

/** LECTURA → DECISION. */
export function pasarADecision(partida: Partida): Partida {
  exigirFase(partida, 'LECTURA')
  return { ...partida, fase: 'DECISION' }
}

/**
 * DECISION → RETROALIMENTACION. Resuelve en el orden de CLAUDE.md:
 * validar → efectores → retroalimentación → clamp → colapso → puntuación → historial.
 * El avance de jugador/turno ocurre en `continuar`, al salir de la retroalimentación.
 */
export function confirmarDecision(partida: Partida, efectores: readonly IdEfector[]): Partida {
  exigirFase(partida, 'DECISION')
  const turno = exigirTurnoEnCurso(partida)

  const validacion = validarDecision(turno.valoresActuales, efectores)
  if (!validacion.valida) {
    throw new Error(validacion.motivo)
  }

  const trasEfectores = aplicarEfectores(turno.valoresActuales, efectores)
  const { valores: trasRetroalimentacion, bucles } = aplicarRetroalimentacion(
    trasEfectores,
    turno.valoresTrasEstimulo,
  )
  const valoresFinales = limitarRango(trasRetroalimentacion)
  const colapso = verificarColapso(valoresFinales)
  const puntuacion = calcularPuntuacion(valoresFinales, turno.valoresTrasEstimulo)

  const registro: RegistroTurno = {
    turno: partida.turno,
    estimulo: estimuloDelTurno(partida),
    valoresInicio: turno.valoresInicio,
    valoresTrasEstimulo: turno.valoresTrasEstimulo,
    afinado: turno.afinado,
    efectores: [...efectores],
    valoresFinales,
    bucles,
    puntuacion,
    colapso,
  }

  const jugador = jugadorActual(partida)
  const actualizado: Jugador = {
    ...jugador,
    valores: valoresFinales,
    puntaje: jugador.puntaje + puntuacion.total,
    turnosEnRojo: jugador.turnosEnRojo + puntuacion.enRojo,
    colapsado: colapso,
    historial: [...jugador.historial, registro],
  }

  return {
    ...partida,
    jugadores: partida.jugadores.map((j, i) => (i === partida.indiceJugador ? actualizado : j)),
    fase: 'RETROALIMENTACION',
    turnoEnCurso: null,
  }
}

/**
 * RETROALIMENTACION → ESTIMULO (siguiente jugador no colapsado del mismo turno, o
 * primer jugador activo del turno siguiente) | FIN_DEL_DIA (turno 8 completo o
 * todos colapsados).
 */
export function continuar(partida: Partida): Partida {
  exigirFase(partida, 'RETROALIMENTACION')
  const activos = partida.jugadores
    .map((jugador, indice) => ({ jugador, indice }))
    .filter(({ jugador }) => !jugador.colapsado)
    .map(({ indice }) => indice)

  const siguienteEnTurno = activos.find((indice) => indice > partida.indiceJugador)
  if (siguienteEnTurno !== undefined) {
    return { ...partida, indiceJugador: siguienteEnTurno, fase: 'ESTIMULO' }
  }

  const primeroActivo = activos[0]
  if (primeroActivo === undefined || partida.turno >= TOTAL_TURNOS) {
    return { ...partida, fase: 'FIN_DEL_DIA' }
  }
  return { ...partida, turno: partida.turno + 1, indiceJugador: primeroActivo, fase: 'ESTIMULO' }
}
