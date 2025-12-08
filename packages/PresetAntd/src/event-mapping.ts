/**
 * Ant Design 事件映射
 */

import type { EventMapping } from '@form-renderer/adapter-react'

/**
 * Input 事件映射
 * Ant Design 的 Input 组件 onChange 事件参数是 event 对象
 */
export const inputEventMapping: EventMapping = {
  onChange: (e: any) => e.target.value
}

/**
 * InputNumber 事件映射
 * onChange 直接返回 value
 */
export const inputNumberEventMapping: EventMapping = {
  onChange: (value: any) => value
}

/**
 * Select 事件映射
 * onChange 直接返回 value
 */
export const selectEventMapping: EventMapping = {
  onChange: (value: any) => value
}

/**
 * DatePicker 事件映射
 * onChange 返回 Dayjs 对象或 null
 */
export const datePickerEventMapping: EventMapping = {
  onChange: (date: any) => date
}

/**
 * Switch 事件映射
 * onChange 返回 boolean
 */
export const switchEventMapping: EventMapping = {
  onChange: (checked: boolean) => checked
}

/**
 * Checkbox 事件映射
 * onChange 事件参数是 event 对象
 */
export const checkboxEventMapping: EventMapping = {
  onChange: (e: any) => e.target.checked
}

/**
 * Radio 事件映射
 * onChange 事件参数是 event 对象
 */
export const radioEventMapping: EventMapping = {
  onChange: (e: any) => e.target.value
}

/**
 * CheckboxGroup / RadioGroup 事件映射
 * onChange 直接返回选中的值数组
 */
export const groupEventMapping: EventMapping = {
  onChange: (values: any) => values
}

/**
 * Upload 事件映射
 * onChange 返回 fileList
 */
export const uploadEventMapping: EventMapping = {
  onChange: (info: any) => info.fileList
}

/**
 * Cascader 事件映射
 * onChange 返回选中的值数组
 */
export const cascaderEventMapping: EventMapping = {
  onChange: (value: any) => value
}

/**
 * Slider 事件映射
 * onChange 返回 number 或 [number, number]
 */
export const sliderEventMapping: EventMapping = {
  onChange: (value: any) => value
}

/**
 * Rate 事件映射
 * onChange 返回 number
 */
export const rateEventMapping: EventMapping = {
  onChange: (value: number) => value
}

/**
 * TimePicker 事件映射
 * onChange 返回 Dayjs 对象或 null
 */
export const timePickerEventMapping: EventMapping = {
  onChange: (time: any) => time
}

/**
 * ColorPicker 事件映射
 * onChange 返回颜色值
 */
export const colorPickerEventMapping: EventMapping = {
  onChange: (value: any) => value
}
