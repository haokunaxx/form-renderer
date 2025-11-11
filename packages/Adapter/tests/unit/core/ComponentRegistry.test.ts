import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent } from 'vue'
import {
  ComponentRegistry,
  createComponentRegistry
} from '../../../src/core/ComponentRegistry'
import type { ComponentDefinition, ComponentPreset } from '../../../src/types'

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry

  beforeEach(() => {
    registry = new ComponentRegistry()
  })

  describe('register', () => {
    it('应该成功注册一个组件', () => {
      const definition: ComponentDefinition = {
        name: 'Input',
        component: defineComponent({}),
        type: 'field'
      }

      registry.register(definition)

      expect(registry.has('Input')).toBe(true)
      expect(registry.get('Input')).toEqual(definition)
    })

    it('应该在缺少name时抛出错误', () => {
      const definition = {
        component: defineComponent({}),
        type: 'field'
      } as any

      expect(() => registry.register(definition)).toThrow(
        'Component definition must have a name'
      )
    })

    it('应该在缺少component时抛出错误', () => {
      const definition = {
        name: 'Input',
        type: 'field'
      } as any

      expect(() => registry.register(definition)).toThrow(
        'Component "Input" must have a component'
      )
    })

    it('应该在缺少type时抛出错误', () => {
      const definition = {
        name: 'Input',
        component: defineComponent({})
      } as any

      expect(() => registry.register(definition)).toThrow(
        'Component "Input" must have a type'
      )
    })

    it('应该在type无效时抛出错误', () => {
      const definition = {
        name: 'Input',
        component: defineComponent({}),
        type: 'invalid'
      } as any

      expect(() => registry.register(definition)).toThrow(
        'Component "Input" has invalid type "invalid"'
      )
    })

    it('应该允许覆盖已存在的组件', () => {
      const definition1: ComponentDefinition = {
        name: 'Input',
        component: defineComponent({ name: 'Input1' }),
        type: 'field'
      }

      const definition2: ComponentDefinition = {
        name: 'Input',
        component: defineComponent({ name: 'Input2' }),
        type: 'field'
      }

      registry.register(definition1)
      registry.register(definition2)

      expect(registry.get('Input')).toEqual(definition2)
    })
  })

  describe('registerBatch', () => {
    it('应该成功批量注册组件', () => {
      const definitions: ComponentDefinition[] = [
        {
          name: 'Input',
          component: defineComponent({}),
          type: 'field'
        },
        {
          name: 'Select',
          component: defineComponent({}),
          type: 'field'
        },
        {
          name: 'Card',
          component: defineComponent({}),
          type: 'layout'
        }
      ]

      registry.registerBatch(definitions)

      expect(registry.has('Input')).toBe(true)
      expect(registry.has('Select')).toBe(true)
      expect(registry.has('Card')).toBe(true)
    })

    it('应该跳过无效的组件定义', () => {
      const definitions: any[] = [
        {
          name: 'Input',
          component: defineComponent({}),
          type: 'field'
        },
        {
          name: 'Invalid',
          component: defineComponent({})
          // 缺少 type
        }
      ]

      expect(() => registry.registerBatch(definitions)).toThrow()
      expect(registry.has('Input')).toBe(true)
      expect(registry.has('Invalid')).toBe(false)
    })
  })

  describe('get', () => {
    it('应该返回已注册的组件定义', () => {
      const definition: ComponentDefinition = {
        name: 'Input',
        component: defineComponent({}),
        type: 'field'
      }

      registry.register(definition)

      expect(registry.get('Input')).toEqual(definition)
    })

    it('应该在组件不存在时返回undefined', () => {
      expect(registry.get('NonExistent')).toBeUndefined()
    })
  })

  describe('has', () => {
    it('应该在组件存在时返回true', () => {
      const definition: ComponentDefinition = {
        name: 'Input',
        component: defineComponent({}),
        type: 'field'
      }

      registry.register(definition)

      expect(registry.has('Input')).toBe(true)
    })

    it('应该在组件不存在时返回false', () => {
      expect(registry.has('NonExistent')).toBe(false)
    })
  })

  describe('getByType', () => {
    it('应该返回指定类型的所有组件', () => {
      const definitions: ComponentDefinition[] = [
        {
          name: 'Input',
          component: defineComponent({}),
          type: 'field'
        },
        {
          name: 'Select',
          component: defineComponent({}),
          type: 'field'
        },
        {
          name: 'Card',
          component: defineComponent({}),
          type: 'layout'
        },
        {
          name: 'List',
          component: defineComponent({}),
          type: 'list'
        }
      ]

      registry.registerBatch(definitions)

      const fieldComponents = registry.getByType('field')
      expect(fieldComponents).toHaveLength(2)
      expect(fieldComponents.map((c) => c.name)).toEqual(['Input', 'Select'])

      const layoutComponents = registry.getByType('layout')
      expect(layoutComponents).toHaveLength(1)
      expect(layoutComponents[0].name).toBe('Card')
    })

    it('应该在没有匹配类型时返回空数组', () => {
      const formComponents = registry.getByType('form')
      expect(formComponents).toEqual([])
    })
  })

  describe('registerPreset', () => {
    it('应该注册预设中的所有组件', () => {
      const preset: ComponentPreset = {
        name: 'test-preset',
        components: [
          {
            name: 'Input',
            component: defineComponent({}),
            type: 'field'
          },
          {
            name: 'Select',
            component: defineComponent({}),
            type: 'field'
          }
        ]
      }

      registry.registerPreset(preset)

      expect(registry.has('Input')).toBe(true)
      expect(registry.has('Select')).toBe(true)
    })

    it('应该执行预设的setup函数', () => {
      let setupCalled = false

      const preset: ComponentPreset = {
        name: 'test-preset',
        components: [],
        setup: () => {
          setupCalled = true
        }
      }

      registry.registerPreset(preset)

      expect(setupCalled).toBe(true)
    })
  })

  describe('getRegisteredNames', () => {
    it('应该返回所有已注册组件的名称', () => {
      const definitions: ComponentDefinition[] = [
        {
          name: 'Input',
          component: defineComponent({}),
          type: 'field'
        },
        {
          name: 'Select',
          component: defineComponent({}),
          type: 'field'
        }
      ]

      registry.registerBatch(definitions)

      const names = registry.getRegisteredNames()
      expect(names).toContain('Input')
      expect(names).toContain('Select')
      expect(names).toHaveLength(2)
    })
  })

  describe('getAll', () => {
    it('应该返回所有已注册的组件定义', () => {
      const definitions: ComponentDefinition[] = [
        {
          name: 'Input',
          component: defineComponent({}),
          type: 'field'
        },
        {
          name: 'Select',
          component: defineComponent({}),
          type: 'field'
        }
      ]

      registry.registerBatch(definitions)

      const all = registry.getAll()
      expect(all).toHaveLength(2)
      expect(all.map((c) => c.name)).toContain('Input')
      expect(all.map((c) => c.name)).toContain('Select')
    })
  })

  describe('clear', () => {
    it('应该清空所有已注册的组件', () => {
      const definition: ComponentDefinition = {
        name: 'Input',
        component: defineComponent({}),
        type: 'field'
      }

      registry.register(definition)
      expect(registry.has('Input')).toBe(true)

      registry.clear()
      expect(registry.has('Input')).toBe(false)
      expect(registry.getRegisteredNames()).toHaveLength(0)
    })
  })

  describe('unregister', () => {
    it('应该成功注销指定组件', () => {
      const definition: ComponentDefinition = {
        name: 'Input',
        component: defineComponent({}),
        type: 'field'
      }

      registry.register(definition)
      expect(registry.has('Input')).toBe(true)

      const result = registry.unregister('Input')
      expect(result).toBe(true)
      expect(registry.has('Input')).toBe(false)
    })

    it('应该在组件不存在时返回false', () => {
      const result = registry.unregister('NonExistent')
      expect(result).toBe(false)
    })
  })

  describe('clone', () => {
    it('应该创建注册表的独立副本', () => {
      const definition: ComponentDefinition = {
        name: 'Input',
        component: defineComponent({}),
        type: 'field'
      }

      registry.register(definition)

      const cloned = registry.clone()

      expect(cloned.has('Input')).toBe(true)
      expect(cloned.get('Input')).toEqual(definition)

      // 修改原注册表不应影响克隆
      registry.unregister('Input')
      expect(registry.has('Input')).toBe(false)
      expect(cloned.has('Input')).toBe(true)
    })
  })

  describe('merge', () => {
    it('应该合并另一个注册表的组件', () => {
      const other = new ComponentRegistry()

      registry.register({
        name: 'Input',
        component: defineComponent({}),
        type: 'field'
      })

      other.register({
        name: 'Select',
        component: defineComponent({}),
        type: 'field'
      })

      registry.merge(other)

      expect(registry.has('Input')).toBe(true)
      expect(registry.has('Select')).toBe(true)
    })

    it('应该在不覆盖时保留已有组件', () => {
      const other = new ComponentRegistry()

      const input1 = defineComponent({ name: 'Input1' })
      const input2 = defineComponent({ name: 'Input2' })

      registry.register({
        name: 'Input',
        component: input1,
        type: 'field'
      })

      other.register({
        name: 'Input',
        component: input2,
        type: 'field'
      })

      registry.merge(other, false)

      expect(registry.get('Input')?.component).toBe(input1)
    })

    it('应该在覆盖时替换已有组件', () => {
      const other = new ComponentRegistry()

      const input1 = defineComponent({ name: 'Input1' })
      const input2 = defineComponent({ name: 'Input2' })

      registry.register({
        name: 'Input',
        component: input1,
        type: 'field'
      })

      other.register({
        name: 'Input',
        component: input2,
        type: 'field'
      })

      registry.merge(other, true)

      expect(registry.get('Input')?.component).toBe(input2)
    })
  })

  describe('getStats', () => {
    it('应该返回注册表统计信息', () => {
      const definitions: ComponentDefinition[] = [
        {
          name: 'Input',
          component: defineComponent({}),
          type: 'field'
        },
        {
          name: 'Select',
          component: defineComponent({}),
          type: 'field'
        },
        {
          name: 'Card',
          component: defineComponent({}),
          type: 'layout'
        },
        {
          name: 'List',
          component: defineComponent({}),
          type: 'list'
        }
      ]

      registry.registerBatch(definitions)

      const stats = registry.getStats()

      expect(stats.total).toBe(4)
      expect(stats.byType.field).toBe(2)
      expect(stats.byType.layout).toBe(1)
      expect(stats.byType.list).toBe(1)
      expect(stats.byType.form).toBe(0)
    })
  })

  describe('createComponentRegistry', () => {
    it('应该创建一个新的ComponentRegistry实例', () => {
      const registry = createComponentRegistry()
      expect(registry).toBeInstanceOf(ComponentRegistry)
    })
  })
})
