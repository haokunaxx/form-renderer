<template>
  <el-rate
    :value="value"
    @change="handleChange"
    :disabled="disabled"
    :max="max"
    :allow-half="allowHalf"
    :low-threshold="lowThreshold"
    :high-threshold="highThreshold"
    :colors="colors"
    :void-color="voidColor"
    :disabled-void-color="disabledVoidColor"
    :icon-classes="iconClasses"
    :void-icon-class="voidIconClass"
    :disabled-void-icon-class="disabledVoidIconClass"
    :show-text="showText"
    :show-score="showScore"
    :text-color="textColor"
    v-bind="$attrs"
  />
</template>

<script>
/**
 * 评分组件
 */
export default {
  name: 'WidgetRate',

  props: {
    value: {
      type: Number,
      default: 0
    },
    disabled: {
      type: Boolean,
      default: false
    },
    max: {
      type: Number,
      default: 5
    },
    allowHalf: {
      type: Boolean,
      default: false
    },
    lowThreshold: {
      type: Number,
      default: 2
    },
    highThreshold: {
      type: Number,
      default: 4
    },
    colors: {
      type: Array,
      default: () => ['#F7BA2A', '#F7BA2A', '#F7BA2A']
    },
    voidColor: {
      type: String,
      default: '#C6D1DE'
    },
    disabledVoidColor: {
      type: String,
      default: '#EFF2F7'
    },
    iconClasses: {
      type: Array,
      default: () => ['el-icon-star-on', 'el-icon-star-on', 'el-icon-star-on']
    },
    voidIconClass: {
      type: String,
      default: 'el-icon-star-off'
    },
    disabledVoidIconClass: {
      type: String,
      default: 'el-icon-star-on'
    },
    showText: {
      type: Boolean,
      default: false
    },
    showScore: {
      type: Boolean,
      default: false
    },
    textColor: {
      type: String,
      default: '#1F2D3D'
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
