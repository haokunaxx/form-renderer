/**
 * 不可变更新工具函数测试
 */

import { describe, it, expect } from 'vitest'
import {
  setByPathImmutable,
  deleteByPathImmutable,
  arrayAppendImmutable,
  arrayInsertImmutable,
  arrayRemoveImmutable,
  arrayMoveImmutable,
  arraySwapImmutable,
  arrayReplaceImmutable,
  arrayClearImmutable
} from '../../../src/utils/immutable'

describe('setByPathImmutable', () => {
  it('应该创建新的根引用', () => {
    const obj = { a: { b: 1 } }
    const newObj = setByPathImmutable(obj, 'a.b', 2)

    expect(newObj).not.toBe(obj)
    expect(newObj.a.b).toBe(2)
  })

  it('应该创建路径上的新引用', () => {
    const obj = { a: { b: { c: 1 } } }
    const newObj = setByPathImmutable(obj, 'a.b.c', 2)

    expect(newObj).not.toBe(obj)
    expect(newObj.a).not.toBe(obj.a)
    expect(newObj.a.b).not.toBe(obj.a.b)
    expect(newObj.a.b.c).toBe(2)
  })

  it('应该复用未变化的部分（结构共享）', () => {
    const obj = {
      a: { b: 1 },
      x: { y: 2 },
      z: { w: 3 }
    }
    const newObj = setByPathImmutable(obj, 'a.b', 10)

    expect(newObj).not.toBe(obj)
    expect(newObj.a).not.toBe(obj.a)
    expect(newObj.x).toBe(obj.x) // ✅ 结构共享
    expect(newObj.z).toBe(obj.z) // ✅ 结构共享
  })

  it('应该正确处理数组索引', () => {
    const obj = {
      list: [{ name: 'a' }, { name: 'b' }, { name: 'c' }]
    }
    const newObj = setByPathImmutable(obj, 'list.0.name', 'A')

    expect(newObj.list).not.toBe(obj.list)
    expect(newObj.list[0]).not.toBe(obj.list[0])
    expect(newObj.list[1]).toBe(obj.list[1]) // ✅ 结构共享
    expect(newObj.list[2]).toBe(obj.list[2]) // ✅ 结构共享
    expect(newObj.list[0].name).toBe('A')
  })

  it('应该正确处理嵌套数组', () => {
    const obj = {
      matrix: [
        [1, 2],
        [3, 4]
      ]
    }
    const newObj = setByPathImmutable(obj, 'matrix.0.1', 99)

    expect(newObj.matrix).not.toBe(obj.matrix)
    expect(newObj.matrix[0]).not.toBe(obj.matrix[0])
    expect(newObj.matrix[1]).toBe(obj.matrix[1]) // ✅ 结构共享
    expect(newObj.matrix[0][1]).toBe(99)
  })

  it('应该处理空路径', () => {
    const obj = { a: 1 }
    const newObj = setByPathImmutable(obj, '', { b: 2 })

    expect(newObj).toEqual({ b: 2 })
  })

  it('应该处理不存在的路径', () => {
    const obj = { a: 1 }
    const newObj = setByPathImmutable(obj, 'b.c.d', 10)

    expect(newObj.b.c.d).toBe(10)
    expect(newObj.a).toBe(1)
  })

  it('应该处理 null/undefined 对象', () => {
    const newObj1 = setByPathImmutable(null, 'a.b', 1)
    expect(newObj1.a.b).toBe(1)

    const newObj2 = setByPathImmutable(undefined, 'a.b', 2)
    expect(newObj2.a.b).toBe(2)
  })

  it('应该扩展数组长度（如果需要）', () => {
    const obj = { list: [1, 2] }
    const newObj = setByPathImmutable(obj, 'list.5', 99)

    expect(newObj.list.length).toBe(6)
    expect(newObj.list[5]).toBe(99)
  })
})

