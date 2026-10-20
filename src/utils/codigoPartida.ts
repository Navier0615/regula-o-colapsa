import { CODIGO_PARTIDA } from '../domain/config/reglas.ts'

// Utilidades del código de partida TGS-XXXX.

/** Código nuevo al azar (la semilla de la partida; no necesita ser reproducible). */
export function generarCodigo(aleatorio: () => number = Math.random): string {
  const maximo = 10 ** CODIGO_PARTIDA.digitos
  const numero = Math.floor(aleatorio() * maximo)
  return `${CODIGO_PARTIDA.prefijo}${String(numero).padStart(CODIGO_PARTIDA.digitos, '0')}`
}

const LETRAS_PREFIJO = CODIGO_PARTIDA.prefijo.replace(/-$/, '')

/**
 * Normaliza lo que escribe el jugador: ignora espacios, guiones y mayúsculas, y
 * acepta solo los dígitos ("1234", "tgs 1234" → "TGS-1234"). No valida el formato.
 */
export function normalizarCodigo(texto: string): string {
  const limpio = texto.toUpperCase().replace(/[\s-]+/g, '')
  const digitos = limpio.startsWith(LETRAS_PREFIJO) ? limpio.slice(LETRAS_PREFIJO.length) : limpio
  return /^\d+$/.test(digitos) ? `${CODIGO_PARTIDA.prefijo}${digitos}` : texto.trim().toUpperCase()
}
