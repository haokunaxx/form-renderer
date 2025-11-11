<template>
  <component
    v-if="needFormItem && FormItem"
    :is="FormItem"
    v-bind="formItemProps"
    :class="formItemClass"
  >
    <component
      :is="fieldComponent"
      v-model="componentValue"
      v-bind="componentProps"
      v-on="componentEvents"
    />
  </component>

  <component
    v-else
    :is="fieldComponent"
    v-model="componentValue"
    v-bind="componentProps"
    v-on="componentEvents"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import type { RenderNode } from '@form-renderer/engine'
import type { RenderContext } from '../../types'
import { getEventMapping } from '../../utils/component'
import { getValueByPath } from '../../utils'

interface Props {
  node: RenderNode
  context: RenderContext
}

interface Emits {
  (
    e: 'field-change',
    event: { path: string; value: any; component: string }
  ): void
  (e: 'field-blur', event: { path: string; event: FocusEvent }): void
  (e: 'field-focus', event: { path: string; event: FocusEvent }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 获取组件定义
const componentDef = computed(() =>
  props.context.registry.get(props.node.component || '')
)

// 字段组件
const fieldComponent = computed(() => componentDef.value?.component)

// FormItem 组件（如果需要）
const FormItem = computed(() =>
  componentDef.value?.needFormItem ? props.context.formItem : null
)

const needFormItem = computed(() => componentDef.value?.needFormItem ?? true)

// 【核心机制】标记是否是用户操作
const isUserAction = ref(true)

// 【方案 A】从 model 中获取字段值
// 注意：不是从 node.value，因为 RenderNode 设计上不包含运行时的值
const fieldValue = computed(() => {
  const model = props.context.engine.getModel().value

  return getValueByPath(model, props.node.path)
})

// 组件值（与组件 v-model 绑定，经过 transformer.toComponent 转换）
const componentValue = ref()

// 监听 engine model 中的字段值变化
watch(
  fieldValue,
  async (newValue) => {
    // 标记为非用户操作
    isUserAction.value = false

    // 应用值转换器（Engine → Component）
    const transformer = componentDef.value?.valueTransformer
    componentValue.value = transformer?.toComponent?.(newValue) ?? newValue

    // 下一个 tick 恢复标记
    await nextTick()
    isUserAction.value = true
  },
  { immediate: true }
)

// 组件属性
const componentProps = computed(() => {
  // 优先使用 computed 中计算好的 componentProps（函数式 componentProps）
  const dynamicProps =
    props.node.computed?.componentProps || props.node.componentProps

  return {
    ...componentDef.value?.defaultProps,
    ...dynamicProps,
    disabled: props.node.computed?.disabled,
    readonly: props.node.computed?.readonly,
    placeholder: props.node.placeholder
  }
})

// FormItem 属性
const formItemProps = computed(() => {
  // 调用转换函数生成 rules（如果提供了 ruleConverter）
  const rules = props.context.ruleConverter?.(
    props.node,
    props.node.computed || {},
    props.context // 传递 context，让转换器能访问 engine
  )

  // 优先使用 computed 中计算好的 formItemProps（函数式 formItemProps）
  const dynamicProps =
    props.node.computed?.formItemProps || props.node.formItemProps

  return {
    label: props.node.label,
    name: props.node.path, // 用于 el-form 的 prop
    required: props.node.computed?.required,
    rules: rules, // 传递转换后的 rules
    ...dynamicProps
  }
})

// FormItem 类名
const formItemClass = computed(() => {
  const classes: string[] = []
  if (props.node.computed?.show === false) {
    classes.push('hidden')
  }
  return classes
})

// 核心事件列表（需要通知 Engine 的事件）
const CORE_EVENTS = ['onChange', 'onInput', 'onFocus', 'onBlur']

// 获取事件映射配置
const eventMapping = computed(() => {
  if (!componentDef.value) {
    return {
      onChange: 'update:modelValue',
      onInput: 'input',
      onFocus: 'focus',
      onBlur: 'blur'
    }
  }
  return componentDef.value?.eventMapping || getEventMapping(componentDef.value)
})

// 动态构建组件事件绑定
const componentEvents = computed(() => {
  const events: Record<string, any> = {}

  // 1. 处理核心事件（通过 eventMapping 映射）
  if (eventMapping.value.onChange) {
    events[eventMapping.value.onChange] = handleChange
  }

  if (eventMapping.value.onFocus) {
    events[eventMapping.value.onFocus] = handleFocus
  }

  if (eventMapping.value.onBlur) {
    events[eventMapping.value.onBlur] = handleBlur
  }

  if (eventMapping.value.onInput) {
    events[eventMapping.value.onInput] = handleInput
  }

  // 2. 处理字段级自定义事件（从 componentProps 中提取）
  const customProps = props.node.componentProps || {}
  Object.keys(customProps).forEach((key) => {
    // 只处理 onXxx 格式的事件处理器
    if (key.startsWith('on') && typeof customProps[key] === 'function') {
      // 排除已经被核心事件处理的
      if (!CORE_EVENTS.includes(key)) {
        // 转换为组件事件名：onKeydown -> keydown
        const eventName = key.slice(2).toLowerCase()
        events[eventName] = customProps[key]
      }
    }
  })

  return events
})

// 处理值变化
// 🔥 智能检测事件参数类型，兼容原生事件对象和 UI 组件库的直接值
const handleChange = (eventValue: any) => {
  let value: any
  // 智能检测：如果是原生事件对象，从 target.value 提取
  if (eventValue && eventValue.target && 'value' in eventValue.target) {
    value = eventValue.target.value
  } else {
    // 否则认为就是值本身（UI 组件库的标准做法）
    value = eventValue
  }

  // 只有用户操作才通知 engine
  if (isUserAction.value) {
    // 应用值转换器（Component → Engine）
    const transformer = componentDef.value?.valueTransformer
    const engineValue = transformer?.fromComponent?.(value) ?? value

    // 触发事件
    emit('field-change', {
      path: props.node.path,
      value: engineValue,
      component: props.node.component || ''
    })
  }
}

// 处理 input 事件（某些组件需要，如实时搜索）
const handleInput = (eventValue: any) => {
  let value: any

  // 智能检测：如果是原生事件对象，从 target.value 提取
  if (eventValue && eventValue.target && 'value' in eventValue.target) {
    value = eventValue.target.value
  } else {
    // 否则认为就是值本身（UI 组件库的标准做法）
    value = eventValue
  }

  if (isUserAction.value) {
    // 应用值转换器（Component → Engine）
    const transformer = componentDef.value?.valueTransformer
    const engineValue = transformer?.fromComponent?.(value) ?? value

    emit('field-change', {
      path: props.node.path,
      value: engineValue,
      component: props.node.component || ''
    })
  }
}

// 处理焦点事件
const handleBlur = (event: FocusEvent) => {
  emit('field-blur', { path: props.node.path, event })
}

const handleFocus = (event: FocusEvent) => {
  emit('field-focus', { path: props.node.path, event })
}
</script>

<style scoped>
.hidden {
  display: none;
}
</style>
