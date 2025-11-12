// 一对一联动
// 模拟省市区数据
const provinceOptions = [
  { label: '北京市', value: 'beijing' },
  { label: '上海市', value: 'shanghai' },
  { label: '广东省', value: 'guangdong' },
  { label: '浙江省', value: 'zhejiang' }
]

const cityMap = {
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

const districtMap = {
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

const addressCommonSubscribeHandler = (ctx) => {
  ctx.updateSelf('')
}
export const AddressInfoSchema = {
  // 地址信息（控制是否显示）
  addressCard: {
    type: 'layout',
    component: 'layout',
    componentProps: {
      type: 'card',
      header: '地址信息'
    },
    properties: {
      province: {
        type: 'field',
        component: 'select',
        formItemProps: {
          label: '省份'
        },
        componentProps: {
          placeholder: '请选择省份',
          options: provinceOptions,
          clearable: true
        },
        required: true
      },
      city: {
        type: 'field',
        component: 'select',
        formItemProps: {
          label: '城市',
          required: true
        },
        componentProps: (ctx) => ({
          placeholder: '请选择城市',
          options: ctx.getValue('province')
            ? cityMap[ctx.getValue('province')]
            : [],
          clearable: true
        }),
        required: true,
        ifShow: (ctx) => !!ctx.getValue('province'),
        subscribes: {
          province: addressCommonSubscribeHandler
        }
      },
      district: {
        type: 'field',
        component: 'select',
        formItemProps: {
          label: '区县',
          required: true
        },
        componentProps: (ctx) => ({
          placeholder: '请选择区县',
          options: ctx.getValue('city')
            ? districtMap[ctx.getValue('city')]
            : [],
          clearable: true
        }),
        required: true,
        ifShow: (ctx) => {
          return !!ctx.getValue('city')
        },
        subscribes: {
          city: addressCommonSubscribeHandler
        }
      },
      detail: {
        type: 'field',
        component: 'input',
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
        ifShow: (ctx) => {
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
