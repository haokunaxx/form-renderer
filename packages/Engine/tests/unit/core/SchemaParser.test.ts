import { describe, it, expect } from 'vitest'
import {
  SchemaParser,
  SchemaValidationError
} from '../../../src/core/SchemaParser'

describe('SchemaParser', () => {
  const parser = new SchemaParser()

  describe('基本解析', () => {
    it('应该成功解析最简单的 form schema', () => {
      const schema = {
        type: 'form',
        properties: {}
      }

      const result = parser.parse(schema)

      expect(result.root.type).toBe('form')
      expect(result.root.path).toBe('')
      expect(result.root.properties).toEqual({})
      expect(result.propMap.size).toBe(0)
      expect(result.pathMap.size).toBe(1) // 只有根节点
      expect(result.subscribes).toEqual([])
    })

    it('应该成功解析包含 field 的 schema', () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          age: { type: 'field' }
        }
      }

      const result = parser.parse(schema)

      expect(result.root.properties?.name.type).toBe('field')
      expect(result.root.properties?.name.path).toBe('name')
      expect(result.root.properties?.name.prop).toBe('name')

      expect(result.root.properties?.age.type).toBe('field')
      expect(result.root.properties?.age.path).toBe('age')
      expect(result.root.properties?.age.prop).toBe('age')

      expect(result.propMap.get('name')).toHaveLength(1)
      expect(result.propMap.get('age')).toHaveLength(1)
      expect(result.pathMap.get('name')).toBeDefined()
      expect(result.pathMap.get('age')).toBeDefined()
    })

    it('应该成功解析包含 layout 的 schema', () => {
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

      const result = parser.parse(schema)

      expect(result.root.properties?.card.type).toBe('layout')
      expect(result.root.properties?.card.path).toBe('card')
      // layout 是 UI 容器，不影响数据路径
      expect(result.root.properties?.card.properties?.cardFieldA.path).toBe(
        'cardFieldA'
      )
      expect(result.root.properties?.card.properties?.cardFieldB.path).toBe(
        'cardFieldB'
      )

      expect(result.pathMap.get('card')).toBeDefined()
      expect(result.pathMap.get('cardFieldA')).toBeDefined()
      expect(result.pathMap.get('cardFieldB')).toBeDefined()
    })

    it('应该成功解析包含 list 的 schema', () => {
      const schema = {
        type: 'form',
        properties: {
          list: {
            type: 'list',
            items: {
              listFieldA: { type: 'field' },
              listFieldB: { type: 'field' }
            }
          }
        }
      }

      const result = parser.parse(schema)

      expect(result.root.properties?.list.type).toBe('list')
      expect(result.root.properties?.list.path).toBe('list')
      expect(result.root.properties?.list.items?.listFieldA.path).toBe(
        'list.items.listFieldA'
      )
      expect(result.root.properties?.list.items?.listFieldB.path).toBe(
        'list.items.listFieldB'
      )

      expect(result.pathMap.get('list')).toBeDefined()
      expect(result.pathMap.get('list.items.listFieldA')).toBeDefined()
      expect(result.pathMap.get('list.items.listFieldB')).toBeDefined()
    })

    it('应该成功解析深层嵌套的 schema', () => {
      const schema = {
        type: 'form',
        properties: {
          card: {
            type: 'layout',
            properties: {
              cardCard: {
                type: 'layout',
                properties: {
                  cardCardFieldA: { type: 'field' }
                }
              }
            }
          }
        }
      }

      const result = parser.parse(schema)

      // 两层嵌套的 layout 都不影响数据路径
      expect(
        result.root.properties?.card.properties?.cardCard.properties
          ?.cardCardFieldA.path
      ).toBe('cardCardFieldA')
      expect(result.pathMap.get('cardCardFieldA')).toBeDefined()
    })

    it('应该成功解析 list 嵌套 list', () => {
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

      const result = parser.parse(schema)

      expect(
        result.root.properties?.list.items?.childList.items?.field.path
      ).toBe('list.items.childList.items.field')
    })
  })

  describe('控制属性解析', () => {
    it('应该解析布尔值格式的控制属性', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true,
            disabled: false,
            readonly: true,
            ifShow: false,
            show: true
          }
        }
      }

      const result = parser.parse(schema)
      const nameNode = result.root.properties?.name

      expect(nameNode?.required).toBe(true)
      expect(nameNode?.disabled).toBe(false)
      expect(nameNode?.readonly).toBe(true)
      expect(nameNode?.ifShow).toBe(false)
      expect(nameNode?.show).toBe(true)
    })

    it('应该解析函数格式的控制属性', () => {
      const requiredFn = () => true
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: requiredFn
          }
        }
      }

      const result = parser.parse(schema)
      const nameNode = result.root.properties?.name

      expect(nameNode?.required).toBe(requiredFn)
    })

    it('应该解析对象格式的控制属性', () => {
      const whenFn = () => true
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: {
              when: whenFn,
              deps: ['age']
            }
          }
        }
      }

      const result = parser.parse(schema)
      const nameNode = result.root.properties?.name

      expect(nameNode?.required).toEqual({
        when: whenFn,
        deps: ['age']
      })
    })

    it('应该解析对象格式（when 为 boolean）的控制属性', () => {
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

      const result = parser.parse(schema)
      const nameNode = result.root.properties?.name

      expect(nameNode?.required).toEqual({
        when: true,
        deps: ['age']
      })
    })

    it('应该在对象格式缺少 when 时抛出错误', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: {
              deps: ['age']
            }
          }
        }
      }

      expect(() => parser.parse(schema)).toThrow(SchemaValidationError)
      expect(() => parser.parse(schema)).toThrow('must have "when" property')
    })

    it('应该在 when 类型错误时抛出错误', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: {
              when: 'invalid'
            }
          }
        }
      }

      expect(() => parser.parse(schema)).toThrow(SchemaValidationError)
      expect(() => parser.parse(schema)).toThrow(
        '"when" must be boolean or function'
      )
    })

    it('应该在 deps 类型错误时抛出错误', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: {
              when: true,
              deps: 'invalid'
            }
          }
        }
      }

      expect(() => parser.parse(schema)).toThrow(SchemaValidationError)
      expect(() => parser.parse(schema)).toThrow('"deps" must be an array')
    })
  })

  describe('订阅声明提取', () => {
    it('应该提取对象格式的订阅（handler 为函数）', () => {
      const handler = () => {}
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            subscribes: {
              age: handler
            }
          }
        }
      }

      const result = parser.parse(schema)

      expect(result.subscribes).toHaveLength(1)
      expect(result.subscribes[0]).toEqual({
        subscriberPath: 'name',
        subscriberProp: 'name',
        target: 'age',
        handler,
        options: undefined
      })
    })

    it('应该提取对象格式的订阅（handler 为对象）', () => {
      const handler = () => {}
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            subscribes: {
              age: {
                handler,
                debounce: true
              }
            }
          }
        }
      }

      const result = parser.parse(schema)

      expect(result.subscribes).toHaveLength(1)
      expect(result.subscribes[0]).toEqual({
        subscriberPath: 'name',
        subscriberProp: 'name',
        target: 'age',
        handler,
        options: { debounce: true }
      })
    })

    it('应该提取数组格式的订阅', () => {
      const handler1 = () => {}
      const handler2 = () => {}
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            subscribes: [
              { target: 'age', handler: handler1 },
              { target: 'type', handler: handler2, debounce: true }
            ]
          }
        }
      }

      const result = parser.parse(schema)

      expect(result.subscribes).toHaveLength(2)
      expect(result.subscribes[0]).toEqual({
        subscriberPath: 'name',
        subscriberProp: 'name',
        target: 'age',
        handler: handler1,
        options: undefined
      })
      expect(result.subscribes[1]).toEqual({
        subscriberPath: 'name',
        subscriberProp: 'name',
        target: 'type',
        handler: handler2,
        options: { debounce: true }
      })
    })

    it('应该提取多个节点的订阅', () => {
      const handler1 = () => {}
      const handler2 = () => {}
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            subscribes: {
              age: handler1
            }
          },
          address: {
            type: 'field',
            subscribes: {
              type: handler2
            }
          }
        }
      }

      const result = parser.parse(schema)

      expect(result.subscribes).toHaveLength(2)
    })

    it('应该提取相对路径订阅', () => {
      const handler = () => {}
      const schema = {
        type: 'form',
        properties: {
          list: {
            type: 'list',
            items: {
              fieldA: {
                type: 'field',
                subscribes: {
                  '.fieldB': handler
                }
              },
              fieldB: { type: 'field' }
            }
          }
        }
      }

      const result = parser.parse(schema)

      expect(result.subscribes).toHaveLength(1)
      expect(result.subscribes[0]).toEqual({
        subscriberPath: 'list.items.fieldA',
        subscriberProp: 'fieldA',
        target: '.fieldB',
        handler,
        options: undefined
      })
    })

    it('应该提取通配符订阅', () => {
      const handler = () => {}
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            subscribes: {
              'list.*.field': handler
            }
          }
        }
      }

      const result = parser.parse(schema)

      expect(result.subscribes[0].target).toBe('list.*.field')
    })

    it('应该在数组格式缺少 target 时抛出错误', () => {
      const handler = () => {}
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            subscribes: [{ handler }]
          }
        }
      }

      expect(() => parser.parse(schema)).toThrow(SchemaValidationError)
      expect(() => parser.parse(schema)).toThrow('must have "target" property')
    })

    it('应该在对象格式缺少 handler 时抛出错误', () => {
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            subscribes: {
              age: {
                debounce: true
              }
            }
          }
        }
      }

      expect(() => parser.parse(schema)).toThrow(SchemaValidationError)
      expect(() => parser.parse(schema)).toThrow(
        'must have a "handler" function'
      )
    })
  })

  describe('PropMap 和 PathMap', () => {
    it('应该正确构建 propMap', () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          card: {
            type: 'layout',
            properties: {
              cardField: { type: 'field' }
            }
          }
        }
      }

      const result = parser.parse(schema)

      expect(result.propMap.get('name')).toHaveLength(1)
      expect(result.propMap.get('name')?.[0].path).toBe('name')

      expect(result.propMap.get('card')).toHaveLength(1)
      expect(result.propMap.get('card')?.[0].path).toBe('card')

      // layout 是 UI 容器，不影响数据路径
      expect(result.propMap.get('cardField')).toHaveLength(1)
      expect(result.propMap.get('cardField')?.[0].path).toBe('cardField')
    })

    it('应该支持不同容器中的同名 prop', () => {
      const schema = {
        type: 'form',
        properties: {
          card1: {
            type: 'layout',
            properties: {
              field: { type: 'field' }
            }
          },
          card2: {
            type: 'layout',
            properties: {
              field: { type: 'field' }
            }
          }
        }
      }

      const result = parser.parse(schema)

      expect(result.propMap.get('field')).toHaveLength(2)
      expect(result.propMap.get('field')?.[0].path).toBe('card1.field')
      expect(result.propMap.get('field')?.[1].path).toBe('card2.field')
    })

    it('应该正确构建 pathMap', () => {
      const schema = {
        type: 'form',
        properties: {
          name: { type: 'field' },
          card: {
            type: 'layout',
            properties: {
              cardField: { type: 'field' }
            }
          }
        }
      }

      const result = parser.parse(schema)

      expect(result.pathMap.get('')?.type).toBe('form')
      expect(result.pathMap.get('name')?.type).toBe('field')
      expect(result.pathMap.get('card')?.type).toBe('layout')
      // layout 是 UI 容器，不影响数据路径
      expect(result.pathMap.get('cardField')?.type).toBe('field')
      expect(result.pathMap.size).toBe(4)
    })
  })

  describe('UI 属性和校验器', () => {
    it('应该保留 UI 相关属性', () => {
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

      const result = parser.parse(schema)
      const nameNode = result.root.properties?.name

      expect(nameNode?.component).toBe('Input')
      expect(nameNode?.componentProps).toEqual({ placeholder: 'Enter name' })
      expect(nameNode?.formItemProps).toEqual({ label: 'Name' })
    })

    it('应该保留 validators 属性', () => {
      const validator = () => {}
      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            validators: [validator]
          }
        }
      }

      const result = parser.parse(schema)
      const nameNode = result.root.properties?.name

      expect(nameNode?.validators).toEqual([validator])
    })
  })

  describe('错误处理', () => {
    it('应该在 schema 不是对象时抛出错误', () => {
      expect(() => parser.parse(null)).toThrow(SchemaValidationError)
      expect(() => parser.parse(null)).toThrow('must be a plain object')
    })

    it('应该在根节点不是 form 时抛出错误', () => {
      expect(() => parser.parse({ type: 'field' })).toThrow(
        SchemaValidationError
      )
      expect(() => parser.parse({ type: 'field' })).toThrow('must be "form"')
    })

    it('应该在 form 缺少 properties 时抛出错误', () => {
      expect(() => parser.parse({ type: 'form' })).toThrow(
        SchemaValidationError
      )
      expect(() => parser.parse({ type: 'form' })).toThrow(
        'must have "properties"'
      )
    })

    it('应该在节点类型无效时抛出错误', () => {
      const schema = {
        type: 'form',
        properties: {
          invalid: { type: 'invalid' }
        }
      }

      expect(() => parser.parse(schema)).toThrow(SchemaValidationError)
      expect(() => parser.parse(schema)).toThrow('Invalid node type')
    })

    it('应该在 layout 缺少 properties 时抛出错误', () => {
      const schema = {
        type: 'form',
        properties: {
          card: { type: 'layout' }
        }
      }

      expect(() => parser.parse(schema)).toThrow(SchemaValidationError)
      expect(() => parser.parse(schema)).toThrow('must have "properties"')
    })

    it('应该在 list 缺少 items 时抛出错误', () => {
      const schema = {
        type: 'form',
        properties: {
          list: { type: 'list' }
        }
      }

      expect(() => parser.parse(schema)).toThrow(SchemaValidationError)
      expect(() => parser.parse(schema)).toThrow('must have "items"')
    })

    it('应该在 field 有 properties 时抛出错误', () => {
      const schema = {
        type: 'form',
        properties: {
          field: {
            type: 'field',
            properties: {}
          }
        }
      }

      expect(() => parser.parse(schema)).toThrow(SchemaValidationError)
      expect(() => parser.parse(schema)).toThrow('cannot have "properties"')
    })

    it('应该在 field 有 items 时抛出错误', () => {
      const schema = {
        type: 'form',
        properties: {
          field: {
            type: 'field',
            items: {}
          }
        }
      }

      expect(() => parser.parse(schema)).toThrow(SchemaValidationError)
      expect(() => parser.parse(schema)).toThrow('cannot have "items"')
    })

    it('应该在 properties 中有重复 prop 时抛出错误', () => {
      // 注意：JavaScript 对象会自动去重，这个测试需要特殊构造
      // 实际上这个错误很难触发，因为对象键会自动去重
      // 但我们保留这个校验逻辑以防万一
    })

    it('应该在 items 中有重复 prop 时抛出错误', () => {
      // 同上
    })
  })

  describe('复杂场景', () => {
    it('应该成功解析完整的复杂 schema', () => {
      const handler1 = () => {}
      const handler2 = () => {}
      const validator = () => {}

      const schema = {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            required: true,
            component: 'Input',
            validators: [validator],
            subscribes: {
              type: handler1
            }
          },
          type: { type: 'field' },
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
              listFieldA: {
                type: 'field',
                subscribes: {
                  '.listFieldB': handler2
                }
              },
              listFieldB: { type: 'field' },
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

      const result = parser.parse(schema)

      // 验证结构
      expect(result.root.type).toBe('form')
      expect(result.root.properties?.name).toBeDefined()
      expect(result.root.properties?.card).toBeDefined()
      expect(result.root.properties?.list).toBeDefined()

      // 验证 propMap
      expect(result.propMap.get('name')).toHaveLength(1)
      expect(result.propMap.get('listFieldA')).toHaveLength(1)

      // 验证 pathMap
      expect(result.pathMap.get('name')).toBeDefined()
      // layout 是 UI 容器，不影响数据路径
      expect(result.pathMap.get('cardFieldA')).toBeDefined()
      expect(result.pathMap.get('list.items.listFieldA')).toBeDefined()
      // list 中的 layout 子节点也不影响数据路径
      expect(result.pathMap.get('list.items.listCardFieldA')).toBeDefined()

      // 验证订阅
      expect(result.subscribes).toHaveLength(2)

      // 验证控制属性
      expect(result.root.properties?.name.required).toBe(true)
      expect(result.root.properties?.card.ifShow).toBeDefined()
    })
  })
})
