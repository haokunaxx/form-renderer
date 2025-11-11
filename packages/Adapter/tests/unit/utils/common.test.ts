/**
 * 通用工具函数测试
 */

import { describe, it, expect, vi } from 'vitest'
import {
  debounce,
  throttle,
  generateId,
  isEmpty,
  deepClone,
  deepMerge,
  get,
  set,
  delay
} from '@/utils/common'

describe('common utils', () => {
  describe('debounce', () => {
    it('should delay function execution', async () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('test')
      expect(fn).not.toHaveBeenCalled()

      await delay(150)
      expect(fn).toHaveBeenCalledWith('test')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous calls', async () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('first')
      debouncedFn('second')
      debouncedFn('third')

      await delay(150)
      expect(fn).toHaveBeenCalledWith('third')
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('should limit function execution', async () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('first')
      throttledFn('second')
      throttledFn('third')

      expect(fn).toHaveBeenCalledWith('first')
      expect(fn).toHaveBeenCalledTimes(1)

      await delay(150)
      throttledFn('fourth')
      expect(fn).toHaveBeenCalledWith('fourth')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).toMatch(/^id_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^id_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })

    it('should use custom prefix', () => {
      const id = generateId('custom')
      expect(id).toMatch(/^custom_\d+_[a-z0-9]+$/)
    })
  })

  describe('isEmpty', () => {
    it('should identify empty values', () => {
      expect(isEmpty('')).toBe(true)
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
      expect(isEmpty([])).toBe(true)

      expect(isEmpty('text')).toBe(false)
      expect(isEmpty(0)).toBe(false)
      expect(isEmpty(false)).toBe(false)
      expect(isEmpty([1])).toBe(false)
      expect(isEmpty({})).toBe(false)
    })
  })

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone('string')).toBe('string')
      expect(deepClone(123)).toBe(123)
      expect(deepClone(true)).toBe(true)
      expect(deepClone(null)).toBe(null)
    })

    it('should clone objects', () => {
      const obj = { a: 1, b: { c: 2 } }
      const cloned = deepClone(obj)

      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b)
    })

    it('should clone arrays', () => {
      const arr = [1, { a: 2 }, [3, 4]]
      const cloned = deepClone(arr)

      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
      expect(cloned[1]).not.toBe(arr[1])
      expect(cloned[2]).not.toBe(arr[2])
    })

    it('should clone dates', () => {
      const date = new Date('2024-01-01')
      const cloned = deepClone(date)

      expect(cloned).toEqual(date)
      expect(cloned).not.toBe(date)
      expect(cloned.getTime()).toBe(date.getTime())
    })
  })

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const target = { a: 1, b: { c: 2 } }
      const source = { b: { d: 3 }, e: 4 }
      const result = deepMerge(target, source)

      expect(result).toEqual({
        a: 1,
        b: { c: 2, d: 3 },
        e: 4
      })
    })

    it('should handle multiple sources', () => {
      const target = { a: 1 }
      const source1 = { b: 2 }
      const source2 = { c: 3 }
      const result = deepMerge(target, source1, source2)

      expect(result).toEqual({ a: 1, b: 2, c: 3 })
    })

    it('should overwrite non-object values', () => {
      const target = { a: 1, b: { c: 2 } }
      const source = { a: 'new', b: 'replaced' }
      const result = deepMerge(target, source)

      expect(result).toEqual({ a: 'new', b: 'replaced' })
    })
  })

  describe('get', () => {
    it('should get nested values', () => {
      const obj = { a: { b: { c: 'value' } } }

      expect(get(obj, 'a.b.c')).toBe('value')
      expect(get(obj, 'a.b')).toEqual({ c: 'value' })
    })

    it('should return default value for undefined paths', () => {
      const obj = { a: 1 }

      expect(get(obj, 'b', 'default')).toBe('default')
      expect(get(obj, 'a.b.c', 'default')).toBe('default')
    })

    it('should handle falsy values', () => {
      const obj = { a: 0, b: false, c: null }

      expect(get(obj, 'a')).toBe(0)
      expect(get(obj, 'b')).toBe(false)
      expect(get(obj, 'c')).toBe(null)
    })
  })

  describe('set', () => {
    it('should set nested values', () => {
      const obj: any = {}

      set(obj, 'a.b.c', 'value')
      expect(obj).toEqual({ a: { b: { c: 'value' } } })
    })

    it('should overwrite existing values', () => {
      const obj = { a: { b: 'old' } }

      set(obj, 'a.b', 'new')
      expect(obj).toEqual({ a: { b: 'new' } })
    })

    it('should create missing paths', () => {
      const obj: any = { a: 1 }

      set(obj, 'b.c.d', 'value')
      expect(obj).toEqual({
        a: 1,
        b: { c: { d: 'value' } }
      })
    })
  })

  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now()
      await delay(100)
      const end = Date.now()

      expect(end - start).toBeGreaterThanOrEqual(100)
      expect(end - start).toBeLessThan(150)
    })
  })
})
