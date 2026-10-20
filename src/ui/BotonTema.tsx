import { useEffect, useState } from 'react'
import { aplicarTema, consultaTemaSistema, guardarTema, leerTemaGuardado, temaInicial, type Tema } from './tema.ts'

/** Alterna claro/oscuro. Mientras no se elija uno, sigue al sistema. */
export default function BotonTema() {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useEffect(() => {
    aplicarTema(tema)
  }, [tema])

  useEffect(() => {
    const consulta = consultaTemaSistema()
    if (!consulta) {
      return
    }
    const alCambiar = (evento: MediaQueryListEvent) => {
      if (leerTemaGuardado() === null) {
        setTema(evento.matches ? 'oscuro' : 'claro')
      }
    }
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])

  const siguiente: Tema = tema === 'oscuro' ? 'claro' : 'oscuro'
  const alternar = () => {
    guardarTema(siguiente)
    setTema(siguiente)
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={`Cambiar a tema ${siguiente}`}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-texto-suave ring-1 ring-borde transition-colors hover:bg-elevado"
    >
      <span aria-hidden="true" className="text-base">
        {tema === 'oscuro' ? '☀' : '☾'}
      </span>
      <span>{tema === 'oscuro' ? 'Claro' : 'Oscuro'}</span>
    </button>
  )
}
