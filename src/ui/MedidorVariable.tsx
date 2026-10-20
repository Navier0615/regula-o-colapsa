import type { ReactNode } from 'react'
import type { VistaMedidor } from '../state/selectors.ts'
import { CLASES_ETIQUETA_ZONA, ESTILOS_ZONA } from './formato.ts'

interface Props {
  medidor: VistaMedidor
  /** Mínimo y máximo de la escala. */
  rango: { readonly min: number; readonly max: number }
  /** Tramos de zona para pintar la escala. */
  intervalos: readonly { readonly zona: VistaMedidor['zona']; readonly min: number; readonly max: number }[]
  children?: ReactNode
}

export default function MedidorVariable({ medidor, rango, intervalos, children }: Props) {
  const { nombre, valor, afinada, margen, zona, etiquetaZona } = medidor
  const estilo = ESTILOS_ZONA[zona]
  const pasos = rango.max - rango.min + 1
  const porcentaje = (v: number) => ((v - rango.min + 0.5) / pasos) * 100
  const desde = Math.max(rango.min, valor - margen)
  const hasta = Math.min(rango.max, valor + margen)
  const texto = afinada ? `= ${valor} real` : `≈ ${valor} ±${margen}`

  return (
    <article className={`flex flex-col gap-3 rounded-2xl border bg-superficie p-4 ${estilo.borde}`}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold">{nombre}</h4>
        <span className={`${CLASES_ETIQUETA_ZONA} ${estilo.texto}`}>
          <span aria-hidden="true" className={`size-2.5 rounded-full ${estilo.punto}`} />
          {etiquetaZona}
        </span>
      </div>

      <p className="text-3xl font-bold tabular-nums" aria-label={`${nombre}: lectura ${texto}, zona ${etiquetaZona}`}>
        {texto}
      </p>

      <div aria-hidden="true" className="relative h-3">
        <div className="absolute inset-0 flex gap-0.5 overflow-hidden rounded-full">
          {intervalos.map((tramo) => (
            <div
              key={`${tramo.zona}-${tramo.min}`}
              className={ESTILOS_ZONA[tramo.zona].escala}
              style={{ flexGrow: tramo.max - tramo.min + 1 }}
            />
          ))}
        </div>
        {!afinada && (
          <div
            className="absolute -inset-y-0.5 rounded-full bg-texto/15 ring-1 ring-texto/40"
            style={{ left: `${porcentaje(desde) - 50 / pasos}%`, right: `${100 - porcentaje(hasta) - 50 / pasos}%` }}
          />
        )}
        <div
          className="absolute -inset-y-1 w-1 -translate-x-1/2 rounded-full bg-texto"
          style={{ left: `${porcentaje(valor)}%` }}
        />
      </div>

      {children}
    </article>
  )
}
