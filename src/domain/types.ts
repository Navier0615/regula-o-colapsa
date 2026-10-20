// Tipos del dominio de "Regula o Colapsa". Sin dependencias de UI.

export type Variable = 'temperatura' | 'glucosa' | 'hidratacion' | 'energia'

export type Valores = Readonly<Record<Variable, number>>

/** Cambio que un estímulo o efector produce sobre las variables. */
export type Efecto = Readonly<Partial<Record<Variable, number>>>

export type Zona = 'verde' | 'amarilla' | 'roja'

export type Franja = 'manana' | 'tarde' | 'noche'

export type Modo = 'solitario' | 'multijugador'

export type Fase =
  | 'CONFIGURACION'
  | 'ESTIMULO'
  | 'LECTURA'
  | 'DECISION'
  | 'RETROALIMENTACION'
  | 'FIN_DEL_DIA'

export type IdEstimulo =
  | 'ejercicio'
  | 'calor'
  | 'frio'
  | 'lluvia'
  | 'ayuno'
  | 'azucar'
  | 'infeccion'
  | 'estudio'
  | 'energizante'
  | 'tranquilo'

export interface Estimulo {
  readonly id: IdEstimulo
  readonly nombre: string
  readonly efecto: Efecto
}

export type IdEfector =
  | 'sudar'
  | 'tiritar'
  | 'insulina'
  | 'glucagon'
  | 'beber'
  | 'comer'
  | 'descansar'

export interface Efector {
  readonly id: IdEfector
  readonly nombre: string
  readonly efecto: Efecto
  /** Variable que regula su efecto principal; el resto de su efecto es secundario. */
  readonly regula: Variable
  /** true si el efector ocupa todos los efectores del turno (Descansar). */
  readonly ocupaTurnoCompleto: boolean
}

export interface Lectura {
  readonly valor: number
  readonly afinada: boolean
  /** Margen de ruido m con el que se generó la lectura (0 si está afinada). */
  readonly margen: number
}

export type Lecturas = Readonly<Record<Variable, Lectura>>

export type TipoBucle = 'positivo' | 'negativo'

export type CausaBucle = 'fiebre' | 'hipoglucemia' | 'deshidratacion' | 'agotamiento' | 'regulacion'

export interface Bucle {
  readonly tipo: TipoBucle
  readonly causa: CausaBucle
  readonly variable: Variable
}

export interface Puntuacion {
  readonly base: number
  readonly bonificacion: number
  readonly total: number
  /** Variables en zona roja al final del turno (se suma a turnosEnRojo). */
  readonly enRojo: number
}

export type ResultadoValidacion =
  | { readonly valida: true }
  | { readonly valida: false; readonly motivo: string }

export interface RegistroTurno {
  readonly turno: number
  readonly estimulo: IdEstimulo
  readonly valoresInicio: Valores
  readonly valoresTrasEstimulo: Valores
  readonly afinado: Variable | null
  readonly efectores: readonly IdEfector[]
  readonly valoresFinales: Valores
  readonly bucles: readonly Bucle[]
  readonly puntuacion: Puntuacion
  readonly colapso: boolean
}

export interface Jugador {
  readonly nombre: string
  /** Los 8 estímulos de la partida en el orden propio de este jugador. */
  readonly secuenciaEstimulos: readonly IdEstimulo[]
  /** Valores reales al final de su último turno resuelto. */
  readonly valores: Valores
  readonly puntaje: number
  readonly turnosEnRojo: number
  readonly colapsado: boolean
  readonly historial: readonly RegistroTurno[]
}

/** Datos del turno del jugador actual entre ESTIMULO y la confirmación. */
export interface TurnoEnCurso {
  readonly valoresInicio: Valores
  readonly valoresTrasEstimulo: Valores
  /** Valores reales tras el estímulo y el posible costo de afinar. */
  readonly valoresActuales: Valores
  readonly lecturas: Lecturas
  readonly afinado: Variable | null
}

export interface Partida {
  readonly codigo: string
  readonly modo: Modo
  readonly jugadores: readonly Jugador[]
  /** Turno actual, de 1 a TOTAL_TURNOS. */
  readonly turno: number
  readonly indiceJugador: number
  readonly fase: Fase
  readonly turnoEnCurso: TurnoEnCurso | null
}
