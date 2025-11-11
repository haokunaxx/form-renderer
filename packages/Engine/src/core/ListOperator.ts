import { StructureEvent } from '../types'
import { ModelManager } from './ModelManager'
import {
  deepEqual,
  arrayAppendImmutable,
  arrayInsertImmutable,
  arrayRemoveImmutable,
  arrayMoveImmutable,
  arraySwapImmutable,
  arrayReplaceImmutable,
  arrayClearImmutable
} from '../utils'

/**
 * ListOperator 错误类
 */
export class ListOperatorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ListOperatorError'
  }
}

/**
 * 数组操作器
 * 提供稳定的数组操作 API，生成标准的结构事件
 */
export class ListOperator {
  private modelManager: ModelManager

  /**
   * 构造函数
   * @param modelManager - FormModel 管理器
   */
  constructor(modelManager: ModelManager) {
    this.modelManager = modelManager
  }

  /**
   * 追加行到列表末尾（不可变更新）
   * @param listPath - 列表路径
   * @param row - 新行数据
   * @returns 结构事件
   */
  append(listPath: string, row: any): StructureEvent {
    const list = this.ensureArray(listPath)
    const newIndex = list.length

    // 🔥 不可变追加
    const newList = arrayAppendImmutable(list, row)
    this.modelManager.setValue(listPath, newList)

    return {
      kind: 'structure',
      reason: 'add',
      added: [{ index: newIndex }],
      reindexedIndices: [newIndex]
    }
  }

  /**
   * 在指定位置插入行（不可变更新）
   * @param listPath - 列表路径
   * @param index - 插入位置
   * @param row - 新行数据
   * @returns 结构事件
   */
  insert(listPath: string, index: number, row: any): StructureEvent {
    const list = this.ensureArray(listPath)

    // 🔥 不可变插入
    const newList = arrayInsertImmutable(list, index, row)
    this.modelManager.setValue(listPath, newList)

    // reindexedIndices: 插入位置及之后的所有行
    const reindexedIndices: number[] = []
    for (let i = index; i < newList.length; i++) {
      reindexedIndices.push(i)
    }

    return {
      kind: 'structure',
      reason: 'add',
      added: [{ index }],
      reindexedIndices
    }
  }

  /**
   * 删除指定行（不可变更新）
   * @param listPath - 列表路径
   * @param index - 行索引
   * @returns 结构事件
   */
  remove(listPath: string, index: number): StructureEvent {
    const list = this.ensureArray(listPath)

    if (index < 0 || index >= list.length) {
      throw new ListOperatorError(
        `Index ${index} out of bounds for list "${listPath}" (length: ${list.length})`
      )
    }

    // 🔥 不可变删除
    const newList = arrayRemoveImmutable(list, index)
    this.modelManager.setValue(listPath, newList)

    // reindexedIndices: 删除位置及之后的所有行（新数组的索引）
    const reindexedIndices: number[] = []
    for (let i = index; i < newList.length; i++) {
      reindexedIndices.push(i)
    }

    return {
      kind: 'structure',
      reason: 'remove',
      removed: [{ index }],
      reindexedIndices
    }
  }

  /**
   * 移动行（不可变更新）
   * @param listPath - 列表路径
   * @param from - 源索引
   * @param to - 目标索引
   * @returns 结构事件
   */
  move(listPath: string, from: number, to: number): StructureEvent {
    const list = this.ensureArray(listPath)

    if (from < 0 || from >= list.length) {
      throw new ListOperatorError(
        `From index ${from} out of bounds for list "${listPath}"`
      )
    }
    if (to < 0 || to >= list.length) {
      throw new ListOperatorError(
        `To index ${to} out of bounds for list "${listPath}"`
      )
    }

    if (from === to) {
      // 没有变化
      return {
        kind: 'structure',
        reason: 'move',
        moves: [],
        reindexedIndices: []
      }
    }

    // 🔥 不可变移动
    const newList = arrayMoveImmutable(list, from, to)
    this.modelManager.setValue(listPath, newList)

    // reindexedIndices: from 和 to 之间的所有索引
    const minIndex = Math.min(from, to)
    const maxIndex = Math.max(from, to)
    const reindexedIndices: number[] = []
    for (let i = minIndex; i <= maxIndex; i++) {
      reindexedIndices.push(i)
    }

    return {
      kind: 'structure',
      reason: 'move',
      moves: [{ from, to }],
      reindexedIndices
    }
  }

