<template>
  <div class="form-adapter" :class="rootClass">
    <slot name="before-form" />

    <SchemaRenderer
      v-if="renderSchema && renderContext"
      ref="schemaRendererRef"
      :node="renderSchema"
      :context="renderContext"
      @field-change="handleFieldChange"
      @field-blur="handleFieldBlur"
      @field-focus="handleFieldFocus"
      @list-add="handleListAdd"
      @list-remove="handleListRemove"
      @list-move="handleListMove"
    />

    <slot name="after-form" />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  shallowRef,
  ref
} from 'vue'
import type { Component } from 'vue'
import type { ValidationResult, RenderNode } from '@form-renderer/engine'
import type { FormSchema, FormModel } from '../types'
import {
  ReactiveEngine,
  ComponentRegistry,
  EventHandler,
  createReactiveEngine,
  createComponentRegistry,
  createEventHandler
} from '../core'
import type {
  ComponentDefinition,
  ComponentPreset,
  RenderContext
} from '../types'
import SchemaRenderer from './SchemaRenderer.vue'

/**
 * FormAdapter Props
 */
interface Props {
  schema: FormSchema
  model?: FormModel
  components?: ComponentDefinition[] | ComponentPreset
  options?: {
    engine?: {
      enableUpdateScheduler?: boolean
    }
    eventHandler?: {
      enableBatch?: boolean
      batchDelay?: number
    }
    render?: {
      showRequiredAsterisk?: boolean
      labelAlign?: 'left' | 'right' | 'top'
      labelWidth?: string | number
    }
    formItem?: Component
    theme?: {
      size?: 'large' | 'default' | 'small'
      classPrefix?: string
    }
  }
}

/**
 * FormAdapter Emits
 */
interface Emits {
  (e: 'update:model', model: FormModel): void
  (e: 'change', event: { path: string; value: any }): void
  (e: 'field-blur', event: { path: string; event: FocusEvent }): void
  (e: 'field-focus', event: { path: string; event: FocusEvent }): void
  (
    e: 'list-change',
    event: { path: string; operation: string; [key: string]: any }
  ): void
  (e: 'validate', result: ValidationResult): void
  (e: 'submit', model: FormModel): void
  (e: 'ready', engine: ReactiveEngine): void
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({})
})
const emit = defineEmits<Emits>()

// 核心模块实例
const reactiveEngine = shallowRef<ReactiveEngine>()
const componentRegistry = shallowRef<ComponentRegistry>()
const eventHandler = shallowRef<EventHandler>()

// UI 表单引用
const schemaRendererRef = ref()

// 渲染数据
const renderSchema = computed(() => {
  const schema = reactiveEngine.value?.getRenderSchema().value
  // 由于 getRenderSchema 返回 DeepReadonly，这里需要类型断言
  return schema as RenderNode | undefined
})

// 渲染上下文
const renderContext = computed<RenderContext | null>(() => {
  if (
    !reactiveEngine.value ||
    !componentRegistry.value ||
    !eventHandler.value
  ) {
    return null
  }

  return {
    engine: reactiveEngine.value, // 传入 ReactiveEngine 实例，而不是原始的 FormEngine
    registry: componentRegistry.value,
    eventHandler: eventHandler.value,
    options: props.options,
    // formItem: props.options?.formItem,
    formItem:
      props.options?.formItem ??
      (!Array.isArray(props.components)
        ? (props.components as ComponentPreset)?.formItem
        : undefined),
    // 从 ComponentPreset 中提取 ruleConverter
    ruleConverter: !Array.isArray(props.components)
      ? (props.components as ComponentPreset)?.ruleConverter
      : undefined,
    path: [],
    depth: 0
  }
})

// 根元素类名
const rootClass = computed(() => {
  const classes: string[] = []

  if (props.options?.theme?.classPrefix) {
    classes.push(`${props.options.theme.classPrefix}form-adapter`)
  }

  if (props.options?.theme?.size) {
    classes.push(`size-${props.options.theme.size}`)
  }

  return classes
})

/**
 * 初始化
 */
