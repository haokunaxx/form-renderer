import { describe, it, expect, beforeEach } from 'vitest'
import { ModelManager } from '../../../src/core/ModelManager'
import { ListOperator, ListOperatorError } from '../../../src/core/ListOperator'

describe('ListOperator', () => {
  let modelManager: ModelManager
  let operator: ListOperator

  beforeEach(() => {
    modelManager = new ModelManager({})
    operator = new ListOperator(modelManager)
  })

  describe('append', () => {
    it('应该追加到空数组', () => {
      modelManager.setValue('list', [])

      const event = operator.append('list', { id: 1 })

      expect(modelManager.getValue('list')).toEqual([{ id: 1 }])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'add',
        added: [{ index: 0 }],
        reindexedIndices: [0]
      })
    })

    it('应该追加到非空数组', () => {
      modelManager.setValue('list', [{ id: 1 }, { id: 2 }])

      const event = operator.append('list', { id: 3 })

      expect(modelManager.getValue('list')).toEqual([
        { id: 1 },
        { id: 2 },
        { id: 3 }
      ])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'add',
        added: [{ index: 2 }],
        reindexedIndices: [2]
      })
    })

    it('应该 list 不存在时追加', () => {
      const event = operator.append('list', { id: 1 })

      expect(modelManager.getValue('list')).toEqual([{ id: 1 }])
      expect(event.added).toEqual([{ index: 0 }])
    })
  })

  describe('insert', () => {
    it('应该插入到开头', () => {
      modelManager.setValue('list', [{ id: 1 }, { id: 2 }, { id: 3 }])

      const event = operator.insert('list', 0, { id: 0 })

      expect(modelManager.getValue('list')).toEqual([
        { id: 0 },
        { id: 1 },
        { id: 2 },
        { id: 3 }
      ])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'add',
        added: [{ index: 0 }],
        reindexedIndices: [0, 1, 2, 3]
      })
    })

    it('应该插入到中间', () => {
      modelManager.setValue('list', [{ id: 1 }, { id: 3 }])

      const event = operator.insert('list', 1, { id: 2 })

      expect(modelManager.getValue('list')).toEqual([
        { id: 1 },
        { id: 2 },
        { id: 3 }
      ])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'add',
        added: [{ index: 1 }],
        reindexedIndices: [1, 2]
      })
    })

    it('应该插入到末尾（等同于 append）', () => {
      modelManager.setValue('list', [{ id: 1 }])

      const event = operator.insert('list', 1, { id: 2 })

      expect(modelManager.getValue('list')).toEqual([{ id: 1 }, { id: 2 }])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'add',
        added: [{ index: 1 }],
        reindexedIndices: [1]
      })
    })

    it('应该 reindexedIndices 包含后续所有行', () => {
      modelManager.setValue('list', [1, 2, 3, 4, 5])

      const event = operator.insert('list', 2, 999)

      expect(event.reindexedIndices).toEqual([2, 3, 4, 5])
    })
  })

  describe('remove', () => {
    it('应该删除开头', () => {
      modelManager.setValue('list', [{ id: 1 }, { id: 2 }, { id: 3 }])

      const event = operator.remove('list', 0)

      expect(modelManager.getValue('list')).toEqual([{ id: 2 }, { id: 3 }])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'remove',
        removed: [{ index: 0 }],
        reindexedIndices: [0, 1]
      })
    })

    it('应该删除中间', () => {
      modelManager.setValue('list', [{ id: 1 }, { id: 2 }, { id: 3 }])

      const event = operator.remove('list', 1)

      expect(modelManager.getValue('list')).toEqual([{ id: 1 }, { id: 3 }])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'remove',
        removed: [{ index: 1 }],
        reindexedIndices: [1]
      })
    })

    it('应该删除末尾', () => {
      modelManager.setValue('list', [{ id: 1 }, { id: 2 }])

      const event = operator.remove('list', 1)

      expect(modelManager.getValue('list')).toEqual([{ id: 1 }])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'remove',
        removed: [{ index: 1 }],
        reindexedIndices: []
      })
    })

    it('应该索引越界时抛出错误', () => {
      modelManager.setValue('list', [1, 2])

      expect(() => operator.remove('list', 5)).toThrow(ListOperatorError)
      expect(() => operator.remove('list', 5)).toThrow('out of bounds')
    })

    it('应该负索引时抛出错误', () => {
      modelManager.setValue('list', [1, 2])

      expect(() => operator.remove('list', -1)).toThrow(ListOperatorError)
    })
  })

  describe('move', () => {
    it('应该向后移动', () => {
      modelManager.setValue('list', [1, 2, 3, 4])

      const event = operator.move('list', 0, 2)

      expect(modelManager.getValue('list')).toEqual([2, 3, 1, 4])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'move',
        moves: [{ from: 0, to: 2 }],
        reindexedIndices: [0, 1, 2]
      })
    })

    it('应该向前移动', () => {
      modelManager.setValue('list', [1, 2, 3, 4])

      const event = operator.move('list', 3, 1)

      expect(modelManager.getValue('list')).toEqual([1, 4, 2, 3])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'move',
        moves: [{ from: 3, to: 1 }],
        reindexedIndices: [1, 2, 3]
      })
    })

    it('应该移动到相同位置时无变化', () => {
      modelManager.setValue('list', [1, 2, 3])

      const event = operator.move('list', 1, 1)

      expect(modelManager.getValue('list')).toEqual([1, 2, 3])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'move',
        moves: [],
        reindexedIndices: []
      })
    })

    it('应该索引越界时抛出错误', () => {
      modelManager.setValue('list', [1, 2])

      expect(() => operator.move('list', 5, 1)).toThrow(ListOperatorError)
      expect(() => operator.move('list', 0, 5)).toThrow(ListOperatorError)
    })
  })

  describe('swap', () => {
    it('应该交换相邻行', () => {
      modelManager.setValue('list', [1, 2, 3])

      const event = operator.swap('list', 0, 1)

      expect(modelManager.getValue('list')).toEqual([2, 1, 3])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'move',
        moves: [
          { from: 0, to: 1 },
          { from: 1, to: 0 }
        ],
        reindexedIndices: [0, 1]
      })
    })

    it('应该交换不相邻行', () => {
      modelManager.setValue('list', [1, 2, 3, 4, 5])

      const event = operator.swap('list', 1, 4)

      expect(modelManager.getValue('list')).toEqual([1, 5, 3, 4, 2])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'move',
        moves: [
          { from: 1, to: 4 },
          { from: 4, to: 1 }
        ],
        reindexedIndices: [1, 4]
      })
    })

    it('应该交换相同位置时无变化', () => {
      modelManager.setValue('list', [1, 2, 3])

      const event = operator.swap('list', 1, 1)

      expect(modelManager.getValue('list')).toEqual([1, 2, 3])
      expect(event.reindexedIndices).toEqual([])
    })

    it('应该索引越界时抛出错误', () => {
      modelManager.setValue('list', [1, 2])

      expect(() => operator.swap('list', 0, 5)).toThrow(ListOperatorError)
    })
  })

  describe('replace', () => {
    it('应该替换指定行', () => {
      modelManager.setValue('list', [{ id: 1 }, { id: 2 }, { id: 3 }])

      const event = operator.replace('list', 1, { id: 999 })

      expect(modelManager.getValue('list')).toEqual([
        { id: 1 },
        { id: 999 },
        { id: 3 }
      ])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'replace',
        reindexedIndices: [1]
      })
    })

    it('应该索引越界时抛出错误', () => {
      modelManager.setValue('list', [1, 2])

      expect(() => operator.replace('list', 5, 999)).toThrow(ListOperatorError)
    })
  })

  describe('clear', () => {
    it('应该清空列表', () => {
      modelManager.setValue('list', [1, 2, 3])

      const event = operator.clear('list')

      expect(modelManager.getValue('list')).toEqual([])
      expect(event).toEqual({
        kind: 'structure',
        reason: 'replace',
        removed: [{ index: 0 }, { index: 1 }, { index: 2 }],
        reindexedIndices: []
      })
    })

    it('应该清空空列表', () => {
      modelManager.setValue('list', [])

      const event = operator.clear('list')

      expect(modelManager.getValue('list')).toEqual([])
      expect(event.removed).toBeUndefined()
      expect(event.reindexedIndices).toEqual([])
    })
  })

  describe('diffArray', () => {
    it('应该检测新增', () => {
      modelManager.setValue('list', [1, 2])

      const event = operator.diffArray('list', [1, 2, 3, 4])

      expect(modelManager.getValue('list')).toEqual([1, 2, 3, 4])
      expect(event.reason).toBe('replace')
      expect(event.added).toEqual([{ index: 2 }, { index: 3 }])
      expect(event.reindexedIndices).toEqual([2, 3])
    })

    it('应该检测删除', () => {
      modelManager.setValue('list', [1, 2, 3, 4])

      const event = operator.diffArray('list', [1, 2])

      expect(modelManager.getValue('list')).toEqual([1, 2])
      expect(event.removed).toEqual([{ index: 2 }, { index: 3 }])
      expect(event.added).toBeUndefined()
    })

    it('应该检测内容变化', () => {
      modelManager.setValue('list', [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' }
      ])

      const event = operator.diffArray('list', [
        { id: 1, name: 'a' },
        { id: 2, name: 'updated' }
      ])

      expect(event.reindexedIndices).toEqual([1])
      expect(event.added).toBeUndefined()
      expect(event.removed).toBeUndefined()
    })

    it('应该检测完全替换', () => {
      modelManager.setValue('list', [1, 2, 3])

      const event = operator.diffArray('list', [4, 5])

      expect(modelManager.getValue('list')).toEqual([4, 5])
      expect(event.removed).toEqual([{ index: 2 }])
      expect(event.reindexedIndices).toEqual([0, 1])
    })

    it('应该没有变化时返回空的 reindexedIndices', () => {
      modelManager.setValue('list', [1, 2, 3])

      const event = operator.diffArray('list', [1, 2, 3])

      expect(event.reindexedIndices).toEqual([])
      expect(event.added).toBeUndefined()
      expect(event.removed).toBeUndefined()
    })

    it('应该从空数组到非空数组', () => {
      modelManager.setValue('list', [])

      const event = operator.diffArray('list', [1, 2, 3])

      expect(event.added).toEqual([{ index: 0 }, { index: 1 }, { index: 2 }])
      expect(event.reindexedIndices).toEqual([0, 1, 2])
    })

    it('应该从非空数组到空数组', () => {
      modelManager.setValue('list', [1, 2, 3])

      const event = operator.diffArray('list', [])

      expect(event.removed).toEqual([{ index: 0 }, { index: 1 }, { index: 2 }])
      expect(event.reindexedIndices).toEqual([])
    })
  })

  describe('边界情况', () => {
    it('应该 list 不存在时当作空数组', () => {
      const event = operator.append('notExist', { id: 1 })

      expect(modelManager.getValue('notExist')).toEqual([{ id: 1 }])
      expect(event.added).toEqual([{ index: 0 }])
    })

    it('应该 list 不是数组时当作空数组', () => {
      modelManager.setValue('list', 'not an array' as any)

      const event = operator.append('list', { id: 1 })

      expect(modelManager.getValue('list')).toEqual([{ id: 1 }])
    })

    it('应该处理复杂对象', () => {
      const complexRow = {
        id: 1,
        nested: { value: 'test' },
        array: [1, 2, 3]
      }

      const event = operator.append('list', complexRow)

      expect(modelManager.getValue('list.0')).toEqual(complexRow)
    })

    it('应该处理嵌套列表路径', () => {
      modelManager.setValue('parent', {
        child: {
          list: []
        }
      })

      const event = operator.append('parent.child.list', { id: 1 })

      expect(modelManager.getValue('parent.child.list')).toEqual([{ id: 1 }])
      expect(event.added).toEqual([{ index: 0 }])
    })
  })

  describe('组合操作', () => {
    it('应该支持连续操作', () => {
      operator.append('list', { id: 1 })
      operator.append('list', { id: 2 })
      operator.insert('list', 1, { id: 1.5 })

      expect(modelManager.getValue('list')).toEqual([
        { id: 1 },
        { id: 1.5 },
        { id: 2 }
      ])
    })

    it('应该 move + swap 组合', () => {
      modelManager.setValue('list', [1, 2, 3, 4, 5])

      // move(0, 4): [1,2,3,4,5] → [2,3,4,5,1]
      operator.move('list', 0, 4)
      // swap(1, 2): [2,3,4,5,1] → [2,4,3,5,1]
      operator.swap('list', 1, 2)

      expect(modelManager.getValue('list')).toEqual([2, 4, 3, 5, 1])
    })
  })
})
