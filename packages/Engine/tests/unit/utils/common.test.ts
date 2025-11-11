/**
 * 通用工具函数测试
 */

import { describe, it, expect } from 'vitest'
import {
  deepClone,
  deepEqual,
  isEmpty,
  isPlainObject,
  getByPath,
  setByPath,
  deleteByPath,
  generateId,
  groupBy,
  flattenObject,
  ensureArray
} from '../../../src/utils/common'

describe('deepClone', () => {
  it('应该深拷贝普通对象', () => {
    const obj = { a: 1, b: { c: 2 } }
    const cloned = deepClone(obj)
    cloned.b.c = 3
    expect(obj.b.c).toBe(2)
  })

  it('应该深拷贝数组', () => {
    const arr = [1, [2, 3]]
    const cloned = deepClone(arr)
    cloned[1][0] = 4
    expect(arr[1][0]).toBe(2)
  })

  it('应该处理 Date 对象', () => {
    const date = new Date('2024-01-01')
    const cloned = deepClone(date)
    expect(cloned).toEqual(date)
    expect(cloned).not.toBe(date)
  })

  it('应该处理 RegExp 对象', () => {
    const regex = /test/gi
    const cloned = deepClone(regex)
    expect(cloned.source).toBe(regex.source)
    expect(cloned.flags).toBe(regex.flags)
  })

  it('应该处理 null 和 undefined', () => {
    expect(deepClone(null)).toBe(null)
    expect(deepClone(undefined)).toBe(undefined)
  })

  it('应该处理基本类型', () => {
    expect(deepClone(1)).toBe(1)
    expect(deepClone('test')).toBe('test')
    expect(deepClone(true)).toBe(true)
  })
})

describe('deepEqual', () => {
  it('应该正确比较基本类型', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual(1, 2)).toBe(false)
    expect(deepEqual('a', 'a')).toBe(true)
    expect(deepEqual(true, true)).toBe(true)
  })

  it('应该正确比较对象', () => {
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true)
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false)
    expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false)
  })

  it('应该正确比较数组', () => {
    expect(deepEqual([1, 2], [1, 2])).toBe(true)
    expect(deepEqual([1, 2], [1, 3])).toBe(false)
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
  })

  it('应该正确比较嵌套结构', () => {
    expect(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } })).toBe(true)
    expect(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 3] } })).toBe(false)
  })

  it('应该处理 null 和 undefined', () => {
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(undefined, undefined)).toBe(true)
    expect(deepEqual(null, undefined)).toBe(false)
  })

  it('应该处理 Date 对象', () => {
    const date1 = new Date('2024-01-01')
    const date2 = new Date('2024-01-01')
    const date3 = new Date('2024-01-02')
    expect(deepEqual(date1, date2)).toBe(true)
    expect(deepEqual(date1, date3)).toBe(false)
  })
})

describe('isEmpty', () => {
  it('空字符串应该为空', () => {
    expect(isEmpty('')).toBe(true)
  })

  it('null 和 undefined 应该为空', () => {
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
  })

  it('空数组应该为空', () => {
    expect(isEmpty([])).toBe(true)
  })

  it('0 和 false 不应该为空', () => {
    expect(isEmpty(0)).toBe(false)
    expect(isEmpty(false)).toBe(false)
  })

  it('空对象不应该为空', () => {
    expect(isEmpty({})).toBe(false)
  })

  it('非空值不应该为空', () => {
    expect(isEmpty('test')).toBe(false)
    expect(isEmpty([1])).toBe(false)
    expect(isEmpty({ a: 1 })).toBe(false)
  })
})

describe('isPlainObject', () => {
  it('普通对象应该返回 true', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject({ a: 1 })).toBe(true)
  })

  it('数组应该返回 false', () => {
    expect(isPlainObject([])).toBe(false)
  })

  it('null 应该返回 false', () => {
    expect(isPlainObject(null)).toBe(false)
  })

  it('Date 对象应该返回 false', () => {
    expect(isPlainObject(new Date())).toBe(false)
  })

  it('基本类型应该返回 false', () => {
    expect(isPlainObject(1)).toBe(false)
    expect(isPlainObject('test')).toBe(false)
  })
})

