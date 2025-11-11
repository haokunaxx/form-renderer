import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FormEngine } from '../../src/FormEngine'
import type {
  JsonSchemaNode,
  ValueEvent,
  StructureEvent
} from '../../src/types'

describe('FormEngine onValueChange', () => {
  describe('基础功能', () => {
    it('应该在值更新时触发 onValueChange', async () => {
      const schema: JsonSchemaNode = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            prop: 'name'
          },
          age: {
            type: 'field',
            prop: 'age'
          }
        }
      }

      const engine = new FormEngine({
        schema,
        model: { name: 'Alice', age: 18 }
      })
      const handler = vi.fn()

      // 注册监听器
      engine.onValueChange(handler)

      // 更新值
      engine.updateValue('name', 'Bob')
      await engine.waitFlush()

      // 验证触发
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({
        path: 'name',
        event: {
          kind: 'value',
          prevValue: 'Alice',
          nextValue: 'Bob'
        },
        batchId: expect.any(String)
      })
    })

    it('应该在多次更新时分别触发', async () => {
      const schema: JsonSchemaNode = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            prop: 'name'
          },
          age: {
            type: 'field',
            prop: 'age'
          }
        }
      }

      const engine = new FormEngine({
        schema,
        model: { name: 'Alice', age: 18 }
      })
      const handler = vi.fn()

      engine.onValueChange(handler)

      // 第一次更新
      engine.updateValue('name', 'Bob')
      await engine.waitFlush()

      // 第二次更新
      engine.updateValue('age', 20)
      await engine.waitFlush()

      // 验证触发两次
      expect(handler).toHaveBeenCalledTimes(2)
      expect(handler).toHaveBeenNthCalledWith(1, {
        path: 'name',
        event: {
          kind: 'value',
          prevValue: 'Alice',
          nextValue: 'Bob'
        },
        batchId: expect.any(String)
      })
      expect(handler).toHaveBeenNthCalledWith(2, {
        path: 'age',
        event: {
          kind: 'value',
          prevValue: 18,
          nextValue: 20
        },
        batchId: expect.any(String)
      })
    })

    it('应该支持取消订阅', async () => {
      const schema: JsonSchemaNode = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            prop: 'name'
          }
        }
      }

      const engine = new FormEngine({ schema, model: { name: 'Alice' } })
      const handler = vi.fn()

      // 注册监听器
      const unsubscribe = engine.onValueChange(handler)

      // 第一次更新
      engine.updateValue('name', 'Bob')
      await engine.waitFlush()
      expect(handler).toHaveBeenCalledTimes(1)

      // 取消订阅
      unsubscribe()

      // 第二次更新
      engine.updateValue('name', 'Charlie')
      await engine.waitFlush()

      // 不应该再触发
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('路径过滤', () => {
    it('应该支持 pattern 过滤', async () => {
      const schema: JsonSchemaNode = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            prop: 'name'
          },
          age: {
            type: 'field',
            prop: 'age'
          }
        }
      }

      const engine = new FormEngine({
        schema,
        model: { name: 'Alice', age: 18 }
      })
      const handler = vi.fn()

      // 只监听 name 字段
      engine.onValueChange(handler, { pattern: 'name' })

      // 更新 name
      engine.updateValue('name', 'Bob')
      await engine.waitFlush()
      expect(handler).toHaveBeenCalledTimes(1)

      // 更新 age（不应该触发）
      engine.updateValue('age', 20)
      await engine.waitFlush()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('应该支持通配符 pattern 过滤', async () => {
      const schema: JsonSchemaNode = {
        type: 'form',
        properties: {
          items: {
            type: 'list',
            prop: 'items',
            items: {
              name: {
                type: 'field',
                prop: 'name'
              },
              price: {
                type: 'field',
                prop: 'price'
              }
            }
          }
        }
      }

      const engine = new FormEngine({
        schema,
        model: {
          items: [
            { name: 'Apple', price: 10 },
            { name: 'Banana', price: 20 }
          ]
        }
      })

      const handler = vi.fn()

      // 只监听 items 中的 name 字段
      engine.onValueChange(handler, { pattern: 'items.*.name' })

      // 更新 name（应该触发）
      engine.updateValue('items.0.name', 'Orange')
      await engine.waitFlush()
      expect(handler).toHaveBeenCalledTimes(1)

      // 更新 price（不应该触发）
      engine.updateValue('items.0.price', 15)
      await engine.waitFlush()
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('事件类型过滤', () => {
    it('应该支持只监听 value 事件', async () => {
      const schema: JsonSchemaNode = {
        type: 'form',
        properties: {
          items: {
            type: 'list',
            prop: 'items',
            items: {
              name: {
                type: 'field',
                prop: 'name'
              }
            }
          }
        }
      }

      const engine = new FormEngine({
        schema,
        model: { items: [{ name: 'Apple' }] }
      })

      const handler = vi.fn()

      // 只监听 value 事件
      engine.onValueChange(handler, { kinds: ['value'] })

      // 更新字段值（应该触发）
      engine.updateValue('items.0.name', 'Orange')
      await engine.waitFlush()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.objectContaining({ kind: 'value' })
        })
      )

      handler.mockClear()

      // 列表操作（不应该触发）
      engine.listAppend('items', { name: 'Banana' })
      await engine.waitFlush()
      expect(handler).not.toHaveBeenCalled()
    })

    it('应该支持只监听 structure 事件', async () => {
      const schema: JsonSchemaNode = {
        type: 'form',
        properties: {
          items: {
            type: 'list',
            prop: 'items',
            items: {
              name: {
                type: 'field',
                prop: 'name'
              }
            }
          }
        }
      }

      const engine = new FormEngine({
        schema,
        model: { items: [{ name: 'Apple' }] }
      })

      const handler = vi.fn()

      // 只监听 structure 事件
      engine.onValueChange(handler, { kinds: ['structure'] })

      // 更新字段值（不应该触发）
      engine.updateValue('items.0.name', 'Orange')
      await engine.waitFlush()
      expect(handler).not.toHaveBeenCalled()

      // 列表操作（应该触发）
      engine.listAppend('items', { name: 'Banana' })
      await engine.waitFlush()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.objectContaining({ kind: 'structure' })
        })
      )
    })
  })

  describe('列表操作', () => {
    it('应该在 listAppend 时触发 structure 事件', async () => {
      const schema: JsonSchemaNode = {
        type: 'form',
        properties: {
          items: {
            type: 'list',
            prop: 'items',
            items: {
              name: {
                type: 'field',
                prop: 'name'
              }
            }
          }
        }
      }

      const engine = new FormEngine({
        schema,
        model: { items: [{ name: 'Apple' }] }
      })

      const handler = vi.fn()
      engine.onValueChange(handler)

      engine.listAppend('items', { name: 'Banana' })
      await engine.waitFlush()

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({
        path: 'items',
        event: {
          kind: 'structure',
          reason: 'add',
          added: [{ index: 1 }],
          reindexedIndices: [1]
        },
        batchId: expect.any(String)
      })
    })

    it('应该在 listRemove 时触发 structure 事件', async () => {
      const schema: JsonSchemaNode = {
        type: 'form',
        properties: {
          items: {
            type: 'list',
            prop: 'items',
            items: {
              name: {
                type: 'field',
                prop: 'name'
              }
            }
          }
        }
      }

      const engine = new FormEngine({
        schema,
        model: { items: [{ name: 'Apple' }, { name: 'Banana' }] }
      })

      const handler = vi.fn()
      engine.onValueChange(handler)

      engine.listRemove('items', 0)
      await engine.waitFlush()

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({
        path: 'items',
        event: {
          kind: 'structure',
          reason: 'remove',
          removed: [{ index: 0 }],
          reindexedIndices: [0]
        },
        batchId: expect.any(String)
      })
    })
  })

  describe('多个监听器', () => {
    it('应该支持注册多个监听器', async () => {
      const schema: JsonSchemaNode = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            prop: 'name'
          }
        }
      }

      const engine = new FormEngine({ schema, model: { name: 'Alice' } })

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      engine.onValueChange(handler1)
      engine.onValueChange(handler2, { pattern: 'name' })
      engine.onValueChange(handler3, { kinds: ['value'] })

      engine.updateValue('name', 'Bob')
      await engine.waitFlush()

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(1)
    })

    it('监听器中的错误不应该影响其他监听器', async () => {
      const schema: JsonSchemaNode = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            prop: 'name'
          }
        }
      }

      const engine = new FormEngine({ schema, model: { name: 'Alice' } })

      const handler1 = vi.fn(() => {
        throw new Error('Handler 1 error')
      })
      const handler2 = vi.fn()

      // 监听控制台错误输出
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      engine.onValueChange(handler1)
      engine.onValueChange(handler2)

      engine.updateValue('name', 'Bob')
      await engine.waitFlush()

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in onValueChange handler:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('批处理', () => {
    it('同一批次的更新应该使用相同的 batchId', async () => {
      const schema: JsonSchemaNode = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            prop: 'name'
          },
          age: {
            type: 'field',
            prop: 'age'
          }
        }
      }

      const engine = new FormEngine({
        schema,
        model: { name: 'Alice', age: 18 }
      })
      const handler = vi.fn()

      engine.onValueChange(handler)

      // 同时更新多个字段
      engine.updateValue({ name: 'Bob', age: 20 })
      await engine.waitFlush()

      expect(handler).toHaveBeenCalledTimes(2)

      // 两次调用的 batchId 应该相同
      const batchId1 = handler.mock.calls[0][0].batchId
      const batchId2 = handler.mock.calls[1][0].batchId
      expect(batchId1).toBe(batchId2)
    })
  })
})
