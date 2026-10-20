import type { ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router'

type Variante = 'primario' | 'secundario' | 'fantasma'

const BASE =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-sky-400 text-slate-950 hover:bg-sky-300 disabled:hover:bg-sky-400',
  secundario: 'bg-slate-800 text-slate-100 ring-1 ring-slate-700 hover:bg-slate-700 disabled:hover:bg-slate-800',
  fantasma: 'text-sky-300 hover:bg-slate-800/70',
}

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  anchoCompleto?: boolean
  /** Si se indica, se renderiza como enlace de navegación con aspecto de botón. */
  a?: string
}

export default function Boton({
  variante = 'primario',
  anchoCompleto = false,
  a,
  className = '',
  type = 'button',
  children,
  ...props
}: PropsBoton) {
  const clases = `${BASE} ${VARIANTES[variante]} ${anchoCompleto ? 'w-full' : ''} ${className}`
  if (a !== undefined) {
    return (
      <Link to={a} className={clases}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={clases} {...props}>
      {children}
    </button>
  )
}
