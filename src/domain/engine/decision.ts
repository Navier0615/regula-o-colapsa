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
    const motivo =
      permitidos < EFECTORES_POR_TURNO
        ? `Agotamiento: con energía ≤ ${AGOTAMIENTO.umbral} solo puedes elegir ${permitidos} efector.`
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
 * Si el efector se puede marcar sin exceder lo permitido. Un efector ya
 * seleccionado siempre se puede desmarcar. Descansar solo se marca con la
 * selección vacía y, marcado, bloquea a los demás.
 */
export function puedeSeleccionarEfector(
  valores: Valores,
  seleccion: readonly IdEfector[],
  efector: IdEfector,
): boolean {
  if (seleccion.includes(efector)) {
    return true
  }
  if (seleccion.some((id) => EFECTORES[id].ocupaTurnoCompleto)) {
    return false
  }
  if (EFECTORES[efector].ocupaTurnoCompleto) {
    return seleccion.length === 0
  }
  return seleccion.length < efectoresPermitidos(valores)
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
