/**
 * Ant Design 值转换器
 */

import dayjs, { type Dayjs } from 'dayjs'
import type { ValueTransformer } from '@form-renderer/adapter-react'

/**
 * DatePicker 值转换器
 * 引擎值：string (ISO 8601) ↔ 组件值：Dayjs
 */
export const dateTransformer: ValueTransformer<string, Dayjs | null> = {
  toComponent: (engineValue: string) => {
    return engineValue ? dayjs(engineValue) : null
  },
  fromComponent: (componentValue: Dayjs | null) => {
    return componentValue ? componentValue.toISOString() : ''
  }
}

/**
 * DatePicker.RangePicker 值转换器
 * 引擎值：[string, string] ↔ 组件值：[Dayjs, Dayjs]
 */
export const dateRangeTransformer: ValueTransformer<
  [string, string] | null,
  [Dayjs, Dayjs] | null
> = {
  toComponent: (engineValue: [string, string] | null) => {
    if (!engineValue || !Array.isArray(engineValue)) return null
    return [dayjs(engineValue[0]), dayjs(engineValue[1])]
  },
  fromComponent: (componentValue: [Dayjs, Dayjs] | null) => {
    if (!componentValue || !Array.isArray(componentValue)) return null
    return [componentValue[0].toISOString(), componentValue[1].toISOString()]
  }
}

/**
 * TimePicker 值转换器
 * 引擎值：string (ISO 8601 或 HH:mm:ss) ↔ 组件值：Dayjs
 */
export const timeTransformer: ValueTransformer<string, Dayjs | null> = {
  toComponent: (engineValue: string) => {
    if (!engineValue) return null
    // 支持完整的 ISO 8601 或简单的时间格式 HH:mm:ss
    return dayjs(engineValue, ['HH:mm:ss', 'HH:mm', undefined])
  },
  fromComponent: (componentValue: Dayjs | null) => {
    return componentValue ? componentValue.format('HH:mm:ss') : ''
  }
}

/**
 * InputNumber 值转换器
 * 处理空值和非数字值
 */
export const numberTransformer: ValueTransformer<
  number | undefined,
  number | null
> = {
  toComponent: (engineValue: number | undefined) => {
    return engineValue ?? null
  },
  fromComponent: (componentValue: number | null) => {
    return componentValue ?? undefined
  }
}

/**
 * Checkbox 值转换器
 * 引擎值：boolean ↔ 组件值：boolean
 */
export const booleanTransformer: ValueTransformer<boolean, boolean> = {
  toComponent: (engineValue: boolean) => {
    return Boolean(engineValue)
  },
  fromComponent: (componentValue: boolean) => {
    return Boolean(componentValue)
  }
}

/**
 * 多选值转换器（CheckboxGroup、Select multiple 等）
 * 引擎值：any[] ↔ 组件值：any[]
 */
export const arrayTransformer: ValueTransformer<any[], any[]> = {
  toComponent: (engineValue: any[]) => {
    return Array.isArray(engineValue) ? engineValue : []
  },
  fromComponent: (componentValue: any[]) => {
    return Array.isArray(componentValue) && componentValue.length > 0
      ? componentValue
      : []
  }
}
