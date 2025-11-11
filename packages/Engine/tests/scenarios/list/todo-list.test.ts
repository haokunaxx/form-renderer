/**
 * 测试场景：待办事项列表
 *
 * 业务场景：待办事项管理
 * - 标记完成 → 自动记录完成时间
 * - 统计已完成/未完成数量
 * - 添加/删除/移动待办事项
 *
 * 测试重点：
 * - list 完整操作（append/remove/move）
 * - 行内订阅（.completed）
 * - 通配符汇总订阅（todos.*.completed）
 * - 结构事件触发订阅
 *
 * Schema 结构：
 * - todos: 待办事项列表
 * - todos[].title: 标题
 * - todos[].completed: 是否完成
 * - todos[].completedAt: 完成时间（订阅 .completed）
 * - completedCount: 已完成数量（订阅 todos.*.completed）
 *
 * 数据流：
 * completed 变化 → 触发 completedAt 订阅 → 记录/清空时间
 * completed 变化 → 触发 completedCount 订阅 → 统计数量
 */

import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../../src/FormEngine'

describe('场景测试：待办事项列表', () => {
  it('标记完成自动记录时间', async () => {
    const schema = {
      type: 'form',
      properties: {
        todos: {
          type: 'list',
          items: {
            title: { type: 'field', required: true },
            completed: { type: 'field' },
            completedAt: {
              type: 'field',
              subscribes: {
                '.completed': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  if (row.completed) {
                    // 标记完成：记录当前时间
                    ctx.updateValue(ctx.subscriberPath, Date.now())
                  } else {
                    // 取消完成：清空时间
                    ctx.updateValue(ctx.subscriberPath, null)
                  }
                }
              }
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        todos: [
          { title: '任务1', completed: false, completedAt: null },
          { title: '任务2', completed: false, completedAt: null }
        ]
      }
    })

    // 标记第0个任务完成
    engine.updateValue('todos.0.completed', true)
    await engine.waitFlush()

    expect(engine.getValue('todos.0.completedAt')).not.toBeNull()
    expect(engine.getValue('todos.1.completedAt')).toBeNull()

    // 取消完成
    engine.updateValue('todos.0.completed', false)
    await engine.waitFlush()

    expect(engine.getValue('todos.0.completedAt')).toBeNull()
  })

  it('统计已完成数量', async () => {
    const schema = {
      type: 'form',
      properties: {
        todos: {
          type: 'list',
          items: {
            title: { type: 'field' },
            completed: { type: 'field' }
          }
        },
        completedCount: {
          type: 'field',
          subscribes: {
            'todos.*.completed': (ctx: any) => {
              const todos = ctx.getValue('todos') || []
              const count = todos.filter((t: any) => t.completed).length
              ctx.updateValue(ctx.subscriberPath, count)
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        todos: [
          { title: '任务1', completed: false },
          { title: '任务2', completed: true },
          { title: '任务3', completed: false }
        ],
        completedCount: 1
      }
    })

    // 完成第0个任务
    engine.updateValue('todos.0.completed', true)
    await engine.waitFlush()

    expect(engine.getValue('completedCount')).toBe(2)

    // 完成第2个任务
    engine.updateValue('todos.2.completed', true)
    await engine.waitFlush()

    expect(engine.getValue('completedCount')).toBe(3)
  })

  it('添加删除待办影响统计', async () => {
    const schema = {
      type: 'form',
      properties: {
        todos: {
          type: 'list',
          items: {
            title: { type: 'field' }
          }
        },
        todoCount: {
          type: 'field',
          subscribes: {
            todos: (ctx: any) => {
              const todos = ctx.getValue('todos') || []
              ctx.updateValue(ctx.subscriberPath, todos.length)
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        todos: [{ title: '任务1' }],
        todoCount: 1
      }
    })

    // 添加待办
    engine.listAppend('todos', { title: '任务2' })
    await engine.waitFlush()

    expect(engine.getValue('todoCount')).toBe(2)

    // 删除待办
    engine.listRemove('todos', 0)
    await engine.waitFlush()

    expect(engine.getValue('todoCount')).toBe(1)
  })
})
