import { describe, it, expect, vi } from 'vitest'
import { SchemaParser } from '../../../src/core/SchemaParser'
import { ModelManager } from '../../../src/core/ModelManager'
import { SubscribeManager } from '../../../src/core/SubscribeManager'
import type { SubscribeDeclaration } from '../../../src/types'

describe('SubscribeManager', () => {
  describe('索引构建', () => {
    it('应该构建精确路径索引', () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        {
          subscriberPath: 'name',
          target: 'age',
          handler
        }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: { type: 'field' }
        }
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const index = manager.getIndex()
      expect(index.exact.has('age')).toBe(true)
      expect(index.exact.get('age')).toHaveLength(1)
      expect(index.exact.get('age')![0].handler).toBe(handler)
    })

    it('应该构建通配符索引', () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        {
          subscriberPath: 'name',
          target: 'list.*.field',
          handler
        }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const index = manager.getIndex()
      expect(index.pattern).toHaveLength(1)
      expect(index.pattern[0].pattern).toBe('list.*.field')
      expect(index.pattern[0].handlers).toHaveLength(1)
    })

    it('应该构建相对路径索引', () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        {
          subscriberPath: 'list.items.fieldA',
          target: '.fieldB',
          handler
        }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const index = manager.getIndex()
      expect(index.relative.has('.fieldB')).toBe(true)
      expect(index.relative.get('.fieldB')).toHaveLength(1)
      expect(index.relative.get('.fieldB')![0].ownerPath).toBe(
        'list.items.fieldA'
      )
    })

    it('应该构建混合索引', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'a', target: 'b', handler: handler1 },
        { subscriberPath: 'c', target: 'list.*.field', handler: handler2 },
        { subscriberPath: 'list.items.x', target: '.y', handler: handler3 }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const index = manager.getIndex()
      expect(index.exact.size).toBe(1)
      expect(index.pattern).toHaveLength(1)
      expect(index.relative.size).toBe(1)
    })
  })

  describe('精确匹配', () => {
    it('应该匹配顶层字段', () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'age', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const result = manager.findHandlers('age')
      expect(result).toHaveLength(1)
      expect(result[0].item.handler).toBe(handler)
    })

    it('应该匹配嵌套字段', () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'card.field', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const result = manager.findHandlers('card.field')
      expect(result).toHaveLength(1)
    })

    it('应该不匹配时返回空数组', () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'age', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const result = manager.findHandlers('notExist')
      expect(result).toHaveLength(0)
    })

    it('应该匹配多个订阅', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'a', target: 'age', handler: handler1 },
        { subscriberPath: 'b', target: 'age', handler: handler2 }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const result = manager.findHandlers('age')
      expect(result).toHaveLength(2)
    })
  })

  describe('通配符匹配', () => {
    it('应该匹配单段通配符', () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'list.*.field', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const result1 = manager.findHandlers('list.0.field')
      expect(result1).toHaveLength(1)
      expect(result1[0].match).toBeDefined()
      expect(result1[0].match!.stars).toEqual(['0'])

      const result2 = manager.findHandlers('list.1.field')
      expect(result2).toHaveLength(1)
      expect(result2[0].match!.stars).toEqual(['1'])
    })

    it('应该匹配多段通配符', () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        {
          subscriberPath: 'name',
          target: 'list.*.childList.*.field',
          handler
        }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const result = manager.findHandlers('list.0.childList.1.field')
      expect(result).toHaveLength(1)
      expect(result[0].match!.stars).toEqual(['0', '1'])
    })

    it('应该不匹配时返回空数组', () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'list.*.field', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const result = manager.findHandlers('other.0.field')
      expect(result).toHaveLength(0)
    })
  })

  describe('相对路径匹配', () => {
    it('应该同行匹配', () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        {
          subscriberPath: 'list.items.fieldA',
          target: '.fieldB',
          handler
        }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      // fieldB 在第0行变化
      const result = manager.findHandlers('list.0.fieldB')
      expect(result).toHaveLength(1)
      expect(result[0].item.handler).toBe(handler)
    })

    it('应该不同行不匹配', () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        {
          subscriberPath: 'list.items.fieldA',
          target: '.fieldB',
          handler
        }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      // 事件路径不是 list 中的字段
      const result = manager.findHandlers('otherField')
      expect(result).toHaveLength(0)
    })

    it('应该嵌套 list 的相对路径正确匹配', () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        {
          subscriberPath: 'list.items.childList.items.fieldA',
          target: '.fieldB',
          handler
        }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      // list.0.childList.1.fieldB 变化
      const result = manager.findHandlers('list.0.childList.1.fieldB')
      expect(result).toHaveLength(1)
    })
  })

  describe('事件派发', () => {
    it('应该派发值变化事件', async () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'age', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: { type: 'field' }
        }
      })
      const modelManager = new ModelManager({ age: 18 })
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      await manager.emit({
        path: 'age',
        event: {
          kind: 'value',
          prevValue: 18,
          nextValue: 25
        },
        batchId: 'batch1'
      })

      expect(handler).toHaveBeenCalledTimes(1)
      const ctx = handler.mock.calls[0][0]
      expect(ctx.path).toBe('age')
      expect(ctx.target).toBe('age')
      expect(ctx.event).toEqual({
        kind: 'value',
        prevValue: 18,
        nextValue: 25
      })
      expect(ctx.batchId).toBe('batch1')
    })

    it('应该派发结构事件', async () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'list', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      await manager.emit({
        path: 'list',
        event: {
          kind: 'structure',
          reason: 'add',
          added: [{ index: 0 }],
          reindexedIndices: [0]
        },
        batchId: 'batch1'
      })

      expect(handler).toHaveBeenCalledTimes(1)
      const ctx = handler.mock.calls[0][0]
      expect(ctx.event.kind).toBe('structure')
    })

    it('应该 Context 包含 getValue', async () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'age', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: { type: 'field' }
        }
      })
      const modelManager = new ModelManager({ name: 'John', age: 25 })
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      await manager.emit({
        path: 'age',
        event: { kind: 'value', prevValue: 18, nextValue: 25 },
        batchId: 'batch1'
      })

      const ctx = handler.mock.calls[0][0]
      expect(ctx.getValue()).toBe(25) // 当前节点值
      expect(ctx.getValue('name')).toBe('John') // 指定路径
    })

    it('应该 Context 包含 getSchema', async () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'age', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: { type: 'field', customAttr: 'test' }
        }
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      await manager.emit({
        path: 'age',
        event: { kind: 'value', prevValue: 18, nextValue: 25 },
        batchId: 'batch1'
      })

      const ctx = handler.mock.calls[0][0]
      const schema = ctx.getSchema()
      expect(schema?.type).toBe('field')
      expect((schema as any)?.customAttr).toBe('test')
    })

    it('应该 Context 包含 updateValue', async () => {
      const handler = vi.fn()
      const updateValueFn = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'age', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: { type: 'field' }
        }
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      await manager.emit(
        {
          path: 'age',
          event: { kind: 'value', prevValue: 18, nextValue: 25 },
          batchId: 'batch1'
        },
        updateValueFn
      )

      const ctx = handler.mock.calls[0][0]
      ctx.updateValue('name', 'John')
      expect(updateValueFn).toHaveBeenCalledWith('name', 'John')
    })

    it('应该通配符匹配时提供 match 信息', async () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'list.*.field', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      await manager.emit({
        path: 'list.0.field',
        event: { kind: 'value', prevValue: 1, nextValue: 2 },
        batchId: 'batch1'
      })

      const ctx = handler.mock.calls[0][0]
      expect(ctx.match).toBeDefined()
      expect(ctx.match!.pattern).toBe('list.*.field')
      expect(ctx.match!.stars).toEqual(['0'])
    })
  })

  describe('防抖', () => {
    it('应该 debounce 同批次只执行一次', async () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        {
          subscriberPath: 'name',
          target: 'age',
          handler,
          options: { debounce: true }
        }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const batchId = 'batch1'

      // 同一批次内触发多次
      await manager.emit({
        path: 'age',
        event: { kind: 'value', prevValue: 18, nextValue: 20 },
        batchId
      })

      await manager.emit({
        path: 'age',
        event: { kind: 'value', prevValue: 20, nextValue: 25 },
        batchId
      })

      // 只执行一次
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('应该不同批次多次执行', async () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        {
          subscriberPath: 'name',
          target: 'age',
          handler,
          options: { debounce: true }
        }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      // 第一批次
      await manager.emit({
        path: 'age',
        event: { kind: 'value', prevValue: 18, nextValue: 20 },
        batchId: 'batch1'
      })

      // 第二批次
      await manager.emit({
        path: 'age',
        event: { kind: 'value', prevValue: 20, nextValue: 25 },
        batchId: 'batch2'
      })

      // 执行两次
      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('应该 clearBatch 清理防抖记录', async () => {
      const handler = vi.fn()
      const subscribes: SubscribeDeclaration[] = [
        {
          subscriberPath: 'name',
          target: 'age',
          handler,
          options: { debounce: true }
        }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      const batchId = 'batch1'

      await manager.emit({
        path: 'age',
        event: { kind: 'value', prevValue: 18, nextValue: 20 },
        batchId
      })

      manager.clearBatch(batchId)

      // 清理后，同一 batchId 可以再次执行
      await manager.emit({
        path: 'age',
        event: { kind: 'value', prevValue: 20, nextValue: 25 },
        batchId
      })

      expect(handler).toHaveBeenCalledTimes(2)
    })
  })

  describe('边界情况', () => {
    it('应该无订阅时不报错', async () => {
      const subscribes: SubscribeDeclaration[] = []

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      await expect(
        manager.emit({
          path: 'age',
          event: { kind: 'value', prevValue: 18, nextValue: 25 },
          batchId: 'batch1'
        })
      ).resolves.not.toThrow()
    })

    it('应该 handler 抛错不中断其他 handler', async () => {
      const handler1 = vi.fn(() => {
        throw new Error('Handler 1 error')
      })
      const handler2 = vi.fn()

      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'a', target: 'age', handler: handler1 },
        { subscriberPath: 'b', target: 'age', handler: handler2 }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      await manager.emit({
        path: 'age',
        event: { kind: 'value', prevValue: 18, nextValue: 25 },
        batchId: 'batch1'
      })

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1) // 仍然执行
    })

    it('应该异步 handler 正确执行', async () => {
      const handler = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'age', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      await manager.emit({
        path: 'age',
        event: { kind: 'value', prevValue: 18, nextValue: 25 },
        batchId: 'batch1'
      })

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('应该 updateValue 未提供时抛错', async () => {
      const handler = vi.fn((ctx) => {
        ctx.updateValue('name', 'test')
      })

      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'name', target: 'age', handler }
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      await manager.emit({
        path: 'age',
        event: { kind: 'value', prevValue: 18, nextValue: 25 },
        batchId: 'batch1'
      })

      // handler 内部抛错，但不影响 emit 完成
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('复杂场景', () => {
    it('应该同时匹配多种类型的订阅', async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      const subscribes: SubscribeDeclaration[] = [
        { subscriberPath: 'a', target: 'list.0.field', handler: handler1 }, // 精确
        { subscriberPath: 'b', target: 'list.*.field', handler: handler2 }, // 通配符
        {
          subscriberPath: 'list.items.other',
          target: '.field',
          handler: handler3
        } // 相对
      ]

      const parser = new SchemaParser()
      const parsed = parser.parse({
        type: 'form',
        properties: {}
      })
      const modelManager = new ModelManager({})
      const manager = new SubscribeManager(subscribes, modelManager, parsed)

      await manager.emit({
        path: 'list.0.field',
        event: { kind: 'value', prevValue: 1, nextValue: 2 },
        batchId: 'batch1'
      })

      expect(handler1).toHaveBeenCalledTimes(1) // 精确匹配
      expect(handler2).toHaveBeenCalledTimes(1) // 通配符匹配
      expect(handler3).toHaveBeenCalledTimes(1) // 相对路径匹配
    })
  })
})
