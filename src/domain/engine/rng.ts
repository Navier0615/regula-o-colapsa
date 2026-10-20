// Generador pseudoaleatorio reproducible: la misma semilla produce la misma
// secuencia en cualquier dispositivo. Las constantes son propias de los
// algoritmos (FNV-1a y mulberry32), no reglas del juego.

export type Rng = () => number

const FNV_OFFSET = 0x811c9dc5
const FNV_PRIMO = 0x01000193

/** Convierte una semilla de texto en un entero de 32 bits (FNV-1a). */
export function hashSemilla(semilla: string): number {
  let hash = FNV_OFFSET
  for (let i = 0; i < semilla.length; i++) {
    hash ^= semilla.charCodeAt(i)
    hash = Math.imul(hash, FNV_PRIMO)
  }
  return hash >>> 0
}

/** Crea un generador mulberry32 que devuelve números en [0, 1). */
export function crearRng(semilla: string): Rng {
  let estado = hashSemilla(semilla)
  return () => {
    estado = (estado + 0x6d2b79f5) | 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Entero uniforme en [min, max], ambos incluidos. */
export function enteroUniforme(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/** Devuelve una copia barajada (Fisher–Yates); no modifica el arreglo original. */
export function barajar<T>(elementos: readonly T[], rng: Rng): T[] {
  const copia = [...elementos]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = enteroUniforme(rng, 0, i)
    const temporal = copia[i]!
    copia[i] = copia[j]!
    copia[j] = temporal
  }
  return copia
}
