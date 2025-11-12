<template>
  <el-select
    :value="value"
    @change="handleChange"
    @input="handleInput"
    :disabled="disabled"
    :size="size"
    :clearable="clearable"
    :multiple="multiple"
    :placeholder="placeholder"
    :filterable="filterable"
    :allow-create="allowCreate"
    :default-first-option="defaultFirstOption"
    :collapse-tags="collapseTags"
    v-bind="$attrs"
  >
    <el-option
      v-for="option in options"
      :key="option.value"
      :label="option.label"
      :value="option.value"
      :disabled="option.disabled"
    />
  </el-select>
</template>

<script>
/**
 * 下拉选择框组件
 */
export default {
  name: 'WidgetSelect',

  props: {
    value: {
      type: [String, Number, Array, Boolean],
      default: ''
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
    multiple: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: '请选择'
    },
    filterable: {
      type: Boolean,
      default: true
    },
    allowCreate: {
      type: Boolean,
      default: false
    },
    defaultFirstOption: {
      type: Boolean,
      default: false
    },
    collapseTags: {
      type: Boolean,
      default: false
    },
    options: {
      type: Array,
      default: () => []
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

    handleInput(value) {
      if (this.onInput) {
        this.onInput(value)
      }
      this.$emit('change', value)
    }

    // handleBlur(event) {
    //   if (this.onBlur) {
    //     this.onBlur(event)
    //   }
    //   this.$emit('blur', event)
    // },

    // handleFocus(event) {
    //   if (this.onFocus) {
    //     this.onFocus(event)
    //   }
    //   this.$emit('focus', event)
    // }
  }
}
</script>
