/**
 * Reactive utilities
 *
 * Note: Engine already implements structural sharing for immutable updates.
 * These utilities are mainly for adapter-level optimizations.
 */

export { shallowEqual, isSameReference } from './shallow-equal'
