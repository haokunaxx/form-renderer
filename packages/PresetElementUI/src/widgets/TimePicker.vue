<template>
  <el-time-picker
    :value="value"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
    :disabled="disabled"
    :size="size"
    :clearable="clearable"
    :placeholder="placeholder"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :is-range="isRange"
    :format="format"
    :value-format="valueFormat"
    :readonly="readonly"
    :editable="editable"
    v-bind="$attrs"
  />
</template>

<script>
/**
 * 时间选择器组件
 */
export default {
  name: 'WidgetTimePicker',

  props: {
    value: {
      type: [String, Date, Array],
      default: null
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
    placeholder: {
      type: String,
      default: '请选择时间'
    },
    startPlaceholder: {
      type: String,
      default: '开始时间'
    },
    endPlaceholder: {
      type: String,
      default: '结束时间'
    },
    isRange: {
      type: Boolean,
      default: false
    },
    format: {
      type: String,
      default: 'HH:mm:ss'
    },
    valueFormat: {
      type: String,
      default: 'HH:mm:ss'
    },
    readonly: {
      type: Boolean,
      default: false
    },
    editable: {
      type: Boolean,
      default: true
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
