import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '../dist')

const dtsContent = `/**
 * @form-renderer/starter-element-plus
 * 开箱即用的 ElementPlus 表单渲染器
 */

import type { App, DefineComponent } from 'vue'
import { FormEngine } from '@form-renderer/engine'
import type {
  FormSchema,
  FormModel,
  FormEngineOptions,
  JsonSchemaNode,
  Context,
  ValidationResult
} from '@form-renderer/engine'

import type {
  ComponentDefinition,
  FieldComponentProps
} from '@form-renderer/adapter-vue3'

// 导出组件类型
export declare const FormRenderer: DefineComponent<{
  schema: FormSchema
  model: FormModel
  onChange?: (model: FormModel) => void
  onValidate?: (result: ValidationResult) => void
}>

// 导出预设和引擎
export { FormEngine }
export type { ElementPlusPreset } from '@form-renderer/preset-element-plus'

// 导出类型
export interface FormRendererProps {
  schema: FormSchema
  model: FormModel
  onChange?: (model: FormModel) => void
  onValidate?: (result: ValidationResult) => void
}

export interface FormRendererMethods {
  validate: () => Promise<ValidationResult>
  reset: () => void
  getEngine: () => FormEngine
}

// 重新导出常用类型
export type {
  FormSchema,
  FormModel,
  FormEngineOptions,
  JsonSchemaNode,
  Context,
  ValidationResult
} from '@form-renderer/engine'

export type {
  ComponentDefinition,
  FieldComponentProps
} from '@form-renderer/adapter-vue3'

// 导出预设的所有组件
export {
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
  Form,
  Layout,
  List,
  FieldWrapper
} from '@form-renderer/preset-element-plus'

// Vue 插件安装
export declare const install: (app: App) => void

// 默认导出
declare const _default: {
  install: (app: App) => void
  FormRenderer: typeof FormRenderer
}

export default _default
`

writeFileSync(join(distDir, 'index.d.ts'), dtsContent, 'utf-8')
console.log('✓ Type definitions generated')
