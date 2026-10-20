import { VARIABLES, RANGO } from '../config/variables.ts'
import { AGOTAMIENTO, DESHIDRATACION, FIEBRE, HIPOGLUCEMIA } from '../config/reglas.ts'
import type { Bucle, Efecto, Valores } from '../types.ts'
import { zonaDe } from './puntuacion.ts'

/** Limita un valor al rango 0–10. */
export function limitar(valor: number): number {
  return Math.min(RANGO.max, Math.max(RANGO.min, valor))
}

/** Paso 4: aplica el clamp 0–10 a todas las variables. */
export function limitarRango(valores: Valores): Valores {
  return {
    temperatura: limitar(valores.temperatura),
    glucosa: limitar(valores.glucosa),
    hidratacion: limitar(valores.hidratacion),
    energia: limitar(valores.energia),
  }
}

/** Suma un efecto a los valores, sin limitar el rango. */
export function sumarEfecto(valores: Valores, efecto: Efecto): Valores {
  return {
    temperatura: valores.temperatura + (efecto.temperatura ?? 0),
    glucosa: valores.glucosa + (efecto.glucosa ?? 0),
    hidratacion: valores.hidratacion + (efecto.hidratacion ?? 0),
    energia: valores.energia + (efecto.energia ?? 0),
  }
}

export interface ResultadoRetroalimentacion {
  readonly valores: Valores
  readonly bucles: readonly Bucle[]
}

/**
 * Paso 3: aplica los bucles de retroalimentación tras los efectores.
 * `valoresTrasEstimulo` sirve para detectar los bucles negativos (regulación exitosa).
 * No aplica el clamp; eso corresponde a `limitarRango`.
 */
export function aplicarRetroalimentacion(
  valores: Valores,
  valoresTrasEstimulo: Valores,
): ResultadoRetroalimentacion {
  const bucles: Bucle[] = []
  let resultado = valores

  if (resultado.temperatura >= FIEBRE.umbral) {
    resultado = sumarEfecto(resultado, { temperatura: FIEBRE.incremento })
    bucles.push({ tipo: 'positivo', causa: 'fiebre', variable: 'temperatura' })
  }

  if (resultado.glucosa <= HIPOGLUCEMIA.umbral) {
    resultado = sumarEfecto(resultado, { energia: HIPOGLUCEMIA.efectoEnergia })
    bucles.push({ tipo: 'positivo', causa: 'hipoglucemia', variable: 'glucosa' })
  }

  if (resultado.hidratacion <= DESHIDRATACION.umbral) {
    bucles.push({ tipo: 'positivo', causa: 'deshidratacion', variable: 'hidratacion' })
  }

  if (resultado.energia <= AGOTAMIENTO.umbral) {
    bucles.push({ tipo: 'positivo', causa: 'agotamiento', variable: 'energia' })
  }

  for (const variable of VARIABLES) {
    const fueraTrasEstimulo = zonaDe(valoresTrasEstimulo[variable]) !== 'verde'
    const terminaEnVerde = zonaDe(limitar(resultado[variable])) === 'verde'
    if (fueraTrasEstimulo && terminaEnVerde) {
      bucles.push({ tipo: 'negativo', causa: 'regulacion', variable })
    }
  }

  return { valores: resultado, bucles }
}
