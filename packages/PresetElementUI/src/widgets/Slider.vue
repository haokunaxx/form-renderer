<template>
  <el-slider
    :value="value"
    @change="handleChange"
    @input="handleInput"
    :disabled="disabled"
    :min="min"
    :max="max"
    :step="step"
    :show-input="showInput"
    :show-input-controls="showInputControls"
    :show-stops="showStops"
    :show-tooltip="showTooltip"
    :range="range"
    :vertical="vertical"
    :height="height"
    v-bind="$attrs"
  />
</template>

<script>
/**
 * 滑块组件
 */
export default {
  name: 'WidgetSlider',

  props: {
    value: {
      type: [Number, Array],
      default: 0
    },
    disabled: {
      type: Boolean,
      default: false
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    step: {
      type: Number,
      default: 1
    },
    showInput: {
      type: Boolean,
      default: false
    },
    showInputControls: {
      type: Boolean,
      default: true
    },
    showStops: {
      type: Boolean,
      default: false
    },
    showTooltip: {
      type: Boolean,
      default: true
    },
    range: {
      type: Boolean,
      default: false
    },
    vertical: {
      type: Boolean,
      default: false
    },
    height: {
      type: String,
      default: undefined
    },
    onChange: {
      type: Function,
      default: undefined
    },
    onInput: {
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
      this.$emit('input', value)
    }
  }
}
</script>
