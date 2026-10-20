// Genera el código QR del juego para imprimir: npm run qr
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import QRCode from 'qrcode'

const URL_JUEGO = 'https://navier0615.github.io/regula-o-colapsa/'
const SALIDA = 'docs/qr-regula-o-colapsa.png'

mkdirSync(dirname(SALIDA), { recursive: true })

// 2048 px: nítido impreso hasta ~17 cm a 300 ppp. Corrección de errores alta (H) para
// que se lea aunque el papel se arrugue o se manche; margen de 4 módulos (estándar).
await QRCode.toFile(SALIDA, URL_JUEGO, {
  type: 'png',
  width: 2048,
  margin: 4,
  errorCorrectionLevel: 'H',
  color: { dark: '#000000', light: '#ffffff' },
})

console.log(`QR generado en ${SALIDA} → ${URL_JUEGO}`)
