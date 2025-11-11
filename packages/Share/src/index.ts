/**
 * @form-renderer/share
 *
 * Shared utilities for form-renderer adapters
 */

// Types
export type {
  ComponentType,
  ValueTransformer,
  EventMapping,
  ComponentDefinition,
  NormalizeOptions,
  RuleConverter,
  ThemeConfig,
  ComponentPreset
} from './types'

// Reactive utilities
export { shallowEqual, isSameReference } from './reactive'

// Component utilities
export {
  normalizeComponent,
  normalizeComponents,
  defineFieldComponent,
  defineLayoutComponent,
  defineListComponent,
  defineFormComponent,
  mergeComponentDefinition
} from './component'

export type { DefineFieldOptions } from './component'

// Batch processing
export { Batcher, createBatcher, Scheduler, createScheduler } from './batch'

// Performance utilities
export {
  measure,
  measureAsync,
  mark,
  measureBetween,
  debounce,
  throttle
} from './performance'

// Validation utilities
export type { ValidationResult } from './validation'

export {
  isEmpty as isEmptyValue,
  required,
  minLength,
  maxLength,
  pattern,
  email,
  url,
  range,
  composeValidators,
  resultToMessage,
  isValidationSuccess,
  convertValidationResult
} from './validation'

// Common utilities
export {
  isObject,
  isPlainObject,
  isArray,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isNull,
  isUndefined,
  isNil,
  isPromise,
  isDate,
  isRegExp,
  isEmpty,
  get,
  set,
  has,
  pick,
  omit,
  deepClone,
  merge,
  deepMerge,
  removeAt,
  insertAt,
  move,
  updateAt,
  chunk,
  unique,
  flatten,
  deepFlatten,
  capitalize,
  camelCase,
  pascalCase,
  kebabCase,
  snakeCase,
  truncate,
  padStart,
  padEnd,
  template
} from './common'

// Version
export const version = '1.0.0-alpha.0'
