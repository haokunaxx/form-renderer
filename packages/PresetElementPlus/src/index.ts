// PresetElementPlus 主入口文件

/**
 * 导入所有组件以确保样式被包含
 * 这样在构建时，所有组件的样式都会被提取到 dist/index.css
 */
import './containers/Form.vue'
import './containers/Layout.vue'
import './containers/List.vue'
import './widgets/Input.vue'
import './widgets/Textarea.vue'
import './widgets/InputNumber.vue'
import './widgets/Switch.vue'
import './widgets/CheckboxGroup.vue'
import './widgets/RadioGroup.vue'
import './widgets/Select.vue'
import './widgets/Cascader.vue'
import './widgets/DatePicker.vue'
import './widgets/TimePicker.vue'
import './widgets/Slider.vue'
import './widgets/Rate.vue'
import './widgets/ColorPicker.vue'
import './widgets/Upload.vue'
import './wrappers/FieldWrapper.vue'

// 导出预设创建函数和预设对象（符合 Adapter 规范）
export {
  createElementPlusPreset,
  ElementPlusPreset,
  default as ElementPlusPresetDefault
} from './adapter-preset'

// 导出类型定义
export * from './event-mapping'
export type * from './types'

// 导出组件（供高级用户使用）
export * from './widgets'
export * from './containers'
export * from './wrappers'

// 导出校验工具（供自定义使用）
export * from './validation'
