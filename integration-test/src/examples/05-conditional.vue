<template>
  <div class="example-container">
    <h2 class="example-title">场景5：条件显示（动态控制）</h2>
    <p class="example-description">
      验证复杂控制逻辑：根据用户类型显示不同字段
    </p>

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
import { ref } from 'vue'
import { ElButton } from 'element-plus'
import { FormAdapter } from '@form-renderer/adapter-vue3'
import { createElementPlusPreset } from '@form-renderer/preset-element-plus'
import type { FormSchema } from '@form-renderer/adapter-vue3'
import type { Context } from '@form-renderer/engine'

const formRef = ref()

const formData = ref({
  userType: '',
  idCard: '',
  companyName: '',
  businessLicense: '',
  contactName: '',
  contactPhone: ''
})

const preset = createElementPlusPreset()

const schema: FormSchema = {
  type: 'form',
  component: 'form',
  componentProps: {
    labelWidth: '120px'
  },
  properties: {
    userType: {
      type: 'field',
      component: 'radio-group',
      formItemProps: {
        label: '用户类型',
        required: true
      },
      componentProps: {
        options: [
          { label: '个人', value: 'individual' },
          { label: '企业', value: 'company' }
        ]
      },
      required: true
    },
    idCard: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '身份证号',
        required: true
      },
      componentProps: {
        placeholder: '请输入身份证号',
        maxlength: 18
      },
      required: true,
      ifShow: (ctx: Context) => {
        return ctx.getValue('userType') === 'individual'
      },
      validators: [
        (value: string, ctx: Context) => {
          if (!value) return '身份证号不能为空'
          const idCardRegex =
            /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
          if (!idCardRegex.test(value)) return '身份证号格式不正确'
          return true
        }
      ]
    },
    companyName: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '企业名称',
        required: true
      },
      componentProps: {
        placeholder: '请输入企业名称'
      },
      required: true,
      ifShow: (ctx: Context) => {
        return ctx.getValue('userType') === 'company'
      }
    },
    businessLicense: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '营业执照号',
        required: true
      },
      componentProps: {
        placeholder: '请输入营业执照号'
      },
      required: true,
      ifShow: (ctx: Context) => {
        return ctx.getValue('userType') === 'company'
      }
    },
    contactName: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '联系人姓名',
        required: true
      },
      componentProps: {
        placeholder: '请输入联系人姓名'
      },
      required: true
    },
    contactPhone: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '联系电话',
        required: true
      },
      componentProps: {
        placeholder: '请输入联系电话',
        maxlength: 11
      },
      required: true,
      validators: [
        (value: string, ctx: Context) => {
          if (!value) return '联系电话不能为空'
          const phoneRegex = /^1[3-9]\d{9}$/
          if (!phoneRegex.test(value)) return '联系电话格式不正确'
          return true
        }
      ]
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
    console.log('提交表单数据:', data)
    alert('表单提交成功！')
  }
}

const handleReset = async () => {
  await formRef.value?.reset()
}
</script>
