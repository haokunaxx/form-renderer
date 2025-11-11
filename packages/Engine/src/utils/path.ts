/**
 * 路径处理工具函数
 */

/**
 * 将路径字符串解析为段数组
 * @param path - 路径字符串，如 'list.0.field'
 * @returns 路径段数组，如 ['list', '0', 'field']
 * @example
 * parsePath('list.0.field') // => ['list', '0', 'field']
 * parsePath('') // => []
 */
export function parsePath(path: string): string[] {
  if (!path || typeof path !== 'string') {
    return []
  }
  return path.split('.').filter(Boolean)
}

/**
 * 将路径段数组拼接为字符串
 * @param segments - 路径段数组
 * @returns 路径字符串
 * @example
 * joinPath(['list', '0', 'field']) // => 'list.0.field'
 * joinPath([]) // => ''
 */
export function joinPath(segments: string[]): string {
  if (!Array.isArray(segments)) {
    return ''
  }
  return segments.filter(Boolean).join('.')
}

/**
 * 判断是否为绝对路径
 * @param path - 路径字符串
 * @returns 是否为绝对路径（不以 . 开头）
 * @example
 * isAbsolutePath('list.0.field') // => true
 * isAbsolutePath('.field') // => false
 */
export function isAbsolutePath(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false
  }
  return !path.startsWith('.')
}

/**
 * 判断是否为相对路径
 * @param path - 路径字符串
 * @returns 是否为相对路径（以 . 开头）
 * @example
 * isRelativePath('.field') // => true
 * isRelativePath('list.0.field') // => false
 */
export function isRelativePath(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false
  }
  return path.startsWith('.')
}

/**
 * 判断路径是否包含通配符
 * @param path - 路径字符串
 * @returns 是否包含通配符 *
 * @example
 * isWildcardPath('list.*.field') // => true
 * isWildcardPath('list.0.field') // => false
 */
export function isWildcardPath(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false
  }
  return path.includes('*')
}

/**
 * 规范化路径（去除多余的点、空段等）
 * @param path - 路径字符串
 * @returns 规范化后的路径
 * @example
 * normalizePath('list..0.field') // => 'list.0.field'
 * normalizePath('.field') // => '.field'
 * normalizePath('') // => ''
 */
export function normalizePath(path: string): string {
  if (!path || typeof path !== 'string') {
    return ''
  }

  // 保留开头的 . (相对路径标记)
  const isRelative = path.startsWith('.')
  const segments = parsePath(path.replace(/^\./, ''))
  const normalized = joinPath(segments)

  return isRelative && normalized ? `.${normalized}` : normalized
}

/**
 * 解析路径中的父路径
 * @param path - 路径字符串
 * @returns 父路径，如果没有父路径则返回空字符串
 * @example
 * getParentPath('list.0.field') // => 'list.0'
 * getParentPath('field') // => ''
 */
export function getParentPath(path: string): string {
  const segments = parsePath(path)
  if (segments.length <= 1) {
    return ''
  }
  return joinPath(segments.slice(0, -1))
}

/**
 * 获取路径的最后一段（属性名）
 * @param path - 路径字符串
 * @returns 最后一段，如果路径为空则返回空字符串
 * @example
 * getLastSegment('list.0.field') // => 'field'
 * getLastSegment('field') // => 'field'
 */
export function getLastSegment(path: string): string {
  const segments = parsePath(path)
  return segments.length > 0 ? segments[segments.length - 1] : ''
}

/**
 * 判断某路径是否为另一路径的祖先
 * @param ancestorPath - 祖先路径
 * @param descendantPath - 后代路径
 * @returns 是否为祖先关系
 * @example
 * isAncestorPath('list.0', 'list.0.field') // => true
 * isAncestorPath('list.0.field', 'list.0') // => false
 * isAncestorPath('list.0', 'list.0') // => false (自己不是自己的祖先)
 */
export function isAncestorPath(
  ancestorPath: string,
  descendantPath: string
): boolean {
  if (!ancestorPath || !descendantPath) {
    return false
  }
  if (ancestorPath === descendantPath) {
    return false
  }
  return descendantPath.startsWith(ancestorPath + '.')
}

/**
 * 解析相对路径为绝对路径
 * @param relativePath - 相对路径，如 '.field'
 * @param currentPath - 当前路径（用于定位所在行），如 'list.0.otherField'
 * @returns 绝对路径，如 'list.0.field'
 * @example
 * resolveRelativePath('.field', 'list.0.otherField') // => 'list.0.field'
 * resolveRelativePath('.field', 'field') // => 'field' (不在 list 中)
 */
export function resolveRelativePath(
  relativePath: string,
  currentPath: string
): string {
  if (!isRelativePath(relativePath)) {
    return relativePath
  }

  // 移除开头的 .
  const relativeSegments = parsePath(relativePath.replace(/^\./, ''))
  const currentSegments = parsePath(currentPath)

  // 找到最近的 list 层级
  // 策略：从后往前找，找到第一个数字索引段，取其父路径
  let listBasePath = ''
  for (let i = currentSegments.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(currentSegments[i])) {
      // 找到数字索引，取到此处的路径作为 list 行的基础路径
      listBasePath = joinPath(currentSegments.slice(0, i + 1))
      break
    }
  }

  if (listBasePath) {
    return joinPath([listBasePath, ...relativeSegments])
  }

  // 如果不在 list 中，相对路径直接作为绝对路径
  return joinPath(relativeSegments)
}

/**
 * 判断路径是否指向数组索引
 * @param path - 路径字符串
 * @returns 是否为数组索引路径 (最后一段是数字)
 * @example
 * isArrayIndexPath('list.0') // => true
 * isArrayIndexPath('list.0.field') // => false
 */
export function isArrayIndexPath(path: string): boolean {
  const lastSegment = getLastSegment(path)
  return /^\d+$/.test(lastSegment)
}

/**
 * 提取路径中所有的列表基础路径
 * @param path - 路径字符串，如 'list.0.childList.1.field'
 * @returns 所有列表基础路径，如 ['list', 'list.0.childList']
 * @example
 * extractListPaths('list.0.childList.1.field') // => ['list', 'list.0.childList']
 */
export function extractListPaths(path: string): string[] {
  const segments = parsePath(path)
  const listPaths: string[] = []

  for (let i = 0; i < segments.length; i++) {
    if (/^\d+$/.test(segments[i]) && i > 0) {
      // 找到数字索引，其前一段是列表名
      listPaths.push(joinPath(segments.slice(0, i)))
    }
  }

  return listPaths
}
