<template>
  <div class="all-widgets">
    <h2>所有组件示例</h2>
    <el-card>
      <form-adapter
        :schema="schema"
        :model="formData"
        :components="elementUIPreset"
        @change="handleChange"
      />
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
  name: 'AllWidgets',
  components: {
    FormAdapter
  },
  data() {
    return {
      elementUIPreset: ElementUIPreset,
      formData: {
        input: '',
        textarea: '',
        number: 0,
        switch: false,
        checkboxGroup: [],
        radioGroup: '',
        select: '',
        cascader: [],
        datePicker: '',
        timePicker: '',
        slider: 50,
        rate: 0,
        colorPicker: '#409EFF'
      },
      schema: {
        type: 'form',
        component: 'form',
        componentProps: {
          labelWidth: '120px'
        },
        properties: {
          input: {
            type: 'field',
            component: 'input',
            label: '单行输入',
            path: 'input',
            componentProps: {
              placeholder: '请输入文本'
            }
          },
          textarea: {
            type: 'field',
            component: 'textarea',
            label: '多行输入',
            path: 'textarea',
            componentProps: {
              placeholder: '请输入多行文本',
              rows: 3
            }
          },
          number: {
            type: 'field',
            component: 'number',
            label: '数字输入',
            path: 'number',
            componentProps: {
              min: 0,
              max: 100
            }
          },
          switch: {
            type: 'field',
            component: 'switch',
            label: '开关',
            path: 'switch'
          },
          checkboxGroup: {
            type: 'field',
            component: 'checkbox-group',
            label: '多选框',
            path: 'checkboxGroup',
            componentProps: {
              options: [
                { label: '选项1', value: '1' },
                { label: '选项2', value: '2' },
                { label: '选项3', value: '3' }
              ]
            }
          },
          radioGroup: {
            type: 'field',
            component: 'radio-group',
            label: '单选框',
            path: 'radioGroup',
            componentProps: {
              options: [
                { label: '选项A', value: 'a' },
                { label: '选项B', value: 'b' },
                { label: '选项C', value: 'c' }
              ]
            }
          },
          select: {
            type: 'field',
            component: 'select',
            label: '下拉选择',
            path: 'select',
            componentProps: {
              options: [
                { label: 'Apple', value: 'apple' },
                { label: 'Banana', value: 'banana' },
                { label: 'Orange', value: 'orange' }
              ]
            }
          },
          cascader: {
            type: 'field',
            component: 'cascader',
            label: '级联选择',
            path: 'cascader',
            componentProps: {
              options: [
                {
                  value: 'zhejiang',
                  label: '浙江',
                  children: [
                    { value: 'hangzhou', label: '杭州' },
                    { value: 'ningbo', label: '宁波' }
                  ]
                },
                {
                  value: 'jiangsu',
                  label: '江苏',
                  children: [
                    { value: 'nanjing', label: '南京' },
                    { value: 'suzhou', label: '苏州' }
                  ]
                }
              ]
            }
          },
          datePicker: {
            type: 'field',
            component: 'date-picker',
            label: '日期选择',
            path: 'datePicker'
          },
          timePicker: {
            type: 'field',
            component: 'time-picker',
            label: '时间选择',
            path: 'timePicker'
          },
          slider: {
            type: 'field',
            component: 'slider',
            label: '滑块',
            path: 'slider'
          },
          rate: {
            type: 'field',
            component: 'rate',
            label: '评分',
            path: 'rate'
          },
          colorPicker: {
            type: 'field',
            component: 'color-picker',
            label: '颜色选择',
            path: 'colorPicker'
          }
        }
      }
    }
  },
  methods: {
    handleChange(data) {
      console.log('表单数据变更:', data)
    }
  }
}
</script>

<style scoped>
.all-widgets {
  padding: 20px;
}
pre {
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>
