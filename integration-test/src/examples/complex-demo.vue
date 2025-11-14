<script setup lang="ts">
import { ref } from 'vue'
import type { FormModel, JsonSchemaNode } from '@form-renderer/engine'
import type { ComponentDefinition } from '@form-renderer/adapter-vue3'
import { commonFieldEventMapping } from '@form-renderer/preset-element-plus'
import { FormRenderer } from '@form-renderer/starter-element-plus'
import DynamicField from '@/custom/DynamicField.vue'

import { ComplexDemoSchema, ComplexDemoModel } from '@/cases'
const formRef = ref()

const formData = ref<FormModel>(ComplexDemoModel)
const formSchema = ref<JsonSchemaNode>(ComplexDemoSchema)
const extraComponents: ComponentDefinition[] = [
  {
    type: 'field',
    name: 'dynamic-field',
    component: DynamicField,
    valueTransformer: {
      //  TODO: 能够提供一些 Context?
      toComponent: (engineValue: any) => {
        return engineValue
      },
      fromComponent: (componentValue: any) => {
        return componentValue
      }
    },
    needFormItem: true,
    eventMapping: commonFieldEventMapping
  }
]
</script>

<template>
  <FormRenderer
    ref="formRef"
    v-model="formData"
    :schema="formSchema"
    :components="extraComponents"
  />

  <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
</template>
