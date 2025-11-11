# AdapterVue2 Project Structure

```
packages/AdapterVue2/
├── src/
│   ├── core/                    # Core modules
│   │   ├── ReactiveEngine.js    # Vue 2 reactive engine
│   │   ├── ComponentRegistry.js # Component registry
│   │   ├── EventHandler.js      # Event handling
│   │   ├── UpdateScheduler.js   # Batch updates
│   │   └── index.js
│   ├── components/              # Vue components
│   │   ├── FormAdapter.vue      # Main form component
│   │   ├── SchemaRenderer.vue   # Schema renderer
│   │   ├── containers/          # Container components
│   │   │   ├── FormContainer.vue
│   │   │   ├── LayoutContainer.vue
│   │   │   └── ListContainer.vue
│   │   ├── wrappers/            # Field wrappers
│   │   │   └── FieldWrapper.vue
│   │   └── index.js
│   ├── utils/                   # Utility functions
│   │   ├── reactive.js          # Vue 2 reactivity utils
│   │   ├── component.js         # Component utils
│   │   └── index.js
│   └── index.js                 # Main entry
├── docs/                        # Documentation
├── package.json
├── vue.config.js               # Vue CLI config
├── babel.config.js             # Babel config
└── .eslintrc.js                # ESLint config
```

## Key Files

- **src/core/ReactiveEngine.js**: Bridges FormEngine with Vue 2's reactivity system
- **src/components/FormAdapter.vue**: Main form rendering component
- **src/components/SchemaRenderer.vue**: Recursively renders schema nodes
- **src/core/ComponentRegistry.js**: Manages component definitions
- **src/core/EventHandler.js**: Handles form events with optional batching

## Design Principles

1. **Vue 2 Options API**: All components use Options API for compatibility
2. **Immutable Updates**: Leverages Engine's structural sharing
3. **Shared Utilities**: Uses @form-renderer/share for common functionality
4. **No Composables**: Unlike Vue 3 version, provides component-based API only

