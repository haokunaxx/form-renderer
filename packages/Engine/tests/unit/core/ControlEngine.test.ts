import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaParser } from '../../../src/core/SchemaParser'
import { ModelManager } from '../../../src/core/ModelManager'
import { RenderSchemaBuilder } from '../../../src/core/RenderSchemaBuilder'
import { ControlEngine } from '../../../src/core/ControlEngine'

describe('ControlEngine', () => {
  describe('基本计算', () => {
    it('应该计算简单的 field 控制属性', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true,
            disabled: false
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const nameNode = renderNode.children![0]
      expect(nameNode.computed).toBeDefined()
      expect(nameNode.computed!.required).toBe(true)
      expect(nameNode.computed!.disabled).toBe(false)
      expect(nameNode.computed!.readonly).toBe(false)
      expect(nameNode.computed!.ifShow).toBe(true)
      expect(nameNode.computed!.show).toBe(true)
    })

    it('应该计算函数格式的控制属性', () => {
      const schema = {
        type: 'form',
        properties: {
          type: { type: 'field' },
          address: {
            type: 'field',
            required: (ctx: any) => ctx.getValue('type') === 'company',
            ifShow: (ctx: any) => ctx.getValue('type') !== 'none'
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ type: 'company' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const addressNode = renderNode.children![1]
      expect(addressNode.computed!.required).toBe(true) // type === 'company'
      expect(addressNode.computed!.ifShow).toBe(true) // type !== 'none'
    })

    it('应该计算对象格式的控制属性', () => {
      const schema = {
        type: 'form',
        properties: {
          age: { type: 'field' },
          name: {
            type: 'field',
            required: {
              when: (ctx: any) => ctx.getValue('age') > 18,
              deps: ['age']
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ age: 25 })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const nameNode = renderNode.children![1]
      expect(nameNode.computed!.required).toBe(true) // age > 18
    })

    it('应该计算对象格式（when 为 boolean）的控制属性', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: {
              when: true,
              deps: ['age']
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const nameNode = renderNode.children![0]
      expect(nameNode.computed!.required).toBe(true)
    })

    it('应该未定义时使用默认值', () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const nameNode = renderNode.children![0]
      expect(nameNode.computed!.required).toBe(false) // 默认 false
      expect(nameNode.computed!.disabled).toBe(false) // 默认 false
      expect(nameNode.computed!.readonly).toBe(false) // 默认 false
      expect(nameNode.computed!.ifShow).toBe(true) // 默认 true
      expect(nameNode.computed!.show).toBe(true) // 默认 true
    })
  })

  describe('控制属性继承', () => {
    it('应该 disabled 从父节点继承', () => {
      const schema = {
        type: 'form',
        properties: {
          card: {
            type: 'layout',
            disabled: true,
            properties: {
              field: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const cardNode = renderNode.children![0]
      const fieldNode = cardNode.children![0]

      expect(cardNode.computed!.disabled).toBe(true)
      expect(fieldNode.computed!.disabled).toBe(true) // 继承
    })

    it('应该 readonly 从父节点继承', () => {
      const schema = {
        type: 'form',
        properties: {
          card: {
            type: 'layout',
            readonly: true,
            properties: {
              field: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const cardNode = renderNode.children![0]
      const fieldNode = cardNode.children![0]

      expect(cardNode.computed!.readonly).toBe(true)
      expect(fieldNode.computed!.readonly).toBe(true) // 继承
    })

    it('应该 ifShow 从父节点继承', () => {
      const schema = {
        type: 'form',
        properties: {
          card: {
            type: 'layout',
            ifShow: false,
            properties: {
              field: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const cardNode = renderNode.children![0]
      const fieldNode = cardNode.children![0]

      expect(cardNode.computed!.ifShow).toBe(false)
      expect(fieldNode.computed!.ifShow).toBe(false) // 继承
    })

    it('应该 show 不继承', () => {
      const schema = {
        type: 'form',
        properties: {
          card: {
            type: 'layout',
            show: false,
            properties: {
              field: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const cardNode = renderNode.children![0]
      const fieldNode = cardNode.children![0]

      expect(cardNode.computed!.show).toBe(false)
      expect(fieldNode.computed!.show).toBe(true) // 不继承，使用默认值 true
    })

    it('应该 required 不继承', () => {
      const schema = {
        type: 'form',
        properties: {
          card: {
            type: 'layout',
            required: true,
            properties: {
              field: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const cardNode = renderNode.children![0]
      const fieldNode = cardNode.children![0]

      expect(cardNode.computed!.required).toBe(true)
      expect(fieldNode.computed!.required).toBe(false) // 不继承
    })

    it('应该子节点可以覆盖父节点的 disabled', () => {
      const schema = {
        type: 'form',
        properties: {
          card: {
            type: 'layout',
            disabled: false,
            properties: {
              field: {
                type: 'field',
                disabled: true
              }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const fieldNode = renderNode.children![0].children![0]
      expect(fieldNode.computed!.disabled).toBe(true)
    })

    it('应该多层继承正确', () => {
      const schema = {
        type: 'form',
        properties: {
          card1: {
            type: 'layout',
            disabled: true,
            properties: {
              card2: {
                type: 'layout',
                readonly: true,
                properties: {
                  field: { type: 'field' }
                }
              }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const fieldNode = renderNode.children![0].children![0].children![0]

      expect(fieldNode.computed!.disabled).toBe(true) // 从 card1 继承
      expect(fieldNode.computed!.readonly).toBe(true) // 从 card2 继承
    })
  })

  describe('Context 功能', () => {
    it('应该 getValue 获取当前节点值', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: (ctx: any) => {
              return ctx.getValue() === 'John'
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: 'John' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const nameNode = renderNode.children![0]
      expect(nameNode.computed!.required).toBe(true)
    })

    it('应该 getValue 获取指定路径值', () => {
      const schema = {
        type: 'form',
        properties: {
          type: { type: 'field' },
          name: {
            type: 'field',
            required: (ctx: any) => ctx.getValue('type') === 'company'
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ type: 'company' })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const nameNode = renderNode.children![1]
      expect(nameNode.computed!.required).toBe(true)
    })

    it('应该 getSchema 获取当前节点 schema', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            customAttr: 'test',
            required: (ctx: any) => {
              const schema = ctx.getSchema()
              return schema?.customAttr === 'test'
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const nameNode = renderNode.children![0]
      expect(nameNode.computed!.required).toBe(true)
    })

    it('应该 getSchema 获取指定路径 schema', () => {
      const schema = {
        type: 'form',
        properties: {
          type: {
            type: 'field',
            customAttr: 'company'
          },
          name: {
            type: 'field',
            required: (ctx: any) => {
              const typeSchema = ctx.getSchema('type')
              return typeSchema?.customAttr === 'company'
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const nameNode = renderNode.children![1]
      expect(nameNode.computed!.required).toBe(true)
    })
  })

  describe('list 场景', () => {
    it('应该 getCurRowValue 获取当前行对象', () => {
      const schema = {
        type: 'form',
        properties: {
          list: {
            type: 'list',
            items: {
              price: { type: 'field' },
              count: { type: 'field' },
              total: {
                type: 'field',
                required: (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  return row.price > 100
                }
              }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        list: [
          { price: 200, count: 2 },
          { price: 50, count: 1 }
        ]
      })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const listNode = renderNode.children![0]
      const row0Total = listNode.children![0][2] // 第0行的 total
      const row1Total = listNode.children![1][2] // 第1行的 total

      expect(row0Total.computed!.required).toBe(true) // price 200 > 100
      expect(row1Total.computed!.required).toBe(false) // price 50 <= 100
    })

    it('应该 getCurRowIndex 获取当前行索引', () => {
      const schema = {
        type: 'form',
        properties: {
          list: {
            type: 'list',
            items: {
              field: {
                type: 'field',
                required: (ctx: any) => ctx.getCurRowIndex() === 0
              }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        list: [{}, {}, {}]
      })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const listNode = renderNode.children![0]
      expect(listNode.children![0][0].computed!.required).toBe(true) // 索引 0
      expect(listNode.children![1][0].computed!.required).toBe(false) // 索引 1
      expect(listNode.children![2][0].computed!.required).toBe(false) // 索引 2
    })

    it('应该 list 嵌套 list 的 getCurRowValue 正确', () => {
      const schema = {
        type: 'form',
        properties: {
          list: {
            type: 'list',
            items: {
              childList: {
                type: 'list',
                items: {
                  field: {
                    type: 'field',
                    required: (ctx: any) => {
                      const row = ctx.getCurRowValue()
                      return row.value > 10
                    }
                  },
                  value: { type: 'field' }
                }
              }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        list: [
          {
            childList: [{ value: 20 }, { value: 5 }]
          }
        ]
      })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const childListNode = renderNode.children![0].children![0][0]
      const childRow0Field = childListNode.children![0][0]
      const childRow1Field = childListNode.children![1][0]

      expect(childRow0Field.computed!.required).toBe(true) // value 20 > 10
      expect(childRow1Field.computed!.required).toBe(false) // value 5 <= 10
    })

    it('应该 list 中的 layout 继承正确', () => {
      const schema = {
        type: 'form',
        properties: {
          list: {
            type: 'list',
            items: {
              card: {
                type: 'layout',
                disabled: true,
                properties: {
                  field: { type: 'field' }
                }
              }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        list: [{}]
      })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const cardNode = renderNode.children![0].children![0][0]
      const fieldNode = cardNode.children![0]

      expect(fieldNode.computed!.disabled).toBe(true) // 继承 card 的 disabled
    })
  })

  describe('边界情况', () => {
    it('应该控制函数抛错时使用默认值', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: () => {
              throw new Error('Test error')
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)

      // 不应该抛错
      expect(() => engine.computeAll(renderNode)).not.toThrow()

      const nameNode = renderNode.children![0]
      expect(nameNode.computed!.required).toBe(false) // 使用默认值
    })

    it('应该处理路径不存在的情况', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: (ctx: any) => {
              const value = ctx.getValue('notExist')
              return value !== undefined
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const nameNode = renderNode.children![0]
      expect(nameNode.computed!.required).toBe(false) // notExist 为 undefined
    })

    it('应该处理深层嵌套', () => {
      const schema = {
        type: 'form',
        properties: {
          card1: {
            type: 'layout',
            properties: {
              card2: {
                type: 'layout',
                properties: {
                  card3: {
                    type: 'layout',
                    properties: {
                      field: { type: 'field', required: true }
                    }
                  }
                }
              }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      const fieldNode =
        renderNode.children![0].children![0].children![0].children![0]

      expect(fieldNode.computed).toBeDefined()
      expect(fieldNode.computed!.required).toBe(true)
    })

    it('应该处理空 children', () => {
      const schema = {
        type: 'form',
        properties: {}
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)

      expect(() => engine.computeAll(renderNode)).not.toThrow()
      expect(renderNode.computed).toBeDefined()
    })
  })

  describe('复杂场景', () => {
    it('应该正确计算复杂 schema', () => {
      const schema = {
        type: 'form',
        properties: {
          type: { type: 'field' },
          address: {
            type: 'field',
            required: (ctx: any) => ctx.getValue('type') === 'company',
            ifShow: (ctx: any) => ctx.getValue('type') !== 'none'
          },
          card: {
            type: 'layout',
            disabled: (ctx: any) => ctx.getValue('type') === 'disabled',
            properties: {
              cardField: { type: 'field' }
            }
          },
          list: {
            type: 'list',
            items: {
              price: { type: 'field' },
              total: {
                type: 'field',
                required: (ctx: any) => {
                  const row = ctx.getCurRowValue()
                  return row.price > 100
                }
              }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        type: 'company',
        list: [{ price: 200 }, { price: 50 }]
      })
      const builder = new RenderSchemaBuilder(modelManager)
      const renderNode = builder.build(parsed.root)

      const engine = new ControlEngine(modelManager, parsed)
      engine.computeAll(renderNode)

      // 验证 address
      const addressNode = renderNode.children![1]
      expect(addressNode.computed!.required).toBe(true) // type === 'company'
      expect(addressNode.computed!.ifShow).toBe(true) // type !== 'none'

      // 验证 card
      const cardNode = renderNode.children![2]
      expect(cardNode.computed!.disabled).toBe(false) // type !== 'disabled'

      // 验证 list
      const listNode = renderNode.children![3]
      const row0Total = listNode.children![0][1]
      const row1Total = listNode.children![1][1]
      expect(row0Total.computed!.required).toBe(true) // price 200 > 100
      expect(row1Total.computed!.required).toBe(false) // price 50 <= 100
    })
  })
})
