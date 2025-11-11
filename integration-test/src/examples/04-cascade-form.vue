<template>
  <div class="example-container">
    <h2 class="example-title">场景4：地址级联（联动表单）</h2>
    <p class="example-description">验证字段联动和控制属性：省市区三级联动</p>

    <FormAdapter
      ref="formRef"
      :schema="schema"
      v-model:model="formData"
      :components="preset"
      @change="handleChange"
    >
      <template #after-form>
        <div class="form-actions">
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </template>
    </FormAdapter>

    <div class="form-data-display">
      <h3>表单数据：</h3>
      <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElButton } from 'element-plus'
import { FormAdapter } from '@form-renderer/adapter-vue3'
import { createElementPlusPreset } from '@form-renderer/preset-element-plus'
import type { FormSchema } from '@form-renderer/adapter-vue3'
import type { Context, SubscribeHandlerContext } from '@form-renderer/engine'

const formRef = ref()

const formData = ref({
  province: '',
  city: '',
  district: '',
  detail: ''
})

const preset = createElementPlusPreset()

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

const schema: FormSchema = {
  type: 'form',
  component: 'form',
  componentProps: {
    labelWidth: '120px'
  },
  properties: {
    province: {
      type: 'field',
      component: 'select',
      formItemProps: {
        label: '省份',
        required: true
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
      ifShow: (ctx: Context) => {
        console.log(
          'city ifShow',
          ctx.getValue('province'),
          !!ctx.getValue('province')
        )
        return !!ctx.getValue('province')
      },
      subscribes: {
        province: (ctx: SubscribeHandlerContext) => {
          ctx.updateValue('city', '')
        }
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
        options: ctx.getValue('city') ? districtMap[ctx.getValue('city')] : [],
        clearable: true
      }),
      required: true,
      ifShow: (ctx: Context) => {
        return !!ctx.getValue('city')
      },
      subscribes: {
        city: (ctx: SubscribeHandlerContext) => {
          ctx.updateValue('district', '')
        }
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
        district: (ctx: SubscribeHandlerContext) => {
          ctx.updateValue('detail', '')
        }
      }
    }
  }
}

const handleChange = () => {
  const data = formRef.value?.getValue()
  console.log('表单数据变更:', data)
  formData.value = data
}

const handleSubmit = async () => {
  const result = await formRef.value?.validate()
  if (result === true) {
    const data = formRef.value?.getValue()
    console.log('提交地址数据:', data)
    alert('地址提交成功！')
  }
}

const handleReset = async () => {
  await formRef.value?.reset()
}
</script>
