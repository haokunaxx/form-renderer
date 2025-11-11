<template>
  <el-upload
    :model-value="value"
    @update:model-value="handleChange"
    :action="action"
    :headers="headers"
    :method="method"
    :data="data"
    :name="name"
    :with-credentials="withCredentials"
    :multiple="multiple"
    :accept="accept"
    :disabled="disabled"
    :limit="limit"
    :drag="drag"
    :file-list="fileList"
    :list-type="listType"
    :auto-upload="autoUpload"
    :show-file-list="showFileList"
    :on-preview="handlePreview"
    :on-remove="handleRemove"
    :on-success="handleSuccess"
    :on-error="handleError"
    :on-progress="handleProgress"
    :on-change="handleFileChange"
    :on-exceed="handleExceed"
    :before-upload="beforeUpload"
    :before-remove="beforeRemove"
    v-bind="$attrs"
  >
    <template v-if="listType === 'picture-card'">
      <el-icon><Plus /></el-icon>
    </template>
    <template v-else-if="drag">
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        {{ dragText || '将文件拖到此处，或<em>点击上传</em>' }}
      </div>
      <div v-if="tip" class="el-upload__tip">{{ tip }}</div>
    </template>
    <template v-else>
      <el-button type="primary" :size="size">
        {{ buttonText || '点击上传' }}
      </el-button>
      <div v-if="tip" class="el-upload__tip">{{ tip }}</div>
    </template>
  </el-upload>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElUpload, ElButton, ElIcon } from 'element-plus'
import { Plus, UploadFilled } from '@element-plus/icons-vue'
import type { FieldComponentProps } from '../types'
import type {
  UploadFile,
  UploadUserFile,
  UploadProgressEvent,
  UploadRawFile
} from 'element-plus'

export interface UploadProps extends FieldComponentProps {
  action?: string
  headers?: Record<string, any>
  method?: 'post' | 'put' | 'patch'
  data?: Record<string, any>
  name?: string
  withCredentials?: boolean
  multiple?: boolean
  accept?: string
  size?: 'large' | 'default' | 'small'
  limit?: number
  drag?: boolean
  listType?: 'text' | 'picture' | 'picture-card'
  autoUpload?: boolean
  showFileList?: boolean
  buttonText?: string
  dragText?: string
  tip?: string
  onPreview?: (file: UploadFile) => void
  onRemove?: (file: UploadFile, fileList: UploadUserFile[]) => void
  onSuccess?: (
    response: any,
    file: UploadFile,
    fileList: UploadUserFile[]
  ) => void
  onError?: (error: Error, file: UploadFile, fileList: UploadUserFile[]) => void
  onProgress?: (
    event: UploadProgressEvent,
    file: UploadFile,
    fileList: UploadUserFile[]
  ) => void
  onExceed?: (files: File[], uploadFiles: UploadUserFile[]) => void
  beforeUpload?: (rawFile: UploadRawFile) => boolean | Promise<boolean>
  beforeRemove?: (
    uploadFile: UploadFile,
    uploadFiles: UploadUserFile[]
  ) => boolean | Promise<boolean>
}

const props = withDefaults(defineProps<UploadProps>(), {
  action: '',
  method: 'post',
  name: 'file',
  withCredentials: false,
  multiple: false,
  size: 'default',
  drag: false,
  listType: 'text',
  autoUpload: true,
  showFileList: true
})

const emit = defineEmits<{
  change: [value: any[]]
}>()

const fileList = ref<UploadUserFile[]>([])

// 初始化文件列表
watch(
  () => props.value,
  (newValue) => {
    if (Array.isArray(newValue)) {
      fileList.value = newValue.map((file: any) => {
        if (typeof file === 'string') {
          return {
            name: file.split('/').pop() || '',
            url: file,
            status: 'success',
            uid: Date.now() + Math.random()
          } as UploadUserFile
        }
        return file as UploadUserFile
      })
    }
  },
  { immediate: true }
)

const handleChange = (value: any[]) => {
  props.onChange?.(value)
  emit('change', value)
}

const handleFileChange = (_file: UploadFile, files: UploadUserFile[]) => {
  fileList.value = files
  handleChange(files)
}

const handlePreview = (file: UploadFile) => {
  props.onPreview?.(file)
}

const handleRemove = (file: UploadFile, files: UploadUserFile[]) => {
  fileList.value = files
  props.onRemove?.(file, files)
  handleChange(files)
}

const handleSuccess = (
  response: any,
  file: UploadFile,
  files: UploadUserFile[]
) => {
  props.onSuccess?.(response, file, files)
  handleChange(files)
}

const handleError = (
  error: Error,
  file: UploadFile,
  files: UploadUserFile[]
) => {
  props.onError?.(error, file, files)
}

const handleProgress = (
  event: UploadProgressEvent,
  file: UploadFile,
  files: UploadUserFile[]
) => {
  props.onProgress?.(event, file, files)
}

const handleExceed = (files: File[], uploadFiles: UploadUserFile[]) => {
  props.onExceed?.(files, uploadFiles)
}
</script>

<style scoped>
.el-upload__tip {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
}
</style>
