/**
 * Ant Design 预设
 */

import {
  Input,
  InputNumber,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  Checkbox,
  Radio,
  Slider,
  Rate,
  Upload,
  Cascader,
  Form
} from 'antd'
import type { ComponentPreset } from '@form-renderer/adapter-react'
import { Form as FormContainer } from '../containers/Form'
import { Layout } from '../containers/Layout'
import { List } from '../containers/List'
import {
  dateTransformer,
  timeTransformer,
  numberTransformer,
  booleanTransformer,
  arrayTransformer
} from '../value-transformers'
import {
  inputEventMapping,
  inputNumberEventMapping,
  selectEventMapping,
  datePickerEventMapping,
  timePickerEventMapping,
  switchEventMapping,
  groupEventMapping,
  sliderEventMapping,
  rateEventMapping,
  uploadEventMapping,
  cascaderEventMapping
} from '../event-mapping'
import { antdRuleConverter } from '../validation'

const { TextArea } = Input
const { Group: CheckboxGroup } = Checkbox
const { Group: RadioGroup } = Radio

/**
 * Ant Design 预设
 */
export const AntdPreset: ComponentPreset = {
  name: 'antd',

  components: [
    // ========== 容器组件 ==========
    {
      name: 'form',
      component: FormContainer,
      type: 'form',
      needFormItem: false
    },
    {
      name: 'layout',
      component: Layout,
      type: 'layout',
      needFormItem: false
    },
    {
      name: 'list',
      component: List,
      type: 'list',
      needFormItem: false
    },

    // ========== 基础输入 ==========
    {
      name: 'Input',
      component: Input,
      type: 'field',
      eventMapping: inputEventMapping,
      needFormItem: true,
      valueTransformer: {
        toComponent: (engineValue: string) => {
          return engineValue
        },
        fromComponent: (el: React.ChangeEvent<HTMLInputElement>) => {
          return el.target.value
        }
      }
    },
    {
      name: 'Textarea',
      component: TextArea,
      type: 'field',
      eventMapping: inputEventMapping,
      needFormItem: true
    },
    {
      name: 'InputNumber',
      component: InputNumber,
      type: 'field',
      valueTransformer: numberTransformer,
      eventMapping: inputNumberEventMapping,
      needFormItem: true
    },

    // ========== 选择器 ==========
    {
      name: 'Select',
      component: Select,
      type: 'field',
      eventMapping: selectEventMapping,
      needFormItem: true
    },
    {
      name: 'Cascader',
      component: Cascader,
      type: 'field',
      eventMapping: cascaderEventMapping,
      needFormItem: true
    },

    // ========== 日期时间 ==========
    {
      name: 'DatePicker',
      component: DatePicker,
      type: 'field',
      valueTransformer: dateTransformer,
      eventMapping: datePickerEventMapping,
      needFormItem: true
    },
    {
      name: 'TimePicker',
      component: TimePicker,
      type: 'field',
      valueTransformer: timeTransformer,
      eventMapping: timePickerEventMapping,
      needFormItem: true
    },

    // ========== 开关/选择 ==========
    {
      name: 'Switch',
      component: Switch,
      type: 'field',
      valueTransformer: booleanTransformer,
      eventMapping: switchEventMapping,
      needFormItem: true
    },
    {
      name: 'CheckboxGroup',
      component: CheckboxGroup,
      type: 'field',
      valueTransformer: arrayTransformer,
      eventMapping: groupEventMapping,
      needFormItem: true
    },
    {
      name: 'RadioGroup',
      component: RadioGroup,
      type: 'field',
      eventMapping: groupEventMapping,
      needFormItem: true
    },

    // ========== 特殊输入 ==========
    {
      name: 'Slider',
      component: Slider,
      type: 'field',
      eventMapping: sliderEventMapping,
      needFormItem: true
    },
    {
      name: 'Rate',
      component: Rate,
      type: 'field',
      eventMapping: rateEventMapping,
      needFormItem: true
    },
    {
      name: 'Upload',
      component: Upload,
      type: 'field',
      eventMapping: uploadEventMapping,
      needFormItem: true
    }
  ],

  // FormItem 组件
  formItem: Form.Item,

  // 校验规则转换器
  ruleConverter: antdRuleConverter,

  // 主题配置
  theme: {
    size: 'middle',
    classPrefix: 'ant-'
  }
}

/**
 * 创建自定义 Ant Design 预设
 */
export function createAntdPreset(options?: {
  theme?: {
    size?: 'large' | 'middle' | 'small'
    classPrefix?: string
  }
}): ComponentPreset {
  return {
    ...AntdPreset,
    theme: {
      ...AntdPreset.theme,
      ...options?.theme
    }
  }
}
