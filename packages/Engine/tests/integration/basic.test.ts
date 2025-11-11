import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../src/FormEngine'

describe('集成测试：基础操作', () => {
  it('完整的增删改查流程', async () => {
    const schema = {
      type: 'form',
      properties: {
        name: { type: 'field', required: true },
        age: { type: 'field', required: true },
        email: { type: 'field' }
      }
    }

    // 1. 创建引擎
    const engine = new FormEngine({
      schema,
      model: { name: 'John', age: 25 }
    })

    // 2. 读取初始值
    expect(engine.getValue('name')).toBe('John')
    expect(engine.getValue('age')).toBe(25)

    // 3. 更新值
    engine.updateValue('name', 'Jane')
    engine.updateValue('email', 'jane@example.com')
    await engine.waitFlush()

    expect(engine.getValue('name')).toBe('Jane')
    expect(engine.getValue('email')).toBe('jane@example.com')

    // 4. 校验通过
    const result1 = await engine.validate()
    expect(result1).toBe(true)

    // 5. 设置无效值
    engine.updateValue('age', '')
    await engine.waitFlush()

    // 6. 校验失败
    const result2 = await engine.validate()
    expect(result2).not.toBe(true)
    if (result2 !== true) {
      expect(result2.errors).toHaveLength(1)
      expect(result2.errors[0].path).toBe('age')
    }

    // 7. 重置
    engine.reset()
    await engine.waitFlush()

    expect(engine.getValue('name')).toBe('John')
    expect(engine.getValue('age')).toBe(25)

    // 8. 销毁
    engine.destroy()
    expect(() => engine.getValue()).toThrow('has been destroyed')
  })

  it('批量更新', async () => {
    const schema = {
      type: 'form',
      properties: {
        name: { type: 'field' },
        age: { type: 'field' },
        city: { type: 'field' }
      }
    }

    const engine = new FormEngine({ schema })

    // 对象格式批量更新
    engine.updateValue({
      name: 'John',
      age: 25,
      city: 'Beijing'
    })
    await engine.waitFlush()

    expect(engine.getValue('name')).toBe('John')
    expect(engine.getValue('age')).toBe(25)
    expect(engine.getValue('city')).toBe('Beijing')
  })

  it('嵌套对象更新', async () => {
    const schema = {
      type: 'form',
      properties: {
        user: {
          type: 'layout',
          properties: {
            name: { type: 'field' },
            profile: {
              type: 'layout',
              properties: {
                age: { type: 'field' }
              }
            }
          }
        }
      }
    }

    const engine = new FormEngine({ schema })

    engine.updateValue({
      user: {
        name: 'John',
        profile: {
          age: 25
        }
      }
    })
    await engine.waitFlush()

    expect(engine.getValue('user.name')).toBe('John')
    expect(engine.getValue('user.profile.age')).toBe(25)
  })

  it('getRenderSchema 返回完整的渲染树', () => {
    const schema = {
      type: 'form',
      properties: {
        name: {
          type: 'field',
          required: true,
          component: 'Input'
        }
      }
    }

    const engine = new FormEngine({ schema })
    const renderSchema = engine.getRenderSchema()

    expect(renderSchema.type).toBe('form')
    expect(renderSchema.children).toHaveLength(1)
    expect(renderSchema.children![0].type).toBe('field')
    expect(renderSchema.children![0].computed).toBeDefined()
    expect(renderSchema.children![0].computed!.required).toBe(true)
    expect(renderSchema.children![0].component).toBe('Input')
  })
})
