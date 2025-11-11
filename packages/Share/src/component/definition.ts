/**
 * Component definition helpers
 *
 * Helper functions for creating component definitions
 */

import type {
  ComponentDefinition,
  ValueTransformer,
  EventMapping
} from '../types'

/**
 * Define field component options
 */
export interface DefineFieldOptions {
  name: string
  component: any
  defaultProps?: Record<string, any>
  valueTransformer?: ValueTransformer
  eventMapping?: EventMapping
  needFormItem?: boolean
}

/**
 * Define a field component
 *
 * @param options - Field component options
 * @returns Component definition
 */
export function defineFieldComponent(
  options: DefineFieldOptions
): ComponentDefinition {
  return {
    type: 'field',
    needFormItem: true,
    ...options
  }
}

/**
 * Define a layout component
 *
 * @param name - Component name
 * @param component - Vue component
 * @param defaultProps - Default props
 * @returns Component definition
 */
export function defineLayoutComponent(
  name: string,
  component: any,
  defaultProps?: Record<string, any>
): ComponentDefinition {
  return {
    name,
    component,
    type: 'layout',
    needFormItem: false,
    defaultProps
  }
}

/**
 * Define a list component
 *
 * @param name - Component name
 * @param component - Vue component
 * @param defaultProps - Default props
 * @returns Component definition
 */
export function defineListComponent(
  name: string,
  component: any,
  defaultProps?: Record<string, any>
): ComponentDefinition {
  return {
    name,
    component,
    type: 'list',
    needFormItem: false,
    defaultProps
  }
}

/**
 * Define a form component
 *
 * @param name - Component name
 * @param component - Vue component
 * @param defaultProps - Default props
 * @returns Component definition
 */
export function defineFormComponent(
  name: string,
  component: any,
  defaultProps?: Record<string, any>
): ComponentDefinition {
  return {
    name,
    component,
    type: 'form',
    needFormItem: false,
    defaultProps
  }
}

/**
 * Merge component definition with partial updates
 *
 * @param base - Base component definition
 * @param updates - Partial updates
 * @returns Merged component definition
 */
export function mergeComponentDefinition(
  base: ComponentDefinition,
  updates: Partial<ComponentDefinition>
): ComponentDefinition {
  return {
    ...base,
    ...updates,
    defaultProps: {
      ...base.defaultProps,
      ...updates.defaultProps
    }
  }
}
