<template>
  <div class="example-section">
    <div class="section-header">
      <h2>07. StarterElementPlus - 基础示例</h2>
      <p class="description">
        使用
        <code>@form-renderer/starter-element-plus</code>
        开箱即用包，一个组件搞定一切
      </p>
    </div>

    <el-card class="example-card">
      <template #header>
        <div class="card-header">
          <span>用户信息表单</span>
          <div>
            <el-button size="small" @click="handleReset">重置</el-button>
            <el-button size="small" type="primary" @click="handleSubmit"
              >提交</el-button
            >
          </div>
        </div>
      </template>

      <div class="form-content">
        <div class="form-wrapper">
          <FormRenderer
            ref="formRef"
            v-model="formData"
            :schema="formSchema"
            @change="handleChange"
          />
        </div>

        <div class="data-display">
          <div class="display-header">
            <h4>实时数据</h4>
            <el-tag type="success" size="small">双向绑定</el-tag>
          </div>
          <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
        </div>
      </div>
    </el-card>

    <div class="highlight-box">
      <h3>💡 核心优势</h3>
      <ul>
        <li>
          <strong>零配置</strong> - 无需手动配置 Engine + Adapter + Preset
        </li>
        <li><strong>类型安全</strong> - 完整的 TypeScript 支持</li>
        <li><strong>开箱即用</strong> - 导入即用，一行代码搞定</li>
        <li><strong>完整功能</strong> - 包含所有 ElementPlus 组件</li>
      </ul>
    </div>

    <div class="code-example">
      <h3>📝 使用示例</h3>
      <pre><code>import { FormRenderer } from '@form-renderer/starter-element-plus'

const formData = reactive({
  username: '',
  email: '',
  age: undefined
})

&lt;FormRenderer
  v-model:model="formData"
  :schema="formSchema"
  @change="handleChange"
/&gt;</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { FormRenderer } from '@form-renderer/starter-element-plus'
import type { JsonSchemaNode } from '@form-renderer/engine'
import { ElMessage } from 'element-plus'

const formRef = ref()

const formData = ref({
  username: '',
  email: '',
  age: undefined,
  gender: 'male',
  bio: '',
  subscribe: false
})
// const formData = ref()

const formSchema: JsonSchemaNode = {
  type: 'form',
  component: 'form',
  componentProps: {
    labelWidth: '100px'
  },
  properties: {
    username: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '用户名'
      },
      required: true,
      componentProps: {
        placeholder: '请输入用户名',
        clearable: true
      },
      defaultValue: 'default value'
    },
    email: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '邮箱'
      },
      required: true,
      componentProps: {
        type: 'email',
        placeholder: '请输入邮箱',
        clearable: true
      }
    },
    age: {
      type: 'field',
      component: 'input-number',
      formItemProps: {
        label: '年龄'
      },
      componentProps: {
        placeholder: '请输入年龄',
        min: 1,
        max: 150
      }
    },
    gender: {
      type: 'field',
      component: 'radio-group',
      defaultValue: 'other',
      formItemProps: {
        label: '性别'
      },
      componentProps: {
        options: [
          { label: '男', value: 'male' },
          { label: '女', value: 'female' },
          { label: '其他', value: 'other' }
        ]
      }
    },
    bio: {
      type: 'field',
      component: 'textarea',
      formItemProps: {
        label: '个人简介'
      },
      componentProps: {
        placeholder: '请输入个人简介',
        rows: 3,
        showWordLimit: true,
        maxlength: 200
      }
    },
    subscribe: {
      type: 'field',
      component: 'switch',
      formItemProps: {
        label: '订阅通知'
      }
    }
  }
}

watch(
  () => formData.value,
  (newVal) => {
    console.log('formData changed', newVal)
  },
  {
    deep: true
  }
)

const handleChange = async (data: any) => {
  console.log('表单数据变更:', data)
}

const handleReset = () => {
  formRef.value?.reset()
  ElMessage.success('表单已重置')
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  console.log('表单验证结果:', valid)
  if (valid) {
    ElMessage.success('提交成功！')
    console.log('提交数据:', formData)
  } else {
    ElMessage.error('请填写必填项')
  }
}
</script>

<style scoped>
.example-section {
  margin-bottom: 40px;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0 0 10px;
  font-size: 1.5rem;
  color: #303133;
}

.description {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.description code {
  padding: 2px 8px;
  font-family: monospace;
  color: #e6a23c;
  background: #f5f7fa;
  border-radius: 3px;
}

.example-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
}

.form-wrapper {
  min-height: 400px;
}

.data-display {
  padding: 15px;
  height: fit-content;
  background: #f5f7fa;
  border-radius: 4px;
}

.display-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.display-header h4 {
  margin: 0;
  font-size: 14px;
  color: #303133;
}

.data-display pre {
  overflow: auto;
  margin: 0;
  max-height: 500px;
  font-size: 12px;
  line-height: 1.6;
}

.highlight-box {
  padding: 20px;
  margin-bottom: 20px;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
}

.highlight-box h3 {
  margin: 0 0 15px;
  font-size: 1.2rem;
}

.highlight-box ul {
  padding-left: 20px;
  margin: 0;
}

.highlight-box li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.code-example {
  padding: 20px;
  color: #abb2bf;
  background: #282c34;
  border-radius: 8px;
}

.code-example h3 {
  margin: 0 0 15px;
  color: #61afef;
}

.code-example pre {
  overflow-x: auto;
  margin: 0;
}

.code-example code {
  font-size: 13px;
  font-family: 'Courier New', monospace;
  line-height: 1.6;
}

@media (width <= 1024px) {
  .form-content {
    grid-template-columns: 1fr;
  }
}
</style>
