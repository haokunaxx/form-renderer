/**
 * 测试场景：列表行内计算
 *
 * 业务场景：订单明细自动计算小计
 * - 修改单价 → 自动计算小计（单价 × 数量）
 * - 修改数量 → 自动计算小计
 * - 每行独立计算，不影响其他行
 *
 * 测试重点：
 * - 相对路径订阅（.price, .count）
 * - getCurRowValue 获取当前行数据
 * - ctx.subscriberPath 更新自己
 * - 同行字段联动
 * - 行间隔离（不影响其他行）
 *
 * Schema 结构：
 * - items: list 类型，包含订单明细
 * - items[].name: 商品名称
 * - items[].price: 单价
 * - items[].count: 数量
 * - items[].subtotal: 小计（自动计算 = price × count）
 *
 * 数据流：
 * price 变化 → 触发 subtotal 的 .price 订阅 → 计算 price × count → 更新 subtotal
 * count 变化 → 触发 subtotal 的 .count 订阅 → 计算 price × count → 更新 subtotal
 */

import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../../src/FormEngine'

describe('场景测试：列表行内计算', () => {
  it('修改单价自动计算小计', async () => {
    const schema = {
      type: 'form',
      properties: {
        items: {
          type: 'list',
          items: {
            name: { type: 'field', required: true },
            price: { type: 'field', required: true },
            count: { type: 'field', required: true },
            subtotal: {
              type: 'field',
              subscribes: {
                '.price': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  const subtotal = (row.price || 0) * (row.count || 1)
                  // 避免无限循环：只在值变化时更新
                  if (ctx.getValue(ctx.subscriberPath) !== subtotal) {
                    ctx.updateValue(ctx.subscriberPath, subtotal)
                  }
                },
                '.count': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  const subtotal = (row.price || 0) * (row.count || 1)
                  if (ctx.getValue(ctx.subscriberPath) !== subtotal) {
                    ctx.updateValue(ctx.subscriberPath, subtotal)
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
        items: [
          { name: '商品A', price: 100, count: 2, subtotal: 200 },
          { name: '商品B', price: 50, count: 3, subtotal: 150 }
        ]
      }
    })

    // 修改第0行的单价
    engine.updateValue('items.0.price', 150)
    await engine.waitFlush()

    expect(engine.getValue('items.0.subtotal')).toBe(300) // 150 * 2
    expect(engine.getValue('items.1.subtotal')).toBe(150) // 不受影响
  })

  it('修改数量自动计算小计', async () => {
    const schema = {
      type: 'form',
      properties: {
        items: {
          type: 'list',
          items: {
            price: { type: 'field' },
            count: { type: 'field' },
            subtotal: {
              type: 'field',
              subscribes: {
                '.price': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  const subtotal = (row.price || 0) * (row.count || 1)
                  if (ctx.getValue(ctx.subscriberPath) !== subtotal) {
                    ctx.updateValue(ctx.subscriberPath, subtotal)
                  }
                },
                '.count': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  const subtotal = (row.price || 0) * (row.count || 1)
                  if (ctx.getValue(ctx.subscriberPath) !== subtotal) {
                    ctx.updateValue(ctx.subscriberPath, subtotal)
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
        items: [{ price: 100, count: 2, subtotal: 200 }]
      }
    })

    // 修改数量
    engine.updateValue('items.0.count', 5)
    await engine.waitFlush()

    expect(engine.getValue('items.0.subtotal')).toBe(500) // 100 * 5
  })

  it('同时修改单价和数量', async () => {
    const schema = {
      type: 'form',
      properties: {
        items: {
          type: 'list',
          items: {
            price: { type: 'field' },
            count: { type: 'field' },
            subtotal: {
              type: 'field',
              subscribes: {
                '.price': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  const subtotal = (row.price || 0) * (row.count || 1)
                  if (ctx.getValue(ctx.subscriberPath) !== subtotal) {
                    ctx.updateValue(ctx.subscriberPath, subtotal)
                  }
                },
                '.count': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  const subtotal = (row.price || 0) * (row.count || 1)
                  if (ctx.getValue(ctx.subscriberPath) !== subtotal) {
                    ctx.updateValue(ctx.subscriberPath, subtotal)
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
        items: [{ price: 100, count: 2, subtotal: 200 }]
      }
    })

    // 同时修改（批处理）
    engine.updateValue('items.0.price', 200)
    engine.updateValue('items.0.count', 3)
    await engine.waitFlush()

    expect(engine.getValue('items.0.subtotal')).toBe(600) // 200 * 3
  })

  it('不影响其他行', async () => {
    const schema = {
      type: 'form',
      properties: {
        items: {
          type: 'list',
          items: {
            price: { type: 'field' },
            count: { type: 'field' },
            subtotal: {
              type: 'field',
              subscribes: {
                '.price': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  const subtotal = (row.price || 0) * (row.count || 1)
                  if (ctx.getValue(ctx.subscriberPath) !== subtotal) {
                    ctx.updateValue(ctx.subscriberPath, subtotal)
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
        items: [
          { price: 100, count: 2, subtotal: 200 },
          { price: 50, count: 3, subtotal: 150 },
          { price: 200, count: 1, subtotal: 200 }
        ]
      }
    })

    // 只修改第1行
    engine.updateValue('items.1.price', 80)
    await engine.waitFlush()

    expect(engine.getValue('items.0.subtotal')).toBe(200) // 不变
    expect(engine.getValue('items.1.subtotal')).toBe(240) // 80 * 3
    expect(engine.getValue('items.2.subtotal')).toBe(200) // 不变
  })

  it('追加行后自动计算小计', async () => {
    const schema = {
      type: 'form',
      properties: {
        items: {
          type: 'list',
          items: {
            price: { type: 'field' },
            count: { type: 'field' },
            subtotal: {
              type: 'field',
              subscribes: {
                '.price': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  const subtotal = (row.price || 0) * (row.count || 1)
                  if (ctx.getValue(ctx.subscriberPath) !== subtotal) {
                    ctx.updateValue(ctx.subscriberPath, subtotal)
                  }
                },
                '.count': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  const subtotal = (row.price || 0) * (row.count || 1)
                  if (ctx.getValue(ctx.subscriberPath) !== subtotal) {
                    ctx.updateValue(ctx.subscriberPath, subtotal)
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
        items: [{ price: 100, count: 2, subtotal: 200 }]
      }
    })
    engine.listAppend('items', { price: 150, count: 3, subtotal: 450 })
    await engine.waitFlush()
    engine.updateValue('items.0.price', 150)
    await engine.waitFlush()
    expect(engine.getValue('items.0.subtotal')).toBe(300) // 150 * 2
    expect(engine.getValue('items.1.subtotal')).toBe(450) // 150 * 3
    engine.updateValue('items.1.count', 4)
    await engine.waitFlush()
    expect(engine.getValue('items.1.subtotal')).toBe(600) // 150 * 4
  })
})