  /**
   * 交换两行（不可变更新）
   * @param listPath - 列表路径
   * @param a - 第一个索引
   * @param b - 第二个索引
   * @returns 结构事件
   */
  swap(listPath: string, a: number, b: number): StructureEvent {
    const list = this.ensureArray(listPath)

    if (a < 0 || a >= list.length) {
      throw new ListOperatorError(
        `Index ${a} out of bounds for list "${listPath}"`
      )
    }
    if (b < 0 || b >= list.length) {
      throw new ListOperatorError(
        `Index ${b} out of bounds for list "${listPath}"`
      )
    }

    if (a === b) {
      // 没有变化
      return {
        kind: 'structure',
        reason: 'move',
        moves: [],
        reindexedIndices: []
      }
    }

    // 🔥 不可变交换
    const newList = arraySwapImmutable(list, a, b)
    this.modelManager.setValue(listPath, newList)

    return {
      kind: 'structure',
      reason: 'move',
      moves: [
        { from: a, to: b },
        { from: b, to: a }
      ],
      reindexedIndices: [a, b]
    }
  }

  /**
   * 替换指定行（不可变更新）
   * @param listPath - 列表路径
   * @param index - 行索引
   * @param row - 新行数据
   * @returns 结构事件
   */
  replace(listPath: string, index: number, row: any): StructureEvent {
    const list = this.ensureArray(listPath)

    if (index < 0 || index >= list.length) {
      throw new ListOperatorError(
        `Index ${index} out of bounds for list "${listPath}"`
      )
    }

    // 🔥 不可变替换
    const newList = arrayReplaceImmutable(list, index, row)
    this.modelManager.setValue(listPath, newList)

    return {
      kind: 'structure',
      reason: 'replace',
      reindexedIndices: [index]
    }
  }

  /**
   * 清空列表（不可变更新）
   * @param listPath - 列表路径
   * @returns 结构事件
   */
  clear(listPath: string): StructureEvent {
    const list = this.ensureArray(listPath)
    const removed = list.map((_, index) => ({ index }))

    // 🔥 不可变清空
    const newList = arrayClearImmutable()
    this.modelManager.setValue(listPath, newList)

    return {
      kind: 'structure',
      reason: 'replace',
      removed: removed.length > 0 ? removed : undefined,
      reindexedIndices: []
    }
  }

  /**
   * 计算数组的 diff，用于整列替换
   * @param listPath - 列表路径
   * @param newArray - 新数组
   * @returns 结构事件
   */
  diffArray(listPath: string, newArray: any[]): StructureEvent {
    const oldArray = this.ensureArray(listPath)

    // 更新数据
    this.modelManager.setValue(listPath, newArray)

    // 简单策略：按索引比较
    const maxLength = Math.max(oldArray.length, newArray.length)

    const added: Array<{ index: number }> = []
    const removed: Array<{ index: number }> = []
    const reindexedIndices: number[] = []

    for (let i = 0; i < maxLength; i++) {
      if (i >= oldArray.length) {
        // 新增
        added.push({ index: i })
        reindexedIndices.push(i)
      } else if (i >= newArray.length) {
        // 删除
        removed.push({ index: i })
      } else if (!deepEqual(oldArray[i], newArray[i])) {
        // 内容变化
        reindexedIndices.push(i)
      }
    }

    return {
      kind: 'structure',
      reason: 'replace',
      added: added.length > 0 ? added : undefined,
      removed: removed.length > 0 ? removed : undefined,
      reindexedIndices
    }
  }

  /**
   * 确保路径对应的值是数组
   * @param listPath - 列表路径
   * @returns 数组
   */
  private ensureArray(listPath: string): any[] {
    const value = this.modelManager.getValue(listPath)

    // 如果是数组，返回（注意：返回引用，可直接修改）
    if (Array.isArray(value)) {
      return value
    }

    // 如果不存在或不是数组，返回空数组
    return []
  }
}
