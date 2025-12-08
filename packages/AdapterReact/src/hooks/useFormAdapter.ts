import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore
} from 'react'
import { StateEngine, createStateEngine } from '../core/StateEngine'
import {
  ComponentRegistry,
  createComponentRegistry
} from '../core/ComponentRegistry'
import { EventHandler, createEventHandler } from '../core/EventHandler'
import type {
  UseFormAdapterOptions,
  UseFormAdapterReturn,
  ComponentDefinition,
  ComponentPreset,
  ListOperator,
  ValidationErrors
} from '../types'

/**
 * useFormAdapter Hook
 * 提供表单适配器的完整功能，包括状态管理和操作方法
 */
const initialStateSnapshot = { renderSchema: {} as any, model: {} }

export function useFormAdapter(
  options: UseFormAdapterOptions
): UseFormAdapterReturn {
  const {
    schema,
    model: initialModel,
    components,
    onSubmit,
    onChange,
    onValidate,
    onReady
  } = options

  // 使用 ref 存储引擎实例（避免重新创建）
  const engineRef = useRef<StateEngine>()
  const registryRef = useRef<ComponentRegistry>()
  const eventHandlerRef = useRef<EventHandler>()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors | undefined>()
  // const initialModelRef = useRef(initialModel)
  // 初始化引擎
  useEffect(() => {
    // 创建 ComponentRegistry
    const registry = createComponentRegistry()
    if (components) {
      if (Array.isArray(components)) {
        registry.registerBatch(components)
      } else {
        registry.registerPreset(components)
      }
    }
    registryRef.current = registry

    // 创建 StateEngine
    const engine = createStateEngine({
      schema,
      model: initialModel
    })
    engineRef.current = engine

    // 创建 EventHandler
    const eventHandler = createEventHandler(engine, registry, {
      onTransformError: (error, path, value) => {
        console.error('Transform error:', { error, path, value })
      },
      onUpdateError: (error, path, value) => {
        console.error('Update error:', { error, path, value })
      }
    })
    eventHandlerRef.current = eventHandler

    // 触发 ready 回调
    onReady?.(engine)

    // 清理函数
    return () => {
      eventHandler.destroy()
      engine.destroy()
    }
  }, []) // 只在挂载时初始化一次

  // 使用 useSyncExternalStore 订阅状态变化
  const state = useSyncExternalStore(
    useCallback((callback: any) => {
      if (engineRef.current) {
        return engineRef.current.subscribe(callback)
      }
      return () => {}
    }, []),
    useCallback(() => {
      if (engineRef.current) {
        const snapshot = engineRef.current.getSnapshot()
        return snapshot
      }
      return initialStateSnapshot
    }, [])
  )

  // 获取值
  const getValue = useCallback((path?: string) => {
    return engineRef.current?.getValue(path)
  }, [])

  // 更新单个字段值
  const updateValue = useCallback(
    (path: string, value: any) => {
      engineRef.current?.updateValue(path, value)
      onChange?.({ path, value })
    },
    [onChange]
  )

  // 批量更新字段值
  const updateValues = useCallback(
    (values: Record<string, any>) => {
      engineRef.current?.updateValue(values)
      // 触发每个字段的 onChange
      Object.entries(values).forEach(([path, value]) => {
        onChange?.({ path, value })
      })
    },
    [onChange]
  )

  // 校验表单
  const validate = useCallback(
    async (paths?: string[]) => {
      if (!engineRef.current) {
        return { ok: false, errors: [], errorByPath: {} } as any
      }

      setLoading(true)
      try {
        const result = await engineRef.current.validate(paths)

        // 更新错误状态
        if (result === true || result.ok === true) {
          setErrors(undefined)
        } else if ('errors' in result) {
          setErrors(result as ValidationErrors)
        }

        onValidate?.(result)
        return result
      } catch (error) {
        console.error('Validation error:', error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [onValidate]
  )

  // 提交表单
  const submit = useCallback(async () => {
    const result = await validate()

    if (result === true || (typeof result === 'object' && result.ok === true)) {
      const currentModel = engineRef.current?.getModel()
      if (currentModel && onSubmit) {
        setLoading(true)
        try {
          await onSubmit(currentModel)
        } finally {
          setLoading(false)
        }
      }
    }
  }, [validate, onSubmit])

  // 重置表单
  const reset = useCallback((target?: any | 'default') => {
    engineRef.current?.reset(target)
    setErrors(undefined)
  }, [])

  // 立即刷新（等待 Engine 的微任务批量完成）
  const flush = useCallback(async () => {
    await engineRef.current?.waitFlush()
  }, [])

  // 注册单个组件
  const registerComponent = useCallback((definition: ComponentDefinition) => {
    registryRef.current?.register(definition)
  }, [])

  // 批量注册组件
  const registerComponents = useCallback(
    (definitions: ComponentDefinition[]) => {
      registryRef.current?.registerBatch(definitions)
    },
    []
  )

  // 注册组件预设
  const registerPreset = useCallback((preset: ComponentPreset) => {
    registryRef.current?.registerPreset(preset)
  }, [])

  // 获取列表操作器
  const getListOperator = useCallback(
    (path: string): ListOperator | undefined => {
      return engineRef.current?.getListOperator(path)
    },
    []
  )

  return {
    renderSchema: state.renderSchema,
    model: state.model,
    engine: engineRef.current,
    registry: registryRef.current,
    eventHandler: eventHandlerRef.current,
    loading,
    errors,
    getValue,
    updateValue,
    updateValues,
    validate,
    submit,
    reset,
    flush,
    registerComponent,
    registerComponents,
    registerPreset,
    getListOperator
  }
}