describe('deleteByPathImmutable', () => {
  it('应该删除指定路径的属性', () => {
    const obj = { a: { b: 1, c: 2 } }
    const newObj = deleteByPathImmutable(obj, 'a.b')

    expect(newObj).not.toBe(obj)
    expect(newObj.a).not.toBe(obj.a)
    expect(newObj.a.b).toBeUndefined()
    expect(newObj.a.c).toBe(2)
  })

  it('应该删除数组元素（设为 undefined）', () => {
    const obj = { list: [1, 2, 3] }
    const newObj = deleteByPathImmutable(obj, 'list.1')

    expect(newObj.list).not.toBe(obj.list)
    expect(newObj.list).toEqual([1, undefined, 3])
    expect(newObj.list.length).toBe(3) // 长度不变
  })

  it('应该处理不存在的路径', () => {
    const obj = { a: 1 }
    const newObj = deleteByPathImmutable(obj, 'b.c')

    expect(newObj).toBe(obj) // 未变化，返回原对象
  })

  it('应该处理空路径', () => {
    const obj = { a: 1 }
    const newObj = deleteByPathImmutable(obj, '')

    expect(newObj).toBe(obj)
  })

  it('应该处理 null/undefined', () => {
    const newObj1 = deleteByPathImmutable(null, 'a.b')
    expect(newObj1).toBeNull()

    const newObj2 = deleteByPathImmutable(undefined, 'a.b')
    expect(newObj2).toBeUndefined()
  })
})

describe('arrayAppendImmutable', () => {
  it('应该在数组末尾追加元素', () => {
    const arr = [1, 2, 3]
    const newArr = arrayAppendImmutable(arr, 4)

    expect(newArr).not.toBe(arr)
    expect(newArr).toEqual([1, 2, 3, 4])
    expect(arr).toEqual([1, 2, 3]) // 原数组不变
  })

  it('应该在空数组中追加元素', () => {
    const arr: number[] = []
    const newArr = arrayAppendImmutable(arr, 1)

    expect(newArr).toEqual([1])
  })
})

describe('arrayInsertImmutable', () => {
  it('应该在指定位置插入元素', () => {
    const arr = [1, 2, 4]
    const newArr = arrayInsertImmutable(arr, 2, 3)

    expect(newArr).not.toBe(arr)
    expect(newArr).toEqual([1, 2, 3, 4])
    expect(arr).toEqual([1, 2, 4]) // 原数组不变
  })

  it('应该在开头插入元素', () => {
    const arr = [2, 3]
    const newArr = arrayInsertImmutable(arr, 0, 1)

    expect(newArr).toEqual([1, 2, 3])
  })

  it('应该在末尾插入元素', () => {
    const arr = [1, 2]
    const newArr = arrayInsertImmutable(arr, 2, 3)

    expect(newArr).toEqual([1, 2, 3])
  })

  it('应该处理负索引', () => {
    const arr = [2, 3]
    const newArr = arrayInsertImmutable(arr, -1, 1)

    expect(newArr).toEqual([1, 2, 3])
  })

  it('应该处理超出范围的索引', () => {
    const arr = [1, 2]
    const newArr = arrayInsertImmutable(arr, 100, 3)

    expect(newArr).toEqual([1, 2, 3])
  })
})

describe('arrayRemoveImmutable', () => {
  it('应该删除指定索引的元素', () => {
    const arr = [1, 2, 3, 4]
    const newArr = arrayRemoveImmutable(arr, 2)

    expect(newArr).not.toBe(arr)
    expect(newArr).toEqual([1, 2, 4])
    expect(arr).toEqual([1, 2, 3, 4]) // 原数组不变
  })

  it('应该删除第一个元素', () => {
    const arr = [1, 2, 3]
    const newArr = arrayRemoveImmutable(arr, 0)

    expect(newArr).toEqual([2, 3])
  })

  it('应该删除最后一个元素', () => {
    const arr = [1, 2, 3]
    const newArr = arrayRemoveImmutable(arr, 2)

    expect(newArr).toEqual([1, 2])
  })

  it('应该处理无效索引', () => {
    const arr = [1, 2, 3]

    const newArr1 = arrayRemoveImmutable(arr, -1)
    expect(newArr1).toBe(arr) // 返回原数组

    const newArr2 = arrayRemoveImmutable(arr, 10)
    expect(newArr2).toBe(arr) // 返回原数组
  })
})

