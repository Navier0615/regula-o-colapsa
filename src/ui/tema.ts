// Tema claro/oscuro: por defecto sigue prefers-color-scheme; la elección manual se
// guarda en localStorage. index.html aplica el tema inicial antes de pintar.

export type Tema = 'claro' | 'oscuro'

export const CLAVE_TEMA = 'regula-o-colapsa-tema'

const CONSULTA_OSCURO = '(prefers-color-scheme: dark)'

/** Color de la barra del navegador para cada tema (igual al fondo). */
const COLOR_BARRA: Readonly<Record<Tema, string>> = { claro: '#f1f5f9', oscuro: '#020617' }

export function leerTemaGuardado(): Tema | null {
  try {
    const valor = localStorage.getItem(CLAVE_TEMA)
    return valor === 'claro' || valor === 'oscuro' ? valor : null
  } catch {
    return null
  }
}

export function guardarTema(tema: Tema): void {
  try {
    localStorage.setItem(CLAVE_TEMA, tema)
  } catch {
    // Sin almacenamiento (modo privado): el tema dura solo esta visita.
  }
}

/** Consulta del sistema, o null si el navegador no la soporta. */
export function consultaTemaSistema(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(CONSULTA_OSCURO) : null
}

export function temaDelSistema(): Tema {
  return consultaTemaSistema()?.matches ? 'oscuro' : 'claro'
}

export function temaInicial(): Tema {
  return leerTemaGuardado() ?? temaDelSistema()
}

export function aplicarTema(tema: Tema): void {
  document.documentElement.dataset.theme = tema === 'oscuro' ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[tema])
}
