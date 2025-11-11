/**
 * 测试场景：级联更新（A→B→C→D）
 *
 * 业务场景：价格计算链
 * - 原价 → 折扣价（原价 × 折扣率）
 * - 折扣价 → 税后价（折扣价 × 1.1）
 * - 税后价 → 最终价（税后价 + 运费）
 *
 * 测试重点：
 * - 多级联动（3-4级）
 * - 递归 flush
 * - 深度控制（不超限）
 * - 每次更新触发下一级
 *
 * Schema 结构：
 * - originalPrice: 原价
 * - discountRate: 折扣率
 * - discountedPrice: 折扣价（订阅 originalPrice 和 discountRate）
 * - taxedPrice: 税后价（订阅 discountedPrice）
 * - shippingFee: 运费
 * - finalPrice: 最终价（订阅 taxedPrice 和 shippingFee）
 *
 * 数据流：
 * originalPrice 变化
 *   → flush 1: 触发 discountedPrice 订阅 → 更新 discountedPrice
 *   → flush 2: 触发 taxedPrice 订阅 → 更新 taxedPrice
 *   → flush 3: 触发 finalPrice 订阅 → 更新 finalPrice
 *   → 完成（3次递归 flush）
 */

import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../../src/FormEngine'

describe('场景测试：级联更新', () => {
  it('价格计算链（4级联动）', async () => {
    const schema = {
      type: 'form',
      properties: {
        originalPrice: { type: 'field' },
        discountRate: { type: 'field' },
        discountedPrice: {
          type: 'field',
          subscribes: {
            originalPrice: (ctx: any) => {
              const original = ctx.getValue('originalPrice') || 0
              const rate = ctx.getValue('discountRate') || 1
              const value = original * rate
              if (ctx.getValue(ctx.subscriberPath) !== value) {
                ctx.updateValue(ctx.subscriberPath, value)
              }
            },
            discountRate: (ctx: any) => {
              const original = ctx.getValue('originalPrice') || 0
              const rate = ctx.getValue('discountRate') || 1
              const value = original * rate
              if (ctx.getValue(ctx.subscriberPath) !== value) {
                ctx.updateValue(ctx.subscriberPath, value)
              }
            }
          }
        },
        taxedPrice: {
          type: 'field',
          subscribes: {
            discountedPrice: (ctx: any) => {
              const discounted = ctx.getValue('discountedPrice') || 0
              const value = discounted * 1.1
              if (ctx.getValue(ctx.subscriberPath) !== value) {
                ctx.updateValue(ctx.subscriberPath, value)
              }
            }
          }
        },
        shippingFee: { type: 'field' },
        finalPrice: {
          type: 'field',
          subscribes: {
            taxedPrice: (ctx: any) => {
              const taxed = ctx.getValue('taxedPrice') || 0
              const shipping = ctx.getValue('shippingFee') || 0
              const value = taxed + shipping
              if (ctx.getValue(ctx.subscriberPath) !== value) {
                ctx.updateValue(ctx.subscriberPath, value)
              }
            },
            shippingFee: (ctx: any) => {
              const taxed = ctx.getValue('taxedPrice') || 0
              const shipping = ctx.getValue('shippingFee') || 0
              const value = taxed + shipping
              if (ctx.getValue(ctx.subscriberPath) !== value) {
                ctx.updateValue(ctx.subscriberPath, value)
              }
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        originalPrice: 100,
        discountRate: 0.9,
        discountedPrice: 90,
        taxedPrice: 99,
        shippingFee: 10,
        finalPrice: 109
      }
    })

    // 修改原价
    engine.updateValue('originalPrice', 200)
    await engine.waitFlush()

    expect(engine.getValue('discountedPrice')).toBe(180) // 200 * 0.9
    expect(engine.getValue('taxedPrice')).toBeCloseTo(198, 1) // 180 * 1.1（浮点数）
    expect(engine.getValue('finalPrice')).toBeCloseTo(208, 1) // 198 + 10
  })

  it('修改中间节点触发部分链', async () => {
    const schema = {
      type: 'form',
      properties: {
        a: { type: 'field' },
        b: {
          type: 'field',
          subscribes: {
            a: (ctx: any) => {
              const value = (ctx.getValue('a') || 0) + 10
              if (ctx.getValue(ctx.subscriberPath) !== value) {
                ctx.updateValue(ctx.subscriberPath, value)
              }
            }
          }
        },
        c: {
          type: 'field',
          subscribes: {
            b: (ctx: any) => {
              const value = (ctx.getValue('b') || 0) * 2
              if (ctx.getValue(ctx.subscriberPath) !== value) {
                ctx.updateValue(ctx.subscriberPath, value)
              }
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: { a: 1, b: 11, c: 22 }
    })

    // 修改 b（中间节点）
    engine.updateValue('b', 20)
    await engine.waitFlush()

    expect(engine.getValue('a')).toBe(1) // 不受影响
    expect(engine.getValue('b')).toBe(20)
    expect(engine.getValue('c')).toBe(40) // 只触发 c 更新
  })
})
