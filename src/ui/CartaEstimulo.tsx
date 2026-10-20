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
      className="rounded-2xl border border-violet-500/40 bg-violet-950/40 p-4"
    >
      <p className="text-xs font-semibold tracking-wide text-violet-300 uppercase">Estímulo del entorno</p>
      <h3 id="titulo-estimulo" className="mt-1 text-xl font-bold">
        {nombre}
      </h3>
      <p className="mt-2 text-sm text-slate-300">
        {cambios.length > 0 ? cambios.map(formatearCambio).join(' · ') : 'Sin cambios'}
      </p>
    </section>
  )
}
