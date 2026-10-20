import { REGLAS_VISIBLES, type VistaBucle } from '../state/selectors.ts'
import { formatearDelta } from './formato.ts'

const { fiebre, hipoglucemia, agotamiento } = REGLAS_VISIBLES

function describir(bucle: VistaBucle): { titulo: string; detalle: string } {
  switch (bucle.causa) {
    case 'fiebre':
      return {
        titulo: 'Fiebre',
        detalle: `La temperatura alta se refuerza a sí misma (${formatearDelta(fiebre.incremento)}).`,
      }
    case 'hipoglucemia':
      return {
        titulo: 'Hipoglucemia',
        detalle: `La glucosa baja consume energía (${formatearDelta(hipoglucemia.efectoEnergia)}).`,
      }
    case 'deshidratacion':
      return { titulo: 'Deshidratación', detalle: 'En el próximo turno, sudar enfriará menos.' }
    case 'agotamiento':
      return {
        titulo: 'Agotamiento',
        detalle: `En el próximo turno solo podrás activar ${agotamiento.efectoresPermitidos} efector.`,
      }
    case 'regulacion':
      return { titulo: 'Regulación exitosa', detalle: `${bucle.nombreVariable} volvió a la zona verde.` }
  }
}

interface Props {
  bucles: readonly VistaBucle[]
}

export default function RegistroBucles({ bucles }: Props) {
  if (bucles.length === 0) {
    return <p className="text-sm text-slate-400">No se activó ningún bucle de retroalimentación.</p>
  }
  return (
    <ul className="flex flex-col gap-2">
      {bucles.map((bucle) => {
        const { titulo, detalle } = describir(bucle)
        const positivo = bucle.tipo === 'positivo'
        return (
          <li
            key={`${bucle.causa}-${bucle.variable}`}
            className={`rounded-xl border p-3 ${positivo ? 'border-amber-500/40 bg-amber-950/30' : 'border-emerald-500/40 bg-emerald-950/30'}`}
          >
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              {titulo}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${positivo ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-400/15 text-emerald-300'}`}
              >
                {positivo ? 'Bucle positivo' : 'Bucle negativo'}
              </span>
            </p>
            <p className="mt-1 text-sm text-slate-300">{detalle}</p>
          </li>
        )
      })}
    </ul>
  )
}
