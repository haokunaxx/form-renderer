<template>
  <FormAdapter
    ref="adapterInstance"
    :schema="schema"
    v-model:model="internalModel"
    :components="computedComponents"
    :disabled="disabled"
    @change="handleChange"
    @validate-error="handleValidateError"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { FormAdapter } from '@form-renderer/adapter-vue3'
import { ElementPlusPreset } from '@form-renderer/preset-element-plus'
import type {
  FormRendererProps,
  FormRendererEmits,
  FormRendererExposed,
  ValidationError
} from './types'
import type { FormModel } from '@form-renderer/engine'

const props = withDefaults(defineProps<FormRendererProps>(), {
  disabled: false,
  size: 'default'
})

const emit = defineEmits<FormRendererEmits>()

// 内部数据模型
const internalModel = ref<FormModel>(props.modelValue || {})

// 组件注册表（优先使用用户提供的，否则使用默认预设）
// const componentRegistry = computed(() => {
//   return props.components || ElementPlusPreset
// })

// const builtInComponentPreset = computed(() => {
//   return ElementPlusPreset
// })

const computedComponents = computed(() => {
  if (!props.components) {
    return ElementPlusPreset
  }

  // 如果是数组，转换为 ComponentPreset 格式并与默认预设合并
  if (Array.isArray(props.components)) {
    return {
      ...ElementPlusPreset,
      components: [...ElementPlusPreset.components, ...props.components]
    }
  }

  // 如果是完整的 ComponentPreset 对象，合并组件定义，保留用户的其他配置
  return {
    ...ElementPlusPreset,
    ...props.components,
    components: [
      ...ElementPlusPreset.components,
      ...props.components.components
    ]
  }
})

const adapterInstance = ref<typeof FormAdapter | null>(null)

// 监听外部 model 变化
watch(
  () => props.modelValue,
  (newModel) => {
    if (newModel) {
      internalModel.value = newModel
    }
  },
  { deep: true }
)

// 监听内部 model 变化，同步到外部
watch(
  internalModel,
  (newModel) => {
    emit('update:modelValue', newModel)
  },
  { deep: true }
)

// 处理表单变更事件
const handleChange = (data: { path: string; value: any }) => {
  emit('change', {
    path: data.path,
    value: data.value,
    model: internalModel.value
  })
}

// 处理验证错误事件
const handleValidateError = (errors: ValidationError[]) => {
  emit('validate-error', errors)
}

// TODO: 类型还是感觉哪里有不对的地方。需要再检查一下。

// 暴露给父组件的方法
defineExpose<FormRendererExposed>({
  getEngine: () => adapterInstance.value?.getEngine(),
  validate: () =>
    adapterInstance.value?.validate() ??
    Promise.resolve({ ok: false, errors: [], errorByPath: {} }),
  reset: () => adapterInstance.value?.reset('default'),
  getModel: () => adapterInstance.value?.getEngine()?.getValue() ?? {},
  setModel: (model: FormModel) => adapterInstance.value?.updateValues(model),
  waitFlush: () => adapterInstance.value?.waitFlush() ?? Promise.resolve()
})
</script>
