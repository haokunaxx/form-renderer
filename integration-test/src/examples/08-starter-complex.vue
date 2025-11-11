<template>
  <div class="example-section">
    <div class="section-header">
      <h2>08. StarterElementPlus - 复杂表单</h2>
      <p class="description">
        展示 StarterElementPlus 对各种字段类型的支持，包括日期、级联、评分等
      </p>
    </div>

    <el-card class="example-card">
      <template #header>
        <div class="card-header">
          <span>完整的用户档案表单</span>
          <div>
            <el-button size="small" @click="handleReset">重置</el-button>
            <el-button size="small" @click="handleFillDemo">填充示例</el-button>
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
            v-model:model="formData"
            :schema="formSchema"
            @change="handleChange"
          />
        </div>

        <div class="data-display">
          <div class="display-header">
            <h4>表单数据</h4>
            <el-tag size="small">实时更新</el-tag>
          </div>
          <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
        </div>
      </div>
    </el-card>

    <div class="stats-box">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="字段类型" :value="12">
            <template #suffix>种</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="表单项"
            :value="Object.keys(formSchema.properties || {}).length"
          />
        </el-col>
        <el-col :span="6">
          <el-statistic title="变更次数" :value="changeCount" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="代码量" value="~50">
            <template #suffix>行</template>
          </el-statistic>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { FormRenderer } from '@form-renderer/starter-element-plus'
import type { FormSchema } from '@form-renderer/engine'
import { ElMessage } from 'element-plus'

const formRef = ref()
const changeCount = ref(0)

const formData = reactive({
  name: '',
  bio: '',
  skills: [],
  birthday: '',
  city: [],
  rating: 0,
  color: '#409eff',
  workTime: '',
  salary: 0,
  notification: 'all',
  vip: false
})

const formSchema: FormSchema = {
  type: 'form',
  component: 'form',
  componentProps: {
    labelWidth: '120px'
  },
  properties: {
    name: {
      type: 'field',
      component: 'input',
      formItemProps: {
        label: '姓名',
        required: true
      },
      componentProps: {
        placeholder: '请输入姓名',
        clearable: true
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
        rows: 4,
        showWordLimit: true,
        maxlength: 200
      }
    },
    skills: {
      type: 'field',
      component: 'checkbox-group',
      formItemProps: {
        label: '技能'
      },
      componentProps: {
        options: [
          { label: 'Vue.js', value: 'vue' },
          { label: 'React', value: 'react' },
          { label: 'Angular', value: 'angular' },
          { label: 'Node.js', value: 'nodejs' },
          { label: 'Python', value: 'python' }
        ]
      }
    },
    birthday: {
      type: 'field',
      component: 'date-picker',
      formItemProps: {
        label: '生日'
      },
      componentProps: {
        type: 'date',
        placeholder: '请选择日期',
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD'
      }
    },
    city: {
      type: 'field',
      component: 'cascader',
      formItemProps: {
        label: '所在城市'
      },
      componentProps: {
        placeholder: '请选择城市',
        options: [
          {
            value: 'guangdong',
            label: '广东省',
            children: [
              { value: 'guangzhou', label: '广州市' },
              { value: 'shenzhen', label: '深圳市' },
              { value: 'dongguan', label: '东莞市' }
            ]
          },
          {
            value: 'jiangsu',
            label: '江苏省',
            children: [
              { value: 'nanjing', label: '南京市' },
              { value: 'suzhou', label: '苏州市' },
              { value: 'wuxi', label: '无锡市' }
            ]
          },
          {
            value: 'zhejiang',
            label: '浙江省',
            children: [
              { value: 'hangzhou', label: '杭州市' },
              { value: 'ningbo', label: '宁波市' },
              { value: 'wenzhou', label: '温州市' }
            ]
          }
        ]
      }
    },
    rating: {
      type: 'field',
      component: 'rate',
      formItemProps: {
        label: '满意度'
      },
      componentProps: {
        showScore: true,
        texts: ['极差', '失望', '一般', '满意', '惊喜']
      }
    },
    color: {
      type: 'field',
      component: 'color-picker',
      formItemProps: {
        label: '喜欢的颜色'
      },
      componentProps: {
        showAlpha: true,
        predefine: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399']
      }
    },
    workTime: {
      type: 'field',
      component: 'time-picker',
      formItemProps: {
        label: '工作时间'
      },
      componentProps: {
        isRange: true,
        format: 'HH:mm',
        valueFormat: 'HH:mm'
      }
    },
    salary: {
      type: 'field',
      component: 'slider',
      formItemProps: {
        label: '期望薪资 (K)'
      },
      componentProps: {
        min: 5,
        max: 50,
        step: 1,
        showInput: true
      }
    },
    notification: {
      type: 'field',
      component: 'select',
      formItemProps: {
        label: '通知设置'
      },
      componentProps: {
        placeholder: '请选择通知方式',
        options: [
          { label: '全部通知', value: 'all' },
          { label: '仅重要通知', value: 'important' },
          { label: '关闭通知', value: 'none' }
        ]
      }
    },
    vip: {
      type: 'field',
      component: 'switch',
      formItemProps: {
        label: 'VIP 会员'
      },
      componentProps: {
        activeText: '是',
        inactiveText: '否'
      }
    }
  }
}

const handleChange = (data: any) => {
  changeCount.value++
  console.log('表单数据变更:', data)
}

const handleReset = () => {
  formRef.value?.reset()
  changeCount.value = 0
  ElMessage.success('表单已重置')
}

const handleFillDemo = () => {
  Object.assign(formData, {
    name: '张三',
    bio: '热爱编程，专注前端开发，有5年工作经验',
    skills: ['vue', 'react', 'nodejs'],
    birthday: '1995-06-15',
    city: ['guangdong', 'shenzhen'],
    rating: 4,
    color: '#67c23a',
    workTime: ['09:00', '18:00'],
    salary: 25,
    notification: 'important',
    vip: true
  })
  ElMessage.success('已填充示例数据')
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
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
  min-height: 600px;
}

.data-display {
  overflow: auto;
  padding: 15px;
  height: fit-content;
  max-height: 600px;
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
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
}

.stats-box {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

@media (width <= 1024px) {
  .form-content {
    grid-template-columns: 1fr;
  }
}
</style>
