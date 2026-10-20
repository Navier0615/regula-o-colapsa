interface Props {
  mensaje: string | null
  id?: string
}

/** Error del store mostrado junto al control que lo produjo. */
export default function MensajeError({ mensaje, id }: Props) {
  if (!mensaje) {
    return null
  }
  return (
    <p id={id} role="alert" className="rounded-lg border border-rose-500/40 bg-rose-950/60 px-3 py-2 text-sm text-rose-200">
      {mensaje}
    </p>
  )
}
