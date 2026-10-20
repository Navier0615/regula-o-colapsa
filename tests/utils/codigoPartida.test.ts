import { describe, expect, it } from 'vitest'
import { esCodigoValido } from '../../src/domain/engine/partida.ts'
import { generarCodigo, normalizarCodigo } from '../../src/utils/codigoPartida.ts'

describe('generarCodigo', () => {
  it('genera códigos válidos TGS-XXXX', () => {
    expect(generarCodigo(() => 0)).toBe('TGS-0000')
    expect(generarCodigo(() => 0.9999)).toBe('TGS-9999')
    expect(generarCodigo(() => 0.0427)).toBe('TGS-0427')
    for (let i = 0; i < 50; i++) {
      expect(esCodigoValido(generarCodigo())).toBe(true)
    }
  })
})

describe('normalizarCodigo', () => {
  it('acepta minúsculas, espacios y solo dígitos', () => {
    expect(normalizarCodigo(' tgs-1234 ')).toBe('TGS-1234')
    expect(normalizarCodigo('1234')).toBe('TGS-1234')
    expect(normalizarCodigo('TGS 1234')).toBe('TGS-1234')
    expect(normalizarCodigo('tgs1234')).toBe('TGS-1234')
  })

  it('deja intacto (en mayúsculas) lo que no son dígitos, para que el dominio lo rechace', () => {
    expect(normalizarCodigo('abc')).toBe('ABC')
  })
})
