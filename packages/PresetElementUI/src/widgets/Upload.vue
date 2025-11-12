<template>
  <el-upload
    :file-list="fileList"
    :action="action"
    :headers="headers"
    :data="data"
    :name="name"
    :with-credentials="withCredentials"
    :multiple="multiple"
    :accept="accept"
    :list-type="listType"
    :auto-upload="autoUpload"
    :disabled="disabled"
    :limit="limit"
    @change="handleChange"
    @preview="handlePreview"
    @remove="handleRemove"
    @success="handleSuccess"
    @error="handleError"
    @progress="handleProgress"
    @exceed="handleExceed"
    v-bind="$attrs"
  >
    <el-button v-if="listType === 'text'" size="small" type="primary">
      点击上传
    </el-button>
    <i v-else-if="listType === 'picture-card'" class="el-icon-plus" />
    <div v-if="tip" slot="tip" class="el-upload__tip">
      {{ tip }}
    </div>
  </el-upload>
</template>

<script>
/**
 * 文件上传组件
 */
export default {
  name: 'WidgetUpload',

  props: {
    value: {
      type: Array,
      default: () => []
    },
    action: {
      type: String,
      required: true
    },
    headers: {
      type: Object,
      default: () => ({})
    },
    data: {
      type: Object,
      default: () => ({})
    },
    name: {
      type: String,
      default: 'file'
    },
    withCredentials: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: false
    },
    accept: {
      type: String,
      default: undefined
    },
    listType: {
      type: String,
      default: 'text',
      validator: (value) => ['text', 'picture', 'picture-card'].includes(value)
    },
    autoUpload: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    limit: {
      type: Number,
      default: undefined
    },
    tip: {
      type: String,
      default: undefined
    },
    onChange: {
      type: Function,
      default: undefined
    },
    onPreview: {
      type: Function,
      default: undefined
    },
    onRemove: {
      type: Function,
      default: undefined
    },
    onSuccess: {
      type: Function,
      default: undefined
    },
    onError: {
      type: Function,
      default: undefined
    },
    onProgress: {
      type: Function,
      default: undefined
    },
    onExceed: {
      type: Function,
      default: undefined
    }
  },

  computed: {
    fileList() {
      return this.value || []
    }
  },

  methods: {
    handleChange(file, fileList) {
      const value = fileList
      if (this.onChange) {
        this.onChange(value)
      }
      this.$emit('change', value)
    },

    handlePreview(file) {
      if (this.onPreview) {
        this.onPreview(file)
      }
      this.$emit('preview', file)
    },

    handleRemove(file, fileList) {
      const value = fileList
      if (this.onRemove) {
        this.onRemove(value)
      }
      this.$emit('remove', value)
      this.$emit('change', value)
    },

    handleSuccess(response, file, fileList) {
      if (this.onSuccess) {
        this.onSuccess(response, file, fileList)
      }
      this.$emit('success', response, file, fileList)
    },

    handleError(err, file, fileList) {
      if (this.onError) {
        this.onError(err, file, fileList)
      }
      this.$emit('error', err, file, fileList)
    },

    handleProgress(event, file, fileList) {
      if (this.onProgress) {
        this.onProgress(event, file, fileList)
      }
      this.$emit('progress', event, file, fileList)
    },

    handleExceed(files, fileList) {
      if (this.onExceed) {
        this.onExceed(files, fileList)
      }
      this.$emit('exceed', files, fileList)
    }
  }
}
</script>
