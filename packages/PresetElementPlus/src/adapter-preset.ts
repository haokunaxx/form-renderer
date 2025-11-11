/**
 * ElementPlus Adapter 预设
 * 符合 @form-renderer/adapter-vue3 规范的组件预设
 */

import type {
  ComponentDefinition,
  ComponentPreset
} from '../../AdapterVue3/dist'
import { getDefaultTransformer } from './value-transformers'
import { getDefaultEventMapping } from './event-mapping'
import { convertToElementPlusRules } from './validation'

// 导入组件
import Input from './widgets/Input.vue'
import InputNumber from './widgets/InputNumber.vue'
import Switch from './widgets/Switch.vue'
import CheckboxGroup from './widgets/CheckboxGroup.vue'
import RadioGroup from './widgets/RadioGroup.vue'
import Select from './widgets/Select.vue'
import DatePicker from './widgets/DatePicker.vue'
import Textarea from './widgets/Textarea.vue'
import Cascader from './widgets/Cascader.vue'
import TimePicker from './widgets/TimePicker.vue'
import Slider from './widgets/Slider.vue'
import Rate from './widgets/Rate.vue'
import ColorPicker from './widgets/ColorPicker.vue'
import Upload from './widgets/Upload.vue'
import Form from './containers/Form.vue'
import Layout from './containers/Layout.vue'
import List from './containers/List.vue'
import FieldWrapper from './wrappers/FieldWrapper.vue'

/**
 * 字段组件定义
 */
const fieldComponents: ComponentDefinition[] = [
  {
    name: 'input',
    component: Input,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      clearable: true,
      placeholder: '请输入'
    },
    valueTransformer: getDefaultTransformer('input'),
    eventMapping: getDefaultEventMapping('input')
  },
  {
    name: 'textarea',
    component: Textarea,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      rows: 3,
      showWordLimit: false,
      placeholder: '请输入'
    },
    valueTransformer: getDefaultTransformer('textarea'),
    eventMapping: getDefaultEventMapping('textarea')
  },
  {
    name: 'number',
    component: InputNumber,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      controls: true,
      controlsPosition: 'right'
    },
    valueTransformer: getDefaultTransformer('number'),
    eventMapping: getDefaultEventMapping('number')
  },
  {
    name: 'switch',
    component: Switch,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      activeValue: true,
      inactiveValue: false
    },
    valueTransformer: getDefaultTransformer('switch'),
    eventMapping: getDefaultEventMapping('switch')
  },
  {
    name: 'checkbox-group',
    component: CheckboxGroup,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      options: []
    },
    valueTransformer: getDefaultTransformer('checkbox-group'),
    eventMapping: getDefaultEventMapping('checkbox-group')
  },
  {
    name: 'radio-group',
    component: RadioGroup,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      options: []
    },
    valueTransformer: getDefaultTransformer('radio-group'),
    eventMapping: getDefaultEventMapping('radio-group')
  },
  {
    name: 'select',
    component: Select,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      clearable: true,
      filterable: true,
      options: []
    },
    valueTransformer: getDefaultTransformer('select'),
    eventMapping: getDefaultEventMapping('select')
  },
  {
    name: 'cascader',
    component: Cascader,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      clearable: true,
      filterable: false,
      showAllLevels: true,
      options: []
    },
    valueTransformer: getDefaultTransformer('cascader'),
    eventMapping: getDefaultEventMapping('cascader')
  },
  {
    name: 'date-picker',
    component: DatePicker,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      type: 'date',
      clearable: true,
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD'
    },
    valueTransformer: getDefaultTransformer('date-picker'),
    eventMapping: getDefaultEventMapping('date-picker')
  },
  {
    name: 'time-picker',
    component: TimePicker,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      clearable: true,
      format: 'HH:mm:ss',
      valueFormat: 'HH:mm:ss'
    },
    valueTransformer: getDefaultTransformer('time-picker'),
    eventMapping: getDefaultEventMapping('time-picker')
  },
  {
    name: 'slider',
    component: Slider,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      min: 0,
      max: 100,
      step: 1,
      showInput: false
    },
    valueTransformer: getDefaultTransformer('slider'),
    eventMapping: getDefaultEventMapping('slider')
  },
  {
    name: 'rate',
    component: Rate,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      max: 5,
      allowHalf: false
    },
    valueTransformer: getDefaultTransformer('rate'),
    eventMapping: getDefaultEventMapping('rate')
  },
  {
    name: 'color-picker',
    component: ColorPicker,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      showAlpha: false,
      colorFormat: 'hex'
    },
    valueTransformer: getDefaultTransformer('color-picker'),
    eventMapping: getDefaultEventMapping('color-picker')
  },
  {
    name: 'upload',
    component: Upload,
    type: 'field',
    needFormItem: true,
    defaultProps: {
      action: '',
      listType: 'text',
      autoUpload: true,
      showFileList: true
    },
    valueTransformer: getDefaultTransformer('upload'),
    eventMapping: getDefaultEventMapping('upload')
  }
]

/**
 * 容器组件定义
 */
const containerComponents: ComponentDefinition[] = [
  {
    name: 'form',
    component: Form,
    type: 'form',
    needFormItem: false,
    defaultProps: {
      labelPosition: 'right',
      labelWidth: '100px',
      size: 'default'
    },
    eventMapping: getDefaultEventMapping('form')
  },
  {
    name: 'layout',
    component: Layout,
    type: 'layout',
    needFormItem: false,
    defaultProps: {
      type: 'card',
      shadow: 'always'
    },
    eventMapping: getDefaultEventMapping('layout')
  },
  {
    name: 'list',
    component: List,
    type: 'list',
    needFormItem: false,
    defaultProps: {
      sortable: true,
      showHeader: true,
      size: 'default'
    },
    eventMapping: getDefaultEventMapping('list')
  }
]

/**
 * 所有组件定义
 */
const allComponents: ComponentDefinition[] = [
  ...fieldComponents,
  ...containerComponents
]

/**
 * ElementPlus 预设
 */
export const ElementPlusPreset: ComponentPreset = {
  name: '@form-renderer/preset-element-plus',
  components: allComponents,
  // theme: {
  //   size: 'default',
  //   classPrefix: 'el-'
  // },
  setup: async () => {
    // 预设初始化逻辑
    // console.log('ElementPlus preset initialized')
  },
  formItem: FieldWrapper as any,
  ruleConverter: convertToElementPlusRules
}

/**
 * 创建 ElementPlus 预设的工厂函数
 */
export function createElementPlusPreset(options?: {
  theme?: {
    size?: 'large' | 'default' | 'small'
    classPrefix?: string
  }
}): ComponentPreset {
  return {
    ...ElementPlusPreset,
    // theme: {
    //   ...ElementPlusPreset.theme,
    //   ...options?.theme
    // },
    ruleConverter: convertToElementPlusRules
  }
}

export default ElementPlusPreset
