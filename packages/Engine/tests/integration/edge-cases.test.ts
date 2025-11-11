import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../src/FormEngine'

describe('集成测试：边界情况', () => {
  it('空 Schema', () => {
    const schema = {
      type: 'form',
      properties: {}
    }

    const engine = new FormEngine({ schema })

    expect(engine.getValue()).toEqual({})
    expect(engine.getRenderSchema().children).toHaveLength(0)
  })

  it('空 model', async () => {
    const schema = {
      type: 'form',
      properties: {
        name: { type: 'field' },
        age: { type: 'field' }
      }
    }

    const engine = new FormEngine({ schema })

    expect(engine.getValue()).toEqual({})

    const result = await engine.validate()
    expect(result).toBe(true) // 非 required 字段，通过
  })

  it('路径不存在', () => {
    const schema = {
      type: 'form',
      properties: {
        name: { type: 'field' }
      }
    }

    const engine = new FormEngine({ schema })

    expect(engine.getValue('notExist')).toBeUndefined()
    expect(engine.getSchema('notExist')).toBeUndefined()
  })

  it('循环订阅检测', async () => {
    const schema = {
      type: 'form',
      properties: {
        a: {
          type: 'field',
          subscribes: {
            b: (ctx: any) => ctx.updateValue('a', ctx.getValue('b') + 1)
          }
        },
        b: {
          type: 'field',
          subscribes: {
            a: (ctx: any) => ctx.updateValue('b', ctx.getValue('a') + 1)
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: { a: 0, b: 0 },
      maxUpdateDepth: 5
    })

    engine.updateValue('a', 1)

    await expect(engine.waitFlush()).rejects.toThrow('Max update depth')
  })

  it('list 不存在时自动创建', async () => {
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

    const engine = new FormEngine({ schema }) // list 不存在

    engine.listAppend('list', { field: 'value' })
    await engine.waitFlush()

    expect(engine.getValue('list')).toHaveLength(1)
    expect(engine.getValue('list.0.field')).toBe('value')
  })

  it('更新 list 为非数组时的处理', async () => {
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

    const engine = new FormEngine({
      schema,
      model: { list: 'not an array' as any }
    })

    const renderSchema = engine.getRenderSchema()
    const listNode = renderSchema.children![0]

    // 非数组当作空数组
    expect(listNode.children).toHaveLength(0)
  })

  it('同时更新多个字段（批处理）', async () => {
    const schema = {
      type: 'form',
      properties: {
        a: { type: 'field' },
        b: { type: 'field' },
        c: { type: 'field' }
      }
    }

    const engine = new FormEngine({ schema })

    // 同步多次调用
    engine.updateValue('a', 1)
    engine.updateValue('b', 2)
    engine.updateValue('c', 3)

    // 合并为一次 flush
    await engine.waitFlush()

    expect(engine.getValue('a')).toBe(1)
    expect(engine.getValue('b')).toBe(2)
    expect(engine.getValue('c')).toBe(3)
  })

  it('validator 抛错时正确处理', async () => {
    const schema = {
      type: 'form',
      properties: {
        field: {
          type: 'field',
          validators: [
            () => {
              throw new Error('Validator error')
            }
          ]
        }
      }
    }

    const engine = new FormEngine({ schema, model: { field: 'value' } })

    const result = await engine.validate()

    expect(result).not.toBe(true)
    if (result !== true) {
      expect(result.errors[0].code).toBe('validator_error')
    }
  })

  it('setFormSchema 后值保留', () => {
    const schema1 = {
      type: 'form',
      properties: {
        name: { type: 'field' }
      }
    }

    const engine = new FormEngine({ schema: schema1, model: { name: 'John' } })

    const schema2 = {
      type: 'form',
      properties: {
        name: { type: 'field' },
        age: { type: 'field' }
      }
    }

    engine.setFormSchema(schema2)

    expect(engine.getValue('name')).toBe('John') // 值保留
    expect(engine.getRenderSchema().children).toHaveLength(2)
  })
})
