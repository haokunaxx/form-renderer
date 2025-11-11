/**
 * 路径工具函数测试
 */

import { describe, it, expect } from 'vitest'
import {
  parsePath,
  joinPath,
  isAbsolutePath,
  isRelativePath,
  isWildcardPath,
  normalizePath,
  getParentPath,
  getLastSegment,
  isAncestorPath,
  resolveRelativePath,
  isArrayIndexPath,
  extractListPaths
} from '../../../src/utils/path'

describe('parsePath', () => {
  it('应该正确解析路径字符串', () => {
    expect(parsePath('list.0.field')).toEqual(['list', '0', 'field'])
    expect(parsePath('field')).toEqual(['field'])
    expect(parsePath('')).toEqual([])
  })

  it('应该过滤空段', () => {
    expect(parsePath('list..field')).toEqual(['list', 'field'])
    expect(parsePath('.field')).toEqual(['field'])
  })

  it('应该处理边界情况', () => {
    expect(parsePath(null as any)).toEqual([])
    expect(parsePath(undefined as any)).toEqual([])
  })
})

describe('joinPath', () => {
  it('应该正确拼接路径段', () => {
    expect(joinPath(['list', '0', 'field'])).toBe('list.0.field')
    expect(joinPath(['field'])).toBe('field')
    expect(joinPath([])).toBe('')
  })

  it('应该过滤空段', () => {
    expect(joinPath(['list', '', 'field'])).toBe('list.field')
  })

  it('应该处理边界情况', () => {
    expect(joinPath(null as any)).toBe('')
  })
})

describe('isAbsolutePath', () => {
  it('应该正确判断绝对路径', () => {
    expect(isAbsolutePath('list.0.field')).toBe(true)
    expect(isAbsolutePath('field')).toBe(true)
    expect(isAbsolutePath('.field')).toBe(false)
  })

  it('应该处理边界情况', () => {
    expect(isAbsolutePath('')).toBe(false)
    expect(isAbsolutePath(null as any)).toBe(false)
  })
})

describe('isRelativePath', () => {
  it('应该正确判断相对路径', () => {
    expect(isRelativePath('.field')).toBe(true)
    expect(isRelativePath('.childList.*.field')).toBe(true)
    expect(isRelativePath('field')).toBe(false)
  })

  it('应该处理边界情况', () => {
    expect(isRelativePath('')).toBe(false)
  })
})

describe('isWildcardPath', () => {
  it('应该正确判断通配符路径', () => {
    expect(isWildcardPath('list.*.field')).toBe(true)
    expect(isWildcardPath('list.*.childList.*.field')).toBe(true)
    expect(isWildcardPath('list.0.field')).toBe(false)
  })

  it('应该处理边界情况', () => {
    expect(isWildcardPath('')).toBe(false)
  })
})

describe('normalizePath', () => {
  it('应该正确规范化路径', () => {
    expect(normalizePath('list..0.field')).toBe('list.0.field')
    expect(normalizePath('list...field')).toBe('list.field')
  })

  it('应该保留相对路径标记', () => {
    expect(normalizePath('.field')).toBe('.field')
    expect(normalizePath('..field')).toBe('.field')
  })

  it('应该处理边界情况', () => {
    expect(normalizePath('')).toBe('')
    expect(normalizePath('.')).toBe('')
  })
})

describe('getParentPath', () => {
  it('应该正确获取父路径', () => {
    expect(getParentPath('list.0.field')).toBe('list.0')
    expect(getParentPath('list.0')).toBe('list')
    expect(getParentPath('field')).toBe('')
  })
})

describe('getLastSegment', () => {
  it('应该正确获取最后一段', () => {
    expect(getLastSegment('list.0.field')).toBe('field')
    expect(getLastSegment('field')).toBe('field')
    expect(getLastSegment('')).toBe('')
  })
})

describe('isAncestorPath', () => {
  it('应该正确判断祖先关系', () => {
    expect(isAncestorPath('list.0', 'list.0.field')).toBe(true)
    expect(isAncestorPath('list', 'list.0.field')).toBe(true)
    expect(isAncestorPath('list.0.field', 'list.0')).toBe(false)
  })

  it('自己不是自己的祖先', () => {
    expect(isAncestorPath('list.0', 'list.0')).toBe(false)
  })

  it('应该处理边界情况', () => {
    expect(isAncestorPath('', 'field')).toBe(false)
    expect(isAncestorPath('field', '')).toBe(false)
  })
})

describe('resolveRelativePath', () => {
  it('应该正确解析相对路径', () => {
    expect(resolveRelativePath('.field', 'list.0.otherField')).toBe(
      'list.0.field'
    )
    // 相对路径是相对于最近一层 list 的行根，而不是父容器
    expect(resolveRelativePath('.field', 'list.0.card.otherField')).toBe(
      'list.0.field'
    )
  })

  it('不在列表中时应该去掉开头的点', () => {
    expect(resolveRelativePath('.field', 'otherField')).toBe('field')
  })

  it('绝对路径应该原样返回', () => {
    expect(resolveRelativePath('field', 'list.0.otherField')).toBe('field')
  })

  it('应该支持嵌套列表', () => {
    expect(resolveRelativePath('.field', 'list.0.childList.1.otherField')).toBe(
      'list.0.childList.1.field'
    )
  })
})

describe('isArrayIndexPath', () => {
  it('应该正确判断数组索引路径', () => {
    expect(isArrayIndexPath('list.0')).toBe(true)
    expect(isArrayIndexPath('list.123')).toBe(true)
    expect(isArrayIndexPath('list.0.field')).toBe(false)
    expect(isArrayIndexPath('field')).toBe(false)
  })
})

describe('extractListPaths', () => {
  it('应该提取所有列表基础路径', () => {
    expect(extractListPaths('list.0.field')).toEqual(['list'])
    expect(extractListPaths('list.0.childList.1.field')).toEqual([
      'list',
      'list.0.childList'
    ])
    expect(extractListPaths('field')).toEqual([])
  })

  it('应该处理多层嵌套', () => {
    expect(extractListPaths('a.0.b.1.c.2.field')).toEqual([
      'a',
      'a.0.b',
      'a.0.b.1.c'
    ])
  })
})
