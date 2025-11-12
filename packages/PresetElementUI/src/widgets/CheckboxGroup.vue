<template>
  <el-checkbox-group
    :value="value"
    @change="handleChange"
    :disabled="disabled"
    :size="size"
    :min="min"
    :max="max"
    v-bind="$attrs"
  >
    <el-checkbox
      v-for="option in options"
      :key="option.value"
      :label="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </el-checkbox>
  </el-checkbox-group>
</template>

<script>
/**
 * 多选框组组件
 */
export default {
  name: 'WidgetCheckboxGroup',

  props: {
    value: {
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
    min: {
      type: Number,
      default: undefined
    },
    max: {
      type: Number,
      default: undefined
    },
    options: {
      type: Array,
      default: () => []
    },
    onChange: {
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
    }
  }
}
</script>
