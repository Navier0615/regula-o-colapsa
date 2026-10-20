# Regula o Colapsa — Contexto del proyecto

## Descripción
Nombre del juego: "Regula o Colapsa". Slug técnico: regula-o-colapsa.
Juego educativo web, responsive, para el parcial de Teoría General de Sistemas (TGS).
El jugador es el centro de control de un organismo humano y debe mantener 4 variables
fisiológicas en homeostasis durante 8 turnos. Integra: Cibernética, TGS en sistemas
biológicos, Teoría de la decisión y Entropía en la información.
Se juega desde el navegador (iPhone y Android) accediendo por código QR. Sin backend.

## Stack obligatorio
- TypeScript en modo strict
- React + Vite
- Zustand con middleware persist (localStorage)
- React Router con HashRouter
- Tailwind CSS (instalación oficial vigente para Vite)
- Recharts para la gráfica de evolución
- vite-plugin-pwa (instalable y con funcionamiento offline)
- Vitest + React Testing Library
- Despliegue en GitHub Pages mediante GitHub Actions
- En vite.config.ts: base: '/regula-o-colapsa/'
No agregar otras dependencias sin consultarme primero.

## Arquitectura en capas
- `src/domain/`: motor del juego. TypeScript puro, SIN React ni imports de UI.
  Funciones puras: reciben estado y devuelven estado nuevo (inmutabilidad).
- `src/domain/config/`: todos los valores numéricos del juego como datos.
  Prohibido escribir números de reglas directamente en la lógica (magic numbers).
- `src/state/`: store Zustand. Solo orquesta, invoca funciones del dominio.
- `src/pages/`, `src/features/partida/`, `src/ui/`: presentación. Solo leen estado y
  disparan acciones; nunca contienen reglas del juego.

## Estructura de carpetas
src/
  main.tsx, App.tsx
  pages/ InicioPage.tsx, InstruccionesPage.tsx, PartidaPage.tsx
  features/partida/ PantallaTurno.tsx, PantallaRetroalimentacion.tsx, PantallaResultados.tsx
  domain/ types.ts
  domain/config/ variables.ts, zonas.ts, estimulos.ts, efectores.ts, reglas.ts
  domain/engine/ rng.ts, partida.ts, estimulos.ts, sensores.ts, decision.ts,
                 retroalimentacion.ts, puntuacion.ts, colapso.ts
  state/ gameStore.ts, selectors.ts
  ui/ MedidorVariable.tsx, CartaEstimulo.tsx, CartaEfector.tsx, BotonAfinarSensor.tsx,
      RegistroBucles.tsx, GraficaEvolucion.tsx, Ranking.tsx, EncabezadoTurno.tsx, Boton.tsx
  styles/ index.css
  utils/ codigoPartida.ts
tests/engine/ estimulos.test.ts, decision.test.ts, retroalimentacion.test.ts,
              puntuacion.test.ts, ejemploManual.test.ts

## Reglas del juego (fuente de verdad; implementar exactamente)

### Variables
temperatura, glucosa, hidratacion, energia. Escala entera 0 a 10. Punto de ajuste 5.
Todas inician en 5. Ningún valor puede salir del rango 0–10 (limitar con clamp).

### Zonas
- verde: 4 a 6
- amarilla: 2–3 y 7–8
- roja: 0–1 y 9–10

### Partida
- 8 turnos. Franjas: mañana (1–3), tarde (4–6), noche (7–8).
- Modos: solitario (1 jugador) o multijugador (2 a 4 jugadores).
- Código de partida con formato TGS-XXXX (4 dígitos). Es la semilla base del PRNG.
- Selección de estímulos: barajar los 10 estímulos con el PRNG sembrado con el código
  y tomar 8. Los 8 estímulos seleccionados son LOS MISMOS para todos los jugadores.
- Orden por jugador: cada jugador recibe esos 8 estímulos en un orden distinto,
  barajado con la semilla `${codigo}-orden-${indiceJugador}`. Cada jugador guarda su
  propia secuencia (secuenciaEstimulos en Jugador, no en Partida).
  El mismo código reproduce exactamente la misma partida en cualquier dispositivo.
- Multijugador por turnos en un mismo dispositivo: todos juegan el turno N antes de
  pasar al turno N+1. Los jugadores colapsados se omiten.

