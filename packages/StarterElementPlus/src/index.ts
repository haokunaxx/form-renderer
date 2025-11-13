/**
 * @form-renderer/starter-element-plus
 * 开箱即用的 ElementPlus 表单渲染器
 */

import type { App } from 'vue'
import FormRenderer from './FormRenderer.vue'
import { FormEngine } from '@form-renderer/engine'
import { ElementPlusPreset } from '@form-renderer/preset-element-plus'

// 导出组件
export { FormRenderer }

// 导出预设和引擎
export { FormEngine, ElementPlusPreset }

// 导出类型
export * from './types'

// 重新导出常用类型
export type { FormSchema, FormModel } from '@form-renderer/engine'

export type {
  ComponentDefinition,
  FieldComponentProps
} from '@form-renderer/adapter-vue3'

// 导出预设的所有组件
export {
  // 字段组件
  Input,
  Textarea,
  InputNumber,
  Switch,
  CheckboxGroup,
  RadioGroup,
  Select,
  Cascader,
  DatePicker,
  TimePicker,
  Slider,
  Rate,
  ColorPicker,
  Upload,
  // 容器组件
  Form,
  Layout,
  List,
  // 包装器
  FieldWrapper
} from '@form-renderer/preset-element-plus'

// Vue 插件安装
export const install = (app: App) => {
  app.component('FormRenderer', FormRenderer)
}

// 默认导出
export default {
  install,
  FormRenderer
}
