# AdapterVue2 API Documentation

## Components

### FormAdapter

Main component for rendering forms.

**Props:**
- `schema` (Object, required): Form schema
- `model` (Object): Form data model
- `components` (Array|Object): Component definitions or preset
- `options` (Object): Configuration options

**Events:**
- `update:model`: Emitted when model updates
- `change`: Emitted when field value changes
- `field-blur`: Emitted when field loses focus  
- `field-focus`: Emitted when field gains focus
- `list-change`: Emitted when list operations occur
- `validate`: Emitted after validation
- `submit`: Emitted on form submission
- `ready`: Emitted when adapter is initialized

**Methods:**
- `getValue(path?)`: Get value at path or entire model
- `updateValue(pathOrValues, value?)`: Update single or multiple values
- `validate(paths?)`: Validate form
- `submit()`: Submit form
- `reset(target?)`: Reset form
- `flush()`: Force immediate updates
- `getListOperator(path)`: Get list operator for path

## Core Classes

### ReactiveEngine

Integrates FormEngine with Vue 2 reactivity.

### ComponentRegistry

Manages component definitions.

### EventHandler

Handles user interaction events.

### UpdateScheduler

Optimizes batch updates.

See source code for detailed API.

