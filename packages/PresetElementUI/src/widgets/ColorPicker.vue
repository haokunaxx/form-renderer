<template>
  <el-color-picker
    :value="value"
    @change="handleChange"
    @active-change="handleActiveChange"
    :disabled="disabled"
    :size="size"
    :show-alpha="showAlpha"
    :color-format="colorFormat"
    :predefine="predefine"
    v-bind="$attrs"
  />
</template>

<script>
/**
 * 颜色选择器组件
 */
export default {
  name: 'WidgetColorPicker',

  props: {
    value: {
      type: String,
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
    showAlpha: {
      type: Boolean,
      default: false
    },
    colorFormat: {
      type: String,
      default: 'hex',
      validator: (value) => ['hsl', 'hsv', 'hex', 'rgb'].includes(value)
    },
    predefine: {
      type: Array,
      default: undefined
    },
    onChange: {
      type: Function,
      default: undefined
    },
    onActiveChange: {
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

    handleActiveChange(value) {
      if (this.onActiveChange) {
        this.onActiveChange(value)
      }
      this.$emit('active-change', value)
    }
  }
}
</script>
