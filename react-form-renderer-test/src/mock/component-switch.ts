import type { JsonSchemaNode } from '@form-renderer/engine'

export const ComponentSwitchSchema: JsonSchemaNode['properties'] = {
  componentSwitchCard: {
    type: 'layout',
    component: 'layout',
    componentProps: {
      type: 'card',
      title: '组件切换'
    },
    properties: {
      componentSwitch: {
        type: 'field',
        component: 'Select',
        componentProps: {
          options: [
            { label: '文本框', value: 'input' },
            { label: '下拉选择', value: 'select' },
            { label: '开关', value: 'switch' },
            { label: '日期选择器', value: 'date-picker' }
          ]
        },
        formItemProps: {
          label: '组件切换'
        }
      },
      dynamicComponentDisabledControl: {
        type: 'field',
        component: 'Switch',
        formItemProps: {
          label: '动态组件禁用控制'
        }
      },
      dynamicComponentRequiredControl: {
        type: 'field',
        component: 'Switch',
        formItemProps: {
          label: '动态组件必填控制'
        }
      }
      // dynamicComponentValue: {
      //   type: 'field',
      //   component: 'dynamic-field',
      //   formItemProps: {
      //     label: '动态组件值'
      //   },
      //   disabled: (ctx: Context) =>
      //     ctx.getValue('dynamicComponentDisabledControl'),
      //   required: (ctx: Context) =>
      //     ctx.getValue('dynamicComponentRequiredControl'),
      //   componentProps: (ctx: Context) => ({
      //     type: ctx.getValue('componentSwitch')
      //   })
      // }
    }
  }
}

export const ComponentSwitchModel = {
  componentSwitch: 'input',
  dynamicComponentValue: ''
}