describe('getByPath', () => {
  it('应该获取嵌套对象的值', () => {
    const obj = { a: { b: { c: 1 } } }
    expect(getByPath(obj, 'a.b.c')).toBe(1)
  })

  it('应该获取数组元素', () => {
    const obj = { list: [{ field: 'value' }] }
    expect(getByPath(obj, 'list.0.field')).toBe('value')
  })

  it('路径不存在应该返回 undefined', () => {
    const obj = { a: 1 }
    expect(getByPath(obj, 'b.c')).toBeUndefined()
  })

  it('空路径应该返回原对象', () => {
    const obj = { a: 1 }
    expect(getByPath(obj, '')).toBe(obj)
  })
})

describe('setByPath', () => {
  it('应该设置嵌套对象的值', () => {
    const obj: any = {}
    setByPath(obj, 'a.b.c', 1)
    expect(obj.a.b.c).toBe(1)
    expect(obj).toEqual({
      a: {
        b: {
          c: 1
        }
      }
    })
  })

  it('应该自动创建数组', () => {
    const obj: any = {}
    setByPath(obj, 'list.0.field', 'value')
    expect(Array.isArray(obj.list)).toBe(true)
    expect(obj.list[0].field).toBe('value')
  })

  it('应该覆盖已存在的值', () => {
    const obj: any = { a: { b: 1 } }
    setByPath(obj, 'a.b', 2)
    expect(obj.a.b).toBe(2)
  })
})

describe('deleteByPath', () => {
  it('应该删除嵌套对象的值', () => {
    const obj: any = { a: { b: { c: 1 } } }
    const result = deleteByPath(obj, 'a.b.c')
    expect(result).toBe(true)
    expect(obj.a.b.c).toBeUndefined()
  })

  it('路径不存在应该返回 false', () => {
    const obj: any = { a: 1 }
    const result = deleteByPath(obj, 'b.c')
    expect(result).toBe(false)
  })

  it('空路径应该返回 false', () => {
    const obj: any = { a: 1 }
    const result = deleteByPath(obj, '')
    expect(result).toBe(false)
  })
})

describe('generateId', () => {
  it('应该生成唯一 ID', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it('应该支持自定义前缀', () => {
    const id = generateId('batch')
    expect(id).toMatch(/^batch_/)
  })
})

describe('groupBy', () => {
  it('应该按指定键分组', () => {
    const items = [
      { type: 'a', value: 1 },
      { type: 'a', value: 2 },
      { type: 'b', value: 3 }
    ]
    const result = groupBy(items, 'type')
    expect(result.a).toHaveLength(2)
    expect(result.b).toHaveLength(1)
  })

  it('空数组应该返回空对象', () => {
    const result = groupBy([], 'key')
    expect(result).toEqual({})
  })
})

describe('flattenObject', () => {
  it('应该扁平化对象', () => {
    const obj = { a: 1, b: { c: 2, d: 3 } }
    const result = flattenObject(obj)
    expect(result).toEqual({
      a: 1,
      'b.c': 2,
      'b.d': 3
    })
  })

  it('应该处理数组', () => {
    const obj = { list: [1, 2] }
    const result = flattenObject(obj)
    expect(result).toEqual({
      'list.0': 1,
      'list.1': 2
    })
  })

  it('应该处理嵌套结构', () => {
    const obj = { a: { b: [{ c: 1 }, { c: 2 }] } }
    const result = flattenObject(obj)
    expect(result).toEqual({
      'a.b.0.c': 1,
      'a.b.1.c': 2
    })
  })
})

describe('ensureArray', () => {
  it('单个值应该转为数组', () => {
    expect(ensureArray(1)).toEqual([1])
    expect(ensureArray('test')).toEqual(['test'])
  })

  it('数组应该原样返回', () => {
    expect(ensureArray([1, 2])).toEqual([1, 2])
  })

  it('null 和 undefined 应该返回空数组', () => {
    expect(ensureArray(null)).toEqual([])
    expect(ensureArray(undefined)).toEqual([])
  })
})
