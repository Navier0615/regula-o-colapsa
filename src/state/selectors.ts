import { EFECTORES, IDS_EFECTORES } from '../domain/config/efectores.ts'
import { ESTIMULOS, IDS_ESTIMULOS } from '../domain/config/estimulos.ts'
import {
  AFINAR_SENSOR,
  AGOTAMIENTO,
  BONIFICACION_REGULACION,
  DESHIDRATACION,
  EFECTORES_POR_TURNO,
  FIEBRE,
  HIPOGLUCEMIA,
  JUGADORES,
  PUNTAJE_VICTORIA_SOLITARIO,
  PUNTOS_POR_ZONA,
  RUIDO_SENSORES,
  TOTAL_TURNOS,
  VALORES_COLAPSO,
} from '../domain/config/reglas.ts'
import { NOMBRES_VARIABLES, PUNTO_DE_AJUSTE, RANGO, VARIABLES } from '../domain/config/variables.ts'
import { ETIQUETAS_ZONA, INTERVALOS_ZONA } from '../domain/config/zonas.ts'
import {
  detectarSintomas,
  efectoDeEfector,
  efectoresPermitidos,
  puedeSeleccionarEfector,
  validarDecision,
  type Sintomas,
} from '../domain/engine/decision.ts'
import { estimuloDelTurno, franjaDeTurno, jugadorActual } from '../domain/engine/partida.ts'
import { clasificarJugadores, esVictoriaSolitario, zonaDe, type PosicionRanking } from '../domain/engine/puntuacion.ts'
import type {
  CausaBucle,
  Efecto,
  Estimulo,
  Fase,
  Franja,
  IdEfector,
  Jugador,
  Lecturas,
  Modo,
  Partida,
  Puntuacion,
  RegistroTurno,
  ResultadoValidacion,
  TipoBucle,
  Valores,
  Variable,
  Zona,
} from '../domain/types.ts'
import type { ControlError, EstadoJuego } from './gameStore.ts'

export type { CausaBucle, Fase, IdEfector, Modo, TipoBucle, Variable, Zona } from '../domain/types.ts'
export type { Sintomas } from '../domain/engine/decision.ts'

// Selectores para la UI. Cada uno expone solo lo que la fase actual permite ver:
// en ESTIMULO no hay estímulo, lecturas ni valores, para poder pasar el dispositivo.
// Nunca se exponen los valores reales durante un turno; solo lecturas y síntomas.
// Los selectores que derivan objetos nuevos se memorizan para que devuelvan la
// misma referencia mientras su entrada no cambie (requisito de Zustand).

function memorizar<Args extends readonly unknown[], R>(calcular: (...args: Args) => R): (...args: Args) => R {
  let ultimo: { args: Args; resultado: R } | null = null
  return (...args) => {
    const previo = ultimo
    if (!previo || args.some((arg, i) => arg !== previo.args[i])) {
      ultimo = { args, resultado: calcular(...args) }
      return ultimo.resultado
    }
    return previo.resultado
  }
}

const enTurno = (fase: Fase) => fase === 'LECTURA' || fase === 'DECISION'

const turnoVisible = (partida: Partida | null) =>
  partida && enTurno(partida.fase) ? partida.turnoEnCurso : null

// ---------------------------------------------------------------------------
// Datos de presentación
// ---------------------------------------------------------------------------

export interface Cambio {
  readonly variable: Variable
  readonly nombre: string
  readonly delta: number
}

/** Convierte un efecto en una lista de cambios con nombre, en el orden de VARIABLES. */
export function describirEfecto(efecto: Efecto): Cambio[] {
  return VARIABLES.flatMap((variable) => {
    const delta = efecto[variable]
    return delta ? [{ variable, nombre: NOMBRES_VARIABLES[variable], delta }] : []
  })
}

export const NOMBRES_FRANJA: Readonly<Record<Franja, string>> = {
  manana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
}

export interface VistaCatalogo {
  readonly id: string
  readonly nombre: string
  readonly cambios: readonly Cambio[]
}

export const CATALOGO_EFECTORES: readonly (VistaCatalogo & { ocupaTurnoCompleto: boolean })[] =
  IDS_EFECTORES.map((id) => ({
    id,
    nombre: EFECTORES[id].nombre,
    cambios: describirEfecto(EFECTORES[id].efecto),
    ocupaTurnoCompleto: EFECTORES[id].ocupaTurnoCompleto,
  }))

