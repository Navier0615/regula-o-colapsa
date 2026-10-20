import type { Estimulo, IdEstimulo } from '../types.ts'

export const ESTIMULOS: Readonly<Record<IdEstimulo, Estimulo>> = {
  ejercicio: {
    id: 'ejercicio',
    nombre: 'Ejercicio intenso',
    efecto: { temperatura: 2, energia: -2, hidratacion: -1 },
  },
  calor: { id: 'calor', nombre: 'Día caluroso', efecto: { temperatura: 2, hidratacion: -2 } },
  frio: { id: 'frio', nombre: 'Noche fría', efecto: { temperatura: -3 } },
  lluvia: { id: 'lluvia', nombre: 'Lluvia y viento', efecto: { temperatura: -2, energia: -1 } },
  ayuno: { id: 'ayuno', nombre: 'Ayuno prolongado', efecto: { glucosa: -2, energia: -1 } },
  azucar: { id: 'azucar', nombre: 'Comida rica en azúcar', efecto: { glucosa: 3 } },
  infeccion: { id: 'infeccion', nombre: 'Infección leve', efecto: { temperatura: 2, energia: -1 } },
  estudio: { id: 'estudio', nombre: 'Jornada de estudio', efecto: { energia: -2, glucosa: -1 } },
  energizante: {
    id: 'energizante',
    nombre: 'Bebida energizante',
    efecto: { glucosa: 1, energia: 1, hidratacion: -1 },
  },
  tranquilo: { id: 'tranquilo', nombre: 'Día tranquilo', efecto: {} },
}

/** Orden canónico antes de barajar; fija la secuencia para una misma semilla. */
export const IDS_ESTIMULOS: readonly IdEstimulo[] = [
  'ejercicio',
  'calor',
  'frio',
  'lluvia',
  'ayuno',
  'azucar',
  'infeccion',
  'estudio',
  'energizante',
  'tranquilo',
]
