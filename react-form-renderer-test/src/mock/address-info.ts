// 一对一联动
import type {
  JsonSchemaNode,
  Context,
  SubscribeHandlerContext
} from '@form-renderer/engine'

// 模拟省市区数据
const provinceOptions = [
  { label: '北京市', value: 'beijing' },
  { label: '上海市', value: 'shanghai' },
  { label: '广东省', value: 'guangdong' },
  { label: '浙江省', value: 'zhejiang' }
]

const cityMap: Record<string, Array<{ label: string; value: string }>> = {
  beijing: [
    { label: '东城区', value: 'dongcheng' },
    { label: '西城区', value: 'xicheng' },
    { label: '朝阳区', value: 'chaoyang' },
    { label: '海淀区', value: 'haidian' }
  ],
  shanghai: [
    { label: '黄浦区', value: 'huangpu' },
    { label: '徐汇区', value: 'xuhui' },
    { label: '长宁区', value: 'changning' },
    { label: '静安区', value: 'jingan' }
  ],
  guangdong: [
    { label: '广州市', value: 'guangzhou' },
    { label: '深圳市', value: 'shenzhen' },
    { label: '珠海市', value: 'zhuhai' },
    { label: '佛山市', value: 'foshan' }
  ],
  zhejiang: [
    { label: '杭州市', value: 'hangzhou' },
    { label: '宁波市', value: 'ningbo' },
    { label: '温州市', value: 'wenzhou' },
    { label: '嘉兴市', value: 'jiaxing' }
  ]
}

const districtMap: Record<string, Array<{ label: string; value: string }>> = {
  dongcheng: [
    { label: '东华门街道', value: 'donghuamen' },
    { label: '景山街道', value: 'jingshan' }
  ],
  xicheng: [
    { label: '西长安街街道', value: 'xichanganjie' },
    { label: '新街口街道', value: 'xinjiekou' }
  ],
  chaoyang: [
    { label: '建外街道', value: 'jianwai' },
    { label: '朝外街道', value: 'chaowai' }
  ],
  haidian: [
    { label: '万寿路街道', value: 'wanshoulu' },
    { label: '羊坊店街道', value: 'yangfangdian' }
  ]
}

const addressCommonSubscribeHandler = (ctx: SubscribeHandlerContext) => {
  ctx.updateSelf('')
}
export const AddressInfoSchema: JsonSchemaNode['properties'] = {
  // 地址信息（控制是否显示）
  addressCard: {
    type: 'layout',
    component: 'layout',
    componentProps: {
      type: 'card',
      title: '地址信息'
    },
    properties: {
      province: {
        type: 'field',
        component: 'Select',
        formItemProps: {
          label: '省份'
        },
        componentProps: {
          placeholder: '请选择省份',
          options: provinceOptions
        },
        required: true
      },
      city: {
        type: 'field',
        component: 'Select',
        formItemProps: {
          label: '城市',
          required: true
        },
        // TODO: 支持异步该如何处理？如果封装了一个 Select 组件，组件内部在某个表单项发生改变的时候重新请求数据该怎么做？
        componentProps: (ctx: Context) => ({
          placeholder: '请选择城市',
          options: ctx.getValue('province')
            ? cityMap[ctx.getValue('province')]
            : []
        }),
        required: true,
        ifShow: (ctx: Context) => !!ctx.getValue('province'),
        subscribes: {
          province: addressCommonSubscribeHandler
        }
      },
      district: {
        type: 'field',
        component: 'Select',
        formItemProps: {
          label: '区县',
          required: true
        },
        componentProps: (ctx: Context) => ({
          placeholder: '请选择区县',
          options: ctx.getValue('city') ? districtMap[ctx.getValue('city')] : []
        }),
        required: true,
        ifShow: (ctx: Context) => {
          return !!ctx.getValue('city')
        },
        subscribes: {
          city: addressCommonSubscribeHandler
        }
      },
      detail: {
        type: 'field',
        component: 'Input',
        formItemProps: {
          label: '详细地址',
          required: true
        },
        componentProps: {
          placeholder: '请输入详细地址',
          type: 'textarea',
          rows: 3
        },
        required: true,
        ifShow: (ctx: Context) => {
          return !!ctx.getValue('district')
        },
        subscribes: {
          district: addressCommonSubscribeHandler
        }
      }
    }
  }
}

export const AddressInfoModel = {
  province: '',
  city: '',
  district: '',
  detail: ''
}
