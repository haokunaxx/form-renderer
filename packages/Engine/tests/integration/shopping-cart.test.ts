import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../src/FormEngine'

describe('集成测试：购物车（完整场景）', () => {
  it('完整的购物车流程', async () => {
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
                  const newSubtotal = (row.price || 0) * (row.count || 0)
                  if (ctx.getValue(ctx.subscriberPath) !== newSubtotal) {
                    ctx.updateValue(ctx.subscriberPath, newSubtotal)
                  }
                },
                '.count': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  const newSubtotal = (row.price || 0) * (row.count || 0)
                  if (ctx.getValue(ctx.subscriberPath) !== newSubtotal) {
                    ctx.updateValue(ctx.subscriberPath, newSubtotal)
                  }
                }
              }
            }
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
              ctx.updateValue('totalPrice', total)
            },
            'items.*.subtotal': (ctx: any) => {
              const items = ctx.getValue('items') || []
              const total = items.reduce(
                (sum: number, item: any) => sum + (item.subtotal || 0),
                0
              )
              ctx.updateValue('totalPrice', total)
            }
          }
        },
        discount: { type: 'field' },
        finalPrice: {
          type: 'field',
          subscribes: {
            totalPrice: (ctx: any) => {
              const total = ctx.getValue('totalPrice') || 0
              const discount = ctx.getValue('discount') || 0
              ctx.updateValue('finalPrice', total - discount)
            },
            discount: (ctx: any) => {
              const total = ctx.getValue('totalPrice') || 0
              const discount = ctx.getValue('discount') || 0
              ctx.updateValue('finalPrice', total - discount)
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        items: [],
        totalPrice: 0,
        discount: 0,
        finalPrice: 0
      }
    })

    // 1. 添加商品（直接计算好 subtotal）
    engine.listAppend('items', {
      name: 'Product A',
      price: 100,
      count: 2,
      subtotal: 200
    })
    await engine.waitFlush()
    console.log(engine.getValue())
    expect(engine.getValue('items.0.subtotal')).toBe(200) // 100 * 2
    expect(engine.getValue('totalPrice')).toBe(200)
    expect(engine.getValue('finalPrice')).toBe(200)

    // // 2. 再添加一个商品
    engine.listAppend('items', {
      name: 'Product B',
      price: 50,
      count: 3,
      subtotal: 150
    })
    await engine.waitFlush()

    expect(engine.getValue('items.1.subtotal')).toBe(150) // 50 * 3
    expect(engine.getValue('totalPrice')).toBe(350) // 200 + 150
    expect(engine.getValue('finalPrice')).toBe(350)

    // 3. 修改第一个商品的数量
    engine.updateValue('items.0.count', 5)
    await engine.waitFlush()

    expect(engine.getValue('items.0.subtotal')).toBe(500) // 100 * 5
    expect(engine.getValue('totalPrice')).toBe(650) // 500 + 150
    expect(engine.getValue('finalPrice')).toBe(650)

    // 4. 应用折扣
    engine.updateValue('discount', 50)
    await engine.waitFlush()

    expect(engine.getValue('finalPrice')).toBe(600) // 650 - 50

    // 5. 删除第一个商品
    engine.listRemove('items', 0)
    await engine.waitFlush()

    expect(engine.getValue('items')).toHaveLength(1)
    expect(engine.getValue('totalPrice')).toBe(150) // 只剩 Product B
    expect(engine.getValue('finalPrice')).toBe(100) // 150 - 50

    // 6. 校验
    const result = await engine.validate()
    expect(result).toBe(true)

    // 7. 清空购物车
    engine.listClear('items')
    await engine.waitFlush()

    expect(engine.getValue('totalPrice')).toBe(0)
    expect(engine.getValue('finalPrice')).toBe(-50) // 0 - 50
  })
})