export const CATALOGO_ESTIMULOS: readonly VistaCatalogo[] = IDS_ESTIMULOS.map((id) => ({
  id,
  nombre: ESTIMULOS[id].nombre,
  cambios: describirEfecto(ESTIMULOS[id].efecto),
}))

/** Números de las reglas para los textos de la interfaz (instrucciones, avisos). */
export const REGLAS_VISIBLES = {
  totalTurnos: TOTAL_TURNOS,
  jugadores: JUGADORES,
  rango: RANGO,
  puntoDeAjuste: PUNTO_DE_AJUSTE,
  intervalosZona: INTERVALOS_ZONA,
  etiquetasZona: ETIQUETAS_ZONA,
  puntosPorZona: PUNTOS_POR_ZONA,
  bonificacion: BONIFICACION_REGULACION,
  ruido: RUIDO_SENSORES,
  costoAfinar: AFINAR_SENSOR.costoEnergia,
  efectoresPorTurno: EFECTORES_POR_TURNO,
  agotamiento: AGOTAMIENTO,
  deshidratacion: DESHIDRATACION,
  fiebre: FIEBRE,
  hipoglucemia: HIPOGLUCEMIA,
  valoresColapso: VALORES_COLAPSO,
  puntajeVictoria: PUNTAJE_VICTORIA_SOLITARIO,
  nombresVariables: NOMBRES_VARIABLES,
  variables: VARIABLES,
} as const

// ---------------------------------------------------------------------------
// Estado general
// ---------------------------------------------------------------------------

export const selectError = (s: EstadoJuego): string | null => s.error

/** Error solo si lo produjo el control indicado (para mostrarlo a su lado). */
export const selectErrorDe =
  (control: ControlError) =>
  (s: EstadoJuego): string | null =>
    s.controlError === control ? s.error : null

export const selectHayPartida = (s: EstadoJuego): boolean => s.partida !== null

/** Sin partida, la fase es CONFIGURACION. */
export const selectFase = (s: EstadoJuego): Fase => s.partida?.fase ?? 'CONFIGURACION'

export const selectModo = (s: EstadoJuego): Modo | null => s.partida?.modo ?? null

export const selectCodigo = (s: EstadoJuego): string | null => s.partida?.codigo ?? null

export const selectTurno = (s: EstadoJuego): number | null => s.partida?.turno ?? null

export const selectTotalTurnos = (): number => TOTAL_TURNOS

export const selectFranja = (s: EstadoJuego): Franja | null =>
  s.partida ? franjaDeTurno(s.partida.turno) : null

export const selectNombreFranja = (s: EstadoJuego): string | null => {
  const franja = selectFranja(s)
  return franja ? NOMBRES_FRANJA[franja] : null
}

/** Solo el nombre del jugador activo ("Turno de <nombre>"), sin sus valores. */
export const selectNombreJugadorActivo = (s: EstadoJuego): string | null =>
  s.partida && s.partida.fase !== 'FIN_DEL_DIA' ? jugadorActual(s.partida).nombre : null

export const selectIndiceJugadorActivo = (s: EstadoJuego): number | null =>
  s.partida && s.partida.fase !== 'FIN_DEL_DIA' ? s.partida.indiceJugador : null

/** Puntaje acumulado del jugador activo. */
export const selectPuntajeJugadorActivo = (s: EstadoJuego): number | null =>
  s.partida && s.partida.fase !== 'FIN_DEL_DIA' ? jugadorActual(s.partida).puntaje : null

// ---------------------------------------------------------------------------
// Turno en curso (LECTURA y DECISION)
// ---------------------------------------------------------------------------

/** Estímulo del jugador activo, visible solo tras revelarlo (LECTURA y DECISION). */
export const selectEstimuloActual = (s: EstadoJuego): Estimulo | null =>
  s.partida && enTurno(s.partida.fase) ? ESTIMULOS[estimuloDelTurno(s.partida)] : null

const cambiosDeEstimulo = memorizar((estimulo: Estimulo | null) =>
  estimulo ? describirEfecto(estimulo.efecto) : null,
)

export const selectCambiosEstimulo = (s: EstadoJuego): readonly Cambio[] | null =>
  cambiosDeEstimulo(selectEstimuloActual(s))

/** Lecturas de sensores del jugador activo (nunca los valores reales). */
export const selectLecturas = (s: EstadoJuego): Lecturas | null => turnoVisible(s.partida)?.lecturas ?? null

export const selectVariableAfinada = (s: EstadoJuego): Variable | null =>
  turnoVisible(s.partida)?.afinado ?? null

