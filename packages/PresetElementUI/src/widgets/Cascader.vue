<template>
  <el-cascader
    :value="value"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
    :options="options"
    :disabled="disabled"
    :size="size"
    :clearable="clearable"
    :show-all-levels="showAllLevels"
    :collapse-tags="collapseTags"
    :separator="separator"
    :filterable="filterable"
    :placeholder="placeholder"
    v-bind="$attrs"
  />
</template>

<script>
/**
 * 级联选择器组件
 */
export default {
  name: 'WidgetCascader',

  props: {
    value: {
      type: Array,
      default: () => []
    },
    options: {
      type: Array,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['large', 'medium', 'small', 'mini'].includes(value)
    },
    clearable: {
      type: Boolean,
      default: true
    },
    showAllLevels: {
      type: Boolean,
      default: true
    },
    collapseTags: {
      type: Boolean,
      default: false
    },
    separator: {
      type: String,
      default: '/'
    },
    filterable: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: '请选择'
    },
    onChange: {
      type: Function,
      default: undefined
    },
    onBlur: {
      type: Function,
      default: undefined
    },
    onFocus: {
      type: Function,
      default: undefined
    }
  },

  methods: {
    handleChange(value) {
      if (this.onChange) {
        this.onChange(value)
      }
      this.$emit('change', value)
    },

    handleBlur(event) {
      if (this.onBlur) {
        this.onBlur(event)
      }
      this.$emit('blur', event)
    },

    handleFocus(event) {
      if (this.onFocus) {
        this.onFocus(event)
      }
      this.$emit('focus', event)
    }
  }
}
</script>
