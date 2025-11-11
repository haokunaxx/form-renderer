<template>
  <div class="example-container">
    <h2 class="example-title">场景1：用户注册表单（基础表单）</h2>
    <p class="example-description">验证最基本的表单渲染和数据绑定功能</p>

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
          <el-button @click="handleValidate">手动验证</el-button>
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
import type { Context } from '@form-renderer/engine'
const formRef = ref()

const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: ''
})

const errors = ref<Array<{ path: string; message: string }>>([])

const preset = createElementPlusPreset({
  theme: {
    size: 'default',
    classPrefix: 'el-'
  }
})

const schema: FormSchema = {
  type: 'form',
  component: 'form',
  componentProps: {
    labelWidth: '120px'
  },
  properties: {
    username: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '用户名',
        required: true
      },
      componentProps: {
        placeholder: '请输入用户名'
      },
      required: true,
      validators: [
        (value: string) => {
          if (!value) return '用户名不能为空'
          if (value.length < 3) return '用户名至少 3 个字符'
          return true
        }
      ]
    },
    password: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '密码',
        required: true
      },
      componentProps: {
        type: 'password',
        placeholder: '请输入密码',
        showPassword: true
      },
      required: true,
      validators: [
        (value: string) => {
          if (!value) return '密码不能为空'
          if (value.length < 6) return '密码至少 6 个字符'
          return true
        }
      ]
    },
    confirmPassword: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '确认密码'
        // required: true
      },
      componentProps: {
        type: 'password',
        placeholder: '请再次输入密码',
        showPassword: true
      },
      // required: true,
      required: (ctx: Context) => {
        return ctx.getValue('password') !== ''
      },
      validators: [
        (value: string, ctx: Context) => {
          if (!value) return '确认密码不能为空'
          if (value !== ctx.getValue('password')) return '两次密码不一致'
          return true
        }
      ]
    },
    email: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '邮箱',
        required: true
      },
      componentProps: {
        placeholder: '请输入邮箱地址',
        type: 'email'
      },
      required: true,
      validators: [
        (value: string) => {
          if (!value) return '邮箱不能为空'
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) return '邮箱格式不正确'
          return true
        }
      ]
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
    console.log('提交数据:', data)
    alert('注册成功！')
    errors.value = []
  } else {
    errors.value = result.errors || []
  }
}

const handleReset = async () => {
  await formRef.value?.reset()
  errors.value = []
}

const handleValidate = async () => {
  const result = await formRef.value?.validate()
  if (result === true) {
    errors.value = []
    alert('验证通过！')
  } else {
    errors.value = result.errors || []
  }
}
</script>
