import type { Cambio } from '../state/selectors.ts'
import { formatearCambio } from './formato.ts'

interface Props {
  nombre: string
  cambios: readonly Cambio[]
}

export default function CartaEstimulo({ nombre, cambios }: Props) {
  return (
    <section
      aria-labelledby="titulo-estimulo"
      className="rounded-2xl border border-estimulo/50 bg-estimulo-suave p-4"
    >
      <p className="text-xs font-semibold tracking-wide text-estimulo-texto uppercase">Estímulo del entorno</p>
      <h3 id="titulo-estimulo" className="mt-1 text-xl font-bold">
        {nombre}
      </h3>
      <p className="mt-2 text-sm text-texto-suave">
        {cambios.length > 0 ? cambios.map(formatearCambio).join(' · ') : 'Sin cambios'}
      </p>
    </section>
  )
}