export const selectPuedeAfinar = (s: EstadoJuego): boolean => {
  const turno = turnoVisible(s.partida)
  return turno !== null && turno.afinado === null
}

export interface VistaMedidor {
  readonly variable: Variable
  readonly nombre: string
  readonly valor: number
  readonly afinada: boolean
  readonly margen: number
  /** Zona de la lectura (no del valor real). */
  readonly zona: Zona
  readonly etiquetaZona: string
}

const medidores = memorizar((lecturas: Lecturas | null): VistaMedidor[] | null =>
  lecturas
    ? VARIABLES.map((variable) => {
        const lectura = lecturas[variable]
        const zona = zonaDe(lectura.valor)
        return {
          variable,
          nombre: NOMBRES_VARIABLES[variable],
          valor: lectura.valor,
          afinada: lectura.afinada,
          margen: lectura.margen,
          zona,
          etiquetaZona: ETIQUETAS_ZONA[zona],
        }
      })
    : null,
)

export const selectMedidores = (s: EstadoJuego): VistaMedidor[] | null => medidores(selectLecturas(s))

const valoresDeDecision = (s: EstadoJuego): Valores | null => turnoVisible(s.partida)?.valoresActuales ?? null

const sintomas = memorizar((valores: Valores | null): Sintomas | null =>
  valores ? detectarSintomas(valores) : null,
)

/** Síntomas cualitativos (agotamiento, deshidratación) con los valores tras afinar. */
export const selectSintomas = (s: EstadoJuego): Sintomas | null => sintomas(valoresDeDecision(s))

/** Cuántos efectores se deben elegir (1 con agotamiento); Descansar cuenta como todos. */
export const selectEfectoresPermitidos = (s: EstadoJuego): number | null => {
  const valores = valoresDeDecision(s)
  return valores ? efectoresPermitidos(valores) : null
}

export const selectEfectoresSeleccionados = (s: EstadoJuego): readonly IdEfector[] =>
  s.efectoresSeleccionados

export interface VistaEfector {
  readonly id: IdEfector
  readonly nombre: string
  readonly cambios: readonly Cambio[]
  /** true si la deshidratación reduce su efecto (Sudar). */
  readonly reducidoPorDeshidratacion: boolean
  readonly ocupaTurnoCompleto: boolean
  readonly seleccionado: boolean
  /** false si marcarlo excedería los efectores permitidos. */
  readonly habilitado: boolean
}

const cartasEfectores = memorizar(
  (valores: Valores | null, seleccion: readonly IdEfector[]): VistaEfector[] | null =>
    valores
      ? IDS_EFECTORES.map((id) => {
          const efecto = efectoDeEfector(id, valores)
          return {
            id,
            nombre: EFECTORES[id].nombre,
            cambios: describirEfecto(efecto),
            reducidoPorDeshidratacion: efecto !== EFECTORES[id].efecto,
            ocupaTurnoCompleto: EFECTORES[id].ocupaTurnoCompleto,
            seleccionado: seleccion.includes(id),
            habilitado: puedeSeleccionarEfector(valores, seleccion, id),
          }
        })
      : null,
)

export const selectCartasEfectores = (s: EstadoJuego): VistaEfector[] | null =>
  cartasEfectores(valoresDeDecision(s), s.efectoresSeleccionados)

const validacion = memorizar(
  (fase: Fase, valores: Valores | null, seleccion: readonly IdEfector[]): ResultadoValidacion | null =>
    fase === 'DECISION' && valores ? validarDecision(valores, seleccion) : null,
)

/** Validación de la selección actual con las reglas del dominio (solo en DECISION). */
export const selectValidacionDecision = (s: EstadoJuego): ResultadoValidacion | null =>
  validacion(selectFase(s), valoresDeDecision(s), s.efectoresSeleccionados)

// ---------------------------------------------------------------------------
// Retroalimentación
// ---------------------------------------------------------------------------

/** Registro del turno recién resuelto del jugador activo (solo en RETROALIMENTACION). */
export const selectUltimoRegistro = (s: EstadoJuego): RegistroTurno | null =>
  s.partida?.fase === 'RETROALIMENTACION' ? (jugadorActual(s.partida).historial.at(-1) ?? null) : null

export interface VistaBucle {
  readonly tipo: TipoBucle
  readonly causa: CausaBucle
  readonly variable: Variable
  readonly nombreVariable: string
}

/** Zona de una variable al final del turno, sin su valor numérico. */
export interface VistaZonaFinal {
  readonly variable: Variable
  readonly nombre: string
  readonly zona: Zona
  readonly etiquetaZona: string
}

