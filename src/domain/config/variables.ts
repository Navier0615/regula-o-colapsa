import type { Valores, Variable } from '../types.ts'

export const VARIABLES: readonly Variable[] = ['temperatura', 'glucosa', 'hidratacion', 'energia']

export const NOMBRES_VARIABLES: Readonly<Record<Variable, string>> = {
  temperatura: 'Temperatura',
  glucosa: 'Glucosa',
  hidratacion: 'Hidratación',
  energia: 'Energía',
}

export const RANGO = { min: 0, max: 10 } as const

export const PUNTO_DE_AJUSTE = 5

export const VALORES_INICIALES: Valores = {
  temperatura: PUNTO_DE_AJUSTE,
  glucosa: PUNTO_DE_AJUSTE,
  hidratacion: PUNTO_DE_AJUSTE,
  energia: PUNTO_DE_AJUSTE,
}
