# Vue 2 Usage Guide

## Key Differences from Vue 3

### 1. Model Binding

**Vue 2:**
```vue
<FormAdapter
  :schema="schema"
  :model.sync="formData"
/>
```

**Vue 3:**
```vue
<FormAdapter
  :schema="schema"
  v-model:model="formData"
/>
```

### 2. Component API

**Vue 2 (Options API):**
```javascript
export default {
  name: 'MyForm',
  data() {
    return {
      formData: {}
    }
  },
  methods: {
    handleSubmit(data) {
      // ...
    }
  }
}
```

**Vue 3 (Composition API):**
```javascript
import { ref } from 'vue'

const formData = ref({})
const handleSubmit = (data) => {
  // ...
}
```

### 3. Reactivity

Vue 2 uses `Vue.observable` instead of `ref`/`shallowRef`:

```javascript
// Internal implementation
this.state = Vue.observable({
  renderSchema: this.engine.getRenderSchema(),
  model: this.engine.getValue()
})
```

### 4. No Composables

AdapterVue2 does not provide composable functions like `useFormAdapter`. Use component refs instead:

```vue
<template>
  <FormAdapter ref="formRef" />
</template>

<script>
export default {
  methods: {
    async validate() {
      await this.$refs.formRef.validate()
    }
  }
}
</script>
```

## Browser Support

Vue 2.6 supports:
- IE 11+ (with polyfills)
- Modern browsers (Chrome, Firefox, Safari, Edge)

## Migration to Vue 3

When migrating from AdapterVue2 to AdapterVue3:
1. Update `.sync` to `v-model:model`
2. Consider using Composition API
3. Use composables instead of component refs
4. Update build tooling (vue-cli → Vite)

