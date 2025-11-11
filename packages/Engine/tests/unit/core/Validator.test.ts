import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaParser } from '../../../src/core/SchemaParser'
import { ModelManager } from '../../../src/core/ModelManager'
import { RenderSchemaBuilder } from '../../../src/core/RenderSchemaBuilder'
import { ControlEngine } from '../../../src/core/ControlEngine'
import { SubscribeManager } from '../../../src/core/SubscribeManager'
import { ListOperator } from '../../../src/core/ListOperator'
import { UpdateScheduler } from '../../../src/core/UpdateScheduler'
import { Validator } from '../../../src/core/Validator'

describe('Validator', () => {
  describe('required 校验', () => {
    it('应该 required=true 且值为空时失败', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: '' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.ok).toBe(false)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]).toMatchObject({
          path: 'name',
          message: '此字段为必填项',
          code: 'required'
        })
      }
    })

    it('应该 required=true 且值非空时通过', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: 'John' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).toBe(true)
    })

    it('应该 required=false 时通过', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: false
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: '' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).toBe(true)
    })

    it('应该空值判断正确（空字符串/null/undefined/空数组）', async () => {
      const schema = {
        type: 'form',
        properties: {
          a: { type: 'field', required: true },
          b: { type: 'field', required: true },
          c: { type: 'field', required: true },
          d: { type: 'field', required: true }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        a: '',
        b: null,
        c: undefined,
        d: []
      })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors).toHaveLength(4)
      }
    })

    it('应该 0 和 false 不视为空', async () => {
      const schema = {
        type: 'form',
        properties: {
          count: { type: 'field', required: true },
          flag: { type: 'field', required: true }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        count: 0,
        flag: false
      })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).toBe(true)
    })
  })

  describe('自定义 validators', () => {
    it('应该执行自定义 validator', async () => {
      const schema = {
        type: 'form',
        properties: {
          age: {
            type: 'field',
            validators: [
              (value: any) => {
                if (value < 18) {
                  return '必须年满18岁'
                }
              }
            ]
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ age: 15 })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors[0].message).toBe('必须年满18岁')
      }
    })

    it('应该多个 validators 顺序执行', async () => {
      const schema = {
        type: 'form',
        properties: {
          password: {
            type: 'field',
            validators: [
              (value: any) => {
                if (value.length < 6) {
                  return '密码至少6位'
                }
              },
              (value: any) => {
                if (!/[A-Z]/.test(value)) {
                  return '密码必须包含大写字母'
                }
              }
            ]
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ password: '123' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true)
      if (result !== true) {
        // 第一个 validator 失败，不执行第二个
        expect(result.errors[0].message).toBe('密码至少6位')
      }
    })

    it('应该支持异步 validator', async () => {
      const schema = {
        type: 'form',
        properties: {
          username: {
            type: 'field',
            validators: [
              async (value: any) => {
                // 模拟异步校验（如检查用户名是否存在）
                await new Promise((resolve) => setTimeout(resolve, 10))
                if (value === 'admin') {
                  return '用户名已存在'
                }
              }
            ]
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ username: 'admin' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors[0].message).toBe('用户名已存在')
      }
    })

    it('应该 validator 返回 FieldError 对象', async () => {
      const schema = {
        type: 'form',
        properties: {
          age: {
            type: 'field',
            validators: [
              (value: any) => {
                if (value < 18) {
                  return {
                    message: '必须年满18岁',
                    code: 'age_limit'
                  }
                }
              }
            ]
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ age: 15 })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors[0]).toMatchObject({
          path: 'age',
          message: '必须年满18岁',
          code: 'age_limit'
        })
      }
    })

    it('应该 validator 抛错时捕获', async () => {
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

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ field: 'value' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors[0].code).toBe('validator_error')
      }
    })
  })

  describe('控制属性过滤', () => {
    it('应该 ifShow=false 跳过校验', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true,
            ifShow: false
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: '' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).toBe(true) // 跳过校验
    })

    it('应该 disabled=true 跳过校验', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true,
            disabled: true
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: '' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).toBe(true) // 跳过校验
    })

    it('应该 readonly=true 参与校验', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true,
            readonly: true
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: '' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true) // 参与校验，失败
    })

    it('应该 show=false 参与校验', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true,
            show: false
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: '' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true) // 参与校验，失败
    })
  })

  describe('全量校验', () => {
    it('应该不传参校验所有字段', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field', required: true },
          age: { type: 'field', required: true },
          email: { type: 'field', required: true }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        name: '',
        age: '',
        email: ''
      })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors).toHaveLength(3)
        expect(result.errors.map((e) => e.path)).toEqual([
          'age',
          'email',
          'name'
        ])
      }
    })

    it('应该错误按路径排序', async () => {
      const schema = {
        type: 'form',
        properties: {
          z: { type: 'field', required: true },
          a: { type: 'field', required: true },
          m: { type: 'field', required: true }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ z: '', a: '', m: '' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors.map((e) => e.path)).toEqual(['a', 'm', 'z'])
      }
    })

    it('应该构建 errorByPath', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field', required: true },
          age: { type: 'field', required: true }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: '', age: '' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errorByPath['age']).toHaveLength(1)
        expect(result.errorByPath['name']).toHaveLength(1)
      }
    })
  })

  describe('指定路径校验', () => {
    it('应该校验单个路径', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field', required: true },
          age: { type: 'field', required: true }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: '', age: '' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode, 'name')

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].path).toBe('name')
      }
    })

    it('应该校验多个路径', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field', required: true },
          age: { type: 'field', required: true },
          email: { type: 'field', required: true }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: '', age: 25, email: '' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode, ['name', 'email'])

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors).toHaveLength(2)
        expect(result.errors.map((e) => e.path)).toEqual(['email', 'name'])
      }
    })

    it('应该无效路径被忽略', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field', required: true }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: 'John' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode, ['notExist', 'name'])

      expect(result).toBe(true) // 只校验 name，通过
    })
  })

  describe('waitFlush 集成', () => {
    it('应该校验前等待更新完成', async () => {
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

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ type: 'personal', address: '' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      // 修改 type，但还没 flush
      updateScheduler.scheduleUpdate('type', 'company')

      // 立即校验（会等待 flush）
      const result = await validator.validate(renderNode)

      // address 的 required 应该已经重算为 true
      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors[0].path).toBe('address')
      }
    })
  })

  describe('复杂场景', () => {
    it('应该正确校验复杂表单', async () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true,
            validators: [
              (value: any) => {
                if (value.length < 2) return '名字至少2个字符'
              }
            ]
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
          email: {
            type: 'field',
            required: false,
            validators: [
              (value: any) => {
                if (value && !value.includes('@')) {
                  return '邮箱格式不正确'
                }
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

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        name: 'J',
        age: 15,
        email: 'invalid',
        list: [{ field: '' }, { field: 'ok' }]
      })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)
      const controlEngine = new ControlEngine(modelManager, parsed)
      controlEngine.computeAll(renderNode)
      const subscribeManager = new SubscribeManager(
        parsed.subscribes,
        modelManager,
        parsed
      )
      const listOperator = new ListOperator(modelManager)
      const updateScheduler = new UpdateScheduler(
        modelManager,
        controlEngine,
        subscribeManager,
        listOperator,
        builder,
        parsed,
        renderNode
      )
      const validator = new Validator(modelManager, updateScheduler, parsed)

      const result = await validator.validate(renderNode)

      expect(result).not.toBe(true)
      if (result !== true) {
        expect(result.errors.length).toBeGreaterThan(0)
        // name: 名字至少2个字符
        // age: 必须年满18岁
        // email: 邮箱格式不正确
        // list.0.field: 必填
        expect(result.errors).toHaveLength(4)
      }
    })
  })
})
