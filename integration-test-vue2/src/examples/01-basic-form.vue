<template>
  <div class="basic-form">
    <h2>基础表单示例</h2>
    <el-card>
      <form-adapter
        ref="formAdapter"
        :schema="schema"
        :model="formData"
        :components="elementUIPreset"
        @change="handleChange"
      />
      <div style="margin-top: 20px">
        <el-button type="primary" @click="handleSubmit">提交</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <div style="margin-top: 20px">
        <h3>表单数据:</h3>
        <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script>
import { FormAdapter } from '@form-renderer/adapter-vue2'
import { ElementUIPreset } from '@form-renderer/preset-element-ui'

export default {
  name: 'BasicForm',
  components: {
    FormAdapter
  },
  data() {
    return {
      elementUIPreset: ElementUIPreset,
      formData: {
        name: '',
        age: undefined,
        email: '',
        gender: '',
        agree: false
      },
      schema: {
        type: 'form',
        component: 'form',
        componentProps: {
          labelWidth: '100px'
        },
        properties: {
          name: {
            type: 'field',
            component: 'input',
            label: '姓名',
            path: 'name',
            required: true,
            componentProps: {
              placeholder: '请输入姓名',
              clearable: true
            }
          },
          age: {
            type: 'field',
            component: 'number',
            label: '年龄',
            path: 'age',
            componentProps: {
              placeholder: '请输入年龄',
              min: 1,
              max: 120
            }
          },
          email: {
            type: 'field',
            component: 'input',
            label: '邮箱',
            path: 'email',
            required: true,
            componentProps: {
              placeholder: '请输入邮箱',
              type: 'email'
            }
          },
          gender: {
            type: 'field',
            component: 'radio-group',
            label: '性别',
            path: 'gender',
            componentProps: {
              options: [
                { label: '男', value: 'male' },
                { label: '女', value: 'female' }
              ]
            }
          },
          agree: {
            type: 'field',
            component: 'switch',
            label: '同意协议',
            path: 'agree',
            componentProps: {
              activeText: '是',
              inactiveText: '否'
            }
          }
        }
      }
    }
  },
  methods: {
    handleChange(data) {
      console.log('表单数据变更:', data)
    },
    async handleSubmit() {
      try {
        const valid = await this.$refs.formAdapter.validate()
        if (valid) {
          this.$message.success('提交成功！')
          console.log('表单数据:', this.formData)
        }
      } catch (error) {
        this.$message.error('校验失败，请检查表单！')
      }
    },
    handleReset() {
      this.$refs.formAdapter.reset()
      this.$message.info('表单已重置')
    }
  }
}
</script>

<style scoped>
.basic-form {
  padding: 20px;
}
pre {
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>
