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
    return <p className="text-sm text-texto-tenue">No se activó ningún bucle de retroalimentación.</p>
  }
  return (
    <ul className="flex flex-col gap-2">
      {bucles.map((bucle) => {
        const { titulo, detalle } = describir(bucle)
        const positivo = bucle.tipo === 'positivo'
        return (
          <li
            key={`${bucle.causa}-${bucle.variable}`}
            className={`rounded-xl border p-3 ${positivo ? 'border-zona-amarilla/50 bg-zona-amarilla-suave' : 'border-zona-verde/50 bg-zona-verde-suave'}`}
          >
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              {titulo}
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${positivo ? 'border-zona-amarilla/50 text-zona-amarilla-texto' : 'border-zona-verde/50 text-zona-verde-texto'}`}
              >
                {positivo ? 'Bucle positivo' : 'Bucle negativo'}
              </span>
            </p>
            <p className="mt-1 text-sm text-texto-suave">{detalle}</p>
          </li>
        )
      })}
    </ul>
  )
}
