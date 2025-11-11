/**
 * 值转换器
 * 处理引擎值与组件值之间的转换
 */

import type { ValueTransformer } from '@form-renderer/adapter-vue3'

/**
 * 字符串值转换器
 */
export const stringTransformer: ValueTransformer<any, string> = {
  toComponent: (engineValue: any): string => {
    if (engineValue === null || engineValue === undefined) {
      return ''
    }
    return String(engineValue)
  },
  fromComponent: (componentValue: string): any => {
    return componentValue
  }
}

/**
 * 数字值转换器
 */
export const numberTransformer: ValueTransformer<any, number | undefined> = {
  toComponent: (engineValue: any): number | undefined => {
    if (
      engineValue === null ||
      engineValue === undefined ||
      engineValue === ''
    ) {
      return undefined
    }
    const num = Number(engineValue)
    return isNaN(num) ? undefined : num
  },
  fromComponent: (componentValue: number | undefined): any => {
    return componentValue
  }
}

/**
 * 布尔值转换器
 */
export const booleanTransformer: ValueTransformer<any, boolean> = {
  toComponent: (engineValue: any): boolean => {
    if (typeof engineValue === 'boolean') {
      return engineValue
    }
    if (typeof engineValue === 'string') {
      return engineValue === 'true' || engineValue === '1'
    }
    if (typeof engineValue === 'number') {
      return engineValue !== 0
    }
    return Boolean(engineValue)
  },
  fromComponent: (componentValue: boolean): any => {
    return componentValue
  }
}

/**
 * 数组值转换器
 */
export const arrayTransformer: ValueTransformer<any, any[]> = {
  toComponent: (engineValue: any): any[] => {
    if (Array.isArray(engineValue)) {
      return engineValue
    }
    if (engineValue === null || engineValue === undefined) {
      return []
    }
    // 尝试解析字符串
    if (typeof engineValue === 'string') {
      try {
        const parsed = JSON.parse(engineValue)
        return Array.isArray(parsed) ? parsed : [engineValue]
      } catch {
        return [engineValue]
      }
    }
    return [engineValue]
  },
  fromComponent: (componentValue: any[]): any => {
    return componentValue
  }
}

/**
 * 日期值转换器
 */
export const dateTransformer: ValueTransformer<any, Date | string | null> = {
  toComponent: (engineValue: any): Date | string | null => {
    if (
      engineValue === null ||
      engineValue === undefined ||
      engineValue === ''
    ) {
      return null
    }
    if (engineValue instanceof Date) {
      return engineValue
    }
    if (typeof engineValue === 'string') {
      const date = new Date(engineValue)
      return isNaN(date.getTime()) ? null : engineValue
    }
    if (typeof engineValue === 'number') {
      return new Date(engineValue)
    }
    return null
  },
  fromComponent: (componentValue: Date | string | null): any => {
    if (componentValue === null || componentValue === undefined) {
      return null
    }
    if (componentValue instanceof Date) {
      return componentValue.toISOString().split('T')[0] // YYYY-MM-DD 格式
    }
    return componentValue
  }
}

/**
 * 选择器选项值转换器
 */
export const selectTransformer: ValueTransformer<any, any> = {
  toComponent: (engineValue: any): any => {
    return engineValue
  },
  fromComponent: (componentValue: any): any => {
    return componentValue ?? ''
  }
}

/**
 * 多选值转换器
 */
export const multiSelectTransformer: ValueTransformer<any, any[]> = {
  toComponent: (engineValue: any): any[] => {
    if (Array.isArray(engineValue)) {
      return engineValue
    }
    if (
      engineValue === null ||
      engineValue === undefined ||
      engineValue === ''
    ) {
      return []
    }
    return [engineValue]
  },
  fromComponent: (componentValue: any[]): any => {
    return componentValue
  }
}

/**
 * 对象值转换器（用于复杂表单）
 */
export const objectTransformer: ValueTransformer<any, Record<string, any>> = {
  toComponent: (engineValue: any): Record<string, any> => {
    if (typeof engineValue === 'object' && engineValue !== null) {
      return engineValue
    }
    if (typeof engineValue === 'string') {
      try {
        const parsed = JSON.parse(engineValue)
        return typeof parsed === 'object' && parsed !== null ? parsed : {}
      } catch {
        return {}
      }
    }
    return {}
  },
  fromComponent: (componentValue: Record<string, any>): any => {
    return componentValue
  }
}

/**
 * 文件数组值转换器
 */
export const fileArrayTransformer: ValueTransformer<any, any[]> = {
  toComponent: (engineValue: any): any[] => {
    if (Array.isArray(engineValue)) {
      return engineValue
    }
    if (engineValue === null || engineValue === undefined) {
      return []
    }
    return [engineValue]
  },
  fromComponent: (componentValue: any[]): any => {
    return componentValue
  }
}

/**
 * 根据组件类型获取默认转换器
 */
export function getDefaultTransformer(
  componentType: string
): ValueTransformer | undefined {
  const transformerMap: Record<string, ValueTransformer> = {
    input: stringTransformer,
    textarea: stringTransformer,
    number: numberTransformer,
    switch: booleanTransformer,
    'checkbox-group': multiSelectTransformer,
    'radio-group': selectTransformer,
    select: selectTransformer,
    'date-picker': dateTransformer,
    'time-picker': dateTransformer,
    cascader: arrayTransformer,
    slider: numberTransformer,
    rate: numberTransformer,
    'color-picker': stringTransformer,
    upload: fileArrayTransformer
  }

  return transformerMap[componentType]
}

/**
 * 导出所有转换器
 */
export const valueTransformers = {
  string: stringTransformer,
  number: numberTransformer,
  boolean: booleanTransformer,
  array: arrayTransformer,
  date: dateTransformer,
  select: selectTransformer,
  multiSelect: multiSelectTransformer,
  object: objectTransformer,
  fileArray: fileArrayTransformer
}
