import { describe, it, expect, beforeEach } from 'vitest'
import { FormEngine } from '../../src/FormEngine'

describe('Subscribe updateSelf', () => {
  it('should allow using updateSelf to update subscriber value', async () => {
    const schema = {
      type: 'form' as const,
      properties: {
        price: {
          type: 'field' as const,
          prop: 'price'
        },
        quantity: {
          type: 'field' as const,
          prop: 'quantity'
        },
        total: {
          type: 'field' as const,
          prop: 'total',
          subscribes: {
            price: (ctx) => {
              const price = ctx.getValue('price') || 0
              const quantity = ctx.getValue('quantity') || 0
              // 使用 updateSelf 而不是 updateValue('total', ...)
              ctx.updateSelf(price * quantity)
            },
            quantity: (ctx) => {
              const price = ctx.getValue('price') || 0
              const quantity = ctx.getValue('quantity') || 0
              ctx.updateSelf(price * quantity)
            }
          }
        }
      }
    }

    const model = {
      price: 10,
      quantity: 2,
      total: 0
    }

    const engine = new FormEngine({ schema, model })

    // 初始值应该是 0（构造时不自动计算 subscribe）
    expect(engine.getValue('total')).toBe(0)

    // 更新 price，应该触发 total 的 subscribe
    engine.updateValue('price', 20)
    await engine.waitFlush()

    expect(engine.getValue('total')).toBe(40) // 20 * 2

    // 更新 quantity，应该再次触发
    engine.updateValue('quantity', 5)
    await engine.waitFlush()

    expect(engine.getValue('total')).toBe(100) // 20 * 5
  })

  it('should work with updateSelf in list context', async () => {
    const schema = {
      type: 'form' as const,
      properties: {
        items: {
          type: 'list' as const,
          prop: 'items',
          items: {
            price: {
              type: 'field' as const,
              prop: 'price'
            },
            quantity: {
              type: 'field' as const,
              prop: 'quantity'
            },
            subtotal: {
              type: 'field' as const,
              prop: 'subtotal',
              subscribes: {
                '.price': (ctx) => {
                  const row = ctx.getCurRowValue()
                  const price = row?.price || 0
                  const quantity = row?.quantity || 0
                  // 使用 updateSelf 更新当前行的 subtotal
                  ctx.updateSelf(price * quantity)
                },
                '.quantity': (ctx) => {
                  const row = ctx.getCurRowValue()
                  const price = row?.price || 0
                  const quantity = row?.quantity || 0
                  ctx.updateSelf(price * quantity)
                }
              }
            }
          }
        }
      }
    }

    const model = {
      items: [
        { price: 10, quantity: 2, subtotal: 0 },
        { price: 5, quantity: 3, subtotal: 0 }
      ]
    }

    const engine = new FormEngine({ schema, model })

    // 更新第一行的 price
    engine.updateValue('items.0.price', 20)
    await engine.waitFlush()

    expect(engine.getValue('items.0.subtotal')).toBe(40) // 20 * 2
    expect(engine.getValue('items.1.subtotal')).toBe(0) // 未触发

    // 更新第二行的 quantity
    engine.updateValue('items.1.quantity', 4)
    await engine.waitFlush()

    expect(engine.getValue('items.0.subtotal')).toBe(40) // 保持不变
    expect(engine.getValue('items.1.subtotal')).toBe(20) // 5 * 4
  })

  it('should have correct subscriberPath in context', async () => {
    const schema = {
      type: 'form' as const,
      properties: {
        name: {
          type: 'field' as const,
          prop: 'name'
        },
        displayName: {
          type: 'field' as const,
          prop: 'displayName',
          subscribes: {
            name: (ctx) => {
              // subscriberPath 应该是 'displayName'
              expect(ctx.subscriberPath).toBe('displayName')
              const name = ctx.getValue('name')
              ctx.updateSelf(`Name: ${name}`)
            }
          }
        }
      }
    }

    const model = {
      name: 'John',
      displayName: ''
    }

    const engine = new FormEngine({ schema, model })

    engine.updateValue('name', 'Alice')
    await engine.waitFlush()

    expect(engine.getValue('displayName')).toBe('Name: Alice')
  })

  it('should work with array-style subscribes', async () => {
    const schema = {
      type: 'form' as const,
      properties: {
        firstName: {
          type: 'field' as const,
          prop: 'firstName'
        },
        lastName: {
          type: 'field' as const,
          prop: 'lastName'
        },
        fullName: {
          type: 'field' as const,
          prop: 'fullName'
        }
      },
      subscribes: [
        {
          target: 'firstName',
          handler: (ctx) => {
            const firstName = ctx.getValue('firstName') || ''
            const lastName = ctx.getValue('lastName') || ''
            ctx.updateValue('fullName', `${firstName} ${lastName}`.trim())
          }
        },
        {
          target: 'lastName',
          handler: (ctx) => {
            const firstName = ctx.getValue('firstName') || ''
            const lastName = ctx.getValue('lastName') || ''
            ctx.updateValue('fullName', `${firstName} ${lastName}`.trim())
          }
        }
      ]
    }

    const model = {
      firstName: '',
      lastName: '',
      fullName: ''
    }

    const engine = new FormEngine({ schema, model })

    engine.updateValue('firstName', 'John')
    await engine.waitFlush()

    expect(engine.getValue('fullName')).toBe('John')

    engine.updateValue('lastName', 'Doe')
    await engine.waitFlush()

    expect(engine.getValue('fullName')).toBe('John Doe')
  })
})
