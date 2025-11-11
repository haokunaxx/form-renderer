import { ref, shallowRef, computed, onMounted, onBeforeUnmount } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type {
  FormSchema,
  FormModel,
  RenderSchema,
  ValidationResult,
  ListOperator
} from '@form-renderer/engine'
import {
  ReactiveEngine,
  ComponentRegistry,
  EventHandler,
  createReactiveEngine,
  createComponentRegistry,
  createEventHandler
} from '../core'
import type { ReactiveEngineOptions, EventHandlerOptions } from '../core'
import type { ComponentDefinition, ComponentPreset } from '../types'

/**
 * useFormAdapter 选项
 */
export interface UseFormAdapterOptions {
  /**
   * 表单 Schema
   */
  schema: FormSchema

  /**
   * 表单数据
   */
  model?: FormModel

  /**
   * 组件定义
   */
  components?: ComponentDefinition[] | ComponentPreset

  /**
   * 引擎配置
   */
  engineOptions?: Partial<ReactiveEngineOptions>

  /**
   * 事件处理器配置
   */
  eventHandlerOptions?: EventHandlerOptions

  /**
   * 初始化完成回调
   */
  onReady?: (engine: ReactiveEngine) => void

  /**
   * 值变化回调
   */
  onChange?: (event: { path: string; value: any }) => void

  /**
   * 校验完成回调
   */
  onValidate?: (result: ValidationResult) => void

  /**
   * 提交回调
   */
  onSubmit?: (model: FormModel) => Promise<void> | void
}

/**
 * 校验错误类型
 */
export interface ValidationErrors {
  [path: string]: string[]
}

/**
 * useFormAdapter 返回值
 */
export interface UseFormAdapterReturn {
  // 状态（只读）
  engine: Readonly<Ref<ReactiveEngine | undefined>>
  registry: Readonly<Ref<ComponentRegistry | undefined>>
  eventHandler: Readonly<Ref<EventHandler | undefined>>
  renderSchema: ComputedRef<RenderSchema | undefined>
  model: ComputedRef<FormModel | undefined>
  loading: Readonly<Ref<boolean>>
  errors: Readonly<Ref<ValidationErrors | undefined>>

  // 方法
  init: () => Promise<void>
  getValue: (path?: string) => any
  updateValue: (path: string, value: any) => void
  updateValues: (values: Record<string, any>) => void
  validate: (paths?: string[]) => Promise<ValidationResult>
  submit: () => Promise<void>
  reset: () => void
  destroy: () => void

  // 组件注册
  registerComponent: (def: ComponentDefinition) => void
  registerComponents: (defs: ComponentDefinition[]) => void
  registerPreset: (preset: ComponentPreset) => void

  // 列表操作
  getListOperator: (path: string) => ListOperator | undefined
}

/**
 * 表单适配器组合式函数
 * 提供编程式的表单管理能力
 *
 * @example
 * ```typescript
 * const {
 *   renderSchema,
 *   model,
 *   validate,
 *   submit,
 *   reset
 * } = useFormAdapter({
 *   schema: mySchema,
 *   model: myModel,
 *   components: ElementPlusPreset,
 *   onSubmit: async (data) => {
 *     await api.submit(data)
 *   }
 * })
 * ```
 */