const init = () => {
  // 1. 创建组件注册表
  componentRegistry.value = createComponentRegistry()

  // 2. 注册组件
  if (props.components) {
    if (Array.isArray(props.components)) {
      componentRegistry.value.registerBatch(props.components)
    } else {
      // ComponentPreset
      componentRegistry.value.registerPreset(props.components)
    }
  }

  // 3. 创建响应式引擎
  reactiveEngine.value = createReactiveEngine({
    schema: props.schema,
    model: props.model,
    enableUpdateScheduler: props.options?.engine?.enableUpdateScheduler
  })

  // 4. 创建事件处理器
  eventHandler.value = createEventHandler(
    reactiveEngine.value,
    componentRegistry.value,
    {
      enableBatch: props.options?.eventHandler?.enableBatch,
      batchDelay: props.options?.eventHandler?.batchDelay
    }
  )

  // 5. 监听 model 变化，向外通知
  watch(
    () => reactiveEngine.value?.getModel().value,
    (newModel) => {
      if (newModel) {
        emit('update:model', newModel)
      }
    }
    // 不需要 deep: true，因为 ModelManager 使用 immutable update，每次更新都会创建新的引用
  )
}

/**
 * 处理字段值变化
 */
const handleFieldChange = (event: {
  path: string
  value: any
  component: string
}) => {
  eventHandler.value?.handleFieldChange(
    event.path,
    event.value,
    event.component
  )
  emit('change', { path: event.path, value: event.value })
}

/**
 * 处理字段失焦
 */
const handleFieldBlur = (event: { path: string; event: FocusEvent }) => {
  eventHandler.value?.handleFieldBlur(event.path, event.event)
  emit('field-blur', event)
}

/**
 * 处理字段聚焦
 */
const handleFieldFocus = (event: { path: string; event: FocusEvent }) => {
  eventHandler.value?.handleFieldFocus(event.path, event.event)
  emit('field-focus', event)
}

/**
 * 处理列表添加
 */
const handleListAdd = (event: { path: string; value?: any }) => {
  eventHandler.value?.handleListAdd(event.path, event.value)
  emit('list-change', { path: event.path, operation: 'add' })
}

/**
 * 处理列表删除
 */
const handleListRemove = (event: { path: string; index: number }) => {
  eventHandler.value?.handleListRemove(event.path, event.index)
  emit('list-change', {
    path: event.path,
    operation: 'remove',
    index: event.index
  })
}

/**
 * 处理列表移动
 */
const handleListMove = (event: { path: string; from: number; to: number }) => {
  eventHandler.value?.handleListMove(event.path, event.from, event.to)
  emit('list-change', {
    path: event.path,
    operation: 'move',
    from: event.from,
    to: event.to
  })
}

/**
 * 获取值
 */
const getValue = (path?: string): any => {
  if (!reactiveEngine.value) return undefined

  if (path) {
    return reactiveEngine.value.getEngine().getValue(path)
  }
  return reactiveEngine.value.getModel().value
}

/**
 * 更新单个字段值
 */
const updateValue = (path: string, value: any): void => {
  reactiveEngine.value?.updateValue(path, value)
}

/**
 * 批量更新字段值
 */
const updateValues = (values: Record<string, any>): void => {
  reactiveEngine.value?.updateValue(values)
}

/**
 * 获取 UI 表单实例（如 Element Plus 的 el-form）
 */
const getUIFormInstance = (): any => {
  // 遍历 SchemaRenderer 找到 FormContainer，再找到 Form 组件
  const schemaRenderer = schemaRendererRef.value
  if (!schemaRenderer) return null

  // 获取 FormContainer
  const formContainer = schemaRenderer.containerRef
  if (formContainer) {
    // 获取 Form 组件实例
    return formContainer.formRef
  }

  return null
}

/**
 * 校验表单（使用 UI 框架的校验）
 *
 * 当使用了 ruleConverter 时，会优先使用 UI 框架（如 Element Plus）的校验
 * 否则使用 Engine 的校验
 */
