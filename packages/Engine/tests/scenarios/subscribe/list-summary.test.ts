/**
 * 测试场景：列表汇总
 *
 * 业务场景：订单总价自动计算
 * - 任意商品小计变化 → 自动计算总价
 * - 添加商品 → 自动更新总价
 * - 删除商品 → 自动更新总价
 *
 * 测试重点：
 * - 通配符订阅（items.*.subtotal）
 * - 汇总计算（reduce）
 * - 结构事件触发订阅
 * - ctx.subscriberPath 更新汇总字段
 *
 * Schema 结构：
 * - items: 订单明细列表
 * - items[].subtotal: 商品小计
 * - totalPrice: 订单总价（订阅 items.*.subtotal）
 *
 * 数据流：
 * items.0.subtotal 变化 → 触发 totalPrice 订阅 → 汇总所有 subtotal → 更新 totalPrice
 * listAppend → 触发 totalPrice 订阅 → 重新汇总
 */

import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../../src/FormEngine'

describe('场景测试：列表汇总', () => {
  it('商品小计变化自动更新总价', async () => {
    const schema = {
      type: 'form',
      properties: {
        items: {
          type: 'list',
          items: {
            name: { type: 'field' },
            subtotal: { type: 'field' }
          }
        },
        totalPrice: {
          type: 'field',
          subscribes: {
            'items.*.subtotal': (ctx: any) => {
              const items = ctx.getValue('items') || []
              const total = items.reduce(
                (sum: number, item: any) => sum + (item.subtotal || 0),
                0
              )
              ctx.updateValue(ctx.subscriberPath, total)
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        items: [
          { name: '商品A', subtotal: 200 },
          { name: '商品B', subtotal: 150 }
        ],
        totalPrice: 350
      }
    })

    // 修改第0行的小计
    engine.updateValue('items.0.subtotal', 300)
    await engine.waitFlush()

    expect(engine.getValue('totalPrice')).toBe(450) // 300 + 150
  })

  it('添加商品自动更新总价', async () => {
    const schema = {
      type: 'form',
      properties: {
        items: {
          type: 'list',
          items: {
            subtotal: { type: 'field' }
          }
        },
        totalPrice: {
          type: 'field',
          subscribes: {
            items: (ctx: any) => {
              const items = ctx.getValue('items') || []
              const total = items.reduce(
                (sum: number, item: any) => sum + (item.subtotal || 0),
                0
              )
              ctx.updateValue(ctx.subscriberPath, total)
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        items: [{ subtotal: 200 }],
        totalPrice: 200
      }
    })

    // 添加商品
    engine.listAppend('items', { subtotal: 150 })
    await engine.waitFlush()

    expect(engine.getValue('totalPrice')).toBe(350) // 200 + 150
  })

  it('删除商品自动更新总价', async () => {
    const schema = {
      type: 'form',
      properties: {
        items: {
          type: 'list',
          items: {
            subtotal: { type: 'field' }
          }
        },
        totalPrice: {
          type: 'field',
          subscribes: {
            items: (ctx: any) => {
              const items = ctx.getValue('items') || []
              const total = items.reduce(
                (sum: number, item: any) => sum + (item.subtotal || 0),
                0
              )
              ctx.updateValue(ctx.subscriberPath, total)
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        items: [{ subtotal: 200 }, { subtotal: 150 }],
        totalPrice: 350
      }
    })

    // 删除第一个商品
    engine.listRemove('items', 0)
    await engine.waitFlush()

    expect(engine.getValue('totalPrice')).toBe(150) // 只剩第二个
  })

  it('统计商品数量', async () => {
    const schema = {
      type: 'form',
      properties: {
        items: {
          type: 'list',
          items: {
            name: { type: 'field' }
          }
        },
        itemCount: {
          type: 'field',
          subscribes: {
            items: (ctx: any) => {
              const items = ctx.getValue('items') || []
              ctx.updateValue(ctx.subscriberPath, items.length)
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        items: [{ name: 'A' }, { name: 'B' }],
        itemCount: 2
      }
    })

    engine.listAppend('items', { name: 'C' })
    await engine.waitFlush()

    expect(engine.getValue('itemCount')).toBe(3)

    engine.listRemove('items', 0)
    await engine.waitFlush()

    expect(engine.getValue('itemCount')).toBe(2)
  })
})