export function useFormAdapter(
  options: UseFormAdapterOptions
): UseFormAdapterReturn {
  // 核心模块实例
  const engine = shallowRef<ReactiveEngine>()
  const registry = shallowRef<ComponentRegistry>()
  const eventHandler = shallowRef<EventHandler>()

  // 状态
  const loading = ref(false)
  const errors = ref<ValidationErrors>()

  // 计算属性
  const renderSchema = computed(
    () => engine.value?.getRenderSchema().value as RenderSchema | undefined
  )
  const model = computed(() => engine.value?.getModel().value)

  /**
   * 初始化
   */
  const init = async (): Promise<void> => {
    // 1. 创建组件注册表
    registry.value = createComponentRegistry()

    // 2. 注册组件
    if (options.components) {
      if (Array.isArray(options.components)) {
        registry.value.registerBatch(options.components)
      } else {
        registry.value.registerPreset(options.components)
      }
    }

    // 3. 创建响应式引擎
    engine.value = createReactiveEngine({
      schema: options.schema,
      model: options.model,
      ...options.engineOptions
    })

    // 4. 创建事件处理器
    eventHandler.value = createEventHandler(
      engine.value,
      registry.value,
      options.eventHandlerOptions
    )

    // 5. 触发 ready 回调
    if (engine.value) {
      options.onReady?.(engine.value)
    }
  }

  /**
   * 获取值
   */
  const getValue = (path?: string): any => {
    if (!engine.value) return undefined

    if (path) {
      return engine.value.getEngine().getValue(path)
    }
    return engine.value.getModel().value
  }

  /**
   * 更新单个字段值
   */
  const updateValue = (path: string, value: any): void => {
    if (!engine.value) {
      console.warn('Engine not initialized')
      return
    }

    engine.value.updateValue(path, value)
    options.onChange?.({ path, value })
  }

  /**
   * 批量更新字段值
   */
  const updateValues = (values: Record<string, any>): void => {
    if (!engine.value) {
      console.warn('Engine not initialized')
      return
    }

    engine.value.updateValue(values)

    // 通知每个变化
    Object.entries(values).forEach(([path, value]) => {
      options.onChange?.({ path, value })
    })
  }

  /**
   * 校验表单
   */
  const validate = async (paths?: string[]): Promise<ValidationResult> => {
    if (!engine.value) {
      return { ok: false, errors: [], errorByPath: {} } as ValidationResult
    }

    loading.value = true

    try {
      const result = (await engine.value.validate(paths)) as ValidationResult

      if (result === true) {
        errors.value = undefined
      } else {
        // 转换错误格式
        const errorMap: Record<string, string[]> = {}
        if (Array.isArray(result.errors)) {
          result.errors.forEach((err: { path: string; message: string }) => {
            if (!errorMap[err.path]) {
              errorMap[err.path] = []
            }
            errorMap[err.path].push(err.message)
          })
        }
        errors.value = errorMap as ValidationErrors
      }

      options.onValidate?.(result)
      return result
    } finally {
      loading.value = false
    }
  }

  /**
   * 提交表单
   */
  const submit = async (): Promise<void> => {
    // 先校验
    const result = await validate()

    if (result === true && model.value) {
      loading.value = true
      try {
        await options.onSubmit?.(model.value)
      } catch (error) {
        console.error('Submit error:', error)
        throw error
      } finally {
        loading.value = false
      }
    }
  }

  /**
   * 重置表单
   */
  const reset = (): void => {
    engine.value?.reset()
    errors.value = undefined
  }

  /**
   * 注册单个组件
   */
  const registerComponent = (definition: ComponentDefinition): void => {
    registry.value?.register(definition)
  }

  /**
   * 批量注册组件
   */
  const registerComponents = (definitions: ComponentDefinition[]): void => {
    registry.value?.registerBatch(definitions)
  }

  /**
   * 注册组件预设
   */
  const registerPreset = (preset: ComponentPreset): void => {
    registry.value?.registerPreset(preset)
  }

  /**
   * 获取列表操作器
   */
  const getListOperator = (path: string): ListOperator | undefined => {
    return engine.value?.getListOperator(path) as ListOperator | undefined
  }

  /**
   * 销毁
   */
  const destroy = (): void => {
    eventHandler.value?.destroy()
    engine.value?.destroy()
    errors.value = undefined
  }

  // 生命周期管理
  onMounted(() => {
    init()
  })

  onBeforeUnmount(() => {
    destroy()
  })

  return {
    // 状态（只读）
    engine: engine as Readonly<typeof engine>,
    registry: registry as Readonly<typeof registry>,
    eventHandler: eventHandler as Readonly<typeof eventHandler>,
    renderSchema,
    model,
    loading: loading as Readonly<typeof loading>,
    errors: errors as Readonly<typeof errors>,

    // 方法
    init,
    getValue,
    updateValue,
    updateValues,
    validate,
    submit,
    reset,
    destroy,

    // 组件注册
    registerComponent,
    registerComponents,
    registerPreset,

    // 列表操作
    getListOperator
  }
}