const validate = async (paths?: string[]): Promise<ValidationResult> => {
  if (!reactiveEngine.value) {
    return {
      ok: false,
      errors: [],
      errorByPath: {}
    }
  }

  // 如果有 ruleConverter，尝试使用 UI 框架的校验
  const hasRuleConverter =
    !Array.isArray(props.components) &&
    (props.components as ComponentPreset)?.ruleConverter

  if (hasRuleConverter) {
    const uiForm = getUIFormInstance()
    if (uiForm && typeof uiForm.validate === 'function') {
      try {
        // 调用 Element Plus 的 validate
        const valid = await uiForm.validate()

        if (valid) {
          const result: ValidationResult = true
          emit('validate', result)
          return result
        }
      } catch (errors: any) {
        // Element Plus validate 失败时会抛出异常
        // 转换为 Engine 的 ValidationResult 格式
        const errorList: any[] = []
        const errorByPath: Record<string, any[]> = {}

        if (Array.isArray(errors)) {
          errors.forEach((err: any) => {
            const error = {
              path: err.field || '',
              message: err.message || '校验失败',
              code: 'VALIDATION_ERROR'
            }
            errorList.push(error)
            if (!errorByPath[error.path]) {
              errorByPath[error.path] = []
            }
            errorByPath[error.path].push(error)
          })
        }

        const result: ValidationResult = {
          ok: false,
          errors: errorList,
          errorByPath
        }
        emit('validate', result)
        return result
      }
    }
  }

  // 回退到 Engine 的校验
  const result = await reactiveEngine.value.validate(paths)
  emit('validate', result as ValidationResult)
  return result as ValidationResult
}

/**
 * 提交表单
 */
const submit = async (): Promise<void> => {
  const result = await validate()

  if (result === true) {
    const model = reactiveEngine.value?.getModel().value
    if (model) {
      emit('submit', model)
    }
  }
}

/**
 * 重置表单
 * @param target - 重置目标
 *   - 不传：重置到初始状态
 *   - 'default'：重置到 schema 的 defaultValue
 *   - 具体对象：重置到指定值
 */
const reset = async (target?: any | 'default'): Promise<void> => {
  await reactiveEngine.value?.reset(target)
}

/**
 * 注册单个组件
 */
const registerComponent = (definition: ComponentDefinition): void => {
  componentRegistry.value?.register(definition)
}

/**
 * 批量注册组件
 */
const registerComponents = (definitions: ComponentDefinition[]): void => {
  componentRegistry.value?.registerBatch(definitions)
}

/**
 * 注册组件预设
 */
const registerPreset = (preset: ComponentPreset): void => {
  componentRegistry.value?.registerPreset(preset)
}

/**
 * 获取列表操作器
 */
const getListOperator = (path: string) => {
  return reactiveEngine.value?.getListOperator(path)
}

/**
 * 滚动到指定字段（预留）
 */
const scrollToField = (path: string): void => {
  // TODO: 实现滚动到字段逻辑
  console.log('scrollToField:', path)
}

/**
 * 聚焦到指定字段（预留）
 */
const focusField = (path: string): void => {
  // TODO: 实现聚焦字段逻辑
  console.log('focusField:', path)
}

/**
 * 立即刷新批量更新
 */
const flush = (): void => {
  eventHandler.value?.flush()
  reactiveEngine.value?.flush()
}

/**
 * 等待刷新
 */
const waitFlush = async (): Promise<void> => {
  await reactiveEngine.value?.waitFlush()
}

/**
 * 销毁组件
 */
const destroy = (): void => {
  eventHandler.value?.destroy()
  reactiveEngine.value?.destroy()
}

// 监听 schema 变化
watch(
  () => props.schema,
  (newSchema) => {
    if (reactiveEngine.value && newSchema) {
      reactiveEngine.value.setFormSchema(newSchema)
    }
  },
  { deep: true }
)

// 生命周期钩子
onMounted(() => {
  init()

  if (reactiveEngine.value) {
    emit('ready', reactiveEngine.value)
  }
})

onBeforeUnmount(() => {
  destroy()
})

// 暴露 API
defineExpose({
  // 核心实例访问
  getEngine: () => reactiveEngine.value,
  getRegistry: () => componentRegistry.value,
  getEventHandler: () => eventHandler.value,

  // 数据操作
  getValue,
  updateValue,
  updateValues,

  // 列表操作
  getListOperator,

  // 校验
  validate,

  // 表单操作
  submit,
  reset,
  flush,

  // 组件注册
  registerComponent,
  registerComponents,
  registerPreset,

  // 工具方法
  scrollToField,
  focusField,
  waitFlush,

  // 生命周期
  destroy
})
</script>

<style scoped>
.form-adapter {
  width: 100%;
  box-sizing: border-box;
}

.size-large {
  font-size: 16px;
}

.size-default {
  font-size: 14px;
}

.size-small {
  font-size: 12px;
}
</style>
