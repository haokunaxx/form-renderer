import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaParser } from '../../../src/core/SchemaParser'
import { ModelManager } from '../../../src/core/ModelManager'
import {
  RenderSchemaBuilder,
  RenderSchemaBuilderError
} from '../../../src/core/RenderSchemaBuilder'

describe('RenderSchemaBuilder', () => {
  describe('基本构建', () => {
    it('应该构建最简单的 form', () => {
      const schema = {
        type: 'form',
        properties: {}
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)

      expect(renderSchema.type).toBe('form')
      expect(renderSchema.path).toBe('')
      expect(renderSchema.children).toEqual([])
    })

    it('应该构建包含 field 的 form', () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: { type: 'field' }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ name: 'John', age: 25 })
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)

      expect(renderSchema.type).toBe('form')
      expect(renderSchema.children).toHaveLength(2)
      expect(renderSchema.children![0]).toMatchObject({
        type: 'field',
        prop: 'name',
        path: 'name'
      })
      expect(renderSchema.children![1]).toMatchObject({
        type: 'field',
        prop: 'age',
        path: 'age'
      })
    })

    it('应该构建包含 layout 的 form', () => {
      const schema = {
        type: 'form',
        properties: {
          card: {
            type: 'layout',
            properties: {
              cardFieldA: { type: 'field' },
              cardFieldB: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)

      expect(renderSchema.children).toHaveLength(1)
      const card = renderSchema.children![0]
      expect(card).toMatchObject({
        type: 'layout',
        prop: 'card',
        path: 'card'
      })
      expect(card.children).toHaveLength(2)
      // layout 是 UI 容器，不影响数据路径
      expect(card.children![0]).toMatchObject({
        type: 'field',
        prop: 'cardFieldA',
        path: 'cardFieldA'
      })
      expect(card.children![1]).toMatchObject({
        type: 'field',
        prop: 'cardFieldB',
        path: 'cardFieldB'
      })
    })

    it('应该构建包含 list 的 form', () => {
      const schema = {
        type: 'form',
        properties: {
          list: {
            type: 'list',
            items: {
              listFieldA: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        list: [{}, {}]
      })
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)

      expect(renderSchema.children).toHaveLength(1)
      const list = renderSchema.children![0]
      expect(list).toMatchObject({
        type: 'list',
        prop: 'list',
        path: 'list'
      })
      expect(list.children).toHaveLength(2) // 2 行
      expect(Array.isArray(list.children![0])).toBe(true) // 每行是数组
    })

    it('应该正确转换 properties → children', () => {
      const schema = {
        type: 'form',
        properties: {
          a: { type: 'field' },
          b: { type: 'field' },
          c: { type: 'field' }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)

      expect(renderSchema.children).toHaveLength(3)
      expect(renderSchema.children!.map((c) => c.prop)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('list 展开', () => {
    it('应该空数组生成空 children', () => {
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

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ list: [] })
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)
      const list = renderSchema.children![0]

      expect(list.children).toEqual([])
    })

    it('应该单行数组正确展开', () => {
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

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        list: [{ field: 'value' }]
      })
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)
      const list = renderSchema.children![0]

      expect(list.children).toHaveLength(1)
      expect(list.children![0]).toHaveLength(1)
      expect(list.children![0][0]).toMatchObject({
        type: 'field',
        prop: 'field',
        path: 'list.0.field'
      })
    })

    it('应该多行数组正确展开', () => {
      const schema = {
        type: 'form',
        properties: {
          list: {
            type: 'list',
            items: {
              fieldA: { type: 'field' },
              fieldB: { type: 'field' }
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

      const renderSchema = builder.build(parsed.root)
      const list = renderSchema.children![0]

      expect(list.children).toHaveLength(3)

      // 第0行
      expect(list.children![0]).toHaveLength(2)
      expect(list.children![0][0].path).toBe('list.0.fieldA')
      expect(list.children![0][1].path).toBe('list.0.fieldB')

      // 第1行
      expect(list.children![1][0].path).toBe('list.1.fieldA')
      expect(list.children![1][1].path).toBe('list.1.fieldB')

      // 第2行
      expect(list.children![2][0].path).toBe('list.2.fieldA')
      expect(list.children![2][1].path).toBe('list.2.fieldB')
    })

    it('应该 list 嵌套 list 正确展开', () => {
      const schema = {
        type: 'form',
        properties: {
          list: {
            type: 'list',
            items: {
              childList: {
                type: 'list',
                items: {
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
        list: [{ childList: [{}, {}] }, { childList: [{}] }]
      })
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)
      const list = renderSchema.children![0]

      // 外层 list 有 2 行
      expect(list.children).toHaveLength(2)

      // 第0行有 1 个 childList
      const row0 = list.children![0]
      expect(row0).toHaveLength(1)
      const childList0 = row0[0]
      expect(childList0.type).toBe('list')
      expect(childList0.path).toBe('list.0.childList')
      expect(childList0.children).toHaveLength(2) // childList 有 2 行

      // childList 第0行
      expect(childList0.children![0][0].path).toBe('list.0.childList.0.field')
      // childList 第1行
      expect(childList0.children![1][0].path).toBe('list.0.childList.1.field')

      // 第1行的 childList
      const row1 = list.children![1]
      const childList1 = row1[0]
      expect(childList1.children).toHaveLength(1) // 只有 1 行
      expect(childList1.children![0][0].path).toBe('list.1.childList.0.field')
    })

    it('应该 list 中包含 layout 正确展开', () => {
      const schema = {
        type: 'form',
        properties: {
          list: {
            type: 'list',
            items: {
              card: {
                type: 'layout',
                properties: {
                  fieldA: { type: 'field' },
                  fieldB: { type: 'field' }
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

      const renderSchema = builder.build(parsed.root)
      const list = renderSchema.children![0]

      expect(list.children![0]).toHaveLength(1)
      const card = list.children![0][0]
      expect(card.type).toBe('layout')
      expect(card.path).toBe('list.0.card')
      expect(card.children).toHaveLength(2)
      // layout 是 UI 容器，不影响数据路径
      expect(card.children![0].path).toBe('list.0.fieldA')
      expect(card.children![1].path).toBe('list.0.fieldB')
    })
  })

  describe('属性保留', () => {
    it('应该保留控制属性', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true,
            disabled: false,
            readonly: (ctx: any) => true,
            ifShow: { when: true, deps: ['age'] },
            show: false
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)
      const nameNode = renderSchema.children![0]

      expect(nameNode.required).toBe(true)
      expect(nameNode.disabled).toBe(false)
      expect(typeof nameNode.readonly).toBe('function')
      expect(nameNode.ifShow).toEqual({ when: true, deps: ['age'] })
      expect(nameNode.show).toBe(false)
    })

    it('应该保留 UI 属性', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            component: 'Input',
            componentProps: { placeholder: 'Enter name' },
            formItemProps: { label: 'Name' }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)
      const nameNode = renderSchema.children![0]

      expect(nameNode.component).toBe('Input')
      expect(nameNode.componentProps).toEqual({ placeholder: 'Enter name' })
      expect(nameNode.formItemProps).toEqual({ label: 'Name' })
    })

    it('应该保留 validators', () => {
      const validator = (value: any) => {}
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            validators: [validator]
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)
      const nameNode = renderSchema.children![0]

      expect(nameNode.validators).toEqual([validator])
    })

    it('应该保留自定义属性', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            customAttr: 'customValue',
            icon: 'user'
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)
      const nameNode = renderSchema.children![0] as any

      expect(nameNode.customAttr).toBe('customValue')
      expect(nameNode.icon).toBe('user')
    })
  })

  describe('路径生成', () => {
    it('应该 form 路径为空', () => {
      const schema = {
        type: 'form',
        properties: {}
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)

      expect(renderSchema.path).toBe('')
    })

    it('应该顶层 field 路径正确', () => {
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

      const renderSchema = builder.build(parsed.root)

      expect(renderSchema.children![0].path).toBe('name')
    })

    it('应该嵌套 field 路径正确', () => {
      const schema = {
        type: 'form',
        properties: {
          card: {
            type: 'layout',
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

      const renderSchema = builder.build(parsed.root)

      expect(renderSchema.children![0].path).toBe('card')
      // layout 是 UI 容器，不影响数据路径，所以子节点路径不包含 layout 的 prop
      expect(renderSchema.children![0].children![0].path).toBe('field')
    })

    it('应该 list 路径正确', () => {
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

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ list: [{}] })
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)

      expect(renderSchema.children![0].path).toBe('list')
    })

    it('应该 list 行内字段路径正确', () => {
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

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ list: [{}, {}, {}] })
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)
      const list = renderSchema.children![0]

      expect(list.children![0][0].path).toBe('list.0.field')
      expect(list.children![1][0].path).toBe('list.1.field')
      expect(list.children![2][0].path).toBe('list.2.field')
    })

    it('应该深层嵌套路径正确', () => {
      const schema = {
        type: 'form',
        properties: {
          card1: {
            type: 'layout',
            properties: {
              card2: {
                type: 'layout',
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

      const renderSchema = builder.build(parsed.root)

      // 两层嵌套的 layout 都不影响数据路径
      expect(renderSchema.children![0].children![0].children![0].path).toBe(
        'field'
      )
    })
  })

  describe('边界情况', () => {
    it('应该 model 中 list 不存在时生成空 children', () => {
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

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({}) // list 不存在
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)
      const list = renderSchema.children![0]

      expect(list.children).toEqual([])
    })

    it('应该 model 中 list 为 null 时生成空 children', () => {
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

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ list: null })
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)
      const list = renderSchema.children![0]

      expect(list.children).toEqual([])
    })

    it('应该 model 中 list 不是数组时生成空 children', () => {
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

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({ list: 'not an array' as any })
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)
      const list = renderSchema.children![0]

      expect(list.children).toEqual([])
    })

    it('应该处理深层嵌套', () => {
      const schema = {
        type: 'form',
        properties: {
          list1: {
            type: 'list',
            items: {
              card: {
                type: 'layout',
                properties: {
                  list2: {
                    type: 'list',
                    items: {
                      field: { type: 'field' }
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
      // layout 不影响数据路径，所以 list2 直接在 list1 的元素下，不需要 card 层级
      const modelManager = new ModelManager({
        list1: [
          {
            list2: [{}, {}]
          }
        ]
      })
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)
      const list1 = renderSchema.children![0]
      const card = list1.children![0][0]
      const list2 = card.children![0]

      // layout 是 UI 容器，不影响数据路径
      expect(list2.path).toBe('list1.0.list2')
      expect(list2.children).toHaveLength(2)
      expect(list2.children![0][0].path).toBe('list1.0.list2.0.field')
      expect(list2.children![1][0].path).toBe('list1.0.list2.1.field')
    })

    it('应该根节点不是 form 时抛出错误', () => {
      const schema = {
        type: 'field'
      }

      const parser = new SchemaParser()
      // SchemaParser 会在解析时就抛错，所以这里直接构造一个错误的 root
      const fakeRoot = { type: 'field', path: '' } as any
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)

      expect(() => builder.build(fakeRoot)).toThrow(RenderSchemaBuilderError)
      expect(() => builder.build(fakeRoot)).toThrow('must be of type "form"')
    })

    it('应该处理空 model', () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          list: {
            type: 'list',
            items: {
              field: { type: 'field' }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({})
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)

      expect(renderSchema.children).toHaveLength(2)
      expect(renderSchema.children![1].children).toEqual([])
    })
  })

  describe('复杂场景', () => {
    it('应该成功构建完整的复杂 schema', () => {
      const validator = (value: any) => {}
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true,
            component: 'Input',
            validators: [validator]
          },
          card: {
            type: 'layout',
            ifShow: { when: () => true, deps: ['type'] },
            properties: {
              cardFieldA: {
                type: 'field',
                disabled: false
              }
            }
          },
          list: {
            type: 'list',
            items: {
              listFieldA: { type: 'field' },
              listCard: {
                type: 'layout',
                properties: {
                  listCardFieldA: { type: 'field' }
                }
              }
            }
          }
        }
      }

      const parser = new SchemaParser()
      const parsed = parser.parse(schema)
      const modelManager = new ModelManager({
        name: 'John',
        card: { cardFieldA: 'value' },
        list: [{}, {}]
      })
      const builder = new RenderSchemaBuilder(modelManager)

      const renderSchema = builder.build(parsed.root)

      // 验证结构
      expect(renderSchema.type).toBe('form')
      expect(renderSchema.children).toHaveLength(3)

      // 验证 name
      const name = renderSchema.children![0]
      expect(name.type).toBe('field')
      expect(name.path).toBe('name')
      expect(name.required).toBe(true)
      expect(name.component).toBe('Input')
      expect(name.validators).toEqual([validator])

      // 验证 card
      const card = renderSchema.children![1]
      expect(card.type).toBe('layout')
      expect(card.path).toBe('card')
      expect(card.ifShow).toBeDefined()
      expect(card.children).toHaveLength(1)

      // 验证 list
      const list = renderSchema.children![2]
      expect(list.type).toBe('list')
      expect(list.path).toBe('list')
      expect(list.children).toHaveLength(2)

      // 验证 list 第0行
      const row0 = list.children![0]
      expect(row0).toHaveLength(2)
      expect(row0[0].path).toBe('list.0.listFieldA')
      expect(row0[1].path).toBe('list.0.listCard')
      // layout 是 UI 容器，不影响数据路径
      expect(row0[1].children![0].path).toBe('list.0.listCardFieldA')
    })
  })
})
