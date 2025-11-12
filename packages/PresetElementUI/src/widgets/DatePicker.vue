<template>
  <el-date-picker
    :value="value"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
    :type="type"
    :disabled="disabled"
    :size="size"
    :clearable="clearable"
    :placeholder="placeholder"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :format="format"
    :value-format="valueFormat"
    :readonly="readonly"
    :editable="editable"
    v-bind="$attrs"
  />
</template>

<script>
/**
 * 日期选择器组件
 */
export default {
  name: 'WidgetDatePicker',

  props: {
    value: {
      type: [String, Date, Array],
      default: null
    },
    type: {
      type: String,
      default: 'date',
      validator: (value) =>
        [
          'year',
          'month',
          'date',
          'dates',
          'week',
          'datetime',
          'datetimerange',
          'daterange',
          'monthrange'
        ].includes(value)
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
      default: '请选择日期'
    },
    startPlaceholder: {
      type: String,
      default: '开始日期'
    },
    endPlaceholder: {
      type: String,
      default: '结束日期'
    },
    format: {
      type: String,
      default: 'yyyy-MM-dd'
    },
    valueFormat: {
      type: String,
      default: 'yyyy-MM-dd'
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
