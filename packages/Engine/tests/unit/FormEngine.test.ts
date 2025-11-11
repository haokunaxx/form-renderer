import { describe, it, expect, vi } from 'vitest'
import { FormEngine, FormEngineError } from '../../src/FormEngine'

describe('FormEngine', () => {
  describe('初始化', () => {
    it('应该成功创建 FormEngine', () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      }

      const engine = new FormEngine({ schema })

      expect(engine).toBeDefined()
      expect(engine.getValue()).toEqual({})
    })

    it('应该使用提供的初始 model', () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: { type: 'field' }
        }
      }

      const engine = new FormEngine({
        schema,
        model: { name: 'John', age: 25 }
      })

      expect(engine.getValue('name')).toBe('John')
      expect(engine.getValue('age')).toBe(25)
    })

    it('应该初始化时计算 computed', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true
          }
        }
      }

      const engine = new FormEngine({ schema })
      const renderSchema = engine.getRenderSchema()

      expect(renderSchema.children![0].computed).toBeDefined()
      expect(renderSchema.children![0].computed!.required).toBe(true)
    })
  })

  describe('getValue / getSchema', () => {
    it('应该 getValue 读取值', () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          user: {
            type: 'layout',
            properties: {
              age: { type: 'field' }
            }
          }
        }
      }

      const engine = new FormEngine({
        schema,
        model: { name: 'John', user: { age: 25 } }
      })

      expect(engine.getValue()).toEqual({ name: 'John', user: { age: 25 } })
      expect(engine.getValue('name')).toBe('John')
      expect(engine.getValue('user.age')).toBe(25)
    })

    it('应该 getSchema 读取 Schema', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            customAttr: 'test'
          }
        }
      }

      const engine = new FormEngine({ schema })

      const rootSchema = engine.getSchema()
      expect(rootSchema.type).toBe('form')

      const nameSchema = engine.getSchema('name')
      expect(nameSchema?.type).toBe('field')
      expect((nameSchema as any)?.customAttr).toBe('test')
    })

    it('应该 getRenderSchema 返回渲染树', () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      }

      const engine = new FormEngine({ schema })
      const renderSchema = engine.getRenderSchema()

      expect(renderSchema.type).toBe('form')
      expect(renderSchema.children).toHaveLength(1)
      expect(renderSchema.children![0].type).toBe('field')
    })
  })

  describe('updateValue', () => {
    it('应该更新单个字段', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      }

      const engine = new FormEngine({ schema, model: { name: 'John' } })

      engine.updateValue('name', 'Jane')
      await engine.waitFlush()

      expect(engine.getValue('name')).toBe('Jane')
    })

    it('应该支持对象格式', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: { type: 'field' }
        }
      }

      const engine = new FormEngine({ schema })

      engine.updateValue({ name: 'John', age: 25 })
      await engine.waitFlush()

      expect(engine.getValue('name')).toBe('John')
      expect(engine.getValue('age')).toBe(25)
    })

    it('应该支持通配符', async () => {
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
        model: { list: [{}, {}, {}] }
      })

      engine.updateValue('list.*.field', 'updated')
      await engine.waitFlush()

      expect(engine.getValue('list.0.field')).toBe('updated')
      expect(engine.getValue('list.1.field')).toBe('updated')
      expect(engine.getValue('list.2.field')).toBe('updated')
    })

    it('应该更新后重算 computed', async () => {
      const schema = {
        type: 'form',
        properties: {
          type: { type: 'field' },
          address: {
            type: 'field',
            required: (ctx: any) => ctx.getValue('type') === 'company'
          }
        }
      }

      const engine = new FormEngine({ schema, model: { type: 'personal' } })
      const renderSchema = engine.getRenderSchema()
      const addressNode = renderSchema.children![1]

      expect(addressNode.computed!.required).toBe(false)

      engine.updateValue('type', 'company')
      await engine.waitFlush()

      expect(addressNode.computed!.required).toBe(true)
    })
  })

  describe('list 操作', () => {
    it('应该 listAppend 追加行', async () => {
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

      const engine = new FormEngine({ schema, model: { list: [] } })

      engine.listAppend('list', { field: 'value1' })
      await engine.waitFlush()

      expect(engine.getValue('list')).toHaveLength(1)
      expect(engine.getValue('list.0.field')).toBe('value1')
    })

    it('应该 listInsert 插入行', async () => {
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
        model: { list: [{ field: 'a' }, { field: 'b' }] }
      })

      engine.listInsert('list', 1, { field: 'x' })
      await engine.waitFlush()

      expect(engine.getValue('list')).toHaveLength(3)
      expect(engine.getValue('list.0.field')).toBe('a')
      expect(engine.getValue('list.1.field')).toBe('x')
      expect(engine.getValue('list.2.field')).toBe('b')
    })

    it('应该 listRemove 删除行', async () => {
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
        model: { list: [{ field: 'a' }, { field: 'b' }, { field: 'c' }] }
      })

      engine.listRemove('list', 1)
      await engine.waitFlush()

      expect(engine.getValue('list')).toHaveLength(2)
      expect(engine.getValue('list.0.field')).toBe('a')
      expect(engine.getValue('list.1.field')).toBe('c')
    })

    it('应该 list 操作后重建 renderNode', async () => {
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

      const engine = new FormEngine({ schema, model: { list: [] } })
      const renderSchema = engine.getRenderSchema()
      const listNode = renderSchema.children![0]

      expect(listNode.children).toHaveLength(0)

      engine.listAppend('list', { field: 'value' })
      await engine.waitFlush()

      expect(listNode.children).toHaveLength(1)
      expect(listNode.children![0][0].path).toBe('list.0.field')
    })
  })

  describe('validate', () => {
    it('应该校验通过', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true
          }
        }
      }

      const engine = new FormEngine({ schema, model: { name: 'John' } })
      const result = await engine.validate()

      expect(result).toBe(true)
    })

    it('应该校验失败', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true
          }
        }
      }

      const engine = new FormEngine({ schema, model: { name: '' } })
      const result = await engine.validate()

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].path).toBe('name')
      }
    })

    it('应该校验前等待 flush', async () => {
      const schema = {
        type: 'form',
        properties: {
          type: { type: 'field' },
          address: {
            type: 'field',
            required: (ctx: any) => ctx.getValue('type') === 'company'
          }
        }
      }

      const engine = new FormEngine({
        schema,
        model: { type: 'personal', address: '' }
      })

      // 修改 type，但不等待
      engine.updateValue('type', 'company')

      // 立即校验（内部会等待）
      const result = await engine.validate()

      expect(result).not.toBe(true)
    })
  })

  describe('reset', () => {
    it('应该重置到初始值', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: { type: 'field' }
        }
      }

      const engine = new FormEngine({
        schema,
        model: { name: 'John', age: 25 }
      })

      engine.updateValue('name', 'Jane')
      engine.updateValue('age', 30)
      await engine.waitFlush()

      engine.reset()
      await engine.waitFlush()

      expect(engine.getValue('name')).toBe('John')
      expect(engine.getValue('age')).toBe(25)
    })

    it('应该重置到指定值', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      }

      const engine = new FormEngine({ schema, model: { name: 'John' } })

      engine.reset({ name: 'Bob', age: 30 })
      await engine.waitFlush()

      expect(engine.getValue('name')).toBe('Bob')
      expect(engine.getValue('age')).toBe(30)
    })
  })

  describe('destroy', () => {
    it('应该销毁后抛出错误', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      }

      const engine = new FormEngine({ schema })

      engine.destroy()

      expect(() => engine.getValue()).toThrow(FormEngineError)
      expect(() => engine.getValue()).toThrow('has been destroyed')
      expect(() => engine.updateValue('name', 'test')).toThrow(FormEngineError)
      await expect(engine.validate()).rejects.toThrow(FormEngineError)
    })

    it('应该多次 destroy 不报错', () => {
      const schema = {
        type: 'form',
        properties: {}
      }

      const engine = new FormEngine({ schema })

      engine.destroy()
      engine.destroy()
      engine.destroy()

      // 不应该抛错
      expect(true).toBe(true)
    })
  })

  describe('onValueChange', () => {
    it('应该监听值变化（功能预留，完整实现在集成测试）', () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      }

      const engine = new FormEngine({ schema })
      const handler = vi.fn()

      const unsubscribe = engine.onValueChange(handler)

      expect(typeof unsubscribe).toBe('function')

      unsubscribe()
      // 取消订阅成功
    })
  })

  describe('setFormSchema', () => {
    it('应该更新 Schema', async () => {
      const schema1 = {
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      }

      const engine = new FormEngine({
        schema: schema1,
        model: { name: 'John' }
      })

      expect(engine.getRenderSchema().children).toHaveLength(1)

      const schema2 = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: { type: 'field' }
        }
      }

      engine.setFormSchema(schema2)

      expect(engine.getRenderSchema().children).toHaveLength(2)
      expect(engine.getValue('name')).toBe('John') // 值保留
    })

    it('应该更新 Schema 后重新计算 computed', () => {
      const schema1 = {
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      }

      const engine = new FormEngine({ schema: schema1 })

      const schema2 = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true
          }
        }
      }

      engine.setFormSchema(schema2)

      const renderSchema = engine.getRenderSchema()
      expect(renderSchema.children![0].computed!.required).toBe(true)
    })
  })

  describe('综合场景', () => {
    it('应该支持完整的表单操作流程', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true
          },
          age: {
            type: 'field',
            required: true,
            validators: [
              (value: any) => {
                if (value < 18) return '必须年满18岁'
              }
            ]
          },
          list: {
            type: 'list',
            items: {
              field: {
                type: 'field',
                required: true
              }
            }
          }
        }
      }

      const engine = new FormEngine({ schema })

      // 1. 更新值
      engine.updateValue({ name: 'John', age: 25 })
      await engine.waitFlush()

      // 2. 添加列表项
      engine.listAppend('list', { field: 'item1' })
      engine.listAppend('list', { field: 'item2' })
      await engine.waitFlush()

      // 3. 校验通过
      let result = await engine.validate()
      expect(result).toBe(true)

      // 4. 修改为无效值
      engine.updateValue('age', 15)
      await engine.waitFlush()

      // 5. 校验失败
      result = await engine.validate()
      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors[0].message).toBe('必须年满18岁')
      }

      // 6. 重置
      engine.reset()
      await engine.waitFlush()

      // reset 重置到初始值（空对象）
      // 但通过 updateValue 设置过的路径会保留，值变为 undefined
      const resetValue = engine.getValue()
      expect(resetValue.name).toBeUndefined()
      expect(resetValue.age).toBeUndefined()
    })
  })
})
