import type { Efector, IdEfector } from '../types.ts'

export const EFECTORES: Readonly<Record<IdEfector, Efector>> = {
  sudar: {
    id: 'sudar',
    nombre: 'Sudar',
    efecto: { temperatura: -2, hidratacion: -1 },
    ocupaTurnoCompleto: false,
  },
  tiritar: {
    id: 'tiritar',
    nombre: 'Tiritar',
    efecto: { temperatura: 2, energia: -1 },
    ocupaTurnoCompleto: false,
  },
  insulina: {
    id: 'insulina',
    nombre: 'Liberar insulina',
    efecto: { glucosa: -2 },
    ocupaTurnoCompleto: false,
  },
  glucagon: {
    id: 'glucagon',
    nombre: 'Liberar glucagón',
    efecto: { glucosa: 2, energia: -1 },
    ocupaTurnoCompleto: false,
  },
  beber: {
    id: 'beber',
    nombre: 'Beber agua',
    efecto: { hidratacion: 2 },
    ocupaTurnoCompleto: false,
  },
  comer: {
    id: 'comer',
    nombre: 'Comer',
    efecto: { glucosa: 2, energia: 1, temperatura: 1 },
    ocupaTurnoCompleto: false,
  },
  descansar: {
    id: 'descansar',
    nombre: 'Descansar',
    efecto: { energia: 2 },
    ocupaTurnoCompleto: true,
  },
}

export const IDS_EFECTORES: readonly IdEfector[] = [
  'sudar',
  'tiritar',
  'insulina',
  'glucagon',
  'beber',
  'comer',
  'descansar',
]