describe('arrayMoveImmutable', () => {
  it('应该移动元素', () => {
    const arr = [1, 2, 3, 4, 5]
    const newArr = arrayMoveImmutable(arr, 1, 3)

    expect(newArr).not.toBe(arr)
    expect(newArr).toEqual([1, 3, 4, 2, 5])
    expect(arr).toEqual([1, 2, 3, 4, 5]) // 原数组不变
  })

  it('应该向前移动元素', () => {
    const arr = [1, 2, 3, 4]
    const newArr = arrayMoveImmutable(arr, 3, 1)

    expect(newArr).toEqual([1, 4, 2, 3])
  })

  it('应该处理相同位置', () => {
    const arr = [1, 2, 3]
    const newArr = arrayMoveImmutable(arr, 1, 1)

    expect(newArr).toBe(arr) // 返回原数组（优化）
  })

  it('应该处理无效索引', () => {
    const arr = [1, 2, 3]

    const newArr1 = arrayMoveImmutable(arr, -1, 0)
    expect(newArr1).toBe(arr)

    const newArr2 = arrayMoveImmutable(arr, 0, 10)
    expect(newArr2).toBe(arr)
  })
})

describe('arraySwapImmutable', () => {
  it('应该交换两个元素', () => {
    const arr = [1, 2, 3, 4]
    const newArr = arraySwapImmutable(arr, 1, 3)

    expect(newArr).not.toBe(arr)
    expect(newArr).toEqual([1, 4, 3, 2])
    expect(arr).toEqual([1, 2, 3, 4]) // 原数组不变
  })

  it('应该处理相同索引', () => {
    const arr = [1, 2, 3]
    const newArr = arraySwapImmutable(arr, 1, 1)

    expect(newArr).toBe(arr) // 返回原数组（优化）
  })

  it('应该处理无效索引', () => {
    const arr = [1, 2, 3]

    const newArr1 = arraySwapImmutable(arr, -1, 0)
    expect(newArr1).toBe(arr)

    const newArr2 = arraySwapImmutable(arr, 0, 10)
    expect(newArr2).toBe(arr)
  })
})

describe('arrayReplaceImmutable', () => {
  it('应该替换指定索引的元素', () => {
    const arr = [1, 2, 3]
    const newArr = arrayReplaceImmutable(arr, 1, 99)

    expect(newArr).not.toBe(arr)
    expect(newArr).toEqual([1, 99, 3])
    expect(arr).toEqual([1, 2, 3]) // 原数组不变
  })

  it('应该处理无效索引', () => {
    const arr = [1, 2, 3]

    const newArr1 = arrayReplaceImmutable(arr, -1, 99)
    expect(newArr1).toBe(arr)

    const newArr2 = arrayReplaceImmutable(arr, 10, 99)
    expect(newArr2).toBe(arr)
  })
})

describe('arrayClearImmutable', () => {
  it('应该返回空数组', () => {
    const newArr = arrayClearImmutable()

    expect(newArr).toEqual([])
  })
})

describe('结构共享性能验证', () => {
  it('大对象更新时应该复用大部分内容', () => {
    // 创建一个有 100 个字段的对象
    const largeObj: any = {}
    for (let i = 0; i < 100; i++) {
      largeObj[`field${i}`] = { value: i }
    }
    largeObj.target = { nested: { value: 1 } }

    // 更新 target.nested.value
    const newObj = setByPathImmutable(largeObj, 'target.nested.value', 2)

    // 验证路径上的引用改变
    expect(newObj).not.toBe(largeObj)
    expect(newObj.target).not.toBe(largeObj.target)
    expect(newObj.target.nested).not.toBe(largeObj.target.nested)

    // 验证其他字段复用（结构共享）
    for (let i = 0; i < 100; i++) {
      expect(newObj[`field${i}`]).toBe(largeObj[`field${i}`])
    }
  })

  it('大数组更新时应该复用大部分元素', () => {
    // 创建一个有 100 个元素的数组
    const largeArr = Array.from({ length: 100 }, (_, i) => ({ id: i }))

    // 更新索引 50 的元素
    const obj = { list: largeArr }
    const newObj = setByPathImmutable(obj, 'list.50.id', 999)

    // 验证路径上的引用改变
    expect(newObj.list).not.toBe(obj.list)
    expect(newObj.list[50]).not.toBe(obj.list[50])

    // 验证其他元素复用（结构共享）
    for (let i = 0; i < 100; i++) {
      if (i !== 50) {
        expect(newObj.list[i]).toBe(obj.list[i])
      }
    }
  })
})
