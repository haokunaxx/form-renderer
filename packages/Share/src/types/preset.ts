/**
 * Component preset types
 */

import type { ComponentDefinition } from './component'

/**
 * Rule converter function type
 */
export type RuleConverter = (
  node: any,
  computed: Record<string, any>,
  context: any
) => any[]

/**
 * Theme config
 */
export interface ThemeConfig {
  /**
   * Component size
   */
  size?: 'large' | 'default' | 'small'

  /**
   * Custom class prefix
   */
  classPrefix?: string

  /**
   * Custom CSS variables
   */
  cssVariables?: Record<string, string>
}

/**
 * Component preset
 */
export interface ComponentPreset {
  /**
   * Preset name
   */
  name: string

  /**
   * Component definitions
   */
  components: ComponentDefinition[]

  /**
   * FormItem wrapper component
   */
  formItem?: any

  /**
   * Rule converter (optional)
   */
  ruleConverter?: RuleConverter

  /**
   * Theme config
   */
  theme?: ThemeConfig

  /**
   * Setup function
   */
  setup?: () => void | Promise<void>
}
