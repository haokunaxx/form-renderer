import type { JsonSchemaNode } from '@form-renderer/engine'

import { AddressInfoSchema, AddressInfoModel } from './address-info' //一对一联动
import { ProductCardSchema, ProductCardModel } from './product-card' // 行内一对一，外部一对多
// 外部字段控制多行列表字段
import { JobInformationSchema, JobInformationModel } from './job-information' // 控制属性

import { ComponentSwitchSchema, ComponentSwitchModel } from './component-switch' // 组件切换

export const ComplexDemoSchema: JsonSchemaNode = {
  type: 'form',
  component: 'form',
  formProps: {
    labelPosition: 'left',
    labelWidth: '130px'
  },
  properties: {
    ...JobInformationSchema,
    ...AddressInfoSchema,
    ...ProductCardSchema,
    ...ComponentSwitchSchema
  }
}

export const ComplexDemoModel = {
  ...AddressInfoModel,
  ...ProductCardModel,
  ...JobInformationModel,
  ...ComponentSwitchModel
}
