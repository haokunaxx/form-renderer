import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../src/FormEngine'

describe('集成测试：订阅联动', () => {
  it('简单的 A → B 联动', async () => {
    const schema = {
      type: 'form',
      properties: {
        type: { type: 'field' },
        address: {
          type: 'field',
          subscribes: {
            type: (ctx: any) => {
              if (ctx.getValue('type') === 'personal') {
                ctx.updateValue('address', '')
              }
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: { type: 'company', address: 'Company Address' }
    })

    engine.updateValue('type', 'personal')
    await engine.waitFlush()

    expect(engine.getValue('address')).toBe('')
  })

  it('A → B → C 级联更新', async () => {
    const schema = {
      type: 'form',
      properties: {
        a: {
          type: 'field',
          subscribes: {
            b: (ctx: any) => {
              ctx.updateValue('c', ctx.getValue('b') * 2)
            }
          }
        },
        b: {
          type: 'field',
          subscribes: {
            a: (ctx: any) => {
              ctx.updateValue('b', ctx.getValue('a') + 10)
            }
          }
        },
        c: { type: 'field' }
      }
    }

    const engine = new FormEngine({ schema, model: { a: 0, b: 0, c: 0 } })

    engine.updateValue('a', 5)
    await engine.waitFlush()

    expect(engine.getValue('b')).toBe(15) // a(5) + 10
    expect(engine.getValue('c')).toBe(30) // b(15) * 2
  })

  it('list 内字段联动（同行）', async () => {
    const schema = {
      type: 'form',
      properties: {
        list: {
          type: 'list',
          items: {
            value: { type: 'field' },
            double: {
              type: 'field',
              subscribes: {
                '.value': (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  ctx.updateValue(ctx.subscriberPath, (row.value || 0) * 2)
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
        list: [
          { value: 10, double: 0 },
          { value: 20, double: 0 }
        ]
      }
    })

    // 修改第0行的 value
    engine.updateValue('list.0.value', 15)
    await engine.waitFlush()

    expect(engine.getValue('list.0.double')).toBe(30) // 15 * 2
    expect(engine.getValue('list.1.double')).toBe(0) // 不影响其他行

    // 修改第1行的 value
    engine.updateValue('list.1.value', 25)
    await engine.waitFlush()

    expect(engine.getValue('list.1.double')).toBe(50) // 25 * 2
  })

  it('通配符订阅', async () => {
    const schema = {
      type: 'form',
      properties: {
        summary: {
          type: 'field',
          subscribes: {
            'list.*.price': (ctx: any) => {
              const list = ctx.getValue('list') || []
              const total = list.reduce(
                (sum: number, item: any) => sum + (item.price || 0),
                0
              )
              ctx.updateValue('summary', total)
            }
          }
        },
        list: {
          type: 'list',
          items: {
            price: { type: 'field' }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        summary: 0,
        list: [{ price: 100 }, { price: 200 }]
      }
    })

    // 修改任意一行的 price
    engine.updateValue('list.0.price', 150)
    await engine.waitFlush()

    expect(engine.getValue('summary')).toBe(350) // 150 + 200
  })

  it('list 结构变化触发订阅', async () => {
    const schema = {
      type: 'form',
      properties: {
        count: {
          type: 'field',
          subscribes: {
            list: (ctx: any) => {
              const list = ctx.getValue('list') || []
              ctx.updateValue('count', list.length)
            }
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

    const engine = new FormEngine({
      schema,
      model: { count: 0, list: [] }
    })

    // append 触发订阅
    engine.listAppend('list', { field: 'a' })
    await engine.waitFlush()

    expect(engine.getValue('count')).toBe(1)

    // 再 append
    engine.listAppend('list', { field: 'b' })
    await engine.waitFlush()

    expect(engine.getValue('count')).toBe(2)
  })
})
