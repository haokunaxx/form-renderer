# @form-renderer/adapter-vue2

Vue 2.6 adapter for FormEngine using Options API.

## Features

- **Vue 2.6 Compatibility**: Built for Vue 2.6 using Options API
- **Immutable Updates**: Leverages Engine's structural sharing for optimal performance
- **Component Registry**: Flexible component registration system
- **Event Handling**: Unified event handling with optional batch processing
- **UI Framework Integration**: Easy integration with Element UI and other Vue 2 UI frameworks
- **Shared Utilities**: Uses @form-renderer/share for common functionality

## Installation

```bash
npm install @form-renderer/adapter-vue2 @form-renderer/engine vue
```

## Quick Start

```vue
<template>
  <FormAdapter
    :schema="schema"
    :model.sync="formData"
    :components="components"
    @submit="handleSubmit"
  />
</template>

<script>
import FormAdapter from '@form-renderer/adapter-vue2'

export default {
  name: 'MyForm',
  components: {
    FormAdapter
  },
  data() {
    return {
      formData: {
        name: '',
        age: null
      },
      schema: {
        type: 'form',
        properties: {
          name: {
            type: 'field',
            component: 'Input',
            required: true,
            formItemProps: {
              label: '姓名'
            }
          },
          age: {
            type: 'field',
            component: 'InputNumber',
            required: true,
            formItemProps: {
              label: '年龄'
            }
          }
        }
      },
      components: [] // Your component definitions
    }
  },
  methods: {
    handleSubmit(data) {
      console.log('提交数据:', data)
    }
  }
}
</script>
```

## Documentation

- [API Documentation](./docs/API.md)
- [Project Structure](./docs/PROJECT_STRUCTURE.md)
- [Vue 2 Guide](./docs/VUE2_GUIDE.md)

## Differences from AdapterVue3

- Uses Vue 2.6 Options API instead of Composition API
- Uses `Vue.observable` for reactivity instead of `ref`/`shallowRef`
- No composables (useFormAdapter, useFieldComponent)
- Uses `.sync` modifier instead of `v-model:model`
- Built with vue-cli instead of Vite

## License

MIT

