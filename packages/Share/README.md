# @form-renderer/share

Shared utilities for form-renderer adapters.

## Installation

```bash
npm install @form-renderer/share
```

## Features

- **Reactive Utilities**: Shallow equality checking and reference comparison
- **Component Utilities**: Component normalization and definition helpers
- **Batch Processing**: Batcher and Scheduler for performance optimization
- **Performance Utilities**: Measure, debounce, throttle
- **Validation Helpers**: Common validators and rule converters
- **Common Utilities**: Type checking, object/array/string manipulation

## Usage

### Reactive Utilities

```typescript
import { shallowEqual, isSameReference } from '@form-renderer/share'

// Check shallow equality
const isEqual = shallowEqual(obj1, obj2)

// Check reference equality
const isSame = isSameReference(obj1, obj2)
```

### Component Utilities

```typescript
import {
  normalizeComponent,
  defineFieldComponent
} from '@form-renderer/share'

// Normalize component definition
const normalized = normalizeComponent({
  name: 'Input',
  component: MyInputComponent
})

// Define field component
const inputDef = defineFieldComponent({
  name: 'Input',
  component: MyInputComponent,
  needFormItem: true
})
```

### Batch Processing

```typescript
import { Batcher, Scheduler } from '@form-renderer/share'

// Create a batcher
const batcher = new Batcher((items) => {
  console.log('Processing batch:', items)
}, 16)

batcher.add({ value: 1 })
batcher.add({ value: 2 })
// Items will be batched and processed after 16ms

// Create a scheduler
const scheduler = new Scheduler()

scheduler.schedule(() => {
  console.log('Task executed on next animation frame')
})
```

### Performance Utilities

```typescript
import { measure, debounce, throttle } from '@form-renderer/share'

// Measure execution time
measure('myOperation', () => {
  // Your code here
})

// Debounce function
const debouncedFn = debounce(() => {
  console.log('Debounced!')
}, 300)

// Throttle function
const throttledFn = throttle(() => {
  console.log('Throttled!')
}, 1000)
```

### Validation Utilities

```typescript
import { required, email, composeValidators } from '@form-renderer/share'

// Single validator
const result = required(value, 'This field is required')

// Compose validators
const validateEmail = composeValidators(
  required,
  email
)

const result = validateEmail(value)
```

### Common Utilities

```typescript
import {
  isObject,
  get,
  set,
  pick,
  omit,
  deepClone,
  camelCase
} from '@form-renderer/share'

// Type checking
if (isObject(value)) {
  // ...
}

// Object manipulation
const value = get(obj, 'path.to.value', defaultValue)
const newObj = set(obj, 'path.to.value', newValue)

// String manipulation
const camel = camelCase('hello-world') // 'helloWorld'
```

## API Documentation

See the source code and TypeScript definitions for complete API documentation.

## License

MIT

