/**
 * Component related types
 */

/**
 * Component type
 */
export type ComponentType = 'field' | 'layout' | 'list' | 'form'

/**
 * Value transformer
 */
export interface ValueTransformer<T = any, U = any> {
  /**
   * Transform engine value to component value
   */
  toComponent: (engineValue: T) => U

  /**
   * Transform component value to engine value
   */
  fromComponent: (componentValue: U) => T
}

/**
 * Event mapping
 */
export interface EventMapping {
  /**
   * Change event, default: 'update:modelValue' (Vue 3) or 'input' (Vue 2)
   */
  onChange?: string

  /**
   * Input event
   */
  onInput?: string

  /**
   * Focus event
   */
  onFocus?: string

  /**
   * Blur event
   */
  onBlur?: string
}

/**
 * Component definition
 */
export interface ComponentDefinition<T = any> {
  /**
   * Component name (unique identifier)
   */
  name: string

  /**
   * Vue component
   */
  component: any

  /**
   * Component type
   */
  type: ComponentType

  /**
   * Default props
   */
  defaultProps?: Record<string, any>

  /**
   * Value transformer
   */
  valueTransformer?: ValueTransformer<T>

  /**
   * Event mapping
   */
  eventMapping?: EventMapping

  /**
   * Whether needs FormItem wrapper
   */
  needFormItem?: boolean

  /**
   * Custom render function
   */
  customRender?: (props: any) => any
}

/**
 * Normalize options
 */
export interface NormalizeOptions {
  /**
   * Force type override
   */
  type?: ComponentType

  /**
   * Merge with default props
   */
  defaultProps?: Record<string, any>
}
