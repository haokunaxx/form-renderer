/**
 * 路径匹配工具函数
 */

import type { CompiledPattern, PathMatchResult } from '../types'
import { parsePath, joinPath } from './path'

/**
 * 编译路径模式为正则表达式
 * @param pattern - 路径模式，如 'list.*.field' 或 'list.*.childList.*.field'
 * @returns 编译后的模式对象
 * @example
 * compilePattern('list.*.field')
 * // => {
 * //   pattern: 'list.*.field',
 * //   regex: /^list\.([^.]+)\.field$/,
 * //   segments: ['list', '*', 'field'],
 * //   wildcardIndices: [1]
 * // }
 */
export function compilePattern(pattern: string): CompiledPattern {
  const segments = parsePath(pattern)
  const wildcardIndices: number[] = []

  // 构建正则表达式
  const regexParts = segments.map((seg, index) => {
    if (seg === '*') {
      wildcardIndices.push(index)
      return '([^.]+)' // 匹配任意非点字符
    }
    // 转义特殊字符
    return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  })

  const regexStr = '^' + regexParts.join('\\.') + '$'
  const regex = new RegExp(regexStr)

  return {
    pattern,
    regex,
    segments,
    wildcardIndices
  }
}

/**
 * 匹配路径与模式
 * @param pattern - 路径模式，如 'list.*.field'
 * @param path - 具体路径，如 'list.0.field'
 * @returns 匹配结果，包含是否匹配和通配符捕获的值
 * @example
 * matchPath('list.*.field', 'list.0.field')
 * // => { matched: true, stars: ['0'] }
 *
 * matchPath('list.*.field', 'list.0.other')
 * // => { matched: false }
 *
 * matchPath('list.*.childList.*.field', 'list.0.childList.1.field')
 * // => { matched: true, stars: ['0', '1'] }
 */
export function matchPath(pattern: string, path: string): PathMatchResult {
  // 如果模式不包含通配符，直接比较
  if (!pattern.includes('*')) {
    return {
      matched: pattern === path
    }
  }

  const compiled = compilePattern(pattern)
  const match = path.match(compiled.regex)

  if (!match) {
    return { matched: false }
  }

  // 提取通配符捕获的值
  const stars = match.slice(1) // 第一个是完整匹配，后续是捕获组

  return {
    matched: true,
    stars
  }
}

/**
 * 展开通配符路径为具体路径列表
 * @param pattern - 包含通配符的路径，如 'list.*.field'
 * @param model - FormModel 数据
 * @returns 展开后的具体路径列表
 * @example
 * expandWildcard('list.*.field', { list: [{}, {}] })
 * // => ['list.0.field', 'list.1.field']
 *
 * expandWildcard('list.*.childList.*.field', {
 *   list: [
 *     { childList: [{}, {}] },
 *     { childList: [{}] }
 *   ]
 * })
 * // => [
 * //   'list.0.childList.0.field',
 * //   'list.0.childList.1.field',
 * //   'list.1.childList.0.field'
 * // ]
 */
export function expandWildcard(pattern: string, model: any): string[] {
  if (!pattern.includes('*')) {
    return [pattern]
  }

  const segments = parsePath(pattern)
  const results: string[] = []

  /**
   * 递归展开路径
   * @param currentSegments - 当前已确定的路径段
   * @param remainingSegments - 剩余待处理的路径段
   * @param currentData - 当前数据位置
   */
  function expand(
    currentSegments: string[],
    remainingSegments: string[],
    currentData: any
  ): void {
    // 如果没有剩余段，完成一条路径
    if (remainingSegments.length === 0) {
      results.push(joinPath(currentSegments))
      return
    }

    const [nextSegment, ...restSegments] = remainingSegments

    // 如果当前段是通配符
    if (nextSegment === '*') {
      // 当前数据必须是数组
      if (!Array.isArray(currentData)) {
        return // 跳过此分支
      }

      // 遍历数组的每个索引
      currentData.forEach((_, index) => {
        expand(
          [...currentSegments, String(index)],
          restSegments,
          currentData[index]
        )
      })
    } else {
      // 普通段，直接添加
      expand(
        [...currentSegments, nextSegment],
        restSegments,
        currentData?.[nextSegment]
      )
    }
  }

  expand([], segments, model)

  return results
}

/**
 * 判断路径是否在模式的覆盖范围内
 * @param pattern - 路径模式
 * @param path - 具体路径
 * @returns 是否在覆盖范围内
 * @example
 * isCoveredByPattern('list.*', 'list.0.field') // => true
 * isCoveredByPattern('list.*.field', 'list.0.field.nested') // => true
 * isCoveredByPattern('list.0', 'list.1.field') // => false
 */
export function isCoveredByPattern(pattern: string, path: string): boolean {
  const patternSegments = parsePath(pattern)
  const pathSegments = parsePath(path)

  // 路径必须至少和模式一样长
  if (pathSegments.length < patternSegments.length) {
    return false
  }

  // 逐段比较
  for (let i = 0; i < patternSegments.length; i++) {
    const patternSeg = patternSegments[i]
    const pathSeg = pathSegments[i]

    if (patternSeg === '*') {
      // 通配符匹配任意段
      continue
    }

    if (patternSeg !== pathSeg) {
      return false
    }
  }

  return true
}

/**
 * 批量匹配路径与多个模式
 * @param patterns - 路径模式列表
 * @param path - 具体路径
 * @returns 匹配的模式及其结果
 * @example
 * matchPatterns(['list.*.field', 'other.*.value'], 'list.0.field')
 * // => [
 * //   { pattern: 'list.*.field', result: { matched: true, stars: ['0'] } }
 * // ]
 */
export function matchPatterns(
  patterns: string[],
  path: string
): Array<{ pattern: string; result: PathMatchResult }> {
  return patterns
    .map((pattern) => ({
      pattern,
      result: matchPath(pattern, path)
    }))
    .filter((item) => item.result.matched)
}

/**
 * 缓存编译后的模式（性能优化）
 */
const patternCache = new Map<string, CompiledPattern>()

/**
 * 获取编译后的模式（带缓存）
 * @param pattern - 路径模式
 * @returns 编译后的模式
 */
export function getCompiledPattern(pattern: string): CompiledPattern {
  if (!patternCache.has(pattern)) {
    patternCache.set(pattern, compilePattern(pattern))
  }
  return patternCache.get(pattern)!
}

/**
 * 清除模式缓存
 */
export function clearPatternCache(): void {
  patternCache.clear()
}
