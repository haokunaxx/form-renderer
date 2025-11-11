/**
 * 事件映射配置
 *
 * 用途：统一不同 UI 框架的核心事件名称差异
 *
 * 核心事件（会通过 EventHandler 通知 Engine）：
 * - onChange: 值变化事件，会更新 model
 * - onInput: 输入事件，只更新显示值
 * - onFocus: 聚焦事件
 * - onBlur: 失焦事件
 *
 * 其他事件（如 onKeydown、onKeyup）：
 * - 这些事件映射主要用于文档说明
 * - 实际使用时，应通过 Schema 的 componentProps 直接定义处理器
 * - 例如：{ componentProps: { onKeydown: (e) => {...} } }
 */

export interface EventMapping {
  [engineEvent: string]: string | string[]
}

/**
 * 通用字段组件事件映射
 */
export const commonFieldEventMapping: EventMapping = {
  onChange: 'change',
  onFocus: 'focus',
  onBlur: 'blur',
  onClear: 'clear'
}

/**
 * 输入框组件事件映射
 */
export const inputEventMapping: EventMapping = {
  ...commonFieldEventMapping,
  onInput: 'input',
  onKeydown: 'keydown',
  onKeyup: 'keyup',
  onEnter: 'keydown.enter'
}

/**
 * 数字输入框事件映射
 */
export const numberEventMapping: EventMapping = {
  ...commonFieldEventMapping,
  onInput: 'input'
}

/**
 * 开关组件事件映射
 */
export const switchEventMapping: EventMapping = {
  onChange: 'update:modelValue'
}

/**
 * 选择组件事件映射（单选、多选、下拉）
 */
export const selectEventMapping: EventMapping = {
  ...commonFieldEventMapping,
  onVisibleChange: 'visible-change',
  onRemoveTag: 'remove-tag'
}

/**
 * 日期选择器事件映射
 */
export const datePickerEventMapping: EventMapping = {
  ...commonFieldEventMapping,
  onCalendarChange: 'calendar-change',
  onPanelChange: 'panel-change',
  onVisibleChange: 'visible-change'
}

/**
 * 表单容器事件映射
 */
export const formEventMapping: EventMapping = {
  onValidate: 'validate',
  onSubmit: 'submit',
  onReset: 'reset'
}

/**
 * 列表容器事件映射
 */
export const listEventMapping: EventMapping = {
  onChange: 'update:modelValue',
  onAdd: 'add',
  onRemove: 'remove',
  onSort: 'sort',
  onMove: 'move'
}

/**
 * 布局容器事件映射
 */
export const layoutEventMapping: EventMapping = {
  onChange: 'change',
  onTabChange: 'tab-change',
  onCollapseChange: 'change'
}

/**
 * 级联选择器事件映射
 */
export const cascaderEventMapping: EventMapping = {
  ...commonFieldEventMapping,
  onVisibleChange: 'visible-change',
  onExpandChange: 'expand-change'
}

/**
 * 滑块事件映射
 */
export const sliderEventMapping: EventMapping = {
  onChange: 'change',
  onInput: 'input'
}

/**
 * 评分事件映射
 */
export const rateEventMapping: EventMapping = {
  onChange: 'update:modelValue'
}

/**
 * 颜色选择器事件映射
 */
export const colorPickerEventMapping: EventMapping = {
  onChange: 'update:modelValue',
  onActiveChange: 'active-change'
}

/**
 * 文件上传事件映射
 */
export const uploadEventMapping: EventMapping = {
  onChange: 'change',
  onPreview: 'preview',
  onRemove: 'remove',
  onSuccess: 'success',
  onError: 'error',
  onProgress: 'progress',
  onExceed: 'exceed'
}

/**
 * 根据组件类型获取默认事件映射
 */
export function getDefaultEventMapping(componentType: string): EventMapping {
  const mappings: Record<string, EventMapping> = {
    input: inputEventMapping,
    textarea: inputEventMapping,
    number: numberEventMapping,
    switch: switchEventMapping,
    'checkbox-group': selectEventMapping,
    'radio-group': selectEventMapping,
    select: selectEventMapping,
    'date-picker': datePickerEventMapping,
    'time-picker': datePickerEventMapping,
    'datetime-picker': datePickerEventMapping,
    cascader: cascaderEventMapping,
    slider: sliderEventMapping,
    rate: rateEventMapping,
    'color-picker': colorPickerEventMapping,
    upload: uploadEventMapping,
    form: formEventMapping,
    layout: layoutEventMapping,
    list: listEventMapping
  }
  return mappings[componentType] || commonFieldEventMapping
}

/**
 * 创建自定义事件映射
 */
export function createEventMapping(
  baseMapping: EventMapping,
  customMapping: Partial<EventMapping>
): EventMapping {
  const result: EventMapping = {}

  // 复制基础映射
  Object.entries(baseMapping).forEach(([key, value]) => {
    result[key] = value
  })

  // 复制自定义映射，覆盖基础映射
  Object.entries(customMapping).forEach(([key, value]) => {
    if (value !== undefined) {
      result[key] = value
    }
  })

  return result
}

/**
 * 事件映射工具函数
 */
export const EventMappingUtils = {
  /**
   * 合并多个事件映射
   */
  merge: (...mappings: EventMapping[]): EventMapping => {
    const result: EventMapping = {}
    mappings.forEach((mapping) => {
      Object.entries(mapping).forEach(([key, value]) => {
        result[key] = value
      })
    })
    return result
  },

  /**
   * 过滤事件映射
   */
  filter: (
    mapping: EventMapping,
    predicate: (key: string, value: string | string[]) => boolean
  ): EventMapping => {
    const result: EventMapping = {}
    Object.entries(mapping).forEach(([key, value]) => {
      if (predicate(key, value)) {
        result[key] = value
      }
    })
    return result
  },

  /**
   * 转换事件映射
   */
  transform: (
    mapping: EventMapping,
    transformer: (
      key: string,
      value: string | string[]
    ) => [string, string | string[]]
  ): EventMapping => {
    const transformed: EventMapping = {}
    Object.entries(mapping).forEach(([key, value]) => {
      const [newKey, newValue] = transformer(key, value)
      transformed[newKey] = newValue
    })
    return transformed
  }
}