export interface ResumenTurno {
  readonly nombreJugador: string
  /** Zonas finales de las 4 variables; los valores exactos solo se revelan al final. */
  readonly zonasFinales: readonly VistaZonaFinal[]
  readonly turno: number
  readonly estimulo: string
  readonly efectores: readonly string[]
  readonly afinado: string | null
  readonly bucles: readonly VistaBucle[]
  readonly puntuacion: Puntuacion
  readonly puntajeAcumulado: number
  readonly colapso: boolean
}

const resumenTurno = memorizar((registro: RegistroTurno | null, jugador: Jugador | null): ResumenTurno | null =>
  registro && jugador
    ? {
        nombreJugador: jugador.nombre,
        zonasFinales: VARIABLES.map((variable) => {
          const zona = zonaDe(registro.valoresFinales[variable])
          return { variable, nombre: NOMBRES_VARIABLES[variable], zona, etiquetaZona: ETIQUETAS_ZONA[zona] }
        }),
        turno: registro.turno,
        estimulo: ESTIMULOS[registro.estimulo].nombre,
        efectores: registro.efectores.map((id) => EFECTORES[id].nombre),
        afinado: registro.afinado ? NOMBRES_VARIABLES[registro.afinado] : null,
        bucles: registro.bucles.map((b) => ({ ...b, nombreVariable: NOMBRES_VARIABLES[b.variable] })),
        puntuacion: registro.puntuacion,
        puntajeAcumulado: jugador.puntaje,
        colapso: registro.colapso,
      }
    : null,
)

/** Resumen del turno recién jugado, sin valores reales (solo en RETROALIMENTACION). */
export const selectResumenTurno = (s: EstadoJuego): ResumenTurno | null =>
  resumenTurno(
    selectUltimoRegistro(s),
    s.partida?.fase === 'RETROALIMENTACION' ? jugadorActual(s.partida) : null,
  )

// ---------------------------------------------------------------------------
// Fin del día
// ---------------------------------------------------------------------------

/** Todos los jugadores con sus datos completos: solo al terminar la partida. */
export const selectJugadoresFinales = (s: EstadoJuego): readonly Jugador[] | null =>
  s.partida?.fase === 'FIN_DEL_DIA' ? s.partida.jugadores : null

const ranking = memorizar((jugadores: readonly Jugador[] | null): PosicionRanking[] | null =>
  jugadores ? clasificarJugadores(jugadores) : null,
)

/** Ranking con desempates del dominio: solo al terminar la partida. */
export const selectRanking = (s: EstadoJuego): PosicionRanking[] | null => ranking(selectJugadoresFinales(s))

/** En solitario y al terminar: true si ganó, false si perdió; null en otro caso. */
export const selectVictoriaSolitario = (s: EstadoJuego): boolean | null => {
  const unico = selectJugadoresFinales(s)?.[0]
  return s.partida?.modo === 'solitario' && unico ? esVictoriaSolitario(unico) : null
}

export interface PuntoEvolucion extends Record<Variable, number> {
  readonly turno: number
}

export interface FilaResultado {
  readonly posicion: number
  readonly nombre: string
  readonly puntaje: number
  readonly turnosEnRojo: number
  readonly energiaFinal: number
  readonly turnosJugados: number
  readonly colapsado: boolean
  /** Valores reales turno a turno (turno 0 = inicio). Solo se revelan al final. */
  readonly evolucion: readonly PuntoEvolucion[]
}

function evolucionDe(jugador: Jugador): PuntoEvolucion[] {
  const inicio = jugador.historial[0]?.valoresInicio
  return [
    ...(inicio ? [{ turno: 0, ...inicio }] : []),
    ...jugador.historial.map((registro) => ({ turno: registro.turno, ...registro.valoresFinales })),
  ]
}

const filasResultado = memorizar((posiciones: PosicionRanking[] | null): FilaResultado[] | null =>
  posiciones
    ? posiciones.map(({ jugador }, i) => ({
        posicion: i + 1,
        nombre: jugador.nombre,
        puntaje: jugador.puntaje,
        turnosEnRojo: jugador.turnosEnRojo,
        energiaFinal: jugador.valores.energia,
        turnosJugados: jugador.historial.length,
        colapsado: jugador.colapsado,
        evolucion: evolucionDe(jugador),
      }))
    : null,
)

/** Filas del ranking (o del único jugador en solitario), con su evolución. */
export const selectResultados = (s: EstadoJuego): FilaResultado[] | null => filasResultado(selectRanking(s))
