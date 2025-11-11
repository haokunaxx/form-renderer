/**
 * 测试场景：跨列表联动（顶层字段影响列表）
 *
 * 业务场景：全局设置影响所有列表项
 * - 选择订单类型 → 影响所有明细的折扣率
 * - 选择配送方式 → 影响所有商品的配送费
 * - 切换货币 → 影响所有价格的汇率
 *
 * 测试重点：
 * - 顶层字段订阅，订阅者在 list 中
 * - subscriberPath 自动展开（items.items.field → items.0.field, items.1.field, ...）
 * - 一对多更新
 * - 批量更新所有行
 *
 * Schema 结构：
 * - orderType: 订单类型（'vip' | 'normal'）
 * - items: 明细列表
 * - items[].discount: 折扣率（订阅 orderType）
 *
 * 数据流：
 * orderType 变化 → 触发所有行的 discount 订阅 → 更新 items.0.discount, items.1.discount, ...
 */

import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../../src/FormEngine'

describe('场景测试：跨列表联动', () => {
  it('订单类型影响所有明细的折扣', async () => {
    const schema = {
      type: 'form',
      properties: {
        orderType: { type: 'field' }, // 'vip' | 'normal'
        items: {
          type: 'list',
          items: {
            name: { type: 'field' },
            price: { type: 'field' },
            discount: {
              type: 'field',
              subscribes: {
                orderType: (ctx: any) => {
                  const orderType = ctx.getValue('orderType')
                  const discount = orderType === 'vip' ? 0.8 : 1.0
                  ctx.updateValue(ctx.subscriberPath, discount)
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
        orderType: 'normal',
        items: [
          { name: '商品A', price: 100, discount: 1.0 },
          { name: '商品B', price: 200, discount: 1.0 }
        ]
      }
    })

    // 切换为 VIP 订单
    engine.updateValue('orderType', 'vip')
    await engine.waitFlush()

    // 所有商品的折扣都更新为 0.8
    expect(engine.getValue('items.0.discount')).toBe(0.8)
    expect(engine.getValue('items.1.discount')).toBe(0.8)
  })

  it('配送方式影响所有商品的配送费', async () => {
    const schema = {
      type: 'form',
      properties: {
        shippingMethod: { type: 'field' }, // 'express' | 'standard'
        items: {
          type: 'list',
          items: {
            name: { type: 'field' },
            shippingFee: {
              type: 'field',
              subscribes: {
                shippingMethod: (ctx: any) => {
                  const method = ctx.getValue('shippingMethod')
                  const fee = method === 'express' ? 20 : 10
                  ctx.updateValue(ctx.subscriberPath, fee)
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
        shippingMethod: 'standard',
        items: [
          { name: '商品A', shippingFee: 10 },
          { name: '商品B', shippingFee: 10 },
          { name: '商品C', shippingFee: 10 }
        ]
      }
    })

    // 切换为快递
    engine.updateValue('shippingMethod', 'express')
    await engine.waitFlush()

    // 所有商品的配送费都更新为 20
    expect(engine.getValue('items.0.shippingFee')).toBe(20)
    expect(engine.getValue('items.1.shippingFee')).toBe(20)
    expect(engine.getValue('items.2.shippingFee')).toBe(20)
  })

  it('添加新行后自动应用全局设置', async () => {
    const schema = {
      type: 'form',
      properties: {
        taxRate: { type: 'field' },
        items: {
          type: 'list',
          items: {
            price: { type: 'field' },
            tax: {
              type: 'field',
              subscribes: {
                taxRate: (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  const rate = ctx.getValue('taxRate') || 0
                  const tax = (row.price || 0) * rate
                  ctx.updateValue(ctx.subscriberPath, tax)
                },
                '.price': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  const rate = ctx.getValue('taxRate') || 0
                  const tax = (row.price || 0) * rate
                  ctx.updateValue(ctx.subscriberPath, tax)
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
        taxRate: 0.1,
        items: [{ price: 100, tax: 10 }]
      }
    })

    // 添加新行
    engine.listAppend('items', { price: 200, tax: 0 })
    await engine.waitFlush()
    console.log(engine.getValue())
    // 触发 price 变化来计算 tax
    engine.updateValue('items.1.price', 200)
    await engine.waitFlush()
    console.log(engine.getValue())

    expect(engine.getValue('items.1.tax')).toBe(20) // 200 * 0.1
  })

  it('通配符订阅', async () => {
    const schema = {
      type: 'form',
      properties: {
        orderType: { type: 'field' },
        list: {
          type: 'list',
          items: {
            name: { type: 'field' },
            price: { type: 'field' }
          }
        },
        totalPrice: {
          type: 'field',
          subscribes: {
            'list.*.price': (ctx: any) => {
              console.log('----ctx', ctx)
              ctx.updateSelf(
                ctx
                  .getValue('list')
                  .reduce(
                    (sum: number, item: any) => sum + (item.price || 0),
                    0
                  )
              )
            }
          }
        }
      }
    }
    const engine = new FormEngine({
      schema,
      model: {
        orderType: 'normal',
        list: [
          { name: '商品A', price: 100 },
          { name: '商品B', price: 200 }
        ],
        totalPrice: 0
      }
    })
    engine.updateValue('list.0.price', 150)
    await engine.waitFlush()
    console.log(engine.getValue())
    expect(engine.getValue('totalPrice')).toBe(350)
  })
})
