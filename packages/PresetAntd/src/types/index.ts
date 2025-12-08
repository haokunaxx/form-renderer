/**
 * Ant Design 预设类型定义
 */

import type { Dayjs } from 'dayjs'

/**
 * Select 选项
 */
export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  [key: string]: any
}

/**
 * Cascader 选项
 */
export interface CascaderOption {
  label: string
  value: string | number
  children?: CascaderOption[]
  disabled?: boolean
  [key: string]: any
}

/**
 * 日期类型
 */
export type DateValue = Dayjs | null

/**
 * 日期范围类型
 */
export type DateRangeValue = [Dayjs | null, Dayjs | null] | null
