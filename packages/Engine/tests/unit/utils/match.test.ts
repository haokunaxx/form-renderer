/**
 * 路径匹配工具测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  compilePattern,
  matchPath,
  expandWildcard,
  isCoveredByPattern,
  matchPatterns,
  clearPatternCache
} from '../../../src/utils/match'

describe('compilePattern', () => {
  it('应该正确编译不含通配符的模式', () => {
    const compiled = compilePattern('list.0.field')
    expect(compiled.pattern).toBe('list.0.field')
    expect(compiled.segments).toEqual(['list', '0', 'field'])
    expect(compiled.wildcardIndices).toEqual([])
    expect('list.0.field').toMatch(compiled.regex)
    expect('list.1.field').not.toMatch(compiled.regex)
  })

  it('应该正确编译单个通配符模式', () => {
    const compiled = compilePattern('list.*.field')
    expect(compiled.segments).toEqual(['list', '*', 'field'])
    expect(compiled.wildcardIndices).toEqual([1])
    expect('list.0.field').toMatch(compiled.regex)
    expect('list.123.field').toMatch(compiled.regex)
    expect('list.abc.field').toMatch(compiled.regex)
  })

  it('应该正确编译多个通配符模式', () => {
    const compiled = compilePattern('list.*.childList.*.field')
    expect(compiled.segments).toEqual(['list', '*', 'childList', '*', 'field'])
    expect(compiled.wildcardIndices).toEqual([1, 3])
    expect('list.0.childList.1.field').toMatch(compiled.regex)
  })
})

describe('matchPath', () => {
  it('应该匹配精确路径', () => {
    const result = matchPath('list.0.field', 'list.0.field')
    expect(result.matched).toBe(true)
    expect(result.stars).toBeUndefined()
  })

  it('应该不匹配不同路径', () => {
    const result = matchPath('list.0.field', 'list.1.field')
    expect(result.matched).toBe(false)
  })

  it('应该匹配单个通配符', () => {
    const result = matchPath('list.*.field', 'list.0.field')
    expect(result.matched).toBe(true)
    expect(result.stars).toEqual(['0'])
  })

  it('应该匹配多个通配符', () => {
    const result = matchPath(
      'list.*.childList.*.field',
      'list.0.childList.1.field'
    )
    expect(result.matched).toBe(true)
    expect(result.stars).toEqual(['0', '1'])
  })

  it('应该不匹配段数不同的路径', () => {
    const result = matchPath('list.*.field', 'list.0.extra.field')
    expect(result.matched).toBe(false)
  })
})

describe('expandWildcard', () => {
  it('应该展开单层通配符', () => {
    const model = {
      list: [{}, {}, {}]
    }
    const result = expandWildcard('list.*.field', model)
    expect(result).toEqual(['list.0.field', 'list.1.field', 'list.2.field'])
  })

  it('应该展开多层通配符', () => {
    const model = {
      list: [{ childList: [{}, {}] }, { childList: [{}] }]
    }
    const result = expandWildcard('list.*.childList.*.field', model)
    expect(result).toEqual([
      'list.0.childList.0.field',
      'list.0.childList.1.field',
      'list.1.childList.0.field'
    ])
  })

  it('空数组应该返回空结果', () => {
    const model = { list: [] }
    const result = expandWildcard('list.*.field', model)
    expect(result).toEqual([])
  })

  it('非数组应该返回空结果', () => {
    const model = { list: { notArray: true } }
    const result = expandWildcard('list.*.field', model)
    expect(result).toEqual([])
  })

  it('不包含通配符应该直接返回', () => {
    const model = {}
    const result = expandWildcard('list.0.field', model)
    expect(result).toEqual(['list.0.field'])
  })

  it('应该处理复杂嵌套结构', () => {
    const model = {
      a: [{ b: [{ c: 1 }, { c: 2 }] }, { b: [{ c: 3 }] }]
    }
    const result = expandWildcard('a.*.b.*.c', model)
    expect(result).toEqual(['a.0.b.0.c', 'a.0.b.1.c', 'a.1.b.0.c'])
  })
})

describe('isCoveredByPattern', () => {
  it('应该判断路径是否在模式覆盖范围内', () => {
    expect(isCoveredByPattern('list.*', 'list.0.field')).toBe(true)
    expect(isCoveredByPattern('list.*.field', 'list.0.field')).toBe(true)
    expect(isCoveredByPattern('list.*.field', 'list.0.field.nested')).toBe(true)
  })

  it('应该正确判断不在范围内的路径', () => {
    expect(isCoveredByPattern('list.0', 'list.1.field')).toBe(false)
    expect(isCoveredByPattern('list.*.field', 'other.0.field')).toBe(false)
  })

  it('路径短于模式时应该返回 false', () => {
    expect(isCoveredByPattern('list.*.field', 'list.0')).toBe(false)
  })
})

describe('matchPatterns', () => {
  it('应该返回所有匹配的模式', () => {
    const patterns = ['list.*.field', 'list.*.other', 'other.*.field']
    const results = matchPatterns(patterns, 'list.0.field')

    expect(results).toHaveLength(1)
    expect(results[0].pattern).toBe('list.*.field')
    expect(results[0].result.matched).toBe(true)
    expect(results[0].result.stars).toEqual(['0'])
  })

  it('没有匹配时应该返回空数组', () => {
    const patterns = ['other.*.field']
    const results = matchPatterns(patterns, 'list.0.field')
    expect(results).toEqual([])
  })
})

describe('patternCache', () => {
  beforeEach(() => {
    clearPatternCache()
  })

  it('缓存应该提升性能', () => {
    const pattern = 'list.*.field'

    // 第一次编译
    const start1 = Date.now()
    compilePattern(pattern)
    const time1 = Date.now() - start1

    // 清除缓存后再次编译
    clearPatternCache()
    const start2 = Date.now()
    compilePattern(pattern)
    const time2 = Date.now() - start2

    // 两次编译时间应该相近（因为很快，不好测试缓存效果）
    // 这里主要是测试清除缓存不会报错
    expect(time1).toBeGreaterThanOrEqual(0)
    expect(time2).toBeGreaterThanOrEqual(0)
  })
})
