/**
 * Component normalizer
 *
 * Normalize component definitions to ensure consistency
 */

import type { ComponentDefinition, NormalizeOptions } from '../types'

/**
 * Normalize component definition
 *
 * @param definition - Component definition
 * @param options - Normalize options
 * @returns Normalized component definition
 */
export function normalizeComponent(
  definition: Partial<ComponentDefinition> &
    Pick<ComponentDefinition, 'name' | 'component'>,
  options?: NormalizeOptions
): ComponentDefinition {
  const {
    name,
    component,
    type = 'field',
    defaultProps = {},
    valueTransformer,
    eventMapping,
    needFormItem = true,
    customRender
  } = definition

  // Validate required fields
  if (!name) {
    throw new Error('[normalizeComponent] Component name is required')
  }

  if (!component) {
    throw new Error(`[normalizeComponent] Component is required for "${name}"`)
  }

  // Merge with options
  const normalizedType = options?.type || type
  const normalizedDefaultProps = options?.defaultProps
    ? { ...defaultProps, ...options.defaultProps }
    : defaultProps

  // Create normalized definition
  const normalized: ComponentDefinition = {
    name,
    component,
    type: normalizedType,
    defaultProps: normalizedDefaultProps,
    needFormItem
  }

  // Optional fields
  if (valueTransformer) {
    normalized.valueTransformer = valueTransformer
  }

  if (eventMapping) {
    normalized.eventMapping = eventMapping
  }

  if (customRender) {
    normalized.customRender = customRender
  }

  return normalized
}

/**
 * Normalize multiple component definitions
 *
 * @param definitions - Array of component definitions
 * @param options - Normalize options
 * @returns Array of normalized component definitions
 */
export function normalizeComponents(
  definitions: Array<
    Partial<ComponentDefinition> &
      Pick<ComponentDefinition, 'name' | 'component'>
  >,
  options?: NormalizeOptions
): ComponentDefinition[] {
  return definitions.map((def) => normalizeComponent(def, options))
}
