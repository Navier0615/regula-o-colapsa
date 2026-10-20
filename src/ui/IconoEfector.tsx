import type { ReactNode } from 'react'
import type { IdEfector } from '../state/selectors.ts'

// Íconos propios de cada efector (SVG en línea, 24×24, trazo con currentColor).

const TRAZOS: Readonly<Record<IdEfector, ReactNode>> = {
  // Gotas de sudor.
  sudar: (
    <>
      <path d="M11 4c-3 4-5 6.6-5 9.2a5 5 0 0 0 10 0C16 10.6 14 8 11 4z" />
      <path d="M18.5 3.5c-1.1 1.5-1.8 2.5-1.8 3.4a1.8 1.8 0 0 0 3.6 0c0-.9-.7-1.9-1.8-3.4z" />
    </>
  ),
  // Copo de nieve (escalofrío).
  tiritar: (
    <>
      <path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5" />
      <path d="M9.5 4 12 6.5 14.5 4M9.5 20l2.5-2.5 2.5 2.5" />
      <path d="M3.4 10.6 6.8 9.7 5.9 6.3M20.6 13.4l-3.4.9.9 3.4" />
    </>
  ),
  // Jeringa.
  insulina: (
    <g transform="rotate(45 12 12)">
      <rect x="9" y="5" width="6" height="11" rx="1" />
      <path d="M12 16v6M12 5V2M9.5 2h5M9 8.5h3M9 11.5h3" />
    </g>
  ),
  // Cubo de azúcar con flecha hacia arriba (libera glucosa).
  glucagon: (
    <>
      <path d="M3 13.5 9 10.5l6 3-6 3z" />
      <path d="M3 13.5v6l6 3 6-3v-6M9 16.5v6" />
      <path d="M19 12V3M16 6l3-3 3 3" />
    </>
  ),
  // Vaso de agua.
  beber: (
    <>
      <path d="M5.5 3h13l-1.6 17.2a2 2 0 0 1-2 1.8H9.1a2 2 0 0 1-2-1.8z" />
      <path d="M6.4 10c1.9-1 3.7-1 5.6 0s3.7 1 5.6 0" />
    </>
  ),
  // Manzana.
  comer: (
    <>
      <path d="M12 7.5c-1.6-1.1-5.2-1.6-6.7 1.4-1.4 2.8-.6 7.3 1.9 10.6 1.3 1.7 2.8 2 4.8 1 2 1 3.5.7 4.8-1 2.5-3.3 3.3-7.8 1.9-10.6-1.5-3-5.1-2.5-6.7-1.4z" />
      <path d="M12 7.5c0-2.2 1.2-3.8 3.3-4.5" />
    </>
  ),
  // Luna con "z" (descanso).
  descansar: (
    <>
      <path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.4 6.4 0 0 0 10 10z" />
      <path d="M14.5 3h4l-4 4h4" />
    </>
  ),
}

interface Props {
  efector: IdEfector
  className?: string
}

export default function IconoEfector({ efector, className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {TRAZOS[efector]}
    </svg>
  )
}