### Estímulos (se aplican a los valores reales)
| id | nombre | efecto |
| ejercicio | Ejercicio intenso | temperatura +2, energia −2, hidratacion −1 |
| calor | Día caluroso | temperatura +2, hidratacion −2 |
| frio | Noche fría | temperatura −3 |
| lluvia | Lluvia y viento | temperatura −2, energia −1 |
| ayuno | Ayuno prolongado | glucosa −2, energia −1 |
| azucar | Comida rica en azúcar | glucosa +3 |
| infeccion | Infección leve | temperatura +2, energia −1 |
| estudio | Jornada de estudio | energia −2, glucosa −1 |
| energizante | Bebida energizante | glucosa +1, energia +1, hidratacion −1 |
| tranquilo | Día tranquilo | sin cambios |

### Sensores (entropía de la información)
- El jugador NO ve los valores reales. Ve lecturas: lectura = real + ruido, donde ruido
  es un entero aleatorio uniforme en [−m, +m], limitado a 0–10.
- m = 1 en turnos 1–3; m = 2 en turnos 4–8.
- Semilla del ruido: `${codigo}-${indiceJugador}-${turno}` (reproducible y distinta
  por jugador).
- Afinar sensor: máximo 1 vez por turno; cuesta 1 de energía real; revela el valor real
  de una variable elegida. Las restricciones de la decisión se evalúan DESPUÉS de afinar.

### Efectores (decisión)
| id | nombre | efecto |
| sudar | Sudar | temperatura −2, hidratacion −1 |
| tiritar | Tiritar | temperatura +2, energia −1 |
| insulina | Liberar insulina | glucosa −2 |
| glucagon | Liberar glucagón | glucosa +2, energia −1 |
| beber | Beber agua | hidratacion +2 |
| comer | Comer | glucosa +2, energia +1, temperatura +1 |
| descansar | Descansar | energia +2; ocupa los 2 efectores del turno |

Restricciones (evaluadas con los valores reales al momento de decidir):
- Elegir 2 efectores distintos; no se repite un efector en el mismo turno.
- Descansar cuenta como los 2 efectores.
- Agotamiento: si energia ≤ 2, solo se puede elegir 1 efector.
- Deshidratación: si hidratacion ≤ 3, sudar baja temperatura solo −1 (no −2).

### Retroalimentación (después de aplicar efectores)
- Fiebre: si temperatura ≥ 8 → temperatura +1 (bucle positivo).
- Hipoglucemia: si glucosa ≤ 2 → energia −1 (bucle positivo).
- Si hidratacion ≤ 3 al final: registrar aviso de bucle positivo de deshidratación
  (afectará a sudar en el próximo turno).
- Si energia ≤ 2 al final: registrar aviso de bucle positivo de agotamiento
  (solo 1 efector en el próximo turno).
- Variable que estaba fuera de la zona verde tras el estímulo y termina el turno en
  verde: registrar bucle negativo (regulación exitosa).
- Luego aplicar clamp 0–10.

### Puntuación por turno (por cada variable, con valores finales)
- verde +2, amarilla 0, roja −2.
- Bonificación +1 por cada variable que estaba fuera de verde tras el estímulo y termina
  en verde.
- turnosEnRojo: sumar 1 por cada variable en zona roja al final del turno (desempate).

### Colapso y fin
- Colapso: alguna variable en 0 o 10 al final del turno.
  Multijugador: jugador eliminado, conserva sus puntos. Solitario: termina la partida.
- La partida termina al completar el turno 8 o cuando todos colapsan.
- Victoria multijugador: mayor puntaje. Desempate: menor turnosEnRojo; luego mayor
  energia final.
- Victoria solitario: 40 puntos o más.

### Orden de resolución de confirmarDecision
1 validarDecision → 2 aplicarEfectores → 3 aplicarRetroalimentacion → 4 limitarRango →
5 verificarColapso → 6 calcularPuntuacion → 7 registrarHistorial y avanzar
jugador/turno.

### Casos de prueba obligatorios
1. Ejemplo del manual:
   Inicio: temperatura 5, glucosa 5, hidratacion 5, energia 5.
   Estímulo ejercicio → 7, 5, 4, 3. Sin afinar. Efectores: sudar + comer.
   Resultado final: temperatura 6, glucosa 7, hidratacion 3, energia 4.
   Bucles: aviso de deshidratación; bucles negativos en temperatura y energia.
   Puntos del turno: 6 (2 + 0 + 0 + 2 + bonificación 2).
