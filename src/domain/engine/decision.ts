import { EFECTORES } from '../config/efectores.ts'
import { AGOTAMIENTO, DESHIDRATACION, EFECTORES_POR_TURNO } from '../config/reglas.ts'
import type { Efecto, IdEfector, ResultadoValidacion, Valores } from '../types.ts'
import { sumarEfecto } from './retroalimentacion.ts'

/** Cantidad de efectores que se deben elegir según la energía real. */
export function efectoresPermitidos(valores: Valores): number {
  return valores.energia <= AGOTAMIENTO.umbral ? AGOTAMIENTO.efectoresPermitidos : EFECTORES_POR_TURNO
}

/**
 * Paso 1: valida la decisión con los valores reales al momento de decidir (tras afinar).
 * Descansar es válido solo, también con agotamiento. En otro caso se deben elegir
 * exactamente `efectoresPermitidos` efectores distintos.
 */
export function validarDecision(valores: Valores, efectores: readonly IdEfector[]): ResultadoValidacion {
  if (efectores.length === 0) {
    return { valida: false, motivo: 'Elige al menos un efector.' }
  }
  if (new Set(efectores).size !== efectores.length) {
    return { valida: false, motivo: 'No puedes repetir un efector en el mismo turno.' }
  }
  if (efectores.some((id) => EFECTORES[id].ocupaTurnoCompleto)) {
    return efectores.length === 1
      ? { valida: true }
      : { valida: false, motivo: 'Descansar ocupa todos los efectores del turno.' }
  }

  const permitidos = efectoresPermitidos(valores)
  if (efectores.length !== permitidos) {
    // Con agotamiento se informa el síntoma, nunca el umbral ni el valor real.
    const motivo =
      permitidos < EFECTORES_POR_TURNO
        ? `Tu organismo está agotado: solo puedes activar ${permitidos} efector`
        : `Debes elegir ${permitidos} efectores distintos.`
    return { valida: false, motivo }
  }
  return { valida: true }
}

export interface Sintomas {
  /** energia ≤ umbral: solo se permite 1 efector (o Descansar). */
  readonly agotamiento: boolean
  /** hidratacion ≤ umbral: sudar enfría menos. */
  readonly deshidratacion: boolean
}

/** Restricciones activas al decidir, como síntomas cualitativos (sin valores reales). */
export function detectarSintomas(valores: Valores): Sintomas {
  return {
    agotamiento: valores.energia <= AGOTAMIENTO.umbral,
    deshidratacion: valores.hidratacion <= DESHIDRATACION.umbral,
  }
}

/**
 * Por qué un efector no se puede marcar ahora:
 * - agotamiento: con agotamiento ya se eligió el único efector permitido.
 * - limite: ya se eligieron los efectores del turno.
 * - turno-completo: Descansar está elegido y ocupa todo el turno.
 * - requiere-turno-libre: Descansar necesita la selección vacía.
 */
export type MotivoBloqueo = 'agotamiento' | 'limite' | 'turno-completo' | 'requiere-turno-libre'

/** Motivo por el que el efector no se puede marcar, o null si se puede (o desmarcar). */
export function motivoBloqueoEfector(
  valores: Valores,
  seleccion: readonly IdEfector[],
  efector: IdEfector,
): MotivoBloqueo | null {
  if (seleccion.includes(efector)) {
    return null
  }
  if (seleccion.some((id) => EFECTORES[id].ocupaTurnoCompleto)) {
    return 'turno-completo'
  }
  if (EFECTORES[efector].ocupaTurnoCompleto) {
    return seleccion.length === 0 ? null : 'requiere-turno-libre'
  }
  const permitidos = efectoresPermitidos(valores)
  if (seleccion.length < permitidos) {
    return null
  }
  return permitidos < EFECTORES_POR_TURNO ? 'agotamiento' : 'limite'
}

/**
 * Si el efector se puede marcar sin exceder lo permitido. Un efector ya
 * seleccionado siempre se puede desmarcar. Descansar solo se marca con la
 * selección vacía y, marcado, bloquea a los demás.
 */
export function puedeSeleccionarEfector(
  valores: Valores,
  seleccion: readonly IdEfector[],
  efector: IdEfector,
): boolean {
  return motivoBloqueoEfector(valores, seleccion, efector) === null
}

/** Cupo de efectores ocupado por la selección (Descansar ocupa todo el cupo). */
export function efectoresOcupados(valores: Valores, seleccion: readonly IdEfector[]): number {
  return seleccion.some((id) => EFECTORES[id].ocupaTurnoCompleto) ? efectoresPermitidos(valores) : seleccion.length
}

/** Efecto real de un efector; con deshidratación, sudar enfría menos. */
export function efectoDeEfector(id: IdEfector, valores: Valores): Efecto {
  const efecto = EFECTORES[id].efecto
  if (id === 'sudar' && valores.hidratacion <= DESHIDRATACION.umbral) {
    return { ...efecto, temperatura: DESHIDRATACION.efectoSudarTemperatura }
  }
  return efecto
}

/**
 * Paso 2: aplica los efectores. Las condiciones (deshidratación) se evalúan con
 * los valores al momento de decidir, no con los intermedios. No limita el rango.
 */
export function aplicarEfectores(valores: Valores, efectores: readonly IdEfector[]): Valores {
  return efectores.reduce((acumulado, id) => sumarEfecto(acumulado, efectoDeEfector(id, valores)), valores)
}
