<script setup lang="ts">
import type {
  JsonSchemaNode,
  Context,
  SubscribeHandlerContext
} from '@form-renderer/engine'
import { FormAdapter } from '@form-renderer/adapter-vue3'
import { createElementPlusPreset } from '@form-renderer/preset-element-plus'
import { ref } from 'vue'
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

const totalSubscribeHandler = (ctx: SubscribeHandlerContext) => {
  const rowData = ctx.getCurRowValue()
  const { price, quantity } = rowData
  if (isNaN(price) || isNaN(quantity)) return
  ctx.updateSelf(price * quantity)
}

const schema: JsonSchemaNode = {
  type: 'form',
  component: 'form',
  properties: {
    name: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '产品前缀'
      },
      defaultValue: 'hello',
      required: true
    },
    // 地址信息（控制是否显示）
    addressCard: {
      type: 'layout',
      component: 'layout',
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
          componentProps: (ctx: Context) => ({
            placeholder: '请选择城市',
            options: ctx.getValue('province')
              ? cityMap[ctx.getValue('province')]
              : [],
            clearable: true
          }),
          required: true,
          ifShow: (ctx: Context) => !!ctx.getValue('province'),
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
          componentProps: (ctx: Context) => ({
            placeholder: '请选择区县',
            options: ctx.getValue('city')
              ? districtMap[ctx.getValue('city')]
              : [],
            clearable: true
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
          ifShow: (ctx: Context) => {
            return !!ctx.getValue('district')
          },
          subscribes: {
            district: addressCommonSubscribeHandler
          }
        }
      }
    },
    // 产品列表（动态列表）
    productList: {
      type: 'list',
      component: 'list',
      formItemProps: {
        label: '产品列表',
        required: true
      },
      // 【方案1：list 层级的 defaultValue - 设置整行的默认值】
      // 注意：字段级的 defaultValue 优先级更高，会覆盖这里的值
      // defaultValue: () => ({
      //   name: 'hello',
      //   price: 0,
      //   quantity: 1,
      //   total: 0
      // }),
      items: {
        name: {
          type: 'field',
          component: 'input',
          formItemProps: {
            label: '产品名称'
          },
          required: true,
          // 【方案2：字段级的 defaultValue - 动态生成产品名称】
          // 在添加新行时，会调用这个函数计算默认值
          // 字段级的 defaultValue 优先级更高，会覆盖 list 级别设置的 name 值
          defaultValue: (ctx: any) => {
            // ctx.mode 可以用来区分不同场景
            // 'init': 表单初始化（如果 list 初始就有数据）
            // 'list-add': 用户点击添加按钮
            // 'reset'/'clear': 重置/清空操作

            if (ctx.mode === 'list-add') {
              // list-add 场景才使用动态逻辑
              const prefix = ctx.getValue('name')
              const index = ctx.getListLength()
              return prefix ? `${prefix}-${index + 1}` : `产品名称 ${index + 1}`
            }

            // 其他场景返回简单的默认值
            return '产品名称 1'
          }
        },
        price: {
          type: 'field',
          component: 'input',
          formItemProps: {
            label: '产品价格'
          },
          required: true
        },
        quantity: {
          type: 'field',
          component: 'input',
          formItemProps: {
            label: '产品数量'
          },
          required: true
        },
        total: {
          type: 'field',
          component: 'input',
          formItemProps: {
            label: '小计'
          },
          required: true,
          subscribes: {
            '.price': totalSubscribeHandler,
            '.quantity': totalSubscribeHandler
          }
        }
      }
    },
    additionalInfo: {
      type: 'layout',
      component: 'layout',
      properties: {
        // 总价（计算字段）
        totalPrice: {
          type: 'field',
          component: 'input',
          formItemProps: {
            label: '总价'
          },
          required: true,
          subscribes: {
            'productList.*.total': (ctx) => {
              const productList = ctx.getValue('productList')
              console.log('hello-----1: ', ctx, productList)
              const total = productList.reduce(
                (
                  sum: number,
                  item: {
                    total: number | string
                  }
                ) => sum + +item.total,
                0
              )
              ctx.updateSelf(total)
            }
          }
        }
      }
    }
  }
}

// 新建模式：不传 model，使用 schema 中的 defaultValue
// const formData = ref()

// 编辑模式：传入具体的 model 值
const formData = ref({
  name: 'nihao', // 如果想看 defaultValue 生效，注释掉整个 formData，使用上面的新建模式
  province: '',
  city: '',
  district: '',
  detail: '',
  productList: [],
  totalPrice: 0
})

const formRef = ref<typeof FormAdapter | null>(null)

const preset = createElementPlusPreset()

const handleChange = async () => {
  await formRef.value?.waitFlush()
  const model = formRef.value?.getValue()
  console.log('handleChange', model, formData.value)
}

const handleSubmit = async () => {
  const result = await formRef.value?.validate()
  console.log('result', result)
  if (result === true) {
    const data = formRef.value?.getValue()
    console.log('提交数据:', data)
    console.log('formData:', formData.value)
    alert('提交成功！')
  }
}

const handleReset = async () => {
  formRef.value?.reset()
}

const handleResetToDefault = async () => {
  formRef.value?.reset('default')
}

const handleGetModel = async () => {
  const model = formRef.value?.getValue()
  console.log('model', model)
}
</script>

<template>
  <FormAdapter
    :components="preset"
    :schema="schema"
    v-model:model="formData"
    ref="formRef"
    @change="handleChange"
  >
    <template #after-form>
      <div class="form-actions">
        <el-button type="primary" @click="handleSubmit">提交</el-button>
        <el-button @click="handleReset">重置到初始状态</el-button>
        <el-button @click="handleResetToDefault">重置到默认值</el-button>
        <el-button @click="handleGetModel">获取当前表单值</el-button>
      </div>
    </template>
  </FormAdapter>
</template>
