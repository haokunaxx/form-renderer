import { describe, it, expect, beforeEach } from 'vitest'
import { ModelManager, ModelManagerError } from '../../../src/core/ModelManager'

describe('ModelManager', () => {
  describe('构造函数', () => {
    it('应该创建空的 ModelManager', () => {
      const manager = new ModelManager()
      expect(manager.getValue()).toEqual({})
    })

    it('应该使用提供的初始 model', () => {
      const initialModel = { name: 'test', age: 18 }
      const manager = new ModelManager(initialModel)
      expect(manager.getValue()).toEqual(initialModel)
    })

    it('应该深拷贝初始 model', () => {
      const initialModel = { name: 'test', nested: { value: 1 } }
      const manager = new ModelManager(initialModel)

      // 修改原始对象不应影响 manager
      initialModel.name = 'changed'
      initialModel.nested.value = 999

      expect(manager.getValue('name')).toBe('test')
      expect(manager.getValue('nested.value')).toBe(1)
    })
  })

  describe('getValue', () => {
    let manager: ModelManager

    beforeEach(() => {
      manager = new ModelManager({
        name: 'John',
        age: 25,
        address: {
          city: 'Beijing',
          country: 'China'
        },
        list: [
          { id: 1, name: 'item1' },
          { id: 2, name: 'item2' }
        ]
      })
    })

    it('应该不传参返回整个 model', () => {
      const result = manager.getValue()
      expect(result).toEqual({
        name: 'John',
        age: 25,
        address: {
          city: 'Beijing',
          country: 'China'
        },
        list: [
          { id: 1, name: 'item1' },
          { id: 2, name: 'item2' }
        ]
      })
    })

    it('应该传空字符串返回整个 model', () => {
      const result = manager.getValue('')
      expect(result).toEqual(manager.getValue())
    })

    it('应该读取顶层字段', () => {
      expect(manager.getValue('name')).toBe('John')
      expect(manager.getValue('age')).toBe(25)
    })

    it('应该读取嵌套字段', () => {
      expect(manager.getValue('address.city')).toBe('Beijing')
      expect(manager.getValue('address.country')).toBe('China')
    })

    it('应该读取数组元素', () => {
      expect(manager.getValue('list.0')).toEqual({ id: 1, name: 'item1' })
      expect(manager.getValue('list.1')).toEqual({ id: 2, name: 'item2' })
    })

    it('应该读取数组元素的字段', () => {
      expect(manager.getValue('list.0.id')).toBe(1)
      expect(manager.getValue('list.0.name')).toBe('item1')
      expect(manager.getValue('list.1.id')).toBe(2)
    })

    it('应该读取深层嵌套', () => {
      manager.setValue('deep.nested.very.deep.value', 'test')
      expect(manager.getValue('deep.nested.very.deep.value')).toBe('test')
    })

    it('应该路径不存在返回 undefined', () => {
      expect(manager.getValue('notExist')).toBeUndefined()
      expect(manager.getValue('address.notExist')).toBeUndefined()
      expect(manager.getValue('list.999')).toBeUndefined()
    })
  })

  describe('setValue', () => {
    let manager: ModelManager

    beforeEach(() => {
      manager = new ModelManager({
        name: 'John',
        address: {
          city: 'Beijing'
        },
        list: [{ value: 1 }]
      })
    })

    it('应该设置顶层字段', () => {
      const change = manager.setValue('name', 'Jane')

      expect(change).toEqual({
        path: 'name',
        prevValue: 'John',
        nextValue: 'Jane'
      })
      expect(manager.getValue('name')).toBe('Jane')
    })

    it('应该设置嵌套字段', () => {
      const change = manager.setValue('address.city', 'Shanghai')

      expect(change.prevValue).toBe('Beijing')
      expect(change.nextValue).toBe('Shanghai')
      expect(manager.getValue('address.city')).toBe('Shanghai')
    })

    it('应该设置数组元素', () => {
      const change = manager.setValue('list.0', { value: 999 })

      expect(change.prevValue).toEqual({ value: 1 })
      expect(change.nextValue).toEqual({ value: 999 })
      expect(manager.getValue('list.0.value')).toBe(999)
    })

    it('应该自动创建中间对象', () => {
      const change = manager.setValue('newObj.nested.field', 'test')

      expect(change.prevValue).toBeUndefined()
      expect(change.nextValue).toBe('test')
      expect(manager.getValue('newObj.nested.field')).toBe('test')
      expect(manager.getValue('newObj.nested')).toEqual({ field: 'test' })
    })

    it('应该支持设置复杂对象', () => {
      const complexObj = {
        a: 1,
        b: { c: 2 },
        d: [1, 2, 3]
      }

      manager.setValue('complex', complexObj)
      expect(manager.getValue('complex')).toEqual(complexObj)
      expect(manager.getValue('complex.b.c')).toBe(2)
    })

    it('应该在路径为空时抛出错误', () => {
      expect(() => manager.setValue('', 'value')).toThrow(ModelManagerError)
      expect(() => manager.setValue('', 'value')).toThrow(
        'Path cannot be empty'
      )
    })

    it('应该返回正确的 ValueChange', () => {
      const change1 = manager.setValue('newField', 'value')
      expect(change1.path).toBe('newField')
      expect(change1.prevValue).toBeUndefined()
      expect(change1.nextValue).toBe('value')

      const change2 = manager.setValue('newField', 'updated')
      expect(change2.prevValue).toBe('value')
      expect(change2.nextValue).toBe('updated')
    })
  })

  describe('batchSetValue', () => {
    it('应该批量更新多个字段', () => {
      const manager = new ModelManager({ a: 1, b: 2 })

      const result = manager.batchSetValue([
        { path: 'a', value: 10 },
        { path: 'b', value: 20 },
        { path: 'c', value: 30 }
      ])

      expect(result.changes).toHaveLength(3)
      expect(manager.getValue('a')).toBe(10)
      expect(manager.getValue('b')).toBe(20)
      expect(manager.getValue('c')).toBe(30)
    })

    it('应该返回完整的 ChangeSet', () => {
      const manager = new ModelManager({ x: 1 })

      const result = manager.batchSetValue([
        { path: 'x', value: 100 },
        { path: 'y', value: 200 }
      ])

      expect(result.changes[0]).toEqual({
        path: 'x',
        prevValue: 1,
        nextValue: 100
      })
      expect(result.changes[1]).toEqual({
        path: 'y',
        prevValue: undefined,
        nextValue: 200
      })
    })

    it('应该支持空数组', () => {
      const manager = new ModelManager()
      const result = manager.batchSetValue([])

      expect(result.changes).toHaveLength(0)
    })
  })

  describe('deleteValue', () => {
    it('应该删除顶层字段', () => {
      const manager = new ModelManager({ a: 1, b: 2 })

      const change = manager.deleteValue('a')

      expect(change.prevValue).toBe(1)
      expect(change.nextValue).toBeUndefined()
      expect(manager.getValue('a')).toBeUndefined()
      expect(manager.getValue('b')).toBe(2)
    })

    it('应该删除嵌套字段', () => {
      const manager = new ModelManager({
        obj: { a: 1, b: 2 }
      })

      manager.deleteValue('obj.a')

      expect(manager.getValue('obj.a')).toBeUndefined()
      expect(manager.getValue('obj.b')).toBe(2)
    })

    it('应该删除数组元素', () => {
      const manager = new ModelManager({
        list: [1, 2, 3]
      })

      manager.deleteValue('list.1')

      // 数组删除后该位置变为 undefined
      expect(manager.getValue('list')).toEqual([1, undefined, 3])
    })

    it('应该在路径为空时抛出错误', () => {
      const manager = new ModelManager()
      expect(() => manager.deleteValue('')).toThrow(ModelManagerError)
    })

    it('应该删除不存在的路径不报错', () => {
      const manager = new ModelManager({ a: 1 })

      const change = manager.deleteValue('notExist')

      expect(change.prevValue).toBeUndefined()
      expect(change.nextValue).toBeUndefined()
    })
  })

  describe('expandWildcard', () => {
    it('应该展开单层通配符', () => {
      const manager = new ModelManager({
        list: [{ a: 1 }, { a: 2 }, { a: 3 }]
      })

      const paths = manager.expandWildcard('list.*.a')

      expect(paths).toEqual(['list.0.a', 'list.1.a', 'list.2.a'])
    })

    it('应该展开多层通配符', () => {
      const manager = new ModelManager({
        list: [
          { children: [{ value: 1 }, { value: 2 }] },
          { children: [{ value: 3 }] }
        ]
      })

      const paths = manager.expandWildcard('list.*.children.*.value')

      expect(paths).toEqual([
        'list.0.children.0.value',
        'list.0.children.1.value',
        'list.1.children.0.value'
      ])
    })

    it('应该空数组返回空结果', () => {
      const manager = new ModelManager({
        list: []
      })

      const paths = manager.expandWildcard('list.*.field')

      expect(paths).toEqual([])
    })

    it('应该路径不存在返回空数组', () => {
      const manager = new ModelManager({})

      const paths = manager.expandWildcard('notExist.*.field')

      expect(paths).toEqual([])
    })
  })

  describe('getSnapshot', () => {
    it('应该返回 model 的深拷贝', () => {
      const manager = new ModelManager({
        name: 'test',
        nested: { value: 1 }
      })

      const snapshot = manager.getSnapshot()

      // 修改快照不应影响 manager
      snapshot.name = 'changed'
      snapshot.nested.value = 999

      expect(manager.getValue('name')).toBe('test')
      expect(manager.getValue('nested.value')).toBe(1)
    })
  })

  describe('clone', () => {
    it('应该克隆后互不影响', () => {
      const manager1 = new ModelManager({ a: 1, b: 2 })
      const manager2 = manager1.clone()

      manager2.setValue('a', 100)
      manager2.setValue('c', 300)

      expect(manager1.getValue('a')).toBe(1)
      expect(manager1.getValue('c')).toBeUndefined()
      expect(manager2.getValue('a')).toBe(100)
      expect(manager2.getValue('c')).toBe(300)
    })

    it('应该克隆初始值', () => {
      const manager1 = new ModelManager({ a: 1 })
      manager1.setValue('a', 100)

      const manager2 = manager1.clone()
      manager2.reset()

      expect(manager2.getValue('a')).toBe(1) // 重置到初始值
    })
  })

  describe('reset', () => {
    it('应该不传参重置到初始值', () => {
      const manager = new ModelManager({ a: 1, b: 2 })

      manager.setValue('a', 100)
      manager.setValue('c', 300)

      const result = manager.reset()

      expect(manager.getValue()).toEqual({ a: 1, b: 2 })
      expect(result.changes.length).toBeGreaterThan(0)
    })

    it('应该传参重置到指定值', () => {
      const manager = new ModelManager({ a: 1 })

      const result = manager.reset({ x: 10, y: 20 })

      expect(manager.getValue()).toEqual({ x: 10, y: 20 })
      expect(result.changes.length).toBeGreaterThan(0)
    })

    it('应该返回正确的 ChangeSet', () => {
      const manager = new ModelManager({ a: 1, b: 2 })

      manager.setValue('a', 100)
      manager.setValue('b', 200)

      const result = manager.reset()

      expect(result.changes).toHaveLength(2)
      expect(result.changes.find((c) => c.path === 'a')).toEqual({
        path: 'a',
        prevValue: 100,
        nextValue: 1
      })
      expect(result.changes.find((c) => c.path === 'b')).toEqual({
        path: 'b',
        prevValue: 200,
        nextValue: 2
      })
    })

    it('应该传参时更新 initialModel', () => {
      const manager = new ModelManager({ a: 1 })

      manager.reset({ x: 10 })

      // 再次 reset 不传参，应该是 { x: 10 }
      manager.setValue('x', 999)
      manager.reset()

      expect(manager.getValue()).toEqual({ x: 10 })
    })

    it('应该没有变化时返回空 changes', () => {
      const manager = new ModelManager({ a: 1, b: 2 })

      const result = manager.reset()

      expect(result.changes).toHaveLength(0)
    })
  })

  describe('merge', () => {
    it('应该合并部分数据', () => {
      const manager = new ModelManager({ a: 1, b: 2 })

      const result = manager.merge({ b: 20, c: 30 })

      expect(manager.getValue()).toEqual({ a: 1, b: 20, c: 30 })
      expect(result.changes).toHaveLength(2)
    })

    it('应该支持嵌套合并', () => {
      const manager = new ModelManager({ obj: { a: 1 } })

      manager.merge({ obj: { b: 2 }, other: 3 })

      expect(manager.getValue('obj.a')).toBe(1)
      expect(manager.getValue('obj.b')).toBe(2)
      expect(manager.getValue('other')).toBe(3)
    })

    it('应该非对象时抛出错误', () => {
      const manager = new ModelManager()

      expect(() => manager.merge(null as any)).toThrow(ModelManagerError)
      expect(() => manager.merge('string' as any)).toThrow(ModelManagerError)
      expect(() => manager.merge(123 as any)).toThrow(ModelManagerError)
    })
  })

  describe('hasPath', () => {
    it('应该检查路径是否存在', () => {
      const manager = new ModelManager({
        a: 1,
        b: { c: 2 },
        list: [{ d: 3 }]
      })

      expect(manager.hasPath('a')).toBe(true)
      expect(manager.hasPath('b.c')).toBe(true)
      expect(manager.hasPath('list.0.d')).toBe(true)
      expect(manager.hasPath('notExist')).toBe(false)
      expect(manager.hasPath('b.notExist')).toBe(false)
    })

    it('应该 undefined 值视为不存在', () => {
      const manager = new ModelManager({ a: undefined })

      expect(manager.hasPath('a')).toBe(false)
    })
  })

  describe('getInitialSnapshot', () => {
    it('应该返回初始 model 的快照', () => {
      const initialModel = { a: 1, b: 2 }
      const manager = new ModelManager(initialModel)

      manager.setValue('a', 100)

      const snapshot = manager.getInitialSnapshot()

      expect(snapshot).toEqual({ a: 1, b: 2 })
      expect(manager.getValue('a')).toBe(100) // 当前值不变
    })

    it('应该返回深拷贝', () => {
      const manager = new ModelManager({ obj: { value: 1 } })

      const snapshot = manager.getInitialSnapshot()
      snapshot.obj.value = 999

      expect(manager.getInitialSnapshot().obj.value).toBe(1)
    })
  })

  describe('边界情况', () => {
    it('应该处理 null 值', () => {
      const manager = new ModelManager({ a: null })

      expect(manager.getValue('a')).toBeNull()

      manager.setValue('a', 'value')
      expect(manager.getValue('a')).toBe('value')
    })

    it('应该处理数组', () => {
      const manager = new ModelManager({ arr: [1, 2, 3] })

      manager.setValue('arr.1', 999)
      expect(manager.getValue('arr')).toEqual([1, 999, 3])
    })

    it('应该处理空 model', () => {
      const manager = new ModelManager({})

      expect(manager.getValue()).toEqual({})

      manager.setValue('newField', 'value')
      expect(manager.getValue('newField')).toBe('value')
    })

    it('应该处理深层数组嵌套', () => {
      const manager = new ModelManager({
        list: [{ children: [{ value: 1 }] }]
      })

      manager.setValue('list.0.children.0.value', 999)
      expect(manager.getValue('list.0.children.0.value')).toBe(999)
    })

    it('应该处理数字字符串路径', () => {
      const manager = new ModelManager({
        list: [{ a: 1 }]
      })

      expect(manager.getValue('list.0.a')).toBe(1)
      manager.setValue('list.0.a', 999)
      expect(manager.getValue('list.0.a')).toBe(999)
    })
  })
})
