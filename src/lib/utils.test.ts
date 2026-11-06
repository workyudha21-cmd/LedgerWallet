import { describe, expect, it } from 'vitest'
import { formatCompactNumber, formatCurrencyInput } from './utils'

describe('formatCurrencyInput', () => {
  it('formats digits using Indonesian separators', () => {
    expect(formatCurrencyInput('1234567')).toBe('1.234.567')
  })

  it('strips non-digit characters', () => {
    expect(formatCurrencyInput('Rp 1.234.567')).toBe('1.234.567')
  })

  it('returns an empty string when there are no digits', () => {
    expect(formatCurrencyInput('abc')).toBe('')
  })

  it('keeps zero', () => {
    expect(formatCurrencyInput('0')).toBe('0')
  })
})

describe('formatCompactNumber', () => {
  it('formats large numbers compactly', () => {
    expect(formatCompactNumber(1_500_000)).toBe('1.5M')
  })
})
