import { describe, it, expect } from 'vitest'
import { defineComponent } from 'vue'
import {
  normalizeComponent,
  normalizeComponents,
  defineFieldComponent,
  defineLayoutComponent,
  defineListComponent,
  mergeComponentDefinition,
  wrapWithCommonProps
} from '../../../src/core/ComponentNormalizer'
import type { ComponentDefinition } from '../../../src/types'

describe('ComponentNormalizer', () => {
  describe('normalizeComponent', () => {
    it('应该使用默认值标准化组件定义', () => {
      const component = defineComponent({})

      const result = normalizeComponent({
        name: 'Input',
        component
      })

      expect(result.name).toBe('Input')
      expect(result.component).toBe(component)
      expect(result.type).toBe('field')
      expect(result.needFormItem).toBe(true)
      expect(result.defaultProps).toEqual({})
      expect(result.eventMapping?.onChange).toBe('update:modelValue')
    })

    it('应该正确设置自定义类型', () => {
      const component = defineComponent({})

      const result = normalizeComponent({
        name: 'Card',
        component,
        type: 'layout'
      })

      expect(result.type).toBe('layout')
      expect(result.needFormItem).toBe(false)
    })

    it('应该合并事件映射', () => {
      const component = defineComponent({})

      const result = normalizeComponent({
        name: 'Input',
        component,
        eventMapping: {
          onFocus: 'custom-focus',
          onBlur: 'custom-blur'
        }
      })

      expect(result.eventMapping).toEqual({
        onChange: 'update:modelValue',
        onFocus: 'custom-focus',
        onBlur: 'custom-blur'
      })
    })

    it('应该在缺少name时抛出错误', () => {
      const component = defineComponent({})

      expect(() =>
        normalizeComponent({
          name: '',
          component
        })
      ).toThrow('Component name and component are required')
    })

    it('应该在缺少component时抛出错误', () => {
      expect(() =>
        normalizeComponent({
          name: 'Input',
          component: null as any
        })
      ).toThrow('Component name and component are required')
    })

    it('应该保留自定义属性', () => {
      const component = defineComponent({})

      const result = normalizeComponent({
        name: 'Input',
        component,
        defaultProps: {
          placeholder: '请输入',
          clearable: true
        }
      })

      expect(result.defaultProps).toEqual({
        placeholder: '请输入',
        clearable: true
      })
    })

    it('应该保留值转换器', () => {
      const component = defineComponent({})

      const transformer = {
        toComponent: (v: any) => String(v),
        fromComponent: (v: any) => Number(v)
      }

      const result = normalizeComponent({
        name: 'Input',
        component,
        valueTransformer: transformer
      })

      expect(result.valueTransformer).toBe(transformer)
    })
  })

  describe('defineFieldComponent', () => {
    it('应该创建字段组件定义', () => {
      const component = defineComponent({})

      const result = defineFieldComponent({
        name: 'Input',
        component
      })

      expect(result.type).toBe('field')
      expect(result.needFormItem).toBe(true)
    })

    it('应该根据valueType自动选择string转换器', () => {
      const component = defineComponent({})

      const result = defineFieldComponent({
        name: 'Input',
        component,
        valueType: 'string'
      })

      expect(result.valueTransformer).toBeDefined()
      expect(result.valueTransformer?.toComponent(null)).toBe('')
      expect(result.valueTransformer?.toComponent('test')).toBe('test')
      expect(result.valueTransformer?.fromComponent('')).toBeUndefined()
      expect(result.valueTransformer?.fromComponent('test')).toBe('test')
    })

    it('应该根据valueType自动选择number转换器', () => {
      const component = defineComponent({})

      const result = defineFieldComponent({
        name: 'InputNumber',
        component,
        valueType: 'number'
      })

      expect(result.valueTransformer).toBeDefined()
      expect(result.valueTransformer?.toComponent(null)).toBe('')
      expect(result.valueTransformer?.toComponent(123)).toBe(123)
      expect(result.valueTransformer?.fromComponent('')).toBeUndefined()
      expect(result.valueTransformer?.fromComponent('123')).toBe(123)
      expect(result.valueTransformer?.fromComponent('abc')).toBeUndefined()
    })

    it('应该根据valueType自动选择boolean转换器', () => {
      const component = defineComponent({})

      const result = defineFieldComponent({
        name: 'Checkbox',
        component,
        valueType: 'boolean'
      })

      expect(result.valueTransformer).toBeDefined()
      expect(result.valueTransformer?.toComponent(true)).toBe(true)
      expect(result.valueTransformer?.toComponent(false)).toBe(false)
      expect(result.valueTransformer?.toComponent(null)).toBe(false)
      expect(result.valueTransformer?.fromComponent(true)).toBe(true)
      expect(result.valueTransformer?.fromComponent(false)).toBe(false)
    })

    it('应该根据valueType自动选择array转换器', () => {
      const component = defineComponent({})

      const result = defineFieldComponent({
        name: 'Select',
        component,
        valueType: 'array'
      })

      expect(result.valueTransformer).toBeDefined()
      expect(result.valueTransformer?.toComponent(null)).toEqual([])
      expect(result.valueTransformer?.toComponent([1, 2])).toEqual([1, 2])
      expect(result.valueTransformer?.fromComponent([])).toBeUndefined()
      expect(result.valueTransformer?.fromComponent([1, 2])).toEqual([1, 2])
    })

    it('应该根据valueType自动选择date转换器', () => {
      const component = defineComponent({})

      const result = defineFieldComponent({
        name: 'DatePicker',
        component,
        valueType: 'date'
      })

      expect(result.valueTransformer).toBeDefined()
      expect(result.valueTransformer?.toComponent(null)).toBe(null)

      const date = new Date('2024-01-01')
      const isoString = date.toISOString()

      expect(result.valueTransformer?.toComponent(isoString)).toEqual(date)
      expect(result.valueTransformer?.fromComponent(date)).toBe(isoString)
      expect(result.valueTransformer?.fromComponent(null)).toBeUndefined()
    })

    it('应该允许自定义转换器覆盖默认转换器', () => {
      const component = defineComponent({})

      const customTransformer = {
        toComponent: (v: any) => `custom-${v}`,
        fromComponent: (v: any) => v?.replace('custom-', '')
      }

      const result = defineFieldComponent({
        name: 'Input',
        component,
        valueType: 'string',
        valueTransformer: customTransformer
      })

      expect(result.valueTransformer).toBe(customTransformer)
      expect(result.valueTransformer?.toComponent('test')).toBe('custom-test')
    })

    it('应该支持custom类型而不设置转换器', () => {
      const component = defineComponent({})

      const result = defineFieldComponent({
        name: 'Custom',
        component,
        valueType: 'custom'
      })

      expect(result.valueTransformer).toBeUndefined()
    })
  })

  describe('defineLayoutComponent', () => {
    it('应该创建布局组件定义', () => {
      const component = defineComponent({})

      const result = defineLayoutComponent({
        name: 'Card',
        component
      })

      expect(result.type).toBe('layout')
      expect(result.needFormItem).toBe(false)
    })

    it('应该保留defaultProps', () => {
      const component = defineComponent({})

      const result = defineLayoutComponent({
        name: 'Card',
        component,
        defaultProps: {
          bordered: true
        }
      })

      expect(result.defaultProps).toEqual({
        bordered: true
      })
    })
  })

  describe('defineListComponent', () => {
    it('应该创建列表组件定义', () => {
      const component = defineComponent({})

      const result = defineListComponent({
        name: 'List',
        component
      })

      expect(result.type).toBe('list')
      expect(result.needFormItem).toBe(false)
    })

    it('应该保留defaultProps', () => {
      const component = defineComponent({})

      const result = defineListComponent({
        name: 'List',
        component,
        defaultProps: {
          bordered: true
        }
      })

      expect(result.defaultProps).toEqual({
        bordered: true
      })
    })
  })

  describe('normalizeComponents', () => {
    it('应该批量标准化组件定义', () => {
      const component1 = defineComponent({ name: 'Input' })
      const component2 = defineComponent({ name: 'Select' })

      const results = normalizeComponents([
        {
          name: 'Input',
          component: component1
        },
        {
          name: 'Select',
          component: component2,
          type: 'field'
        }
      ])

      expect(results).toHaveLength(2)
      expect(results[0].name).toBe('Input')
      expect(results[0].component).toBe(component1)
      expect(results[1].name).toBe('Select')
      expect(results[1].component).toBe(component2)
    })
  })

  describe('mergeComponentDefinition', () => {
    it('应该合并组件定义', () => {
      const component = defineComponent({})

      const base: ComponentDefinition = {
        name: 'Input',
        component,
        type: 'field',
        defaultProps: {
          placeholder: '请输入',
          clearable: true
        }
      }

      const overrides: Partial<ComponentDefinition> = {
        defaultProps: {
          clearable: false,
          size: 'large'
        }
      }

      const result = mergeComponentDefinition(base, overrides)

      expect(result.name).toBe('Input')
      expect(result.defaultProps).toEqual({
        placeholder: '请输入',
        clearable: false,
        size: 'large'
      })
    })

    it('应该合并事件映射', () => {
      const component = defineComponent({})

      const base: ComponentDefinition = {
        name: 'Input',
        component,
        type: 'field',
        eventMapping: {
          onChange: 'update:modelValue',
          onFocus: 'focus'
        }
      }

      const overrides: Partial<ComponentDefinition> = {
        eventMapping: {
          onBlur: 'blur'
        }
      }

      const result = mergeComponentDefinition(base, overrides)

      expect(result.eventMapping).toEqual({
        onChange: 'update:modelValue',
        onFocus: 'focus',
        onBlur: 'blur'
      })
    })
  })

  describe('wrapWithCommonProps', () => {
    it('应该为组件添加通用属性', () => {
      const component = defineComponent({})

      const definition: ComponentDefinition = {
        name: 'Input',
        component,
        type: 'field',
        defaultProps: {
          placeholder: '请输入'
        }
      }

      const commonProps = {
        size: 'default',
        disabled: false
      }

      const result = wrapWithCommonProps(definition, commonProps)

      expect(result.defaultProps).toEqual({
        size: 'default',
        disabled: false,
        placeholder: '请输入'
      })
    })

    it('应该保留组件原有属性优先级高于通用属性', () => {
      const component = defineComponent({})

      const definition: ComponentDefinition = {
        name: 'Input',
        component,
        type: 'field',
        defaultProps: {
          size: 'large',
          placeholder: '请输入'
        }
      }

      const commonProps = {
        size: 'default',
        disabled: false
      }

      const result = wrapWithCommonProps(definition, commonProps)

      expect(result.defaultProps?.size).toBe('large')
      expect(result.defaultProps?.disabled).toBe(false)
      expect(result.defaultProps?.placeholder).toBe('请输入')
    })
  })
})
