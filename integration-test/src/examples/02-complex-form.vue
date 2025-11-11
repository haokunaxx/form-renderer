<template>
  <div class="example-container">
    <h2 class="example-title">场景2：订单编辑表单（复杂表单）</h2>
    <p class="example-description">验证复杂字段类型和校验功能</p>

    <FormAdapter
      ref="formRef"
      :schema="schema"
      v-model:model="formData"
      :components="preset"
      @change="handleChange"
    >
      <template #after-form>
        <div class="form-actions">
          <el-button type="primary" @click="handleSubmit">提交订单</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </template>
    </FormAdapter>

    <div class="form-data-display">
      <h3>表单数据：</h3>
      <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
    </div>

    <div v-if="errors.length > 0" class="errors-display">
      <h3>验证错误：</h3>
      <ul>
        <li v-for="error in errors" :key="error.path">
          {{ error.path }}: {{ error.message }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElButton } from 'element-plus'
import { FormAdapter } from '@form-renderer/adapter-vue3'
import { createElementPlusPreset } from '@form-renderer/preset-element-plus'
import type { FormSchema } from '@form-renderer/adapter-vue3'

const formRef = ref()

const formData = reactive({
  orderNo: '',
  customerName: '',
  orderDate: '',
  status: '',
  items: [],
  totalAmount: undefined,
  remarks: ''
})

const errors = ref<Array<{ path: string; message: string }>>([])

const preset = createElementPlusPreset()

const schema: FormSchema = {
  type: 'form',
  component: 'form',
  componentProps: {
    labelWidth: '120px'
  },
  properties: {
    orderNo: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '订单号',
        required: true
      },
      componentProps: {
        placeholder: '请输入订单号'
      },
      required: true
    },
    customerName: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '客户姓名',
        required: true
      },
      componentProps: {
        placeholder: '请输入客户姓名'
      },
      required: true
    },
    orderDate: {
      type: 'field',
      component: 'date-picker',
      formItemProps: {
        label: '订单日期',
        required: true
      },
      componentProps: {
        placeholder: '请选择订单日期',
        type: 'date',
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD'
      },
      required: true
    },
    status: {
      type: 'field',
      component: 'select',
      formItemProps: {
        label: '订单状态',
        required: true
      },
      componentProps: {
        placeholder: '请选择订单状态',
        options: [
          { label: '待付款', value: 'pending' },
          { label: '已付款', value: 'paid' },
          { label: '已发货', value: 'shipped' },
          { label: '已完成', value: 'completed' },
          { label: '已取消', value: 'cancelled' }
        ]
      },
      required: true
    },
    totalAmount: {
      type: 'field',
      component: 'number',
      formItemProps: {
        label: '订单总额',
        required: true
      },
      componentProps: {
        placeholder: '请输入订单总额',
        min: 0,
        precision: 2,
        controls: true
      },
      required: true,
      validators: [
        (value: number) => {
          if (value === undefined || value === null) return '订单总额不能为空'
          if (value <= 0) return '订单总额必须大于0'
          return true
        }
      ]
    },
    remarks: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '备注'
      },
      componentProps: {
        type: 'textarea',
        placeholder: '请输入备注信息',
        rows: 4
      }
    }
  }
}

const handleChange = (data: any) => {
  console.log('表单数据变更:', data)
}

const handleSubmit = async () => {
  const result = await formRef.value?.validate()
  if (result === true) {
    const data = formRef.value?.getValue()
    console.log('提交订单数据:', data)
    alert('订单提交成功！')
    errors.value = []
  } else {
    errors.value = result.errors || []
  }
}

const handleReset = async () => {
  await formRef.value?.reset()
  errors.value = []
}
</script>
