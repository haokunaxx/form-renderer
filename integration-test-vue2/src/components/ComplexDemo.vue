<template>
  <div class="complex-demo">
    <input type="text" @change="handleChange" @input="handleInput" />
    <Form :model="formData">
      <FormItem
        label="姓名"
        prop="name"
        :rules="[{ required: true, message: '此项不能为空', trigger: 'blur' }]"
      >
        <Input v-model="formData.name" clearable />
      </FormItem>
    </Form>
    <FormAdapter :schema="schema" :components="components" v-model="model" />
  </div>
</template>

<script>
import { FormAdapter } from '@form-renderer/adapter-vue2'
import { ComplexDemoSchema, ComplexDemoModel } from '../ComplexDemo'
import { ElementUIPreset } from '@form-renderer/preset-element-ui'
import { Form, FormItem, Input } from 'element-ui'
export default {
  name: 'ComplexDemo',
  components: {
    FormAdapter,
    Form,
    FormItem,
    Input
  },
  data() {
    return {
      schema: ComplexDemoSchema,
      model: ComplexDemoModel,
      components: ElementUIPreset,
      formData: {
        name: ''
      }
    }
  },
  methods: {
    handleChange(event) {
      console.log('handleChange', event)
    },
    handleInput(event) {
      console.log('handleInput', event)
    }
  },
  watch: {
    model(newModel, oldModel) {
      console.log('model', newModel, newModel === oldModel)
    }
  }
}
</script>
