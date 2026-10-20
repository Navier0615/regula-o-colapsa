import { VARIABLES } from '../config/variables.ts'
import { VALORES_COLAPSO } from '../config/reglas.ts'
import type { Valores, Variable } from '../types.ts'

/** Variables que terminan el turno en un valor de colapso (0 o 10). */
export function variablesEnColapso(valores: Valores): Variable[] {
  return VARIABLES.filter((variable) => VALORES_COLAPSO.includes(valores[variable]))
}

/** Paso 5: el organismo colapsa si alguna variable está en 0 o 10. */
export function verificarColapso(valores: Valores): boolean {
  return variablesEnColapso(valores).length > 0
}