2. Estímulos por jugador (estimulos.test.ts):
   - Con el mismo código, todos los jugadores reciben el mismo CONJUNTO de 8 estímulos.
   - Con 2 o más jugadores, las secuencias tienen distinto ORDEN (probar con varios
     códigos; al menos un par de jugadores difiere en orden).
   - Con el mismo código e índice de jugador, la secuencia es idéntica en ejecuciones
     repetidas (reproducibilidad).

### Aclaraciones (decididas durante el desarrollo)
- Descansar está permitido con agotamiento (energia ≤ 2); es la única acción del turno.
- Se elige exactamente el máximo de efectores: 2 distintos (o Descansar); con
  agotamiento, exactamente 1 (o Descansar). No se permite elegir menos.
- El clamp 0–10 también se aplica justo después del estímulo y del costo de afinar.
- Solitario: si colapsa, pierde aunque tenga 40 puntos o más.
- Orden garantizado distinto por jugador: si el orden barajado con
  `${codigo}-orden-${indiceJugador}` coincide con el de un jugador anterior, se vuelve
  a barajar con `${codigo}-orden-${indiceJugador}-${intento}` (intento 1, 2, …) hasta
  que difiera. La secuencia del jugador i solo depende de los jugadores 0..i−1.
  Caso conocido: en TGS-6639 los jugadores 2 y 3 coinciden con la semilla base.

## Máquina de estados
CONFIGURACION → ESTIMULO → LECTURA → DECISION → RETROALIMENTACION →
(siguiente jugador: ESTIMULO) | (siguiente turno: ESTIMULO) | FIN_DEL_DIA
- En ESTIMULO se muestra "Turno de <nombre>" con un botón para revelar el estímulo,
  de modo que el dispositivo se pueda pasar entre jugadores sin que el siguiente vea
  la perturbación del anterior.

## Rutas
- #/ InicioPage · #/instrucciones InstruccionesPage · #/partida PartidaPage
- PartidaPage renderiza según la fase: ESTIMULO/LECTURA/DECISION → PantallaTurno;
  RETROALIMENTACION → PantallaRetroalimentacion; FIN_DEL_DIA → PantallaResultados.

## UI y responsive
- Mobile-first. <640px: una columna. 640–1023px: medidores 2×2. ≥1024px: dos columnas
  (estímulo y medidores a la izquierda; efectores y decisión a la derecha).
- Áreas táctiles mínimas de 44×44 px.
- Las zonas se indican con color Y con texto (verde / alerta / crisis).
- Lecturas no afinadas se muestran como "≈ 7 ±1"; afinadas como "= 7 real".
- Al pasar de un jugador a otro, ocultar el estímulo y los valores del jugador anterior.
- Retroalimentación: muestra la zona final de cada variable (verde / alerta / crisis,
  con color y texto), nunca su valor numérico. Los valores exactos solo se revelan en
  la gráfica final (FIN_DEL_DIA).
- Todo el texto de la interfaz en español. Título visible: "Regula o Colapsa".
- Síntomas: las restricciones se muestran como síntomas cualitativos, nunca con el
  valor real de la variable.
  - Agotamiento (energia ≤ 2): mostrar "Tu organismo está agotado: solo puedes
    activar 1 efector" y limitar la selección a 1 antes de confirmar.
  - Deshidratación (hidratacion ≤ 3): la carta Sudar muestra "Temperatura −1
    (deshidratado)" en lugar de −2.
  - Si al afinar cambia una restricción, la selección se revalida y se muestra el
    síntoma de inmediato.

## Convenciones
- Nombres del dominio en español (como en los tipos y en las reglas de este archivo).
- Componentes funcionales con hooks. Sin `any`.
- Cada función del motor con al menos una prueba en Vitest.

## Forma de trabajo
- Trabajar SOLO la fase que se solicite. Al terminarla: ejecutar pruebas y build,
  mostrar un resumen de los archivos creados y DETENERSE a esperar aprobación.
- Al terminar cada fase y después de mi aprobación, hacer un commit con un mensaje
  descriptivo y subirlo a GitHub.
- Si una regla de este archivo es ambigua, preguntar antes de suponer.