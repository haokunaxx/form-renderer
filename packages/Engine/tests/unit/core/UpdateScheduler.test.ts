import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SchemaParser } from '../../../src/core/SchemaParser'
import { ModelManager } from '../../../src/core/ModelManager'
import { RenderSchemaBuilder } from '../../../src/core/RenderSchemaBuilder'
import { ControlEngine } from '../../../src/core/ControlEngine'
import { SubscribeManager } from '../../../src/core/SubscribeManager'
import { ListOperator } from '../../../src/core/ListOperator'
import {
  UpdateScheduler,
  UpdateSchedulerError
} from '../../../src/core/UpdateScheduler'

describe('UpdateScheduler', () => {
  describe('基本更新', () => {
    it('应该更新单个字段', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: 'John' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      scheduler.scheduleUpdate('name', 'Jane')
      await scheduler.waitFlush()

      expect(modelManager.getValue('name')).toBe('Jane')
    })

    it('应该更新嵌套字段', async () => {
      const schema = {
        type: 'form',
        properties: {
          user: {
            type: 'layout',
            properties: {
              name: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ user: { name: 'John' } })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      scheduler.scheduleUpdate('user.name', 'Jane')
      await scheduler.waitFlush()

      expect(modelManager.getValue('user.name')).toBe('Jane')
    })
  })

  describe('批处理', () => {
    it('应该同步多次更新合并为一次 flush', async () => {
      const handler = vi.fn()
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: {
            type: 'field',
            subscribes: {
              name: handler
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      // 同步多次更新
      scheduler.scheduleUpdate('name', 'John')
      scheduler.scheduleUpdate('name', 'Jane')
      scheduler.scheduleUpdate('name', 'Bob')

      await scheduler.waitFlush()

      // 只执行最后一次
      expect(modelManager.getValue('name')).toBe('Bob')
      // 订阅只触发一次
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('应该同路径取最后一次', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      scheduler.scheduleUpdate('name', 'first')
      scheduler.scheduleUpdate('name', 'second')
      scheduler.scheduleUpdate('name', 'third')

      await scheduler.waitFlush()

      expect(modelManager.getValue('name')).toBe('third')
    })
  })

  describe('对象格式更新', () => {
    it('应该支持对象格式', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: { type: 'field' }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      scheduler.scheduleUpdate({ name: 'John', age: 25 })
      await scheduler.waitFlush()

      expect(modelManager.getValue('name')).toBe('John')
      expect(modelManager.getValue('age')).toBe(25)
    })

    it('应该支持嵌套对象', async () => {
      const schema = {
        type: 'form',
        properties: {
          user: {
            type: 'layout',
            properties: {
              name: { type: 'field' },
              age: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      scheduler.scheduleUpdate({
        user: {
          name: 'John',
          age: 25
        }
      })
      await scheduler.waitFlush()

      expect(modelManager.getValue('user.name')).toBe('John')
      expect(modelManager.getValue('user.age')).toBe(25)
    })
  })

  describe('通配符更新', () => {
    it('应该展开通配符路径', async () => {
      const schema = {
        type: 'form',
        properties: {
          list: {
            type: 'list',
            items: {
              field: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        list: [{}, {}, {}]
      })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      scheduler.scheduleUpdate('list.*.field', 'updated')
      await scheduler.waitFlush()

      expect(modelManager.getValue('list.0.field')).toBe('updated')
      expect(modelManager.getValue('list.1.field')).toBe('updated')
      expect(modelManager.getValue('list.2.field')).toBe('updated')
    })
  })

  describe('订阅触发', () => {
    it('应该值变化触发订阅', async () => {
      const handler = vi.fn()
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: {
            type: 'field',
            subscribes: {
              name: handler
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: 'John' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      scheduler.scheduleUpdate('name', 'Jane')
      await scheduler.waitFlush()

      expect(handler).toHaveBeenCalledTimes(1)
      const ctx = handler.mock.calls[0][0]
      expect(ctx.path).toBe('name')
      expect(ctx.event.kind).toBe('value')
      expect(ctx.event.prevValue).toBe('John')
      expect(ctx.event.nextValue).toBe('Jane')
    })

    it('应该 handler 中 updateValue 触发递归', async () => {
      const handler = vi.fn((ctx) => {
        if (ctx.getValue('name') === 'trigger') {
          ctx.updateValue('age', 100)
        }
      })

      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: {
            type: 'field',
            subscribes: {
              name: handler
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      scheduler.scheduleUpdate('name', 'trigger')
      await scheduler.waitFlush()

      expect(handler).toHaveBeenCalledTimes(1)
      expect(modelManager.getValue('age')).toBe(100)
    })
  })

  describe('深度限制', () => {
    it('应该循环更新抛出错误', async () => {
      const handler1 = vi.fn((ctx) => {
        ctx.updateValue('b', ctx.getValue('a') + 1)
      })
      const handler2 = vi.fn((ctx) => {
        ctx.updateValue('a', ctx.getValue('b') + 1)
      })

      const schema = {
        type: 'form',
        properties: {
          a: {
            type: 'field',
            subscribes: { b: handler1 }
          },
          b: {
            type: 'field',
            subscribes: { a: handler2 }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ a: 0, b: 0 })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode,
        { maxDepth: 5 }
      )

      scheduler.scheduleUpdate('a', 1)

      await expect(scheduler.waitFlush()).rejects.toThrow(UpdateSchedulerError)
    })
  })

  describe('列表操作', () => {
    it('应该 listAppend 触发结构事件', async () => {
      const handler = vi.fn()
      const schema = {
        type: 'form',
        properties: {
          summary: {
            type: 'field',
            subscribes: {
              list: handler
            }
          },
          list: {
            type: 'list',
            items: {
              field: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ list: [] })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      // 执行 append
      const event = listOperator.append('list', { field: 'value' })
      scheduler.scheduleListOperation('list', event)

      await scheduler.waitFlush()

      expect(modelManager.getValue('list')).toHaveLength(1)
      expect(handler).toHaveBeenCalledTimes(1)
      const ctx = handler.mock.calls[0][0]
      expect(ctx.event.kind).toBe('structure')
      expect(ctx.event.reason).toBe('add')
    })

    it('应该重建 list 的 children', async () => {
      const schema = {
        type: 'form',
        properties: {
          list: {
            type: 'list',
            items: {
              field: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ list: [] })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      const listNode = renderNode.children![0]
      expect(listNode.children).toHaveLength(0)

      // append
      const event = listOperator.append('list', { field: 'value' })
      scheduler.scheduleListOperation('list', event)
      await scheduler.waitFlush()

      expect(listNode.children).toHaveLength(1)
      expect(listNode.children![0]).toHaveLength(1)
      expect(listNode.children![0][0].path).toBe('list.0.field')
    })
  })

  describe('控制属性重算', () => {
    it('应该值变化后重算 computed', async () => {
      const schema = {
        type: 'form',
        properties: {
          type: { type: 'field' },
          address: {
            type: 'field',
            required: (ctx: any) => ctx.getValue('type') === 'company'
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ type: 'personal' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      const addressNode = renderNode.children![1]
      expect(addressNode.computed!.required).toBe(false)

      scheduler.scheduleUpdate('type', 'company')
      await scheduler.waitFlush()

      expect(addressNode.computed!.required).toBe(true)
    })
  })

  describe('整列替换', () => {
    it('应该 updateValue list 触发 diffArray', async () => {
      const handler = vi.fn()
      const schema = {
        type: 'form',
        properties: {
          summary: {
            type: 'field',
            subscribes: {
              list: handler
            }
          },
          list: {
            type: 'list',
            items: {
              field: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ list: [{}] })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)

      const scheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )

      scheduler.scheduleUpdate('list', [{}, {}, {}])
      await scheduler.waitFlush()

      expect(modelManager.getValue('list')).toHaveLength(3)
      expect(handler).toHaveBeenCalledTimes(1)
      const ctx = handler.mock.calls[0][0]
      expect(ctx.event.kind).toBe('structure')
      expect(ctx.event.reason).toBe('replace')
    })
  })
})
