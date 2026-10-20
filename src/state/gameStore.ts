import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { puedeSeleccionarEfector } from '../domain/engine/decision.ts'
import * as motor from '../domain/engine/partida.ts'
import type { IdEfector, Partida, Variable } from '../domain/types.ts'

// El store solo orquesta: cada acción delega en una función del dominio. Si el
// dominio rechaza la acción, el estado no cambia y se guarda el mensaje en `error`,
// junto con el control que lo produjo para mostrarlo a su lado.

/** Control de la interfaz al que pertenece un error. */
export type ControlError = 'inicio' | 'estimulo' | 'sensores' | 'efectores' | 'decision' | 'continuar'

export interface EstadoJuego {
  readonly partida: Partida | null
  /** Efectores elegidos por el jugador activo, aún sin confirmar. */
  readonly efectoresSeleccionados: readonly IdEfector[]
  readonly error: string | null
  readonly controlError: ControlError | null
}

export interface AccionesJuego {
  iniciarPartida: (codigo: string, nombres: readonly string[]) => void
  revelarEstimulo: () => void
  afinarSensor: (variable: Variable) => void
  /** Marca o desmarca un efector. La primera selección pasa de LECTURA a DECISION. */
  seleccionarEfector: (efector: IdEfector) => void
  confirmarDecision: () => void
  continuar: () => void
  reiniciarPartida: () => void
}

export type GameStore = EstadoJuego & AccionesJuego

export const CLAVE_PERSISTENCIA = 'regula-o-colapsa'

const ESTADO_INICIAL: EstadoJuego = {
  partida: null,
  efectoresSeleccionados: [],
  error: null,
  controlError: null,
}

const SIN_ERROR = { error: null, controlError: null } as const

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

/** LECTURA → DECISION al elegir el primer efector; en DECISION no cambia nada. */
function asegurarDecision(partida: Partida): Partida {
  const enDecision = partida.fase === 'LECTURA' ? motor.pasarADecision(partida) : partida
  if (enDecision.fase !== 'DECISION') {
    throw new Error(`No se pueden elegir efectores en la fase ${partida.fase}.`)
  }
  return enDecision
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      /** Aplica una transición del dominio a la partida en curso. */
      const ejecutar = (
        control: ControlError,
        transicion: (partida: Partida) => Partida,
        extra: Partial<EstadoJuego> = {},
      ) => {
        const { partida } = get()
        if (!partida) {
          set({ error: 'No hay una partida en curso.', controlError: control })
          return
        }
        try {
          set({ ...extra, partida: transicion(partida), ...SIN_ERROR })
        } catch (error) {
          set({ error: mensajeDeError(error), controlError: control })
        }
      }

      return {
        ...ESTADO_INICIAL,

        iniciarPartida: (codigo, nombres) => {
          try {
            set({ ...ESTADO_INICIAL, partida: motor.crearPartida(codigo, nombres) })
          } catch (error) {
            set({ error: mensajeDeError(error), controlError: 'inicio' })
          }
        },

        // El dominio toma el estímulo de la secuencia propia del jugador activo en el turno actual.
        revelarEstimulo: () => ejecutar('estimulo', motor.revelarEstimulo),

        // Tras afinar, los selectores revalidan la selección con los valores nuevos.
        afinarSensor: (variable) => ejecutar('sensores', (partida) => motor.afinarSensor(partida, variable)),

        seleccionarEfector: (efector) => {
          const actuales = get().efectoresSeleccionados
          const marcado = actuales.includes(efector)
          ejecutar(
            'efectores',
            (partida) => {
              const enDecision = asegurarDecision(partida)
              const valores = enDecision.turnoEnCurso?.valoresActuales
              if (!marcado && valores && !puedeSeleccionarEfector(valores, actuales, efector)) {
                throw new Error('No puedes activar más efectores en este turno.')
              }
              return enDecision
            },
            { efectoresSeleccionados: marcado ? actuales.filter((id) => id !== efector) : [...actuales, efector] },
          )
        },

        confirmarDecision: () =>
          ejecutar('decision', (partida) => motor.confirmarDecision(partida, get().efectoresSeleccionados), {
            efectoresSeleccionados: [],
          }),

        // El dominio deja turnoEnCurso en null: el siguiente jugador empieza en ESTIMULO
        // sin estímulo, lecturas ni selección del jugador anterior.
        continuar: () => ejecutar('continuar', motor.continuar, { efectoresSeleccionados: [] }),

        reiniciarPartida: () => set(ESTADO_INICIAL),
      }
    },
    {
      name: CLAVE_PERSISTENCIA,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (estado) => ({
        partida: estado.partida,
        efectoresSeleccionados: estado.efectoresSeleccionados,
      }),
    },
  ),
)
