<template>
  <el-switch
    :value="value"
    @change="handleChange"
    :disabled="disabled"
    :width="width"
    :active-icon-class="activeIconClass"
    :inactive-icon-class="inactiveIconClass"
    :active-text="activeText"
    :inactive-text="inactiveText"
    :active-value="activeValue"
    :inactive-value="inactiveValue"
    :active-color="activeColor"
    :inactive-color="inactiveColor"
    v-bind="$attrs"
  />
</template>

<script>
/**
 * 开关组件
 */
export default {
  name: 'WidgetSwitch',

  props: {
    value: {
      type: [Boolean, String, Number],
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    width: {
      type: Number,
      default: 40
    },
    activeIconClass: {
      type: String,
      default: undefined
    },
    inactiveIconClass: {
      type: String,
      default: undefined
    },
    activeText: {
      type: String,
      default: undefined
    },
    inactiveText: {
      type: String,
      default: undefined
    },
    activeValue: {
      type: [Boolean, String, Number],
      default: true
    },
    inactiveValue: {
      type: [Boolean, String, Number],
      default: false
    },
    activeColor: {
      type: String,
      default: '#409EFF'
    },
    inactiveColor: {
      type: String,
      default: '#C0CCDA'
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
