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
 */

/**
 * 通用字段组件事件映射
 */
export const commonFieldEventMapping = {
  onChange: 'change',
  onFocus: 'focus',
  onBlur: 'blur',
  onClear: 'clear'
}

/**
 * 输入框组件事件映射
 */
export const inputEventMapping = {
  ...commonFieldEventMapping,
  onInput: 'input',
  onKeydown: 'keydown',
  onKeyup: 'keyup',
  onEnter: 'keydown.enter'
}

/**
 * 数字输入框事件映射
 */
export const numberEventMapping = {
  ...commonFieldEventMapping,
  onInput: 'input'
}

/**
 * 开关组件事件映射
 */
export const switchEventMapping = {
  onChange: 'change'
}

/**
 * 选择组件事件映射（单选、多选、下拉）
 */
export const selectEventMapping = {
  ...commonFieldEventMapping,
  onVisibleChange: 'visible-change',
  onRemoveTag: 'remove-tag'
}

/**
 * 日期选择器事件映射
 */
export const datePickerEventMapping = {
  ...commonFieldEventMapping,
  onPanelChange: 'panel-change'
}

/**
 * 表单容器事件映射
 */
export const formEventMapping = {
  onValidate: 'validate',
  onSubmit: 'submit',
  onReset: 'reset'
}

/**
 * 列表容器事件映射
 */
export const listEventMapping = {
  onChange: 'change',
  onAdd: 'add',
  onRemove: 'remove',
  onSort: 'sort',
  onMove: 'move'
}

/**
 * 布局容器事件映射
 */
export const layoutEventMapping = {
  onChange: 'change',
  onTabChange: 'tab-change',
  onCollapseChange: 'change'
}

/**
 * 级联选择器事件映射
 */
export const cascaderEventMapping = {
  ...commonFieldEventMapping,
  onExpandChange: 'expand-change'
}

/**
 * 滑块事件映射
 */
export const sliderEventMapping = {
  onChange: 'change',
  onInput: 'input'
}

/**
 * 评分事件映射
 */
export const rateEventMapping = {
  onChange: 'change'
}

/**
 * 颜色选择器事件映射
 */
export const colorPickerEventMapping = {
  onChange: 'change',
  onActiveChange: 'active-change'
}

/**
 * 文件上传事件映射
 */
export const uploadEventMapping = {
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
export function getDefaultEventMapping(componentType) {
  const mappings = {
    input: inputEventMapping,
    textarea: inputEventMapping,
    number: numberEventMapping,
    switch: switchEventMapping,
    'checkbox-group': selectEventMapping,
    'radio-group': selectEventMapping,
    select: selectEventMapping,
    'date-picker': datePickerEventMapping,
    'time-picker': datePickerEventMapping,
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
