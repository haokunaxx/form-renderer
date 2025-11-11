import { ref, watch, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { ValueTransformer } from '../types'

/**
 * 字段组件 Props 类型
 */
export interface FieldComponentProps {
  modelValue: any
  disabled?: boolean
  readonly?: boolean
  placeholder?: string
  [key: string]: any
}

/**
 * 字段组件 Emits 类型
 */
export interface FieldComponentEmits {
  (e: 'update:modelValue', value: any): void
  (e: 'change', value: any): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}

/**
 * useFieldComponent 选项
 */
export interface UseFieldComponentOptions {
  props: FieldComponentProps
  emit: FieldComponentEmits
  valueTransformer?: ValueTransformer
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

/**
 * useFieldComponent 返回值
 */
export interface UseFieldComponentReturn {
  internalValue: Ref<any>
  isDisabled: ComputedRef<boolean>
  handleChange: (value: any) => void
  handleFocus: (event: FocusEvent) => void
  handleBlur: (event: FocusEvent) => void
}

/**
 * 字段组件开发辅助函数
 * 提供标准的值处理、事件处理逻辑
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useFieldComponent } from '@form-renderer/adapter-vue3-vue'
 *
 * const props = defineProps<FieldComponentProps>()
 * const emit = defineEmits<FieldComponentEmits>()
 *
 * const { internalValue, handleChange, handleFocus, handleBlur, isDisabled } =
 *   useFieldComponent({ props, emit })
 * </script>
 * ```
 */
export function useFieldComponent(
  options: UseFieldComponentOptions
): UseFieldComponentReturn {
  const { props, emit, valueTransformer } = options

  // 内部值
  const internalValue = ref(props.modelValue)

  // 同步外部值变化
  watch(
    () => props.modelValue,
    (newValue) => {
      // 应用转换器（如果有）
      internalValue.value =
        valueTransformer?.toComponent?.(newValue) ?? newValue
    },
    { immediate: true }
  )

  // 是否禁用
  const isDisabled = computed(() => {
    return Boolean(props.disabled || props.readonly)
  })

  /**
   * 处理值变化
   */
  const handleChange = (value: any) => {
    // 应用转换器（如果有）
    const transformedValue = valueTransformer?.fromComponent?.(value) ?? value

    // 更新内部值
    internalValue.value = transformedValue

    // 触发事件
    emit('update:modelValue', transformedValue)
    emit('change', transformedValue)

    // 可选：变化时校验
    if (options.validateOnChange) {
      // TODO: 触发校验
    }
  }

  /**
   * 处理聚焦
   */
  const handleFocus = (event: FocusEvent) => {
    emit('focus', event)
  }

  /**
   * 处理失焦
   */
  const handleBlur = (event: FocusEvent) => {
    emit('blur', event)

    // 可选：失焦时校验
    if (options.validateOnBlur) {
      // TODO: 触发校验
    }
  }

  return {
    internalValue,
    isDisabled,
    handleChange,
    handleFocus,
    handleBlur
  }
}

/**
 * 创建标准的字段组件 Props 定义
 */
export function createFieldProps() {
  return {
    modelValue: {
      type: [String, Number, Boolean, Array, Object, Date],
      default: undefined
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: ''
    }
  }
}

/**
 * 创建标准的字段组件 Emits 定义
 */
export function createFieldEmits(): Array<
  'update:modelValue' | 'change' | 'focus' | 'blur'
> {
  return ['update:modelValue', 'change', 'focus', 'blur']
}
