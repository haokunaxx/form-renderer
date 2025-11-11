/**
 * @form-renderer/adapter-vue2
 *
 * Vue 2.6 adapter for FormEngine using Options API
 */

// Export components
export { FormAdapter, SchemaRenderer } from './components'

// Export core modules
export {
  ReactiveEngine,
  createReactiveEngine,
  ComponentRegistry,
  createComponentRegistry,
  EventHandler,
  createEventHandler,
  UpdateScheduler,
  createUpdateScheduler
} from './core'

// Export utils
export * from './utils'

// Version
export const version = '1.0.0-alpha.0'

// Default export
import FormAdapter from './components/FormAdapter.vue'
export default FormAdapter
